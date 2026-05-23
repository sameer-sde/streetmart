import { useState, useEffect } from "react";
import { VEGETABLES, MOCK_VENDORS } from "../data/vegetables.js";

function getBestPrice(vegId, vendors) {
  const prices = vendors
    .filter(v => v.isOpen)
    .flatMap(v => v.inventory.filter(i => i.vegId === vegId && i.inStock).map(i => i.price));
  return prices.length ? Math.min(...prices) : null;
}

export function PriceTicker({ vendors }) {
  const [prices, setPrices] = useState([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const items = VEGETABLES.map(veg => {
      const price = getBestPrice(veg.id, vendors);
      if (!price) return null;
      // Simulate small random fluctuation for live feel
      const change = (Math.random() - 0.48) * 2;
      return { ...veg, price, change: parseFloat(change.toFixed(1)) };
    }).filter(Boolean);
    setPrices(items);
  }, [tick, vendors]);

  // Simulate live updates every 4s
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(interval);
  }, []);

  const doubled = [...prices, ...prices]; // loop seamlessly

  return (
    <div style={styles.wrapper}>
      <div style={styles.label}>📈 LIVE</div>
      <div style={styles.trackWrapper}>
        <div style={{ ...styles.track, animationDuration: `${prices.length * 3}s` }} className="ticker-scroll">
          {doubled.map((item, i) => (
            <span key={i} style={styles.item}>
              <span style={{ marginRight: 4 }}>{item.emoji}</span>
              <span style={styles.name}>{item.names.en}</span>
              <span style={styles.price}>₹{item.price}</span>
              <span style={{ color: item.change >= 0 ? "#4caf50" : "#f44336", fontSize: 10, marginLeft: 3 }}>
                {item.change >= 0 ? "▲" : "▼"}{Math.abs(item.change)}
              </span>
              <span style={styles.divider}>·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    background: "#0d1f0d",
    overflow: "hidden",
    height: 34,
    borderBottom: "1px solid #1a3a1a",
  },
  label: {
    background: "#25a463",
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    padding: "0 10px",
    height: "100%",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    letterSpacing: 1,
  },
  trackWrapper: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  track: {
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    animation: "tickerScroll linear infinite",
    willChange: "transform",
  },
  item: {
    display: "inline-flex",
    alignItems: "center",
    color: "#e8e8e8",
    fontSize: 11,
    fontWeight: 500,
    paddingRight: 4,
  },
  name: { color: "#aaa", marginRight: 4 },
  price: { color: "#25a463", fontWeight: 700 },
  divider: { color: "#333", margin: "0 10px" },
};
