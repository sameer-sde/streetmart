import { useState, useEffect } from "react";

export function InstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      // Show banner after 30s or 3rd visit
      const visits = parseInt(localStorage.getItem("sm_visits") || "0") + 1;
      localStorage.setItem("sm_visits", visits);
      if (visits >= 2 && !localStorage.getItem("sm_installed")) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true); setShow(false);
      localStorage.setItem("sm_installed", "1");
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") { setShow(false); setInstalled(true); }
  }

  if (!show || installed) return null;

  return (
    <div className="install-banner">
      <span style={{ fontSize:32 }}>📱</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>Install StreetMart</div>
        <div style={{ fontSize:11, opacity:0.85 }}>Works offline · No app store needed</div>
      </div>
      <button style={{ background:"#fff", color:"#1a7a4a", border:"none", borderRadius:12, padding:"8px 14px", fontSize:12, fontWeight:700 }} onClick={install}>
        Install
      </button>
      <button style={{ background:"none", border:"none", color:"rgba(255,255,255,0.7)", fontSize:18, padding:"4px 6px" }} onClick={() => setShow(false)}>✕</button>
    </div>
  );
}
