import React, { useState } from 'react';
import './ImageGallery.css';

function ImageGallery({ images, title }) {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <section className="gallery-section">
      <h3 className="gallery-title">
        <span className="gallery-icon">🖼️</span>
        Historical Images of {title}
      </h3>
      <p className="gallery-subtitle">
        Images from Wikimedia Commons • Open licensed
      </p>

      <div className="gallery-grid">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="gallery-item"
            onClick={() => setSelectedImage(img)}
            role="button"
            tabIndex={0}
            aria-label={`View ${img.title}`}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedImage(img)}
          >
            <img
              src={img.url}
              alt={img.title}
              loading="lazy"
              className="gallery-image"
            />
            <div className="gallery-item-overlay">
              <span className="gallery-item-title">{img.title}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="lightbox"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-label="Image viewer"
        >
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close"
              onClick={() => setSelectedImage(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <img
              src={selectedImage.fullUrl || selectedImage.url}
              alt={selectedImage.title}
              className="lightbox-image"
            />
            <div className="lightbox-info">
              <h4>{selectedImage.title}</h4>
              {selectedImage.description && (
                <p className="lightbox-desc">{selectedImage.description}</p>
              )}
              <div className="lightbox-meta">
                {selectedImage.artist && (
                  <span>🎨 {selectedImage.artist}</span>
                )}
                {selectedImage.license && (
                  <span>📄 {selectedImage.license}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ImageGallery;
