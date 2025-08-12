# Business Extractor Frontend (React + Vite)

## Development

1. Install dependencies:
```bash
npm install
```

2. Start dev server (proxies `/api` → Flask on port 3001):
```bash
npm run dev
```

Visit `http://localhost:5173`.

## Build for Flask static

1. Build and copy to backend `src/static/` so Flask can serve the app on port 3001:
```bash
npm run build:copy
```

Then open `http://localhost:3001`.

## Notes
- API endpoints expected:
  - `POST /api/extract` with `{ url: string }`
  - `POST /api/download-csv` with extracted data
- Adjust the proxy in `vite.config.js` if your backend runs elsewhere.

