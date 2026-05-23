import { useState, useRef, useEffect } from "react";
import { t } from "../data/languages.js";
import { speak, startVoiceRecognition } from "../hooks/useVoice.js";
import { VEGETABLES, MOCK_VENDORS } from "../data/vegetables.js";

export function AIChat({ lang, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: lang === "hi" ? "नमस्ते! 🙏 मैं StreetMart AI हूँ। पूछिए — टमाटर का भाव क्या है? कौन सी दुकान खुली है?" : lang === "te" ? "నమస్కారం! 🙏 నేను StreetMart AI ని. అడగండి — టొమాటో రేటు ఏంటి? ఏ అంగడి తెరిచి ఉంది?" : "Namaste! 🙏 I'm StreetMart AI. Ask me — What's tomato rate? Which vendor is open near me?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const vendorSummary = MOCK_VENDORS.map(v =>
    `${v.name} at ${v.area} (${v.distance}km, ${v.isOpen ? "Open" : "Closed"}, ⭐${v.rating}): ${v.inventory.filter(i => i.inStock).map(i => {
      const veg = VEGETABLES.find(x => x.id === i.vegId);
      return `${veg?.names.en}=₹${i.price}/kg`;
    }).join(", ")}`
  ).join("\n");

  async function sendMsg(q) {
    const question = q || input.trim();
    if (!question || loading) return;
    setInput("");
    setLoading(true);
    const updated = [...messages, { role: "user", text: question }];
    setMessages(updated);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: `You are a friendly street market assistant for StreetMart — a vegetable vendor app in Hyderabad, India.

Live vendor data:
${vendorSummary}

Areas covered: Mehdipatnam, Tolichowki, Shaikpet, Abids, Begumpet, Ameerpet

Rules:
- Detect the language of the question and reply in THE SAME language
- Hindi question → Hindi answer, Telugu question → Telugu answer, English → English
- Keep answers short and friendly — 2-3 sentences max
- Always mention specific prices and vendor names from the data above
- Use emojis to make it friendly 🥦
- For price queries, compare vendors and suggest cheapest
- For "which vendor open" questions, list open vendors with distances
- Give smart buying advice based on the data`,
          messages: updated.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text }))
        })
      });

      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const reply = data.content?.find(b => b.type === "text")?.text || "Sorry, try again!";
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
      speak(reply, lang);
    } catch (err) {
      // Fallback: answer from local data without API
      const reply = localAnswer(question, lang);
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
      speak(reply, lang);
    }
    setLoading(false);
  }

  // Smart local fallback — answers common questions from vendor data
  function localAnswer(q, lang) {
    const ql = q.toLowerCase();
    const openVendors = MOCK_VENDORS.filter(v => v.isOpen);

    // Cheapest of a vegetable
    for (const veg of VEGETABLES) {
      const names = Object.values(veg.names).map(n => n.toLowerCase());
      if (names.some(n => ql.includes(n))) {
        const prices = openVendors
          .flatMap(v => v.inventory.filter(i => i.vegId === veg.id && i.inStock).map(i => ({ name: v.name, area: v.area, price: i.price })))
          .sort((a, b) => a.price - b.price);
        if (prices.length > 0) {
          return `${veg.emoji} ${veg.names.en} is cheapest at ${prices[0].name} (${prices[0].area}) for ₹${prices[0].price}/kg! ${prices.length > 1 ? `Also available at ${prices[1].name} for ₹${prices[1].price}/kg.` : ""} 🛒`;
        }
        return `${veg.emoji} Sorry, ${veg.names.en} is currently out of stock at all vendors.`;
      }
    }

    // Open vendors
    if (ql.includes("open") || ql.includes("खुल") || ql.includes("తెరిచి")) {
      return `🟢 ${openVendors.length} vendors are open right now: ${openVendors.map(v => `${v.name} (${v.area})`).join(", ")}. All accepting orders! 🥦`;
    }

    // Cheapest overall
    if (ql.includes("cheap") || ql.includes("सस्त") || ql.includes("చీప్") || ql.includes("best price")) {
      const best = openVendors.sort((a, b) => {
        const avgA = a.inventory.reduce((s, i) => s + i.price, 0) / a.inventory.length;
        const avgB = b.inventory.reduce((s, i) => s + i.price, 0) / b.inventory.length;
        return avgA - avgB;
      })[0];
      return `💰 Best overall prices at ${best?.name} in ${best?.area}! They have ${best?.inventory.filter(i => i.inStock).length} items in stock today. ${best?.distance}km away ⭐${best?.rating}`;
    }

    // Mehdipatnam / area specific
    for (const area of ["mehdipatnam","tolichowki","abids","begumpet","ameerpet","shaikpet"]) {
      if (ql.includes(area)) {
        const areaVendors = openVendors.filter(v => v.area.toLowerCase().includes(area));
        if (areaVendors.length > 0) {
          return `📍 In ${area.charAt(0).toUpperCase()+area.slice(1)}: ${areaVendors.map(v => `${v.name} (⭐${v.rating}, ${v.distance}km)`).join(", ")} ${areaVendors.length > 0 ? "are open now!" : ""}`;
        }
        return `😔 No open vendors found in ${area} right now. Try nearby areas!`;
      }
    }

    // Default
    return `🤖 I can help you find vegetable prices and vendors in Hyderabad! Ask me: "What's the tomato price?" or "Which vendors are open near Mehdipatnam?" 🥦`;
  }

  function startVoice() {
    setListening(true);
    startVoiceRecognition(lang, (result) => {
      setInput(result);
      sendMsg(result);
    }, () => setListening(false));
  }

  const quickQ = {
    hi: ["आज टमाटर का भाव?", "सबसे सस्ती सब्ज़ी?", "कौन सी दुकान खुली है?", "मेहदीपट्नम में दुकान?"],
    te: ["టొమాటో రేటు ఏంటి?", "చీప్ కూరగాయలు ఎక్కడ?", "ఏ అంగడి తెరిచి ఉంది?", "మెహదీపట్నంలో అంగడి?"],
    en: ["Tomato rate today?", "Cheapest vegetables near me?", "Which vendor is open now?", "Vendors in Mehdipatnam?"],
  };
  const questions = quickQ[lang] || quickQ.en;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()}>
        <div style={s.handle} />
        <div style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.botAvatar}>🤖</div>
            <div>
              <div style={s.botName}>StreetMart AI</div>
              <div style={s.botSub}>Speaks Hindi, Telugu, Tamil & more</div>
            </div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div ref={chatRef} style={s.chat}>
          {messages.map((m, i) => (
            <div key={i} style={{ ...s.bubbleWrap, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "assistant" && <span style={s.avatar}>🤖</span>}
              <div style={{ ...s.bubble, background: m.role === "user" ? "#25a463" : "#f0f9f4", color: m.role === "user" ? "#fff" : "#1a2e1a" }}>
                {m.text}
                {m.role === "assistant" && (
                  <button style={s.speakBtn} onClick={() => speak(m.text, lang)}>🔊</button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ ...s.bubbleWrap, justifyContent: "flex-start" }}>
              <span style={s.avatar}>🤖</span>
              <div style={{ ...s.bubble, background: "#f0f9f4" }}>
                <span style={s.typing}>●●●</span>
              </div>
            </div>
          )}
        </div>

        <div style={s.quickRow}>
          {questions.map(q => (
            <button key={q} style={s.quickBtn} onClick={() => sendMsg(q)}>{q}</button>
          ))}
        </div>

        <div style={s.inputRow}>
          <button style={{ ...s.voiceBtn, background: listening ? "#fde8e8" : "#e8f5ee" }} onClick={startVoice}>
            {listening ? "🔴" : "🎤"}
          </button>
          <input style={s.input} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMsg()}
            placeholder={listening ? "Listening..." : "Type or speak in any language..."} />
          <button style={{ ...s.sendBtn, opacity: !input.trim() || loading ? 0.5 : 1 }}
            onClick={() => sendMsg()} disabled={!input.trim() || loading}>→</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", top:0, left:0, right:0, bottom:0, background: "rgba(0,0,0,0.5)", zIndex: 1001, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  sheet: { background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, maxHeight: "85vh", display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease" },
  handle: { width: 40, height: 4, background: "#ddd", borderRadius: 2, margin: "12px auto 0", flexShrink: 0 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  botAvatar: { width: 42, height: 42, background: "linear-gradient(135deg,#25a463,#1a7a4a)", borderRadius: 21, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 },
  botName: { fontSize: 15, fontWeight: 700, color: "#1a2e1a" },
  botSub: { fontSize: 11, color: "#8aaa84" },
  closeBtn: { background: "#f5f5f5", border: "none", borderRadius: 20, width: 32, height: 32, fontSize: 14, cursor: "pointer", color: "#666" },
  chat: { flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 },
  bubbleWrap: { display: "flex", alignItems: "flex-end", gap: 8 },
  avatar: { fontSize: 20, flexShrink: 0 },
  bubble: { maxWidth: "80%", borderRadius: 18, padding: "10px 14px", fontSize: 14, lineHeight: 1.5, position: "relative" },
  speakBtn: { background: "none", border: "none", fontSize: 12, cursor: "pointer", marginLeft: 6, opacity: 0.6 },
  typing: { fontSize: 18, letterSpacing: 3, color: "#25a463", animation: "pulse 1s infinite" },
  quickRow: { display: "flex", gap: 6, padding: "8px 16px", overflowX: "auto", flexShrink: 0 },
  quickBtn: { background: "#f0f9f4", border: "1px solid #c8e6d0", borderRadius: 20, padding: "7px 12px", fontSize: 12, color: "#1a7a4a", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontWeight: 500 },
  inputRow: { display: "flex", gap: 8, padding: "10px 16px 20px", alignItems: "center", flexShrink: 0 },
  voiceBtn: { width: 44, height: 44, borderRadius: 22, border: "none", fontSize: 20, cursor: "pointer", flexShrink: 0 },
  input: { flex: 1, background: "#f7f9f5", border: "2px solid #d4e8d0", borderRadius: 22, padding: "10px 16px", fontSize: 14, color: "#1a2e1a" },
  sendBtn: { width: 44, height: 44, background: "linear-gradient(135deg,#25a463,#1a7a4a)", color: "#fff", border: "none", borderRadius: 22, fontSize: 20, cursor: "pointer", flexShrink: 0 },
};
