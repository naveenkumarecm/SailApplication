import React from 'react';
import './MythologySection.css';

function MythologySection({ items, title, subtitle }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mythology-section">
      <h3 className="mythology-title">{title}</h3>
      {subtitle && <p className="mythology-subtitle">{subtitle}</p>}

      <div className="mythology-grid">
        {items.map((item, idx) => (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mythology-card"
          >
            {item.thumbnail && (
              <div className="mythology-image-container">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="mythology-image"
                  loading="lazy"
                />
              </div>
            )}
            <div className="mythology-info">
              <h4 className="mythology-card-title">{item.title}</h4>
              {item.description && (
                <span className="mythology-description">{item.description}</span>
              )}
              <p className="mythology-extract">
                {item.extract.length > 300
                  ? item.extract.substring(0, 300) + '...'
                  : item.extract}
              </p>
              <span className="mythology-read-more">Read more →</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default MythologySection;
