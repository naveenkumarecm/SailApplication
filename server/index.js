const express = require('express');
const cors = require('cors');
const path = require('path');
const { getLocationHistory } = require('./services/historyService');
const { getSuggestions } = require('./services/suggestionService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use(express.static(path.join(__dirname, '../client/public')));

// API: Get history for a location
app.post('/api/history', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a location name' });
    }

    const trimmedQuery = query.trim();

    // Directly fetch history — the historyService does intelligent search itself
    const result = await getLocationHistory(trimmedQuery);

    if (result.found) {
      return res.json(result);
    }

    // Not found directly — try suggestions only from local list (not Wikipedia opensearch to avoid wrong matches)
    const suggestions = await getSuggestions(trimmedQuery);

    // Only auto-correct if we have a VERY close local match (score < 0.2)
    if (suggestions.length > 0 && suggestions[0].source === 'known' && suggestions[0].score < 0.2) {
      const corrected = suggestions[0].name;
      if (corrected.toLowerCase() !== trimmedQuery.toLowerCase()) {
        const retryResult = await getLocationHistory(corrected);
        if (retryResult.found) {
          retryResult.correctedFrom = trimmedQuery;
          retryResult.correctedTo = corrected;
          return res.json(retryResult);
        }
      }
    }

    // Not found - return with suggestions
    result.suggestions = suggestions.map(s => s.name).slice(0, 5);
    res.json(result);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch. Please try again.' });
  }
});

// API: Get suggestions
app.get('/api/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ suggestions: [] });
    const suggestions = await getSuggestions(q.trim());
    res.json({ suggestions });
  } catch (error) {
    res.json({ suggestions: [] });
  }
});

// Fallback to frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌍 Sail History Server running on http://localhost:${PORT}`);
});
