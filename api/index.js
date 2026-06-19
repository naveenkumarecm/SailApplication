const express = require('express');
const cors = require('cors');
const { getLocationHistory } = require('../server/services/historyService');
const { getSuggestions } = require('../server/services/suggestionService');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/history', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a location name' });
    }
    const trimmedQuery = query.trim();
    const result = await getLocationHistory(trimmedQuery);

    if (result.found) return res.json(result);

    const suggestions = await getSuggestions(trimmedQuery);
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

    result.suggestions = suggestions.map(s => s.name).slice(0, 5);
    res.json(result);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch. Please try again.' });
  }
});

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

module.exports = app;
