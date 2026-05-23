import { useEffect, useRef, useState } from "react";

export function VendorMap({ vendors, onSelectVendor, TH }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [userPos, setUserPos] = useState(null);

  // Load Leaflet dynamically
  useEffect(() => {
    if (mapInstanceRef.current) return;

    // Inject Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    // Inject Leaflet JS
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);

    return () => {};
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstanceRef.current) return;
    const L = window.L;

    // Init map centered on Hyderabad
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([17.41, 78.45], 13);
    mapInstanceRef.current = map;

    // Tile layer — OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    // Custom vendor pin icon
    function makeIcon(color, isOpen) {
      return L.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:36px;border-radius:50% 50% 50% 0;
          background:${isOpen ? color : "#aaa"};
          border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          font-size:16px;transform:rotate(-45deg);
        "><span style="transform:rotate(45deg)">${isOpen ? "🥦" : "🔒"}</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });
    }

    // Add vendor markers
    vendors.forEach(v => {
      const inStockItems = v.inventory.filter(i => i.inStock).map(i => {
        const name = i.vegId;
        return `<span style="background:#e8f5ee;color:#1a7a4a;padding:2px 6px;border-radius:8px;font-size:10px;margin:2px;display:inline-block">${name}</span>`;
      }).join("");

      const marker = L.marker([v.lat, v.lng], { icon: makeIcon("#25a463", v.isOpen) });
      marker.addTo(map);
      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:180px">
          <div style="font-weight:800;font-size:14px;margin-bottom:4px">${v.name}</div>
          <div style="font-size:11px;color:#888;margin-bottom:6px">📍 ${v.area} · ${v.distance}km · ⭐ ${v.rating}</div>
          <div style="font-size:11px;color:#888;margin-bottom:8px">🕐 ${v.openTime} – ${v.closeTime}</div>
          <div style="margin-bottom:10px">${inStockItems}</div>
          <button onclick="window.__smSelectVendor('${v.id}')" style="
            background:#25a463;color:#fff;border:none;border-radius:10px;
            padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;width:100%
          ">View Details →</button>
        </div>
      `, { maxWidth: 220 });
    });

    // User location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        const userIcon = L.divIcon({
          className: "",
          html: `<div style="width:16px;height:16px;border-radius:50%;background:#1565c0;border:3px solid #fff;box-shadow:0 0 0 6px rgba(21,101,192,0.2)"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([latitude, longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup("<b>📍 You are here</b>");
        map.setView([latitude, longitude], 14);
      }, () => {});
    }

    // Global callback for popup button
    window.__smSelectVendor = (id) => {
      const v = vendors.find(x => x.id === id);
      if (v) onSelectVendor(v);
    };
  }, [mapReady, vendors]);

  return (
    <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", margin: "0 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
      {/* Map header */}
      <div style={{ background: "#1a2e1a", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>🗺️</span>
        <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Live Vendor Map</span>
        <span style={{ marginLeft: "auto", background: "#25a463", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "2px 8px" }}>
          {vendors.filter(v => v.isOpen).length} Open
        </span>
      </div>

      {/* Map container */}
      <div ref={mapRef} style={{ height: 280, background: "#e8f0e8" }}>
        {!mapReady && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f0f8f0", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, border: "3px solid #25a463", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 12, color: "#8aaa84" }}>Loading map…</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ background: "#fff", padding: "8px 14px", display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: "#25a463" }} />
          <span style={{ fontSize: 10, color: "#4a6741" }}>Open vendor</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: "#aaa" }} />
          <span style={{ fontSize: 10, color: "#4a6741" }}>Closed</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: "#1565c0" }} />
          <span style={{ fontSize: 10, color: "#4a6741" }}>You</span>
        </div>
      </div>
    </div>
  );
}
