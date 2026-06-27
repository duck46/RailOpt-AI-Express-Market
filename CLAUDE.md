# RailOpt AI Express Market — CLAUDE.md

## Project Overview
Full-stack onboard retail + rail optimization platform. Phase 1 focuses exclusively on **non-perishable local regional retail** at Kingston and Cobourg stations.

## Stack

### Backend
- **Framework**: FastAPI (Python)
- **Port**: 8000
- **Entry point**: `backend/main.py`
- **Run**: `cd backend && uvicorn main:app --reload --port 8000`
- **Key libs**: `fastapi`, `uvicorn`, `httpx`, `python-dotenv`

### Frontend
- **Framework**: React + Vite
- **Port**: 5173
- **Entry point**: `frontend/src/App.jsx`
- **Run**: `cd frontend && npm run dev`
- **Key libs**: `tailwindcss`, `lucide-react`
- **Tailwind config**: v3 with `darkMode: 'class'`, amber/stone palette

## Aesthetic
**High-contrast dark amber cockpit** — optimized for virtual presentation / screen sharing.
- Background: `stone-950` / `stone-900`
- Primary accent: `amber-400` / `amber-500`
- Text: `amber-100` / `stone-200`
- Borders: `amber-500/30`
- All panels use `backdrop-blur` glass effects with amber glows

## API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/offline-dashboard` | Non-perishable retail items for Kingston & Cobourg |
| POST | `/api/offline-order` | Queue an order into in-memory store-and-forward |
| GET | `/api/sync-queue-status` | Return current queue contents and byte count |
| POST | `/api/simulate-sync` | Clear the queue (simulate station sync) |
| GET | `/api/railopt/simulation` | Siding pass conflict calc with `?freight_delay=N` |
| POST | `/api/ai/personalize` | OpenRouter AI marketing script generation |

## AI Integration
- **Provider**: OpenRouter
- **Primary model**: `google/gemini-2.5-flash-lite`
- **Fallback model**: `meta-llama/llama-3.3-70b-instruct`
- **Env var**: `OPENROUTER_API_KEY`

## CORS
Backend allows all origins in dev (`*`). Tighten for production.

## SDG Alignment
- SDG 7: Energy efficiency via rail optimization (fuel savings metrics)
- SDG 8: Decent work through local artisan commerce channels
- SDG 9: Resilient digital infrastructure with offline-first queue
- SDG 10: Reduced regional economic inequality (rural station retail)
- SDG 11: Sustainable communities via multimodal transit commerce
