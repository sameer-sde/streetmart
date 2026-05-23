import { LANGUAGES } from "../data/languages.js";
import { t } from "../data/languages.js";
import { speak } from "../hooks/useVoice.js";

export function LanguageSelector({ lang, setLang, onClose }) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()}>
        <div style={s.handle} />
        <h2 style={s.title}>{t("selectLanguage", lang)} 🌐</h2>
        <div style={s.grid}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              style={{ ...s.langBtn, ...(lang === l.code ? s.langBtnActive : {}) }}
              onClick={() => { setLang(l.code); speak(l.nativeName, l.code); onClose(); }}
            >
              <span style={s.flag}>{l.flag}</span>
              <span style={s.nativeName}>{l.nativeName}</span>
              <span style={s.engName}>{l.name}</span>
              {lang === l.code && <span style={s.check}>✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" },
  sheet: { background: "#fff", borderRadius: "24px 24px 0 0", padding: "16px 20px 32px", width: "100%", maxHeight: "80vh", overflowY: "auto", animation: "slideUp 0.3s ease" },
  handle: { width: 40, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 16px" },
  title: { fontSize: 18, fontWeight: 700, color: "#1a2e1a", marginBottom: 16, textAlign: "center" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  langBtn: { display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "#f7f9f5", border: "2px solid transparent", borderRadius: 14, cursor: "pointer", position: "relative", transition: "all 0.15s" },
  langBtnActive: { background: "#e8f5ee", border: "2px solid #25a463" },
  flag: { fontSize: 20 },
  nativeName: { fontSize: 14, fontWeight: 600, color: "#1a2e1a", flex: 1 },
  engName: { fontSize: 10, color: "#8aaa84" },
  check: { fontSize: 14, color: "#25a463", fontWeight: 700 },
};
