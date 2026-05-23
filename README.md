<div align="center">

# 🛒 StreetMart

### Fresh Vegetables. Local Vendors. Your Language.

**A Progressive Web App connecting Hyderabad residents with local street vegetable vendors — live prices, real-time stock, group buying, and 10+ Indian languages.**

[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![PWA](https://img.shields.io/badge/PWA-Ready-25a463?style=flat-square&logo=googlechrome)](https://web.dev/pwa)
[![Languages](https://img.shields.io/badge/Languages-10+-orange?style=flat-square)](https://github.com)
[![Offline](https://img.shields.io/badge/Offline-Supported-blue?style=flat-square)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

### 🌐 [Live Demo → streetmart-phi.vercel.app](https://streetmart-phi.vercel.app)

[📱 Install as App](#how-to-install-pwa) · [🐛 Report Bug](../../issues) · [✨ Request Feature](../../issues)

</div>

---

## 🎯 The Problem

Street vegetable vendors in Indian cities like Hyderabad have no digital presence. Customers don't know:
- Which vendors are open right now
- What vegetables are available and at what price
- How to contact vendors or reach them

**StreetMart solves this** — a hyperlocal marketplace built for both vendors and buyers, in their own language.

---

## ✨ Features

### 🗺️ Discovery
- **Live vendor map** — see all nearby vendors with open/closed status
- **Distance-based listing** — vendors sorted by proximity
- **Area filter** — browse by Hyderabad neighbourhood (Mehdipatnam, Ameerpet, Abids, etc.)
- **Voice search** — search vegetables by speaking in any language

### 📦 Stock & Pricing
- **Live stock bar** — visual green/orange/red bar showing kg remaining
- **⚠️ Low stock warning** — alerts when stock drops under 10kg
- **Price comparison** — compare same vegetable across all vendors side by side
- **Best prices feed** — today's cheapest prices at a glance
- **Seasonal tags** — "Summer Only" badge for seasonal produce like mango

### 💰 Savings
- **🏷️ Bulk discount** — buy 5kg+ and get 8–12% off, auto-calculated
- **👫 Group buying** — join neighbours for group discounts with live member list
- **Loyalty points** — earn points on every order, progress to Gold status

### 🌐 Multilingual
- **10+ Indian languages** — Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, English
- **Auto language detection** — detects browser language automatically
- **🔊 Voice readout** — tap any vegetable or vendor to hear it spoken aloud

### 📱 PWA / Offline
- **Installable** — add to home screen like a native app, no app store needed
- **Offline support** — browse cached vendor data without internet
- **Service worker** — network-first caching with graceful fallback
- **Push notifications** — vendor stock alerts (infrastructure ready)

### 🛒 Ordering
- **Multi-vendor cart** — add items from different vendors, single checkout
- **Pre-order via WhatsApp** — send order directly to vendor
- **Order history** — all past orders saved locally
- **UPI payment** — copy vendor UPI ID in one tap

### 🤝 Social
- **✓ Verified badge** — trusted vendors marked with blue tick
- **👍 Freshness voting** — confirm today's produce is fresh
- **Reviews & ratings** — leave reviews with star rating
- **📢 Vendor announcements** — vendors post "fresh stock arrived!" updates

### 🧑 Profile
- **Personal profile** — name, area, order history
- **Loyalty dashboard** — points, order count, Gold status progress
- **Favourites** — save preferred vendors

### 🧑‍🌾 Vendor Dashboard
- **Go Online/Offline** — control visibility to customers
- **Inventory management** — update prices and stock status
- **Post announcements** — notify customers of fresh stock
- **AI tips** — weather-based selling suggestions
- **Stats** — earnings, customer count, ratings

### 🎨 UI/UX
- **Smooth animations** — page transitions, skeleton loaders, bounce effects
- **Dark mode** — full dark theme support
- **Onboarding** — beautiful 4-slide first-time walkthrough
- **Toast notifications** — non-intrusive feedback on every action
- **Desktop optimised** — max-width 520px centered, works on all screens

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Styling | Pure CSS-in-JS (no CSS framework) |
| PWA | Service Worker + Web App Manifest |
| Storage | localStorage (profile, orders, history) |
| Maps | Google Maps Directions API |
| Voice | Web Speech API (SpeechSynthesis + SpeechRecognition) |
| Payments | UPI deep links + WhatsApp Business API |
| i18n | Custom translation layer (10 languages) |
| Notifications | Push API + Service Worker |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org))
- npm 9+

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/streetmart.git
cd streetmart

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📱 How to Install PWA

**On Android (Chrome):**
1. Open the app in Chrome
2. Tap the 3-dot menu → "Add to Home Screen"
3. Tap Install

**On iPhone (Safari):**
1. Open in Safari
2. Tap Share → "Add to Home Screen"
3. Tap Add

**On Desktop (Chrome):**
1. Look for the install icon in the address bar
2. Click "Install StreetMart"

---

## 📁 Project Structure

```
streetmart/
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service worker (offline + push)
│   └── icon-*.png           # App icons
├── src/
│   ├── components/
│   │   ├── AIChat.jsx        # AI assistant chat
│   │   ├── InstallBanner.jsx # PWA install prompt
│   │   ├── LanguageSelector.jsx
│   │   ├── LoyaltyPoints.jsx
│   │   ├── Onboarding.jsx    # First-time walkthrough
│   │   ├── PriceHistory.jsx  # Price trend chart
│   │   ├── Skeleton.jsx      # Loading skeletons
│   │   ├── Toast.jsx         # Toast notifications
│   │   └── VendorCard.jsx
│   ├── data/
│   │   ├── languages.js      # 10-language translation strings
│   │   └── vegetables.js     # Vendor + vegetable data
│   ├── hooks/
│   │   └── useVoice.js       # Speech synthesis + recognition
│   ├── App.jsx               # Main app + all screens
│   ├── index.css             # Global styles + animations
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

---

## 🌍 Supported Languages

| Language | Code | Script |
|----------|------|--------|
| English | `en` | Latin |
| Hindi | `hi` | Devanagari |
| Telugu | `te` | Telugu |
| Tamil | `ta` | Tamil |
| Kannada | `kn` | Kannada |
| Malayalam | `ml` | Malayalam |
| Marathi | `mr` | Devanagari |
| Bengali | `bn` | Bengali |
| Gujarati | `gu` | Gujarati |
| Punjabi | `pa` | Gurmukhi |

---

## 🗺️ Roadmap

- [ ] Real-time backend (Firebase / Supabase)
- [ ] Actual GPS location detection
- [ ] Leaflet.js map with vendor pins
- [ ] Photo reviews (camera upload)
- [ ] Weekly meal planner
- [ ] SMS notifications (Twilio)
- [ ] Vendor analytics dashboard with charts
- [ ] Payment integration (Razorpay)

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
git checkout -b feature/amazing-feature
git commit -m 'Add amazing feature'
git push origin feature/amazing-feature
# Open a Pull Request
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ for Hyderabad's street vendors

⭐ **Star this repo if you found it useful!**

</div>
