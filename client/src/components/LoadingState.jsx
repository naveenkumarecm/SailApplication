import React from 'react';
import './LoadingState.css';

function LoadingState({ query }) {
  const loadingMessages = [
    '📜 Searching ancient archives...',
    '🏛️ Exploring historical records...',
    '🗺️ Mapping historical significance...',
    '📚 Consulting open libraries...',
    '🖼️ Gathering historical imagery...',
  ];

  return (
    <div className="loading-container">
      <div className="loading-animation">
        <div className="loading-compass">
          <span className="compass-icon">🧭</span>
        </div>
        <div className="loading-rings">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
        </div>
      </div>

      <h3 className="loading-title">
        Discovering the history of <span className="loading-query">{query}</span>
      </h3>

      <div className="loading-messages">
        {loadingMessages.map((msg, idx) => (
          <p
            key={idx}
            className="loading-message"
            style={{ animationDelay: `${idx * 0.8}s` }}
          >
            {msg}
          </p>
        ))}
      </div>
    </div>
  );
}

export default LoadingState;
