import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingCart, Wrench, ShieldCheck,
  Plus, Trash2, Zap, Truck, Gauge, CloudLightning,
  CheckCircle, RefreshCw, MapPin, Star, Activity,
  AlertTriangle, Database, Send, Loader, Train, X, Compass, Navigation,
  Package, Clock, ChevronRight, ChevronDown, ShoppingBag, Users,
} from "lucide-react";

// ─── Station coordinates (lat, lng) for nearest-station detection ─────────────
const STATION_COORDS = {
  "Toronto":        [43.6452, -79.3806],
  "Ottawa":         [45.4235, -75.6979],
  "Montréal":       [45.4995, -73.5602],
  "Québec":         [46.8139, -71.2082],
  "Kingston":       [44.2334, -76.4814],
  "Cobourg":        [43.9593, -78.1658],
  "Belleville":     [44.1642, -77.3832],
  "Cornwall":       [45.0289, -74.7319],
  "Hamilton":       [43.2557, -79.8711],
  "Kitchener":      [43.4516, -80.4925],
  "London":         [42.9849, -81.2453],
  "Niagara Falls":  [43.1065, -79.0686],
  "Sarnia":         [42.9745, -82.4066],
  "Sudbury":        [46.4917, -80.9930],
  "Windsor":        [42.3149, -83.0364],
  "Halifax":        [44.6488, -63.5752],
  "New Glasgow":    [45.5860, -62.6458],
  "Truro":          [45.3650, -63.2825],
  "Amherst":        [45.8315, -64.2160],
  "Moncton":        [46.0878, -64.7782],
  "Campbellton":    [48.0057, -66.6725],
  "Bathurst":       [47.6165, -65.6499],
  "Miramichi":      [47.0036, -65.5032],
  "Winnipeg":       [49.8951, -97.1384],
  "Thompson":       [55.7435, -97.8553],
  "The Pas":        [53.8244, -101.2533],
  "Churchill":      [58.7684, -94.1650],
  "Saskatoon":      [52.1332, -106.6700],
  "Regina":         [50.4452, -104.6189],
  "Edmonton":       [53.5461, -113.4938],
  "Jasper":         [52.8737, -118.0814],
  "Banff":          [51.1784, -115.5708],
  "Vancouver":      [49.2827, -123.1207],
  "Prince George":  [53.9171, -122.7497],
  "Prince Rupert":  [54.3150, -130.3208],
  "Kamloops":       [50.6745, -120.3273],
  "Baie-Saint-Paul":[47.4454, -70.4906],
  "Rimouski":       [48.4477, -68.5311],
  "Jonquière":      [48.4199, -71.2345],
  "La Tuque":       [47.4571, -72.7898],
  "Senneterre":     [48.3901, -77.2278],
};

// ─── Info Bubble ──────────────────────────────────────────────────────────────
function InfoBubble({ content, color = "#FFCC00" }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const timerRef = useRef(null);
  const btnRef = useRef(null);

  const show = () => {
    clearTimeout(timerRef.current);
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const tipW = 240;
      let left = r.left + r.width / 2 - tipW / 2;
      // Clamp to viewport with 8px padding
      left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
      setPos({ top: r.top + window.scrollY - 8, left });
    }
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 4000);
  };
  const hide = () => { clearTimeout(timerRef.current); setVisible(false); };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>
      <button
        ref={btnRef}
        onMouseEnter={show} onMouseLeave={hide}
        onClick={(e) => { e.stopPropagation(); visible ? hide() : show(); }}
        style={{ background: "none", border: `1.5px solid ${color}`, borderRadius: "50%", width: 18, height: 18, fontSize: "0.65rem", fontWeight: 800, color, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0, flexShrink: 0, touchAction: "manipulation" }}
        aria-label="More info"
      >i</button>
      {visible && (
        <div style={{ position: "fixed", top: pos.top - 8, left: pos.left, transform: "translateY(-100%)", background: "#1c1917", border: `1px solid ${color}40`, borderRadius: 10, padding: "0.65rem 0.85rem", width: 240, zIndex: 9999, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", pointerEvents: "none" }}>
          <div style={{ fontSize: "0.73rem", color: "#e7e5e4", lineHeight: 1.55 }}>{content}</div>
        </div>
      )}
    </span>
  );
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371, d2r = Math.PI / 180;
  const dLat = (lat2 - lat1) * d2r, dLon = (lon2 - lon1) * d2r;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * d2r) * Math.cos(lat2 * d2r) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestStation(lat, lon) {
  let nearest = null, minDist = Infinity;
  for (const [name, [slat, slon]] of Object.entries(STATION_COORDS)) {
    const d = haversineKm(lat, lon, slat, slon);
    if (d < minDist) { minDist = d; nearest = name; }
  }
  return { station: nearest, distanceKm: Math.round(minDist) };
}

const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : window.location.hostname === "localhost"
  ? "http://localhost:8000/api"
  : "/api";

// ─── Product image placeholders ───────────────────────────────────────────────
const ITEM_VISUALS = {
  // Toronto
  "TOR-001": { emoji: "🏭", bg: "#E8F5E9", label: "Distillery Print" },
  "TOR-002": { emoji: "🗼", bg: "#E3F2FD", label: "CN Tower Pin" },
  "TOR-003": { emoji: "🌿", bg: "#FFF8E1", label: "Herb & Spice Kit" },
  "TOR-004": { emoji: "🍯", bg: "#FFF8E1", label: "Wildflower Honey" },
  "TOR-005": { emoji: "🍵", bg: "#E8F5E9", label: "Chamomile Ginger Tea" },
  // Ottawa
  "OTT-001": { emoji: "🍁", bg: "#FCE4EC", label: "Parliament Pin" },
  "OTT-002": { emoji: "🎨", bg: "#E3F2FD", label: "Rideau Canal Print" },
  "OTT-003": { emoji: "📓", bg: "#FFF8E1", label: "Group of Seven Notes" },
  // Belleville
  "BVL-001": { emoji: "📮", bg: "#E8F5E9", label: "Victorian Postcards" },
  "BVL-002": { emoji: "🕯️", bg: "#FFF3E0", label: "Beeswax Candle" },
  "BVL-003": { emoji: "📓", bg: "#E0F7FA", label: "Quinte Journal" },
  // Cornwall
  "CRN-001": { emoji: "🍺", bg: "#FFF3E0", label: "Rurban Pin" },
  "CRN-002": { emoji: "🗺️", bg: "#E3F2FD", label: "St. Lawrence Map" },
  "CRN-003": { emoji: "🚴", bg: "#E8F5E9", label: "Trail Bandana" },
  // Hamilton
  "HAM-001": { emoji: "🌸", bg: "#E8F5E9", label: "Wildflower Kit" },
  "HAM-002": { emoji: "🖼️", bg: "#F3E5F5", label: "Mural Postcards" },
  "HAM-003": { emoji: "🗺️", bg: "#FFF8E1", label: "Escarpment Map" },
  // Kitchener
  "KIT-001": { emoji: "🍺", bg: "#FFF3E0", label: "Oktoberfest Pin" },
  "KIT-002": { emoji: "🍯", bg: "#FFF8E1", label: "Clover Honey" },
  "KIT-003": { emoji: "📓", bg: "#E8F5E9", label: "Victorian Journal" },
  // London
  "LON-001": { emoji: "🗺️", bg: "#E8F5E9", label: "Trail Map" },
  "LON-002": { emoji: "🕯️", bg: "#E0F7FA", label: "Forest Candle" },
  "LON-003": { emoji: "🌳", bg: "#FFF8E1", label: "City Map Print" },
  // Niagara Falls
  "NIA-001": { emoji: "💧", bg: "#E0F7FA", label: "Horseshoe Pin" },
  "NIA-002": { emoji: "🧼", bg: "#FFF3E0", label: "Ice Wine Soap" },
  "NIA-003": { emoji: "📌", bg: "#E8F5E9", label: "Fort George Pin" },
  // Sarnia
  "SAR-001": { emoji: "📖", bg: "#E8F5E9", label: "Dunes Guide" },
  "SAR-002": { emoji: "🌅", bg: "#FFF8E1", label: "Grand Bend Print" },
  "SAR-003": { emoji: "🦴", bg: "#FFF3E0", label: "Fossil Pendant" },
  // Sudbury
  "SUD-001": { emoji: "🪙", bg: "#E3F2FD", label: "Big Nickel Pin" },
  "SUD-002": { emoji: "🎨", bg: "#E8F5E9", label: "Shield Lake Print" },
  "SUD-003": { emoji: "🕯️", bg: "#FFF8E1", label: "Boreal Candle" },
  // Sioux Lookout
  "SLK-001": { emoji: "🪶", bg: "#FFF8E1", label: "Dream Catcher" },
  "SLK-002": { emoji: "🧺", bg: "#F3E5F5", label: "Birchbark Basket" },
  // Windsor
  "WIN-001": { emoji: "🌉", bg: "#E3F2FD", label: "Skyline Print" },
  "WIN-002": { emoji: "🗺️", bg: "#FFF8E1", label: "Walkerville Map" },
  "WIN-003": { emoji: "🛁", bg: "#F3E5F5", label: "Vine Bath Soak" },
  // Ontario
  "KGN-001": { emoji: "🧦", bg: "#FFF8E1", label: "Artisan Knitwear" },
  "KGN-002": { emoji: "🖼️", bg: "#E8F5E9", label: "Heritage Print" },
  "CBG-001": { emoji: "🫙", bg: "#FFF3E0", label: "Small Batch Preserve" },
  // Prince George
  "PG-001":  { emoji: "🧼", bg: "#E8F5E9", label: "Boreal Soap" },
  "PG-002":  { emoji: "📌", bg: "#FFF8E1", label: "Enamel Pins" },
  "PG-003":  { emoji: "🍄", bg: "#F3E5F5", label: "Wild Forage" },
  // Prince Rupert
  "PR-001":  { emoji: "🎨", bg: "#E3F2FD", label: "Indigenous Art" },
  "PR-002":  { emoji: "🌊", bg: "#E0F7FA", label: "Sea Harvest" },
  "PR-003":  { emoji: "🗺️", bg: "#E8F5E9", label: "Trail Map" },
  // Kamloops
  "KAM-001": { emoji: "☕", bg: "#FFF3E0", label: "Craft Coffee" },
  "KAM-002": { emoji: "🕯️", bg: "#FFF8E1", label: "Beeswax Candle" },
  "KAM-003": { emoji: "🐟", bg: "#E3F2FD", label: "Salmon Run Pin" },
  // Saskatchewan
  "SSK-001": { emoji: "🖼️", bg: "#F3E5F5", label: "Linocut Print" },
  "SSK-002": { emoji: "🦬", bg: "#FFF8E1", label: "Bison Pin" },
  "SSK-003": { emoji: "🌸", bg: "#E8F5E9", label: "Wildflower Kit" },
  // Regina
  "REG-001": { emoji: "👮", bg: "#FCE4EC", label: "RCMP Pin" },
  "REG-002": { emoji: "🎨", bg: "#E3F2FD", label: "Wascana Print" },
  "REG-003": { emoji: "🦴", bg: "#FFF8E1", label: "T. Rex Keychain" },
  // Montréal
  "MTL-001": { emoji: "🌿", bg: "#E8F5E9", label: "Market Seed Kit" },
  "MTL-002": { emoji: "⛪", bg: "#E3F2FD", label: "Notre-Dame Print" },
  "MTL-003": { emoji: "🏔️", bg: "#FFF8E1", label: "Mont-Royal Pin" },
  // Québec City
  "QBC-001": { emoji: "🏰", bg: "#FFF3E0", label: "Frontenac Pin" },
  "QBC-002": { emoji: "🗺️", bg: "#E8F5E9", label: "Fortified City Map" },
  "QBC-003": { emoji: "📓", bg: "#E0F7FA", label: "Brew Journal" },
  // Baie-Saint-Paul
  "BSP-001": { emoji: "🎨", bg: "#FCE4EC", label: "Charlevoix Print" },
  "BSP-002": { emoji: "🎶", bg: "#FFF8E1", label: "Le Festif! Pin" },
  "BSP-003": { emoji: "🗺️", bg: "#E8F5E9", label: "Trail Map" },
  // Rimouski
  "RIM-001": { emoji: "🌅", bg: "#E3F2FD", label: "Sunset Print" },
  "RIM-002": { emoji: "🦭", bg: "#E0F7FA", label: "Bic Park Guide" },
  "RIM-003": { emoji: "🧼", bg: "#E8F5E9", label: "Balsam Soap" },
  // Jonquière
  "JON-001": { emoji: "🏔️", bg: "#E3F2FD", label: "Fjord Print" },
  "JON-002": { emoji: "🚴", bg: "#E8F5E9", label: "Bleuets Map" },
  "JON-003": { emoji: "📌", bg: "#FFF8E1", label: "Brewery Pins" },
  // La Tuque
  "LAT-001": { emoji: "🍺", bg: "#FFF3E0", label: "Pécheresse Pin" },
  "LAT-002": { emoji: "📓", bg: "#E8F5E9", label: "Wilderness Journal" },
  "LAT-003": { emoji: "🎶", bg: "#FCE4EC", label: "Félix Leclerc Pin" },
  // Senneterre
  "SEN-001": { emoji: "🛶", bg: "#E0F7FA", label: "Canoe Route Map" },
  "SEN-002": { emoji: "📌", bg: "#E8F5E9", label: "Mont Bell Pin" },
  "SEN-003": { emoji: "🧼", bg: "#FFF8E1", label: "Abitibi Soap" },
  // Halifax
  "HAL-001": { emoji: "🍺", bg: "#FFF3E0", label: "Spruce Brew Kit" },
  "HAL-002": { emoji: "⚓", bg: "#E3F2FD", label: "Citadel Pin" },
  "HAL-003": { emoji: "🗺️", bg: "#E0F7FA", label: "Harbour Chart" },
  // New Glasgow
  "NGL-001": { emoji: "🎶", bg: "#FCE4EC", label: "Jubilee Pin" },
  "NGL-002": { emoji: "🗺️", bg: "#E8F5E9", label: "Cabot Trail Map" },
  "NGL-003": { emoji: "🫙", bg: "#FFF8E1", label: "Lip Balm Set" },
  // Truro
  "TRU-001": { emoji: "🌊", bg: "#E3F2FD", label: "Tidal Bore Print" },
  "TRU-002": { emoji: "🌸", bg: "#E8F5E9", label: "Wildflower Kit" },
  "TRU-003": { emoji: "🧶", bg: "#FFF8E1", label: "Hooked Coasters" },
  // Amherst
  "AMH-001": { emoji: "🍵", bg: "#FFF3E0", label: "Victorian Tea" },
  "AMH-002": { emoji: "🐦", bg: "#E8F5E9", label: "Bird Guide" },
  "AMH-003": { emoji: "📌", bg: "#E3F2FD", label: "Fort Beauséjour Pin" },
  // Campbellton
  "CAM-001": { emoji: "🐟", bg: "#E0F7FA", label: "Salmon Pin" },
  "CAM-002": { emoji: "🗺️", bg: "#E8F5E9", label: "Trail Bandana" },
  "CAM-003": { emoji: "🧼", bg: "#FFF8E1", label: "Balsam Soap" },
  // Bathurst
  "BTH-001": { emoji: "🎨", bg: "#E3F2FD", label: "Chaleur Print" },
  "BTH-002": { emoji: "🐦", bg: "#E8F5E9", label: "Bird Guide" },
  "BTH-003": { emoji: "🕯️", bg: "#FFF3E0", label: "Cedar Candle" },
  // Miramichi
  "MIR-001": { emoji: "☘️", bg: "#E8F5E9", label: "Irish Festival Pin" },
  "MIR-002": { emoji: "📓", bg: "#FFF8E1", label: "Mi'gmaq Journal" },
  "MIR-003": { emoji: "🎣", bg: "#E0F7FA", label: "Fly Tying Kit" },
  // Moncton
  "MON-001": { emoji: "🪨", bg: "#E3F2FD", label: "Hopewell Print" },
  "MON-002": { emoji: "🧂", bg: "#FFF8E1", label: "Acadian Sea Salt" },
  "MON-003": { emoji: "📮", bg: "#FCE4EC", label: "Postcard Set" },
  // Winnipeg
  "WPG-001": { emoji: "🖼️", bg: "#F3E5F5", label: "Mural Print" },
  "WPG-002": { emoji: "🧵", bg: "#FFF8E1", label: "Métis Bookmarks" },
  "WPG-003": { emoji: "🕯️", bg: "#E8F5E9", label: "Prairie Candle" },
  // Thompson
  "THO-001": { emoji: "📖", bg: "#E8F5E9", label: "Field Guide" },
  "THO-002": { emoji: "📌", bg: "#FFF8E1", label: "Spirit Way Pin" },
  "THO-003": { emoji: "🧼", bg: "#E0F7FA", label: "Boreal Soap" },
  // The Pas
  "PAS-001": { emoji: "🪡", bg: "#FCE4EC", label: "Beadwork Keychain" },
  "PAS-002": { emoji: "📌", bg: "#FFF3E0", label: "Festival Pin" },
  "PAS-003": { emoji: "📓", bg: "#E8F5E9", label: "Wilderness Journal" },
  // Churchill
  "CHU-001": { emoji: "🐻‍❄️", bg: "#E3F2FD", label: "Polar Bear Pin" },
  "CHU-002": { emoji: "🎨", bg: "#FFF8E1", label: "Inuit Art Prints" },
  "CHU-003": { emoji: "🌌", bg: "#EDE7F6", label: "Aurora Sky Map" },
  // Edmonton
  "EDM-001": { emoji: "🏒", bg: "#E3F2FD", label: "Oilers Pin" },
  "EDM-002": { emoji: "🌸", bg: "#E8F5E9", label: "Wildflower Kit" },
  "EDM-003": { emoji: "📓", bg: "#FFF8E1", label: "Field Notes" },
  // Jasper
  "JSP-001": { emoji: "🌌", bg: "#EDE7F6", label: "Star Chart" },
  "JSP-002": { emoji: "🧂", bg: "#E0F7FA", label: "Glacier Salts" },
  "JSP-003": { emoji: "🍺", bg: "#FFF3E0", label: "Brew Journal" },
  // Banff
  "BNF-001": { emoji: "🎨", bg: "#E0F7FA", label: "Watercolour Print" },
  "BNF-002": { emoji: "🛁", bg: "#F3E5F5", label: "Alpine Soak" },
  "BNF-003": { emoji: "🗺️", bg: "#E8F5E9", label: "Trail Guide" },
  // Vancouver
  "VAN-001": { emoji: "🍯", bg: "#FFF8E1", label: "Wild Honey" },
  "VAN-002": { emoji: "📖", bg: "#E8F5E9", label: "Field Guide" },
  "VAN-003": { emoji: "🏙️", bg: "#E3F2FD", label: "Linocut Print" },
};

// ─── Cart drawer ──────────────────────────────────────────────────────────────

