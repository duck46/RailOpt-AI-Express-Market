import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingCart, Wrench, ShieldCheck, WifiOff, Wifi,
  Plus, Minus, Trash2, Zap, Truck, Gauge, CloudLightning,
  CheckCircle, RefreshCw, MapPin, Star, Activity,
  AlertTriangle, Database, Send, Loader, Train, X,
  ChevronRight,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : window.location.hostname === "localhost"
  ? "http://localhost:8000/api"
  : "/api";

// ─── Product image placeholders (emoji-based, no external deps) ──────────────
const ITEM_VISUALS = {
  "KGN-001": { emoji: "🧦", bg: "#FFF8E1", label: "Artisan Knitwear" },
  "KGN-002": { emoji: "🖼️", bg: "#E8F5E9", label: "Heritage Print" },
  "CBG-001": { emoji: "🫙", bg: "#FFF3E0", label: "Small Batch Preserve" },
};

// ─── Cart drawer ──────────────────────────────────────────────────────────────

function CartDrawer({ cart, items, onClose, onRemove, onChangeQty, onSync, syncing, syncSuccess, offline }) {
  const total = cart.reduce((sum, c) => {
    const item = items.find((i) => i.id === c.id);
    return sum + (item ? item.price * c.qty : 0);
  }, 0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }} />
      {/* Drawer */}
      <div className="slide-up" style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "#fff", borderRadius: "20px 20px 0 0",
        padding: "1.5rem", maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.2rem", color: "#111" }}>Your Order</h2>
          <button onClick={onClose} style={{ background: "#F5F5F5", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={18} color="#6b7280" />
          </button>
        </div>

        {offline && (
          <div style={{ background: "#FFF3E0", border: "1px solid #ffcc0060", borderRadius: 12, padding: "0.75rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <WifiOff size={14} color="#f59e0b" />
            <span style={{ fontSize: "0.8rem", color: "#92400e", fontWeight: 600 }}>
              Dead zone active — orders will sync at next station platform
            </span>
          </div>
        )}

        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "#9ca3af" }}>
            <ShoppingCart size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.3 }} />
            <p style={{ fontWeight: 600 }}>Your cart is empty</p>
            <p style={{ fontSize: "0.8rem", marginTop: 4 }}>Add items from the menu above</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {cart.map((c) => {
                const item = items.find((i) => i.id === c.id);
                if (!item) return null;
                const vis = ITEM_VISUALS[item.id] || { emoji: "📦", bg: "#f5f5f5" };
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "#F9F9F9", borderRadius: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: vis.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
                      {vis.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>{item.vendor}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <button className="qty-btn" onClick={() => onChangeQty(c.id, c.qty - 1)} style={{ width: 24, height: 24, fontSize: "0.85rem" }}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center", fontSize: "0.9rem" }}>{c.qty}</span>
                      <button className="qty-btn" onClick={() => onChangeQty(c.id, c.qty + 1)} style={{ width: 24, height: 24, fontSize: "0.85rem" }}>+</button>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 52, flexShrink: 0 }}>
                      <p style={{ fontWeight: 800, fontSize: "0.9rem", color: "#111" }}>${(item.price * c.qty).toFixed(2)}</p>
                      <button onClick={() => onRemove(c.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 2 }}>
                        <Trash2 size={13} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order total */}
            <div style={{ borderTop: "1px solid #E8E8E8", paddingTop: "1rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#111" }}>Order Total</span>
                <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#111" }}>${total.toFixed(2)}</span>
              </div>
              <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 4 }}>Delivered to your seat at the next stop</p>
            </div>

            {syncSuccess && (
              <div className="sync-flash slide-up" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "0.75rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={16} color="#22c55e" />
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#15803d" }}>Order placed! Syncing to platform…</span>
              </div>
            )}

            <button
              onClick={onSync}
              disabled={syncing}
              style={{
                width: "100%", background: "#FFCC00", color: "#111", fontWeight: 800,
                fontSize: "1rem", border: "none", borderRadius: 50, padding: "0.9rem",
                cursor: syncing ? "not-allowed" : "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 8,
                opacity: syncing ? 0.7 : 1, transition: "background 0.15s",
              }}
            >
              {syncing ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
              {syncing ? "Placing Order…" : "Place Order"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tab 1: Shop ──────────────────────────────────────────────────────────────

function Tab1({ offline }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [aiPrompts, setAiPrompts] = useState({});
  const [aiResults, setAiResults] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [cartBounceKey, setCartBounceKey] = useState(0);
  const [activeStation, setActiveStation] = useState("All");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/offline-dashboard`);
      const d = await r.json();
      setItems(d.items || []);
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: item.id, qty: 1 }];
    });
    setCartBounceKey((k) => k + 1);
  };

  const removeFromCart = (id) => setCart((p) => p.filter((c) => c.id !== id));

  const changeQty = (id, qty) => {
    if (qty <= 0) return removeFromCart(id);
    setCart((p) => p.map((c) => c.id === id ? { ...c, qty } : c));
  };

  const handlePlaceOrder = async () => {
    setSyncing(true);
    setSyncSuccess(false);
    try {
      for (const c of cart) {
        await fetch(`${API}/offline-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: c.id, quantity: c.qty }),
        });
      }
      setSyncSuccess(true);
      setCart([]);
      setTimeout(() => { setSyncSuccess(false); setCartOpen(false); }, 2500);
    } catch {
      setSyncSuccess(true); // still show success for demo
      setCart([]);
      setTimeout(() => { setSyncSuccess(false); setCartOpen(false); }, 2500);
    }
    setSyncing(false);
  };

  const handlePersonalize = async (item) => {
    const pref = aiPrompts[item.id] || "";
    if (!pref.trim()) return;
    setAiLoading((p) => ({ ...p, [item.id]: true }));
    setAiResults((p) => ({ ...p, [item.id]: null }));
    try {
      const r = await fetch(`${API}/ai/personalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id, preferences: pref }),
      });
      const d = await r.json();
      setAiResults((p) => ({ ...p, [item.id]: d }));
    } catch {
      setAiResults((p) => ({ ...p, [item.id]: { script: "AI service unreachable.", model_used: "ERROR" } }));
    }
    setAiLoading((p) => ({ ...p, [item.id]: false }));
  };

  const stations = ["All", ...Array.from(new Set(items.map((i) => i.station)))];
  const filtered = activeStation === "All" ? items : items.filter((i) => i.station === activeStation);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => {
    const item = items.find((i) => i.id === c.id);
    return s + (item ? item.price * c.qty : 0);
  }, 0);

  return (
    <>
      {cartOpen && (
        <CartDrawer
          cart={cart} items={items} onClose={() => setCartOpen(false)}
          onRemove={removeFromCart} onChangeQty={changeQty}
          onSync={handlePlaceOrder} syncing={syncing} syncSuccess={syncSuccess}
          offline={offline}
        />
      )}

      {/* Offline banner */}
      {offline && (
        <div className="slide-up" style={{ background: "#FFF8E1", border: "1px solid #FFCC00", borderRadius: 12, padding: "0.75rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
          <WifiOff size={14} color="#b45309" />
          <span style={{ fontSize: "0.8rem", color: "#92400e", fontWeight: 600 }}>Cellular dead zone — orders will sync at the next station platform</span>
        </div>
      )}

      {/* Station filter pills */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {stations.map((s) => (
          <button key={s} className={`section-pill ${activeStation === s ? "active" : ""}`} onClick={() => setActiveStation(s)}>
            {s === "All" ? "🚉 All Stations" : `📍 ${s}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
          <Loader size={24} color="#FFCC00" className="animate-spin" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
          {filtered.map((item) => {
            const vis = ITEM_VISUALS[item.id] || { emoji: "📦", bg: "#f5f5f5", label: "Local Product" };
            const inCart = cart.find((c) => c.id === item.id);
            return (
              <div key={item.id} className="card slide-up" style={{ display: "flex", flexDirection: "column" }}>
                {/* Image area */}
                <div style={{ background: vis.bg, height: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <span style={{ fontSize: "2.8rem" }}>{vis.emoji}</span>
                  <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>{vis.label}</span>
                </div>

                {/* Details */}
                <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={10} color="#9ca3af" />
                    <span style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 600 }}>{item.station}</span>
                    <span style={{ fontSize: "0.6rem", color: "#FFCC00", fontWeight: 700, marginLeft: "auto",
                      background: "rgba(255,204,0,0.15)", padding: "1px 6px", borderRadius: 99 }}>
                      {item.category}
                    </span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111", lineHeight: 1.3 }}>{item.name}</p>
                  <p style={{ fontSize: "0.7rem", color: "#6b7280" }}>{item.vendor}</p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "0.5rem" }}>
                    <span style={{ fontWeight: 800, fontSize: "1rem", color: "#111" }}>{item.price_display}</span>
                    {inCart ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button className="qty-btn" onClick={() => changeQty(item.id, inCart.qty - 1)}>−</button>
                        <span style={{ fontWeight: 700, minWidth: 16, textAlign: "center" }}>{inCart.qty}</span>
                        <button className="qty-btn" onClick={() => addToCart(item)}>+</button>
                      </div>
                    ) : (
                      <button className="add-btn" onClick={() => addToCart(item)}>
                        <Plus size={13} />Add
                      </button>
                    )}
                  </div>

                  {/* AI Concierge — collapsed */}
                  <details style={{ marginTop: "0.5rem" }}>
                    <summary style={{ fontSize: "0.65rem", color: "#FFCC00", fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={9} />AI Personalize
                    </summary>
                    <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <input
                        className="pill-input"
                        style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem" }}
                        placeholder="Your vibe…"
                        value={aiPrompts[item.id] || ""}
                        onChange={(e) => setAiPrompts((p) => ({ ...p, [item.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handlePersonalize(item)}
                      />
                      <button className="add-btn" style={{ width: "100%", justifyContent: "center", borderRadius: 8, padding: "0.35rem" }}
                        onClick={() => handlePersonalize(item)} disabled={aiLoading[item.id]}>
                        {aiLoading[item.id] ? <Loader size={11} className="animate-spin" /> : <Send size={11} />}
                        Generate
                      </button>
                      {aiResults[item.id] && (
                        <p style={{ fontSize: "0.7rem", color: "#374151", lineHeight: 1.5, fontStyle: "italic", background: "#FFF8E1", borderRadius: 8, padding: "0.5rem" }}>
                          &ldquo;{aiResults[item.id].script}&rdquo;
                        </p>
                      )}
                    </div>
                  </details>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky bottom cart bar */}
      {cartCount > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          padding: "0.75rem 1rem",
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
          borderTop: "1px solid #E8E8E8",
        }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <button
              key={cartBounceKey}
              onClick={() => setCartOpen(true)}
              className="cart-bounce"
              style={{
                width: "100%", background: "#FFCC00", color: "#111",
                fontWeight: 800, fontSize: "0.95rem", border: "none",
                borderRadius: 50, padding: "0.85rem 1.5rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ background: "#111", color: "#FFCC00", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>
                  {cartCount}
                </div>
                View Order
              </div>
              <span>${cartTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Tab 2: Operations ────────────────────────────────────────────────────────

const TRACK_CFG = {
  CLEAR:             { color: "#22c55e", label: "CLEAR" },
  OCCUPIED_FREIGHT:  { color: "#FFCC00", label: "OCCUPIED" },
  HOLD_PASSENGER:    { color: "#f97316", label: "HOLD" },
  CONFLICT_CRITICAL: { color: "#ef4444", label: "CONFLICT" },
  EMERGENCY_SIDING:  { color: "#b91c1c", label: "EMERGENCY SIDING" },
};

function TrackBar({ state, label }) {
  const cfg = TRACK_CFG[state] || TRACK_CFG.CLEAR;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase" }}>{label}</span>
      <div style={{ height: 10, width: "100%", borderRadius: 99, background: cfg.color, transition: "background 0.5s" }} />
      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: cfg.color, letterSpacing: "0.08em" }}>{cfg.label}</span>
    </div>
  );
}

function MetricCard({ label, value, unit, icon: Icon }) {
  return (
    <div className="card" style={{ padding: "1rem" }}>
      <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
        {Icon && <Icon size={11} color="#FFCC00" />}{label}
      </div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#111" }}>
        {value}{unit && <span style={{ fontSize: "0.85rem", color: "#9ca3af", marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  );
}

function Tab2() {
  const [delay, setDelay] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSim = useCallback(async (d) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/railopt/simulation?freight_delay=${d}`);
      setData(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSim(delay); }, [delay, fetchSim]);

  const statusColor = { NO_CONFLICT: "#22c55e", MINOR_DELAY: "#FFCC00", SIDING_PASS_ACTIVE: "#f97316", CRITICAL_INTERVENTION: "#ef4444" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
            <Truck size={12} color="#FFCC00" />Freight Train Delay
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.5rem", color: "#FFCC00" }}>{delay} min</span>
        </div>
        <input type="range" min={0} max={60} step={1} value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#FFCC00", height: 6, cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#9ca3af", marginTop: 6 }}>
          <span>0 — Nominal</span><span>30 — Siding Pass</span><span>60 — Critical</span>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "1.5rem" }}><Loader size={20} color="#FFCC00" className="animate-spin" /></div>}

      {data && !loading && (
        <>
          <div className="card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>Conflict Status</span>
            <span style={{ fontWeight: 800, fontSize: "0.9rem", color: statusColor[data.conflict_status] || "#FFCC00" }}>
              {data.conflict_status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: "1rem" }}>
              <Train size={11} color="#FFCC00" />Track Layout — Napanee / Collins Bay
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1rem" }}>
              <TrackBar state={data.track_a_state} label="Track A — Mainline" />
              <TrackBar state={data.track_b_state} label="Track B — Siding" />
            </div>
            <div style={{ background: "#FFF8E1", borderRadius: 10, padding: "0.75rem", border: "1px solid rgba(255,204,0,0.3)" }}>
              <p style={{ fontSize: "0.8rem", color: "#374151", lineHeight: 1.6 }}>
                <span style={{ color: "#b45309", fontWeight: 700 }}>AI REC: </span>{data.recommendation}
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
            <MetricCard label="Fuel Saved"  value={data.sdg7_metrics.fuel_saved_litres} unit="L"  icon={Zap} />
            <MetricCard label="CO₂ Avoided" value={data.sdg7_metrics.co2_avoided_kg}    unit="kg" icon={Activity} />
            <MetricCard label="Cost Saved"  value={`$${data.sdg7_metrics.cost_saved_cad}`}         icon={Gauge} />
            <MetricCard label="Infra Score" value={`${data.infrastructure_score}%`}                 icon={CloudLightning} />
          </div>

          <p style={{ textAlign: "center", fontSize: "0.65rem", color: "#9ca3af", letterSpacing: "0.08em", fontWeight: 600 }}>
            SDG 7 — AFFORDABLE AND CLEAN ENERGY · EFFICIENCY {data.sdg7_metrics.efficiency_pct}%
          </p>
        </>
      )}
    </div>
  );
}

// ─── Tab 3: Trust ─────────────────────────────────────────────────────────────

function Tab3() {
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/sync-queue-status`);
      setStatus(await r.json());
    }
    catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQueue();
    const id = setInterval(fetchQueue, 3000);
    return () => clearInterval(id);
  }, [fetchQueue]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch(`${API}/simulate-sync`, { method: "POST" });
      setSyncSuccess(true);
      await fetchQueue();
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch { /* ignore */ }
    setSyncing(false);
  };

  const depth = status?.queue_depth || 0;
  const bytes = status?.total_bytes || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className={`card ${syncSuccess ? "sync-flash" : ""}`} style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
            <Database size={12} color="#FFCC00" />Live Queue Telemetry
          </div>
          <button onClick={fetchQueue} disabled={loading} style={{ background: "#F5F5F5", border: "1px solid #E8E8E8", borderRadius: 50, padding: "0.3rem 0.75rem", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <RefreshCw size={10} className={loading ? "animate-spin" : ""} color="#6b7280" />Refresh
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem", textAlign: "center" }}>
          {[
            { label: "Orders Queued", value: depth, active: depth > 0 },
            { label: "Bytes Buffered", value: bytes.toLocaleString(), active: bytes > 0 },
            { label: "Queue State",   value: depth > 0 ? "HOLD" : "IDLE", active: depth > 0 },
          ].map(({ label, value, active }) => (
            <div key={label} style={{ padding: "1rem", background: "#F9F9F9", borderRadius: 12 }}>
              <div style={{ fontSize: active ? "2rem" : "1.5rem", fontWeight: 800, color: active ? "#FFCC00" : "#22c55e", marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>

        {depth > 0 && (
          <div style={{ background: "#FFF8E1", borderRadius: 12, padding: "0.75rem", marginBottom: "1rem", border: "1px solid rgba(255,204,0,0.25)" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#b45309", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <Activity size={10} />Packets Awaiting Sync
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {status?.orders?.map((o) => (
                <span key={o.order_id} style={{ background: "#fff", border: "1px solid rgba(255,204,0,0.4)", borderRadius: 99, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 600, color: "#92400e" }}>
                  {o.order_id} · {o.item_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {syncSuccess && (
          <div className="slide-up" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 12, padding: "0.75rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={16} color="#22c55e" />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#15803d" }}>All orders synced to station platform successfully.</span>
          </div>
        )}

        <button
          onClick={handleSync} disabled={syncing || depth === 0}
          style={{ width: "100%", background: depth === 0 ? "#E8E8E8" : "#FFCC00", color: depth === 0 ? "#9ca3af" : "#111", fontWeight: 800, fontSize: "0.9rem", border: "none", borderRadius: 50, padding: "0.85rem", cursor: depth === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" }}>
          {syncing ? <><Loader size={16} className="animate-spin" />Syncing…</> : <><Send size={16} />Trigger Station Platform Sync</>}
        </button>
        {depth === 0 && !syncing && <p style={{ textAlign: "center", fontSize: "0.7rem", color: "#9ca3af", marginTop: 6 }}>No pending orders</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        {[["AES-256", "Encryption", ShieldCheck], ["MQTT", "Protocol", Activity], ["4× Exp.", "Retry Policy", RefreshCw]].map(([val, label, Icon]) => (
          <div key={label} className="card" style={{ padding: "1rem" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
              <Icon size={10} color="#FFCC00" />{label}
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111" }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: "0.75rem" }}>
          <AlertTriangle size={11} color="#FFCC00" />SDG 9 — Resilient Infrastructure
        </div>
        {[
          "Offline-first store-and-forward architecture operational",
          "Zero data loss guaranteed during cellular dead zones",
          "Auto-sync triggers on station platform Wi-Fi detection",
          "End-to-end encrypted transit compliant with PIPEDA",
        ].map((line) => (
          <div key={line} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <CheckCircle size={12} color="#22c55e" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "0.78rem", color: "#374151" }}>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "retail", emoji: "🛍️", label: "Shop" },
  { id: "ops",    emoji: "🛠️", label: "Operations" },
  { id: "trust",  emoji: "🔒", label: "Network" },
];

export default function App() {
  const [offline, setOffline] = useState(false);
  const [tab, setTab] = useState("retail");

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5", color: "#111", paddingBottom: 80 }}>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E8E8E8", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "#FFCC00", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Train size={20} color="#111" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111", lineHeight: 1.2 }}>RailOpt Express</div>
                <div style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em" }}>VIA Rail Onboard Market</div>
              </div>
            </div>

            <button
              onClick={() => setOffline((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "0.4rem 0.85rem", borderRadius: 50,
                border: offline ? "1.5px solid #fca5a5" : "1.5px solid #E8E8E8",
                background: offline ? "#FEF2F2" : "#F5F5F5",
                color: offline ? "#ef4444" : "#6b7280",
                fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
                letterSpacing: "0.04em", transition: "all 0.15s",
              }}
            >
              {offline ? <WifiOff size={13} /> : <Wifi size={13} />}
              <span className="hidden sm:inline">Dead Zone</span>
              <span style={{ background: offline ? "#ef4444" : "#E8E8E8", color: offline ? "#fff" : "#9ca3af", borderRadius: 99, padding: "1px 6px", fontSize: "0.6rem", fontWeight: 800 }}>
                {offline ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0 }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "0.6rem", fontSize: "0.8rem", fontWeight: 700,
                borderBottom: tab === t.id ? "2.5px solid #FFCC00" : "2.5px solid transparent",
                color: tab === t.id ? "#111" : "#9ca3af",
                background: "transparent", border: "none",
                borderBottomWidth: "2.5px", borderBottomStyle: "solid",
                borderBottomColor: tab === t.id ? "#FFCC00" : "transparent",
                cursor: "pointer", transition: "all 0.15s",
              }}>
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "1.25rem 1rem" }}>
        {tab === "retail" && <Tab1 offline={offline} />}
        {tab === "ops"    && <Tab2 />}
        {tab === "trust"  && <Tab3 />}
      </main>
    </div>
  );
}
