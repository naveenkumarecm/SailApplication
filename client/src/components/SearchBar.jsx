import React, { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // Auto-focus the input on mount and when loading completes
  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      setShowSuggestions(false);
      setSuggestions([]);
      onSearch(query.trim());
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (name) => {
    setQuery(name);
    setShowSuggestions(false);
    setSuggestions([]);
    onSearch(name);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex].name);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="search-sticky">
      <div className="search-container">
        <div className="search-brand">
          <span className="brand-icon">⛵</span>
          <span className="brand-name">Sail</span>
        </div>
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-input-wrapper">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Search any place... (e.g., Rome, Mithila, Varanasi, Machu Picchu)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              disabled={loading}
              autoFocus
              aria-label="Search for a location"
              aria-autocomplete="list"
              aria-controls="suggestions-list"
              aria-expanded={showSuggestions}
            />
            <button
              type="submit"
              className="search-button"
              disabled={!query.trim() || loading}
              aria-label="Search"
            >
              {loading ? (
                <span className="btn-loading">⏳</span>
              ) : (
                <span>Explore →</span>
              )}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul
              className="suggestions-list"
              id="suggestions-list"
              ref={suggestionsRef}
              role="listbox"
            >
              <li className="suggestion-header">
                <span>💡</span> Did you mean...
              </li>
              {suggestions.map((s, idx) => (
                <li
                  key={s.name + idx}
                  className={`suggestion-item ${idx === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSuggestionClick(s.name)}
                  role="option"
                  aria-selected={idx === selectedIndex}
                >
                  <span className="suggestion-icon">
                    {s.source === 'known' ? '📍' : '🌐'}
                  </span>
                  <span className="suggestion-name">{s.name}</span>
                  {s.source === 'known' && (
                    <span className="suggestion-badge">Popular</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </form>
      </div>
    </div>
  );
}

export default SearchBar;
