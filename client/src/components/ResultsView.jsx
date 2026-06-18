import React from 'react';
import ImageGallery from './ImageGallery.jsx';
import BookReferences from './BookReferences.jsx';
import MythologySection from './MythologySection.jsx';
import './ResultsView.css';

function ResultsView({ data }) {
  if (!data.found) {
    return (
      <div className="no-results-banner">
        <span className="no-results-emoji">🗺️</span>
        <div className="no-results-text">
          <p className="no-results-message">
            Could not find detailed history for "<strong>{data.query}</strong>".
          </p>
          <p className="no-results-hint">
            💡 Try a different spelling, the English name, or a more specific place name.
          </p>
          {data.suggestions && data.suggestions.length > 0 && (
            <div className="no-results-suggestions">
              <span>Try these instead: </span>
              {data.suggestions.map((s, i) => (
                <span key={i} className="suggestion-inline">{s}{i < data.suggestions.length - 1 ? ', ' : ''}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="results">
      {/* Auto-correction notice */}
      {data.correctedFrom && (
        <div className="correction-banner">
          <span>✨</span>
          Showing results for "<strong>{data.correctedTo}</strong>" (you searched: "{data.correctedFrom}")
        </div>
      )}
      {/* Hero Card */}
      <div className="result-hero">
        {data.heroImage && (
          <div className="hero-image-container">
            <img
              src={data.heroImage}
              alt={data.title}
              className="hero-image"
              loading="eager"
            />
            <div className="hero-image-overlay" />
          </div>
        )}
        <div className="hero-info">
          <h1 className="result-title">{data.title}</h1>
          {data.description && (
            <p className="result-description">{data.description}</p>
          )}
          {data.coordinates && (
            <div className="coordinates">
              <span className="coord-icon">📍</span>
              <span>{data.coordinates.lat?.toFixed(4)}°N, {data.coordinates.lon?.toFixed(4)}°E</span>
            </div>
          )}
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="source-link"
          >
            <span>📖</span> Read full article on Wikipedia →
          </a>
        </div>
      </div>

      {/* Content Sections */}
      {data.sections && data.sections.length > 0 && (
        <div className="sections-grid">
          {data.sections.map((section) => (
            <article key={section.id} className="section-card">
              <div className="section-header">
                <span className="section-icon">{section.icon}</span>
                <h2 className="section-title">{section.title}</h2>
              </div>
              <div className="section-content">
                {section.content.split('\n').filter(p => p.trim()).slice(0, 8).map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Image Gallery */}
      {data.images && data.images.length > 0 && (
        <ImageGallery images={data.images} title={data.title} />
      )}

      {/* Mythology & Beliefs */}
      {data.mythology && data.mythology.length > 0 && (
        <MythologySection
          items={data.mythology}
          title="🕉️ Mythology, Beliefs & Sacred Stories"
          subtitle="Religious and spiritual significance connected to this place"
        />
      )}

      {/* Legendary Figures */}
      {data.legends && data.legends.length > 0 && (
        <MythologySection
          items={data.legends}
          title="👑 Legendary & Mythical Figures"
          subtitle="Epic characters, deities, saints, and sages associated with this place"
        />
      )}

      {/* Book References */}
      {data.books && data.books.length > 0 && (
        <BookReferences books={data.books} />
      )}

      {/* Related Topics */}
      {data.relatedTopics && data.relatedTopics.length > 0 && (
        <div className="related-section">
          <h3 className="related-title">
            <span>🔗</span> Related Topics to Explore
          </h3>
          <div className="related-chips">
            {data.relatedTopics.map((topic, idx) => (
              <span key={idx} className="related-chip">{topic}</span>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {data.categories && data.categories.length > 0 && (
        <div className="categories-section">
          <h4 className="categories-title">🏷️ Categories</h4>
          <div className="categories-list">
            {data.categories.map((cat, idx) => (
              <span key={idx} className="category-tag">
                {cat.replace('Category:', '')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultsView;
