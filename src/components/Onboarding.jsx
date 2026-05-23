import { useState } from "react";

const SLIDES = [
  {
    emoji: "🥦",
    bg: "linear-gradient(160deg,#e8f5ee,#d4f0e4)",
    title: "Fresh Veggies Near You",
    sub: "Find local street vendors in Hyderabad with live stock and prices.",
  },
  {
    emoji: "🗣️",
    bg: "linear-gradient(160deg,#fff3e8,#ffe0c8)",
    title: "10+ Indian Languages",
    sub: "Use StreetMart in Hindi, Telugu, Tamil, Kannada and more. Voice search included.",
  },
  {
    emoji: "👫",
    bg: "linear-gradient(160deg,#e3f2fd,#bbdefb)",
    title: "Group Buying & Deals",
    sub: "Join neighbours for group discounts. Buy 5kg+ for automatic bulk savings.",
  },
  {
    emoji: "📱",
    bg: "linear-gradient(160deg,#f3e8ff,#e1c4ff)",
    title: "Works Offline Too",
    sub: "Install StreetMart on your phone. Browse vendors even without internet.",
  },
];

export function Onboarding({ onDone }) {
  const [slide, setSlide] = useState(0);
  const s = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="onboard-page" style={{ background: s.bg, transition: "background 0.5s ease" }}>
      {/* Skip */}
      <button style={{ position:"absolute", top:20, right:20, background:"rgba(0,0,0,0.1)", border:"none", borderRadius:20, padding:"6px 14px", fontSize:12, color:"#555", fontWeight:600 }}
        onClick={onDone}>Skip</button>

      {/* Emoji */}
      <div className="float" style={{ fontSize:90, marginBottom:24, filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.12))" }}>
        {s.emoji}
      </div>

      {/* Text */}
      <div key={slide} className="bounce-in" style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ fontSize:24, fontWeight:800, color:"#1a2e1a", marginBottom:10, lineHeight:1.3 }}>{s.title}</div>
        <div style={{ fontSize:14, color:"#4a6741", lineHeight:1.6, maxWidth:280 }}>{s.sub}</div>
      </div>

      {/* Dots */}
      <div style={{ display:"flex", gap:8, marginBottom:32 }}>
        {SLIDES.map((_, i) => (
          <div key={i} style={{ width: i === slide ? 24 : 8, height:8, borderRadius:4, background: i === slide ? "#25a463" : "#c8e6c9", transition:"all 0.3s ease" }} />
        ))}
      </div>

      {/* Button */}
      <button
        style={{ background: isLast ? "linear-gradient(135deg,#25a463,#1a7a4a)" : "#fff", color: isLast ? "#fff" : "#1a7a4a", border: isLast ? "none" : "2px solid #25a463", borderRadius:20, padding:"14px 48px", fontSize:15, fontWeight:700, boxShadow:"0 4px 20px rgba(37,164,99,0.25)", transition:"all 0.3s ease" }}
        onClick={() => isLast ? onDone() : setSlide(s => s + 1)}>
        {isLast ? "🚀 Get Started" : "Next →"}
      </button>
    </div>
  );
}
