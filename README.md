# RailOpt AI Express Market

**Onboard Retail & Rail Optimization Platform — Phase 1: Non-Perishable Local Regional Retail**

> A full-stack demonstration framework built for the VIA Rail corridor, aligning AI-driven commerce infrastructure with the United Nations Sustainable Development Goals (SDGs).

---

## Quick Start

### Backend (FastAPI · Port 8000)

```bash
cd backend
pip install fastapi uvicorn httpx python-dotenv
# Optional: add your OpenRouter API key to .env
echo "OPENROUTER_API_KEY=your_key_here" > .env
uvicorn main:app --reload --port 8000
```

### Frontend (React Vite · Port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — the cockpit interface launches in dark amber mode.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  RailOpt AI Express Market                      │
│                                                                 │
│  ┌──────────────────────┐    ┌───────────────────────────────┐  │
│  │   React Vite Frontend │    │     FastAPI Backend           │  │
│  │   Port 5173           │◄──►│     Port 8000                │  │
│  │   Tailwind + Lucide  │    │     + OpenRouter AI           │  │
│  └──────────────────────┘    └───────────────────────────────┘  │
│                                       │                         │
│                              In-Memory Store-and-Forward Queue  │
│                              (Offline-first, sync-on-connect)   │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/offline-dashboard` | Fetch non-perishable retail items (Kingston + Cobourg) |
| `POST` | `/api/offline-order` | Queue an order into in-memory store-and-forward |
| `GET` | `/api/sync-queue-status` | Live queue depth and byte counter |
| `POST` | `/api/simulate-sync` | Drain queue (simulates station platform sync) |
| `GET` | `/api/railopt/simulation?freight_delay=N` | Siding conflict engine + SDG 7 fuel metrics |
| `POST` | `/api/ai/personalize` | OpenRouter AI 2-sentence marketing script generation |

### AI Integration

- **Provider**: [OpenRouter](https://openrouter.ai)
- **Primary Model**: `google/gemini-2.5-flash-lite`
- **Fallback Model**: `meta-llama/llama-3.3-70b-instruct`
- **Env var**: `OPENROUTER_API_KEY` in `backend/.env`
- Gracefully degrades to demo mode if key is not set

---

## Phase 1 Product Catalogue

All items are **non-perishable, locally produced**, meeting the Phase 1 retail mandate:

| ID | Station | Vendor | Product | Price | Category |
|----|---------|--------|---------|-------|----------|
| KGN-001 | Kingston | Limestone City Craft Co. | Handmade Cozy Cabin Bear Socks | $24.00 | Souvenirs |
| KGN-002 | Kingston | Kingston Heritage Press | Hand-Pressed Waterfront Postcards | $12.50 | Souvenirs |
| CBG-001 | Cobourg | Last Mountain Farms | Old Fashioned Saskatoon Berry Jam | $14.00 | Retail |

---

## UI Features

### Global Banner
**"SIMULATE CELLULAR DEAD ZONE"** toggle — when ON, the UI enters offline warning layout and all orders are flagged as store-and-forward queued.

### Tab 1 — 🛍️ Express Platform Delivery
- Non-perishable retail items with `Retail` / `Souvenirs` badges
- **RailOpt AI Concierge**: enter passenger preferences → generates a 2-sentence personalized marketing script via OpenRouter
- **Queue Order** button stores orders in the in-memory queue with a visual confirmation

### Tab 2 — 🛠️ RailOpt AI Operational View
- Interactive range slider: **Freight Train Delay (0–60 min)**
- Real-time dual-track siding pass conflict calculation
- Visual track state bars: `CLEAR`, `OCCUPIED`, `HOLD`, `CONFLICT`, `EMERGENCY SIDING`
- SDG 7 metric cards: fuel saved (L), CO₂ avoided (kg), cost saved (CAD), infrastructure score

### Tab 3 — 🔒 Digital Trust & Network Diagnostics
- Live byte counter of queued data packets (auto-refreshes every 3 s)
- Packet list showing order IDs and item names
- **Trigger Station Platform Sync** — clears queue with a green success animation
- Compliance checklist: AES-256, MQTT, 4× exponential retry, PIPEDA

---

## SDG Alignment Framework

### SDG 7 — Affordable and Clean Energy
The RailOpt AI Operational View calculates real-time fuel savings from resolving freight/passenger train siding conflicts. Each avoided idling minute translates to measurable CO₂ reduction and fuel cost recovery, demonstrating how AI-assisted dispatch can contribute to a cleaner rail network.

### SDG 8 — Decent Work and Economic Growth
The Express Platform Delivery module creates a **digital marketplace channel for local artisans and small producers** who would otherwise lack access to the 4+ million annual VIA Rail passenger touchpoints. Limestone City Craft Co., Kingston Heritage Press, and Last Mountain Farms are representative of the micro-enterprise cohort this platform empowers.

### SDG 9 — Industry, Innovation and Resilient Infrastructure
The store-and-forward offline queue architecture is a direct embodiment of SDG 9: infrastructure resilience. Orders placed during cellular dead zones (tunnels, rural stretches) are never lost — they are cryptographically queued and synced at the next station platform connection, ensuring digital commerce works as reliably as the rail itself.

### SDG 10 — Reduced Inequalities
By giving rural station vendors (Cobourg, Kingston) equal digital shelf space alongside urban retailers, RailOpt AI Express Market reduces the geographic commerce inequality that typically concentrates economic benefit in major metropolitan stations. Phase 1's focus on regional non-perishables is intentional: it onboards the highest-impact, lowest-logistics-complexity vendors first.

### SDG 11 — Sustainable Cities and Communities
Multimodal transit is foundational to sustainable urban planning. RailOpt AI enhances the rail corridor's economic utility — making train travel more commercially viable supports modal shift away from private vehicles. The platform also strengthens the identity of smaller corridor communities (Kingston, Cobourg) by surfacing their cultural products to thousands of daily passengers.

---

## Technical Design Principles

- **Offline-first**: All user actions are possible without connectivity; sync is opportunistic
- **Zero data loss**: Queue is in-memory with explicit sync confirmation; production would use SQLite WAL
- **Graceful AI degradation**: Demo mode scripts returned if `OPENROUTER_API_KEY` is unset
- **CORS**: Permissive in dev (`*`); lock to `https://your-domain.ca` in production
- **No vendor lock-in**: OpenRouter allows model swapping without application changes

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | FastAPI 0.138+ |
| Backend server | Uvicorn (ASGI) |
| HTTP client (AI) | httpx (async) |
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| AI gateway | OpenRouter |
| Primary AI model | google/gemini-2.5-flash-lite |
| Fallback AI model | meta-llama/llama-3.3-70b-instruct |

---

## Environment Variables

```env
# backend/.env
OPENROUTER_API_KEY=your_openrouter_key_here
```

---

*RailOpt AI Express Market is a Phase 1 demonstration platform. Production deployment would add authentication, a persistent SQLite/PostgreSQL queue, HTTPS, and integration with VIA Rail's POS and inventory management systems.*
