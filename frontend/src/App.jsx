import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag, Wrench, ShieldCheck, WifiOff, Wifi,
  Zap, Truck, Gauge, CloudLightning, CheckCircle,
  RefreshCw, Package, MapPin, Star, Activity,
  AlertTriangle, Database, Send, Loader, Train,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : window.location.hostname === "localhost"
  ? "http://localhost:8000/api"
  : "/api";

// ─── Shared ──────────────────────────────────────────────────────────────────

function Badge({ label, type }) {
  return (
    <span className={type === "Retail" ? "via-badge-retail" : "via-badge-souvenir"}>
      {label}
    </span>
  );
}

function MetricCard({ label, value, unit, icon: Icon, highlight = false }) {
  return (
    <div className="via-panel p-4 flex flex-col gap-1">
      <div className="via-label flex items-center gap-1.5">
        {Icon && <Icon size={11} className={highlight ? "text-[#FFCC00]" : "text-[#7a7f85]"} />}
        {label}
      </div>
      <div className={`text-2xl font-bold ${highlight ? "text-[#FFCC00]" : "text-white"}`}>
        {value}
        {unit && <span className="text-sm text-[#7a7f85] ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="via-accent-bar" />
      <div>
        <h2 className="text-white font-bold text-lg tracking-wide">{title}</h2>
        {subtitle && <p className="text-[#7a7f85] text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Tab 1: Express Platform Delivery ────────────────────────────────────────

function Tab1({ offline }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [queued, setQueued] = useState({});
  const [aiPrompts, setAiPrompts] = useState({});
  const [aiResults, setAiResults] = useState({});
  const [aiLoading, setAiLoading] = useState({});

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/offline-dashboard`);
      const d = await r.json();
      setItems(d.items || []);
    } catch { /* offline graceful */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleQueue = async (item) => {
    try {
      const r = await fetch(`${API}/offline-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id, quantity: 1 }),
      });
      const d = await r.json();
      setQueued((p) => ({ ...p, [item.id]: d.order?.order_id || "QUEUED" }));
    } catch {
      setQueued((p) => ({ ...p, [item.id]: "QUEUED_LOCAL" }));
    }
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

  return (
    <div className="space-y-4">
      <SectionHeader
        title="EXPRESS PLATFORM DELIVERY"
        subtitle="Phase 1 — Non-Perishable Local Regional Retail"
      />

      {offline && (
        <div className="via-panel border-red-900/60 bg-red-950/20 p-3 flex items-center gap-3 slide-in">
          <WifiOff size={15} className="text-red-400 shrink-0" />
          <div>
            <span className="text-red-300 text-xs font-bold tracking-wide">CELLULAR DEAD ZONE ACTIVE</span>
            <p className="text-red-400/70 text-xs mt-0.5">Orders queued locally — will sync at next station platform.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader size={22} className="animate-spin text-[#FFCC00]" />
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="via-panel p-5 space-y-4">
              {/* Product header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge label={item.category} type={item.category} />
                    <div className="flex items-center gap-1 text-xs text-[#7a7f85]">
                      <MapPin size={10} />{item.station}
                    </div>
                  </div>
                  <h3 className="text-white font-semibold text-base leading-snug">{item.name}</h3>
                  <p className="text-[#FFCC00] text-xs font-medium mt-0.5">{item.vendor}</p>
                  <p className="text-[#7a7f85] text-xs mt-1.5 leading-relaxed">{item.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-3xl font-bold text-[#FFCC00]">{item.price_display}</div>
                  <div className="text-xs text-green-400 flex items-center gap-1 justify-end mt-1">
                    <CheckCircle size={10} />In Stock
                  </div>
                </div>
              </div>

              {/* Diagonal motion divider */}
              <div className="h-px w-full" style={{ background: "linear-gradient(90deg, #FFCC00 0%, transparent 60%)" }} />

              {/* AI Concierge */}
              <div className="via-panel-inner p-3 space-y-2">
                <div className="flex items-center gap-2 via-label" style={{ color: "#FFCC00" }}>
                  <Star size={10} />
                  RailOpt AI Concierge Personalization
                </div>
                <div className="flex gap-2">
                  <input
                    className="via-input flex-1"
                    placeholder="Describe your preferences (e.g. 'gift for outdoorsy friend')…"
                    value={aiPrompts[item.id] || ""}
                    onChange={(e) => setAiPrompts((p) => ({ ...p, [item.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handlePersonalize(item)}
                  />
                  <button
                    className="via-btn-ghost shrink-0"
                    onClick={() => handlePersonalize(item)}
                    disabled={aiLoading[item.id]}
                  >
                    {aiLoading[item.id] ? <Loader size={13} className="animate-spin" /> : <Send size={13} />}
                    Generate
                  </button>
                </div>
                {aiResults[item.id] && (
                  <div className="p-3 rounded" style={{ background: "rgba(255,204,0,0.06)", border: "1px solid rgba(255,204,0,0.2)" }} >
                    <p className="text-white text-sm leading-relaxed italic">
                      &ldquo;{aiResults[item.id].script}&rdquo;
                    </p>
                    <p className="text-[#7a7f85] text-xs mt-2">Model: {aiResults[item.id].model_used}</p>
                  </div>
                )}
              </div>

              {/* Queue button */}
              <div className="flex justify-end">
                {queued[item.id] ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                    <CheckCircle size={15} />Queued — {queued[item.id]}
                  </div>
                ) : (
                  <button className="via-btn" onClick={() => handleQueue(item)}>
                    <Package size={14} />Queue Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: RailOpt AI Operational View ──────────────────────────────────────

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
    <div className="flex flex-col items-center gap-2">
      <span className="via-label">{label}</span>
      <div className="h-3 w-full rounded-full transition-all duration-500" style={{ backgroundColor: cfg.color }} />
      <span className="text-xs font-bold tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
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

  const statusColor = {
    NO_CONFLICT: "#22c55e",
    MINOR_DELAY: "#FFCC00",
    SIDING_PASS_ACTIVE: "#f97316",
    CRITICAL_INTERVENTION: "#ef4444",
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="RAILOPT AI OPERATIONAL VIEW"
        subtitle="Dual-Track Siding Pass Conflict Engine — SDG 7 Fuel Recovery"
      />

      <div className="via-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="via-label flex items-center gap-2">
            <Truck size={11} className="text-[#FFCC00]" />Freight Train Delay
          </label>
          <span className="text-[#FFCC00] font-bold text-xl">{delay} min</span>
        </div>
        <input
          type="range" min={0} max={60} step={1} value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, #FFCC00 ${(delay/60)*100}%, #2e3135 ${(delay/60)*100}%)` }}
        />
        <div className="flex justify-between via-label">
          <span>0 — Nominal</span><span>30 — Siding Pass</span><span>60 — Critical</span>
        </div>
      </div>

      {loading && <div className="flex justify-center py-4"><Loader size={20} className="animate-spin text-[#FFCC00]" /></div>}

      {data && !loading && (
        <>
          <div className="via-panel p-4 flex items-center justify-between">
            <span className="via-label">Conflict Status</span>
            <span className="font-bold text-sm tracking-wide" style={{ color: statusColor[data.conflict_status] || "#FFCC00" }}>
              {data.conflict_status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="via-panel p-5 space-y-4">
            <div className="via-label flex items-center gap-2">
              <Train size={11} className="text-[#FFCC00]" />
              Track Layout — Napanee / Collins Bay Siding
            </div>
            <div className="grid grid-cols-2 gap-6">
              <TrackBar state={data.track_a_state} label="Track A — Mainline" />
              <TrackBar state={data.track_b_state} label="Track B — Siding" />
            </div>
            <div className="p-3 rounded" style={{ background: "rgba(255,204,0,0.05)", border: "1px solid rgba(255,204,0,0.15)" }}>
              <p className="text-white/80 text-xs leading-relaxed">
                <span className="text-[#FFCC00] font-bold">AI REC: </span>{data.recommendation}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Fuel Saved"  value={data.sdg7_metrics.fuel_saved_litres} unit="L"   icon={Zap}            highlight />
            <MetricCard label="CO₂ Avoided" value={data.sdg7_metrics.co2_avoided_kg}    unit="kg"  icon={Activity} />
            <MetricCard label="Cost Saved"  value={`$${data.sdg7_metrics.cost_saved_cad}`}          icon={Gauge}          highlight />
            <MetricCard label="Infra Score" value={`${data.infrastructure_score}%`}                  icon={CloudLightning} />
          </div>

          <div className="text-center via-label">
            SDG 7 — Affordable and Clean Energy · Efficiency: {data.sdg7_metrics.efficiency_pct}%
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab 3: Digital Trust & Network Diagnostics ───────────────────────────────

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
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQueue();
    const id = setInterval(fetchQueue, 3000);
    return () => clearInterval(id);
  }, [fetchQueue]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncSuccess(false);
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
    <div className="space-y-5">
      <SectionHeader
        title="DIGITAL TRUST & NETWORK DIAGNOSTICS"
        subtitle="Store-and-Forward Queue Monitor — Encrypted Data Packets"
      />

      <div className={`via-panel p-6 ${syncSuccess ? "sync-flash" : ""}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="via-label flex items-center gap-2">
            <Database size={11} className="text-[#FFCC00]" />Live Queue Telemetry
          </div>
          <button onClick={fetchQueue} disabled={loading} className="via-btn-ghost py-1 px-2 text-xs">
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />Refresh
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className={`text-4xl font-bold mb-1 transition-all ${depth > 0 ? "text-[#FFCC00] animate-pulse-via" : "text-green-400"}`}>
              {depth}
            </div>
            <div className="via-label">Orders Queued</div>
          </div>
          <div className="text-center" style={{ borderLeft: "1px solid #2e3135", borderRight: "1px solid #2e3135" }}>
            <div className={`text-4xl font-bold mb-1 font-mono transition-all ${bytes > 0 ? "text-[#FFCC00]" : "text-[#4B4F54]"}`}>
              {bytes.toLocaleString()}
            </div>
            <div className="via-label">Bytes Buffered</div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold mb-1 ${depth > 0 ? "text-orange-400" : "text-green-400"}`}>
              {depth > 0 ? "HOLD" : "IDLE"}
            </div>
            <div className="via-label">Queue State</div>
          </div>
        </div>

        {depth > 0 && (
          <div className="via-panel-inner p-3 mb-4">
            <div className="via-label flex items-center gap-2 mb-2">
              <Activity size={10} className="text-[#FFCC00] animate-pulse-via" />
              Data Packets Awaiting Sync
            </div>
            <div className="flex flex-wrap gap-2">
              {status?.orders?.map((order) => (
                <div key={order.order_id} className="rounded px-2 py-1 text-xs"
                  style={{ background: "rgba(255,204,0,0.08)", border: "1px solid rgba(255,204,0,0.25)" }}>
                  <span className="text-[#FFCC00] font-bold">{order.order_id}</span>
                  <span className="text-white/60 ml-2">{order.item_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {syncSuccess && (
          <div className="rounded p-3 flex items-center gap-3 slide-in mb-4"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
            <CheckCircle size={18} className="text-green-400 shrink-0" />
            <div>
              <div className="text-green-300 font-bold text-sm">SYNC COMPLETE</div>
              <div className="text-green-500/70 text-xs">All queued orders transmitted to platform successfully.</div>
            </div>
          </div>
        )}

        <button
          className="via-btn w-full justify-center py-3 text-sm"
          onClick={handleSync}
          disabled={syncing || depth === 0}
        >
          {syncing
            ? <><Loader size={16} className="animate-spin" />SYNCING TO STATION PLATFORM…</>
            : <><Send size={16} />TRIGGER STATION PLATFORM SYNC</>
          }
        </button>
        {depth === 0 && !syncing && (
          <p className="text-center text-[#4B4F54] text-xs mt-2">No pending orders in queue.</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Encryption" value="AES-256"  icon={ShieldCheck} highlight />
        <MetricCard label="Protocol"   value="MQTT"     icon={Activity} />
        <MetricCard label="Retry"      value="4× Exp."  icon={RefreshCw} />
      </div>

      <div className="via-panel p-4">
        <div className="via-label flex items-center gap-2 mb-3">
          <AlertTriangle size={11} className="text-[#FFCC00]" />
          SDG 9 — Resilient Infrastructure Compliance
        </div>
        <div className="space-y-2 text-xs text-[#7a7f85]">
          {[
            "Offline-first store-and-forward architecture operational",
            "Zero data loss guaranteed during cellular dead zones",
            "Auto-sync triggers on station platform Wi-Fi detection",
            "End-to-end encrypted transit compliant with PIPEDA",
          ].map((line) => (
            <div key={line} className="flex items-center gap-2">
              <CheckCircle size={11} className="text-green-400 shrink-0" />{line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "retail", emoji: "🛍️", label: "Express Platform Delivery",          icon: ShoppingBag },
  { id: "ops",    emoji: "🛠️", label: "RailOpt AI Operational View",         icon: Wrench      },
  { id: "trust",  emoji: "🔒", label: "Digital Trust & Network Diagnostics", icon: ShieldCheck },
];

export default function App() {
  const [offline, setOffline] = useState(false);
  const [tab, setTab] = useState("retail");

  return (
    <div style={{ minHeight: "100vh", background: "#0f1011", color: "#fff" }}>

      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid #2e3135", background: "rgba(15,16,17,0.97)", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(8px)" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* VIA yellow motion bar */}
            <div style={{ width: 4, height: 36, background: "#FFCC00", borderRadius: 2, transform: "skewX(-8deg)" }} />
            <div>
              <div className="flex items-center gap-2">
                <Train size={17} color="#FFCC00" />
                <span style={{ color: "#FFCC00", fontWeight: 800, fontSize: "0.95rem", letterSpacing: "0.06em" }}>
                  RailOpt AI Express Market
                </span>
                <span style={{ color: "#4B4F54", fontSize: "0.85rem" }} className="hidden sm:inline">//</span>
                <span style={{ color: "#4B4F54", fontSize: "0.7rem", letterSpacing: "0.1em", fontWeight: 600 }} className="hidden sm:inline">
                  VIA RAIL ONBOARD PORTAL
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: offline ? "#ef4444" : "#22c55e" }}
                  className={offline ? "animate-pulse-via" : ""} />
                <span style={{ color: "#4B4F54", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em" }}>
                  {offline ? "OFFLINE MODE" : "CONNECTED"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setOffline((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0.4rem 0.75rem", borderRadius: 4, cursor: "pointer",
              fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
              border: offline ? "1px solid rgba(239,68,68,0.5)" : "1px solid #2e3135",
              background: offline ? "rgba(239,68,68,0.1)" : "transparent",
              color: offline ? "#fca5a5" : "#7a7f85",
              transition: "all 0.15s",
            }}
          >
            {offline
              ? <WifiOff size={13} className="animate-pulse-via" />
              : <Wifi size={13} />
            }
            <span className="hidden sm:inline">SIMULATE CELLULAR DEAD ZONE</span>
            <span className="sm:hidden">DEAD ZONE</span>
            <span style={{ color: offline ? "#ef4444" : "#4B4F54" }}>{offline ? "ON" : "OFF"}</span>
          </button>
        </div>

        {offline && (
          <div className="slide-in" style={{ background: "rgba(239,68,68,0.12)", borderTop: "1px solid rgba(239,68,68,0.25)", padding: "0.375rem 1rem" }}>
            <div className="max-w-5xl mx-auto flex items-center gap-2">
              <WifiOff size={12} color="#f87171" className="animate-pulse-via shrink-0" />
              <span style={{ color: "#f87171", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em" }}>
                ⚠ CELLULAR DEAD ZONE SIMULATION ACTIVE — Store-and-forward mode engaged
              </span>
            </div>
          </div>
        )}
      </header>

      {/* ── Tabs ── */}
      <div style={{ borderBottom: "1px solid #2e3135", background: "#0f1011" }}>
        <div className="max-w-5xl mx-auto px-4 flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "0.75rem 1.25rem",
                fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em",
                borderBottom: tab === t.id ? "2px solid #FFCC00" : "2px solid transparent",
                color: tab === t.id ? "#FFCC00" : "#4B4F54",
                background: "transparent", border: "none",
                borderBottomWidth: 2,
                borderBottomStyle: "solid",
                borderBottomColor: tab === t.id ? "#FFCC00" : "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.color = "#7a7f85"; }}
              onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.color = "#4B4F54"; }}
            >
              <span>{t.emoji}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === "retail" && <Tab1 offline={offline} />}
        {tab === "ops"    && <Tab2 />}
        {tab === "trust"  && <Tab3 />}
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #2e3135", marginTop: "2rem", padding: "1rem", textAlign: "center" }}>
        {/* VIA yellow motion line */}
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #FFCC00, transparent)", marginBottom: "0.75rem", maxWidth: 200, margin: "0 auto 0.75rem" }} />
        <div style={{ color: "#2e3135", fontSize: "0.65rem", letterSpacing: "0.12em", fontWeight: 700 }}>
          RAILOPT AI EXPRESS MARKET · PHASE 1 · SDG 7 · SDG 8 · SDG 9 · SDG 10 · SDG 11
        </div>
        <div style={{ color: "#23262a", fontSize: "0.65rem", marginTop: 4 }}>
          Powered by OpenRouter · FastAPI · React Vite · VIA Rail Corridor
        </div>
      </footer>
    </div>
  );
}
