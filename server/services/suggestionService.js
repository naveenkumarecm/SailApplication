const Fuse = require('fuse.js');
const axios = require('axios');

const knownLocations = [
  'Rome', 'Athens', 'Cairo', 'Jerusalem', 'Istanbul', 'Machu Picchu', 'Petra',
  'Angkor Wat', 'Taj Mahal', 'Great Wall of China', 'Colosseum', 'Stonehenge',
  'Pyramids of Giza', 'Parthenon', 'Pompeii', 'Chichen Itza', 'Easter Island',
  'Teotihuacan', 'Babylon', 'Troy', 'Carthage', 'Alexandria', 'Constantinople',
  'Kyoto', 'Varanasi', 'Cusco', 'Timbuktu', 'Great Zimbabwe', 'Persepolis',
  'Mohenjo-daro', 'Hampi', 'Tikal', 'Mesa Verde', 'Luxor', 'Thebes',
  'Ephesus', 'Delphi', 'Olympia', 'Mycenae', 'Knossos', 'Palmyra',
  'Samarkand', 'Lhasa', 'Bagan', 'Borobudur', 'Ayutthaya', 'Sukhothai',
  'Forbidden City', 'Versailles', 'Alhambra', 'Hagia Sophia', 'Notre Dame',
  'Acropolis', 'Forum Romanum', 'Cappadocia', 'Santorini', 'Bruges',
  'Dubrovnik', 'Prague', 'Venice', 'Florence', 'Barcelona', 'Edinburgh',
  'Oxford', 'Cambridge', 'Jaipur', 'Agra', 'Delhi', 'Mumbai', 'Kolkata',
  'Beijing', 'Shanghai', 'Tokyo', 'Osaka', 'Seoul', 'Bangkok', 'Hanoi',
  'Havana', 'Mexico City', 'Lima', 'Buenos Aires', 'Rio de Janeiro',
  'Marrakech', 'Fez', 'Zanzibar', 'Nairobi', 'Cape Town', 'Lalibela',
  'Aksum', 'Memphis', 'Karnak', 'Abu Simbel', 'Valley of the Kings',
  'Medina', 'Mecca', 'Damascus', 'Aleppo', 'Baghdad', 'Isfahan',
  'Saqqara', 'Göbekli Tepe', 'Çatalhöyük', 'Ur', 'Nineveh',
  'Xian', 'Dunhuang', 'Luoyang', 'Nara', 'Kamakura',
  'Vijayanagara', 'Thanjavur', 'Madurai', 'Ellora', 'Ajanta',
  'Khajuraho', 'Konark', 'Puri', 'Bodh Gaya', 'Sarnath',
  'London', 'Paris', 'Berlin', 'Vienna', 'Moscow', 'St Petersburg',
  'New York', 'Washington DC', 'Philadelphia', 'Boston', 'New Orleans',
  'San Francisco', 'Los Angeles', 'Chicago', 'Jamestown', 'Plymouth',
  'Gettysburg', 'Pearl Harbor', 'Hiroshima', 'Nagasaki', 'Normandy',
  'Mithila', 'Mithila Kingdom', 'Janakpur', 'Ayodhya', 'Lanka', 'Dwarka',
  'Hastinapur', 'Indraprastha', 'Mathura', 'Vrindavan', 'Ujjain',
  'Pataliputra', 'Takshashila', 'Nalanda', 'Vikramashila', 'Magadha',
  'Kosala', 'Gandhara', 'Kashi', 'Prayagraj', 'Haridwar', 'Rishikesh',
  'Nepal', 'Tibet', 'Sri Lanka', 'Myanmar', 'Cambodia',
  'Vijayanagar Empire', 'Chola Kingdom', 'Pandya Kingdom', 'Maurya Empire',
  'Gupta Empire', 'Mughal Empire', 'Ottoman Empire', 'Roman Empire',
  'Byzantine Empire', 'Persian Empire', 'Greek Empire', 'Egyptian Kingdom',
];

const fuse = new Fuse(knownLocations, {
  threshold: 0.5,
  distance: 300,
  includeScore: true,
  ignoreLocation: true,
});

/**
 * Get suggestions using multiple strategies:
 * 1. Fuzzy match full query
 * 2. Fuzzy match individual words from query
 * 3. Wikipedia opensearch API
 */
async function getSuggestions(query) {
  const normalizedQuery = query.toLowerCase().trim();

  // Strategy 1: Fuzzy match the full query
  const fullResults = fuse.search(normalizedQuery).slice(0, 4);

  // Strategy 2: Fuzzy match each word individually (for multi-word typos)
  const words = normalizedQuery.split(/\s+/).filter(w => w.length >= 3);
  let wordResults = [];
  for (const word of words) {
    const matches = fuse.search(word).slice(0, 3);
    wordResults.push(...matches);
  }

  // Strategy 3: Wikipedia opensearch (runs in parallel)
  let wikiSuggestions = [];
  try {
    const response = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: { action: 'opensearch', search: query, limit: 5, namespace: 0, format: 'json' },
      timeout: 5000,
    });
    if (response.data && response.data[1]) {
      wikiSuggestions = response.data[1].map(name => ({ name, score: 0.5, source: 'wikipedia' }));
    }
  } catch {}

  // Also try individual words on Wikipedia
  if (wikiSuggestions.length === 0 && words.length > 1) {
    for (const word of words) {
      try {
        const response = await axios.get('https://en.wikipedia.org/w/api.php', {
          params: { action: 'opensearch', search: word, limit: 3, namespace: 0, format: 'json' },
          timeout: 4000,
        });
        if (response.data && response.data[1]) {
          wikiSuggestions.push(...response.data[1].map(name => ({ name, score: 0.6, source: 'wikipedia' })));
        }
      } catch {}
    }
  }

  // Combine all results
  const localSuggestions = [...fullResults, ...wordResults]
    .sort((a, b) => a.score - b.score)
    .map(r => ({ name: r.item, score: r.score, source: 'known' }));

  const allSuggestions = [...localSuggestions, ...wikiSuggestions];

  // Deduplicate
  const seen = new Set();
  const unique = [];
  for (const s of allSuggestions) {
    const key = s.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(s);
    }
  }

  return unique.slice(0, 8);
}

module.exports = { getSuggestions };
