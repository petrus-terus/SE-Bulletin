# SE Bulletin — Patch Notes (GitHub vs. Local Working Tree)

> **Generated**: 14 Oct 2026
> **GitHub baseline (`origin/main`)**: `ee84192` — *fix(auth): clear prefilled credentials and add demo account quick-fill pill* (5 Oct 2026)
> **Local HEAD**: `debeccb` — 9 commits ahead of GitHub, **plus a large uncommitted feature batch**
>
> In short: **GitHub has the Oct-5 pilot build. Your machine additionally has (a) an architecture refactor series and (b) an entire uncommitted "v2.7" feature drop** — dark mode, avatar cropping, live weather, and a redesigned hero widget.

---

## Layer 1 — 9 Local Commits Not Yet Pushed (Oct 5 → Oct 7)

These exist only on your machine. Nothing on GitHub has them.

### 🏗️ Architecture Refactor (the big one)
- **`App.tsx` was cut from ~1,900 lines down to ~240** — it was doing everything. Logic was split into:
  - `layout/TabRouter.tsx` — tab routing + lazy view loading
  - `layout/OverlayHost.tsx` — modals/drawers/sheets host
  - `hooks/usePostActions.ts` — like/comment/reshare/bookmark logic (new, 459 lines)
  - `hooks/useRealtimeSync.ts` — Supabase realtime listeners (new, 312 lines)
  - `utils/format.ts`, `services/bookmarkStorage.ts` — shared helpers (new)
- **Folder reorganization**: old flat `components/` directory replaced by
  - `features/` (auth, create, directory, feed, notifications, post, profile, stories)
  - `layout/` (AppShell, BottomNav, TopAppBar, sidebars, drawers)
  - `shared/` (FeedCard, PollCard, Quote/Reshare modals)
  - `ui/` (Toast, ErrorBoundary, ImageViewer, PwaInstallPrompt)
- **Path aliases added** (`@/...`) in `vite.config.ts` + `tsconfig.app.json` — no more deep relative imports.
- **Old 511-line `LoginPage.tsx` deleted**, replaced by slimmer `features/auth/LoginPage.tsx` (202 lines).

### 🐛 Bug Fixes
- **Duplicate React keys fixed** — posts are deduped on publish and on quote; state now uses ID lookup instead of storing full duplicated post objects.
- **Supabase zero-row crashes fixed** — profile and view-count lookups now use `maybeSingle()` instead of assuming a row exists.

### 🧹 Repo Hygiene
- Dead assets removed (`hero.png`, `react.svg`, `sesb_logo.png`, `user_face.png`, `vite.svg`).
- `oxlint` rule promoted: `no-unused-vars` is now an **error**, not a warning.
- New test scripts: `client/tests/e2e_verification.cjs`, `visual_audit_walkthrough.cjs`, `phase3_tests.js`.
- New shared `data/departments.ts`, plus `.agents/skills/systematic-debugging/` added.

**Scale**: 105 files changed, +4,302 / −2,425 lines across these 9 commits.

---

## Layer 2 — Uncommitted Working Tree (the "v2.7" drop, ~2,072 / −1,619 lines)

Everything here is **live in your code but not saved to any commit**. Grouped by feature:

### 🌙 1. Full Dark Mode Engine (headline feature)
Per `docs/DARK_MODE_PROMPT.md` and GATES **G14** (verified):
- **New `client/src/theme/` module**:
  - `themeStore.ts` — module store + `useSyncExternalStore` (no React Context; matches the codebase's prop-drilling style)
  - `themeStorage.ts` — persistence under `sesb_theme` localStorage key
  - `useTheme.ts` — hook exposing `preference` + `effectiveTheme`
  - `ThemeSwitcher.tsx` — 3-segment **Light / System / Dark** pill with sliding indicator
- **Selector wired in two places**: mobile `BrandSidebarDrawer` (tap SESB logo) and `DesktopSidebar` bottom section.
- **Zero-flash startup**: inline pre-paint script in `index.html` applies the theme before React mounts; `<meta name="theme-color" id="app-theme-color">` now tracks the active theme (`#0B0F17` dark / `#F5F7FA` light).
- **Dark token set in `index.css`** under `:root[data-theme='dark']` — slate surfaces (`#0B0F17`/`#151C2B`/`#1E293B`), WCAG-checked text (15.7:1 headings, 11.6:1 body), dark shadows, dark scrollbars, dark selection color.
- **Token role split to protect contrast**: new `--color-primary-text` / `--color-forest-text` (text/icons) separate from `--color-primary` / `--color-forest-green` (button backgrounds stay brand-solid). New `--color-surface-glass` for frosted chrome (top bar, bottom nav).
- **Brand asset protection**: `--surface-logo-badge` keeps official SESB/TNB logos on a white badge in both themes; `--image-dim` (0.92) dims feed photos in dark.
- **Smooth 240ms theme flip** via `html.theme-transitioning` class — gated behind `prefers-reduced-motion`.
- **Cross-tab sync** via `storage` event + live OS theme tracking via `matchMedia`.
- **Hex → CSS variable sweep** across ~18 CSS modules and ~138 inline `style={{}}` colors (e.g. `#0055A4` → `var(--color-primary-text)`).
- Service worker cache bumped `sesb-bulletin-v2.6` → `v2.7`; manifest `theme_color` updated.

### ✂️ 2. Avatar Crop Sheet (new profile photo flow)
- **New `AvatarCropSheet.tsx`** + `utils/cropImage.ts`, new dependency **`react-easy-crop`**.
- Circular-framing preview with zoom slider; photo is **only uploaded after the user confirms the framing** (previously it uploaded immediately, blind).
- Output is a fixed **512×512 WebP** (quality 0.86), min 128px edge, max 10 MB — rejects bad files with a toast before decoding.
- Inside the Edit Profile modal, the crop result is **staged** — Cancel cleanly discards it.
- `bulletinService.uploadPhoto()` now accepts size/quality options (defaults unchanged for bulletins/stories).
- `alert()` calls replaced with proper **Toast** notifications; ESC priority + focus restore handled.

### 🌦️ 3. Live Kota Kinabalu Weather (hero widget)
- **New `weatherService.ts`** — real weather via Open-Meteo API, 15-minute localStorage cache, offline fallback (28°C Cerah Berawan), WMO codes mapped to Bahasa Melayu labels + Material icons.
- Hero greeting is now **time-aware**: *Selamat Pagi / Tengah Hari / Petang / Malam*.
- Employee ID row replaced by a **Division label** ("Bahagian X" → "Division X").
- Date and temperature render in `font-mono tabular-nums` (no jitter).

### 📈 4. TNB Share Widget Redesign (hero)
- The big full-width scrubable intraday chart was **replaced by a compact right-column layout**: big price on the left, mini sparkline + day-range indicator on the right. Much less vertical space.

### 🧭 5. Bulletin Creator UX Overhaul
- Department and Audience dropdowns converted from clipped popovers into **portal-rendered bottom modal sheets** (mounted to `document.body`, bypass overflow clipping).
- Both sheets close with **ESC** or overlay tap, proper `role="dialog"` + `aria-modal`, mutually exclusive open state.

### 🖼️ 6. Avatar Fallback Swap (authentic branding)
- Default avatar fallback changed everywhere (`FeedCard`, comments, stories, quotes, directory, realtime sync, profiles) from the old generic `/user_face.png` to **`/sabah_electricity_logo.png`**.
- Deleted: `user_face.png`, `icons.svg`, `mock-images/image3.png` (1.4 MB).

### 🛠️ 7. Smaller Fixes & Polish
- **Toast exit animation** — new `exiting` state with a 200ms fade-out before unmount (plan `005-toast-exit-phase`).
- **marketService guard** — day high/low only taken from Yahoo meta when they are valid positive numbers; otherwise derived from intraday points.
- **Profile merge dedupe by email** — cloud/local profiles now merge on lowercase email instead of raw ID (prevents duplicate accounts); all cloud profiles cached locally for offline.
- **iOS keyboard zoom fixed** — `font-size: 16px` on all inputs; `interactive-widget=resizes-content` added to viewport meta.
- `overscroll-behavior: none` on html (kills pull-to-refresh white flash), tap-highlight fixes, Apple status bar style changed `black-translucent` → `default`.

### 📄 8. New Docs, Plans & Scripts
- `docs/DARK_MODE_PROMPT.md` — the self-contained dark-mode spec (review v2).
- `plans/` — 7 tracked plan docs: mobile-native foundation, carousel touch-action, like-pop a11y, token cleanup, toast exit, story-viewer reduced motion.
- `scripts/seed-supabase.mjs` — standalone Supabase seed script (uses publishable anon key; fine to commit, but keep an eye on it).
- `.agents/skills/reverse-engineer-anything/` added.
- `GATES.md` — new **G14 dark-mode verification gate** with recorded evidence.

---

## ⚠️ Notable Risks Before You Push

| Item | Detail |
|---|---|
| **9 unpushed commits** | All architecture work is disk-only. One bad disk event and it's gone. |
| **~3,700 lines uncommitted** | The entire dark-mode/avatar/weather batch has **no commit safety net** yet. |
| **New npm dependency** | `react-easy-crop` added — Cloudflare build needs the updated lockfile pushed together. |
| **Deleted assets referenced?** | `/user_face.png` was removed from `public/` — fallbacks now point at `/sabah_electricity_logo.png` (verified consistent), but any straggle reference will 404. |
| **Service worker cache v2.7** | Already bumped — returning users will pick up the new shell on next load. |

---

## Suggested Commit Split (if you want clean history)

1. `feat(theme): add system-wide dark mode engine with Light/System/Dark switcher` (theme module, index.css, index.html, sw.js, manifest, hex→var sweep)
2. `feat(profile): add avatar crop sheet with staged 512px upload flow` (AvatarCropSheet, cropImage, ProfilePage, bulletinService options, package.json)
3. `feat(hero): live KK weather, time-aware greeting, and compact TNB sparkline widget`
4. `feat(create): convert department & audience pickers to portal bottom sheets`
5. `fix(branding): swap user_face fallback to official SESB logo and delete dead assets`
6. `chore: add dark-mode plans, seed script, and agent skills`
