import { useState, useEffect } from "react";
import { t, LANGUAGES } from "./data/languages.js";
import { VEGETABLES, MOCK_VENDORS, HYDERABAD_AREAS } from "./data/vegetables.js";
import { speak, startVoiceRecognition, detectLanguage } from "./hooks/useVoice.js";
import { LanguageSelector } from "./components/LanguageSelector.jsx";
import { AIChat } from "./components/AIChat.jsx";
import { PriceHistory } from "./components/PriceHistory.jsx";
import { LoyaltyPoints } from "./components/LoyaltyPoints.jsx";
import { Onboarding } from "./components/Onboarding.jsx";
import { SkeletonHome, SkeletonCard } from "./components/Skeleton.jsx";
import { InstallBanner } from "./components/InstallBanner.jsx";
import { useToast } from "./components/Toast.jsx";
import { PriceTicker } from "./components/PriceTicker.jsx";
import { VendorMap } from "./components/VendorMap.jsx";
import { VendorStories } from "./components/VendorStories.jsx";
import { ScanFind } from "./components/ScanFind.jsx";
import { Portal } from "./components/Portal.jsx";

const LIGHT = { bg: "#f4f8f4", card: "#fff", text: "#1a2e1a", text2: "#4a6741", border: "#e0ede0", chip: "#f0f8f0" };
const DARK  = { bg: "#111", card: "#1e1e1e", text: "#e8e8e8", text2: "#aaa", border: "#333", chip: "#2a2a2a" };

// ── BULK DISCOUNT ──
function getBulkDiscount(qty) {
  if (qty >= 5) return qty >= 8 ? 12 : 8;
  return 0;
}

// ── STOCK BAR ──
function StockBar({ stockKg, maxKg = 100 }) {
  const pct = Math.min(100, Math.round((stockKg / maxKg) * 100));
  const color = stockKg === 0 ? "#e53935" : stockKg < 10 ? "#f07d2a" : "#25a463";
  const low = stockKg > 0 && stockKg < 10;
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ height: 5, borderRadius: 4, background: "#eee", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s" }} />
      </div>
      {low && <div style={{ fontSize: 10, color: "#f07d2a", fontWeight: 700, marginTop: 2 }}>{stockKg}kg left ⚠ Low!</div>}
    </div>
  );
}

// ── ORDER TOTAL CALC ──
function calcOrderTotal(orderItems, inventory) {
  let subtotal = 0, discountAmt = 0;
  Object.entries(orderItems).forEach(([vegId, qty]) => {
    if (qty <= 0) return;
    const inv = inventory.find(i => i.vegId === vegId);
    if (!inv) return;
    const disc = getBulkDiscount(qty);
    const lineTotal = inv.price * qty;
    subtotal += lineTotal;
    discountAmt += Math.round(lineTotal * disc / 100);
  });
  return { subtotal, discountAmt, total: subtotal - discountAmt };
}

// ── MOCK ANNOUNCEMENTS ──
const MOCK_ANNOUNCEMENTS = [
  { vendorId: "v1", vendorName: "Ramu Fresh Vegetables", msg: "🍅 Fresh tomatoes just arrived! Extra 50kg in stock.", time: "10 min ago" },
  { vendorId: "v4", vendorName: "Abids Sabzi Corner", msg: "🧅 Onion prices dropped to ₹20/kg today only!", time: "25 min ago" },
  { vendorId: "v5", vendorName: "Begumpet Organic Veggies", msg: "🥕 New organic carrot batch. Limited stock!", time: "1 hr ago" },
  { vendorId: "v2", vendorName: "Lakshmi Vegetables", msg: "🍌 Fresh bananas and cucumbers available.", time: "2 hr ago" },
];

