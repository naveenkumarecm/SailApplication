# ⛵ Sail — Location History Explorer

Discover the significance, traditions, legends, myths, and untold stories of any place on Earth.

**Open source • No login required • No tracking**

## Features

- 🔍 **Smart Search** — Case insensitive input with fuzzy typo correction and suggestions
- 📜 **Rich History** — Significance, traditions, legacy, stories, beliefs, myths
- 🖼️ **Historical Images** — From Wikimedia Commons with open licenses
- 📚 **Book References** — From Open Library's archives
- 🎨 **Beautiful UI** — Dark theme with smooth animations and responsive design
- ♿ **Accessible** — ARIA labels, keyboard navigation, semantic HTML

## Data Sources

All data comes from open, permissioned sources:
- **Wikipedia** — Comprehensive articles and structured content
- **Wikimedia Commons** — Historical images under CC/public domain
- **Open Library** — Book references and reading material

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start development (backend + frontend)
npm run dev
```

- Backend runs on `http://localhost:3001`
- Frontend runs on `http://localhost:5173`

## Production

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## Tech Stack

- **Frontend:** React 18 + Vite (fast, modern build)
- **Backend:** Express.js (lightweight API server)
- **Search:** Fuse.js (fuzzy matching for typo correction)
- **Data:** Wikipedia API, Wikimedia Commons API, Open Library API

## License

MIT — Use freely, contribute openly.
