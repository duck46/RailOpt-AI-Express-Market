import { useState, useEffect, useCallback } from "react";
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
          <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#92400e", margin: "0 0 2px" }}>Delivered to your seat</p>
          <p style={{ fontSize: "0.78rem", color: "#b45309", margin: 0, lineHeight: 1.5 }}>
            A VIA Rail crew member will bring your items to your seat at the next platform stop.
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
                  <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 4 }}>Delivered to your seat at the next stop</p>
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
  const [aiPrompts, setAiPrompts] = useState({});
  const [aiResults, setAiResults] = useState({});
  const [aiLoading, setAiLoading] = useState({});
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

  // CO₂ savings vs driving: car ~0.21 kg/km, VIA Rail ~0.04 kg/km/passenger → 0.17 kg/km saved
  const co2Saved = nearestDistanceKm ? Math.round(nearestDistanceKm * 0.17) : null;

  const stations = ["All", ...Array.from(new Set(items.map((i) => i.station)))];
  const filtered = (activeStation === "All" ? items : items.filter((i) => i.station === activeStation))
    .filter((i) => !ecoOnly || i.sustainable);
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
                By taking the train you've avoided ~<strong>{co2Saved} kg CO₂</strong> vs. driving this distance — equivalent to planting {Math.max(1, Math.round(co2Saved / 21))} tree{Math.round(co2Saved / 21) !== 1 ? "s" : ""}.
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

      {/* Station filter pills + eco toggle */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setEcoOnly((v) => !v)}
          style={{
            padding: "0.35rem 0.85rem", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
            background: ecoOnly ? "#dcfce7" : "#f5f5f4",
            color: ecoOnly ? "#166534" : "#6b7280",
            border: ecoOnly ? "1.5px solid #86efac" : "1.5px solid #e7e5e4",
          }}
        >
          🌿 Eco Picks
        </button>
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
          {recommendedIds.length > 0 && (
            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8, margin: "0.25rem 0 0.5rem" }}>
              <Zap size={14} color="#b45309" />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#78350f" }}>AI picks for "{aiQuery}"</span>
            </div>
          )}
          {aiNoMatch && recommendedIds.length === 0 && (
            <div style={{ gridColumn: "1 / -1", background: "#fef9c3", border: "1px solid #fde047", borderRadius: 12, padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: 10, margin: "0.25rem 0 0.5rem" }}>
              <AlertTriangle size={15} color="#a16207" />
              <span style={{ fontSize: "0.82rem", color: "#78350f", fontWeight: 600 }}>No catalogue items match "{aiQuery}" — try a different search or browse by station.</span>
            </div>
          )}
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
                  {item.sustainable && (
                    <span style={{ position: "absolute", top: 6, left: 6, background: "#dcfce7", borderRadius: 6, padding: "2px 7px", fontSize: "0.62rem", fontWeight: 800, color: "#166534", display: "flex", alignItems: "center", gap: 3 }}>
                      🌿 Eco
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

// ─── Tab 4: Discover ─────────────────────────────────────────────────────────

function Tab4({ onShopStation }) {
  const [destinations, setDestinations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/destinations`)
      .then((r) => r.json())
      .then((d) => setDestinations(d.destinations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
  const byProvince = destinations.reduce((acc, d) => {
    (acc[d.province] = acc[d.province] || []).push(d);
    return acc;
  }, {});

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
      <Loader size={24} color="#FFCC00" className="animate-spin" />
    </div>
  );

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
    from: "RailOpt Express",
    avatar: "🚆",
    subject: "Your order is being prepared",
    body: "Your order ORD-1001 is currently being prepared by our onboard team. Estimated delivery to your seat in 8–12 minutes.",
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
    from: "RailOpt AI",
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {field("Full Name", "name", "text", "Jane Smith")}
            {field("Email", "email", "email", "jane@example.com")}
            {field("VIA Préférence #", "viaNumber", "text", "123456789")}
          </div>
        </div>

        <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111", display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
            <Train size={16} color="#FFCC00" /> Journey Details
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {field("Car Number", "seatCar", "text", "e.g. 4")}
            {field("Seat Number", "seatNumber", "text", "e.g. 22A")}
          </div>
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
            <button onClick={() => { localStorage.removeItem("railopt_orders"); setOrders([]); }} style={{ background: "none", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 10, padding: "0.5rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
              Clear History
            </button>
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

// Demo train schedule: offsets in minutes from "now" (Toronto → Montréal)
const DEMO_STOPS = [
  { station: "Toronto",    province: "ON", offset: -45,  departed: true },
  { station: "Cobourg",    province: "ON", offset: 65 },
  { station: "Kingston",   province: "ON", offset: 185 },
  { station: "Brockville", province: "ON", offset: 255 },
  { station: "Ottawa",     province: "ON", offset: 375 },
  { station: "Montréal",   province: "QC", offset: 555 },
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
  { icon: "🛒", label: "Order placed",           detail: "Sent to Instacart network" },
  { icon: "🏪", label: "Shopper picking",         detail: "At store near your stop" },
  { icon: "🚗", label: "En route to station",     detail: "Heading to platform" },
  { icon: "🤝", label: "Handoff to VIA staff",    detail: "Staff signed & received" },
  { icon: "🚆", label: "Delivered to your seat",  detail: "Enjoy your order!" },
];

function TabInstacart() {
  const now = Date.now();
  const stops = DEMO_STOPS.map((s) => ({
    ...s,
    eta: new Date(now + s.offset * 60000),
    minutesAway: s.offset,
    eligible: !s.departed && s.offset >= MIN_LEAD_MIN,
  }));

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

  const cutoffTime = selectedStop ? new Date(now + (selectedStop.offset - MIN_LEAD_MIN) * 60000) : null;
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
            <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Order from any local store. VIA Rail staff deliver to your seat.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: "0.75rem", flexWrap: "wrap" }}>
          {[["🏪", "Any local store"], ["🤝", "VIA staff handoff"], ["🚆", "Seat delivery"]].map(([icon, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", opacity: 0.9 }}>
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Train schedule + stop selector */}
      <div className="card" style={{ padding: "1.1rem 1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#111", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
          <Train size={15} color="#FFCC00" /> Choose your pickup stop
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {stops.map((stop) => {
            const isSelected = selectedStop?.station === stop.station;
            const timeStr = stop.departed ? "Departed" : stop.eta.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" });
            const hoursAway = (stop.offset / 60).toFixed(1);
            return (
              <div
                key={stop.station}
                onClick={() => stop.eligible && setSelectedStop(stop)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.6rem 0.85rem", borderRadius: 10, cursor: stop.eligible ? "pointer" : "default",
                  background: isSelected ? "#FFCC00" : stop.eligible ? "#fafaf9" : "#f5f5f4",
                  border: isSelected ? "1.5px solid #b45309" : "1.5px solid #e7e5e4",
                  opacity: stop.departed ? 0.4 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: stop.departed ? "#9ca3af" : stop.eligible ? "#16a34a" : "#f59e0b" }} />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111" }}>{stop.station}</span>
                    <span style={{ fontSize: "0.72rem", color: "#6b7280", marginLeft: 6 }}>{stop.province}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#111" }}>{timeStr}</div>
                  {!stop.departed && (
                    <div style={{ fontSize: "0.68rem", color: stop.eligible ? "#16a34a" : "#f59e0b", fontWeight: 600 }}>
                      {stop.eligible ? `✓ ${hoursAway}h away — eligible` : `⚠ Only ${hoursAway}h — too soon`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {selectedStop && (
          <div style={{ marginTop: "0.85rem", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={13} color="#16a34a" />
            <span style={{ fontSize: "0.78rem", color: "#166534", fontWeight: 600 }}>
              Order by <strong>{cutoffStr}</strong> to receive at {selectedStop.station} (arriving {etaStr})
            </span>
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
            <p style={{ fontSize: "0.68rem", color: "#9ca3af", marginBottom: "1rem", textAlign: "center" }}>Instacart service fees and taxes applied at checkout · Delivered to seat {JSON.parse(localStorage.getItem("railopt_account") || "{}").seatNumber || "—"}</p>

            <button onClick={handlePlaceOrder} style={{ width: "100%", background: "#003D1F", color: "#fff", fontWeight: 800, fontSize: "1rem", border: "none", borderRadius: 50, padding: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <ShoppingBag size={18} /> Place Pickup Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: "retail",    emoji: "🛍️", label: "Shop" },
  { id: "instacart", emoji: "🛒", label: "Pickup" },
  { id: "discover",  emoji: "🧭", label: "Discover" },
  { id: "account",   emoji: "👤", label: "Account" },
];

export default function App() {
  const [tab, setTab] = useState("retail");
  const [shopStation, setShopStation] = useState("All");

  const handleShopStation = (stationName) => {
    setShopStation(stationName);
    setTab("retail");
  };

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
        {tab === "retail"    && <Tab1 shopStation={shopStation} onStationHandled={() => setShopStation("All")} />}
        {tab === "instacart" && <TabInstacart />}
        {tab === "discover"  && <Tab4 onShopStation={handleShopStation} />}
        {tab === "account"   && <TabAccount />}
      </main>
    </div>
  );
}
