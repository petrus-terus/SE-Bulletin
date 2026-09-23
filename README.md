# ⚡ Sabah Electricity Internal Bulletin App (PWA)

> **Corporate Internal Social & Communication Progressive Web App (PWA)**  
> Built for **Sabah Electricity Sdn. Bhd. (SESB)**  
> Target: **Wisma SESB HQ Staff (Phase 1) → Statewide Sabah & Labuan Grid Depots (Phase 2)**

---

## 🌟 Executive Overview

**Sabah Electricity Bulletin** is a modern, mobile-first internal social communication feed designed to replace fragmented email blasts and static intranet circulars. Inspired by modern consumer social networks yet strictly compliant with Sabah Electricity's civic governance, on-premise data residency, and enterprise role-based publishing controls.

### 🏔️ Key Highlights & Features
- **Kinabalu & Kota Kinabalu Skyline Hero**:
  - Handcrafted scalable SVG vector art featuring Mount Kinabalu's majestic peaks, rolling foothills, Wisma SESB HQ profile, and power transmission lines with a traveling energy pulse.
  - **Dynamic Time-of-Day Lighting Ambiance**: Switchable between ☀️ **Daylight**, 🌅 **Dusk / Sunset**, and 🌙 **Night** (with illuminated office windows).
  - Live grid telemetry heartbeat (*"Grid Synced • Tenom to KK"*).
- **24-Hour Department Stories**:
  - Highlights carousel for official department updates (Operations, Safety/HSE, HR, IT) with unread rings.
  - Full-screen **5-second Story Viewer** with segmented progress bar, tap-to-navigate, and press-and-hold pause.
- **Interactive Feed & Discussions**:
  - Department filter pills (*All Posts*, *Operations & Engineering*, *Safety & Health*, *HR*, *IT*, *Finance*).
  - Feed cards with author avatars, verified badges, department chips, and station location tags.
  - **Optimistic Interactions**: Tactile Like button with heart pop animation and `font-mono tabular-nums` counter updates (`148` ↔ `149`).
  - **Sliding Comment Drawer**: Sliding bottom drawer displaying threaded replies with a sticky input bar.
  - Share link copying with Apple HIG-style spring toast notifications.
- **Floating Action Button (+) & Post Creation Sheet**:
  - Bottom action sheet with 3 post archetypes:
    1. *Quick Status Update* (casual text + photo)
    2. *Photo / Gallery* (multi-image picker)
    3. *Official Announcement* (restricted to Dept Admins; includes department selector, headline, pinned toggle, and comment toggle)
- **Bottom Navigation**:
  - 5 tabs: **Home**, **Explore Directory**, **(+) Center FAB**, **Alerts (Notifications)**, and **Staff Profile**.

---

## 🎨 Craft Standards & Design Tokens

Built strictly following the **Impeccable Craft Standards** (Pure Modern CSS & CSS Modules; **Zero Tailwind CSS**):

| Token Category | Token Variable | Hex Value | Usage Context |
| :--- | :--- | :--- | :--- |
| **Corporate Blue** | `--color-primary-container` | `#0055A4` | Kinabalu blue peak, active tab icons, department badges |
| **Forest Green** | `--color-forest-green` | `#1A7A5A` | Kinabalu green peak, primary buttons, story active rings |
| **Accent / CTA** | `--color-accent-green` | `#10B981` | Floating "+" button, online presence dot |
| **Dark Ink (WCAG AAA)**| `--color-dark-ink` | `#0B0F17` | **Strict 10.8:1 WCAG AAA contrast** text on emerald/green pills |
| **Canvas Background** | `--color-surface-base` | `#F5F7FA` | App shell, viewport body background |
| **Card Surface** | `--color-surface-card` | `#FFFFFF` | Post cards, modals, sheets (`border-radius: 12px`) |
| **Instrumentation** | `tabular-nums` / `font-mono` | — | Like/comment counters, timers, employee IDs (`SESB-1001`) |

---

## 🛠️ Technology Stack

```
SE-Bulletin/
├── client/                 # React + Vite PWA (Mobile-first, iPhone 393x852 / fluid 680px)
│   ├── src/
│   │   ├── components/     # AppShell, TopAppBar, KinabaluSkylineHero, StoriesBar, FeedCard, etc.
│   │   ├── services/       # Mock data & API service layer
│   │   ├── types/          # TypeScript interfaces (Post, Story, Department, Employee)
│   │   └── index.css       # Pure CSS variables design tokens & craft floor resets
│   └── package.json
├── server/                 # ASP.NET Core 8 Web API + SignalR (Phase 2 backend)
├── assets/                 # Brand assets & initial seed data
├── docs/                   # Stitch design system reference & blueprints
├── PROJECT_SPEC.md         # Exhaustive Software Requirements Specification
└── AGENTS.md / GEMINI.md   # Impeccable craft rules & engineering guidelines
```

- **Frontend**: React 19 + TypeScript + Vite.
- **Styling**: Pure Modern CSS with CSS Variables & CSS Modules.
- **Typography**: Google Fonts Inter + JetBrains Mono.
- **Backend (Target)**: ASP.NET Core 8 Web API + Entity Framework Core.
- **Real-Time Hub**: SignalR Hub (`/hubs/bulletin`) for live reactions and emergency broadcasts.
- **Database**: SQL Server / PostgreSQL.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Run
```bash
# 1. Navigate to the client directory
cd client

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open your browser at **`http://localhost:3000/`**.  
For the optimal mobile experience, toggle device emulation in DevTools to **iPhone 14/15 Pro (393 × 852)**.

### Production Build & Verification
```bash
cd client
npm run build
```

---

## 📋 Documentation References

- [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) — Comprehensive Software Requirements Specification & Technical Architecture.
- [`docs/stitch-design-reference.md`](./docs/stitch-design-reference.md) — Stitch UI design screen references.
- [`AGENTS.md`](./AGENTS.md) — Operating rules, WCAG AAA contrast guidelines, and engineering craft protocols.

---

## 🏢 Corporate Ownership & Rights

© 2026 **Sabah Electricity Sdn. Bhd. (SESB)**. Internal corporate software project. All rights reserved.
