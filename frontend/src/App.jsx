import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  Wrench,
  ShieldCheck,
  WifiOff,
  Wifi,
  Zap,
  Truck,
  Gauge,
  CloudLightning,
  CheckCircle,
  RefreshCw,
  Package,
  MapPin,
  Star,
  Activity,
  AlertTriangle,
  Database,
  Send,
  Loader,
  Train,
} from "lucide-react";

const API = "http://localhost:8000/api";

// ─── Shared components ───────────────────────────────────────────────────────

function Badge({ label, type }) {
  const styles =
    type === "Retail"
      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
      : "bg-sky-500/20 text-sky-300 border border-sky-500/40";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full tracking-widest uppercase ${styles}`}>
      {label}
    </span>
  );
}

function MetricCard({ label, value, unit, icon: Icon, color = "amber" }) {
  const cls = { amber: "text-amber-400", green: "text-green-400", sky: "text-sky-400", red: "text-red-400" };
  return (
    <div className="cockpit-panel p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-stone-400 uppercase tracking-widest">
        {Icon && <Icon size={12} className={cls[color]} />}
        {label}
      </div>
      <div className={`text-2xl font-bold ${cls[color]}`}>
        {value}
        {unit && <span className="text-sm text-stone-400 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

// ─── Tab 1 ───────────────────────────────────────────────────────────────────

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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-amber-500 rounded" />
        <div>
          <h2 className="text-amber-400 font-bold text-lg tracking-wide">EXPRESS PLATFORM DELIVERY</h2>
          <p className="text-stone-400 text-xs">Phase 1 — Non-Perishable Local Regional Retail</p>
        </div>
      </div>

      {offline && (
        <div className="cockpit-panel border-red-900/60 bg-red-950/20 p-3 flex items-center gap-3 slide-in">
          <WifiOff size={16} className="text-red-400 shrink-0" />
          <div>
            <span className="text-red-300 text-xs font-bold">CELLULAR DEAD ZONE ACTIVE</span>
            <p className="text-red-400/70 text-xs mt-0.5">
              Orders queued locally — will sync at next station platform.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader size={24} className="animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="cockpit-panel p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge label={item.category} type={item.category} />
                    <div className="flex items-center gap-1 text-xs text-stone-500">
                      <MapPin size={10} />
                      {item.station}
                    </div>
                  </div>
                  <h3 className="text-amber-100 font-bold text-base">{item.name}</h3>
                  <p className="text-stone-400 text-xs mt-1">{item.vendor}</p>
                  <p className="text-stone-500 text-xs mt-1">{item.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-amber-400">{item.price_display}</div>
                  <div className="text-xs text-green-400 flex items-center gap-1 justify-end mt-1">
                    <CheckCircle size={10} />In Stock
                  </div>
                </div>
              </div>

              {/* AI Concierge */}
              <div className="bg-stone-950/60 rounded-lg p-3 border border-amber-900/20 space-y-2">
                <div className="flex items-center gap-2 text-xs text-amber-500 font-bold uppercase tracking-widest">
                  <Star size={11} />
                  RailOpt AI Concierge Personalization
                </div>
                <div className="flex gap-2">
                  <input
                    className="cockpit-input flex-1"
                    placeholder="Describe preferences (e.g. 'gift for outdoorsy friend')…"
                    value={aiPrompts[item.id] || ""}
                    onChange={(e) => setAiPrompts((p) => ({ ...p, [item.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handlePersonalize(item)}
                  />
                  <button
                    className="cockpit-btn-ghost shrink-0 flex items-center gap-1.5"
                    onClick={() => handlePersonalize(item)}
                    disabled={aiLoading[item.id]}
                  >
                    {aiLoading[item.id] ? <Loader size={13} className="animate-spin" /> : <Send size={13} />}
                    Generate
                  </button>
                </div>
                {aiResults[item.id] && (
                  <div className="bg-amber-950/30 border border-amber-800/30 rounded p-3 slide-in">
                    <p className="text-amber-200 text-sm leading-relaxed italic">
                      &ldquo;{aiResults[item.id].script}&rdquo;
                    </p>
                    <p className="text-stone-500 text-xs mt-2">Model: {aiResults[item.id].model_used}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                {queued[item.id] ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                    <CheckCircle size={16} />
                    Queued — {queued[item.id]}
                  </div>
                ) : (
                  <button className="cockpit-btn flex items-center gap-2" onClick={() => handleQueue(item)}>
                    <Package size={14} />
                    Queue Order
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

// ─── Tab 2 ───────────────────────────────────────────────────────────────────

const TRACK_CFG = {
  CLEAR:             { bar: "bg-green-500",  text: "text-green-400",  label: "CLEAR" },
  OCCUPIED_FREIGHT:  { bar: "bg-amber-500",  text: "text-amber-400",  label: "OCCUPIED" },
  HOLD_PASSENGER:    { bar: "bg-orange-500", text: "text-orange-400", label: "HOLD" },
  CONFLICT_CRITICAL: { bar: "bg-red-500",    text: "text-red-400",    label: "CONFLICT" },
  EMERGENCY_SIDING:  { bar: "bg-red-700",    text: "text-red-300",    label: "EMERGENCY SIDING" },
};

function TrackBar({ state, label }) {
  const cfg = TRACK_CFG[state] || TRACK_CFG.CLEAR;
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-stone-400 uppercase tracking-widest">{label}</span>
      <div className={`h-3 w-full rounded-full ${cfg.bar} transition-all duration-500`} />
      <span className={`text-xs font-bold ${cfg.text} tracking-widest`}>{cfg.label}</span>
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

  const statusColors = {
    NO_CONFLICT: "text-green-400",
    MINOR_DELAY: "text-amber-400",
    SIDING_PASS_ACTIVE: "text-orange-400",
    CRITICAL_INTERVENTION: "text-red-400",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-amber-500 rounded" />
        <div>
          <h2 className="text-amber-400 font-bold text-lg tracking-wide">RAILOPT AI OPERATIONAL VIEW</h2>
          <p className="text-stone-400 text-xs">Dual-Track Siding Pass Conflict Engine — SDG 7 Fuel Recovery</p>
        </div>
      </div>

      <div className="cockpit-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs text-stone-400 uppercase tracking-widest flex items-center gap-2">
            <Truck size={12} className="text-amber-500" />
            Freight Train Delay
          </label>
          <span className="text-amber-400 font-bold text-xl">{delay} min</span>
        </div>
        <input
          type="range" min={0} max={60} step={1} value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-stone-700 cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-amber-300"
        />
        <div className="flex justify-between text-xs text-stone-600">
          <span>0 — Nominal</span><span>30 — Siding Pass</span><span>60 — Critical</span>
        </div>
      </div>

      {loading && <div className="flex justify-center py-4"><Loader size={20} className="animate-spin text-amber-500" /></div>}

      {data && !loading && (
        <>
          <div className="cockpit-panel p-4 flex items-center justify-between">
            <span className="text-xs text-stone-400 uppercase tracking-widest">Conflict Status</span>
            <span className={`font-bold text-sm tracking-wide ${statusColors[data.conflict_status] || "text-amber-400"}`}>
              {data.conflict_status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="cockpit-panel p-5 space-y-4">
            <div className="text-xs text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Train size={12} className="text-amber-500" />
              Track Layout — Napanee / Collins Bay Siding
            </div>
            <div className="grid grid-cols-2 gap-6">
              <TrackBar state={data.track_a_state} label="Track A — Mainline" />
              <TrackBar state={data.track_b_state} label="Track B — Siding" />
            </div>
            <div className="bg-stone-950/50 rounded p-3 border border-amber-900/20">
              <p className="text-amber-200/80 text-xs leading-relaxed">
                <span className="text-amber-500 font-bold">AI REC: </span>{data.recommendation}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Fuel Saved"   value={data.sdg7_metrics.fuel_saved_litres} unit="L"   icon={Zap}           color="amber" />
            <MetricCard label="CO₂ Avoided"  value={data.sdg7_metrics.co2_avoided_kg}    unit="kg"  icon={Activity}      color="green" />
            <MetricCard label="Cost Saved"   value={`$${data.sdg7_metrics.cost_saved_cad}`}          icon={Gauge}         color="sky"   />
            <MetricCard label="Infra Score"  value={`${data.infrastructure_score}%`}                  icon={CloudLightning} color={data.infrastructure_score < 60 ? "red" : "amber"} />
          </div>

          <div className="text-center text-xs text-stone-600 uppercase tracking-widest">
            SDG 7 — Affordable and Clean Energy · Efficiency: {data.sdg7_metrics.efficiency_pct}%
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab 3 ───────────────────────────────────────────────────────────────────

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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-amber-500 rounded" />
        <div>
          <h2 className="text-amber-400 font-bold text-lg tracking-wide">DIGITAL TRUST & NETWORK DIAGNOSTICS</h2>
          <p className="text-stone-400 text-xs">Store-and-Forward Queue Monitor — Encrypted Data Packets</p>
        </div>
      </div>

      <div className={`cockpit-panel p-6 ${syncSuccess ? "sync-flash" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-stone-400 uppercase tracking-widest">
            <Database size={12} className="text-amber-500" />
            Live Queue Telemetry
          </div>
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="cockpit-btn-ghost py-1 px-2 flex items-center gap-1 text-xs"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className={`text-4xl font-bold mb-1 transition-all ${depth > 0 ? "text-amber-400 animate-pulse-amber" : "text-green-400"}`}>
              {depth}
            </div>
            <div className="text-xs text-stone-500 uppercase tracking-widest">Orders Queued</div>
          </div>
          <div className="text-center border-x border-stone-800">
            <div className={`text-4xl font-bold mb-1 font-mono transition-all ${bytes > 0 ? "text-amber-300" : "text-stone-600"}`}>
              {bytes.toLocaleString()}
            </div>
            <div className="text-xs text-stone-500 uppercase tracking-widest">Bytes Buffered</div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold mb-1 ${depth > 0 ? "text-orange-400" : "text-green-400"}`}>
              {depth > 0 ? "HOLD" : "IDLE"}
            </div>
            <div className="text-xs text-stone-500 uppercase tracking-widest">Queue State</div>
          </div>
        </div>

        {depth > 0 && (
          <div className="bg-stone-950/60 rounded p-3 border border-amber-900/20 mb-4">
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
              <Activity size={10} className="text-amber-500 animate-pulse-amber" />
              Data Packets Awaiting Sync
            </div>
            <div className="flex flex-wrap gap-2">
              {status?.orders?.map((order) => (
                <div key={order.order_id} className="bg-amber-950/40 border border-amber-800/40 rounded px-2 py-1 text-xs">
                  <span className="text-amber-500 font-bold">{order.order_id}</span>
                  <span className="text-stone-400 ml-2">{order.item_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {syncSuccess && (
          <div className="bg-green-950/30 border border-green-800/40 rounded p-3 flex items-center gap-3 slide-in mb-4">
            <CheckCircle size={18} className="text-green-400 shrink-0" />
            <div>
              <div className="text-green-300 font-bold text-sm">SYNC COMPLETE</div>
              <div className="text-green-500/70 text-xs">All queued orders transmitted to platform successfully.</div>
            </div>
          </div>
        )}

        <button
          className="w-full cockpit-btn flex items-center justify-center gap-3 py-3 text-base"
          onClick={handleSync}
          disabled={syncing || depth === 0}
        >
          {syncing ? (
            <><Loader size={18} className="animate-spin" />SYNCING TO STATION PLATFORM…</>
          ) : (
            <><Send size={18} />TRIGGER STATION PLATFORM SYNC</>
          )}
        </button>
        {depth === 0 && !syncing && (
          <p className="text-center text-stone-500 text-xs mt-2">No pending orders in queue.</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Encryption" value="AES-256"  icon={ShieldCheck} color="green" />
        <MetricCard label="Protocol"   value="MQTT"     icon={Activity}    color="sky"   />
        <MetricCard label="Retry"      value="4× Exp."  icon={RefreshCw}   color="amber" />
      </div>

      <div className="cockpit-panel p-4">
        <div className="text-xs text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <AlertTriangle size={11} className="text-amber-500" />
          SDG 9 — Resilient Infrastructure Compliance
        </div>
        <div className="space-y-2 text-xs text-stone-400">
          {[
            "Offline-first store-and-forward architecture operational",
            "Zero data loss guaranteed during cellular dead zones",
            "Auto-sync triggers on station platform Wi-Fi detection",
            "End-to-end encrypted transit compliant with PIPEDA",
          ].map((line) => (
            <div key={line} className="flex items-center gap-2">
              <CheckCircle size={11} className="text-green-400 shrink-0" />
              {line}
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
    <div className="min-h-screen bg-stone-950 text-amber-100">
      {/* Header */}
      <header className="border-b border-amber-900/30 bg-stone-950/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Train size={18} className="text-amber-500" />
              <span className="text-amber-400 font-bold tracking-widest">RailOpt AI Express Market</span>
              <span className="text-stone-600 hidden sm:inline">//</span>
              <span className="text-stone-500 text-xs hidden sm:inline tracking-widest">ONBOARD PORTAL</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${offline ? "bg-red-500 animate-pulse-amber" : "bg-green-500"}`} />
              <span className="text-xs text-stone-500 tracking-widest">{offline ? "OFFLINE MODE" : "CONNECTED"}</span>
            </div>
          </div>

          <button
            onClick={() => setOffline((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded border transition-all text-xs font-bold tracking-widest ${
              offline
                ? "bg-red-950/60 border-red-600/60 text-red-300"
                : "bg-stone-900 border-amber-900/40 text-stone-400 hover:border-amber-500/40 hover:text-amber-300"
            }`}
          >
            {offline ? <WifiOff size={13} className="animate-pulse-amber" /> : <Wifi size={13} />}
            <span className="hidden sm:inline">SIMULATE CELLULAR DEAD ZONE</span>
            <span className="sm:hidden">DEAD ZONE</span>
            <span className={offline ? "text-red-400" : "text-stone-500"}>{offline ? "ON" : "OFF"}</span>
          </button>
        </div>

        {offline && (
          <div className="bg-red-900/30 border-t border-red-800/40 px-4 py-1.5 slide-in">
            <div className="max-w-5xl mx-auto flex items-center gap-2">
              <WifiOff size={12} className="text-red-400 animate-pulse-amber shrink-0" />
              <span className="text-red-300 text-xs font-bold tracking-widest">
                ⚠ CELLULAR DEAD ZONE SIMULATION ACTIVE — Store-and-forward mode engaged
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="border-b border-amber-900/30 bg-stone-950">
        <div className="max-w-5xl mx-auto px-4 flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 sm:px-5 py-3 text-xs font-bold tracking-wide border-b-2 transition-all ${
                tab === t.id
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-stone-500 hover:text-stone-300 hover:border-stone-600"
              }`}
            >
              <span>{t.emoji}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === "retail" && <Tab1 offline={offline} />}
        {tab === "ops"    && <Tab2 />}
        {tab === "trust"  && <Tab3 />}
      </main>

      <footer className="border-t border-amber-900/20 mt-8 py-4 text-center">
        <div className="text-xs text-stone-600 tracking-widest">
          RAILOPT AI EXPRESS MARKET · PHASE 1 · SDG 7 · SDG 8 · SDG 9 · SDG 10 · SDG 11
        </div>
        <div className="text-xs text-stone-700 mt-1">Powered by OpenRouter · FastAPI · React Vite · VIA Rail Corridor</div>
      </footer>
    </div>
  );
}
