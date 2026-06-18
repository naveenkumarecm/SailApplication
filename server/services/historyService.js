const wiki = require('wikipedia');
const axios = require('axios');

/**
 * Main entry: Find history of a location using intelligent multi-source search.
 * Priority: Wikipedia (English) → Wikipedia (Indian languages) → Web search for context.
 * Web search results are only used to BUILD a proper history response, not shown raw.
 */
async function getLocationHistory(query) {
  const normalizedQuery = query.trim();

  // Step 1: Try Wikipedia with intelligent variations
  const wikiData = await intelligentWikiSearch(normalizedQuery);

  if (wikiData) {
    // Found on Wikipedia — supplement with images and books in parallel
    const [images, books] = await Promise.allSettled([
      withTimeout(fetchWikimediaImages(wikiData.title), 7000),
      withTimeout(fetchOpenLibraryReferences(normalizedQuery), 7000),
    ]);
    return buildWikiResponse(normalizedQuery, wikiData,
      images.status === 'fulfilled' ? images.value : [],
      books.status === 'fulfilled' ? books.value : [],
    );
  }

  // Step 2: Wikipedia failed — use web search to find info, then compose a proper history response
  const webInfo = await fetchAndComposeHistory(normalizedQuery);

  if (webInfo) {
    const [images] = await Promise.allSettled([
      withTimeout(fetchWikimediaImages(normalizedQuery), 7000),
    ]);
    return buildWebResponse(normalizedQuery, webInfo, images.status === 'fulfilled' ? images.value : []);
  }

  return { found: false, query: normalizedQuery, message: `Could not find history for "${normalizedQuery}".`, sections: [], images: [], books: [], mythology: [], legends: [], webSources: [] };
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

// =============================================================================
// WIKIPEDIA SEARCH
// =============================================================================

async function intelligentWikiSearch(query) {
  const variations = buildSearchVariations(query);

  for (const searchTerm of variations) {
    try {
      const searchResults = await wiki.search(searchTerm);
      if (!searchResults.results || searchResults.results.length === 0) continue;

      const bestMatch = findBestMatch(searchResults.results, query);
      if (!bestMatch) continue;

      const page = await wiki.page(bestMatch.title);
      const [summary, content, coordinates, categories] = await Promise.allSettled([
        page.summary(), page.content(), page.coordinates(), page.categories(),
      ]);

      const sum = summary.status === 'fulfilled' ? summary.value : {};
      const cats = categories.status === 'fulfilled' ? categories.value : [];

      if (isDefinitelyNotAPlace(sum, cats)) continue;
      if (!isResultRelevantToQuery(sum, query)) continue;

      return {
        title: sum.title || bestMatch.title,
        description: sum.description || '',
        extract: sum.extract || '',
        thumbnail: sum.thumbnail ? sum.thumbnail.source : null,
        originalImage: sum.originalimage ? sum.originalimage.source : null,
        content: content.status === 'fulfilled' && typeof content.value === 'string' ? content.value : '',
        coordinates: coordinates.status === 'fulfilled' ? coordinates.value : null,
        url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(bestMatch.title)}`,
        categories: cats.slice(0, 10),
        relatedTopics: searchResults.results.slice(1, 10).map(r => r.title),
      };
    } catch { continue; }
  }
  return null;
}

function buildSearchVariations(query) {
  const variations = [];
  const words = query.split(/\s+/).filter(w => w.length > 0);
  const cleanWords = words.filter(w => !/^(in|at|near|of|the|district|state)$/i.test(w));
  const cleanQuery = cleanWords.join(' ');

  if (cleanWords.length >= 2) variations.push(cleanWords.join(''));
  variations.push(query);
  if (cleanQuery !== query) variations.push(cleanQuery);

  // Spelling variations
  const spellingVars = generateSpellingVariations(cleanQuery);
  for (const sv of spellingVars) {
    variations.push(sv);
    const svWords = sv.split(/\s+/);
    if (svWords.length >= 2) variations.push(svWords.join(''));
  }

  // India context
  variations.push(`${cleanQuery} India`);
  variations.push(`${cleanQuery} temple`);
  variations.push(`${cleanQuery} Karnataka`);
  variations.push(`${cleanQuery} Andhra Pradesh`);

  const seen = new Set();
  return variations.filter(v => { const k = v.toLowerCase().trim(); if (!k || seen.has(k)) return false; seen.add(k); return true; }).slice(0, 12);
}

function generateSpellingVariations(query) {
  const variations = [];
  const q = query.toLowerCase();
  const swaps = [
    [/gh/g, 'g'], [/g(?!h)/g, 'gh'],
    [/th/g, 't'], [/t(?!h)/g, 'th'],
    [/dd/g, 'd'], [/(?<![d])d(?!d)/g, 'dd'],
    [/dh/g, 'd'], [/d(?!h)/g, 'dh'],
    [/sh/g, 's'], [/s(?!h)/g, 'sh'],
    [/ee/g, 'i'], [/oo/g, 'u'],
    [/v/g, 'w'], [/w/g, 'v'],
    [/siddh/g, 'sidd'], [/sidd(?!h)/g, 'siddh'],
    [/swaram/g, 'eswaram'], [/eswaram/g, 'swaram'],
  ];
  for (const [pattern, replacement] of swaps) {
    if (pattern.test(q)) {
      const variant = q.replace(pattern, replacement);
      if (variant !== q && !variations.includes(variant)) variations.push(variant);
    }
  }
  return variations.slice(0, 6);
}

function findBestMatch(results, query) {
  const queryLower = query.toLowerCase().replace(/\s+/g, '');
  const queryWords = query.toLowerCase().split(/\s+/);
  const movieIndicators = ['film', 'movie', 'tv series', 'album', 'song', 'band', 'novel', 'video game', 'anime', 'singer', 'actor', 'actress', 'cricketer', 'politician'];

  const scored = results.map(r => {
    const titleLower = r.title.toLowerCase();
    const titleNoSpace = titleLower.replace(/\s+/g, '');
    let score = 0;
    if (titleNoSpace === queryLower) score += 100;
    else if (titleLower.includes(query.toLowerCase())) score += 80;
    else { score += queryWords.filter(w => titleLower.includes(w)).length * 20; }
    if (movieIndicators.some(ind => titleLower.includes(ind))) score -= 200;
    if (titleLower.includes('disambiguation')) score -= 100;
    const placeInds = ['temple', 'district', 'village', 'city', 'town', 'cave', 'fort', 'hill', 'betta', 'kona', 'giri', 'puram', 'abad', 'pur'];
    if (placeInds.some(p => titleLower.includes(p))) score += 15;
    return { ...r, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0] && scored[0].score > -50 ? scored[0] : null;
}

function isDefinitelyNotAPlace(summary, categories) {
  const desc = (summary.description || '').toLowerCase();
  const title = (summary.title || '');
  if (/\(\d{4}\s*(film|movie)\)/i.test(title)) return true;
  const rejectDescs = ['film', 'movie', 'album', 'song', 'tv series', 'video game', 'indian politician', 'cricketer', 'actor', 'actress', 'singer', 'filmmaker', 'director', 'novelist', 'poet', 'musician', 'sportsperson', 'journalist'];
  for (const rd of rejectDescs) { if (desc.includes(rd)) return true; }
  const personCats = ['living people', 'births', 'deaths', 'indian films', 'bollywood'];
  for (const cat of categories) { if (personCats.some(pc => cat.toLowerCase().includes(pc))) return true; }
  return false;
}

function isResultRelevantToQuery(summary, query) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length >= 3 && !/^(in|at|near|of|the|and|for|temple|india|cave|ancient)$/i.test(w));
  if (queryWords.length === 0) return true;
  const combined = `${(summary.title || '')} ${(summary.description || '')} ${(summary.extract || '').substring(0, 800)}`.toLowerCase();

  if (queryWords.length >= 2) {
    const matchCount = queryWords.filter(w => {
      if (combined.includes(w)) return true;
      const fuzz = [w.replace(/g/g,'gh'), w.replace(/gh/g,'g'), w.replace(/t/g,'th'), w.replace(/th/g,'t'), w.replace(/d/g,'dh'), w.replace(/dh/g,'d'), w.replace(/s/g,'sh'), w.replace(/sh/g,'s')];
      return fuzz.some(f => combined.includes(f));
    }).length;
    return matchCount >= queryWords.length;
  }
  return combined.includes(queryWords[0]);
}

// =============================================================================
// WEB SEARCH & HISTORY COMPOSITION (replaces showing raw web results)
// =============================================================================

/**
 * Fetch web search results and COMPOSE a proper history response.
 * Does NOT show raw Instagram/YouTube links — extracts meaningful content.
 */
async function fetchAndComposeHistory(query) {
  const words = query.split(/\s+/).filter(w => w.length > 0 && !/^(in|at|near|of|the)$/i.test(w));
  const concatenated = words.join('');
  const spellingVars = generateSpellingVariations(query);
  const altQuery = spellingVars.length > 0 ? spellingVars[0] : query;
  const altConcat = altQuery.split(/\s+/).join('');

  // Search queries focused on getting HISTORY content (not social media)
  const searches = [
    `${concatenated} temple history significance India`,
    `${altConcat} temple history India`,
    `${query} ancient history significance`,
    `"${concatenated}" history legend`,
  ];

  let allSnippets = [];

  for (const searchQuery of searches) {
    if (allSnippets.length >= 5) break;
    try {
      const response = await axios.post('https://lite.duckduckgo.com/lite/',
        `q=${encodeURIComponent(searchQuery)}`,
        { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const html = response.data || '';
      const links = [...html.matchAll(/href="([^"]+)"\s*class='result-link'>(.*?)<\/a>/gs)];
      const snippets = [...html.matchAll(/class='result-snippet'>(.*?)<\/td>/gs)];

      for (let i = 0; i < Math.min(links.length, 8); i++) {
        const url = (links[i][1] || '').toLowerCase();
        const title = (links[i][2] || '').replace(/<[^>]+>/g, '').trim();
        const snippet = snippets[i] ? snippets[i][1].replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim() : '';

        // FILTER: Skip social media, videos, and non-content sites
        if (url.includes('instagram.com') || url.includes('youtube.com') || url.includes('facebook.com') || url.includes('twitter.com') || url.includes('reddit.com') || url.includes('pinterest.com') || url.includes('tiktok.com')) continue;

        // Check relevance
        const combined = `${title} ${snippet}`.toLowerCase();
        const relevant = words.some(w => combined.includes(w.toLowerCase()));
        if (!relevant) continue;

        if (snippet.length > 40) {
          allSnippets.push({ title, snippet, url: links[i][1] });
        }
      }
      if (allSnippets.length >= 3) break;
    } catch {}
  }

  if (allSnippets.length === 0) return null;

  // Compose a clean history from the snippets
  const placeName = allSnippets[0].title.split('-')[0].split('|')[0].split('...')[0].trim() || query;
  const historyText = allSnippets.map(s => s.snippet).join('\n\n');
  const sourceUrls = allSnippets.map(s => ({ title: s.title, url: s.url }));

  return { placeName, historyText, sourceUrls };
}

// =============================================================================
// SUPPLEMENTARY SOURCES
// =============================================================================

async function fetchWikimediaImages(query) {
  try {
    const response = await axios.get('https://commons.wikimedia.org/w/api.php', {
      params: { action: 'query', generator: 'search', gsrsearch: query, gsrlimit: 6, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: 800, format: 'json' },
      timeout: 7000, headers: { 'User-Agent': 'SailApp/1.0 (History Explorer)' },
    });
    const pages = response.data?.query?.pages;
    if (!pages) return [];
    return Object.values(pages).filter(p => p.imageinfo && p.imageinfo[0]).map(p => {
      const info = p.imageinfo[0]; const meta = info.extmetadata || {};
      return { title: p.title.replace('File:', ''), url: info.thumburl || info.url, fullUrl: info.url, description: meta.ImageDescription ? stripHtml(meta.ImageDescription.value) : '', license: meta.LicenseShortName ? meta.LicenseShortName.value : 'Unknown', artist: meta.Artist ? stripHtml(meta.Artist.value) : 'Unknown' };
    }).slice(0, 6);
  } catch { return []; }
}

async function fetchOpenLibraryReferences(query) {
  try {
    const response = await axios.get('https://openlibrary.org/search.json', {
      params: { q: `${query} history India`, limit: 5, fields: 'title,author_name,first_publish_year,cover_i,subject,key' },
      timeout: 7000,
    });
    if (!response.data.docs) return [];
    return response.data.docs.map(book => ({ title: book.title, authors: book.author_name || [], year: book.first_publish_year || null, cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null, subjects: (book.subject || []).slice(0, 5), url: `https://openlibrary.org${book.key}` }));
  } catch { return []; }
}

// =============================================================================
// RESPONSE BUILDERS
// =============================================================================

function buildWikiResponse(query, wikiData, images, books) {
  const sections = parseContentIntoSections(wikiData.content, wikiData.extract);
  return {
    found: true, query, title: wikiData.title, description: wikiData.description, summary: wikiData.extract,
    thumbnail: wikiData.thumbnail, heroImage: wikiData.originalImage || wikiData.thumbnail,
    coordinates: wikiData.coordinates, sourceUrl: wikiData.url, sections,
    images: images || [], books: books || [], mythology: [], legends: [], webSources: [],
    categories: wikiData.categories || [], relatedTopics: wikiData.relatedTopics || [],
  };
}

function buildWebResponse(query, webInfo, images) {
  const sections = [
    { id: 'overview', title: '📜 History & Significance', icon: '📜', content: webInfo.historyText },
  ];

  if (webInfo.sourceUrls && webInfo.sourceUrls.length > 0) {
    sections.push({
      id: 'sources', title: '🔗 Sources', icon: '🔗',
      content: webInfo.sourceUrls.map(s => `• ${s.title}`).join('\n'),
    });
  }

  return {
    found: true, query, title: webInfo.placeName, description: '',
    summary: webInfo.historyText.substring(0, 400),
    thumbnail: null, heroImage: null, coordinates: null,
    sourceUrl: webInfo.sourceUrls[0]?.url || '',
    sections, images: images || [], books: [], mythology: [], legends: [], webSources: [],
    categories: [], relatedTopics: [],
  };
}

function parseContentIntoSections(content, extract) {
  const sections = [];
  if (extract) sections.push({ id: 'overview', title: '📜 Overview & Significance', icon: '📜', content: extract });
  if (!content || typeof content !== 'string') return sections;

  const keywords = [
    { pattern: /history/i, title: '🏛️ History', icon: '🏛️' },
    { pattern: /origin|founding|foundation/i, title: '🌱 Origins & Foundation', icon: '🌱' },
    { pattern: /legend|myth|folklore/i, title: '🐉 Legends & Myths', icon: '🐉' },
    { pattern: /culture|tradition|festival/i, title: '🎭 Culture & Traditions', icon: '🎭' },
    { pattern: /religion|spiritual|sacred|temple|church|mosque/i, title: '🕯️ Spiritual Significance', icon: '🕯️' },
    { pattern: /architecture|monument|heritage/i, title: '🏰 Architecture & Heritage', icon: '🏰' },
    { pattern: /geography|climate|landscape/i, title: '🌄 Geography & Landscape', icon: '🌄' },
    { pattern: /significance|importance|worship/i, title: '🙏 Significance & Worship', icon: '🙏' },
  ];

  const contentSections = content.split(/\n(?===)/);
  for (const section of contentSections) {
    const headingMatch = section.match(/^==+\s*(.+?)\s*==+/);
    if (!headingMatch) continue;
    const heading = headingMatch[1];
    const body = section.replace(/^==+\s*.+?\s*==+\n?/, '').trim();
    if (body.length < 50) continue;
    for (const kw of keywords) {
      if (kw.pattern.test(heading)) { sections.push({ id: heading.toLowerCase().replace(/\s+/g, '-'), title: kw.title, icon: kw.icon, content: body.substring(0, 2000) }); break; }
    }
  }
  if (sections.length <= 1 && content.length > 200) sections.push({ id: 'history', title: '🏛️ Historical Background', icon: '🏛️', content: content.substring(0, 3000) });
  return sections;
}

function stripHtml(html) { return (html || '').replace(/<[^>]+>/g, '').trim(); }

module.exports = { searchLocation: getLocationHistory, getLocationHistory };
