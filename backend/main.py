from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import httpx
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="RailOpt AI Express Market API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store-and-forward queue
order_queue: list[dict] = []

RETAIL_ITEMS = [
    {
        "id": "KGN-001",
        "station": "Kingston",
        "vendor": "Limestone City Craft Co.",
        "name": "Handmade Cozy Cabin Bear Socks",
        "price": 24.00,
        "price_display": "$24.00",
        "category": "Souvenirs",
        "description": "Hand-knitted artisan socks featuring Kingston's iconic Limestone heritage motifs.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "KGN-002",
        "station": "Kingston",
        "vendor": "Kingston Heritage Press",
        "name": "Hand-Pressed Waterfront Postcards",
        "price": 12.50,
        "price_display": "$12.50",
        "category": "Souvenirs",
        "description": "Letterpress-printed postcards showcasing Kingston's historic waterfront and fort.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "CBG-001",
        "station": "Cobourg",
        "vendor": "Last Mountain Farms",
        "name": "Old Fashioned Saskatoon Berry Jam",
        "price": 14.00,
        "price_display": "$14.00",
        "category": "Retail",
        "description": "Small-batch, no-preservative Saskatoon berry jam from the Northumberland Hills.",
        "in_stock": True,
        "perishable": False,
    },
]


# --- Offline Dashboard ---

@app.get("/api/offline-dashboard")
def get_offline_dashboard():
    return {
        "status": "ok",
        "phase": "Phase 1 — Non-Perishable Local Regional Retail",
        "stations": ["Kingston", "Cobourg"],
        "items": RETAIL_ITEMS,
    }


# --- Offline Order Queue ---

class OrderRequest(BaseModel):
    item_id: str
    quantity: int = 1
    passenger_seat: Optional[str] = None
    payment_token: Optional[str] = "OFFLINE_DEFERRED"