export default function App() {
  const [lang, setLang] = useState(detectLanguage());
  const [screen, setScreen] = useState("home");
  const [showLang, setShowLang] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("All");
  const [filterCat, setFilterCat] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [dark, setDark] = useState(false);
  const [listening, setListening] = useState(false);
  const [favs, setFavs] = useState([]);
  const [showOrder, setShowOrder] = useState(false);
  const [orderItems, setOrderItems] = useState({});
  const [myStallOpen, setMyStallOpen] = useState(false);
  const [vendors, setVendors] = useState(MOCK_VENDORS);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [activeTab, setActiveTab] = useState("vendors");

  // ── NEW STATE ──
  // Multi-vendor cart: { vendorId: { vegId: qty } }
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  // Order history
  const [orderHistory, setOrderHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sm_order_history") || "[]"); } catch { return []; }
  });
  // Freshness upvotes: { vendorId_vegId: count }
  const [freshnessVotes, setFreshnessVotes] = useState({});
  const [myVotes, setMyVotes] = useState({});
  // Announcements
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  // Profile
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sm_profile") || '{"name":"","area":"Mehdipatnam","orders":0,"points":120}'); } catch { return { name: "", area: "Mehdipatnam", orders: 0, points: 120 }; }
  });
  const [editProfile, setEditProfile] = useState(false);
  // Price compare
  const [showCompare, setShowCompare] = useState(false);
  const [compareVeg, setCompareVeg] = useState("tomato");
  const [showScan, setShowScan] = useState(false);

  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem("sm_onboarded"));
  const [loading, setLoading] = useState(true);

  const TH = dark ? DARK : LIGHT;
  const T = (k) => t(k, lang);
  const toast = useToast();

  useEffect(() => { document.body.style.background = TH.bg; }, [dark]);

  // Simulate initial load
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  function finishOnboarding() {
    localStorage.setItem("sm_onboarded", "1");
    setOnboarded(true);
  }

  // Show onboarding for first-time users
  if (!onboarded) return <Onboarding onDone={finishOnboarding} />;

  // Persist order history
  useEffect(() => { localStorage.setItem("sm_order_history", JSON.stringify(orderHistory)); }, [orderHistory]);
  // Persist profile
  useEffect(() => { localStorage.setItem("sm_profile", JSON.stringify(profile)); }, [profile]);

  // ── CART HELPERS ──
  function cartAddItem(vendorId, vegId, delta) {
    setCart(prev => {
      const vCart = prev[vendorId] || {};
      const newQty = Math.max(0, (vCart[vegId] || 0) + delta);
      return { ...prev, [vendorId]: { ...vCart, [vegId]: newQty } };
    });
    if (delta > 0) {
      const veg = VEGETABLES.find(v => v.id === vegId);
      toast(`🛒 Added ${veg?.names.en || "item"} to cart`, "success");
    }
  }
  function cartItemQty(vendorId, vegId) {
    return cart[vendorId]?.[vegId] || 0;
  }
  const cartTotalItems = Object.values(cart).reduce((s, vc) => s + Object.values(vc).reduce((a, q) => a + q, 0), 0);
  const cartTotalPrice = Object.entries(cart).reduce((total, [vid, items]) => {
    const vendor = vendors.find(v => v.id === vid);
    return total + Object.entries(items).reduce((s, [vegId, qty]) => {
      const inv = vendor?.inventory.find(i => i.vegId === vegId);
      const disc = getBulkDiscount(qty);
      const line = (inv?.price || 0) * qty;
      return s + line - Math.round(line * disc / 100);
    }, 0);
  }, 0);

  function placeCartOrder() {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-IN"),
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      items: Object.entries(cart).flatMap(([vid, items]) => {
        const vendor = vendors.find(v => v.id === vid);
        return Object.entries(items).filter(([, q]) => q > 0).map(([vegId, qty]) => {
          const veg = VEGETABLES.find(v => v.id === vegId);
          const inv = vendor?.inventory.find(i => i.vegId === vegId);
          return { vendorName: vendor?.name, vegName: veg?.names.en, qty, price: inv?.price, emoji: veg?.emoji };
        });
      }),
      total: cartTotalPrice,
    };
    setOrderHistory(prev => [entry, ...prev]);
    setProfile(p => ({ ...p, orders: p.orders + 1, points: p.points + Math.floor(cartTotalPrice / 10) }));
    setCart({});
    setShowCart(false);
    alert("✅ Order placed! Check Order History.");
  }

  function voteFresnness(vendorId, vegId) {
    const key = `${vendorId}_${vegId}`;
    if (myVotes[key]) { toast("Already voted fresh!", "default"); return; }
    setFreshnessVotes(p => ({ ...p, [key]: (p[key] || 0) + 1 }));
    setMyVotes(p => ({ ...p, [key]: true }));
    toast("👍 Freshness confirmed!", "success");
  }

  function voiceSearch() {
    setListening(true);
    startVoiceRecognition(lang, (result) => {
      setSearch(result);
      setScreen("vendors");
      setListening(false);
    }, () => setListening(false));
  }

  function toggleFav(id) {
    const adding = !favs.includes(id);
    setFavs(p => adding ? [...p, id] : p.filter(x => x !== id));
    toast(adding ? "❤️ Added to favourites" : "Removed from favourites", adding ? "success" : "default");
  }

  function whatsappShare(v) {
    const items = v.inventory.filter(i => i.inStock).map(i => {
      const veg = VEGETABLES.find(x => x.id === i.vegId);
      return `${veg?.emoji} ${veg?.names.en}: Rs.${i.price}/kg`;
    }).join("\n");
    const msg = `*${v.name}*\nLocation: ${v.location}\nRating: ${v.rating}/5\n\nToday's Stock:\n${items}\n\nCall: ${v.phone}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function cheapest(vegId) {
    return vendors.filter(v => v.isOpen)
      .flatMap(v => v.inventory.filter(i => i.vegId === vegId && i.inStock).map(i => ({ price: i.price, vendor: v.name, area: v.area })))
      .sort((a, b) => a.price - b.price)[0];
  }

  function addReview(vid) {
    if (!newReview.comment.trim()) return;
    setVendors(prev => prev.map(v => v.id === vid ? {
      ...v,
      reviews: v.reviews + 1,
      rating: parseFloat(((v.rating * v.reviews + newReview.rating) / (v.reviews + 1)).toFixed(1)),
      reviews_list: [...(v.reviews_list || []), { name: profile.name || "You", ...newReview }]
    } : v));
    setNewReview({ rating: 5, comment: "" });
    setShowReviewForm(false);
    toast("✅ Review submitted! Thank you", "success");
  }

  function joinGroupBuy(vid) {
    setVendors(prev => prev.map(v => v.id === vid ? {
      ...v,
      groupBuy: {
        ...v.groupBuy,
        currentPeople: v.groupBuy.currentPeople + 1,
        members: [...v.groupBuy.members, profile.name || "You"]
      }
    } : v));
    toast("👫 Joined group buy!", "success");
  }

  const filtered = vendors.filter(v => {
    const matchArea = filterArea === "All" || v.area === filterArea;
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.area.toLowerCase().includes(search.toLowerCase()) ||
      v.inventory.some(i => {
        const veg = VEGETABLES.find(x => x.id === i.vegId);
        return Object.values(veg?.names || {}).some(n => n.toLowerCase().includes(search.toLowerCase()));
      });
    return matchArea && matchSearch;
  });

  // ── PRICE COMPARE DATA ──
  function getPriceCompare(vegId) {
    return vendors.map(v => {
      const inv = v.inventory.find(i => i.vegId === vegId);
      return inv ? { vendorName: v.name, area: v.area, price: inv.price, inStock: inv.inStock, isOpen: v.isOpen, rating: v.rating } : null;
    }).filter(Boolean).sort((a, b) => a.price - b.price);
  }

  // ── HOME ──
  if (screen === "home") return (
    <div style={{ ...S.page, background: TH.bg }} className="page-enter">
      {/* Header */}
      <div style={{ ...S.header, background: TH.card }}>
        <div>
          <div style={S.logo}><span style={{ color: "#25a463" }}>Street</span><span style={{ color: "#f07d2a" }}>Mart</span> 🛒</div>
          <div style={{ fontSize: 11, color: "#8aaa84" }}>Hyderabad Fresh Vegetables</div>
        </div>
        <div style={S.headerRight}>
          {cartTotalItems > 0 && (
            <button style={S.cartBtn} onClick={() => setShowCart(true)}>
              🛒 <span style={S.cartBadge}>{cartTotalItems}</span>
            </button>
          )}
          <button style={S.iconBtn} onClick={() => setDark(d => !d)}>{dark ? "☀️" : "🌙"}</button>
          <button style={{ ...S.langBtn, background: "#e8f5ee", color: "#1a7a4a" }} onClick={() => setShowLang(true)}>
            {LANGUAGES.find(l => l.code === lang)?.flag} {LANGUAGES.find(l => l.code === lang)?.nativeName}
          </button>
        </div>
      </div>

      {/* Price Ticker */}
      <PriceTicker vendors={vendors} />

      {/* Weather tip */}
      <div style={S.weatherTip} className="slide-down">☀️ Hot day — tomatoes and cucumbers selling fast! Stock up early.</div>

      {loading ? <SkeletonHome /> : (<>

      {/* ── HERO ILLUSTRATION BANNER ── */}
      <div style={S.heroBanner} className="fade-in">
        <div style={S.heroBannerLeft}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 4, lineHeight: 1.4 }}>
            Fresh from the<br />Street to Your Home 🥦
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", marginBottom: 10 }}>
            {vendors.filter(v => v.isOpen).length} vendors open · Hyderabad
          </div>
          <button style={S.heroBannerBtn} onClick={() => setScreen("vendors")}>
            Shop Now →
          </button>
        </div>
        {/* Illustrated scene */}
        <div style={S.heroBannerRight}>
          {/* Vendor stall scene using CSS art */}
          <div style={S.stallScene}>
            {/* Stall canopy */}
            <div style={S.stallCanopy} />
            {/* Vendor (man) */}
            <div style={{ position:"absolute", bottom:18, left:10 }}>
              <div style={{ width:14, height:14, borderRadius:7, background:"#f5c09a", margin:"0 auto 2px" }} />
              <div style={{ width:16, height:20, borderRadius:"6px 6px 0 0", background:"#f07d2a", margin:"0 auto", position:"relative" }}>
                <div style={{ position:"absolute", right:-8, top:4, width:8, height:3, background:"#f5c09a", borderRadius:2 }} />
              </div>
            </div>
            {/* Vegetable basket */}
            <div style={S.basket}>
              <span style={{ fontSize:10 }}>🍅🥕🥦</span>
            </div>
            {/* Customer (woman) */}
            <div style={{ position:"absolute", bottom:18, right:8 }}>
              <div style={{ width:14, height:14, borderRadius:7, background:"#c8956c", margin:"0 auto 2px" }} />
              <div style={{ width:14, height:20, borderRadius:"6px 6px 0 0", background:"#9c27b0", margin:"0 auto" }} />
            </div>
            {/* Ground */}
            <div style={S.stallGround} />
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ ...S.searchBox, background: TH.card }}>
          <span>🔍</span>
          <input style={{ ...S.searchInput, color: TH.text, background: "transparent" }}
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={T("searchVegetables")}
            onFocus={() => setScreen("vendors")} />
          <button style={{ ...S.voiceBtn, background: listening ? "#fde8e8" : "#e8f5ee" }} onClick={voiceSearch}>
            {listening ? "🔴" : "🎤"}
          </button>
        </div>
      </div>

      {/* Hero buttons — now 4 */}
      <div style={{ padding: "12px 14px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button style={S.heroGreen} onClick={() => setScreen("vendors")}>
          <div style={S.heroIcon}>🗺️</div>
          <div style={S.heroTitle}>{T("nearbyVendors")}</div>
          <div style={S.heroSub}>{vendors.filter(v => v.isOpen).length} open now</div>
        </button>
        <button style={S.heroOrange} onClick={() => setShowAI(true)}>
          <div style={S.heroIcon}>🤖</div>
          <div style={S.heroTitle}>AI Assistant</div>
          <div style={S.heroSub}>Ask in any language</div>
        </button>
        <button style={{ ...S.heroGreen, background: "linear-gradient(135deg,#1565c0,#0d47a1)" }} onClick={() => setShowCompare(true)}>
          <div style={S.heroIcon}>📊</div>
          <div style={S.heroTitle}>Price Compare</div>
          <div style={S.heroSub}>Best deal finder</div>
        </button>
        <button style={{ ...S.heroOrange, background: "linear-gradient(135deg,#6200ea,#4a00b0)" }} onClick={() => setScreen("profile")}>
          <div style={S.heroIcon}>🧑</div>
          <div style={S.heroTitle}>My Profile</div>
          <div style={S.heroSub}>{profile.points} pts · {profile.orders} orders</div>
        </button>
        <button style={{ ...S.heroGreen, background: "linear-gradient(135deg,#e91e63,#880e4f)", gridColumn: "1 / -1" }} onClick={() => setShowScan(true)}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <span style={{ fontSize:38 }}>📸</span>
            <div>
              <div style={S.heroTitle}>Scan & Find Vegetable</div>
              <div style={S.heroSub}>Point camera → AI identifies → Find best price nearby</div>
            </div>
          </div>
        </button>
      </div>

      {/* Vendor Stories */}
      <VendorStories vendors={vendors} onSelectVendor={(v) => { setSelectedVendor(v); setScreen("detail"); }} />

      {/* Live Map */}
      <div style={{ padding: "14px 0 0" }}>
        <div style={{ padding: "0 14px", fontSize:15, fontWeight:700, color:TH.text, marginBottom:10 }}>🗺️ Live Vendor Map</div>
        <VendorMap vendors={vendors} TH={TH} onSelectVendor={(v) => { setSelectedVendor(v); setScreen("detail"); }} />
      </div>

      {/* Announcements feed */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={S.secRow}>
          <span style={{ ...S.secTitle, color: TH.text }}>📢 Vendor Updates</span>
        </div>
        <div style={S.hScroll}>
          {announcements.map((a, i) => (
            <div key={i} style={{ ...S.annoCard, background: TH.card, flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1a7a4a", marginBottom: 4 }}>{a.vendorName}</div>
              <div style={{ fontSize: 12, color: TH.text, marginBottom: 6 }}>{a.msg}</div>
              <div style={{ fontSize: 10, color: "#8aaa84" }}>🕐 {a.time}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "14px 14px 0" }}>
        <div style={S.secRow}>
          <span style={{ ...S.secTitle, color: TH.text }}>Best Prices Today</span>
        </div>
        <div style={S.hScroll}>
          {["tomato","onion","potato","carrot","spinach","brinjal"].map(vid => {
            const veg = VEGETABLES.find(v => v.id === vid);
            const ch = cheapest(vid);
            if (!ch) return null;
            return (
              <button key={vid} style={{ ...S.priceCard, background: TH.card }}
                onClick={() => speak(`${veg?.names[lang] || veg?.names.en}. ${ch.price} rupees per kg at ${ch.area}`, lang)}>
                <div style={S.priceImgWrap}>
                  <img src={veg?.image} alt="" style={S.priceImg} onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                  <div style={{ ...S.priceEmojiFallback, display: "none" }}>{veg?.emoji}</div>
                </div>
                {veg?.seasonal && <div style={S.seasonalBadge}>{veg.seasonal}</div>}
                <div style={{ ...S.priceName, color: TH.text }}>{veg?.names[lang] || veg?.names.en}</div>
                <div style={S.priceAmt}>₹{ch.price}/kg</div>
                <div style={S.priceArea}>{ch.area}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category filter + veg grid */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={S.secRow}>
          <span style={{ ...S.secTitle, color: TH.text }}>Vegetables</span>
          <button style={S.seeAll} onClick={() => setScreen("vendors")}>See all →</button>
        </div>
        <div style={S.hScroll}>
          {["all","vegetables","fruits","herbs"].map(cat => (
            <button key={cat} style={{ ...S.catChip, background: filterCat === cat ? "#25a463" : TH.card, color: filterCat === cat ? "#fff" : TH.text2, border: `1.5px solid ${filterCat === cat ? "#25a463" : TH.border}` }}
              onClick={() => setFilterCat(cat)}>
              {cat === "all" ? "All" : cat === "vegetables" ? "Veg" : cat === "fruits" ? "Fruits" : "Herbs"}
            </button>
          ))}
        </div>
        <div style={S.vegGrid}>
          {VEGETABLES.filter(v => filterCat === "all" || v.category === filterCat).slice(0, 8).map(veg => {
            const avail = vendors.some(v => v.inventory.find(i => i.vegId === veg.id && i.inStock));
            const ch = cheapest(veg.id);
            return (
              <button key={veg.id} style={{ ...S.vegCard, background: TH.card, opacity: avail ? 1 : 0.6 }}
                onClick={() => { speak(veg.names[lang] || veg.names.en, lang); setSearch(veg.names.en); setScreen("vendors"); }}>
                <div style={S.vegImgWrap}>
                  <img src={veg.image} alt={veg.names.en} style={S.vegImg}
                    onError={e => { e.target.style.display="none"; e.target.parentNode.querySelector(".fallback").style.display="flex"; }} />
                  <div className="fallback" style={S.vegImgFallback}>{veg.emoji}</div>
                  {veg.seasonal && <div style={S.vegSeasonTag}>{veg.seasonal}</div>}
                </div>
                <div style={{ ...S.vegName, color: TH.text }}>{veg.names[lang] || veg.names.en}</div>
                <div style={S.vegPrice}>₹{ch?.price || veg.basePrice}</div>
                <div style={{ ...S.vegStock, background: avail ? "#e8f5ee" : "#fde8e8", color: avail ? "#1a7a4a" : "#c62828" }}>
                  {avail ? "In Stock" : "Out"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price history chart */}
      <div style={{ padding: "14px 14px 0" }}>
        <PriceHistory lang={lang} />
      </div>

      {/* Loyalty points */}
      <div style={{ padding: "0 14px 14px" }}>
        <LoyaltyPoints lang={lang} />
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{ ...S.secTitle, color: TH.text, marginBottom: 12 }}>How StreetMart Works</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { icon: "🔍", title: "Search", sub: "Find vendors near you", bg: "#e8f5ee" },
            { icon: "🛒", title: "Order", sub: "Add to cart & pay via UPI", bg: "#fff3e8" },
            { icon: "🚶", title: "Pick Up", sub: "Go fresh every morning", bg: "#e3f2fd" },
          ].map((s, i) => (
            <div key={i} className="fade-in" style={{ background: s.bg, borderRadius: 16, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1a2e1a", marginBottom: 3 }}>{s.title}</div>
              <div style={{ fontSize: 10, color: "#4a6741", lineHeight: 1.4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{ ...S.secTitle, color: TH.text, marginBottom: 12 }}>What People Say</div>
        <div style={S.hScroll}>
          {[
            { name: "Priya S.", area: "Mehdipatnam", msg: "I save ₹200/week using group buy! Fresh veggies every day 🌿", avatar: "👩", color: "#e8f5ee" },
            { name: "Ravi K.", area: "Ameerpet", msg: "Voice search in Telugu is amazing. My mother uses it daily!", avatar: "👨", color: "#fff3e8" },
            { name: "Sunita R.", area: "Begumpet", msg: "Found the cheapest tomatoes in my area in 10 seconds.", avatar: "👩‍🦱", color: "#e3f2fd" },
            { name: "Mohammed A.", area: "Abids", msg: "As a vendor, I doubled my customers in 2 weeks!", avatar: "👨‍🌾", color: "#f3e8ff" },
          ].map((t, i) => (
            <div key={i} style={{ ...S.testimonialCard, background: t.color, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 28 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1a2e1a" }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: "#8aaa84" }}>📍 {t.area}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#2e4a2e", lineHeight: 1.5, fontStyle: "italic" }}>"{t.msg}"</div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#f5c518" }}>⭐⭐⭐⭐⭐</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS BANNER ── */}
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{ background: "linear-gradient(135deg,#1a2e1a,#25a463)", borderRadius: 20, padding: "18px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: 16 }}>StreetMart in Numbers</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
            {[["6+","Vendors"],["16+","Veggies"],["10","Languages"],["₹200","Avg saved/wk"]].map(([val, lbl]) => (
              <div key={lbl}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{val}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Favourites */}
      {favs.length > 0 && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ ...S.secTitle, color: TH.text, marginBottom: 10 }}>Favourites</div>
          {vendors.filter(v => favs.includes(v.id)).map(v => (
            <MinCard key={v.id} v={v} lang={lang} TH={TH} onSelect={() => { setSelectedVendor(v); setScreen("detail"); }} />
          ))}
        </div>
      )}

      <div style={{ height: 90 }} />
      </>)}
      <Nav setScreen={setScreen} setShowAI={setShowAI} TH={TH} T={T} cartCount={cartTotalItems} setShowCart={setShowCart} setShowScan={setShowScan} />
      <InstallBanner />
      {showLang && <Portal><LanguageSelector lang={lang} setLang={setLang} onClose={() => setShowLang(false)} /></Portal>}
      {showAI && <Portal><AIChat lang={lang} onClose={() => setShowAI(false)} /></Portal>}
      {showScan && <Portal><ScanFind onClose={() => setShowScan(false)} onSelectVendor={(v) => { setSelectedVendor(v); setScreen("detail"); }} TH={TH} /></Portal>}

      {/* ── PRICE COMPARE MODAL ── */}
      {showCompare && (
        <Portal>
        <div style={{...S.modalBg, zIndex:1001}} onClick={() => setShowCompare(false)}>
          <div style={{ ...S.modal, background: TH.card, maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: TH.text }}>📊 Price Comparison</div>
              <button style={{ background: "#f0f0f0", border: "none", borderRadius: 20, width: 32, height: 32, fontSize: 16, cursor: "pointer" }} onClick={() => setShowCompare(false)}>✕</button>
            </div>
            {/* Veg selector */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {VEGETABLES.slice(0, 12).map(veg => (
                <button key={veg.id}
                  style={{ borderRadius: 20, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${compareVeg === veg.id ? "#25a463" : TH.border}`, background: compareVeg === veg.id ? "#25a463" : TH.card, color: compareVeg === veg.id ? "#fff" : TH.text2, transition: "all 0.2s" }}
                  onClick={() => setCompareVeg(veg.id)}>
                  {veg.emoji} {veg.names.en}
                </button>
              ))}
            </div>
            {/* Selected veg header */}
            {(() => {
              const selVeg = VEGETABLES.find(v => v.id === compareVeg);
              const rows = getPriceCompare(compareVeg);
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f0faf5", borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
                    <img src={selVeg?.image} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover" }} onError={e => e.target.style.display="none"} />
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#1a2e1a" }}>{selVeg?.emoji} {selVeg?.names.en}</div>
                      <div style={{ fontSize: 12, color: "#8aaa84" }}>
                        Best: <span style={{ color: "#25a463", fontWeight: 700 }}>₹{rows[0]?.price}/kg</span> at {rows[0]?.vendorName}
                      </div>
                      <div style={{ fontSize: 11, color: "#8aaa84" }}>{rows.length} vendors available</div>
                    </div>
                  </div>
                  {rows.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 0", color: "#8aaa84" }}>No vendors stock this item</div>
                  ) : rows.map((row, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: `1px solid ${TH.border}`, background: i === 0 ? "#f0faf5" : "transparent", borderRadius: i === 0 ? 12 : 0, paddingLeft: i === 0 ? 10 : 0, paddingRight: i === 0 ? 10 : 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 14, background: i === 0 ? "#25a463" : i === 1 ? "#f07d2a" : "#e0e0e0", color: i < 2 ? "#fff" : "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: TH.text }}>{row.vendorName}</div>
                        <div style={{ fontSize: 11, color: "#8aaa84" }}>📍 {row.area} · ⭐ {row.rating}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: i === 0 ? "#25a463" : TH.text }}>₹{row.price}<span style={{ fontSize: 11, fontWeight: 400 }}>/kg</span></div>
                        {i === 0 && rows.length > 1 && (
                          <div style={{ fontSize: 10, color: "#25a463", fontWeight: 600 }}>Save ₹{rows[rows.length-1].price - row.price} vs costliest</div>
                        )}
                        <div style={{ fontSize: 10, color: row.inStock && row.isOpen ? "#25a463" : "#e53935", marginTop: 2 }}>
                          {row.inStock && row.isOpen ? "✓ Available" : "✗ Unavailable"}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: "#8aaa84", textAlign: "center", marginTop: 14 }}>🥇 Best price · 🥈 Second best</div>
                </>
              );
            })()}
          </div>
        </div>
        </Portal>
      )}

      {/* ── CART MODAL ── */}
      {showCart && <Portal><CartModal cart={cart} vendors={vendors} TH={TH} lang={lang} onClose={() => setShowCart(false)} onPlace={placeCartOrder} onUpdate={cartAddItem} /></Portal>}
    </div>
  );

  // ── VENDORS ──
  if (screen === "vendors") return (
    <div style={{ ...S.page, background: TH.bg }} className="page-enter">
      <div style={{ ...S.subBar, background: TH.card }}>
        <button style={S.backBtn} onClick={() => setScreen("home")}>←</button>
        <span style={{ ...S.subTitle, color: TH.text }}>{T("nearbyVendors")}</span>
        <div style={{ display: "flex", gap: 8 }}>
          {cartTotalItems > 0 && (
            <button style={S.cartBtn} onClick={() => setShowCart(true)}>🛒 <span style={S.cartBadge}>{cartTotalItems}</span></button>
          )}
          <button style={S.iconBtn} onClick={() => setDark(d => !d)}>{dark ? "☀️" : "🌙"}</button>
        </div>
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ ...S.searchBox, background: TH.card }}>
          <span>🔍</span>
          <input style={{ ...S.searchInput, background: "transparent", color: TH.text }}
            value={search} onChange={e => setSearch(e.target.value)} placeholder={T("searchVegetables")} />
          <button style={{ ...S.voiceBtn, background: listening ? "#fde8e8" : "#e8f5ee" }} onClick={voiceSearch}>
            {listening ? "🔴" : "🎤"}
          </button>
        </div>
      </div>
      <div style={S.hScroll2}>
        {["All", ...HYDERABAD_AREAS.slice(0, 10)].map(area => (
          <button key={area} style={{ ...S.areaChip, background: filterArea === area ? "#1a7a4a" : TH.card, color: filterArea === area ? "#fff" : TH.text2, border: `1.5px solid ${filterArea === area ? "#1a7a4a" : TH.border}` }}
            onClick={() => setFilterArea(area)}>
            {area === "All" ? "All Areas" : area}
          </button>
        ))}
      </div>
      <div style={{ padding: "0 14px" }}>
        {filtered.length === 0
          ? <div style={S.empty}>No vendors found. Try a different area or vegetable.</div>
          : filtered.map(v => <VCard key={v.id} v={v} lang={lang} TH={TH} T={T} isFav={favs.includes(v.id)}
              onSelect={() => { setSelectedVendor(v); setScreen("detail"); }}
              onFav={() => toggleFav(v.id)} onWA={() => whatsappShare(v)}
              cart={cart} onCartAdd={(vegId, delta) => cartAddItem(v.id, vegId, delta)} />)
        }
      </div>
      <div style={{ height: 90 }} />
      <Nav setScreen={setScreen} setShowAI={setShowAI} TH={TH} T={T} cartCount={cartTotalItems} setShowCart={setShowCart} setShowScan={setShowScan} />
      {showAI && <Portal><AIChat lang={lang} onClose={() => setShowAI(false)} /></Portal>}
      {showCart && <Portal><CartModal cart={cart} vendors={vendors} TH={TH} lang={lang} onClose={() => setShowCart(false)} onPlace={placeCartOrder} onUpdate={cartAddItem} /></Portal>}
    </div>
  );

  // ── DETAIL ──
  if (screen === "detail" && selectedVendor) {
    const sv = vendors.find(v => v.id === selectedVendor.id) || selectedVendor;
    const gb = sv.groupBuy;
    const alreadyJoined = gb?.members?.includes(profile.name || "You");
    const gbFull = gb?.currentPeople >= gb?.minPeople;
    const orderTotals = calcOrderTotal(orderItems, sv.inventory);

    return (
      <div style={{ ...S.page, background: TH.bg }} className="page-enter">
        {/* Image with overlay */}
        <div style={{ position: "relative" }}>
          <img src={sv.image} alt="" style={{ width: "100%", height: 210, objectFit: "cover" }} onError={e => e.target.style.display="none"} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)" }} />
          <button style={S.detBack} onClick={() => setScreen("vendors")}>←</button>
          <button style={S.detFav} onClick={() => toggleFav(sv.id)}>{favs.includes(sv.id) ? "❤️" : "🤍"}</button>
          <div style={{ ...S.openBig, background: sv.isOpen ? "#25a463" : "#e53935" }}>{sv.isOpen ? "Open" : "Closed"}</div>
          <div style={S.imgNameOverlay}>
            <span style={S.imgVendorName}>{sv.name}</span>
            {sv.verified && <span style={S.verifiedBadgeImg}>✓ Verified</span>}
          </div>
        </div>

        <div style={{ ...S.detSheet, background: TH.card }}>
          <div style={S.detRow}>
            <div style={{ flex: 1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ ...S.detName, color: TH.text }}>{sv.name}</div>
                {sv.verified && <span style={S.verifiedBadge}>✓</span>}
              </div>
              <div style={S.detSub}>📍 {sv.location} · {sv.distance}km away</div>
              <div style={S.detSub}>🕐 {sv.openTime} – {sv.closeTime}</div>
            </div>
            <button style={S.speakBtn2} onClick={() => speak(`${sv.name}. ${sv.distance} kilometers away. Rating ${sv.rating}. ${sv.isOpen ? "Open" : "Closed"}`, lang)}>🔊</button>
          </div>
          <div style={S.pillRow}>
            <span style={S.pill}>⭐ {sv.rating}</span>
            <span style={S.pill}>({sv.reviews} reviews)</span>
            <span style={{ ...S.pill, background: sv.crowdLevel === "Low" ? "#e8f5ee" : sv.crowdLevel === "Medium" ? "#fff3e8" : "#fde8e8" }}>
              👥 {sv.crowdLevel} crowd
            </span>
          </div>

          {/* ── GROUP BUY ── */}
          {gb && gb.active && (
            <div style={{ ...S.groupBuyBox, background: gbFull ? "#e8f5ee" : "#fff8e1", border: `1.5px solid ${gbFull ? "#25a463" : "#f07d2a"}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ fontSize:20 }}>👫</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color: gbFull ? "#1a7a4a" : "#b45309" }}>
                    {gbFull ? `🎉 Group Buy Active! ${gb.discount}% OFF` : `Group Buy — ${gb.discount}% off when ${gb.minPeople} join`}
                  </div>
                  <div style={{ fontSize:11, color:"#8aaa84" }}>
                    {gb.currentPeople}/{gb.minPeople} people joined{!gbFull && ` · ${gb.minPeople - gb.currentPeople} more needed`}
                  </div>
                </div>
                {!alreadyJoined && (
                  <button style={{ ...S.joinBtn, background: gbFull ? "#25a463" : "#f07d2a" }} onClick={() => joinGroupBuy(sv.id)}>Join</button>
                )}
                {alreadyJoined && <span style={{ fontSize:12, color:"#25a463", fontWeight:700 }}>✓ Joined</span>}
              </div>
              <div style={{ height:6, borderRadius:4, background:"#e0e0e0", overflow:"hidden", marginBottom:8 }}>
                <div style={{ width:`${Math.min(100,(gb.currentPeople/gb.minPeople)*100)}%`, height:"100%", background: gbFull ? "#25a463" : "#f07d2a", borderRadius:4, transition:"width 0.4s" }} />
              </div>
              {gb.members.length > 0 && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {gb.members.map((m, i) => <span key={i} style={S.memberChip}>{m}</span>)}
                </div>
              )}
            </div>
          )}

          {/* Inventory */}
          <div style={S.invTitle}>Today's Stock</div>
          {sv.inventory.map(item => {
            const veg = VEGETABLES.find(v => v.id === item.vegId);
            if (!veg) return null;
            const stockKg = item.stockKg ?? 0;
            const voteKey = `${sv.id}_${item.vegId}`;
            const votes = freshnessVotes[voteKey] || 0;
            const voted = myVotes[voteKey];
            const cartQty = cartItemQty(sv.id, item.vegId);
            return (
              <div key={item.vegId} style={{ ...S.invRow, opacity: item.inStock ? 1 : 0.45 }}>
                <div style={S.invImgWrap}>
                  <img src={veg.image} alt="" style={S.invImg} onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                  <div style={{ ...S.invEmoji, display: "none" }}>{veg.emoji}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <button style={S.invSpeakBtn} onClick={() => speak(veg.names[lang] || veg.names.en, lang)}>
                      🔊 <span style={{ color: TH.text, fontSize: 14, fontWeight: 600 }}>{veg.names[lang] || veg.names.en}</span>
                    </button>
                    {veg.seasonal && <span style={S.seasonalTag}>{veg.seasonal}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#8aaa84" }}>{item.qty}</div>
                  <StockBar stockKg={stockKg} maxKg={100} />
                  {/* Freshness upvote */}
                  {item.inStock && (
                    <button style={{ ...S.freshnessBtn, background: voted ? "#e8f5ee" : "#f5f5f5", color: voted ? "#25a463" : "#888" }}
                      onClick={() => voteFresnness(sv.id, item.vegId)}>
                      👍 Fresh {votes > 0 ? `(${votes})` : ""}
                    </button>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={S.invPrice}>₹{item.price}/kg</div>
                  <div style={{ ...S.invBadge, background: item.inStock ? "#e8f5ee" : "#fde8e8", color: item.inStock ? "#1a7a4a" : "#c62828" }}>
                    {item.inStock ? "In Stock" : "Out"}
                  </div>
                  {/* Quick add to cart */}
                  {item.inStock && (
                    <div style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end", marginTop:6 }}>
                      <button style={S.qBtn} onClick={() => cartAddItem(sv.id, item.vegId, -1)}>−</button>
                      <span style={{ fontSize:12, fontWeight:700, width:18, textAlign:"center" }}>{cartQty}</span>
                      <button style={S.qBtn} onClick={() => cartAddItem(sv.id, item.vegId, 1)}>+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div style={S.actRow}>
            <button style={S.actWA} onClick={() => whatsappShare(sv)}>📱 WhatsApp</button>
            <button style={S.actOrder} onClick={() => setShowOrder(true)}>🛒 Pre-Order</button>
          </div>
          <div style={S.upiRow}>
            <span style={S.upiLbl}>💳 UPI: </span>
            <span style={S.upiVal}>{sv.upiId}</span>
            <button style={S.copyBtn} onClick={() => navigator.clipboard.writeText(sv.upiId)}>Copy</button>
          </div>
          <button style={S.mapsBtn} onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${sv.lat},${sv.lng}`, "_blank")}>
            🗺️ Get Directions
          </button>

          {/* Reviews */}
          <div style={S.revHeader}>
            <span style={{ ...S.invTitle, marginBottom: 0 }}>Reviews</span>
            <button style={S.addRevBtn} onClick={() => setShowReviewForm(!showReviewForm)}>+ Add</button>
          </div>
          {showReviewForm && (
            <div style={S.revForm}>
              <div style={S.starRow}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} style={{ background:"none", border:"none", fontSize:26, cursor:"pointer" }}
                    onClick={() => setNewReview(p => ({ ...p, rating: n }))}>
                    {n <= newReview.rating ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
              <input style={S.revInput} value={newReview.comment} onChange={e => setNewReview(p => ({ ...p, comment: e.target.value }))} placeholder="Write your review..." />
              <button style={S.revSubmit} onClick={() => addReview(sv.id)}>Submit</button>
            </div>
          )}
          {(sv.reviews_list || []).map((r, i) => (
            <div key={i} style={S.revCard}>
              <div style={S.revTop}><span style={S.revName}>{r.name}</span><span>{"⭐".repeat(r.rating)}</span></div>
              <div style={{ fontSize: 13, color: "#4a6741" }}>{r.comment}</div>
            </div>
          ))}
        </div>

        {/* Pre-Order Modal */}
        {showOrder && (
          <Portal>
          <div style={{...S.modalBg, zIndex:1001}} onClick={() => setShowOrder(false)}>
            <div style={{ ...S.modal, background: TH.card }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: TH.text, marginBottom: 4 }}>Pre-Order from {sv.name}</h3>
              <div style={{ fontSize:11, color:"#8aaa84", marginBottom:12 }}>Buy 5kg+ per item for 8–12% bulk discount!</div>
              {sv.inventory.filter(i => i.inStock).map(item => {
                const veg = VEGETABLES.find(v => v.id === item.vegId);
                const qty = orderItems[item.vegId] || 0;
                const disc = getBulkDiscount(qty);
                const lineTotal = item.price * qty;
                const discAmt = Math.round(lineTotal * disc / 100);
                return (
                  <div key={item.vegId} style={{ padding:"10px 0", borderBottom:"1px solid #f0f0f0" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize: 22 }}>{veg?.emoji}</span>
                      <span style={{ flex:1, fontSize:13, color:TH.text }}>{veg?.names[lang] || veg?.names.en}</span>
                      <span style={{ color:"#25a463", fontWeight:700 }}>₹{item.price}/kg</span>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <button style={S.qBtn} onClick={() => setOrderItems(p => ({ ...p, [item.vegId]: Math.max(0,(p[item.vegId]||0)-1) }))}>−</button>
                        <span style={{ width:24, textAlign:"center", fontWeight:700 }}>{qty}</span>
                        <button style={S.qBtn} onClick={() => setOrderItems(p => ({ ...p, [item.vegId]: (p[item.vegId]||0)+1 }))}>+</button>
                      </div>
                    </div>
                    {qty >= 5 && (
                      <div style={{ fontSize:11, color:"#25a463", fontWeight:700, marginTop:4, marginLeft:32 }}>
                        🏷️ Bulk {disc}% off → Save ₹{discAmt} on this item
                      </div>
                    )}
                  </div>
                );
              })}
              {Object.values(orderItems).some(q => q > 0) && (
                <div style={S.orderTotalBox}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#4a6741", marginBottom:4 }}>
                    <span>Subtotal</span><span>₹{orderTotals.subtotal}</span>
                  </div>
                  {orderTotals.discountAmt > 0 && (
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#25a463", fontWeight:700, marginBottom:4 }}>
                      <span>🏷️ Bulk Discount</span><span>−₹{orderTotals.discountAmt}</span>
                    </div>
                  )}
                  {gb?.active && gbFull && (
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#1a7a4a", fontWeight:700, marginBottom:4 }}>
                      <span>👫 Group Buy ({gb.discount}%)</span>
                      <span>−₹{Math.round(orderTotals.subtotal * gb.discount / 100)}</span>
                    </div>
                  )}
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:800, color:TH.text, borderTop:"1px solid #eee", paddingTop:8, marginTop:4 }}>
                    <span>Total</span>
                    <span style={{ color:"#25a463" }}>₹{orderTotals.total - (gb?.active && gbFull ? Math.round(orderTotals.subtotal * gb.discount / 100) : 0)}</span>
                  </div>
                </div>
              )}
              <button style={S.confirmBtn} onClick={() => {
                const lines = Object.entries(orderItems).filter(([,q])=>q>0).map(([id,q])=>{
                  const veg=VEGETABLES.find(v=>v.id===id); const inv=sv.inventory.find(i=>i.vegId===id);
                  const disc = getBulkDiscount(q);
                  return `${veg?.emoji} ${veg?.names.en}: ${q}kg at Rs.${inv?.price}${disc>0?` (${disc}% bulk off)`:""}`;
                }).join("\n");
                const finalTotal = orderTotals.total - (gb?.active && gbFull ? Math.round(orderTotals.subtotal * gb.discount / 100) : 0);
                const msg = `Hello! Order from ${sv.name}:\n\n${lines}\n\nTotal: Rs.${finalTotal}\nI will arrive soon!`;
                // Save to history
                const entry = { id: Date.now(), date: new Date().toLocaleDateString("en-IN"), time: new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}), items: Object.entries(orderItems).filter(([,q])=>q>0).map(([id,q])=>{ const veg=VEGETABLES.find(v=>v.id===id); const inv=sv.inventory.find(i=>i.vegId===id); return {vendorName:sv.name,vegName:veg?.names.en,qty:q,price:inv?.price,emoji:veg?.emoji}; }), total: finalTotal };
                setOrderHistory(prev => [entry, ...prev]);
                setProfile(p => ({ ...p, orders: p.orders + 1, points: p.points + Math.floor(finalTotal / 10) }));
                window.open(`https://wa.me/${sv.phone}?text=${encodeURIComponent(msg)}`,"_blank");
                setShowOrder(false);
                setOrderItems({});
              }}>Send Order via WhatsApp</button>
            </div>
          </div>
          </Portal>
        )}
      </div>
    );
  }

  // ── PROFILE ──
  if (screen === "profile") return (
    <div style={{ ...S.page, background: TH.bg }}>
      <div style={{ ...S.subBar, background: TH.card }}>
        <button style={S.backBtn} onClick={() => setScreen("home")}>←</button>
        <span style={{ ...S.subTitle, color: TH.text }}>My Profile</span>
        <button style={S.iconBtn} onClick={() => setEditProfile(e => !e)}>✏️</button>
      </div>
      <div style={{ padding: 16 }}>
        {/* Profile card */}
        <div style={{ ...S.profileCard, background: TH.card }}>
          <div style={S.profileAvatar}>{profile.name ? profile.name[0].toUpperCase() : "🧑"}</div>
          {editProfile ? (
            <div style={{ flex: 1 }}>
              <input style={{ ...S.revInput, marginBottom: 8 }} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
              <select style={{ ...S.revInput, marginBottom: 0 }} value={profile.area} onChange={e => setProfile(p => ({ ...p, area: e.target.value }))}>
                {HYDERABAD_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <button style={{ ...S.revSubmit, marginTop: 8 }} onClick={() => setEditProfile(false)}>Save</button>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: TH.text }}>{profile.name || "Set your name"}</div>
              <div style={{ fontSize: 12, color: "#8aaa84" }}>📍 {profile.area}</div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={S.statsGrid}>
          {[["🛒", profile.orders, "Orders"], ["⭐", profile.points, "Points"], ["❤️", favs.length, "Favourites"], ["📋", orderHistory.length, "History"]].map(([icon, val, lbl]) => (
            <div key={lbl} style={{ ...S.statBox, background: TH.card }}>
              <div style={{ fontSize: 22 }}>{icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: TH.text }}>{val}</div>
              <div style={{ fontSize: 10, color: "#8aaa84" }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Points bar */}
        <div style={{ ...S.aiTipBox, background: "linear-gradient(135deg,#f3e8ff,#e8d5ff)" }}>
          <span style={{ fontSize: 24 }}>🏆</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6200ea", marginBottom: 4 }}>Loyalty Points: {profile.points}</div>
            <div style={{ height: 8, borderRadius: 4, background: "#e0e0e0", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (profile.points / 500) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#6200ea,#9c27b0)", borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 10, color: "#8aaa84", marginTop: 4 }}>{500 - profile.points} pts to Gold status</div>
          </div>
        </div>

        {/* Order history */}
        <div style={{ fontSize: 15, fontWeight: 700, color: TH.text, marginBottom: 10, marginTop: 4 }}>📋 Order History</div>
        {orderHistory.length === 0 ? (
          <div style={S.empty}>No orders yet. Start shopping!</div>
        ) : orderHistory.map(order => (
          <div key={order.id} style={{ ...S.revCard, background: TH.card, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: TH.text }}>{order.date} · {order.time}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#25a463" }}>₹{order.total}</span>
            </div>
            {order.items.map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: TH.text2, marginBottom: 2 }}>
                {item.emoji} {item.vegName} × {item.qty}kg @ ₹{item.price} — <span style={{ fontSize: 11, color: "#8aaa84" }}>{item.vendorName}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ height: 90 }} />
      <Nav setScreen={setScreen} setShowAI={setShowAI} TH={TH} T={T} cartCount={cartTotalItems} setShowCart={setShowCart} setShowScan={setShowScan} />
    </div>
  );

  // ── DASHBOARD ──
  if (screen === "dashboard") return (
    <div style={{ ...S.page, background: TH.bg }}>
      <div style={{ ...S.subBar, background: TH.card }}>
        <button style={S.backBtn} onClick={() => setScreen("home")}>←</button>
        <span style={{ ...S.subTitle, color: TH.text }}>My Stall</span>
        <button style={S.iconBtn} onClick={() => speak("My Stall", lang)}>🔊</button>
      </div>
      <div style={{ padding: "14px" }}>
        <div style={{ ...S.onlineCard, background: myStallOpen ? "#e8f5ee" : "#fde8e8" }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color: myStallOpen ? "#1a7a4a" : "#c62828" }}>
              {myStallOpen ? "Open — Customers can see you" : "Closed — Hidden from customers"}
            </div>
          </div>
          <button style={{ ...S.toggleBtn, background: myStallOpen ? "#25a463" : "#e53935" }}
            onClick={() => { setMyStallOpen(o => !o); speak(myStallOpen ? "Going offline" : "Going online", lang); }}>
            {myStallOpen ? "Go Offline" : "Go Online"}
          </button>
        </div>
        <div style={S.statsGrid}>
          {[["💰","₹1,840","Earnings"],["👥","24","Customers"],["🥦","12","Items"],["⭐","4.8","Rating"]].map(([icon,val,lbl]) => (
            <div key={lbl} style={{ ...S.statBox, background: TH.card }}>
              <div style={{ fontSize:22 }}>{icon}</div>
              <div style={{ fontSize:16, fontWeight:800, color:TH.text }}>{val}</div>
              <div style={{ fontSize:10, color:"#8aaa84" }}>{lbl}</div>
            </div>
          ))}
        </div>
        <div style={S.aiTipBox}>
          <span style={{ fontSize:24 }}>🤖</span>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1a7a4a", marginBottom:3 }}>AI Tip Today</div>
            <div style={{ fontSize:12, color:"#2e7d32" }}>Hot weather — stock extra tomatoes and cucumbers!</div>
          </div>
        </div>
        {/* Post announcement */}
        <div style={{ ...S.invCard, background: TH.card, marginBottom: 14 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#1a7a4a", marginBottom:10 }}>📢 Post Announcement</div>
          <input style={S.revInput} placeholder="e.g. Fresh stock arrived! 50kg tomatoes..." id="ann-input" />
          <button style={S.revSubmit} onClick={() => {
            const msg = document.getElementById("ann-input").value.trim();
            if (!msg) return;
            setAnnouncements(prev => [{ vendorId:"my", vendorName:"My Stall", msg, time:"Just now" }, ...prev]);
            document.getElementById("ann-input").value = "";
          }}>Post Update</button>
        </div>
        <div style={{ ...S.invCard, background: TH.card }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#1a7a4a", marginBottom:12 }}>My Inventory</div>
          {VEGETABLES.slice(0,8).map(veg => (
            <div key={veg.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"1px solid #f5f5f5" }}>
              <div style={S.invImgWrap}>
                <img src={veg.image} alt="" style={S.invImg} onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                <div style={{ ...S.invEmoji, display:"none" }}>{veg.emoji}</div>
              </div>
              <button style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, textAlign:"left" }}
                onClick={() => speak(veg.names[lang] || veg.names.en, lang)}>
                🔊 <span style={{ color:TH.text, fontSize:13, fontWeight:600 }}>{veg.names[lang] || veg.names.en}</span>
              </button>
              <div style={{ display:"flex", alignItems:"center", background:"#f7f9f5", borderRadius:8, padding:"4px 8px", fontSize:13 }}>
                Rs. <input style={{ width:45, border:"none", background:"transparent", fontSize:13, textAlign:"center", outline:"none" }} defaultValue={veg.basePrice} type="number" />
              </div>
              <button style={{ background:"#e8f5ee", color:"#1a7a4a", border:"none", borderRadius:8, padding:"6px 10px", fontSize:12, fontWeight:700, cursor:"pointer" }}>In Stock</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 90 }} />
      <Nav setScreen={setScreen} setShowAI={setShowAI} TH={TH} T={T} cartCount={cartTotalItems} setShowCart={setShowCart} setShowScan={setShowScan} />
    </div>
  );

  return null;
}

// ── CART MODAL ──
function CartModal({ cart, vendors, TH, lang, onClose, onPlace, onUpdate }) {
  const hasItems = Object.values(cart).some(vc => Object.values(vc).some(q => q > 0));
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"flex-end" }}>
      <div style={{ borderRadius:"24px 24px 0 0", padding:"20px 16px 32px", width:"100%", maxWidth:520, maxHeight:"80vh", overflowY:"auto", background: TH.card, margin:"0 auto" }}>
        <div style={{ fontSize:16, fontWeight:700, color:TH.text, marginBottom:14 }}>🛒 My Cart</div>
        {!hasItems ? (
          <div style={{ textAlign:"center", padding:"30px 0", color:"#8aaa84" }}>Cart is empty. Add items from vendor pages!</div>
        ) : Object.entries(cart).map(([vid, items]) => {
          const vendor = vendors.find(v => v.id === vid);
          const vendorItems = Object.entries(items).filter(([, q]) => q > 0);
          if (!vendorItems.length) return null;
          return (
            <div key={vid} style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#1a7a4a", marginBottom:8 }}>🏪 {vendor?.name}</div>
              {vendorItems.map(([vegId, qty]) => {
                const veg = VEGETABLES.find(v => v.id === vegId);
                const inv = vendor?.inventory.find(i => i.vegId === vegId);
                const disc = getBulkDiscount(qty);
                const line = (inv?.price || 0) * qty;
                const discAmt = Math.round(line * disc / 100);
                return (
                  <div key={vegId} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f5f5f5" }}>
                    <span style={{ fontSize:20 }}>{veg?.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:TH.text }}>{veg?.names.en}</div>
                      <div style={{ fontSize:11, color:"#25a463" }}>₹{inv?.price}/kg{disc>0 ? ` · ${disc}% off` : ""}</div>
                      {discAmt > 0 && <div style={{ fontSize:10, color:"#25a463" }}>Save ₹{discAmt}</div>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <button style={{ width:28,height:28,borderRadius:14,background:"#e8f5ee",border:"none",fontSize:16,cursor:"pointer",color:"#1a7a4a",fontWeight:700 }} onClick={() => onUpdate(vid, vegId, -1)}>−</button>
                      <span style={{ fontWeight:700, width:20, textAlign:"center" }}>{qty}</span>
                      <button style={{ width:28,height:28,borderRadius:14,background:"#e8f5ee",border:"none",fontSize:16,cursor:"pointer",color:"#1a7a4a",fontWeight:700 }} onClick={() => onUpdate(vid, vegId, 1)}>+</button>
                    </div>
                    <div style={{ fontWeight:800, color:TH.text, fontSize:13 }}>₹{line - discAmt}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {hasItems && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:800, color:TH.text, borderTop:"2px solid #e8f5ee", paddingTop:12, marginTop:8 }}>
              <span>Grand Total</span>
              <span style={{ color:"#25a463" }}>₹{Object.entries(cart).reduce((total,[vid,items])=>{ const vendor=vendors.find(v=>v.id===vid); return total+Object.entries(items).reduce((s,[vegId,qty])=>{ const inv=vendor?.inventory.find(i=>i.vegId===vegId); const disc=getBulkDiscount(qty); const line=(inv?.price||0)*qty; return s+line-Math.round(line*disc/100); },0); },0)}</span>
            </div>
            <button style={{ width:"100%",padding:"14px",background:"#25a463",color:"#fff",border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:14 }} onClick={onPlace}>
              ✅ Place Order
            </button>
          </>
        )}
        <button style={{ width:"100%",padding:"12px",background:"#f5f5f5",color:"#666",border:"none",borderRadius:14,fontSize:14,cursor:"pointer",marginTop:10 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ── VENDOR CARD ──
function VCard({ v, lang, TH, T, isFav, onSelect, onFav, onWA, cart, onCartAdd }) {
  const inStockCount = v.inventory.filter(i => i.inStock).length;
  const vendorCartCount = Object.values(cart[v.id] || {}).reduce((s, q) => s + q, 0);
  return (
    <div style={{ ...C.card, background: TH.card }} className="fade-in">
      <div style={C.imgWrap} onClick={onSelect}>
        <img src={v.image} alt="" style={C.img} onError={e => e.target.style.display="none"} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.45) 100%)" }} />
        <div style={{ ...C.openBadge, background: v.isOpen ? "#25a463" : "#e53935" }}>{v.isOpen ? "Open" : "Closed"}</div>
        {v.verified && <div style={C.verifiedOverlay}>✓ Verified</div>}
        <div style={{ ...C.crowdBadge, color: v.crowdLevel === "Low" ? "#25a463" : v.crowdLevel === "Medium" ? "#f07d2a" : "#e53935" }}>
          👥 {v.crowdLevel}
        </div>
        <div style={C.imgName}>{v.name}</div>
        {vendorCartCount > 0 && (
          <div style={C.cartOverlay}>🛒 {vendorCartCount} in cart</div>
        )}
      </div>
      <div style={C.body}>
        <div style={C.row}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ ...C.name, color:TH.text }} onClick={onSelect}>{v.name}</div>
              {v.verified && <span style={C.verifiedDot} title="Verified Vendor">✓</span>}
            </div>
            <div style={C.meta}>📍 {v.area} · {v.distance}km · 🕐 {v.openTime}</div>
          </div>
          <button style={C.favBtn} onClick={onFav}>{isFav ? "❤️" : "🤍"}</button>
        </div>
        <div style={C.statsRow}>
          <span style={C.rating}>⭐ {v.rating}</span>
          <span style={C.revs}>({v.reviews})</span>
          {v.groupBuy?.active && <span style={C.groupBuyChip}>👫 Group Buy {v.groupBuy.discount}% off</span>}
          <span style={C.items}>🥦 {inStockCount} items</span>
        </div>
        <div style={C.vegRow}>
          {v.inventory.slice(0,4).map(item => {
            const veg = VEGETABLES.find(x => x.id === item.vegId);
            return veg ? (
              <div key={item.vegId} style={{ ...C.chip, background:TH.chip, opacity: item.inStock ? 1 : 0.4 }}>
                <span>{veg.emoji}</span>
                <span style={{ fontSize:10, color:TH.text2 }}>{veg.names[lang]||veg.names.en}</span>
                <span style={{ fontSize:10, color:"#25a463", fontWeight:700 }}>₹{item.price}</span>
                {item.stockKg !== undefined && item.inStock && (
                  <span style={{ fontSize:9, color: item.stockKg < 10 ? "#f07d2a" : "#8aaa84" }}>
                    {item.stockKg < 10 ? `⚠${item.stockKg}kg` : `${item.stockKg}kg`}
                  </span>
                )}
              </div>
            ) : null;
          })}
        </div>
        <div style={C.actions}>
          <button style={C.viewBtn} onClick={onSelect}>View Details</button>
          <button style={C.waBtn} onClick={onWA}>WhatsApp</button>
        </div>
      </div>
    </div>
  );
}

function MinCard({ v, lang, TH, onSelect }) {
  return (
    <div style={{ ...C.card, background:TH.card, display:"flex", alignItems:"center", gap:10, marginBottom:8, cursor:"pointer" }} onClick={onSelect}>
      <img src={v.image} alt="" style={{ width:52, height:52, borderRadius:12, objectFit:"cover", flexShrink:0 }} onError={e => e.target.style.display="none"} />
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <div style={{ fontSize:14, fontWeight:700, color:TH.text }}>{v.name}</div>
          {v.verified && <span style={C.verifiedDot}>✓</span>}
        </div>
        <div style={{ fontSize:11, color:"#8aaa84" }}>{v.area} · {v.distance}km</div>
      </div>
      <div style={{ ...C.openBadge, position:"relative", top:"auto", left:"auto", right:"auto", background: v.isOpen ? "#25a463" : "#e53935" }}>
        {v.isOpen ? "Open" : "Closed"}
      </div>
    </div>
  );
}

function Nav({ setScreen, setShowAI, TH, T, cartCount, setShowCart, setShowScan }) {
  return (
    <div style={{ ...N.nav, background: TH.card }}>
      <button style={N.btn} onClick={() => setScreen("home")}><span style={N.icon}>🏠</span><span style={N.lbl}>Home</span></button>
      <button style={N.btn} onClick={() => setScreen("vendors")}><span style={N.icon}>🗺️</span><span style={N.lbl}>Nearby</span></button>
      <button style={{ ...N.btn, ...N.aiBtn }} onClick={() => setShowAI(true)}><span style={N.icon}>🤖</span><span style={{ ...N.lbl, color:"#fff" }}>AI</span></button>
      <button style={{ ...N.btn, background:"linear-gradient(135deg,#e91e63,#880e4f)", borderRadius:"18px 18px 0 0", margin:"0 4px" }} onClick={() => setShowScan(true)}><span style={N.icon}>📸</span><span style={{ ...N.lbl, color:"#fff" }}>Scan</span></button>
      <button style={N.btn} onClick={() => setScreen("profile")}><span style={N.icon}>🧑</span><span style={N.lbl}>Profile</span></button>
    </div>
  );
}

const S = {
  page: { minHeight:"100vh", paddingBottom:80, maxWidth:520, margin:"0 auto" },
  header: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", boxShadow:"0 1px 8px rgba(0,0,0,0.07)" },
  logo: { fontSize:20, fontWeight:800 },
  headerRight: { display:"flex", alignItems:"center", gap:8 },
  iconBtn: { background:"none", border:"none", fontSize:20, cursor:"pointer" },
  langBtn: { border:"none", borderRadius:20, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" },
  cartBtn: { background:"#e8f5ee", border:"none", borderRadius:20, padding:"6px 12px", fontSize:13, fontWeight:700, cursor:"pointer", color:"#1a7a4a", position:"relative" },
  cartBadge: { background:"#e53935", color:"#fff", borderRadius:10, padding:"1px 5px", fontSize:10, fontWeight:800, marginLeft:4 },
  weatherTip: { background:"linear-gradient(135deg,#fffde7,#fff9c4)", padding:"9px 16px", fontSize:12, color:"#7a5c00", borderBottom:"1px solid #ffe082" },
  searchBox: { display:"flex", alignItems:"center", gap:10, borderRadius:14, padding:"11px 14px", boxShadow:"0 2px 8px rgba(0,0,0,0.07)" },
  searchInput: { flex:1, border:"none", fontSize:14, outline:"none" },
  voiceBtn: { width:38, height:38, borderRadius:19, border:"none", fontSize:18, cursor:"pointer" },
  heroGreen: { background:"linear-gradient(135deg,#25a463,#1a7a4a)", borderRadius:18, padding:"16px 14px", border:"none", cursor:"pointer", textAlign:"left" },
  heroOrange: { background:"linear-gradient(135deg,#f07d2a,#c85a00)", borderRadius:18, padding:"16px 14px", border:"none", cursor:"pointer", textAlign:"left" },
  heroIcon: { fontSize:28, marginBottom:6 },
  heroTitle: { fontSize:14, fontWeight:700, color:"#fff", marginBottom:3 },
  heroSub: { fontSize:11, color:"rgba(255,255,255,0.8)" },
  annoCard: { borderRadius:14, padding:"12px 14px", minWidth:220, maxWidth:260, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:"1px solid #e8f5ee" },
  testimonialCard: { borderRadius:16, padding:"14px", minWidth:230, maxWidth:260, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" },
  heroBanner: { margin:"12px 14px 0", borderRadius:20, background:"linear-gradient(135deg,#1a7a4a,#25a463)", padding:"16px 14px", display:"flex", alignItems:"center", gap:10, overflow:"hidden", position:"relative", minHeight:110 },
  heroBannerLeft: { flex:1, zIndex:2 },
  heroBannerBtn: { background:"#fff", color:"#1a7a4a", border:"none", borderRadius:20, padding:"7px 16px", fontSize:11, fontWeight:800, cursor:"pointer" },
  heroBannerRight: { width:100, height:90, position:"relative", flexShrink:0 },
  stallScene: { width:100, height:90, position:"relative" },
  stallCanopy: { position:"absolute", top:0, left:0, right:0, height:22, background:"linear-gradient(135deg,#f07d2a,#e65100)", borderRadius:"8px 8px 0 0" },
  basket: { position:"absolute", bottom:18, left:"50%", transform:"translateX(-50%)", background:"#8d6e63", borderRadius:"0 0 8px 8px", width:36, height:18, display:"flex", alignItems:"center", justifyContent:"center" },
  stallGround: { position:"absolute", bottom:10, left:0, right:0, height:8, background:"rgba(255,255,255,0.2)", borderRadius:4 },
  secRow: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  secTitle: { fontSize:15, fontWeight:700 },
  seeAll: { background:"none", border:"none", color:"#25a463", fontSize:13, fontWeight:600, cursor:"pointer" },
  hScroll: { display:"flex", gap:10, overflowX:"auto", paddingBottom:6, marginBottom:4 },
  hScroll2: { display:"flex", gap:8, padding:"0 14px 10px", overflowX:"auto" },
  priceCard: { borderRadius:16, padding:"10px 10px", minWidth:90, textAlign:"center", flexShrink:0, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", cursor:"pointer", border:"1px solid #f0f0f0", position:"relative" },
  priceImgWrap: { width:54, height:54, borderRadius:12, overflow:"hidden", margin:"0 auto 6px", background:"#f0f8f0", display:"flex", alignItems:"center", justifyContent:"center" },
  priceImg: { width:"100%", height:"100%", objectFit:"cover" },
  priceEmojiFallback: { fontSize:30, width:"100%", height:"100%", alignItems:"center", justifyContent:"center" },
  priceName: { fontSize:11, fontWeight:600, marginBottom:3 },
  priceAmt: { fontSize:14, fontWeight:800, color:"#25a463" },
  priceArea: { fontSize:9, color:"#8aaa84", marginTop:2 },
  seasonalBadge: { background:"linear-gradient(135deg,#ff9800,#f44336)", color:"#fff", fontSize:8, fontWeight:700, borderRadius:6, padding:"2px 5px", margin:"2px auto 4px", display:"inline-block" },
  catChip: { borderRadius:20, padding:"7px 16px", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 },
  vegGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginTop:10 },
  vegCard: { borderRadius:14, padding:"8px 6px", textAlign:"center", cursor:"pointer", border:"1px solid #eee", boxShadow:"0 1px 6px rgba(0,0,0,0.05)" },
  vegImgWrap: { width:"100%", height:58, borderRadius:10, overflow:"hidden", marginBottom:6, background:"#f0f8f0", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" },
  vegImg: { width:"100%", height:"100%", objectFit:"cover", display:"block" },
  vegImgFallback: { position:"absolute", inset:0, fontSize:28, alignItems:"center", justifyContent:"center", background:"#f0f8f0" },
  vegSeasonTag: { position:"absolute", bottom:0, left:0, right:0, background:"rgba(255,140,0,0.85)", color:"#fff", fontSize:7, fontWeight:700, padding:"2px 4px", textAlign:"center" },
  vegName: { fontSize:10, fontWeight:600, marginBottom:3 },
  vegPrice: { fontSize:12, fontWeight:800, color:"#25a463", marginBottom:3 },
  vegStock: { fontSize:9, borderRadius:6, padding:"2px 5px", fontWeight:600 },
  subBar: { display:"flex", alignItems:"center", gap:12, padding:"14px 16px", boxShadow:"0 1px 6px rgba(0,0,0,0.07)" },
  backBtn: { background:"none", border:"none", fontSize:24, cursor:"pointer", color:"#25a463", fontWeight:700 },
  subTitle: { flex:1, fontSize:17, fontWeight:700 },
  areaChip: { borderRadius:20, padding:"7px 14px", fontSize:12, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 },
  empty: { textAlign:"center", padding:"50px 20px", color:"#8aaa84", fontSize:15 },
  detBack: { position:"absolute", top:14, left:14, background:"rgba(255,255,255,0.92)", border:"none", borderRadius:20, width:38, height:38, fontSize:20, cursor:"pointer", fontWeight:700, zIndex:5 },
  detFav: { position:"absolute", top:14, right:14, background:"rgba(255,255,255,0.92)", border:"none", borderRadius:20, width:38, height:38, fontSize:20, cursor:"pointer", zIndex:5 },
  openBig: { position:"absolute", bottom:44, left:14, color:"#fff", fontSize:12, fontWeight:700, padding:"5px 12px", borderRadius:20, zIndex:5 },
  imgNameOverlay: { position:"absolute", bottom:12, left:14, right:14, zIndex:5 },
  imgVendorName: { fontSize:16, fontWeight:800, color:"#fff", textShadow:"0 1px 4px rgba(0,0,0,0.5)" },
  verifiedBadgeImg: { background:"#1565c0", color:"#fff", fontSize:10, fontWeight:700, borderRadius:10, padding:"3px 8px", marginLeft:8, verticalAlign:"middle" },
  detSheet: { borderRadius:"20px 20px 0 0", marginTop:-18, padding:"18px 16px 30px" },
  detRow: { display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 },
  detName: { fontSize:18, fontWeight:800, marginBottom:4 },
  detSub: { fontSize:12, color:"#8aaa84", marginBottom:2 },
  speakBtn2: { background:"#e8f5ee", border:"none", borderRadius:20, padding:"8px 10px", fontSize:18, cursor:"pointer" },
  pillRow: { display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 },
  pill: { background:"#f7f9f5", borderRadius:20, padding:"4px 10px", fontSize:11, fontWeight:600, color:"#4a6741" },
  verifiedBadge: { background:"#1565c0", color:"#fff", fontSize:11, fontWeight:700, borderRadius:10, padding:"2px 8px", display:"inline-block" },
  groupBuyBox: { borderRadius:14, padding:"12px 14px", marginBottom:14 },
  joinBtn: { color:"#fff", border:"none", borderRadius:10, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer" },
  memberChip: { background:"rgba(37,164,99,0.12)", color:"#1a7a4a", fontSize:11, fontWeight:600, borderRadius:20, padding:"3px 10px" },
  seasonalTag: { background:"linear-gradient(135deg,#ff9800,#f44336)", color:"#fff", fontSize:9, fontWeight:700, borderRadius:8, padding:"2px 6px" },
  invTitle: { fontSize:14, fontWeight:700, color:"#1a7a4a", marginBottom:10 },
  invRow: { display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #f5f5f5" },
  invImgWrap: { width:46, height:46, borderRadius:10, overflow:"hidden", flexShrink:0, background:"#f0f8f0", display:"flex", alignItems:"center", justifyContent:"center" },
  invImg: { width:"100%", height:"100%", objectFit:"cover" },
  invEmoji: { fontSize:26, alignItems:"center", justifyContent:"center" },
  invSpeakBtn: { background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, padding:0 },
  invPrice: { fontSize:15, fontWeight:800, color:"#25a463" },
  invBadge: { fontSize:10, borderRadius:6, padding:"2px 6px", fontWeight:600, marginTop:2, display:"inline-block" },
  freshnessBtn: { border:"none", borderRadius:10, padding:"3px 8px", fontSize:10, fontWeight:600, cursor:"pointer", marginTop:4 },
  actRow: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:14, marginBottom:10 },
  actWA: { padding:"12px", background:"#dcf8c6", color:"#075e54", border:"none", borderRadius:14, fontSize:14, fontWeight:700, cursor:"pointer" },
  actOrder: { padding:"12px", background:"#e8f5ee", color:"#1a7a4a", border:"none", borderRadius:14, fontSize:14, fontWeight:700, cursor:"pointer" },
  upiRow: { background:"#f3e8ff", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:8, marginBottom:10 },
  upiLbl: { fontSize:12, color:"#6200ea", fontWeight:600 },
  upiVal: { flex:1, fontSize:14, fontWeight:700, color:"#1a2e1a" },
  copyBtn: { background:"#6200ea", color:"#fff", border:"none", borderRadius:8, padding:"5px 10px", fontSize:11, cursor:"pointer" },
  mapsBtn: { width:"100%", padding:"12px", background:"#e3f2fd", color:"#1565c0", border:"none", borderRadius:14, fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:14 },
  revHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  addRevBtn: { background:"#e8f5ee", color:"#1a7a4a", border:"none", borderRadius:10, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" },
  revForm: { background:"#f9fdf9", borderRadius:14, padding:14, marginBottom:10 },
  starRow: { display:"flex", marginBottom:8 },
  revInput: { width:"100%", background:"#fff", border:"1px solid #d4e8d0", borderRadius:10, padding:"9px 12px", fontSize:13, marginBottom:8, boxSizing:"border-box" },
  revSubmit: { width:"100%", padding:"10px", background:"#25a463", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer" },
  revCard: { background:"#f9fdf9", borderRadius:12, padding:"10px 12px", marginBottom:8 },
  revTop: { display:"flex", justifyContent:"space-between", marginBottom:4 },
  revName: { fontSize:13, fontWeight:600, color:"#1a2e1a" },
  modalBg: { position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" },
  modal: { borderRadius:"24px 24px 0 0", padding:"20px 16px 32px", width:"100%", maxWidth:520, maxHeight:"80vh", overflowY:"auto", margin:"0 auto" },
  qBtn: { width:30, height:30, borderRadius:15, background:"#e8f5ee", border:"none", fontSize:18, cursor:"pointer", color:"#1a7a4a", fontWeight:700 },
  orderTotalBox: { background:"#f0faf5", borderRadius:12, padding:"12px 14px", marginTop:12, marginBottom:4 },
  confirmBtn: { width:"100%", padding:"14px", background:"#25a463", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer", marginTop:14 },
  profileCard: { borderRadius:18, padding:16, display:"flex", alignItems:"center", gap:14, marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.07)" },
  profileAvatar: { width:56, height:56, borderRadius:28, background:"linear-gradient(135deg,#25a463,#1a7a4a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, color:"#fff", fontWeight:800, flexShrink:0 },
  onlineCard: { borderRadius:16, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 },
  toggleBtn: { color:"#fff", border:"none", borderRadius:12, padding:"10px 16px", fontSize:13, fontWeight:700, cursor:"pointer" },
  statsGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 },
  statBox: { borderRadius:14, padding:"12px 6px", textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" },
  aiTipBox: { background:"linear-gradient(135deg,#e8f5ee,#d4f0e4)", borderRadius:14, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start", marginBottom:14 },
  invCard: { borderRadius:16, padding:14 },
};

const C = {
  card: { borderRadius:18, overflow:"hidden", marginBottom:14, boxShadow:"0 2px 12px rgba(0,0,0,0.07)" },
  imgWrap: { position:"relative", height:155, cursor:"pointer" },
  img: { width:"100%", height:"100%", objectFit:"cover" },
  openBadge: { position:"absolute", top:10, left:10, color:"#fff", fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, zIndex:2 },
  verifiedOverlay: { position:"absolute", top:10, left:70, background:"#1565c0", color:"#fff", fontSize:10, fontWeight:700, padding:"4px 8px", borderRadius:20, zIndex:2 },
  crowdBadge: { position:"absolute", top:10, right:10, background:"rgba(255,255,255,0.92)", fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:20, zIndex:2 },
  imgName: { position:"absolute", bottom:10, left:12, right:12, color:"#fff", fontSize:14, fontWeight:700, textShadow:"0 1px 4px rgba(0,0,0,0.6)", zIndex:2 },
  cartOverlay: { position:"absolute", bottom:10, right:10, background:"rgba(37,164,99,0.92)", color:"#fff", fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, zIndex:2 },
  body: { padding:"12px 14px" },
  row: { display:"flex", alignItems:"flex-start", gap:8, marginBottom:6 },
  name: { fontSize:15, fontWeight:700, cursor:"pointer", marginBottom:3 },
  meta: { fontSize:11, color:"#8aaa84" },
  favBtn: { background:"none", border:"none", fontSize:20, cursor:"pointer" },
  statsRow: { display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" },
  rating: { fontSize:13, fontWeight:700, color:"#f07d2a" },
  revs: { fontSize:11, color:"#8aaa84" },
  groupBuyChip: { background:"#fff8e1", color:"#b45309", fontSize:10, fontWeight:700, borderRadius:10, padding:"2px 8px", border:"1px solid #fcd34d" },
  items: { fontSize:11, color:"#25a463", marginLeft:"auto" },
  verifiedDot: { background:"#1565c0", color:"#fff", fontSize:10, fontWeight:700, borderRadius:10, padding:"1px 6px" },
  vegRow: { display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 },
  chip: { display:"flex", alignItems:"center", gap:4, borderRadius:10, padding:"4px 8px" },
  actions: { display:"flex", gap:8 },
  viewBtn: { flex:1, padding:"9px", background:"#e8f5ee", color:"#1a7a4a", border:"none", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer" },
  waBtn: { flex:1, padding:"9px", background:"#dcf8c6", color:"#075e54", border:"none", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer" },
};

const N = {
  nav: { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:520, display:"flex", borderTop:"1px solid #eee", paddingBottom:6, zIndex:100, boxShadow:"0 -2px 12px rgba(0,0,0,0.07)" },
  btn: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"none", border:"none", cursor:"pointer", padding:"8px 0 2px" },
  aiBtn: { background:"linear-gradient(135deg,#25a463,#1a7a4a)", borderRadius:"18px 18px 0 0", margin:"0 4px" },
  icon: { fontSize:20 },
  lbl: { fontSize:9, color:"#8aaa84" },
};
