import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="footer-logo">⛵</span>
          <span className="footer-name">Sail</span>
        </div>
        <p className="footer-tagline">
          Open source history explorer. No login. No tracking. Just knowledge.
        </p>
        <div className="footer-sources">
          <span className="footer-source-label">Powered by:</span>
          <a href="https://www.wikipedia.org" target="_blank" rel="noopener noreferrer">Wikipedia</a>
          <span className="footer-dot">•</span>
          <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>
          <span className="footer-dot">•</span>
          <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer">Open Library</a>
        </div>
        <p className="footer-license">
          All content sourced under open licenses (CC BY-SA, Public Domain).
          This project is open source under the MIT License.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
