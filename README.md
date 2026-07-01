# RailOpt AI Express Market

**Onboard Retail & Destination Discovery Platform for VIA Rail**

> *"Forgot something? Need something? You're on a train — it comes to you."*

An AI-powered full-stack platform that turns the VIA Rail journey into a complete commerce experience — local artisan products delivered to your seat, anything else from nearby stores collected at the platform, powered by AI personalization and a two-phase logistics model built for real rail operations.

🚆 **Live Demo**: [https://railopt-ai-express-market.onrender.com](https://railopt-ai-express-market.onrender.com)

---

## The Market

VIA Rail carried **4.4 million passengers** in 2025, travelling **986 million passenger miles** across **400+ communities** in Canada. **95% of those trips** are long-haul intercity journeys on the Québec City–Windsor Corridor — assigned seats, 2–5 hour rides, nowhere to go.

VIA Rail spent **$51.4 million on onboard product costs in 2025**, up **14.5% year-over-year**, driven by higher ridership in Business and Sleeper classes and rising supplier prices. The annual report flags this cost line as a growing financial pressure — yet there is no demand intelligence behind it. VIA stocks trains by intuition, not data.

RailOpt's Phase 2 AI turns that $51M cost line into a precision operation: learn what passengers on each route actually buy, tell VIA exactly what to stock, reduce waste, improve fill rates. The data moat is built in Phase 1.

*(Source: VIA Rail 2025 Annual Report)*

---

## The Problem

Every traveller has had that moment — you're on the train and you realize you forgot something. Your headache pills. A gift for whoever you're visiting. A snack for the kids. Normally you're stuck until the next city.

This is how passengers on The Canadian actually solve it today, from Reddit:

> *"Sioux Lookout has a Subway just down the street — that's pushing it time wise — or a Rexall past the CIBC across the street which is your best bet. There have been times the stop is long enough for a dash over to Subway but it is very rare. Make sure you have at least 20 minutes in station otherwise do NOT make the run. If you have 10 minutes you can do the Rexall. It does involve running. Make sure you communicate clearly with VIA staff. Also the Edmonton vending machines are cheaper than on train. Winnipeg and Jasper are your main places to pick up food."*

Passengers are sprinting to convenience stores during 10-minute stops, timing Rexall dashes, and relying on local knowledge passed around Reddit threads. The demand is real and proven — VIA Rail just has no infrastructure to serve it.

RailOpt replaces the sprint with an app. Order before the stop, a Rail Certified Instacart shopper meets you at the platform door, you never leave the train.

---

## Two-Layer Commerce Model

### 🛍️ Shop Tab — Local Artisan Catalogue
- **120+ non-perishable products** from local vendors at 41 VIA Rail stations across 8 provinces
- Every item carries a **🍁 Canada** badge (or **🌿 Eco** for sustainable products)
- **AI Concierge** — type anything in natural language ("sore throat", "gift for my mom", "something cozy") and AI surfaces the 3 most relevant items, thinking laterally across the catalogue
- **Geolocation** — "Use My Location" finds your nearest station and filters the catalogue to nearby products
- **CO₂ savings banner** — shows carbon avoided vs. driving when location is detected
- **Eco Picks filter** — surfaces 19 sustainable products made with natural/low-impact materials
- **8-minute order countdown** — timer starts on first cart addition, turns red in final 2 minutes
- **AI Personalize** — per-product AI-generated marketing scripts tailored to passenger preferences
- **Onboard pickup zone** — collect your order at the designated café car area, ready in ~8 minutes (works on all trains regardless of seat assignment)

### 🛒 Pickup Tab — Instacart Station Pickup *(Phase 1)*
- **Any store near any station** — Fresh Food, Pharmacy, Books & Magazines, Gifts, Grocery (30 items across 5 categories in demo)
- **Rail Certified shoppers** — Instacart shoppers with a platform-handoff badge meet you at your car door during the stop
- **Business hours enforcement** — stops where stores will be closed at arrival show a red 🔒 indicator and are disabled
- **2-hour lead time** — orders only allowed for stops ≥2 hours away
- **5-step order tracker** — placed → shopper assigned → picking → shopper at platform → collected
- **Pharmacy nudge** — typing "advil", "tylenol", etc. in the Shop tab instantly surfaces a blue banner pointing to Pickup

### 🧠 Phase 2 — AI Onboard Intelligence *(Roadmap)*
Every Instacart order trains the AI on what passengers on each route actually want. Once enough signal is gathered, the AI tells VIA Rail what to stock onboard — available at the onboard pickup zone on every train, no platform stop or seat assignment required. The data becomes the moat.

VIA Rail spent **$51.4M on onboard product costs in 2025 (+14.5% YoY)** with no demand intelligence behind that spend. Phase 2 directly attacks that inefficiency: route-level demand forecasting means less waste, better fill rates, and a data asset VIA doesn't currently have. RailOpt is also timed to VIA's **32 new Venture trainsets** just deployed in the Corridor — a clean slate to build digital commerce infrastructure from day one.

---

## Revenue Model

| Stream | Rate | Notes |
|--------|------|-------|
| Pickup commission | 5% per order | On every Instacart station pickup |
| Platform fee | $0.99 per order | Charged to passenger at checkout |
| Shop commission | 15% per artisan sale | Standard marketplace take rate |
| Phase 2 SaaS | $X/month to VIA Rail | AI demand forecasting licence |

At 4.4M passengers/year with even 2% conversion on Pickup ($25 AOV) and 5% on Shop ($18 AOV): **~$270K ARR at Phase 1 scale before Phase 2 SaaS revenue kicks in.**

---

## Go-to-Market

**We don't need VIA Rail's permission to launch Phase 1.**

- RailOpt launches as a **standalone passenger app** — no VIA Rail contract required
- Passengers order Instacart pickups independently; shoppers already service train station areas
- Artisan vendors sign up as sellers directly; we handle the digital shelf
- We collect demand data across every route and stop

**Phase 2 is the enterprise sale:**
Once we have 6–12 months of route-level demand data, we approach VIA Rail with a data-backed proposal: *"Here's exactly what passengers on your Winnipeg run want to buy onboard — here's what you should stock."* VIA Rail's $51.4M onboard product cost problem now has a data-backed solution, and we have the proof.

This sidesteps the 18–36 month Crown Corporation procurement cycle. We build leverage before we knock on the door.

---

## Why It's Different from the 2018 Metrolinx / PC Express Pilot

Loblaw and Metrolinx ran a grocery pickup pilot at 5 GO Transit stations in 2018. It was shut down. The key differences:

| PC Express / Metrolinx (2018) | RailOpt Express Market |
|---|---|
| Order the night before | 2-hour lead time |
| Walk to a locker | Shopper meets you at your car door |
| Loblaws only | Any store on Instacart network |
| No personalization | AI Concierge + lateral reasoning |
| Commuter context (3-min stops) | Long-haul context (2–5 hr trips) |
| No local artisan layer | 120+ curated Canadian products |

---

## Features

### Account Tab
Three sub-sections via a segmented control:

**Profile**
- Name, email, VIA Préférence number, car/seat, travel class
- Shopping interest tags used to personalize AI picks
- Dietary/allergy notes, language preference (English / Français)

**🔒 Privacy & Data** *(PIPEDA + Bill C-27 / CPPA compliant)*
- **Opt-in toggle**: Contribute anonymous purchase patterns to route intelligence (off by default)
- **Opt-in toggle**: Personalized recommendations (on by default, device-only)
- "Your data is never sold or shared with advertisers" — stated explicitly in UI
- Delete all my data button — clears localStorage and reloads

**Purchase History**
- Every order saved as an expandable card with 4-step status tracker

**Messages**
- Inbox with unread count badge, gold border on unread, tap to read

### Discover Tab
- Browse all 41 destinations province by province
- Hero colors, taglines, highlights, vibe tags, popular routes
- "Shop [Station] Products" CTA cross-links into Shop tab filtered to that station
- Fully client-side — renders instantly, no backend cold-start dependency

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
┌──────────────────────────────────────────────────────────────────┐
│                   RailOpt AI Express Market                      │
│                                                                  │
│  ┌──────────────────────┐    ┌────────────────────────────────┐  │
│  │  React + Vite         │    │  FastAPI Backend               │  │
│  │  Port 5173            │◄──►│  Port 8000                    │  │
│  │  Tailwind CSS         │    │  OpenRouter AI Gateway        │  │
│  │  Lucide React icons   │    │  In-memory order queue        │  │
│  └──────────────────────┘    └────────────────────────────────┘  │
│                                                                  │
│  Haversine geolocation (browser-side, no server round-trip)      │
│  localStorage — account profile, orders, messages, consent       │
│  DESTINATIONS static bundle — Discover tab works offline         │
└──────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/offline-dashboard` | 122 non-perishable retail items |
| `POST` | `/api/offline-order` | Queue an order (store-and-forward) |
| `GET` | `/api/sync-queue-status` | Current queue depth and byte count |
| `POST` | `/api/simulate-sync` | Drain the queue (simulate station sync) |
| `POST` | `/api/ai/personalize` | Generate a 2-sentence personalized marketing script |
| `POST` | `/api/ai/recommend` | Return up to 3 relevant product IDs for a free-text query |
| `GET` | `/api/destinations` | All 41 destination objects |
| `GET` | `/api/destinations/{id}` | Single destination detail |

---

## AI Integration

| Setting | Value |
|---------|-------|
| Provider | [OpenRouter](https://openrouter.ai) |
| Primary model | `google/gemini-2.5-flash-lite` |
| Fallback model | `meta-llama/llama-3.3-70b-instruct` |
| Env var | `OPENROUTER_API_KEY` in `backend/.env` |
| Degraded mode | Demo scripts / empty recommendations returned if key is absent |

The `/api/ai/recommend` endpoint uses **lateral, empathetic reasoning** — "sore throat" returns honey and herbal tea, not soap. Product descriptions are included in the catalogue sent to the AI so it can reason about use cases, not just match on names. Explicit good/bad examples in the prompt prevent low-quality connections.

---

## Privacy & Compliance

- **PIPEDA compliant** — no personal data collected without consent
- **Bill C-27 / CPPA ready** — opt-in consent toggles, right to delete, no third-party data sharing
- AI route intelligence uses **anonymous aggregated patterns only** — never individual profiles
- Passengers opt in explicitly; withdrawal and full data deletion available in Account tab

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

### SDG 7 — Affordable and Clean Energy
CO₂ savings banner (shown for distances ≥10 km) shows carbon avoided vs. driving. 🌿 Eco Picks filter surfaces 19 sustainable products made with natural/low-impact materials.

### SDG 8 — Decent Work and Economic Growth
Digital marketplace channel for local artisans with zero e-commerce presence — equal access to VIA Rail's 4.4M annual passengers. AI Personalize generates marketing copy on demand.

### SDG 9 — Industry, Innovation and Resilient Infrastructure
AI Recommend and AI Personalize give a Churchill vendor the same retail AI tools that large urban retailers pay thousands for. Phase 2 AI route intelligence democratizes demand forecasting across the corridor.

### SDG 10 — Reduced Inequalities
Equal digital shelf space for Churchill, Miramichi, and Senneterre alongside Toronto and Montréal. Geolocation surfaces nearby vendors first — a passenger near Jasper sees Jasper products.

### SDG 11 — Sustainable Cities and Communities
Richer onboard experience supports modal shift away from private vehicles. Discover tab promotes smaller corridor communities and strengthens local tourism.

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
| Persistence | localStorage (profile, order history, messages, consent) |
| Deployment | Render (single service, FastAPI serves built React frontend) |

---

## Environment Variables

```env
# backend/.env
OPENROUTER_API_KEY=your_openrouter_key_here
```

---

## Deployment

Single Render service — FastAPI serves the built React frontend as static files:

```yaml
buildCommand: cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt
startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set `OPENROUTER_API_KEY` in the Render environment variables dashboard to enable live AI features.

---

## Git Workflow

All feature development happens on the branch `claude/railopt-express-market-p1-lzfqff` and is squash-merged to `main` via pull requests. The branch is rebased on `main` before each push to avoid conflicts from squash-merge divergence.

```bash
# Clone and set up
git clone https://github.com/duck46/railopt-ai-express-market.git
cd railopt-ai-express-market
git checkout claude/railopt-express-market-p1-lzfqff

# Before pushing new changes
git fetch origin main
git rebase origin/main
git push --force-with-lease origin claude/railopt-express-market-p1-lzfqff
```

---

*RailOpt AI Express Market — Phase 1 demonstration platform. Production would add authentication, persistent SQLite/PostgreSQL order queue, Instacart API integration, VIA Rail POS integration, and CPPA-compliant data infrastructure.*
