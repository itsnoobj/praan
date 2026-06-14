# RaktSetu — Blood Donor Activation Network

Voice-AI emergency blood donor matching. Built on [Ringg AI](https://www.ringg.ai/).

## Architecture

```
Frontend (Vercel)              Backend (Railway + Docker)          Ringg AI
━━━━━━━━━━━━━━━━━              ━━━━━━━━━━━━━━━━━━━━━━━━           ━━━━━━━━
React dashboard    ──API──→    Express server           ──API──→  Voice agent calls donor
Live SSE feed      ←─SSE──     Playwright scraper       ←webhook─ Returns transcript + classification
                               Ringg orchestration
```

## Project Structure

```
├── backend/
│   ├── Dockerfile              # Node 20 + Chromium for Playwright
│   ├── server.js               # Express: SSE, webhooks, Ringg orchestration
│   ├── scraper.js              # Playwright scraper for Friends2Support
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/App.jsx             # React dashboard with live feed
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── BUSINESS_MODEL.md
├── TECHNICAL_ARCHITECTURE.md
└── README.md
```

## Deploy

### Backend → Railway

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub → point to `backend/` folder
3. Railway auto-detects the Dockerfile
4. Set env vars in Railway dashboard (see `backend/.env.example`)
5. Get your public URL (e.g. `https://raktsetu.up.railway.app`)
6. Set that URL as `PUBLIC_URL` env var + use it as Ringg webhook callback

### Frontend → Vercel

1. `cd frontend && npx vercel`
2. Set env var: `VITE_API_URL=https://raktsetu.up.railway.app`
3. Done — deploys on every push

### Ringg AI Setup

1. Create agent on [Ringg dashboard](https://www.ringg.ai/dashboard)
2. Set prompt (see TECHNICAL_ARCHITECTURE.md for full agent config)
3. Buy/assign a phone number
4. Configure webhook: `https://<railway-url>/api/webhooks/ringg`
5. Copy `agent_id` + `from_number_id` → set in Railway env vars

## Local Dev

```bash
# Terminal 1: Backend
cd backend
npm install
npx playwright install chromium  # local only, Docker handles this in prod
node server.js

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

## Demo Flow

1. Open dashboard → select O+, Bangalore, J P Nagar
2. Click "Find Donors NOW"
3. Watch live feed: scraper navigates Friends2Support, finds donors
4. System identifies Jeevan D C → calls via Ringg AI
5. Jeevan picks up on stage → agent asks about donation availability
6. Webhook fires → dashboard shows "✅ DONOR CONFIRMED"

## Safety

Only numbers in `SAFE_NUMBERS` env var get called. Default: Jeevan's own number.
