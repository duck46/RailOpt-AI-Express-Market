# RailOpt AI Express Market

**Onboard Retail & Destination Discovery Platform for VIA Rail**

> An AI-powered full-stack platform that brings local artisan commerce to rail passengers across Canada — with geolocation-aware product recommendations, offline-first ordering, and destination discovery — aligned with the United Nations Sustainable Development Goals.

🚆 **Live Demo**: [https://railopt-ai-express-market.onrender.com](https://railopt-ai-express-market.onrender.com)

---

## What It Does

RailOpt AI Express Market turns the VIA Rail journey into a curated shopping and discovery experience. Passengers can browse **120+ non-perishable local products** from **41 stations** across 8 provinces, get AI-powered product recommendations based on what they're looking for, and place orders for seat delivery — even when the train is in a cellular dead zone.

---

## Features

### Shop Tab
- **120+ local products** across 41 VIA Rail stations in Ontario, Québec, British Columbia, Alberta, Manitoba, New Brunswick, Nova Scotia, and Saskatchewan
- **Geolocation detection** — "Use My Location" finds your nearest station and auto-filters the catalogue
- **AI product search** — type anything ("a gift for my mom", "something cozy") and the AI Concierge surfaces the 3 most relevant items from the entire catalogue, highlighted with a gold badge
- **Order deadline countdown** — an 8-minute timer starts when the first item is added to cart, shown in the cart button and inside the drawer (turns red in the final 2 minutes)
- **Offline-first ordering** — orders placed in cellular dead zones are stored in a queue and synced at the next station platform
- **Order confirmation screen** with order number, total, and seat delivery notice
- **AI Personalize** — per-product AI-generated marketing scripts tailored to passenger preferences

### Discover Tab
- Browse destinations province by province across the entire VIA Rail network
- Destination cards with hero colors, taglines, highlights, and vibe tags
- Popular routes listed per destination
- "Shop [Station] Products" CTA cross-links directly into the Shop tab filtered to that station

### Account Tab
Three sub-sections via a segmented control:

**Profile**
- Name, email, VIA Préférence number
- Car and seat number, travel class selector
- Shopping interest tags (used to personalize AI picks)
- Dietary/allergy notes, language preference (English / Français)
- Persisted to `localStorage`

**Purchase History**
- Every order is saved and shown as an expandable card
- Shows order ID, timestamp, full item breakdown, total
- 4-step visual status tracker: Confirmed → Preparing → On the Way → Delivered

**Messages**
- Inbox with unread count badge
- Gold left-border on unread messages; tap to open full view (marks as read)
- Pre-loaded with onboard notifications from RailOpt AI and VIA Rail Concierge

---

## Quick Start

### Backend (FastAPI · Port 8000)

```bash
cd backend
pip install fastapi uvicorn httpx python-dotenv
echo "OPENROUTER_API_KEY=your_key_here" > .env   # optional — degrades to demo mode without it
uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite · Port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 RailOpt AI Express Market                   │
│                                                             │
│  ┌─────────────────────┐    ┌───────────────────────────┐  │
│  │  React + Vite        │    │  FastAPI Backend           │  │
│  │  Port 5173           │◄──►│  Port 8000                │  │
│  │  Tailwind CSS        │    │  OpenRouter AI Gateway    │  │
│  │  Lucide React icons  │    │  In-memory order queue    │  │
│  └─────────────────────┘    └───────────────────────────┘  │
│                                                             │
│  Haversine geolocation (browser-side, no server round-trip) │
│  localStorage — account profile, orders, read messages      │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/offline-dashboard` | All 120+ non-perishable retail items |
| `POST` | `/api/offline-order` | Queue an order (store-and-forward) |
| `GET` | `/api/sync-queue-status` | Current queue depth and byte count |
| `POST` | `/api/simulate-sync` | Drain the queue (simulate station sync) |
| `POST` | `/api/ai/personalize` | Generate a 2-sentence personalized marketing script |
| `POST` | `/api/ai/recommend` | Return up to 3 relevant product IDs for a free-text query |
| `GET` | `/api/railopt/simulation` | Siding pass conflict calc (`?freight_delay=N`) |

---

## AI Integration

| Setting | Value |
|---------|-------|
| Provider | [OpenRouter](https://openrouter.ai) |
| Primary model | `google/gemini-2.5-flash-lite` |
| Fallback model | `meta-llama/llama-3.3-70b-instruct` |
| Env var | `OPENROUTER_API_KEY` in `backend/.env` |
| Degraded mode | Demo scripts / empty recommendations returned if key is absent |

The `/api/ai/recommend` endpoint receives a free-text passenger query plus optional nearest-station context and returns a ranked list of product IDs. The prompt instructs the model to return `[]` if nothing in the catalogue genuinely matches — preventing irrelevant fallback results.

---

## Product Catalogue — 41 Stations, 8 Provinces

| Province | Stations |
|----------|---------|
| Ontario | Toronto, Ottawa, Kingston, Cobourg, Belleville, Cornwall, Hamilton, Kitchener, London, Niagara Falls, Sarnia, Sudbury, Windsor |
| Québec | Montréal, Québec City, Baie-Saint-Paul, Rimouski, Jonquière, La Tuque, Senneterre |
| British Columbia | Vancouver, Prince George, Prince Rupert, Kamloops |
| Alberta | Edmonton, Jasper, Banff |
| Manitoba | Winnipeg, Thompson, The Pas, Churchill |
| New Brunswick | Moncton, Campbellton, Bathurst, Miramichi |
| Nova Scotia | Halifax, New Glasgow, Truro, Amherst |
| Saskatchewan | Saskatoon, Regina |

All items are **non-perishable and locally produced** — sourced from regional artisans, craft producers, and small vendors along the VIA Rail corridor.

---

## SDG Alignment

### SDG 8 — Decent Work and Economic Growth
The platform creates a **digital marketplace channel for local artisans and small producers** who would otherwise lack access to VIA Rail's 4+ million annual passenger touchpoints — from Limestone City Craft Co. in Kingston to Indigenous art vendors in Prince Rupert. The AI Personalize feature generates marketing copy for their products on demand, lowering the barrier to digital commerce for micro-vendors with no e-commerce presence.

### SDG 10 — Reduced Inequalities
Without this platform, vendors in Churchill, Miramichi, or Senneterre have zero access to the passenger market that Toronto and Montréal vendors take for granted. The catalogue gives equal digital shelf space to every station regardless of size. The geolocation feature further levels the playing field by surfacing nearby vendors first — a passenger near Jasper sees Jasper products, not just urban ones.

### SDG 11 — Sustainable Cities and Communities
Making rail travel more commercially useful supports modal shift away from private vehicles. If passengers can shop, discover destinations, and place orders onboard, the train becomes a more compelling alternative to driving. The Discover tab also actively promotes smaller corridor communities (Baie-Saint-Paul, The Pas, Cobourg) to passengers who might not have considered them — strengthening local tourism and cultural economy.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend framework | FastAPI 0.138+ |
| Backend server | Uvicorn (ASGI) |
| HTTP client | httpx (async) |
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| AI gateway | OpenRouter |
| Primary AI model | google/gemini-2.5-flash-lite |
| Fallback AI model | meta-llama/llama-3.3-70b-instruct |
| Geolocation | Browser Geolocation API + Haversine distance |
| Persistence | localStorage (profile, order history, messages) |
| Deployment | Render (single service, FastAPI serves built React frontend) |

---

## Environment Variables

```env
# backend/.env
OPENROUTER_API_KEY=your_openrouter_key_here
```

---

## Deployment

The app is deployed as a single Render service. The build command compiles the React frontend and copies the output to be served as static files by FastAPI:

```yaml
buildCommand: cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt
startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set `OPENROUTER_API_KEY` in the Render environment variables dashboard to enable live AI features.

---

*RailOpt AI Express Market — Phase 1 demonstration platform. Production would add authentication, persistent SQLite/PostgreSQL queue, and integration with VIA Rail's POS and inventory systems.*
