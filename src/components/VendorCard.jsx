import { useState } from "react";
import { t } from "../data/languages.js";
import { VEGETABLES } from "../data/vegetables.js";
import { speak } from "../hooks/useVoice.js";

const CROWD_COLORS = { Low: "#25a463", Medium: "#f07d2a", High: "#e53935" };
const CROWD_EMOJI = { Low: "😊", Medium: "😐", High: "😰" };

export function VendorCard({ vendor, lang, onSelect }) {
  const [showUPI, setShowUPI] = useState(false);

  const inStockCount = vendor.inventory.filter(i => i.inStock).length;

  function shareOnWhatsApp() {
    const items = vendor.inventory.filter(i => i.inStock).map(i => {
      const veg = VEGETABLES.find(v => v.id === i.vegId);
      return `${veg?.emoji} ${veg?.names[lang] || veg?.names.en}: ₹${i.price}/kg`;
    }).join("\n");
    const msg = `🛒 *${vendor.name}*\n📍 ${vendor.location}\n⭐ ${vendor.rating}/5\n\n*Today's Stock:*\n${items}\n\n📱 Order: ${vendor.phone}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function speakVendorInfo() {
    const text = `${vendor.name}. ${t("distance", lang)}: ${vendor.distance} km. ${t("rating", lang)}: ${vendor.rating}. ${vendor.isOpen ? t("open", lang) : t("closed", lang)}.`;
    speak(text, lang);
  }

  return (
    <div style={s.card} className="fade-in">
      {/* Image */}
      <div style={s.imageWrap} onClick={() => onSelect(vendor)}>
        <img src={vendor.image} alt={vendor.name} style={s.image} onError={e => e.target.style.display = "none"} />
        <div style={s.imageOverlay} />
        <div style={{ ...s.statusBadge, background: vendor.isOpen ? "#25a463" : "#e53935" }}>
          {vendor.isOpen ? t("open", lang) : t("closed", lang)}
        </div>
        <div style={{ ...s.crowdBadge, color: CROWD_COLORS[vendor.crowdLevel] }}>
          {CROWD_EMOJI[vendor.crowdLevel]} {vendor.crowdLevel}
        </div>
      </div>

      <div style={s.body}>
        <div style={s.row}>
          <div style={{ flex: 1 }}>
            <h3 style={s.name} onClick={() => onSelect(vendor)}>{vendor.name}</h3>
            <div style={s.location}>📍 {vendor.location} · {vendor.distance} km {t("distance", lang)}</div>
          </div>
          <button style={s.speakBtn} onClick={speakVendorInfo} title={t("tapToHear", lang)}>🔊</button>
        </div>

        <div style={s.statsRow}>
          <span style={s.rating}>⭐ {vendor.rating}</span>
          <span style={s.reviews}>({vendor.reviews} {t("reviews", lang)})</span>
          <span style={s.stockCount}>🥦 {inStockCount} items</span>
        </div>

        {/* Veg preview */}
        <div style={s.vegPreview}>
          {vendor.inventory.slice(0, 4).map(item => {
            const veg = VEGETABLES.find(v => v.id === item.vegId);
            if (!veg) return null;
            return (
              <div key={item.vegId} style={{ ...s.vegChip, opacity: item.inStock ? 1 : 0.4 }}>
                <span>{veg.emoji}</span>
                <span style={s.vegName}>{veg.names[lang] || veg.names.en}</span>
                <span style={s.vegPrice}>₹{item.price}</span>
                {!item.inStock && <span style={s.outDot}>✗</span>}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={s.actions}>
          <button style={s.viewBtn} onClick={() => onSelect(vendor)}>
            👁 {t("available", lang)}
          </button>
          <button style={s.whatsappBtn} onClick={shareOnWhatsApp}>
            📱 WhatsApp
          </button>
          <button style={s.upiBtn} onClick={() => setShowUPI(!showUPI)}>
            💳 UPI
          </button>
        </div>

        {/* UPI Payment */}
        {showUPI && (
          <div style={s.upiBox}>
            <div style={s.upiTitle}>📲 Pay via UPI</div>
            <div style={s.upiId}>{vendor.upiId}</div>
            <button style={s.copyBtn} onClick={() => { navigator.clipboard.writeText(vendor.upiId); alert("UPI ID Copied!"); }}>
              📋 Copy UPI ID
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  card: { background: "#fff", borderRadius: 20, overflow: "hidden", marginBottom: 16, boxShadow: "0 2px 12px rgba(26,122,74,0.08)" },
  imageWrap: { position: "relative", height: 160, cursor: "pointer" },
  image: { width: "100%", height: "100%", objectFit: "cover" },
  imageOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)" },
  statusBadge: { position: "absolute", top: 10, left: 10, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  crowdBadge: { position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 },
  body: { padding: "12px 14px" },
  row: { display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  name: { fontSize: 15, fontWeight: 700, color: "#1a2e1a", marginBottom: 3, cursor: "pointer" },
  location: { fontSize: 12, color: "#8aaa84" },
  speakBtn: { background: "#e8f5ee", border: "none", borderRadius: 10, padding: "6px 8px", fontSize: 16, cursor: "pointer", flexShrink: 0 },
  statsRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  rating: { fontSize: 13, fontWeight: 600, color: "#f07d2a" },
  reviews: { fontSize: 11, color: "#8aaa84" },
  stockCount: { fontSize: 11, color: "#25a463", marginLeft: "auto" },
  vegPreview: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 },
  vegChip: { display: "flex", alignItems: "center", gap: 4, background: "#f7f9f5", borderRadius: 10, padding: "4px 8px", fontSize: 11 },
  vegName: { color: "#4a6741", fontWeight: 500 },
  vegPrice: { color: "#25a463", fontWeight: 700 },
  outDot: { color: "#e53935", fontSize: 10 },
  actions: { display: "flex", gap: 8 },
  viewBtn: { flex: 2, padding: "9px", background: "#e8f5ee", color: "#1a7a4a", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  whatsappBtn: { flex: 2, padding: "9px", background: "#dcf8c6", color: "#075e54", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  upiBtn: { flex: 1, padding: "9px", background: "#f0e8ff", color: "#6200ea", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  upiBox: { marginTop: 10, background: "#f0e8ff", borderRadius: 12, padding: 12, textAlign: "center" },
  upiTitle: { fontSize: 12, color: "#6200ea", fontWeight: 600, marginBottom: 4 },
  upiId: { fontSize: 14, fontWeight: 700, color: "#1a2e1a", marginBottom: 8 },
  copyBtn: { background: "#6200ea", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" },
};
