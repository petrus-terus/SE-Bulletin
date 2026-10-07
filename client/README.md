# 📱 Sabah Electricity Bulletin — Frontend Client

The frontend client is a high-performance, mobile-first **Progressive Web App (PWA)** built with **React 19**, **TypeScript**, and **Vite**.

Designed to replace traditional email blasts and intranet circulars, it provides Sabah Electricity staff with an engaging internal social feed adhering strictly to Sabah Electricity corporate branding, zero "UI slop", and 10.8:1 WCAG AAA accessibility.

---

## ⚡ Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional - defaults to offline mock data)
cp .env.example .env.local

# 3. Start local development server
npm run dev
```

Open your browser at **[http://localhost:3001/](http://localhost:3001/)**.  
For optimal mobile testing, set DevTools viewport to **iPhone 14/15 Pro (393 × 852)**.

---

## 🏗️ Architecture & Key Folders

```
client/
├── public/                 # Static assets, PWA manifest, service worker (sw.js), brand logos
│   ├── manifest.json       # PWA web app manifest with standalone display configuration
│   └── sw.js               # Service worker for offline shell caching
├── src/
│   ├── features/           # Domain feature slices
│   │   ├── feed/           # KinabaluSkylineHero, FeedCard, CeoWisdomSection, SesiKnowledgeHubBanner, DepartmentFilters, TrendingSection
│   │   ├── post/           # PostDetailView, CommentDrawer, InteractivePollCard, EmojiReactionDock, ReshareBottomSheet, QuoteBulletinModal, SavedPostsDrawer
│   │   ├── stories/        # StoriesBar, StoryViewerModal, CreateStoryModal
│   │   ├── create/         # CreateBulletinPage (Bulletin Studio with quick templates)
│   │   ├── directory/      # SearchDirectoryPage (Staff directory & search)
│   │   ├── profile/        # ProfilePage, AchievementsDeck
│   │   └── notifications/  # NotificationsView
│   ├── layout/             # Shell, framing & navigation (AppShell, TopAppBar, BottomNav, TabRouter, OverlayHost, DesktopSidebar, BrandSidebarDrawer)
│   ├── ui/                 # Reusable system UI (Toast, ErrorBoundary, PilotGate, LoginPage, PwaInstallPrompt, ImageViewerModal)
│   ├── components/         # Backward-compatibility barrel re-exporting modules
│   ├── hooks/              # Custom React hooks (usePostActions, useRealtimeSync, useHorizontalScroll)
│   ├── services/           # Services (bulletinService, bookmarkStorage, notificationService, marketService, mockData)
│   ├── data/               # Static datasets (departments.ts)
│   ├── utils/              # Pure utilities (format.ts, imageCompressor.ts)
│   ├── types/              # TypeScript domain interfaces (Post, Employee, Department, Story)
│   ├── index.css           # Design tokens (colors, typography, spacing, WCAG AAA resets)
│   ├── App.tsx             # Root state coordinator (~480 lines)
│   └── main.tsx            # React 19 entry point & Service Worker registration
├── .env.example            # Environment variables template
├── package.json
└── vite.config.ts          # Vite configuration with path aliases (@/*) and market API proxy
```

---

## 🛠️ Available NPM Scripts

- `npm run dev`: Launches Vite dev server on port `3001` with HMR.
- `npm run build`: Type-checks with `tsc -b` and builds minified production bundle in `dist/`.
- `npm run lint`: Runs `oxlint` across all files for ultra-fast zero-warning defect scanning.
- `npm run preview`: Previews the production build locally.

---

## 🎨 Craft Standards & Design System

- **Zero UI Slop**: Maintain 16–20px spacing, 12px rounded cards (`rounded-xl`), and avoid visual clutter.
- **Strict WCAG AAA Contrast**: Dark ink text (`#0B0F17`) on emerald/green accents (`#10B981`) for a 10.8:1 contrast ratio. Never use white text on emerald.
- **Instrumentation**: Apply `font-mono tabular-nums` to all counters, timestamps, IDs, and financial quotes to prevent horizontal layout jitter.
- **Pure Modern CSS**: Zero Tailwind dependency; all styling uses CSS Variables & CSS Modules.
