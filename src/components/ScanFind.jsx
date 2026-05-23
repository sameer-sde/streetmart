import { useState, useRef } from "react";
import { VEGETABLES, MOCK_VENDORS } from "../data/vegetables.js";

export function ScanFind({ onClose, onSelectVendor, TH }) {
  const [stage, setStage] = useState("intro"); // intro | camera | scanning | result | error
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  async function startCamera() {
    setStage("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setStage("error");
    }
  }

  function stopCamera() {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    analyzeImage(dataUrl);
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target.result);
      analyzeImage(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function analyzeImage(dataUrl) {
    setStage("scanning");
    try {
      const base64 = dataUrl.split(",")[1];
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: base64 }
              },
              {
                type: "text",
                text: `You are a vegetable identification expert for an Indian vegetable marketplace app called StreetMart.

Look at this image and identify the vegetable(s) shown.

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "identified": true or false,
  "vegName": "English name of the main vegetable",
  "vegId": "one of: tomato, onion, potato, spinach, carrot, cauliflower, brinjal, ladyfinger, cucumber, capsicum, beans, banana, mango, coriander, pumpkin, drumstick",
  "confidence": "High / Medium / Low",
  "hindiName": "Hindi name",
  "teluguName": "Telugu name",
  "funFact": "One interesting fact about this vegetable in India (max 15 words)",
  "tip": "One buying tip (max 12 words)"
}`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      if (!parsed.identified) {
        setStage("error");
        return;
      }

      // Find vendors that sell this vegetable
      const vendorsWithVeg = MOCK_VENDORS
        .filter(v => v.isOpen && v.inventory.some(i => i.vegId === parsed.vegId && i.inStock))
        .map(v => {
          const inv = v.inventory.find(i => i.vegId === parsed.vegId);
          return { ...v, priceForVeg: inv?.price, stockKg: inv?.stockKg };
        })
        .sort((a, b) => a.priceForVeg - b.priceForVeg);

      const veg = VEGETABLES.find(v => v.id === parsed.vegId);
      setResult({ ...parsed, vendors: vendorsWithVeg, veg });
      setStage("result");
    } catch {
      setStage("error");
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "#000", maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ background: "#0d1f0d", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }} onClick={() => { stopCamera(); onClose(); }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>📸 Scan & Find</div>
          <div style={{ color: "#8aaa84", fontSize: 11 }}>Point at any vegetable</div>
        </div>
        <div style={{ background: "#25a463", borderRadius: 10, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#fff" }}>AI Powered</div>
      </div>

      {/* INTRO */}
      {stage === "intro" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 20 }}>
          <div style={{ fontSize: 80, filter: "drop-shadow(0 8px 24px rgba(37,164,99,0.4))" }} className="float">📸</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Scan Any Vegetable</div>
            <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6 }}>Point your camera at any vegetable and our AI will instantly identify it and show you nearby vendors with the best prices!</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, width: "100%" }}>
            {["🍅 Tomato","🥕 Carrot","🥦 Cauliflower","🧅 Onion","🍆 Brinjal","🥒 Cucumber"].map(v => (
              <div key={v} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 6px", textAlign: "center", fontSize: 12, color: "#ccc" }}>{v}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, width: "100%" }}>
            <button style={{ flex: 1, background: "#25a463", color: "#fff", border: "none", borderRadius: 16, padding: 16, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
              onClick={startCamera}>📷 Open Camera</button>
            <button style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 16, padding: 16, fontSize: 15, cursor: "pointer" }}
              onClick={() => fileRef.current.click()}>🖼️</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
        </div>
      )}

      {/* CAMERA */}
      {stage === "camera" && (
        <div style={{ flex: 1, position: "relative" }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {/* Scan frame overlay */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 220, height: 220, position: "relative" }}>
              {/* Corner markers */}
              {[["0","0","0","auto"],["0","0","auto","0"],["auto","0","0","auto"],["auto","0","auto","0"]].map(([t,b,l,r], i) => (
                <div key={i} style={{ position:"absolute", top:t, bottom:b, left:l, right:r, width:30, height:30, borderColor:"#25a463", borderStyle:"solid", borderWidth: i===0?"3px 0 0 3px": i===1?"3px 3px 0 0": i===2?"0 0 3px 3px": "0 3px 3px 0" }} />
              ))}
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", background:"rgba(0,0,0,0.5)", padding:"4px 10px", borderRadius:10 }}>Point at vegetable</div>
              </div>
            </div>
          </div>
          {/* Capture button */}
          <div style={{ position:"absolute", bottom:40, left:0, right:0, display:"flex", justifyContent:"center" }}>
            <button style={{ width:72, height:72, borderRadius:36, background:"#fff", border:"4px solid #25a463", fontSize:28, cursor:"pointer", boxShadow:"0 4px 20px rgba(0,0,0,0.4)" }}
              onClick={capturePhoto}>📸</button>
          </div>
          <button style={{ position:"absolute", top:14, right:14, background:"rgba(0,0,0,0.5)", border:"none", color:"#fff", borderRadius:20, padding:"6px 12px", cursor:"pointer", fontSize:12 }}
            onClick={() => fileRef.current.click()}>Upload instead</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFileUpload} />
        </div>
      )}

      {/* SCANNING */}
      {stage === "scanning" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, padding:24 }}>
          {capturedImage && <img src={capturedImage} alt="" style={{ width:160, height:160, objectFit:"cover", borderRadius:20, border:"3px solid #25a463" }} />}
          <div style={{ width:48, height:48, borderRadius:24, border:"4px solid #25a463", borderTopColor:"transparent", animation:"spin 0.8s linear infinite" }} />
          <div style={{ textAlign:"center" }}>
            <div style={{ color:"#fff", fontSize:16, fontWeight:700, marginBottom:6 }}>AI Analyzing...</div>
            <div style={{ color:"#8aaa84", fontSize:12 }}>Identifying vegetable & finding vendors</div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
            {["Scanning image...","Identifying vegetable...","Finding best prices..."].map((s,i) => (
              <div key={i} style={{ background:"rgba(37,164,99,0.15)", color:"#25a463", fontSize:11, borderRadius:20, padding:"4px 12px" }}>{s}</div>
            ))}
          </div>
        </div>
      )}

      {/* RESULT */}
      {stage === "result" && result && (
        <div style={{ flex:1, overflowY:"auto", padding:16 }}>
          {/* Captured image + result */}
          <div style={{ display:"flex", gap:12, marginBottom:16, alignItems:"center" }}>
            {capturedImage && <img src={capturedImage} alt="" style={{ width:80, height:80, objectFit:"cover", borderRadius:16, border:"3px solid #25a463", flexShrink:0 }} />}
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:32 }}>{result.veg?.emoji}</span>
                <div>
                  <div style={{ color:"#fff", fontSize:18, fontWeight:800 }}>{result.vegName}</div>
                  <div style={{ color:"#8aaa84", fontSize:11 }}>{result.hindiName} · {result.teluguName}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <span style={{ background:"#25a463", color:"#fff", fontSize:10, fontWeight:700, borderRadius:8, padding:"2px 8px" }}>✓ Identified</span>
                <span style={{ background:"rgba(255,255,255,0.1)", color:"#ccc", fontSize:10, borderRadius:8, padding:"2px 8px" }}>{result.confidence} confidence</span>
              </div>
            </div>
          </div>

          {/* Fun fact + tip */}
          <div style={{ background:"rgba(37,164,99,0.15)", borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
            <div style={{ color:"#25a463", fontSize:12, fontWeight:700, marginBottom:4 }}>💡 Did you know?</div>
            <div style={{ color:"#ccc", fontSize:12, lineHeight:1.5 }}>{result.funFact}</div>
          </div>
          <div style={{ background:"rgba(240,125,42,0.15)", borderRadius:14, padding:"12px 14px", marginBottom:16 }}>
            <div style={{ color:"#f07d2a", fontSize:12, fontWeight:700, marginBottom:4 }}>🛒 Buying Tip</div>
            <div style={{ color:"#ccc", fontSize:12, lineHeight:1.5 }}>{result.tip}</div>
          </div>

          {/* Vendors */}
          <div style={{ color:"#fff", fontSize:14, fontWeight:700, marginBottom:10 }}>
            🏪 {result.vendors.length} Vendors Nearby
          </div>
          {result.vendors.length === 0 ? (
            <div style={{ color:"#8aaa84", textAlign:"center", padding:"20px 0" }}>No vendors currently stock this item</div>
          ) : result.vendors.map((v, i) => (
            <button key={v.id} style={{ width:"100%", background: i===0 ? "rgba(37,164,99,0.2)" : "rgba(255,255,255,0.05)", border: i===0 ? "1.5px solid #25a463" : "1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:"12px 14px", marginBottom:10, cursor:"pointer", textAlign:"left" }}
              onClick={() => { onSelectVendor(v); onClose(); }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:40, height:40, borderRadius:20, background:"linear-gradient(135deg,#25a463,#1a7a4a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                  {i===0 ? "🥇" : i===1 ? "🥈" : "🥉"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#fff", fontSize:13, fontWeight:700 }}>{v.name}</div>
                  <div style={{ color:"#8aaa84", fontSize:11 }}>📍 {v.area} · {v.distance}km · ⭐ {v.rating}</div>
                  {v.stockKg < 10 && v.stockKg > 0 && <div style={{ color:"#f07d2a", fontSize:10, fontWeight:700 }}>⚠ Only {v.stockKg}kg left!</div>}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ color: i===0 ? "#25a463":"#fff", fontSize:16, fontWeight:800 }}>₹{v.priceForVeg}</div>
                  <div style={{ color:"#8aaa84", fontSize:10 }}>/kg</div>
                  {i===0 && <div style={{ color:"#25a463", fontSize:9, fontWeight:700 }}>BEST PRICE</div>}
                </div>
              </div>
            </button>
          ))}

          <button style={{ width:"100%", background:"rgba(255,255,255,0.08)", color:"#ccc", border:"none", borderRadius:14, padding:14, fontSize:13, cursor:"pointer", marginTop:4 }}
            onClick={() => { setStage("intro"); setCapturedImage(null); setResult(null); }}>
            📸 Scan Another Vegetable
          </button>
        </div>
      )}

      {/* ERROR */}
      {stage === "error" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, gap:16 }}>
          <div style={{ fontSize:60 }}>🤷</div>
          <div style={{ textAlign:"center" }}>
            <div style={{ color:"#fff", fontSize:16, fontWeight:700, marginBottom:8 }}>Couldn't identify vegetable</div>
            <div style={{ color:"#8aaa84", fontSize:13 }}>Try a clearer photo with good lighting, or make sure it's a vegetable!</div>
          </div>
          <button style={{ background:"#25a463", color:"#fff", border:"none", borderRadius:16, padding:"14px 32px", fontSize:14, fontWeight:700, cursor:"pointer" }}
            onClick={() => { setStage("intro"); setCapturedImage(null); }}>Try Again</button>
        </div>
      )}
    </div>
  );
}