@app.post("/api/offline-order")
def queue_offline_order(order: OrderRequest):
    item = next((i for i in RETAIL_ITEMS if i["id"] == order.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    queued = {
        "order_id": f"ORD-{len(order_queue) + 1:04d}",
        "item_id": order.item_id,
        "item_name": item["name"],
        "vendor": item["vendor"],
        "station": item["station"],
        "quantity": order.quantity,
        "total": round(item["price"] * order.quantity, 2),
        "passenger_seat": order.passenger_seat,
        "payment_token": order.payment_token,
        "status": "QUEUED_OFFLINE",
    }
    order_queue.append(queued)

    # Approximate byte size of the JSON payload
    payload_bytes = len(json.dumps(queued).encode("utf-8"))

    return {
        "status": "queued",
        "order": queued,
        "queue_depth": len(order_queue),
        "payload_bytes": payload_bytes,
        "message": "Order stored locally. Will sync at next station platform connection.",
    }


@app.get("/api/sync-queue-status")
def get_sync_queue_status():
    total_bytes = sum(len(json.dumps(o).encode("utf-8")) for o in order_queue)
    return {
        "queue_depth": len(order_queue),
        "total_bytes": total_bytes,
        "orders": order_queue,
        "sync_ready": len(order_queue) > 0,
    }


@app.post("/api/simulate-sync")
def simulate_sync():
    count = len(order_queue)
    total_bytes = sum(len(json.dumps(o).encode("utf-8")) for o in order_queue)
    order_queue.clear()
    return {
        "status": "synced",
        "orders_synced": count,
        "bytes_transmitted": total_bytes,
        "message": f"Successfully synced {count} order(s) to central platform.",
    }


# --- RailOpt Simulation ---

def _calculate_siding_conflict(freight_delay: int):
    """
    Simulates a dual-track siding pass conflict.
    freight_delay (minutes) → fuel savings, track state, scheduling recommendation.
    """
    base_fuel_per_min = 2.3  # litres/min saved when siding conflict resolved
    efficiency_factor = min(1.0, freight_delay / 45)

    fuel_saved_litres = round(base_fuel_per_min * freight_delay * efficiency_factor, 2)
    co2_avoided_kg = round(fuel_saved_litres * 2.68, 2)
    cost_saved_cad = round(fuel_saved_litres * 1.42, 2)

    if freight_delay == 0:
        track_a = "CLEAR"
        track_b = "CLEAR"
        conflict_status = "NO_CONFLICT"
        recommendation = "All tracks nominal. No siding intervention required."
    elif freight_delay <= 10:
        track_a = "OCCUPIED_FREIGHT"
        track_b = "CLEAR"
        conflict_status = "MINOR_DELAY"
        recommendation = "Minor freight overlap. Passenger train proceeds at reduced speed through Napanee siding."
    elif freight_delay <= 25:
        track_a = "OCCUPIED_FREIGHT"
        track_b = "HOLD_PASSENGER"
        conflict_status = "SIDING_PASS_ACTIVE"
        recommendation = "Siding pass protocol active. Freight diverted to Track B. Passenger ETA adjusted +8 min."
    else:
        track_a = "CONFLICT_CRITICAL"
        track_b = "EMERGENCY_SIDING"
        conflict_status = "CRITICAL_INTERVENTION"
        recommendation = "Critical conflict. Emergency siding at Collins Bay activated. Dispatcher alerted. Fuel recovery protocol engaged."

    return {
        "freight_delay_min": freight_delay,
        "conflict_status": conflict_status,
        "track_a_state": track_a,
        "track_b_state": track_b,
        "recommendation": recommendation,
        "sdg7_metrics": {
            "fuel_saved_litres": fuel_saved_litres,
            "co2_avoided_kg": co2_avoided_kg,
            "cost_saved_cad": cost_saved_cad,
            "efficiency_pct": round(efficiency_factor * 100, 1),
        },
        "infrastructure_score": round(100 - (freight_delay * 1.5), 1),
    }


@app.get("/api/railopt/simulation")
def railopt_simulation(freight_delay: int = Query(default=0, ge=0, le=60)):
    return _calculate_siding_conflict(freight_delay)


# --- AI Personalization via OpenRouter ---

class PersonalizeRequest(BaseModel):
    item_id: str
    preferences: str


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
PRIMARY_MODEL = "google/gemini-2.5-flash-lite"
FALLBACK_MODEL = "meta-llama/llama-3.3-70b-instruct"


async def _call_openrouter(model: str, prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://railopt.ai",
        "X-Title": "RailOpt AI Express Market",
    }
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 120,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


@app.post("/api/ai/personalize")
async def ai_personalize(req: PersonalizeRequest):
    item = next((i for i in RETAIL_ITEMS if i["id"] == req.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if not OPENROUTER_API_KEY:
        return {
            "item_id": req.item_id,
            "model_used": "DEMO_MODE",
            "script": (
                f"Discover the {item['name']} by {item['vendor']} — "
                f"a perfect {item['station']} keepsake at {item['price_display']}. "
                f"Add a piece of local character to your journey today!"
            ),
            "warning": "OPENROUTER_API_KEY not set. Demo script returned.",
        }

    prompt = (
        f"You are RailOpt AI Concierge, a friendly onboard retail assistant on a VIA Rail train. "
        f"Write exactly 2 sentences of compelling marketing copy for this product: "
        f"'{item['name']}' by '{item['vendor']}' from {item['station']} station, priced at {item['price_display']}. "
        f"Tailor it to a passenger who described their preferences as: '{req.preferences}'. "
        f"Keep it warm, local, and under 60 words total."
    )

    model_used = PRIMARY_MODEL
    try:
        script = await _call_openrouter(PRIMARY_MODEL, prompt)
    except Exception:
        try:
            model_used = FALLBACK_MODEL
            script = await _call_openrouter(FALLBACK_MODEL, prompt)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"AI service unavailable: {str(e)}")

    return {
        "item_id": req.item_id,
        "model_used": model_used,
        "script": script,
        "preferences_used": req.preferences,
    }


# --- Serve React frontend ---

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    @app.get("/")
    def root():
        return {"service": "RailOpt AI Express Market API", "version": "1.0.0", "status": "operational"}
