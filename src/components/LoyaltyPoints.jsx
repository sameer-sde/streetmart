import { useState } from "react";
import { speak } from "../hooks/useVoice.js";

const REWARDS = [
  { points: 50,  label: "Free Coriander", icon: "🌿", unlocked: true },
  { points: 100, label: "5% Discount", icon: "🏷️", unlocked: true },
  { points: 200, label: "Free Delivery", icon: "🚚", unlocked: false },
  { points: 500, label: "VIP Customer", icon: "👑", unlocked: false },
];

const SUBSCRIPTIONS = [
  { id: "weekly", name: "Weekly Veggie Box", price: 299, items: "5 vegetables, 5kg each", icon: "📦", color: "#25a463" },
  { id: "daily",  name: "Daily Fresh Pack", price: 59,  items: "3 vegetables, 1kg each", icon: "🌅", color: "#f07d2a" },
];

export function LoyaltyPoints({ lang }) {
  const [points] = useState(120);
  const [subscribed, setSubscribed] = useState(null);
  const maxPoints = 500;

  return (
    <div>
      {/* Points card */}
      <div style={s.pointsCard}>
        <div style={s.pointsTop}>
          <div>
            <div style={s.pointsLabel}>Your Loyalty Points</div>
            <div style={s.pointsVal}>{points} pts</div>
          </div>
          <div style={s.badgeIcon}>🏅</div>
        </div>
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${(points / maxPoints) * 100}%` }} />
        </div>
        <div style={s.progressLabels}>
          <span style={s.progressLeft}>{points} points</span>
          <span style={s.progressRight}>{maxPoints - points} more for VIP 👑</span>
        </div>
      </div>

      {/* Rewards */}
      <div style={s.section}>
        <div style={s.sectionTitle}>🎁 Rewards</div>
        <div style={s.rewardsGrid}>
          {REWARDS.map(r => (
            <div key={r.label} style={{ ...s.rewardCard, opacity: points >= r.points ? 1 : 0.5, border: `2px solid ${points >= r.points ? "#25a463" : "#eee"}` }}>
              <div style={s.rewardIcon}>{r.icon}</div>
              <div style={s.rewardLabel}>{r.label}</div>
              <div style={s.rewardPts}>{r.points} pts</div>
              {points >= r.points && <div style={s.rewardUnlocked}>Unlocked!</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Subscriptions */}
      <div style={s.section}>
        <div style={s.sectionTitle}>📅 Weekly Subscription</div>
        {SUBSCRIPTIONS.map(sub => (
          <div key={sub.id} style={{ ...s.subCard, border: `2px solid ${subscribed === sub.id ? sub.color : "#eee"}` }}>
            <div style={s.subLeft}>
              <span style={s.subIcon}>{sub.icon}</span>
              <div>
                <div style={s.subName}>{sub.name}</div>
                <div style={s.subItems}>{sub.items}</div>
              </div>
            </div>
            <div style={s.subRight}>
              <div style={{ ...s.subPrice, color: sub.color }}>₹{sub.price}</div>
              <button style={{ ...s.subBtn, background: subscribed === sub.id ? sub.color : "#f0f0f0", color: subscribed === sub.id ? "#fff" : "#666" }}
                onClick={() => { setSubscribed(sub.id === subscribed ? null : sub.id); speak(subscribed === sub.id ? "Unsubscribed" : `Subscribed to ${sub.name}`, lang); }}>
                {subscribed === sub.id ? "✓ Subscribed" : "Subscribe"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  pointsCard: { background: "linear-gradient(135deg,#1a7a4a,#25a463)", borderRadius: 18, padding: "18px 16px", marginBottom: 16, color: "#fff" },
  pointsTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  pointsLabel: { fontSize: 12, opacity: 0.85, marginBottom: 4 },
  pointsVal: { fontSize: 32, fontWeight: 800 },
  badgeIcon: { fontSize: 40 },
  progressBar: { height: 8, background: "rgba(255,255,255,0.3)", borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", background: "#fff", borderRadius: 4, transition: "width 0.5s ease" },
  progressLabels: { display: "flex", justifyContent: "space-between" },
  progressLeft: { fontSize: 11, opacity: 0.8 },
  progressRight: { fontSize: 11, opacity: 0.8 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: "#1a2e1a", marginBottom: 10 },
  rewardsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 },
  rewardCard: { background: "#f9fdf9", borderRadius: 14, padding: "10px 6px", textAlign: "center" },
  rewardIcon: { fontSize: 24, marginBottom: 4 },
  rewardLabel: { fontSize: 10, fontWeight: 600, color: "#1a2e1a", marginBottom: 2 },
  rewardPts: { fontSize: 10, color: "#25a463", fontWeight: 700 },
  rewardUnlocked: { fontSize: 9, color: "#25a463", marginTop: 3 },
  subCard: { background: "#f9fdf9", borderRadius: 14, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" },
  subLeft: { display: "flex", alignItems: "center", gap: 10 },
  subIcon: { fontSize: 28 },
  subName: { fontSize: 13, fontWeight: 700, color: "#1a2e1a", marginBottom: 2 },
  subItems: { fontSize: 11, color: "#8aaa84" },
  subRight: { textAlign: "right" },
  subPrice: { fontSize: 16, fontWeight: 800, marginBottom: 6 },
  subBtn: { border: "none", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" },
};
