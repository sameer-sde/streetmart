import { useState } from "react";
import { VEGETABLES } from "../data/vegetables.js";
import { speak } from "../hooks/useVoice.js";

const HISTORY = {
  tomato: [28, 32, 25, 30, 22, 28, 25],
  onion:  [20, 18, 22, 25, 20, 18, 20],
  potato: [15, 18, 17, 20, 18, 17, 17],
  carrot: [35, 38, 32, 40, 35, 32, 32],
  spinach:[12, 10, 15, 12, 8,  10, 10],
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];

export function PriceHistory({ lang }) {
  const [selected, setSelected] = useState("tomato");
  const veg = VEGETABLES.find(v => v.id === selected);
  const prices = HISTORY[selected] || [];
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const trend = prices[6] < prices[0] ? "📉 Price dropped" : prices[6] > prices[0] ? "📈 Price rising" : "➡️ Stable";
  const trendColor = prices[6] < prices[0] ? "#25a463" : prices[6] > prices[0] ? "#e53935" : "#f07d2a";
  const H = 120;

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.title}>📊 Price History (7 Days)</div>
        <button style={s.speakBtn} onClick={() => speak(`${veg?.names[lang] || veg?.names.en}. Today price ${prices[6]} rupees. ${trend}`, lang)}>🔊</button>
      </div>

      {/* Veg selector */}
      <div style={s.vegScroll}>
        {Object.keys(HISTORY).map(id => {
          const v = VEGETABLES.find(x => x.id === id);
          return (
            <button key={id} style={{ ...s.vegBtn, background: selected === id ? "#25a463" : "#f7f9f5", color: selected === id ? "#fff" : "#1a2e1a" }}
              onClick={() => setSelected(id)}>
              {v?.emoji} {v?.names[lang] || v?.names.en}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div style={s.chartWrap}>
        <svg width="100%" height={H + 40} viewBox={`0 0 300 ${H + 40}`}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <line key={i} x1="30" y1={10 + f * H} x2="290" y2={10 + f * H}
              stroke="#f0f0f0" strokeWidth="1" />
          ))}
          {/* Price labels */}
          {[max, Math.round((max + min) / 2), min].map((p, i) => (
            <text key={i} x="24" y={10 + (i / 2) * H + 4} fontSize="9" fill="#8aaa84" textAnchor="end">₹{p}</text>
          ))}
          {/* Line */}
          <polyline
            points={prices.map((p, i) => `${30 + (i * 40)},${10 + H - ((p - min) / (max - min + 1)) * H}`).join(" ")}
            fill="none" stroke="#25a463" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Area fill */}
          <polygon
            points={[
              ...prices.map((p, i) => `${30 + (i * 40)},${10 + H - ((p - min) / (max - min + 1)) * H}`),
              `${30 + 6 * 40},${10 + H}`, `30,${10 + H}`
            ].join(" ")}
            fill="rgba(37,164,99,0.08)" />
          {/* Dots */}
          {prices.map((p, i) => (
            <g key={i}>
              <circle cx={30 + i * 40} cy={10 + H - ((p - min) / (max - min + 1)) * H}
                r={i === 6 ? 6 : 4} fill={i === 6 ? "#25a463" : "#fff"} stroke="#25a463" strokeWidth="2" />
              <text x={30 + i * 40} y={H + 30} fontSize="9" fill="#8aaa84" textAnchor="middle">{DAYS[i]}</text>
              <text x={30 + i * 40} y={10 + H - ((p - min) / (max - min + 1)) * H - 8}
                fontSize="9" fill="#25a463" textAnchor="middle" fontWeight={i === 6 ? "700" : "400"}>₹{p}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Summary */}
      <div style={s.summary}>
        <div style={s.summaryItem}>
          <div style={s.summaryVal}>₹{prices[6]}</div>
          <div style={s.summaryLabel}>Today</div>
        </div>
        <div style={s.summaryItem}>
          <div style={s.summaryVal}>₹{min}</div>
          <div style={s.summaryLabel}>Week Low</div>
        </div>
        <div style={s.summaryItem}>
          <div style={s.summaryVal}>₹{max}</div>
          <div style={s.summaryLabel}>Week High</div>
        </div>
        <div style={s.summaryItem}>
          <div style={{ ...s.summaryVal, color: trendColor }}>{trend.split(" ")[0]}</div>
          <div style={s.summaryLabel}>{trend.split(" ").slice(1).join(" ")}</div>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: { background: "#fff", borderRadius: 18, padding: 16, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 15, fontWeight: 700, color: "#1a2e1a" },
  speakBtn: { background: "#e8f5ee", border: "none", borderRadius: 20, padding: "6px 10px", fontSize: 16, cursor: "pointer" },
  vegScroll: { display: "flex", gap: 8, overflowX: "auto", marginBottom: 12, paddingBottom: 4 },
  vegBtn: { border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  chartWrap: { width: "100%", overflow: "hidden" },
  summary: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 8 },
  summaryItem: { background: "#f7f9f5", borderRadius: 10, padding: "8px 4px", textAlign: "center" },
  summaryVal: { fontSize: 14, fontWeight: 800, color: "#1a2e1a", marginBottom: 2 },
  summaryLabel: { fontSize: 9, color: "#8aaa84" },
};