function OrderConfirmation({ orderNumber, total, itemCount, onClose }) {
  return (
    <div style={{ textAlign: "center", padding: "2rem 1rem 1rem" }}>
      {/* Success icon */}
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F0FDF4", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
        <CheckCircle size={36} color="#22c55e" />
      </div>

      <h2 style={{ fontWeight: 800, fontSize: "1.4rem", color: "#111", margin: "0 0 0.35rem" }}>Order Confirmed!</h2>
      <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 1.5rem" }}>
        {itemCount} item{itemCount !== 1 ? "s" : ""} · <span style={{ fontWeight: 700, color: "#111" }}>${total}</span>
      </p>

      {/* Order number */}
      <div style={{ background: "#F9F9F9", border: "1px solid #E8E8E8", borderRadius: 14, padding: "1rem", marginBottom: "1.25rem" }}>
        <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Order Number</p>
        <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#111", letterSpacing: "0.05em" }}>{orderNumber}</p>
      </div>

      {/* Delivery info */}
      <div style={{ background: "#FFF8E1", border: "1px solid rgba(255,204,0,0.4)", borderRadius: 14, padding: "1rem", marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left" }}>
        <Train size={18} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#92400e", margin: "0 0 2px" }}>Onboard Pickup Zone</p>
          <p style={{ fontSize: "0.78rem", color: "#b45309", margin: 0, lineHeight: 1.5 }}>
            Collect your items at the café car pickup zone — ready within 8 minutes. Products are carried onboard on consignment from local artisans; VIA Rail pays vendors only when a unit sells.
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        style={{ width: "100%", background: "#FFCC00", color: "#111", fontWeight: 800, fontSize: "1rem", border: "none", borderRadius: 50, padding: "0.9rem", cursor: "pointer" }}
      >
        Done
      </button>
    </div>
  );
}

function CartDrawer({ cart, items, onClose, onRemove, onChangeQty, onSync, syncing, confirmed, orderNumber, orderTotal, deadlineSecondsLeft }) {
  const total = cart.reduce((sum, c) => {
    const item = items.find((i) => i.id === c.id);
    return sum + (item ? item.price * c.qty : 0);
  }, 0);
  const itemCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      {/* Backdrop */}
      <div onClick={confirmed ? onClose : undefined} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }} />
      {/* Drawer */}
      <div className="slide-up" style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "#fff", borderRadius: "20px 20px 0 0",
        padding: confirmed ? "1.5rem" : "1.5rem", maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
      }}>
        {confirmed ? (
          <OrderConfirmation
            orderNumber={orderNumber}
            total={orderTotal}
            itemCount={itemCount}
            onClose={onClose}
          />
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <h2 style={{ fontWeight: 800, fontSize: "1.2rem", color: "#111" }}>Your Order</h2>
              <button onClick={onClose} style={{ background: "#F5F5F5", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={18} color="#6b7280" />
              </button>
            </div>

            {deadlineSecondsLeft !== null && deadlineSecondsLeft > 0 && cart.length > 0 && (() => {
              const mins = Math.floor(deadlineSecondsLeft / 60);
              const secs = deadlineSecondsLeft % 60;
              const urgent = deadlineSecondsLeft <= 120;
              return (
                <div style={{ background: urgent ? "#FEF2F2" : "#FFFBF0", border: `1px solid ${urgent ? "#fca5a5" : "#FFCC00"}`, borderRadius: 12, padding: "0.65rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <Train size={14} color={urgent ? "#ef4444" : "#b45309"} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: urgent ? "#991b1b" : "#78350f", flex: 1 }}>
                    Order in the next <span style={{ fontVariantNumeric: "tabular-nums" }}>{mins}:{String(secs).padStart(2, "0")}</span> to receive before next stop
                  </span>
                </div>
              );
            })()}
            {deadlineSecondsLeft === 0 && cart.length > 0 && (
              <div style={{ background: "#FEF2F2", border: "1px solid #fca5a5", borderRadius: 12, padding: "0.65rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} color="#ef4444" />
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#991b1b" }}>Order window closed — your order may arrive at a later stop</span>
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

                <div style={{ borderTop: "1px solid #E8E8E8", paddingTop: "1rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "#111" }}>Order Total</span>
                    <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#111" }}>${total.toFixed(2)}</span>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 4 }}>Pick up at the onboard café zone — ready in ~8 min</p>
                </div>

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
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tab 1: Shop ──────────────────────────────────────────────────────────────

function Tab1({ shopStation = "All", onStationHandled }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState("");
  const [confirmedTotal, setConfirmedTotal] = useState("0.00");
  const [aiResults, setAiResults] = useState({});
  const [aiPersonalizing, setAiPersonalizing] = useState(false);
  const [cartBounceKey, setCartBounceKey] = useState(0);
  const [activeStation, setActiveStation] = useState("All");
  const [locating, setLocating] = useState(false);
  const [locationDismissed, setLocationDismissed] = useState(false);
  const [nearestStation, setNearestStation] = useState(null);
  const [nearestDistanceKm, setNearestDistanceKm] = useState(null);
  const [aiQuery, setAiQuery] = useState("");
  const [aiRecommending, setAiRecommending] = useState(false);
  const [recommendedIds, setRecommendedIds] = useState([]);
  const [aiNoMatch, setAiNoMatch] = useState(false);
  const [orderDeadline, setOrderDeadline] = useState(null);
  const [ecoOnly, setEcoOnly] = useState(false);
  const [indigenousOnly, setIndigenousOnly] = useState(false);
  const [deadlineSecondsLeft, setDeadlineSecondsLeft] = useState(null);

  useEffect(() => {
    if (orderDeadline === null) { setDeadlineSecondsLeft(null); return; }
    const tick = () => {
      const s = Math.round((orderDeadline - Date.now()) / 1000);
      setDeadlineSecondsLeft(s > 0 ? s : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [orderDeadline]);

  useEffect(() => {
    if (shopStation && shopStation !== "All") {
      setActiveStation(shopStation);
      onStationHandled?.();
    }
  }, [shopStation]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { station, distanceKm } = findNearestStation(pos.coords.latitude, pos.coords.longitude);
        setNearestStation(station);
        setNearestDistanceKm(distanceKm);
        setActiveStation(station);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  const handleAiRecommend = async () => {
    if (!aiQuery.trim()) return;
    setAiRecommending(true);
    setRecommendedIds([]);
    setAiNoMatch(false);
    try {
      const r = await fetch(`${API}/ai/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery, station: nearestStation || undefined, distance_km: nearestDistanceKm || undefined }),
      });
      const d = await r.json();
      setRecommendedIds(d.recommended_ids || []);
      setAiNoMatch(!!(d.no_match || (d.recommended_ids || []).length === 0));
    } catch {
      setRecommendedIds([]);
      setAiNoMatch(true);
    }
    setAiRecommending(false);
  };

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
  useEffect(() => { if (items.length > 0) autoPersonalize(items); }, [items.length]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      const next = existing
        ? prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
        : [...prev, { id: item.id, qty: 1 }];
      if (prev.length === 0 && next.length > 0) {
        setOrderDeadline(Date.now() + 8 * 60 * 1000);
      }
      return next;
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
    const total = cart.reduce((s, c) => {
      const item = items.find((i) => i.id === c.id);
      return s + (item ? item.price * c.qty : 0);
    }, 0);
    let orderNum = "";
    try {
      for (const c of cart) {
        const r = await fetch(`${API}/offline-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: c.id, quantity: c.qty }),
        });
        const d = await r.json();
        if (!orderNum) orderNum = d.order?.order_id || "ORD-0001";
      }
    } catch {
      orderNum = `ORD-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    }
    setConfirmedOrderNumber(orderNum);
    setConfirmedTotal(total.toFixed(2));
    // Persist to purchase history
    const historyEntry = {
      orderId: orderNum,
      date: new Date().toISOString(),
      total: total.toFixed(2),
      status: "Confirmed",
      items: cart.map((c) => {
        const item = items.find((i) => i.id === c.id);
        return { id: c.id, name: item?.name || c.id, qty: c.qty, price: item?.price_display || "" };
      }),
    };
    const prev = JSON.parse(localStorage.getItem("railopt_orders") || "[]");
    localStorage.setItem("railopt_orders", JSON.stringify([historyEntry, ...prev]));
    setCart([]);
    setOrderDeadline(null);
    setSyncing(false);
    setConfirmed(true);
  };

  const autoPersonalize = useCallback(async (itemList) => {
    const acct = JSON.parse(localStorage.getItem("railopt_account") || "{}");
    const prefs = [
      acct.trainClass && `travelling ${acct.trainClass} class`,
      acct.preferences?.length && `interests: ${acct.preferences.join(", ")}`,
      acct.dietaryNotes && `dietary notes: ${acct.dietaryNotes}`,
    ].filter(Boolean).join("; ");
    if (!prefs) return;
    setAiPersonalizing(true);
    const targets = itemList.slice(0, 4);
    for (const item of targets) {
      try {
        const r = await fetch(`${API}/ai/personalize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: item.id, preferences: prefs }),
        });
        const d = await r.json();
        setAiResults((p) => ({ ...p, [item.id]: d }));
      } catch { /* silent */ }
      await new Promise((res) => setTimeout(res, 300));
    }
    setAiPersonalizing(false);
  }, []);

  // CO₂ savings vs driving: car ~0.21 kg/km, VIA Rail ~0.04 kg/km/passenger → 0.17 kg/km saved
  // Only show banner when distance is meaningful (≥10 km) to avoid "~0 kg" display
  const co2Saved = nearestDistanceKm >= 10 ? Math.round(nearestDistanceKm * 0.17) : null;

  const stations = ["All", ...Array.from(new Set(items.map((i) => i.station)))];
  const filtered = (activeStation === "All" ? items : items.filter((i) => i.station === activeStation))
    .filter((i) => !ecoOnly || i.sustainable)
    .filter((i) => !indigenousOnly || i.indigenous);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => {
    const item = items.find((i) => i.id === c.id);
    return s + (item ? item.price * c.qty : 0);
  }, 0);

  return (
    <>
      {cartOpen && (
        <CartDrawer
          cart={cart} items={items}
          onClose={() => { setCartOpen(false); setConfirmed(false); }}
          onRemove={removeFromCart} onChangeQty={changeQty}
          onSync={handlePlaceOrder} syncing={syncing}
          confirmed={confirmed} orderNumber={confirmedOrderNumber} orderTotal={confirmedTotal}
          deadlineSecondsLeft={deadlineSecondsLeft}
        />
      )}

      {/* Prosperity Impact chip */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: "0.85rem" }}>
        <span style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 20, padding: "0.2rem 0.65rem", fontSize: "0.7rem", fontWeight: 700, color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
          🌱 Prosperity Impact — SDG 7 · SDG 8 · SDG 10
          <InfoBubble color="#22c55e" content={
            <><strong style={{ color: "#86efac" }}>120+ local products · 41 stations · 8 provinces · 4.4M passengers.</strong>
            {" "}Every purchase goes directly to a local Canadian artisan on consignment — no upfront cost to VIA Rail, vendors paid per sale. Rail emits ~80% less CO₂/km than driving, making every dollar earned onboard zero-marginal-carbon commerce.</>
          } />
        </span>
      </div>

      {/* After-hours notice — VIA Rail cart service ends at 7pm */}
      {new Date().getHours() >= 19 && (
        <div style={{ background: "#1c1917", border: "1px solid #FFCC00", borderRadius: 12, padding: "0.6rem 1rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>🌙</span>
          <span style={{ fontSize: "0.78rem", color: "#fef3c7", lineHeight: 1.4 }}>
            <strong style={{ color: "#FFCC00" }}>Onboard cart service has ended for the night.</strong>
            {" "}Order now — items stocked onboard are ready at the café car zone within minutes. Pre-orders for items not yet onboard will be loaded at your next stop.
          </span>
        </div>
      )}

      {/* Offline-first badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: "0.85rem" }}>
        <span style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 20, padding: "0.2rem 0.65rem", fontSize: "0.7rem", fontWeight: 700, color: "#166534", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          Offline-first — orders queue automatically in no-signal zones
          <InfoBubble color="#22c55e" content="Orders placed in tunnels or remote stretches are stored locally and sync automatically when the train reaches the next station's Wi-Fi. Zero orders lost, even on The Canadian through Northern Ontario." />
        </span>
      </div>

      {/* Location detection banner */}
      {!locationDismissed && !nearestStation && (
        <div className="slide-up" style={{ background: "#FFFBF0", border: "1px solid #FFCC00", borderRadius: 12, padding: "0.75rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Navigation size={15} color="#b45309" />
          <span style={{ fontSize: "0.82rem", color: "#78350f", fontWeight: 600, flex: 1, minWidth: 140 }}>Find products near your train stop</span>
          <button
            onClick={handleDetectLocation}
            disabled={locating}
            style={{ background: "#FFCC00", border: "none", borderRadius: 8, padding: "0.35rem 0.85rem", fontSize: "0.8rem", fontWeight: 700, color: "#1c1917", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            {locating ? <Loader size={12} className="animate-spin" /> : <MapPin size={12} />}
            {locating ? "Detecting…" : "Use My Location"}
          </button>
          <button onClick={() => setLocationDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2 }}><X size={14} /></button>
        </div>
      )}

      {/* Nearest station chip + CO₂ banner */}
      {nearestStation && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.6rem", flexWrap: "wrap" }}>
            <span style={{ background: "#FFCC00", borderRadius: 20, padding: "0.25rem 0.75rem", fontSize: "0.78rem", fontWeight: 700, color: "#1c1917", display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={11} /> Nearest: {nearestStation} (~{nearestDistanceKm} km)
            </span>
            <button onClick={() => { setNearestStation(null); setActiveStation("All"); setRecommendedIds([]); setAiNoMatch(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "0.75rem" }}>✕ Clear</button>
          </div>
          {co2Saved !== null && (
            <div className="slide-up" style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "0.65rem 1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: "1.1rem" }}>🌿</span>
              <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 600 }}>
                {(() => { const trees = Math.max(1, Math.round(co2Saved / 21)); return <>By taking the train you've avoided ~<strong>{co2Saved} kg CO₂</strong> vs. driving this distance — equivalent to planting {trees} {trees === 1 ? "tree" : "trees"}.</>; })()}
              </span>
            </div>
          )}
        </>
      )}

      {/* AI recommendation panel */}
      <div style={{ marginBottom: "1.25rem", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAiRecommend()}
          placeholder="What are you looking for? (e.g. 'a gift for my mom')"
          style={{ flex: 1, minWidth: 220, background: "#fafaf9", border: "1px solid #e7e5e4", borderRadius: 10, padding: "0.55rem 0.85rem", fontSize: "0.82rem", outline: "none", color: "#1c1917" }}
        />
        <button
          onClick={handleAiRecommend}
          disabled={aiRecommending || !aiQuery.trim()}
          style={{ background: aiRecommending || !aiQuery.trim() ? "#e5e7eb" : "#FFCC00", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, color: "#1c1917", cursor: aiRecommending || !aiQuery.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
        >
          {aiRecommending ? <Loader size={13} className="animate-spin" /> : <Zap size={13} />}
          {aiRecommending ? "Finding…" : "AI Picks"}
        </button>
        {(recommendedIds.length > 0 || aiNoMatch) && (
          <button onClick={() => { setRecommendedIds([]); setAiNoMatch(false); }} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 10, padding: "0.5rem 0.75rem", fontSize: "0.78rem", color: "#6b7280", cursor: "pointer" }}>Clear</button>
        )}
      </div>

      {/* Pharmacy nudge — shown as soon as user types a pharmacy keyword */}
      {/advil|tylenol|ibuprofen|medication|medicine|drug|pill|painkiller|cold medicine|cough syrup|pharmacy|aspirin|nyquil|dayquil/i.test(aiQuery) && (
        <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 12, padding: "0.75rem 1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>💊</span>
          <span style={{ fontSize: "0.8rem", color: "#1e40af", fontWeight: 600, lineHeight: 1.4 }}>
            Pharmacy items aren't in the local artisan catalogue — but you can order <strong>Advil, Tylenol, cold medicine</strong> and more via the <strong>Pickup tab</strong>. A Rail Certified Instacart shopper will meet you at the platform.
          </span>
        </div>
      )}

      {/* AI personalization status chip */}
      {(aiPersonalizing || Object.keys(aiResults).length > 0) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.6rem" }}>
          <span style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 20, padding: "0.2rem 0.65rem", fontSize: "0.7rem", fontWeight: 700, color: "#92400e", display: "flex", alignItems: "center", gap: 5 }}>
            {aiPersonalizing
              ? <><Loader size={9} className="animate-spin" /> Personalizing your feed…</>
              : <><Zap size={9} color="#FFCC00" /> AI-personalized from your profile</>
            }
          </span>
        </div>
      )}

      {/* Station filter — compact row: eco toggle + dropdown */}
      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.25rem", alignItems: "center" }}>
        <button
          onClick={() => setEcoOnly((v) => !v)}
          style={{
            flexShrink: 0, padding: "0.45rem 0.9rem", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
            background: ecoOnly ? "#dcfce7" : "#f5f5f4",
            color: ecoOnly ? "#166534" : "#6b7280",
            border: ecoOnly ? "1.5px solid #86efac" : "1.5px solid #e7e5e4",
          }}
        >
          🌿 Eco Picks
        </button>
        <button
          onClick={() => setIndigenousOnly((v) => !v)}
          style={{
            flexShrink: 0, padding: "0.45rem 0.9rem", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
            background: indigenousOnly ? "#fef3c7" : "#f5f5f4",
            color: indigenousOnly ? "#92400e" : "#6b7280",
            border: indigenousOnly ? "1.5px solid #fcd34d" : "1.5px solid #e7e5e4",
          }}
        >
          🪶 Indigenous
        </button>
        <select
          value={activeStation}
          onChange={(e) => setActiveStation(e.target.value)}
          style={{
            flex: 1, padding: "0.45rem 0.85rem", borderRadius: 20, fontSize: "0.82rem", fontWeight: 700,
            border: activeStation !== "All" ? "1.5px solid #FFCC00" : "1.5px solid #e7e5e4",
            background: activeStation !== "All" ? "#fffbeb" : "#fafaf9",
            color: "#111", cursor: "pointer", outline: "none", appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", paddingRight: "2rem",
          }}
        >
          {stations.map((s) => (
            <option key={s} value={s}>{s === "All" ? "🚉 All Stations" : s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
          <Loader size={24} color="#FFCC00" className="animate-spin" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
          {recommendedIds.length > 0 && (
            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8, margin: "0.25rem 0 0.5rem" }}>
              <Zap size={14} color="#b45309" />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#78350f" }}>AI picks for "{aiQuery}"</span>
            </div>
          )}
          {aiNoMatch && recommendedIds.length === 0 && (() => {
            const pharmacyTerms = /advil|tylenol|ibuprofen|medication|medicine|drug|pill|painkiller|panadol|cold medicine|cough|pharmacy|otc|prescription|aspirin/i;
            const isPharmacy = pharmacyTerms.test(aiQuery);
            return (
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 8, margin: "0.25rem 0 0.5rem" }}>
                <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 12, padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: 10 }}>
                  <AlertTriangle size={15} color="#a16207" />
                  <span style={{ fontSize: "0.82rem", color: "#78350f", fontWeight: 600 }}>
                    Nothing in the local artisan catalogue matches "{aiQuery}".
                  </span>
                </div>
                {isPharmacy && (
                  <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 12, padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "1rem" }}>💊</span>
                    <span style={{ fontSize: "0.82rem", color: "#1e40af", fontWeight: 600 }}>
                      For pharmacy items (Advil, Tylenol, etc.) try the <strong>Pickup tab</strong> — order from any nearby pharmacy via Instacart and collect at the platform.
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
          {(recommendedIds.length > 0
            ? [...filtered].sort((a, b) => {
                const ai = recommendedIds.indexOf(a.id);
                const bi = recommendedIds.indexOf(b.id);
                if (ai !== -1 && bi !== -1) return ai - bi;
                if (ai !== -1) return -1;
                if (bi !== -1) return 1;
                return 0;
              })
            : filtered
          ).map((item) => {
            const vis = ITEM_VISUALS[item.id] || { emoji: "📦", bg: "#f5f5f5", label: "Local Product" };
            const inCart = cart.find((c) => c.id === item.id);
            const isAiPick = recommendedIds.includes(item.id);
            return (
              <div key={item.id} className="card slide-up" style={{ display: "flex", flexDirection: "column", ...(isAiPick ? { border: "2px solid #FFCC00", boxShadow: "0 0 0 3px rgba(255,204,0,0.18)" } : {}) }}>
                {/* Image area */}
                <div style={{ background: vis.bg, height: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, position: "relative" }}>
                  {isAiPick && (
                    <span style={{ position: "absolute", top: 6, right: 6, background: "#FFCC00", borderRadius: 6, padding: "2px 7px", fontSize: "0.62rem", fontWeight: 800, color: "#1c1917", display: "flex", alignItems: "center", gap: 3 }}>
                      <Zap size={9} /> AI Pick
                    </span>
                  )}
                  {item.indigenous && (
                    <span style={{ position: "absolute", top: item.sustainable ? 28 : 6, left: 6, background: "#fef3c7", borderRadius: 6, padding: "2px 7px", fontSize: "0.62rem", fontWeight: 800, color: "#92400e", display: "flex", alignItems: "center", gap: 3 }}>
                      🪶 Indigenous
                    </span>
                  )}
                  {item.sustainable && (
                    <span style={{ position: "absolute", top: 6, left: 6, background: "#dcfce7", borderRadius: 6, padding: "2px 7px", fontSize: "0.62rem", fontWeight: 800, color: "#166534", display: "flex", alignItems: "center", gap: 3 }}>
                      🌿 Eco
                    </span>
                  )}
                  {!item.sustainable && !item.indigenous && (
                    <span style={{ position: "absolute", top: 6, left: 6, background: "#fff0f0", borderRadius: 6, padding: "2px 7px", fontSize: "0.62rem", fontWeight: 800, color: "#b91c1c", display: "flex", alignItems: "center", gap: 3 }}>
                      🍁 Canada
                    </span>
                  )}
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

                  {/* Ambient AI tagline — appears automatically from Account preferences */}
                  {aiResults[item.id] && (
                    <p style={{ fontSize: "0.68rem", color: "#78350f", lineHeight: 1.45, fontStyle: "italic", background: "#FFF8E1", borderRadius: 7, padding: "0.4rem 0.6rem", margin: "0.1rem 0", display: "flex", alignItems: "flex-start", gap: 4 }}>
                      <Zap size={9} color="#FFCC00" style={{ flexShrink: 0, marginTop: 2 }} />
                      {aiResults[item.id].script}
                    </p>
                  )}

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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {deadlineSecondsLeft !== null && deadlineSecondsLeft > 0 && (
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.75, fontVariantNumeric: "tabular-nums" }}>
                    ⏱ {Math.floor(deadlineSecondsLeft / 60)}:{String(deadlineSecondsLeft % 60).padStart(2, "0")}
                  </span>
                )}
                <span>${cartTotal.toFixed(2)}</span>
              </div>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1.5rem", marginBottom: "1rem" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "1rem", marginBottom: "1.5rem", textAlign: "center" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem" }}>
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

// ─── Tab 4: Discover ─────────────────────────────────────────────────────────

const DESTINATIONS = [
  {
    "id": "prince-george",
    "name": "Prince George",
    "province": "British Columbia",
    "tagline": "Northern BC's boreal hub",
    "emoji": "🌲",
    "hero_color": "#1a3a2a",
    "highlights": [
      "Prince George Astronomical Observatory — breathtaking celestial views",
      "Two Rivers Gallery — immerse yourself in Canadian art",
      "Central BC Railway & Forestry Museum — the industries that shaped the north",
      "Teapot Mountain — 360° view of surrounding forests and wetlands",
      "Cottonwood Island Nature Park — walk along the Nechako River shoreline"
    ],
    "vibe": [
      "🎨 Arts & Culture",
      "🥾 Hiking",
      "🌿 Nature",
      "🚂 Rail Heritage"
    ],
    "popular_routes": [
      "Jasper → Prince George",
      "Prince George → Prince Rupert"
    ]
  },
  {
    "id": "prince-rupert",
    "name": "Prince Rupert",
    "province": "British Columbia",
    "tagline": "Wild Pacific North Coast",
    "emoji": "🐻",
    "hero_color": "#0d2233",
    "highlights": [
      "Khutzeymateen Grizzly Sanctuary — watch brown bears in their natural habitat",
      "Museum of Northern BC — home of the Ts'msyen People's history",
      "North Pacific Cannery National Historic Site (May–Sep)",
      "Humpback whale watching tours from the harbour",
      "Mount Hayes — panoramic view of the Pacific Ocean and nearby islands"
    ],
    "vibe": [
      "🐋 Wildlife",
      "🏔️ Adventure",
      "🎣 Fishing",
      "🏛️ Indigenous Culture"
    ],
    "popular_routes": [
      "Jasper → Prince Rupert"
    ]
  },
  {
    "id": "kamloops",
    "name": "Kamloops",
    "province": "British Columbia",
    "tagline": "Sunny interior at the river junction",
    "emoji": "🚵",
    "hero_color": "#2d1f0a",
    "highlights": [
      "Kamloops Farmers' Markets — fresh local produce on Sat & Wed",
      "Kweseltken Artisan Market — traditional foods and handmade goods",
      "Kamloops Bike Ranch — world-class mountain biking trails",
      "Adams River Sockeye Salmon Run — waters turn red (late Sep–mid Oct)",
      "Tsútswecw Provincial Park — 26 km of trails"
    ],
    "vibe": [
      "🚵 Mountain Biking",
      "🎭 Arts",
      "🍺 Craft Beer",
      "🐟 Nature"
    ],
    "popular_routes": [
      "Vancouver → Kamloops",
      "Edmonton → Kamloops",
      "Toronto → Kamloops"
    ]
  },
  {
    "id": "vancouver",
    "name": "Vancouver",
    "province": "British Columbia",
    "tagline": "Pacific metropolis between ocean and mountains",
    "emoji": "🌊",
    "hero_color": "#0a1f2d",
    "highlights": [
      "Stanley Park — 1,000-acre rainforest with 10 km ocean seawall",
      "Granville Island Public Market — fresh local produce and artisan goods",
      "Museum of Anthropology — 50,000+ works from cultures worldwide",
      "Canada's largest Chinatown — Dr. Sun Yat-Sen Classical Chinese Garden",
      "Capilano Suspension Bridge and Grouse Mountain (North Vancouver)"
    ],
    "vibe": [
      "🏙️ Urban",
      "🌊 Ocean",
      "🎨 Culture",
      "🌿 Green Spaces"
    ],
    "popular_routes": [
      "Toronto → Vancouver",
      "Edmonton → Vancouver",
      "Montréal → Vancouver"
    ]
  },
  {
    "id": "saskatoon",
    "name": "Saskatoon",
    "province": "Saskatchewan",
    "tagline": "Prairie city on the South Saskatchewan River",
    "emoji": "🌾",
    "hero_color": "#1a1000",
    "highlights": [
      "Remai Modern — world-class contemporary art museum with the largest Picasso linocut collection",
      "Wanuskewin Heritage Park NHS — Plains bison herd and Canada's longest-running archaeological dig",
      "Meewasin Valley Trails — stunning river and skyline views along the South Saskatchewan",
      "Black Fox Farm & Distillery — award-winning SE Eleven whisky from prairie-grown botanicals",
      "Saskatoon Fringe Festival & Jazz Festival — a vibrant summer cultural calendar"
    ],
    "vibe": [
      "🎨 Modern Art",
      "🦬 Indigenous Heritage",
      "🎶 Festivals",
      "🚴 River Trails"
    ],
    "popular_routes": [
      "Toronto → Saskatoon",
      "Vancouver → Saskatoon",
      "Winnipeg → Saskatoon"
    ]
  },
  {
    "id": "regina",
    "name": "Regina",
    "province": "Saskatchewan",
    "tagline": "The Queen City on the prairies",
    "emoji": "👑",
    "hero_color": "#1a0510",
    "highlights": [
      "RCMP Heritage Centre — the full history of Canada's national police force from 1873 to today",
      "Royal Saskatchewan Museum — see Scotty, the world's largest T. rex, in full life-size cast",
      "Wascana Centre — 930-hectare urban park with a 120-hectare lake in the city's heart",
      "Saskatchewan Science Centre & Kramer IMAX Theatre — 150+ hands-on exhibits",
      "Over the Hill Orchards & Winery — organic prairie fruit wines with Qu'Appelle Valley views"
    ],
    "vibe": [
      "👮 RCMP Heritage",
      "🦕 Dinosaurs",
      "🌊 Urban Lake",
      "🍷 Prairie Wine"
    ],
    "popular_routes": [
      "Toronto → Saskatoon",
      "Vancouver → Saskatoon",
      "Winnipeg → Saskatoon"
    ]
  },
  {
    "id": "montréal",
    "name": "Montréal",
    "province": "Québec",
    "tagline": "The francophone metropolis of North America",
    "emoji": "🗼",
    "hero_color": "#1a0a1a",
    "highlights": [
      "Old Montréal & Notre-Dame Basilica — cobblestone streets and neo-Gothic grandeur",
      "Mont-Royal — climb to the Kondiaronk Belvedere for a sweeping city panorama",
      "Jean Talon Market & Mile-End — the culinary and creative soul of the city",
      "Quartier des Spectacles — the epicentre of Montréal's world-class festival scene",
      "Lachine Canal — bike or canoe through the city's beloved historic waterway"
    ],
    "vibe": [
      "🎶 Festivals",
      "🍽️ Food Scene",
      "🎨 Arts",
      "🚲 Cycling"
    ],
    "popular_routes": [
      "Toronto → Montréal",
      "Ottawa → Montréal",
      "Québec → Montréal"
    ]
  },
  {
    "id": "québec",
    "name": "Québec",
    "province": "Québec",
    "tagline": "North America's only walled city above the St. Lawrence",
    "emoji": "🏰",
    "hero_color": "#1a0f00",
    "highlights": [
      "Old Québec (UNESCO) — cobblestone streets, the Château Frontenac, and Terrasse Dufferin",
      "Fortifications of Québec — the largest British fortress in North America still occupied",
      "Saint-Louis Forts and Châteaux NHS — 200+ years of archaeological history",
      "Saint-Jean-Baptiste & Limoilou — craft breweries, gourmet shops, and neighbourhood gems",
      "Plains of Abraham — vast urban park above the St. Lawrence with sweeping river views"
    ],
    "vibe": [
      "🏰 History",
      "🍺 Craft Beer",
      "🛍️ Artisan Shops",
      "🌿 Parks"
    ],
    "popular_routes": [
      "Montréal → Québec",
      "Ottawa → Québec",
      "Toronto → Québec"
    ]
  },
  {
    "id": "baie-saint-paul",
    "name": "Baie-Saint-Paul",
    "province": "Québec",
    "tagline": "Charlevoix's art capital by the St. Lawrence",
    "emoji": "🎨",
    "hero_color": "#0a1a2a",
    "highlights": [
      "Charlevoix art galleries — world-renowned concentration of fine art in a small riverside town",
      "Le Festif! music festival — a beloved outdoor celebration of indie and folk music each summer",
      "Parc national des Grands-Jardins — subarctic caribou habitat and lichen-covered boreal landscape",
      "Parc national des Hautes-Gorges-de-la-Rivière-Malbaie — dramatic fjord canyon hiking",
      "La Malbaie & Saint-Irénée — charming riverside villages with beaches and local cuisine"
    ],
    "vibe": [
      "🎨 Fine Arts",
      "🎶 Music",
      "🥾 Hiking",
      "🌲 Boreal Nature"
    ],
    "popular_routes": [
      "Montréal → Québec",
      "Toronto → Québec"
    ]
  },
  {
    "id": "rimouski",
    "name": "Rimouski",
    "province": "Québec",
    "tagline": "Where the St. Lawrence meets the mountains",
    "emoji": "🦭",
    "hero_color": "#0a1f1a",
    "highlights": [
      "Promenade de la Mer — scenic coastal walking trail along the St. Lawrence shore",
      "Île Saint-Barnabé — a short excursion offshore for Québec's most spectacular sunsets",
      "Parc national du Bic — bays, cliffs, islands, and harbour seals on the lower St. Lawrence",
      "Route des Monts Notre-Dame — forests, lakes, and farmland through the Chic-Chocs foothills",
      "Rimouski waterfront dining — fresh Atlantic seafood in a laid-back Bas-Saint-Laurent setting"
    ],
    "vibe": [
      "🦭 Wildlife",
      "🌅 Sunsets",
      "🥾 Hiking",
      "🌊 Coastal"
    ],
    "popular_routes": [
      "Montréal → Rimouski",
      "Québec → Rimouski"
    ]
  },
  {
    "id": "jonquière",
    "name": "Jonquière",
    "province": "Québec",
    "tagline": "Gateway to the Saguenay Fjord",
    "emoji": "🏔️",
    "hero_color": "#0d0a1a",
    "highlights": [
      "Saguenay Fjord — one of Canada's most dramatic landscapes; granite walls plunging into glacial waters",
      "Véloroute des Bleuets — 256 km cycling loop around Lac Saint-Jean through blueberry country",
      "Parc national des Monts-Valin — hiking and skiing among peaks capped in snow-white fir trees",
      "Saguenay microbreweries — regional craft beers brewed with blueberries and boreal botanicals",
      "Camping, kayaking, and wildlife watching in a pristine Saguenay–Lac-Saint-Jean wilderness"
    ],
    "vibe": [
      "🏔️ Fjord & Mountains",
      "🚴 Cycling",
      "🍺 Craft Beer",
      "🫐 Blueberry Country"
    ],
    "popular_routes": [
      "Montréal → Jonquière",
      "Québec → Jonquière"
    ]
  },
  {
    "id": "la-tuque",
    "name": "La Tuque",
    "province": "Québec",
    "tagline": "Haute-Mauricie wilderness with an urban flair",
    "emoji": "🎣",
    "hero_color": "#0f1a0a",
    "highlights": [
      "Parc des Chutes-de-la-Petite-Rivière-Bostonnais — waterfall trails in the heart of the city",
      "La Pécheresse Microbrewery — craft beers with conifers, raspberry, and ground cherry",
      "Haute-Mauricie fishing lodges — legendary rivers and lakes for salmon and trout fishing",
      "Félix-Leclerc Cultural Complex — celebrating Québec's beloved folk poet and singer",
      "Canoeing, hiking, cycling, and beach day trips through the surrounding boreal wilderness"
    ],
    "vibe": [
      "🎣 Fishing",
      "🍺 Microbrewery",
      "🎶 Folk Culture",
      "🌲 Boreal"
    ],
    "popular_routes": [
      "Montréal → Senneterre"
    ]
  },
  {
    "id": "senneterre",
    "name": "Senneterre",
    "province": "Québec",
    "tagline": "Abitibi's untamed boreal wilderness",
    "emoji": "🌲",
    "hero_color": "#0a1a05",
    "highlights": [
      "Boreal forest lodges — remote wilderness camps for fishing, hiking, and canoe-tripping",
      "Mont Bell — backcountry hiking and skiing in the Abitibi highlands",
      "Chute à Grandmaison trail — a scenic pedestrian path through old-growth boreal forest",
      "Paddling the Nottaway and Bell River systems — pristine routes through untouched wilderness",
      "One of the last places in Québec accessible only by train — a true end-of-the-line adventure"
    ],
    "vibe": [
      "🌲 Boreal Wilderness",
      "🎿 Backcountry Skiing",
      "🛶 Canoeing",
      "🎣 Fishing"
    ],
    "popular_routes": [
      "Montréal → Senneterre"
    ]
  },
  {
    "id": "halifax",
    "name": "Halifax",
    "province": "Nova Scotia",
    "tagline": "Canada's Ocean Playground capital",
    "emoji": "⚓",
    "hero_color": "#0a1a2a",
    "highlights": [
      "Halifax Waterfront Boardwalk — 4 km stroll past the oldest farmers' market in North America (270+ years)",
      "Halifax Citadel National Historic Site — Canada's most-visited National Historic Site",
      "Peggy's Cove & Lunenburg — iconic coastal villages a day trip from the city",
      "Canadian Museum of Immigration at Pier 21 — Canada's Ellis Island",
      "Craft breweries with unique local ingredients — spruce, maple, lobster, and jalapeño"
    ],
    "vibe": [
      "⚓ Maritime",
      "🍺 Craft Beer",
      "🏛️ History",
      "🌊 Ocean"
    ],
    "popular_routes": [
      "Montréal → Halifax",
      "Toronto → Halifax",
      "Moncton → Halifax"
    ]
  },
  {
    "id": "new-glasgow",
    "name": "New Glasgow",
    "province": "Nova Scotia",
    "tagline": "Gateway to Pictou County and Cape Breton",
    "emoji": "🎶",
    "hero_color": "#1a0f1a",
    "highlights": [
      "Glasgow Square Jubilee — three-day East Coast music festival at the outdoor amphitheater",
      "Museum of Industry — Nova Scotia's industrial history from the 19th and 20th centuries",
      "Cape Breton Island & Cabot Trail — one of the world's great scenic coastal drives",
      "Pictou — Hector Heritage Quay, Northumberland Fishing Museum, and ferry to Pictou Island",
      "Antigonish — Highland Heart of Nova Scotia with Steinhart Distillery and Cape George Lighthouse"
    ],
    "vibe": [
      "🎶 East Coast Music",
      "🏛️ History",
      "🥾 Hiking",
      "🎻 Celtic Culture"
    ],
    "popular_routes": [
      "Montréal → Halifax",
      "Toronto → Halifax",
      "Moncton → Halifax"
    ]
  },
  {
    "id": "truro",
    "name": "Truro",
    "province": "Nova Scotia",
    "tagline": "Colchester County and the Bay of Fundy tides",
    "emoji": "🌊",
    "hero_color": "#0d1f1a",
    "highlights": [
      "Tidal Bore — watch the Bay of Fundy surge up the Salmon River twice daily",
      "Victoria Park — one of Nova Scotia's oldest public parks with 20 km of trails and Jacob's Ladder",
      "Cobequid Trail — spectacular countryside views of streams, waterfalls, and stone walls",
      "Rogart Mountain — hiking paths with panoramic Nova Scotia vistas",
      "Inglis Street — charming downtown strip with local artisan studios and boutiques"
    ],
    "vibe": [
      "🌊 Bay of Fundy",
      "🥾 Hiking",
      "🎨 Artisan",
      "🏛️ Heritage"
    ],
    "popular_routes": [
      "Montréal → Halifax",
      "Toronto → Halifax",
      "Moncton → Halifax"
    ]
  },
  {
    "id": "amherst",
    "name": "Amherst",
    "province": "Nova Scotia",
    "tagline": "Victorian charm at the Nova Scotia gateway",
    "emoji": "🏛️",
    "hero_color": "#1a1a0a",
    "highlights": [
      "Victorian Heritage District — beautifully restored 19th-century homes converted to inns and shops",
      "Birkinshaw's Tea Room — Canada's 'Tea Room of the Year' for classic high tea",
      "Fort Beauséjour National Historic Site — 1751 French fortress with underground stone tunnels",
      "Tantramar Salt Marshes — a birder's paradise at the NB–NS border",
      "Amherst Point Bird Sanctuary — spot American black ducks, pintails, and blue-winged teals"
    ],
    "vibe": [
      "🏛️ Victorian Heritage",
      "🍵 Tea Culture",
      "🐦 Birding",
      "🌿 Marshlands"
    ],
    "popular_routes": [
      "Montréal → Halifax",
      "Toronto → Halifax",
      "Moncton → Halifax"
    ]
  },
  {
    "id": "campbellton",
    "name": "Campbellton",
    "province": "New Brunswick",
    "tagline": "Atlantic salmon country on Restigouche Bay",
    "emoji": "🐟",
    "hero_color": "#0a1f1a",
    "highlights": [
      "Restigouche Sam — visit the world's largest Atlantic salmon replica on the waterfront",
      "Mount Sugarloaf Provincial Park — hiking, mountain biking, and skiing in season",
      "Restigouche River — world-class salmon fishing and scenic paddling routes",
      "Waterfront boardwalk — picnic at sunset over the mouth of the Restigouche",
      "Snowmobiling and cross-country skiing through forested river valleys in winter"
    ],
    "vibe": [
      "🐟 Fishing",
      "🥾 Hiking",
      "🎿 Winter Sports",
      "🌊 Waterfront"
    ],
    "popular_routes": [
      "Bathurst → Montréal",
      "Montréal → Halifax"
    ]
  },
  {
    "id": "bathurst",
    "name": "Bathurst",
    "province": "New Brunswick",
    "tagline": "Golden beaches on Chaleur Bay",
    "emoji": "🏖️",
    "hero_color": "#0a1a2a",
    "highlights": [
      "Chaleur Bay — some of the warmest saltwater beaches in Atlantic Canada",
      "Youghall Beach — golden sand, warm water, and a scenic boardwalk",
      "Daly Point Nature Reserve — 100 acres of Acadian forest and marshland with migratory birds",
      "Nepisiguit Mi'gmaq Trail — 140 km path from Daly Point to Mount Carleton",
      "Pabineau Falls — a spectacular waterfall stop along the Nepisiguit corridor"
    ],
    "vibe": [
      "🏖️ Beach",
      "🐦 Birding",
      "🥾 Hiking",
      "⛳ Golf"
    ],
    "popular_routes": [
      "Montréal → Bathurst",
      "Halifax → Bathurst",
      "Bathurst → Montréal"
    ]
  },
  {
    "id": "miramichi",
    "name": "Miramichi",
    "province": "New Brunswick",
    "tagline": "Canada's Irish capital on the salmon river",
    "emoji": "🎣",
    "hero_color": "#1a0f0a",
    "highlights": [
      "Miramichi River — one of the world's most legendary Atlantic salmon fishing rivers",
      "Miramichi Irish Festival — Canada's Irish capital celebrates its heritage every summer",
      "Metepenagiag Heritage Park — Mi'gmaq archeological sites with interpretive trails",
      "Beaubears Island — immerse yourself in the shipbuilding and Acadian history",
      "Ritchie Wharf — shipbuilding-themed waterfront park with dining and river excursions"
    ],
    "vibe": [
      "🎣 Salmon Fishing",
      "🎶 Folk Music",
      "🏛️ Indigenous Culture",
      "🛶 River Life"
    ],
    "popular_routes": [
      "Montréal → Halifax",
      "Québec → Halifax",
      "Toronto → Halifax"
    ]
  },
  {
    "id": "moncton",
    "name": "Moncton",
    "province": "New Brunswick",
    "tagline": "Acadian heart of the Bay of Fundy",
    "emoji": "🌊",
    "hero_color": "#0d1a1f",
    "highlights": [
      "Hopewell Rocks Provincial Park — 20 spectacular flowerpot monoliths shaped by the world's highest tides",
      "Tidal Bore — watch the Bay of Fundy surge through downtown Moncton twice daily",
      "Shediac — lobster capital of the world, with beaches and warm Northumberland Strait waters",
      "Capitol Theater & Aberdeen Cultural Centre — a thriving bilingual arts scene",
      "Magnetic Hill Zoo, Magic Mountain, and Resurgo Museum for family adventures"
    ],
    "vibe": [
      "🌊 Bay of Fundy",
      "🦞 Seafood",
      "🎭 Arts & Culture",
      "🏖️ Beaches"
    ],
    "popular_routes": [
      "Montréal → Moncton",
      "Toronto → Moncton",
      "Halifax → Moncton"
    ]
  },
  {
    "id": "winnipeg",
    "name": "Winnipeg",
    "province": "Manitoba",
    "tagline": "Where the prairies meet the arts",
    "emoji": "🎨",
    "hero_color": "#1a0a2e",
    "highlights": [
      "VIA Rail Winnipeg Union Station — a beaux-arts landmark (not Toronto's Union Station — Winnipeg's own)",
      "The Forks National Historic Site — where the Red and Assiniboine Rivers meet; steps from the platform",
      "Canadian Museum for Human Rights — one of the world's most striking museum buildings",
      "Exchange District — 600+ outdoor murals, boutiques, galleries, and local restaurants",
      "Assiniboine Park Zoo — 150+ animal species in a year-round urban oasis"
    ],
    "vibe": [
      "🎨 Street Art",
      "🏛️ Museums",
      "🎭 Performing Arts",
      "🌿 River Parks"
    ],
    "popular_routes": [
      "Toronto → Winnipeg",
      "Vancouver → Winnipeg",
      "Edmonton → Winnipeg"
    ]
  },
  {
    "id": "thompson",
    "name": "Thompson",
    "province": "Manitoba",
    "tagline": "Northern Manitoba's boreal gateway",
    "emoji": "🌲",
    "hero_color": "#0d1f0d",
    "highlights": [
      "Spirit Way — 2 km cultural trail with 15 heritage points of interest",
      "Millennium Trail — 15 km loop through the surrounding boreal forest",
      "Heritage North Museum — fur trade artifacts, fossils, and boreal forest diorama",
      "Pisew Falls Provincial Park — hike to Manitoba's two highest waterfalls",
      "Mystery Mountain Winter Park — skiing and snowboarding in the boreal"
    ],
    "vibe": [
      "🥾 Hiking",
      "🎿 Winter Sports",
      "🦌 Wildlife",
      "🌲 Boreal Forest"
    ],
    "popular_routes": [
      "Winnipeg → Churchill",
      "Churchill → Winnipeg"
    ]
  },
  {
    "id": "the-pas",
    "name": "The Pas",
    "province": "Manitoba",
    "tagline": "Gateway to the North",
    "emoji": "🏕️",
    "hero_color": "#0f1a0a",
    "highlights": [
      "Clearwater Lake Provincial Park — white sand beaches and turquoise crystalline waters",
      "Opaskwayak Cree Nation — vibrant Indigenous community with crafts and cultural events",
      "Northern Manitoba Trappers' Festival — one of Canada's oldest winter carnivals",
      "Bill Bannock Ice Fishing Derby — a beloved northern tradition on frozen lakes",
      "Canoeing and fishing on surrounding boreal lakes and rivers"
    ],
    "vibe": [
      "🏕️ Camping",
      "🎣 Fishing",
      "🛶 Canoeing",
      "🏛️ Indigenous Culture"
    ],
    "popular_routes": [
      "Winnipeg → Churchill",
      "Churchill → Winnipeg"
    ]
  },
  {
    "id": "churchill",
    "name": "Churchill",
    "province": "Manitoba",
    "tagline": "Polar bear capital of the world",
    "emoji": "🐻‍❄️",
    "hero_color": "#0a1a2a",
    "highlights": [
      "Polar bear watching — the world's best, every fall on Hudson Bay",
      "Beluga whale watching — 4,000+ belugas enter the Churchill River Estuary each summer",
      "Northern Lights (Aurora Borealis) — visible up to 300 nights per year",
      "Itsanitaq Museum — millennium-old Inuit artifacts and contemporary carvings",
      "Prince of Wales Fort NHS — a 300-year-old Hudson Bay Company stone fort"
    ],
    "vibe": [
      "🐻‍❄️ Wildlife",
      "🌌 Northern Lights",
      "🛶 Eco-Tourism",
      "🏛️ Inuit Culture"
    ],
    "popular_routes": [
      "Winnipeg → Churchill",
      "Churchill → Winnipeg"
    ]
  },
  {
    "id": "edmonton",
    "name": "Edmonton",
    "province": "Alberta",
    "tagline": "Festival capital of the north",
    "emoji": "🏙️",
    "hero_color": "#1a2535",
    "highlights": [
      "50+ annual festivals — from Freewill Shakespeare to Farmfair International in November",
      "Royal Alberta Museum — Western Canada's largest museum with 82,000 sq ft of exhibits",
      "Edmonton River Valley — North America's largest urban parkland, 150+ km of trails",
      "ICE District & Rogers Place — Oilers games, Grand Villa Casino, and vibrant nightlife",
      "Day trip to Elk Island National Park — Plains bison, moose, and 250+ bird species"
    ],
    "vibe": [
      "🎭 Festivals",
      "🏛️ Museums",
      "🌿 Parks",
      "🏒 Sports"
    ],
    "popular_routes": [
      "Toronto → Edmonton",
      "Vancouver → Edmonton",
      "Montréal → Edmonton"
    ]
  },
  {
    "id": "jasper",
    "name": "Jasper",
    "province": "Alberta",
    "tagline": "Dark skies and glacial wilderness",
    "emoji": "⭐",
    "hero_color": "#0d1a0d",
    "highlights": [
      "Jasper National Park — Canada's largest Rocky Mountain park, 1,200 km of hiking trails",
      "Columbia Icefield — ride an Ice Explorer onto the Athabasca Glacier",
      "World's 2nd largest Dark Sky Preserve — stargazing like nowhere else on Earth",
      "Jasper SkyTram — seven-minute ride to Whistler Mountain's 360° panorama",
      "Fairmont Jasper Park Lodge Golf Course — SCOREgolf's best public course in Canada"
    ],
    "vibe": [
      "⭐ Stargazing",
      "🧊 Glaciers",
      "🥾 Hiking",
      "🐻 Wildlife"
    ],
    "popular_routes": [
      "Vancouver → Jasper",
      "Edmonton → Jasper",
      "Toronto → Jasper"
    ]
  },
  {
    "id": "banff",
    "name": "Banff",
    "province": "Alberta",
    "tagline": "Rooftop of Canada in the Rockies",
    "emoji": "🏔️",
    "hero_color": "#0d1f2d",
    "highlights": [
      "Lake Louise — turquoise glacial lake beneath Victoria Glacier at 1,885 m elevation",
      "Banff Upper Hot Springs — soak in sulphurous mineral pools with mountain views",
      "Cave and Basin National Historic Site — birthplace of Canada's national parks system",
      "Moraine Lake & Valley of the Ten Peaks — one of the world's most photographed vistas",
      "Banff Mountain Film & Book Festival — world-class outdoor adventure storytelling"
    ],
    "vibe": [
      "🏔️ Mountains",
      "🛁 Hot Springs",
      "📸 Photography",
      "🎿 Skiing"
    ],
    "popular_routes": [
      "Vancouver → Banff",
      "Edmonton → Banff",
      "Toronto → Banff"
    ]
  },
  {
    "id": "toronto",
    "name": "Toronto",
    "province": "Ontario",
    "tagline": "Canada's most cosmopolitan city",
    "emoji": "🏙️",
    "hero_color": "#0a0a1a",
    "highlights": [
      "CN Tower SkyPod — highest observation platform in the Western Hemisphere at 447 metres",
      "Distillery District — 19th-century Victorian industrial complex turned pedestrian arts village",
      "Kensington Market & Queen Street West — Toronto's most eclectic and creative neighbourhoods",
      "Rouge National Urban Park — one of the largest urban parks in North America",
      "Scarborough Bluffs and Lake Ontario beaches — urban escapes on the city's eastern edge"
    ],
    "vibe": [
      "🏙️ Urban Culture",
      "🎨 Street Art",
      "🍜 Food Scene",
      "🌿 Urban Parks"
    ],
    "popular_routes": [
      "Montréal → Toronto",
      "Ottawa → Toronto",
      "Vancouver → Toronto"
    ]
  },
  {
    "id": "ottawa",
    "name": "Ottawa",
    "province": "Ontario",
    "tagline": "Canada's capital on the Rideau Canal",
    "emoji": "🍁",
    "hero_color": "#1a0f0a",
    "highlights": [
      "Parliament Hill — take a guided tour and watch the Changing of the Guard",
      "Rideau Canal — UNESCO World Heritage Site and the world's largest naturally frozen skating rink",
      "National Gallery of Canada — home to the Group of Seven and world-class international collections",
      "ByWard Market — one of Canada's oldest and largest public markets since 1826",
      "Laurier House NHS — former residence of two Canadian prime ministers"
    ],
    "vibe": [
      "🍁 Canadian Heritage",
      "🏛️ Museums",
      "🛍️ Markets",
      "🌿 Waterways"
    ],
    "popular_routes": [
      "Toronto → Ottawa",
      "Montréal → Ottawa",
      "Québec → Ottawa"
    ]
  },
  {
    "id": "belleville",
    "name": "Belleville",
    "province": "Ontario",
    "tagline": "Quinte Bay charm near Prince Edward County",
    "emoji": "🌊",
    "hero_color": "#0a1a1a",
    "highlights": [
      "Glanmore National Historic Site — a breathtaking Second Empire Victorian mansion from 1883",
      "Bay of Quinte waterfront — boat excursions, fishing, and scenic hiking trails",
      "Prince Edward County — just across the water: wineries, lavender farms, and Sandbanks Provincial Park",
      "H.R. Frink Outdoor Education Centre — guided hikes through forests and wetlands",
      "Belleville waterfront dining — fresh local seafood with views of the bay"
    ],
    "vibe": [
      "🏛️ Victorian Heritage",
      "🌊 Waterfront",
      "🍷 Wine Country",
      "🥾 Hiking"
    ],
    "popular_routes": [
      "Toronto → Montréal",
      "Toronto → Ottawa"
    ]
  },
  {
    "id": "cornwall",
    "name": "Cornwall",
    "province": "Ontario",
    "tagline": "Eastern Ontario on the St. Lawrence River",
    "emoji": "🚴",
    "hero_color": "#0a1a0a",
    "highlights": [
      "Riverside Trail — 40+ km of St. Lawrence waterfront cycling and walking paths",
      "Rurban Brewing — Cornwall's beloved craft brewery with local ingredients",
      "Historic SDG Jail — a unique heritage attraction in the heart of Cornwall",
      "Saunders Hydro Dam Visitor Centre — explore the massive St. Lawrence power infrastructure",
      "Cline House Gallery — contemporary and heritage art from Eastern Ontario artists"
    ],
    "vibe": [
      "🚴 Cycling",
      "🏛️ Heritage",
      "🍺 Craft Beer",
      "🌊 St. Lawrence"
    ],
    "popular_routes": [
      "Toronto → Montréal",
      "Kingston → Montréal"
    ]
  },
  {
    "id": "hamilton",
    "name": "Hamilton",
    "province": "Ontario",
    "tagline": "Steel City on the Niagara Escarpment",
    "emoji": "🌿",
    "hero_color": "#0f1a0a",
    "highlights": [
      "Royal Botanical Gardens' Cootes Paradise — the most diverse nature sanctuary in Ontario",
      "Niagara Escarpment — Bruce Trail ridge walks with sweeping views of Hamilton Harbour",
      "Hamilton Street Art District — 35 restored historical buildings and vibrant murals",
      "Sassafras Point Trail in Churchill Park — a hidden gem of urban forest hiking",
      "Art Gallery of Hamilton — Ontario's third-largest public art gallery"
    ],
    "vibe": [
      "🌿 Nature",
      "🎨 Street Art",
      "🏛️ History",
      "🥾 Hiking"
    ],
    "popular_routes": [
      "Toronto → London",
      "London → Toronto"
    ]
  },
  {
    "id": "kitchener",
    "name": "Kitchener",
    "province": "Ontario",
    "tagline": "Bavarian heritage in the heart of Waterloo Region",
    "emoji": "🍺",
    "hero_color": "#1a0f00",
    "highlights": [
      "Kitchener-Waterloo Oktoberfest — Canada's largest Bavarian festival every September–October",
      "Victoria Park — outdoor events, a scenic lake, and picturesque Rockway Gardens",
      "Woodside National Historic Site — Victorian childhood home of PM William Lyon Mackenzie King",
      "Kitchener Market — fresh local produce, artisan goods, and regional specialties",
      "THEMUSEUM — interactive and contemporary exhibitions for the whole family"
    ],
    "vibe": [
      "🍺 Oktoberfest",
      "🎭 Events",
      "🏛️ Heritage",
      "🛍️ Markets"
    ],
    "popular_routes": [
      "Toronto → Kitchener",
      "London → Kitchener"
    ]
  },
  {
    "id": "london",
    "name": "London",
    "province": "Ontario",
    "tagline": "The Forest City on the Thames",
    "emoji": "🌳",
    "hero_color": "#0a1a05",
    "highlights": [
      "Thames Valley Trail — winding through forests and meadows along the Thames River",
      "Covent Garden Market — London's historic indoor market with local produce and artisan vendors",
      "Labatt Brewery — Canada's largest brewer, offering guided tours and tastings",
      "Storybook Gardens & London Children's Museum — the first children's museum in Canada",
      "London Music Hall — Western Ontario's premier live music venue"
    ],
    "vibe": [
      "🌳 Forest & Nature",
      "🎶 Live Music",
      "🛍️ Markets",
      "🍺 Brewing"
    ],
    "popular_routes": [
      "Toronto → London",
      "Windsor → London",
      "London → Toronto"
    ]
  },
  {
    "id": "niagara-falls",
    "name": "Niagara Falls",
    "province": "Ontario",
    "tagline": "The most powerful waterfall in North America",
    "emoji": "💧",
    "hero_color": "#0a1f2a",
    "highlights": [
      "Horseshoe Falls — the most powerful waterfall in North America, best seen from the Maid of the Mist",
      "Niagara Peninsula Wine Region — Canada's largest wine-growing area, famous for Vidal ice wine",
      "Fort George National Historic Site — key fortification of the War of 1812",
      "Clifton Hill — a bustling tourist promenade with restaurants, attractions, and entertainment",
      "Niagara Gorge hiking trails — walk the rim of the gorge for stunning views"
    ],
    "vibe": [
      "💧 Waterfalls",
      "🍷 Wine Country",
      "🏛️ History",
      "🎡 Entertainment"
    ],
    "popular_routes": [
      "Toronto → Niagara Falls",
      "Niagara Falls → Montréal"
    ]
  },
  {
    "id": "sarnia",
    "name": "Sarnia",
    "province": "Ontario",
    "tagline": "Lake Huron's California of Ontario",
    "emoji": "🌅",
    "hero_color": "#1a1000",
    "highlights": [
      "Grand Bend Beach — one of Ontario's finest sandy beaches on Lake Huron",
      "Cantara Park coastal dunes — dramatic dune landscapes along Lambton County's shore",
      "Stones N'Bones Museum — a remarkable collection of fossils from the Devonian era",
      "Boat excursions on Lake Huron — fishing cruises and sunset tours along the coast",
      "Lambton County forests — hiking, cycling, and snowmobiling through mixed woodland"
    ],
    "vibe": [
      "🌅 Beaches",
      "🐚 Fossils",
      "🎣 Fishing",
      "🌊 Lake Huron"
    ],
    "popular_routes": [
      "Toronto → Sarnia",
      "Sarnia → Toronto"
    ]
  },
  {
    "id": "sudbury",
    "name": "Sudbury",
    "province": "Ontario",
    "tagline": "Northern Ontario's lake country on the Shield",
    "emoji": "🪨",
    "hero_color": "#1a0a1a",
    "highlights": [
      "Big Nickel — Sudbury's iconic 9-metre replica of the Canadian five-cent coin",
      "Science North — one of Canada's most celebrated science centres on Ramsey Lake",
      "330 Canadian Shield lakes — cycling and snowmobiling through ancient Precambrian rock",
      "Bell Park — the city's largest waterfront green space on Lake Ramsey",
      "Dynamic Earth — journey to the centre of the Earth at the former Inco mine"
    ],
    "vibe": [
      "🪨 Canadian Shield",
      "🔬 Science",
      "🏕️ Lake Country",
      "❄️ Winter Adventures"
    ],
    "popular_routes": [
      "Toronto → Sudbury",
      "Sudbury → White River"
    ]
  },
  {
    "id": "windsor",
    "name": "Windsor",
    "province": "Ontario",
    "tagline": "Canada's southernmost city on the Detroit River",
    "emoji": "🌉",
    "hero_color": "#0a0f1a",
    "highlights": [
      "Detroit River Waterfront — stunning views of Detroit's skyscrapers from Windsor's parks",
      "Walkerville Heritage District — century-old elms, Victorian architecture, and Willistead Manor",
      "Windsor-Essex Wine Country — Ontario's sunniest wine region with over 30 wineries",
      "Little Italy & Caesars Windsor — vibrant dining scene and riverside entertainment",
      "Fort Malden National Historic Site — War of 1812 fortifications at nearby Amherstburg"
    ],
    "vibe": [
      "🌉 Riverfront",
      "🍷 Wine Country",
      "🏛️ Heritage",
      "🌆 Urban"
    ],
    "popular_routes": [
      "Toronto → Windsor",
      "London → Windsor"
    ]
  },
  {
    "id": "kingston",
    "name": "Kingston",
    "province": "Ontario",
    "tagline": "Limestone City on Lake Ontario",
    "emoji": "🏰",
    "hero_color": "#1a1a0d",
    "highlights": [
      "Fort Henry National Historic Site — Canada's greatest 19th-century fort",
      "Historic downtown waterfront — boutiques and independent restaurants",
      "Kingston Penitentiary tours — Canada's most notorious prison",
      "Thousand Islands boat cruises — world-famous archipelago",
      "Queen's University campus — stunning limestone architecture"
    ],
    "vibe": [
      "🏛️ History",
      "🛍️ Shopping",
      "⛵ Boating",
      "🍺 Local Eats"
    ],
    "popular_routes": [
      "Toronto → Kingston",
      "Montréal → Kingston"
    ]
  },
  {
    "id": "cobourg",
    "name": "Cobourg",
    "province": "Ontario",
    "tagline": "Northumberland's hidden gem",
    "emoji": "🌾",
    "hero_color": "#1a0f0a",
    "highlights": [
      "Cobourg Beach — one of Ontario's finest sandy beaches",
      "Victoria Hall — ornate 1860 courthouse and concert hall",
      "Northumberland Farmers' Market — local produce and artisan goods",
      "Ganaraska Forest — hiking and cross-country skiing",
      "Historic downtown — boutique shops and local restaurants"
    ],
    "vibe": [
      "🏖️ Beach",
      "🌿 Nature",
      "🛍️ Artisan",
      "🏛️ Heritage"
    ],
    "popular_routes": [
      "Toronto → Cobourg",
      "Cobourg → Montréal"
    ]
  }
];

function Tab4({ onShopStation }) {
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDestination = async (dest) => {
    setSelected(dest);
    setDetailLoading(true);
    try {
      const r = await fetch(`${API}/destinations/${dest.id}`);
      setDetail(await r.json());
    } catch { setDetail(dest); }
    setDetailLoading(false);
  };

  const closeDetail = () => { setSelected(null); setDetail(null); };

  // Province grouping
  const byProvince = DESTINATIONS.reduce((acc, d) => {
    (acc[d.province] = acc[d.province] || []).push(d);
    return acc;
  }, {});

  return (
    <>
      {/* Destination detail drawer */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div onClick={closeDetail} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }} />
          <div className="slide-up" style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "#fff", borderRadius: "20px 20px 0 0",
            maxHeight: "88vh", overflowY: "auto",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          }}>
            {/* Hero */}
            <div style={{ background: selected.hero_color, padding: "2rem 1.5rem 1.5rem", position: "relative" }}>
              <button onClick={closeDetail} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={16} color="#fff" />
              </button>
              <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{selected.emoji}</div>
              <h2 style={{ color: "#fff", fontWeight: 800, fontSize: "1.5rem", margin: 0 }}>{selected.name}</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>{selected.tagline}</p>
              {/* Vibe tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "0.85rem" }}>
                {selected.vibe?.map((v) => (
                  <span key={v} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.7rem", fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>{v}</span>
                ))}
              </div>
            </div>

            <div style={{ padding: "1.25rem 1.5rem" }}>
              {/* Highlights */}
              <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111", marginBottom: "0.75rem" }}>Top Highlights</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.5rem" }}>
                {selected.highlights?.map((h) => (
                  <div key={h} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFCC00", marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.5 }}>{h}</span>
                  </div>
                ))}
              </div>

              {/* Popular routes */}
              {selected.popular_routes?.length > 0 && (
                <>
                  <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111", marginBottom: "0.75rem" }}>Popular Routes</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1.5rem" }}>
                    {selected.popular_routes.map((r) => (
                      <span key={r} style={{ background: "#F5F5F5", border: "1px solid #E8E8E8", borderRadius: 99, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 5 }}>
                        <Train size={11} color="#FFCC00" />{r}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Station products */}
              {detailLoading ? (
                <div style={{ textAlign: "center", padding: "1rem" }}><Loader size={18} color="#FFCC00" className="animate-spin" /></div>
              ) : detail?.items?.length > 0 && (
                <>
                  <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111", marginBottom: "0.75rem" }}>
                    🛍️ Local Products at {selected.name}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.5rem" }}>
                    {detail.items.map((item) => {
                      const vis = ITEM_VISUALS[item.id] || { emoji: "📦", bg: "#f5f5f5" };
                      return (
                        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.75rem", background: "#F9F9F9", borderRadius: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: vis.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
                            {vis.emoji}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111", margin: 0 }}>{item.name}</p>
                            <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: "2px 0 0" }}>{item.vendor}</p>
                          </div>
                          <span style={{ fontWeight: 800, color: "#111", fontSize: "0.9rem", flexShrink: 0 }}>{item.price_display}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => { closeDetail(); onShopStation(selected.name); }}
                    style={{ width: "100%", background: "#FFCC00", color: "#111", fontWeight: 800, fontSize: "0.95rem", border: "none", borderRadius: 50, padding: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    <ShoppingCart size={18} />Shop {selected.name} Products
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prosperity header for Discover tab */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 14, padding: "1rem 1.1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1rem" }}>🗺️</span>
          <span style={{ fontWeight: 800, fontSize: "0.8rem", color: "#c4b5fd", letterSpacing: "0.07em", textTransform: "uppercase" }}>The Prosperity Map</span>
        </div>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.77rem", color: "#e0e7ff", lineHeight: 1.55 }}>
          41 communities across Canada — each with artisan vendors whose products were invisible to 4.4M annual VIA Rail passengers until now. Tap any destination to browse local products and connect directly with makers.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "0.75rem" }}>⚡</span>
          <span style={{ fontSize: "0.7rem", color: "#a5b4fc", lineHeight: 1.4 }}>
            <strong style={{ color: "#c4b5fd" }}>SDG 7 · SDG 8 · SDG 10 · SDG 11:</strong> Prosperity built on clean rail — discover communities, support local makers, travel sustainably.
          </span>
        </div>
      </div>

      {/* Destination cards by province */}
      {Object.entries(byProvince).map(([province, dests]) => (
        <div key={province} style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
            <MapPin size={13} color="#FFCC00" />
            <span style={{ fontWeight: 800, fontSize: "0.8rem", color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>{province}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "0.85rem" }}>
            {dests.map((dest) => (
              <button key={dest.id} className="card" onClick={() => openDestination(dest)}
                style={{ textAlign: "left", padding: 0, border: "none", cursor: "pointer", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Hero strip */}
                <div style={{ background: dest.hero_color, padding: "1.25rem 1rem 0.85rem", display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "2rem" }}>{dest.emoji}</span>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }}>{dest.name}</span>
                </div>
                {/* Body */}
                <div style={{ padding: "0.75rem 1rem", flex: 1 }}>
                  <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: 0, lineHeight: 1.4 }}>{dest.tagline}</p>
                  <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {dest.vibe?.slice(0, 2).map((v) => (
                      <span key={v} style={{ fontSize: "0.58rem", background: "#F5F5F5", color: "#374151", padding: "2px 6px", borderRadius: 99, fontWeight: 600 }}>{v}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

// ─── Tab: Account ─────────────────────────────────────────────────────────────
const PREFERENCE_OPTIONS = ["Souvenirs", "Craft Goods", "Food & Snacks", "Books", "Art", "Wellness", "Clothing"];
const CLASS_OPTIONS = ["Economy", "Business", "Sleeper Plus", "The Canadian Suite"];

const STATUS_META = {
  "Confirmed":   { color: "#16a34a", bg: "#f0fdf4", label: "Confirmed" },
  "Preparing":   { color: "#b45309", bg: "#fffbeb", label: "Preparing" },
  "On the Way":  { color: "#2563eb", bg: "#eff6ff", label: "On the Way" },
  "Delivered":   { color: "#6b7280", bg: "#f9fafb", label: "Delivered" },
  "Syncing":     { color: "#7c3aed", bg: "#f5f3ff", label: "Syncing…" },
};

const DEMO_MESSAGES = [
  {
    id: "msg-001",
    from: "RailOptAI Express",
    avatar: "🚆",
    subject: "Your order is being prepared",
    body: "Your order ORD-1001 is currently being prepared by our onboard team. Head to the onboard pickup zone (café car) in 8–12 minutes to collect your items.",
    time: "2 min ago",
    read: false,
  },
  {
    id: "msg-002",
    from: "VIA Rail Concierge",
    avatar: "👋",
    subject: "Welcome aboard The Canadian!",
    body: "Thank you for travelling with VIA Rail. Browse local artisan products from stations along your route. Use the Shop tab to explore and order.",
    time: "14 min ago",
    read: true,
  },
  {
    id: "msg-003",
    from: "RailOptAI",
    avatar: "⚡",
    subject: "New products at your next stop",
    body: "Based on your preferences, we found 4 new items available at Kingston station. Check out the Shop tab for Artisan Knitwear and Heritage Prints.",
    time: "1 hr ago",
    read: true,
  },
];

function TabAccount() {
  const stored = () => JSON.parse(localStorage.getItem("railopt_account") || "{}");
  const [form, setForm] = useState({
    name: "", email: "", viaNumber: "", seatCar: "", seatNumber: "",
    trainClass: "Economy", preferences: [], dietaryNotes: "", language: "en",
    consentAiTraining: false, consentPersonalization: true,
    ...stored(),
  });
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState("profile");
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem("railopt_orders") || "[]"));
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [openMsg, setOpenMsg] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const togglePref = (p) =>
    set("preferences", form.preferences.includes(p)
      ? form.preferences.filter((x) => x !== p)
      : [...form.preferences, p]);

  const handleSave = () => {
    localStorage.setItem("railopt_account", JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const field = (label, key, type = "text", placeholder = "") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      <input
        type={type}
        value={form[key] || ""}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        style={{ background: "#fafaf9", border: "1px solid #e7e5e4", borderRadius: 10, padding: "0.6rem 0.85rem", fontSize: "0.88rem", color: "#111", outline: "none" }}
      />
    </div>
  );

  const unreadCount = messages.filter((m) => !m.read).length;

  const SECTIONS = [
    { id: "profile",  label: "Profile" },
    { id: "orders",   label: "Purchase History" },
    { id: "messages", label: `Messages${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
  ];

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Section tabs */}
      <div style={{ display: "flex", background: "#f5f5f4", borderRadius: 12, padding: 4, gap: 2 }}>
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            flex: 1, padding: "0.5rem 0.25rem", borderRadius: 9, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: "0.78rem",
            background: section === s.id ? "#fff" : "transparent",
            color: section === s.id ? "#111" : "#9ca3af",
            boxShadow: section === s.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s",
          }}>{s.label}</button>
        ))}
      </div>

      {/* ── PROFILE ── */}
      {section === "profile" && <>
        <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{ background: "#FFCC00", borderRadius: "50%", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.3rem", color: "#1c1917" }}>
              {form.name ? form.name[0].toUpperCase() : "?"}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#111" }}>{form.name || "Your Name"}</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{form.viaNumber ? `VIA Préférence #${form.viaNumber}` : "No VIA Préférence number"}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            {field("Full Name", "name", "text", "Jane Smith")}
            {field("Email", "email", "email", "jane@example.com")}
            {field("VIA Préférence #", "viaNumber", "text", "123456789")}
          </div>
        </div>

        <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111", display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
            <Train size={16} color="#FFCC00" /> Journey Details
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
            {field("Car Number (optional)", "seatCar", "text", "e.g. 4")}
            {field("Seat Number (optional)", "seatNumber", "text", "e.g. 22A")}
          </div>
          <p style={{ fontSize: "0.72rem", color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>
            Seat assignment is only available on the Québec City–Windsor Corridor and Sleeper class. Long-distance Economy is first come, first served.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Travel Class</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CLASS_OPTIONS.map((c) => (
                <button key={c} onClick={() => set("trainClass", c)} style={{
                  padding: "0.35rem 0.85rem", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                  background: form.trainClass === c ? "#FFCC00" : "#f5f5f4",
                  color: form.trainClass === c ? "#1c1917" : "#6b7280",
                  border: form.trainClass === c ? "1.5px solid #FFCC00" : "1.5px solid #e7e5e4",
                }}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111", display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
            <Star size={16} color="#FFCC00" /> Shopping Preferences
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Interests (used for AI picks)</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PREFERENCE_OPTIONS.map((p) => (
                <button key={p} onClick={() => togglePref(p)} style={{
                  padding: "0.35rem 0.85rem", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                  background: form.preferences.includes(p) ? "#FFCC00" : "#f5f5f4",
                  color: form.preferences.includes(p) ? "#1c1917" : "#6b7280",
                  border: form.preferences.includes(p) ? "1.5px solid #FFCC00" : "1.5px solid #e7e5e4",
                }}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dietary / Allergy Notes</label>
            <textarea
              value={form.dietaryNotes}
              onChange={(e) => set("dietaryNotes", e.target.value)}
              placeholder="e.g. nut-free, gluten-free…"
              rows={2}
              style={{ background: "#fafaf9", border: "1px solid #e7e5e4", borderRadius: 10, padding: "0.6rem 0.85rem", fontSize: "0.88rem", color: "#111", outline: "none", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Language</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[["en", "🇨🇦 English"], ["fr", "🇨🇦 Français"]].map(([code, lbl]) => (
                <button key={code} onClick={() => set("language", code)} style={{
                  padding: "0.35rem 0.9rem", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                  background: form.language === code ? "#FFCC00" : "#f5f5f4",
                  color: form.language === code ? "#1c1917" : "#6b7280",
                  border: form.language === code ? "1.5px solid #FFCC00" : "1.5px solid #e7e5e4",
                }}>{lbl}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111", display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
            🔒 Privacy & Data
          </h3>

          {/* Toggle row helper */}
          {[
            {
              key: "consentPersonalization",
              title: "Personalized recommendations",
              desc: "Allow RailOptAI to use your stated interests and language preference to tailor product suggestions. This data never leaves your device.",
            },
            {
              key: "consentAiTraining",
              title: "Contribute to route intelligence",
              desc: "Share anonymous, aggregated purchase patterns (never your name or identity) to help improve onboard stock predictions for your route. You can withdraw this at any time.",
            },
          ].map(({ key, title, desc }) => (
            <div key={key} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div
                onClick={() => set(key, !form[key])}
                style={{
                  flexShrink: 0, width: 44, height: 24, borderRadius: 12, cursor: "pointer",
                  background: form[key] ? "#22c55e" : "#d1d5db",
                  position: "relative", transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute", top: 3, left: form[key] ? 23 : 3,
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.83rem", color: "#111" }}>{title}</div>
                <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <p style={{ fontSize: "0.72rem", color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
              🇨🇦 Compliant with <strong>PIPEDA</strong> and Canada's incoming <strong>Consumer Privacy Protection Act (Bill C-27)</strong>.
              Your data is <strong>never sold or shared with advertisers or third parties.</strong>
            </p>
            <button
              onClick={() => {
                if (window.confirm("Delete all your local data? This cannot be undone.")) {
                  localStorage.removeItem("railopt_account");
                  localStorage.removeItem("railopt_orders");
                  window.location.reload();
                }
              }}
              style={{ alignSelf: "flex-start", background: "none", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "0.35rem 0.85rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
            >
              🗑 Delete all my data
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{
            width: "100%", background: saved ? "#22c55e" : "#FFCC00", color: "#1c1917",
            fontWeight: 800, fontSize: "1rem", border: "none", borderRadius: 50,
            padding: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8, transition: "background 0.25s",
          }}
        >
          {saved ? <><CheckCircle size={18} /> Saved!</> : "Save Profile"}
        </button>
        <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#9ca3af" }}>
          Profile stored locally on this device. Not shared with VIA Rail.
        </p>
      </>}

      {/* ── PURCHASE HISTORY ── */}
      {section === "orders" && <>
        {orders.length === 0 ? (
          <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
            <ShoppingCart size={36} style={{ margin: "0 auto 0.75rem", opacity: 0.2 }} />
            <p style={{ fontWeight: 700, color: "#6b7280" }}>No orders yet</p>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 4 }}>Place your first order from the Shop tab</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {orders.map((order) => {
              const meta = STATUS_META[order.status] || STATUS_META["Confirmed"];
              const isOpen = expandedOrder === order.orderId;
              const dateStr = new Date(order.date).toLocaleDateString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
              return (
                <div key={order.orderId} className="card" style={{ padding: "1rem 1.25rem", cursor: "pointer" }} onClick={() => setExpandedOrder(isOpen ? null : order.orderId)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#111" }}>{order.orderId}</span>
                        <span style={{ background: meta.bg, color: meta.color, borderRadius: 99, padding: "2px 9px", fontSize: "0.7rem", fontWeight: 700 }}>{meta.label}</span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 2 }}>{dateStr} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "#111" }}>${order.total}</div>
                      <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 2 }}>{isOpen ? "▲ Hide" : "▼ Details"}</div>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: "0.85rem", borderTop: "1px solid #f0f0f0", paddingTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {order.items.map((it, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#111" }}>{it.name}</span>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af", marginLeft: 6 }}>× {it.qty}</span>
                          </div>
                          <span style={{ fontSize: "0.83rem", fontWeight: 700, color: "#111" }}>{it.price}</span>
                        </div>
                      ))}
                      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "0.5rem", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6b7280" }}>Total</span>
                        <span style={{ fontWeight: 800, color: "#111" }}>${order.total}</span>
                      </div>
                      {/* Simulate status progression for demo */}
                      <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                        {["Confirmed", "Preparing", "On the Way", "Delivered"].map((st, idx) => {
                          const steps = ["Confirmed", "Preparing", "On the Way", "Delivered"];
                          const currentIdx = steps.indexOf(order.status);
                          const done = idx <= currentIdx;
                          return (
                            <div key={st} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <div style={{ width: 10, height: 10, borderRadius: "50%", background: done ? "#FFCC00" : "#e5e7eb", border: done ? "2px solid #b45309" : "2px solid #d1d5db" }} />
                              <span style={{ fontSize: "0.65rem", fontWeight: 600, color: done ? "#111" : "#9ca3af" }}>{st}</span>
                              {idx < 3 && <div style={{ width: 16, height: 2, background: done && idx < currentIdx ? "#FFCC00" : "#e5e7eb" }} />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </>}

      {/* ── MESSAGES ── */}
      {section === "messages" && <>
        {openMsg ? (
          <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button onClick={() => setOpenMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.8rem", fontWeight: 700, textAlign: "left", padding: 0, display: "flex", alignItems: "center", gap: 5 }}>
              ← Back to messages
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: "1.6rem" }}>{openMsg.avatar}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111" }}>{openMsg.subject}</div>
                <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>From {openMsg.from} · {openMsg.time}</div>
              </div>
            </div>
            <p style={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.6, margin: 0 }}>{openMsg.body}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="card"
                onClick={() => { setOpenMsg(msg); setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, read: true } : m)); }}
                style={{ padding: "0.95rem 1.1rem", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12, borderLeft: msg.read ? "3px solid transparent" : "3px solid #FFCC00" }}
              >
                <div style={{ fontSize: "1.4rem", flexShrink: 0 }}>{msg.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: msg.read ? 600 : 800, fontSize: "0.85rem", color: "#111" }}>{msg.subject}</span>
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af", flexShrink: 0, marginLeft: 8 }}>{msg.time}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>{msg.from}</div>
                  <p style={{ fontSize: "0.78rem", color: "#9ca3af", margin: "4px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{msg.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </>}
    </div>
  );
}

// ─── Tab: Instacart Station Pickup ────────────────────────────────────────────

// IANA timezone for each demo stop — used for store-hours check so we evaluate
// whether stores are open in the station's local time, not the passenger's device time.
const STATION_TZ = {
  "Toronto":       "America/Toronto",
  "Sudbury":       "America/Toronto",
  "Sioux Lookout": "America/Toronto",   // Northwestern Ontario uses Eastern time
  "Winnipeg":      "America/Winnipeg",
  "Saskatoon":     "America/Regina",    // Saskatchewan: no DST, UTC-6 year-round
  "Vancouver":     "America/Vancouver",
};

// Demo train schedule: The Canadian (Toronto → Vancouver) — 4-day journey
// Offsets in minutes from "now". Shows the real long-haul pain point.
// trainDelayMins: simulates live VIA Rail train status feed (positive = late, negative = early)
// storeDistanceKm: walking distance from platform to nearest pickup-eligible store
const DEMO_STOPS = [
  { station: "Toronto",       province: "ON", offset: -60,  departed: true,  trainDelayMins: 0,   storeDistanceKm: 0.3 },
  { station: "Sudbury",       province: "ON", offset: 185,                   trainDelayMins: 12,  storeDistanceKm: 0.4 },
  { station: "Sioux Lookout", province: "ON", offset: 420, subtitle: "Remote boreal town · rail-only access · Northern Ontario",
    note: "Subway is just down the street, Rexall is past the CIBC — but only worth the dash if you have 20+ min. Train +22 min late today. Order ahead, don't risk it.", trainDelayMins: 22, storeDistanceKm: 0.2 },
  { station: "Winnipeg",      province: "MB", offset: 780,  note: "VIA Rail Winnipeg Union Station (different from Toronto Union) — The Forks Market is steps away.", trainDelayMins: 8,  storeDistanceKm: 0.6,
    nearbyPlaces: [
      { name: "The Forks Market", rating: "4.8★", price: "$20–30", note: "Steps from the platform" },
      { name: "The Kolachi Kitchen", rating: "4.4★", price: "$20–30", note: "175 Hargrave St · Open late" },
      { name: "Kabul Grill", rating: "4.8★", price: "$10–20", note: "172 Main St · Best value" },
      { name: "Robin's Donuts", rating: "", price: "$", note: "Freshly baked — quick pickup" },
      { name: "The Keg Steakhouse + Bar", rating: "", price: "$$$", note: "Garry St · Pre-order recommended" },
    ]
  },
  { station: "Saskatoon",     province: "SK", offset: 1140,                  trainDelayMins: 0,   storeDistanceKm: 1.8 },
  { station: "Vancouver",     province: "BC", offset: 1560,                  trainDelayMins: 0,   storeDistanceKm: 0.3 },
];
const MIN_LEAD_MIN = 120;

const INSTACART_CATALOGUE = {
  "🥗 Fresh Food": [
    { id: "IC-F001", name: "Seasonal Fruit Bowl", vendor: "Farm Boy", price: 8.99, emoji: "🍓", desc: "Local Ontario mixed berries and melon, freshly cut." },
    { id: "IC-F002", name: "Artisan Sandwich", vendor: "Première Moisson", price: 12.49, emoji: "🥪", desc: "Sourdough turkey & brie with grainy mustard." },
    { id: "IC-F003", name: "Greek Yogurt Parfait", vendor: "Liberté", price: 6.99, emoji: "🫙", desc: "Organic yogurt, granola, and wild blueberries." },
    { id: "IC-F004", name: "Cold-Pressed Green Juice", vendor: "Greenhouse", price: 9.49, emoji: "🥤", desc: "Cucumber, spinach, apple, lemon, ginger." },
    { id: "IC-F005", name: "Veggie & Hummus Snack Box", vendor: "Goodfood", price: 7.99, emoji: "🥕", desc: "Carrots, celery, snap peas with roasted red pepper hummus." },
    { id: "IC-F006", name: "Avocado Toast Kit", vendor: "Farm Boy", price: 11.99, emoji: "🥑", desc: "Sourdough, ripe avocados, everything bagel seasoning, lemon." },
  ],
  "💊 Pharmacy": [
    { id: "IC-P001", name: "Travel Pain Relief Pack", vendor: "Shoppers Drug Mart", price: 7.49, emoji: "💊", desc: "Advil + Tylenol dual pack, 20 tablets each." },
    { id: "IC-P002", name: "Hand Sanitizer (250ml)", vendor: "Personnelle", price: 4.99, emoji: "🧴", desc: "70% alcohol, fragrance-free, pocket size." },
    { id: "IC-P003", name: "Motion Sickness Relief", vendor: "Gravol", price: 8.99, emoji: "🌀", desc: "Natural ginger formula, non-drowsy, 8 tablets." },
    { id: "IC-P004", name: "Hydration Electrolyte Pack", vendor: "Nuun", price: 9.99, emoji: "💧", desc: "4-tablet tube, mixed berry flavour." },
    { id: "IC-P005", name: "Travel First Aid Kit", vendor: "Johnson & Johnson", price: 14.99, emoji: "🩹", desc: "20-piece compact kit for on-the-go." },
    { id: "IC-P006", name: "Eye Drops (Dry Eyes)", vendor: "Systane", price: 11.49, emoji: "👁️", desc: "Preservative-free lubricating drops, 0.5ml vials." },
  ],
  "📚 Books & Magazines": [
    { id: "IC-B001", name: "Globe and Mail (Today)", vendor: "Indigo", price: 4.50, emoji: "📰", desc: "Today's print edition with full weekend magazine." },
    { id: "IC-B002", name: "Canadian Geographic", vendor: "Indigo", price: 6.99, emoji: "🗺️", desc: "Latest issue — Canada's national geography magazine." },
    { id: "IC-B003", name: "Bestseller Fiction Grab", vendor: "Chapters", price: 21.99, emoji: "📖", desc: "Current #1 Canadian bestselling novel." },
    { id: "IC-B004", name: "Travel Journal & Pen Set", vendor: "Moleskine", price: 24.99, emoji: "📓", desc: "Softcover ruled notebook with matching ballpoint pen." },
    { id: "IC-B005", name: "Sudoku & Crossword Book", vendor: "Chapters", price: 9.99, emoji: "🔢", desc: "300 mixed-difficulty puzzles, perfect for long journeys." },
    { id: "IC-B006", name: "Kids Activity Book", vendor: "Scholastic", price: 7.99, emoji: "🖍️", desc: "Ages 4–8, stickers, mazes, colouring pages." },
  ],
  "🎁 Gifts": [
    { id: "IC-G001", name: "Local Wildflower Honey", vendor: "Beeking", price: 16.99, emoji: "🍯", desc: "Raw Ontario wildflower honey, 250g glass jar." },
    { id: "IC-G002", name: "Artisan Chocolate Box", vendor: "Chocolats Favoris", price: 22.99, emoji: "🍫", desc: "12-piece assorted Québec artisan chocolates." },
    { id: "IC-G003", name: "Lavender Bath Bundle", vendor: "Lush", price: 28.99, emoji: "🛁", desc: "Bath bomb, soap bar, and mini lotion — gift wrapped." },
    { id: "IC-G004", name: "Maple Syrup Gift Set", vendor: "Decacer", price: 19.99, emoji: "🍁", desc: "Three 100ml bottles — light, medium, dark amber." },
    { id: "IC-G005", name: "Wine (Red, 750ml)", vendor: "LCBO", price: 18.95, emoji: "🍷", desc: "Ontario VQA Cabernet Franc, Niagara Peninsula." },
    { id: "IC-G006", name: "Succulent Plant Kit", vendor: "Home Depot Garden", price: 14.99, emoji: "🌵", desc: "3 mini succulents in terracotta pots, ready to gift." },
  ],
  "🛒 Grocery": [
    { id: "IC-GR001", name: "Trail Mix (500g)", vendor: "Bulk Barn", price: 8.99, emoji: "🥜", desc: "Mixed nuts, dried cranberries, dark chocolate chips." },
    { id: "IC-GR002", name: "Sparkling Water 6-Pack", vendor: "San Pellegrino", price: 7.49, emoji: "💦", desc: "330ml cans, natural mineral water." },
    { id: "IC-GR003", name: "Kettle Chips (Large)", vendor: "Lay's Kettle", price: 5.49, emoji: "🥔", desc: "Sea salt & vinegar, 220g sharing bag." },
    { id: "IC-GR004", name: "Baby Wipes (72 pack)", vendor: "Pampers", price: 6.99, emoji: "👶", desc: "Sensitive, fragrance-free, resealable pack." },
    { id: "IC-GR005", name: "Protein Bar 4-Pack", vendor: "RXBAR", price: 12.99, emoji: "💪", desc: "Chocolate sea salt, whole food ingredients." },
    { id: "IC-GR006", name: "Oat Milk Latte (2-pack)", vendor: "Minor Figures", price: 6.99, emoji: "☕", desc: "Barista oat milk cold brew, ready to drink." },
  ],
};

const ORDER_STEPS = [
  { icon: "🛒", label: "Order placed",              detail: "Sent to Instacart Rail network" },
  { icon: "🏅", label: "Rail Certified shopper",    detail: "Assigned — trained for platform handoff" },
  { icon: "🏪", label: "Picking your order",        detail: "At a store near your stop" },
  { icon: "🚉", label: "Shopper at platform",       detail: "Waiting at your car door on arrival" },
  { icon: "✅", label: "Collected — enjoy!",        detail: "Step off, grab your bag, step back on" },
];

// Stores operate 7am–10pm in the station's LOCAL time
const STORE_OPEN_HOUR  = 7;
const STORE_CLOSE_HOUR = 22;

// Returns the hour (0–23) of a Date in a given IANA timezone,
// so store-hours are evaluated against station local time — not the passenger's device time.
function localHourAt(date, tz) {
  const h = new Intl.DateTimeFormat("en-CA", { hour: "numeric", hour12: false, timeZone: tz }).format(date);
  return parseInt(h, 10);
}

function isStoreOpen(date, tz) {
  const h = localHourAt(date, tz || "America/Toronto");
  return h >= STORE_OPEN_HOUR && h < STORE_CLOSE_HOUR;
}

function TabInstacart() {
  const now = Date.now();
  const stops = DEMO_STOPS.map((s) => {
    const tz = STATION_TZ[s.station] || "America/Toronto";
    // Adjust ETA by live train delay from VIA Rail status feed
    const delayMins = s.trainDelayMins || 0;
    const adjustedOffset = s.offset + delayMins;
    const eta = new Date(now + adjustedOffset * 60000);
    // Shopper needs to be at store ~30 min before train arrives to allow VIA handoff
    const shopperDeadline = new Date(now + (adjustedOffset - 30) * 60000);
    const storeOpen = isStoreOpen(shopperDeadline, tz);
    const eligible = !s.departed && adjustedOffset >= MIN_LEAD_MIN && storeOpen;
    // Warn if store is >1km from platform — shopper may be late if train is on time
    const distanceRisk = (s.storeDistanceKm || 0) > 1.0;
    return { ...s, eta, minutesAway: adjustedOffset, delayMins, eligible, storeOpen, tz, distanceRisk };
  });

  const [selectedStop, setSelectedStop] = useState(() => stops.find((s) => s.eligible) || null);
  const [activeCategory, setActiveCategory] = useState(Object.keys(INSTACART_CATALOGUE)[0]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderStep, setOrderStep] = useState(0);
  const [orderId, setOrderId] = useState("");

  const allItems = Object.values(INSTACART_CATALOGUE).flat();
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => {
    const item = allItems.find((i) => i.id === c.id);
    return s + (item ? item.price * c.qty : 0);
  }, 0);

  const addToCart = (item) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.id === item.id);
      return ex ? prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
                : [...prev, { id: item.id, qty: 1 }];
    });
  };
  const removeFromCart = (id) => setCart((p) => p.filter((c) => c.id !== id));
  const changeQty = (id, qty) => qty <= 0 ? removeFromCart(id) : setCart((p) => p.map((c) => c.id === id ? { ...c, qty } : c));

  const handlePlaceOrder = () => {
    const id = `IC-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setOrderId(id);
    setOrderPlaced(true);
    setCartOpen(false);
    setOrderStep(1);
    // Simulate progression through steps
    [2000, 5000, 9000, 14000].forEach((delay, i) => {
      setTimeout(() => setOrderStep(i + 2), delay);
    });
    // Save to purchase history
    const entry = {
      orderId: id,
      date: new Date().toISOString(),
      total: cartTotal.toFixed(2),
      status: "Confirmed",
      source: "Instacart",
      stop: selectedStop?.station,
      items: cart.map((c) => {
        const item = allItems.find((i) => i.id === c.id);
        return { id: c.id, name: item?.name || c.id, qty: c.qty, price: `$${item?.price.toFixed(2)}` };
      }),
    };
    const prev = JSON.parse(localStorage.getItem("railopt_orders") || "[]");
    localStorage.setItem("railopt_orders", JSON.stringify([entry, ...prev]));
    setCart([]);
  };

  const cutoffTime = selectedStop ? new Date(now + (selectedStop.minutesAway - MIN_LEAD_MIN) * 60000) : null;
  const cutoffStr = cutoffTime ? cutoffTime.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }) : "";
  const etaStr = selectedStop ? selectedStop.eta.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* Hero banner */}
      <div style={{ background: "linear-gradient(135deg, #003D1F 0%, #00532A 100%)", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.25rem", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🛒</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>Station Pickup via Instacart</div>
            <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Order from any local store. Rail Certified shopper meets you at the platform.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: "0.75rem", flexWrap: "wrap" }}>
          {[
            ["🏪", "Any local store", null],
            ["🏅", "Rail Certified shopper", "Instacart shoppers credentialed for platform handoff — they meet you at your car door during the stop so you never leave the train."],
            ["🚉", "Platform handoff", "Your shopper arrives at the platform before the train does. You collect your order at your car door during the scheduled stop."],
          ].map(([icon, label, tip]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", opacity: 0.9 }}>
              <span>{icon}</span><span>{label}</span>
              {tip && <InfoBubble content={tip} />}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", gap: 16, flexWrap: "wrap", marginBottom: "0.6rem" }}>
          {[
            ["5%", "commission per order", null],
            ["$1.99", "platform fee per order", null],
            ["Phase 2", "SaaS to VIA Rail", "Every order placed through RailOptAI builds the demand dataset VIA Rail doesn't currently have. After 6–12 months of operation, we bring VIA route-level purchase intelligence and a forecasting licence — telling them exactly what to stock on each route. VIA spent $51.4M on onboard products in 2025 with no data behind it."],
          ].map(([val, label, tip]) => (
            <div key={label} style={{ fontSize: "0.72rem", opacity: 0.85, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontWeight: 800, color: "#FFCC00" }}>{val}</span>
              <span>{label}</span>
              {tip && <InfoBubble content={tip} />}
            </div>
          ))}
        </div>
        <div style={{ paddingTop: "0.6rem", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: "0.8rem" }}>⚡</span>
          <span style={{ fontSize: "0.7rem", opacity: 0.85, lineHeight: 1.4 }}>
            <strong style={{ color: "#86efac" }}>SDG 7 — Clean Energy:</strong> A better onboard experience makes rail more compelling than driving — modal shift at scale. Every new rail passenger avoids ~<strong style={{ color: "#86efac" }}>0.17 kg CO₂/km</strong> vs. driving.
          </span>
        </div>
      </div>

      {/* Live Train Status banner */}
      {stops.some(s => s.delayMins > 0 && !s.departed) && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "0.65rem 1rem", marginBottom: "0.85rem", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>🚆</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.78rem", color: "#9a3412" }}>Live Train Status · VIA Rail feed</div>
            <div style={{ fontSize: "0.72rem", color: "#7c2d12", lineHeight: 1.5, marginTop: 2 }}>
              This train is running <strong>behind schedule</strong>. Pickup ETAs below reflect the adjusted arrival times.
              Your order cutoff and shopper deadline update automatically.
            </div>
            <div style={{ marginTop: "0.4rem", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {stops.filter(s => s.delayMins > 0 && !s.departed).map(s => (
                <span key={s.station} style={{ fontSize: "0.68rem", fontWeight: 700, background: "#fed7aa", borderRadius: 20, padding: "2px 8px", color: "#9a3412" }}>
                  {s.station} +{s.delayMins} min
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Train schedule + stop selector */}
      <div className="card" style={{ padding: "1.1rem 1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#111", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
          <Train size={15} color="#FFCC00" /> Choose your pickup stop
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {stops.map((stop) => {
            const isSelected = selectedStop?.station === stop.station;
            // Show arrival time in the station's local timezone, not the passenger's device time
            const timeStr = stop.departed ? "Departed" : stop.eta.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", timeZone: stop.tz });
            const hoursAway = (stop.offset / 60).toFixed(1);
            return (
              <div
                key={stop.station}
                onClick={() => stop.eligible && setSelectedStop(stop)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.6rem 0.85rem", borderRadius: 10, cursor: stop.eligible ? "pointer" : "default",
                  background: isSelected ? "#FFCC00" : stop.eligible ? "#fafaf9" : !stop.storeOpen && !stop.departed ? "#fff5f5" : "#f5f5f4",
                  border: isSelected ? "1.5px solid #b45309" : !stop.storeOpen && !stop.departed ? "1.5px solid #fca5a5" : "1.5px solid #e7e5e4",
                  opacity: stop.departed ? 0.4 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: stop.departed ? "#9ca3af" : stop.eligible ? "#16a34a" : !stop.storeOpen ? "#dc2626" : "#f59e0b" }} />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111" }}>{stop.station}</span>
                    <span style={{ fontSize: "0.72rem", color: "#6b7280", marginLeft: 6 }}>{stop.province}</span>
                    {stop.subtitle && (
                      <div style={{ fontSize: "0.62rem", color: "#9ca3af", marginTop: 1, fontStyle: "italic" }}>{stop.subtitle}</div>
                    )}
                    {stop.note && (
                      <div style={{ fontSize: "0.67rem", color: "#2563eb", fontWeight: 600, marginTop: 2, maxWidth: 180 }}>{stop.note}</div>
                    )}
                    {stop.distanceRisk && stop.eligible && (
                      <div style={{ fontSize: "0.66rem", color: "#b45309", fontWeight: 600, marginTop: 2, maxWidth: 200, display: "flex", alignItems: "center", gap: 3 }}>
                        ⚠️ Nearest store is {stop.storeDistanceKm}km from platform — order may be at risk if train runs on time
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#111" }}>{timeStr}</div>
                  {!stop.departed && (
                    <div style={{ fontSize: "0.68rem", fontWeight: 600,
                      color: stop.eligible ? "#16a34a" : !stop.storeOpen ? "#dc2626" : "#f59e0b" }}>
                      {stop.eligible
                        ? `✓ ${hoursAway}h away — eligible`
                        : !stop.storeOpen
                        ? `🔒 Stores closed at arrival`
                        : `⚠ Only ${hoursAway}h — too soon`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: "0.6rem", fontSize: "0.7rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: 5 }}>
          <Clock size={11} /> Store hours: 7:00 AM – 10:00 PM · 🔴 Red = stores closed at arrival time
        </div>
        {selectedStop && (
          <div style={{ marginTop: "0.75rem", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={13} color="#16a34a" />
            <span style={{ fontSize: "0.78rem", color: "#166534", fontWeight: 600 }}>
              Order by <strong>{cutoffStr}</strong> to receive at {selectedStop.station} (arriving {etaStr})
            </span>
          </div>
        )}
        {selectedStop?.nearbyPlaces && (
          <div style={{ marginTop: "0.75rem", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "0.75rem 0.9rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#92400e", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={12} color="#b45309" /> Nearby food at {selectedStop.station}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {selectedStop.nearbyPlaces.map((p) => (
                <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "#111" }}>{p.name}</span>
                    {p.rating && <span style={{ color: "#f59e0b", marginLeft: 5 }}>{p.rating}</span>}
                    <span style={{ color: "#6b7280", marginLeft: 5 }}>{p.price}</span>
                  </div>
                  <span style={{ color: "#9ca3af", whiteSpace: "nowrap", fontSize: "0.67rem" }}>{p.note}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.66rem", color: "#b45309" }}>
              💡 Order via Instacart — your Rail Certified shopper picks up and meets you at the platform
            </div>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", overflowX: "auto", paddingBottom: 4 }}>
        {Object.keys(INSTACART_CATALOGUE).map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: "0.4rem 0.85rem", borderRadius: 20, border: "none", cursor: "pointer", whiteSpace: "nowrap",
            fontWeight: 700, fontSize: "0.78rem",
            background: activeCategory === cat ? "#003D1F" : "#f5f5f4",
            color: activeCategory === cat ? "#fff" : "#6b7280",
          }}>{cat}</button>
        ))}
      </div>

      {/* Product grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: "0.85rem", marginBottom: "1.5rem" }}>
        {INSTACART_CATALOGUE[activeCategory].map((item) => {
          const inCart = cart.find((c) => c.id === item.id);
          return (
            <div key={item.id} className="card slide-up" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
              <div style={{ background: "#f0fdf4", height: 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, position: "relative" }}>
                <span style={{ fontSize: "2.6rem" }}>{item.emoji}</span>
                <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#16a34a", letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.vendor}</span>
                <span style={{ position: "absolute", top: 6, right: 6, background: "#003D1F", color: "#fff", borderRadius: 6, padding: "2px 6px", fontSize: "0.58rem", fontWeight: 800 }}>Instacart</span>
              </div>
              <div style={{ padding: "0.7rem", display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "0.83rem", color: "#111", lineHeight: 1.3, margin: 0 }}>{item.name}</p>
                <p style={{ fontSize: "0.68rem", color: "#6b7280", margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "0.5rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111" }}>${item.price.toFixed(2)}</span>
                  {inCart ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <button className="qty-btn" onClick={() => changeQty(item.id, inCart.qty - 1)} style={{ width: 22, height: 22, fontSize: "0.8rem" }}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 14, textAlign: "center", fontSize: "0.85rem" }}>{inCart.qty}</span>
                      <button className="qty-btn" onClick={() => addToCart(item)} style={{ width: 22, height: 22, fontSize: "0.8rem" }}>+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => selectedStop ? addToCart(item) : null}
                      disabled={!selectedStop}
                      style={{ background: selectedStop ? "#FFCC00" : "#e5e7eb", border: "none", borderRadius: 8, padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, cursor: selectedStop ? "pointer" : "not-allowed", color: "#111" }}
                    >+ Add</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Phase 2 AI Intelligence teaser */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.25rem", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.6rem" }}>
          <span style={{ fontSize: "1.2rem" }}>🧠</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.92rem" }}>Phase 2 — AI Onboard Intelligence</div>
            <div style={{ fontSize: "0.72rem", opacity: 0.75 }}>Coming soon · Powered by your purchase data</div>
          </div>
        </div>
        <p style={{ fontSize: "0.78rem", opacity: 0.9, margin: "0 0 0.85rem 0", lineHeight: 1.5 }}>
          Every Instacart order you place teaches our AI what passengers on your route actually want.
          Once we have enough signal, popular items get stocked <strong>onboard</strong> — available at the onboard pickup zone on every train, no platform stop required.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            ["📊", "AI learns demand per route, time, and season"],
            ["🚆", "VIA Rail stocks smarter based on predicted orders"],
            ["🛍️", "Onboard pickup zone stocked — no platform step needed"],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.76rem", opacity: 0.9 }}>
              <span>{icon}</span><span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "5rem" }}>
        <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#111", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 6 }}>
          <Users size={15} color="#FFCC00" /> How it works
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {ORDER_STEPS.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f5f5f4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>
                {step.icon}
              </div>
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontWeight: 700, fontSize: "0.83rem", color: "#111" }}>{step.label}</div>
                <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>{step.detail}</div>
              </div>
              {i < ORDER_STEPS.length - 1 && (
                <div style={{ position: "absolute", width: 2, height: 20, background: "#e5e7eb", marginLeft: 16, marginTop: 34 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cart bar */}
      {cartCount > 0 && !orderPlaced && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, padding: "0.85rem 1rem", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid #E8E8E8" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <button onClick={() => setCartOpen(true)} style={{ width: "100%", background: "#003D1F", color: "#fff", fontWeight: 800, fontSize: "0.95rem", border: "none", borderRadius: 50, padding: "0.85rem 1.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ background: "#FFCC00", color: "#111", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>{cartCount}</div>
                Review Pickup Order
              </div>
              <span>${cartTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Order tracking screen */}
      {orderPlaced && (
        <div className="card slide-up" style={{ padding: "1.5rem", marginBottom: "5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{ORDER_STEPS[orderStep]?.icon}</div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#111" }}>{ORDER_STEPS[orderStep]?.label}</div>
            <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>{ORDER_STEPS[orderStep]?.detail}</div>
            <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: 6 }}>Order {orderId} · Pickup at {selectedStop?.station}</div>
          </div>

          {/* Step tracker */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", padding: "0 0.25rem" }}>
            {ORDER_STEPS.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", flex: i < ORDER_STEPS.length - 1 ? 1 : 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: i <= orderStep ? "#003D1F" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", flexShrink: 0, transition: "background 0.4s" }}>
                  {i < orderStep ? <CheckCircle size={14} color="#FFCC00" /> : <span>{step.icon}</span>}
                </div>
                {i < ORDER_STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 3, background: i < orderStep ? "#003D1F" : "#e5e7eb", margin: "0 3px", transition: "background 0.4s" }} />
                )}
              </div>
            ))}
          </div>

          {orderStep < ORDER_STEPS.length - 1 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#6b7280", fontSize: "0.8rem" }}>
              <Loader size={14} className="animate-spin" /> Live tracking updating…
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#16a34a", marginBottom: "0.75rem" }}>🎉 Delivered! Enjoy your order.</div>
              <button onClick={() => { setOrderPlaced(false); setOrderStep(0); }} style={{ background: "#FFCC00", border: "none", borderRadius: 50, padding: "0.65rem 1.5rem", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}>Order Again</button>
            </div>
          )}
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div onClick={() => setCartOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }} />
          <div className="slide-up" style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff", borderRadius: "20px 20px 0 0", padding: "1.5rem", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontWeight: 800, fontSize: "1.1rem", color: "#111", margin: 0 }}>Pickup Order</h2>
              <button onClick={() => setCartOpen(false)} style={{ background: "#F5F5F5", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color="#6b7280" /></button>
            </div>

            {/* Pickup stop summary */}
            {selectedStop && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "0.65rem 0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <Train size={13} color="#16a34a" />
                <div style={{ fontSize: "0.78rem", color: "#166534", fontWeight: 600 }}>
                  Pickup at <strong>{selectedStop.station}</strong> · arriving {etaStr} · order by <strong>{cutoffStr}</strong>
                </div>
              </div>
            )}

            {/* Logistics chain */}
            <div style={{ background: "#f9fafb", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Delivery chain</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>
                <span>🛒 Instacart picks</span>
                <ChevronRight size={12} color="#9ca3af" />
                <span>🚗 Delivers to platform</span>
                <ChevronRight size={12} color="#9ca3af" />
                <span>🤝 VIA staff receives</span>
                <ChevronRight size={12} color="#9ca3af" />
                <span>🚆 Your seat</span>
              </div>
            </div>

            {/* Cart items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "1.25rem" }}>
              {cart.map((c) => {
                const item = allItems.find((i) => i.id === c.id);
                if (!item) return null;
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem", background: "#F9F9F9", borderRadius: 10 }}>
                    <div style={{ fontSize: "1.6rem", width: 44, height: 44, background: "#f0fdf4", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: "0.83rem", color: "#111", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                      <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: 0 }}>{item.vendor}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                      <button className="qty-btn" onClick={() => changeQty(c.id, c.qty - 1)} style={{ width: 22, height: 22 }}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 16, textAlign: "center", fontSize: "0.85rem" }}>{c.qty}</span>
                      <button className="qty-btn" onClick={() => changeQty(c.id, c.qty + 1)} style={{ width: 22, height: 22 }}>+</button>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: 52 }}>
                      <p style={{ fontWeight: 800, fontSize: "0.88rem", color: "#111", margin: 0 }}>${(item.price * c.qty).toFixed(2)}</p>
                      <button onClick={() => removeFromCart(c.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Trash2 size={12} color="#ef4444" /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: "1px solid #E8E8E8", paddingTop: "1rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "#111" }}>Order Total</span>
              <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "#111" }}>${cartTotal.toFixed(2)}</span>
            </div>
            <p style={{ fontSize: "0.68rem", color: "#9ca3af", marginBottom: "1rem", textAlign: "center" }}>Instacart service fees and taxes applied at checkout · Rail Certified shopper meets you at platform door</p>

            <button onClick={handlePlaceOrder} style={{ width: "100%", background: "#003D1F", color: "#fff", fontWeight: 800, fontSize: "1rem", border: "none", borderRadius: 50, padding: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <ShoppingBag size={18} /> Place Pickup Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pitch Tab ────────────────────────────────────────────────────────────────
function TabPitch() {
  const acct = JSON.parse(localStorage.getItem("railopt_account") || "{}");
  const founderName = acct.name || "Founder";

  const Section = ({ num, title, color = "#FFCC00", children }) => (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.75rem" }}>
        <div style={{ background: color, borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem", color: "#111", flexShrink: 0 }}>{num}</div>
        <h2 style={{ fontWeight: 800, fontSize: "1rem", color: "#111", margin: 0 }}>{title}</h2>
      </div>
      <div style={{ paddingLeft: 38 }}>{children}</div>
    </div>
  );

  const Bullet = ({ children }) => (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: "0.45rem" }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#FFCC00", marginTop: 7, flexShrink: 0 }} />
      <span style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.55 }}>{children}</span>
    </div>
  );

  const Stat = ({ val, label }) => (
    <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "0.6rem 0.75rem", textAlign: "center" }}>
      <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#92400e" }}>{val}</div>
      <div style={{ fontSize: "0.62rem", color: "#b45309", marginTop: 2, fontWeight: 600 }}>{label}</div>
    </div>
  );

  const Tag = ({ children, color = "#f5f5f4", text = "#374151" }) => (
    <span style={{ background: color, color: text, borderRadius: 99, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, display: "inline-block", margin: "3px 4px 3px 0" }}>{children}</span>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", paddingBottom: "3rem" }}>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1c1917 0%, #292524 100%)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.75rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🚆</div>
        <h1 style={{ fontWeight: 900, fontSize: "1.4rem", color: "#FFCC00", margin: "0 0 0.35rem" }}>RailOptAI Express Market</h1>
        <p style={{ color: "#e7e5e4", fontSize: "0.85rem", margin: "0 0 1rem", lineHeight: 1.5 }}>Onboard Retail & Destination Discovery Platform for VIA Rail</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {["SDG 7", "SDG 8", "SDG 9", "SDG 10", "SDG 11", "SDG 12"].map((s) => (
            <span key={s} style={{ background: "rgba(255,204,0,0.15)", border: "1px solid rgba(255,204,0,0.4)", borderRadius: 99, padding: "3px 10px", fontSize: "0.7rem", fontWeight: 700, color: "#FFCC00" }}>{s}</span>
          ))}
        </div>
      </div>

      {/* 1. The Problem */}
      <Section num="1" title="The Problem" color="#ef4444">
        <Bullet>VIA Rail carries <strong>4.4M passengers/year</strong> on 2–5 hour long-haul journeys — yet there is no digital commerce layer on any train.</Bullet>
        <Bullet>Passengers who forget medication, need a gift, or want local snacks have one option: <strong>sprint to a convenience store during a 10-minute stop</strong> and hope they make it back.</Bullet>
        <Bullet>VIA Rail spent <strong>$51.4M on onboard products in 2025 (+14.5% YoY)</strong> with no demand data behind that spend — stocking by intuition, not intelligence.</Bullet>
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "0.75rem 1rem", margin: "0.75rem 0", fontSize: "0.78rem", color: "#7f1d1d", fontStyle: "italic", lineHeight: 1.6 }}>
          "The Ontario Station [Sioux Lookout — remote boreal town in Northern Ontario, rail is the primary access] has a Subway just down the street — that's pushing it time wise — or a Rexall past the CIBC. There have been times the stop is long enough for a dash over to Subway but it is very rare. Make sure you have at least 20 minutes otherwise do NOT make the run." — Reddit, r/ViaRail
        </div>
        <Bullet>The demand is real and proven. VIA Rail just has no infrastructure to serve it.</Bullet>
      </Section>

      {/* 2. The Solution */}
      <Section num="2" title="The Solution" color="#22c55e">
        <Bullet><strong>Shop tab:</strong> 120+ non-perishable products from local artisans at 41 VIA Rail stations across 8 provinces — carried onboard on consignment, browsable via AI Concierge, collected at the café car pickup zone.</Bullet>
        <Bullet><strong>Pickup tab:</strong> Order from any local store near any stop. A Rail Certified Instacart shopper meets you at your car door during the scheduled stop — you never leave the train.</Bullet>
        <Bullet><strong>Phase 2 AI:</strong> Every order builds the demand dataset VIA Rail doesn't have. After 6–12 months of operation, we bring VIA route-level purchase intelligence and a forecasting licence — cutting waste from their $51.4M spend with data, not intuition.</Bullet>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, margin: "0.75rem 0" }}>
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "0.75rem" }}>
            <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "#166534", marginBottom: 4 }}>🛍️ Shop — Artisan Consignment</div>
            <div style={{ fontSize: "0.72rem", color: "#374151", lineHeight: 1.5 }}>Products loaded at origin station · café car pickup zone · AI-personalized feed</div>
          </div>
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "0.75rem" }}>
            <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "#166534", marginBottom: 4 }}>🛒 Pickup — Instacart Platform</div>
            <div style={{ fontSize: "0.72rem", color: "#374151", lineHeight: 1.5 }}>Any store · 2-hr lead time · platform handoff · business hours enforced · 5-step tracker</div>
          </div>
        </div>
      </Section>

      {/* 2B. Artisan Commerce Car */}
      <Section num="2B" title="Phase 3 — The Artisan Commerce Car" color="#f97316">
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "0.85rem 1rem", marginBottom: "0.85rem" }}>
          <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#9a3412", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            🚃 One coach car. Converted into VIA Rail's highest-revenue-per-square-foot asset.
          </div>
          <div style={{ fontSize: "0.76rem", color: "#7c2d12", lineHeight: 1.6 }}>
            A dedicated Artisan Discovery Car on long-distance trains — part artisan market, part F&B sampling lounge, part branded activation space. Passengers on The Canadian are onboard for <strong>2–4 days</strong>. They walk to the car. They're bored. They're in a discovery mindset. This is the highest-quality captive audience a CPG brand can buy.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, marginBottom: "0.85rem" }}>
          {[
            ["🧃", "Brand Sampling Fees", "F&B brands pay per trip to sample products to a verified passenger audience. Pricing comparable to experiential marketing activations — passengers who walk to the car chose to be there."],
            ["🍁", "Artisan Consignment Shelf", "Physical manifestation of the Shop tab. Products on the shelf, 15% commission per sale. Same consignment model — no upfront cost to VIA Rail."],
            ["🏷️", "Car Sponsorship", "A regional brand (e.g. BC winery on Toronto–Vancouver run) sponsors the entire car for a season — branding, sampling, exclusive shelf. A media buy, not a retail deal."],
            ["📊", "Physical + Digital Data", "Which samples get taken? Which products sell? Physical signals combined with app purchase data create a richer demand model than either alone — the Phase 2 AI gets smarter faster."],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ background: "#fff", border: "1px solid #fed7aa", borderRadius: 10, padding: "0.75rem" }}>
              <div style={{ fontWeight: 800, fontSize: "0.78rem", color: "#9a3412", marginBottom: 4 }}>{icon} {title}</div>
              <div style={{ fontSize: "0.68rem", color: "#374151", lineHeight: 1.45 }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#1c1917", borderRadius: 10, padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#e7e5e4", lineHeight: 1.6 }}>
          <span style={{ color: "#FFCC00", fontWeight: 800 }}>Timed to VIA's LDRR tender (Solicitation 202606009, June 2026):</span>{" "}
          VIA Rail is actively procuring F&B design expertise for their Long Distance Rail Renewal fleet right now. The Artisan Commerce Car is the service concept innovation that tender is looking for — RailOptAI provides the digital layer, the demand data, and the vendor relationships to make it viable from day one.
        </div>
      </Section>

      {/* 3. The Team */}
      <Section num="3" title="The Team" color="#8b5cf6">
        {/* Founder card */}
        <div style={{ background: "#faf5ff", border: "1px solid #c4b5fd", borderRadius: 10, padding: "0.85rem 1rem", marginBottom: "0.5rem" }}>
          <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#6d28d9", marginBottom: 6 }}>Simon Li — Co-Founder & Product Lead</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: "0.5rem" }}>
            {[
              ["🛍️", "Shopify", "Support Advisor · SMB · North America"],
              ["📊", "Kraft Heinz", "Consumer Insights Associate"],
              ["🛒", "Canadian Tire", "International E-commerce Associate"],
              ["⚙️", "Miele", "Intrapreneur & E-commerce"],
              ["🏦", "RBC", "IT Change Manager · Compliance & Audit"],
            ].map(([icon, co, role]) => (
              <div key={co} style={{ background: "#ede9fe", borderRadius: 8, padding: "3px 8px", fontSize: "0.68rem", color: "#4c1d95", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <span>{icon}</span>
                <span style={{ fontWeight: 800 }}>{co}</span>
                <span style={{ opacity: 0.75, fontWeight: 400 }}>· {role}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: "0.6rem" }}>
            <div style={{ background: "#f3e8ff", borderRadius: 8, padding: "3px 8px", fontSize: "0.68rem", color: "#6d28d9", fontWeight: 700 }}>🎓 B.Comm — Toronto Metropolitan University</div>
            <div style={{ background: "#f3e8ff", borderRadius: 8, padding: "3px 8px", fontSize: "0.68rem", color: "#6d28d9", fontWeight: 700 }}>🤖 AI Prototyping Executive Cert — Ivey Business School, Western University</div>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#374151", lineHeight: 1.7 }}>
            <strong>Why these companies matter for this product:</strong><br />
            • <strong>Shopify</strong> — advised thousands of SMB merchants across North America. Understands exactly what it takes to onboard vendors with zero e-commerce experience onto a platform that just works.<br />
            • <strong>Kraft Heinz</strong> — consumer insights role means direct experience turning purchase behaviour data into demand signals. This is Phase 2 of RailOptAI: route-level demand forecasting from real transaction data.<br />
            • <strong>Canadian Tire</strong> — international e-commerce operations at a major Canadian retailer. Knows how logistics, fulfilment, and digital shelf management actually work at scale.<br />
            • <strong>Miele</strong> — intrapreneurial role inside a premium brand. Built e-commerce from within an enterprise — the same model as deploying RailOptAI inside VIA Rail's existing infrastructure.<br />
            • <strong>RBC</strong> — IT Change Manager focused on compliance, audit, and governance. This is why PIPEDA + Bill C-27/CPPA compliance was architected from day one, not bolted on. A Crown Corporation like VIA Rail will ask about this on day one.
          </div>
        </div>

        {/* Co-founder card */}
        <div style={{ background: "#faf5ff", border: "1px solid #c4b5fd", borderRadius: 10, padding: "0.85rem 1rem", marginBottom: "0.5rem" }}>
          <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#6d28d9", marginBottom: 6 }}>Hannah Fu — Co-Founder & Supply Chain Lead</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: "0.5rem" }}>
            <div style={{ background: "#ede9fe", borderRadius: 8, padding: "3px 8px", fontSize: "0.68rem", color: "#4c1d95", fontWeight: 700 }}>📦 Supply Chain Professional</div>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#374151", lineHeight: 1.6 }}>
            Supply chain background is the operational backbone of the artisan consignment model. Hannah leads vendor onboarding logistics, consignment fulfilment design, and Indigenous & remote community vendor partnerships. Her expertise is why the model is zero upfront cost to vendors and zero inventory risk to VIA Rail — it's not a pitch claim, it's a supply chain architecture decision.
          </div>
        </div>

        <Bullet><strong>VIA Rail industry validation:</strong> Presented early concept in a 1:1 VIA Rail mentor session. Was challenged on a critical problem — dead zones with no cellular signal across Northern Ontario and remote Manitoba. Hard pivot followed: passenger phones as the compute device, offline-first order queue as the architecture. Dead zones became a feature.</Bullet>
        <Bullet>RBC compliance & audit background directly informs the PIPEDA + Bill C-27/CPPA data architecture — opt-in consent, right to delete, anonymous AI training aggregation.</Bullet>
        <Bullet>Positioned to launch Phase 1 without any VIA Rail contract — standalone passenger app, demand data collection starts at launch, leverage built before the procurement conversation.</Bullet>
      </Section>

      {/* 4. Why Now */}
      <Section num="4" title="Why Now?" color="#f59e0b">
        <Bullet><strong>VIA Rail's 32 new Venture trainsets</strong> just deployed on the Québec City–Windsor Corridor — a clean-slate digital infrastructure moment. No legacy system to integrate around.</Bullet>
        <Bullet><strong>Instacart + Uber partnership (May 2024)</strong> proves the platform pickup model at scale. Rail Certified shoppers ride the same wave.</Bullet>
        <Bullet><strong>AI inference costs collapsed</strong> — OpenRouter's Gemini Flash makes real-time product personalization and demand forecasting viable at zero marginal cost per query.</Bullet>
        <Bullet><strong>Post-pandemic modal shift</strong> — intercity rail ridership rebounding; VIA's 4.4M passenger year (2025) is the baseline, not the ceiling.</Bullet>
        <Bullet><strong>Bill C-27 / CPPA</strong> creates a trust gap for data-driven commerce. RailOptAI is built compliant from day one — a moat competitors can't retrofit easily.</Bullet>
      </Section>

      {/* 5. The Market */}
      <Section num="5" title="The Market" color="#06b6d4">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: "0.85rem" }}>
          <Stat val="4.4M" label="VIA Rail passengers/year" />
          <Stat val="$489M" label="2025 passenger revenue" />
          <Stat val="95%" label="long-haul corridor trips" />
          <Stat val="$51.4M" label="onboard product spend" />
        </div>
        <Bullet><strong>Primary users:</strong> VIA Rail passengers on long-haul intercity journeys (2–5 hours) — highest dwell time of any transit mode.</Bullet>
        <Bullet><strong>Secondary customers:</strong> Local artisan vendors along 41 stations in 8 provinces with zero existing e-commerce presence.</Bullet>
        <Bullet><strong>Enterprise customer (Phase 2):</strong> VIA Rail itself — a Crown Corporation with a $51.4M annual pain point and no current demand intelligence solution.</Bullet>
        <Bullet>Sole enterprise client: VIA Rail — Canada's national intercity rail operator, a Crown Corporation with a $51.4M annual cost line and no current demand intelligence infrastructure.</Bullet>
      </Section>

      {/* 6. Business Model */}
      <Section num="6" title="Business Model" color="#FFCC00">
        {[
          ["5%", "Commission per Pickup order", "On every Instacart station pickup processed through RailOptAI"],
          ["$1.99", "Platform fee per order", "Charged to passenger at checkout — below psychological resistance threshold"],
          ["15%", "Shop commission", "Standard marketplace take rate on every artisan sale"],
          ["$5K–25K", "Brand sampling fee per route", "F&B brands pay per trip to reach captive long-distance passengers in the Artisan Commerce Car — opt-in, discovery-mindset audience"],
          ["Season", "Car sponsorship", "Regional brand sponsors the entire Artisan Commerce Car for a season — branding, exclusive shelf, sampling rights on every departure"],
          ["SaaS", "Phase 2 licence to VIA Rail", "AI demand forecasting — route-level stocking recommendations backed by physical + digital purchase data"],
        ].map(([rate, name, desc]) => (
          <div key={name} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: "0.6rem", padding: "0.6rem 0.75rem", background: "#fff", border: "1px solid #e7e5e4", borderRadius: 10 }}>
            <div style={{ fontWeight: 900, fontSize: "1rem", color: "#FFCC00", minWidth: 42, flexShrink: 0 }}>{rate}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#111" }}>{name}</div>
              <div style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.4, marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "0.65rem 0.85rem", marginTop: "0.5rem", fontSize: "0.78rem", color: "#92400e", lineHeight: 1.5 }}>
          <strong>Phase 1 ARR estimate:</strong> At 4.4M passengers/year with 2% Pickup conversion ($25 AOV) and 5% Shop conversion ($18 AOV) → <strong>~$270K ARR</strong> before Phase 2 SaaS revenue.
        </div>
      </Section>

      {/* 7. Measurable Impact */}
      <Section num="7" title="Measurable Impact" color="#10b981">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: "0.85rem" }}>
          {[
            ["SDG 7", "⚡", "Zero-marginal-carbon commerce on existing clean rail infrastructure"],
            ["SDG 8", "💼", "New income channel for artisans with zero e-commerce setup"],
            ["SDG 10", "🪶", "Indigenous & remote vendors: equal digital shelf, real economic access"],
            ["SDG 9", "🏗️", "Offline-first infrastructure + AI demand forecasting"],
            ["SDG 11", "🏙️", "Modal shift; 41 corridor communities promoted"],
            ["SDG 12", "♻️", "Consignment model eliminates VIA's overstock waste"],
          ].map(([sdg, icon, desc]) => (
            <div key={sdg} style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "0.65rem 0.7rem" }}>
              <div style={{ fontWeight: 800, fontSize: "0.75rem", color: "#166534", marginBottom: 3 }}>{icon} {sdg}</div>
              <div style={{ fontSize: "0.65rem", color: "#374151", lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
        <Bullet><strong>Success metrics:</strong> Order conversion rate, artisan vendor revenue per route, CO₂ avoided per passenger-km, Phase 2 AI forecast accuracy vs. actual VIA stocking needs.</Bullet>
        <Bullet>Phase 2 impact: measurable reduction in VIA Rail's $51.4M onboard product waste line — a trackable, auditable outcome tied directly to the AI's route forecasts.</Bullet>
      </Section>

      {/* 8. Additional */}
      <Section num="8" title="Additional Information" color="#6b7280">
        <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#374151", marginBottom: "0.4rem" }}>Competitive Advantage</div>
        <Bullet>The only platform that combines onboard artisan consignment + Instacart platform pickup + AI demand intelligence in a single rail-native product.</Bullet>
        <Bullet>2018 Metrolinx/PC Express pilot failed: order-night-before, walk to locker, Loblaws only, no personalization, 3-min commuter stops. RailOptAI solves every one of those failure modes.</Bullet>

        <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#374151", margin: "0.75rem 0 0.4rem" }}>Go-to-Market — No Permission Needed</div>
        <Bullet>Phase 1 launches as a standalone passenger app — no VIA Rail contract required. Instacart shoppers already service station areas.</Bullet>
        <Bullet>This sidesteps the 18–36 month Crown Corporation procurement cycle. We build leverage before we knock on the door.</Bullet>

        <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#374151", margin: "0.75rem 0 0.4rem" }}>Traction & Validation</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: "0.5rem" }}>
          {["120+ products catalogued", "41 stations mapped", "8 provinces", "Live demo deployed", "PIPEDA compliant", "OpenRouter AI integrated", "VIA Rail mentor 1:1", "Dead zone pivot validated"].map((t) => (
            <Tag key={t} color="#f0fdf4" text="#166534">{t}</Tag>
          ))}
        </div>
        <Bullet><strong>VIA Rail mentor session</strong> confirmed the real dead zone problem on The Canadian (Northern Ontario, remote Manitoba). This single session reshaped the entire architecture — store-and-forward queue, offline-first sync, passenger phones as the primary device. The mentor is our first industry contact for Phase 2 partnership conversations.</Bullet>
        <Bullet><strong>Market evidence datasets used:</strong> VIA Rail 2025 Annual Report (4.4M passengers, $51.4M onboard product costs, 35% on-time rate, $375.7M subsidy), VIA LDRR Tender 202606009 (June 2026 F&B Design Consultancy), VIA fare matrix (Winter 2025/26 season), Instacart–Uber Eats partnership data (May 2024).</Bullet>

        <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#374151", margin: "0.75rem 0 0.4rem" }}>Diversity &amp; Inclusion — Equal Digital Shelf</div>
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "0.75rem 0.9rem", marginBottom: "0.5rem", fontSize: "0.78rem", color: "#78350f", lineHeight: 1.55 }}>
          <strong>🪶 Indigenous &amp; Remote Community Vendors</strong> — A Churchill, MB vendor has the same digital shelf space as a Toronto vendor. RailOptAI does not tier by geography. VIA Rail's mandatory remote routes — Churchill MB, Thompson MB, The Pas MB, and Sioux Lookout ON (a remote boreal town in Northern Ontario where rail is the primary access) — are not afterthoughts. They are the core case for why this platform exists.
        </div>
        <Bullet>Pelican Lake First Nation artisans (Sioux Lookout, ON — remote boreal, rail-primary access), Opaskwayak Cree Nation (The Pas, MB), Itsanitaq Museum (Churchill, MB) — all catalogued at launch with 🪶 Indigenous badge and dedicated filter in the Shop.</Bullet>
        <Bullet>For communities with no road access (Churchill, Manitoba — rail-only in winter), RailOptAI is not a convenience layer — it's the only scalable e-commerce channel. Every sale on The Canadian is economic infrastructure for these vendors.</Bullet>
        <Bullet>Aligns directly with SDG 10 (reduced inequalities) — measurable outcome: Indigenous vendor revenue per route vs. southern corridor average.</Bullet>

        <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#374151", margin: "0.75rem 0 0.4rem" }}>Scalability & Roadmap</div>
        <Bullet><strong>Phase 1:</strong> Passenger app live — Instacart Pickup + artisan Shop operational, demand data collection begins across VIA Rail routes.</Bullet>
        <Bullet><strong>Phase 2:</strong> AI demand forecasting SaaS delivered to VIA Rail — route-level stocking recommendations built from Phase 1 purchase data, targeting their $51.4M cost line.</Bullet>
        <Bullet><strong>Phase 3:</strong> Artisan Commerce Car partnership with VIA Rail — physical branded discovery car on long-distance trains, sampling revenue, and combined physical + digital demand intelligence for LDRR fleet.</Bullet>
      </Section>

    </div>
  );
}

const TABS = [
  { id: "retail",    emoji: "🛍️", label: "Shop" },
  { id: "instacart", emoji: "🛒", label: "Pickup" },
  { id: "discover",  emoji: "🧭", label: "Discover" },
  { id: "account",   emoji: "👤", label: "Account" },
  { id: "pitch",     emoji: "🎯", label: "Pitch" },
];

export default function App() {
  const [tab, setTab] = useState("pitch");
  const [shopStation, setShopStation] = useState("All");

  const handleShopStation = (stationName) => {
    setShopStation(stationName);
    setTab("retail");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5", color: "#111", paddingBottom: 80, overflowX: "hidden", maxWidth: "100vw" }}>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E8E8E8", position: "sticky", top: 0, zIndex: 50, overflowX: "hidden" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "#FFCC00", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Train size={20} color="#111" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111", lineHeight: 1.2 }}>RailOptAI Express</div>
                <div style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em" }}>VIA Rail Onboard Market</div>
              </div>
            </div>

          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: "1 0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                padding: "0.5rem 0.4rem", minWidth: 52, fontSize: "0.68rem", fontWeight: 700,
                borderBottom: tab === t.id ? "2.5px solid #FFCC00" : "2.5px solid transparent",
                color: tab === t.id ? "#111" : "#9ca3af",
                background: "transparent", border: "none",
                borderBottomWidth: "2.5px", borderBottomStyle: "solid",
                borderBottomColor: tab === t.id ? "#FFCC00" : "transparent",
                cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
              }}>
                <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      {/* Hero tagline — always visible, every tab */}
      <div style={{ background: "linear-gradient(90deg, #1c1917 0%, #292524 100%)", borderBottom: "1px solid #FFCC00" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.1rem" }}>🚆</span>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#e7e5e4", lineHeight: 1.4 }}>
            <strong style={{ color: "#FFCC00" }}>Forgot something? Need something?</strong>
            {" "}You're on a train — it comes to you. Local artisan picks at the onboard pickup zone. Anything else at the platform.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "1.25rem 1rem", overflowX: "hidden" }}>
        {tab === "retail"    && <Tab1 shopStation={shopStation} onStationHandled={() => setShopStation("All")} />}
        {tab === "instacart" && <TabInstacart />}
        {tab === "discover"  && <Tab4 onShopStation={handleShopStation} />}
        {tab === "account"   && <TabAccount />}
        {tab === "pitch"     && <TabPitch />}
      </main>
    </div>
  );
}
