import { useState, useEffect } from "react";

const MOCK_STORIES = [
  { id: "s1", vendorId: "v1", vendorName: "Ramu Fresh", avatar: "🧑‍🌾", bg: "linear-gradient(135deg,#25a463,#1a7a4a)", emoji: "🍅", text: "Fresh tomatoes just arrived! 50kg 🔥", time: Date.now() - 1000 * 60 * 15, items: ["tomato","onion"], viewed: false },
  { id: "s2", vendorId: "v4", vendorName: "Abids Corner", avatar: "👨‍🍳", bg: "linear-gradient(135deg,#f07d2a,#c85a00)", emoji: "🧅", text: "Onions ₹20/kg today only! Limited stock ⚠️", time: Date.now() - 1000 * 60 * 45, items: ["onion","potato"], viewed: false },
  { id: "s3", vendorId: "v5", vendorName: "Begumpet Organic", avatar: "🌿", bg: "linear-gradient(135deg,#1565c0,#0d47a1)", emoji: "🥕", text: "Organic carrots, freshly harvested this morning 🌱", time: Date.now() - 1000 * 60 * 90, items: ["carrot","cauliflower"], viewed: false },
  { id: "s4", vendorId: "v2", vendorName: "Lakshmi Veggies", avatar: "👩‍🌾", bg: "linear-gradient(135deg,#9c27b0,#6a0080)", emoji: "🍌", text: "Fresh bananas & cucumbers! Come early 🌅", time: Date.now() - 1000 * 60 * 120, items: ["banana","cucumber"], viewed: false },
  { id: "s5", vendorId: "v3", vendorName: "Shaikpet Mart", avatar: "🛒", bg: "linear-gradient(135deg,#e91e63,#880e4f)", emoji: "🥭", text: "Mango season is here! Best Alphonso ₹75/kg 🥭", time: Date.now() - 1000 * 60 * 180, items: ["mango"], viewed: false },
];

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function VendorStories({ onSelectVendor, vendors }) {
  const [stories, setStories] = useState(MOCK_STORIES);
  const [activeStory, setActiveStory] = useState(null);
  const [progress, setProgress] = useState(0);

  // Auto-progress story
  useEffect(() => {
    if (activeStory === null) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          // Go to next story
          setActiveStory(prev => {
            const idx = stories.findIndex(s => s.id === prev);
            if (idx < stories.length - 1) return stories[idx + 1].id;
            return null;
          });
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [activeStory]);

  function openStory(story) {
    setActiveStory(story.id);
    setStories(prev => prev.map(s => s.id === story.id ? { ...s, viewed: true } : s));
  }

  const activeStoryData = stories.find(s => s.id === activeStory);

  return (
    <>
      {/* Stories Row */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2e1a", marginBottom: 10 }}>
          📖 Vendor Stories
          <span style={{ fontSize: 10, color: "#8aaa84", fontWeight: 400, marginLeft: 8 }}>Tap to view · 24hr</span>
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {stories.map(story => (
            <button key={story.id} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer" }}
              onClick={() => openStory(story)}>
              {/* Ring */}
              <div style={{
                width: 62, height: 62, borderRadius: 31,
                background: story.viewed ? "#ddd" : "linear-gradient(135deg,#f07d2a,#25a463,#1565c0)",
                padding: 2, transition: "all 0.3s"
              }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: story.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, border: "2px solid #fff" }}>
                  {story.emoji}
                </div>
              </div>
              <span style={{ fontSize: 10, color: story.viewed ? "#aaa" : "#1a2e1a", fontWeight: story.viewed ? 400 : 600, maxWidth: 62, textAlign: "center", lineHeight: 1.2 }}>
                {story.vendorName.split(" ")[0]}
              </span>
            </button>
          ))}

          {/* Add story button for vendors */}
          <button style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 62, height: 62, borderRadius: 31, border: "2px dashed #25a463", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
              ➕
            </div>
            <span style={{ fontSize: 10, color: "#25a463", fontWeight: 600 }}>Add Story</span>
          </button>
        </div>
      </div>

      {/* Story Viewer Modal */}
      {activeStory && activeStoryData && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#000", display: "flex", flexDirection: "column", maxWidth: 520, margin: "0 auto" }}
          onClick={() => setActiveStory(null)}>

          {/* Progress bars */}
          <div style={{ display: "flex", gap: 3, padding: "12px 12px 8px", zIndex: 2 }}>
            {stories.map((s, i) => {
              const activeIdx = stories.findIndex(x => x.id === activeStory);
              const isCurrent = s.id === activeStory;
              const isPast = i < activeIdx;
              return (
                <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.3)", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#fff", borderRadius: 2, width: isPast ? "100%" : isCurrent ? `${progress}%` : "0%", transition: isCurrent ? "none" : "width 0.1s" }} />
                </div>
              );
            })}
          </div>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px 14px", zIndex: 2 }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: activeStoryData.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: "2px solid #fff" }}>
              {activeStoryData.emoji}
            </div>
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{activeStoryData.vendorName}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{timeAgo(activeStoryData.time)}</div>
            </div>
            <button style={{ marginLeft: "auto", background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }} onClick={() => setActiveStory(null)}>✕</button>
          </div>

          {/* Story content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }} onClick={e => e.stopPropagation()}>
            {/* Big emoji */}
            <div style={{ fontSize: 100, marginBottom: 24, filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.5))", animation: "floatUp 3s ease-in-out infinite" }}>
              {activeStoryData.emoji}
            </div>

            {/* Message card */}
            <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", borderRadius: 20, padding: "20px 20px", textAlign: "center", marginBottom: 24, width: "100%" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.5, marginBottom: 8 }}>
                {activeStoryData.text}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                📍 {vendors.find(v => v.id === activeStoryData.vendorId)?.location}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 12, width: "100%" }}>
              <button
                style={{ flex: 1, background: "#25a463", color: "#fff", border: "none", borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                onClick={() => {
                  const v = vendors.find(x => x.id === activeStoryData.vendorId);
                  if (v) { onSelectVendor(v); setActiveStory(null); }
                }}>
                View Vendor →
              </button>
              <button
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 16, padding: "14px 18px", fontSize: 18, cursor: "pointer" }}
                onClick={() => {
                  const v = vendors.find(x => x.id === activeStoryData.vendorId);
                  if (v) window.open(`https://wa.me/?text=Saw your story on StreetMart! Is ${activeStoryData.text} still available?`, "_blank");
                }}>
                📱
              </button>
            </div>
          </div>

          {/* Tap zones */}
          <div style={{ position: "absolute", left: 0, top: 80, bottom: 0, width: "40%", zIndex: 3 }}
            onClick={e => { e.stopPropagation(); const idx = stories.findIndex(s => s.id === activeStory); if (idx > 0) { openStory(stories[idx - 1]); } }} />
          <div style={{ position: "absolute", right: 0, top: 80, bottom: 0, width: "40%", zIndex: 3 }}
            onClick={e => { e.stopPropagation(); const idx = stories.findIndex(s => s.id === activeStory); if (idx < stories.length - 1) { openStory(stories[idx + 1]); } else setActiveStory(null); }} />
        </div>
      )}
    </>
  );
}
