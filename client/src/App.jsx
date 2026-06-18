import React, { useState, useCallback, useRef } from 'react';
import SearchBar from './components/SearchBar.jsx';
import HeroSection from './components/HeroSection.jsx';
import ResultsView from './components/ResultsView.jsx';
import LoadingState from './components/LoadingState.jsx';
import Footer from './components/Footer.jsx';
import './App.css';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchedQuery, setSearchedQuery] = useState('');
  const resultsRef = useRef(null);

  const handleSearch = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSearchedQuery(query);

    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setResult(data);
      setError(null);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="app">
      {/* Sticky search bar always on top */}
      <SearchBar onSearch={handleSearch} loading={loading} />

      {/* Hero only shows when no results */}
      {!result && !loading && <HeroSection />}

      <main className="main-content" ref={resultsRef}>
        {loading && <LoadingState query={searchedQuery} />}
        {error && !loading && (
          <div className="inline-error">
            <span className="inline-error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {result && !loading && <ResultsView data={result} />}
      </main>

      <Footer />
    </div>
  );
}

export default App;
