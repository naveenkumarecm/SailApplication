import React from 'react';
import './HeroSection.css';

function HeroSection() {
  return (
    <header className="hero">
      <div className="hero-bg-symbols">
        {/* Travel & Journey */}
        <span className="sticker st1">✈️</span>
        <span className="sticker st2">🧳</span>
        <span className="sticker st3">🗺️</span>
        <span className="sticker st4">🧭</span>
        <span className="sticker st5">⛵</span>
        {/* Monuments & Heritage */}
        <span className="sticker st6">🏛️</span>
        <span className="sticker st7">🗿</span>
        <span className="sticker st8">🏰</span>
        <span className="sticker st9">⛩️</span>
        <span className="sticker st10">🕌</span>
        {/* Indian Heritage */}
        <span className="sticker st11">🛕</span>
        <span className="sticker st12">🪔</span>
        <span className="sticker st13">📿</span>
        <span className="sticker st14">🙏</span>
        <span className="sticker st15">🕉️</span>
        {/* History & Culture */}
        <span className="sticker st16">📜</span>
        <span className="sticker st17">👑</span>
        <span className="sticker st18">⚔️</span>
        <span className="sticker st19">🏺</span>
        <span className="sticker st20">🎭</span>
        {/* Nature & Sacred */}
        <span className="sticker st21">🌸</span>
        <span className="sticker st22">🦚</span>
        <span className="sticker st23">🐘</span>
        <span className="sticker st24">🌺</span>
        <span className="sticker st25">🔱</span>
        {/* More Travel */}
        <span className="sticker st26">🌄</span>
        <span className="sticker st27">🏔️</span>
        <span className="sticker st28">🌊</span>
        <span className="sticker st29">🌿</span>
        <span className="sticker st30">🪷</span>
      </div>
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-icon">⛵</span>
          <span className="badge-text">Open Source • No Login Required</span>
        </div>
        <h1 className="hero-title">
          <span className="title-accent">Sail</span> Through History
        </h1>
        <p className="hero-subtitle">
          Discover the significance, traditions, legends, myths, and untold stories 
          of any place on Earth — from grand monuments to hidden temples.
        </p>
        <div className="hero-features">
          <div className="feature-chip">
            <span>📚</span> Books & Archives
          </div>
          <div className="feature-chip">
            <span>🐉</span> Myths & Legends
          </div>
          <div className="feature-chip">
            <span>🎭</span> Traditions
          </div>
          <div className="feature-chip">
            <span>🛕</span> Temples & Shrines
          </div>
          <div className="feature-chip">
            <span>🖼️</span> Historical Images
          </div>
          <div className="feature-chip">
            <span>🌐</span> Multi-Source Search
          </div>
        </div>
        {/* Gandaberunda — Two-headed eagle carrying two elephants */}
        <div className="gandaberunda-container">
          <img src="/gandaberunda.png" alt="Gandaberunda - two-headed mythical bird" className="gandaberunda-img" />
        </div>
      </div>
    </header>
  );
}

export default HeroSection;
