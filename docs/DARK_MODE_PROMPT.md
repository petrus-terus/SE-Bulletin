# Dark Mode — Structured Implementation Prompt

> **Hand this file to any agent.** It is self-contained: the executor needs zero prior context.
> **Status**: REVIEW v2 — corrected after external critique. **No code has been written yet.**
> **Entry point requested by stakeholder**: the theme switch lives inside `BrandSidebarDrawer` (the drawer that opens when the SE logo is pressed in the top app bar).
>
> **v2 changelog**: frosted-glass `rgba()` surfaces were entirely absent from v1 · token roles split after a white-on-light-green CTA failure was found · geometry restacked after overflow math · state mechanism corrected (hook → store) · file layout added (§3.8) · verification gate regex fixed (§7) · commit contradiction resolved (§6) · inline `.tsx` count corrected 40 → **138**.

## Decisions locked in

| # | Decision | Choice |
| --- | --- | --- |
| D1 | Hex migration scope | **Option B — semantic migration** (~700 edits, 18 files). Brand hexes (button backgrounds, gradients, logo colors) stay hardcoded. See §3.6. |
| D2 | Desktop entry point | **Matching `Appearance` control in `DesktopSidebar`** — shared theme store, no change to desktop brand-header navigation. See §4.1. |
| D3 | Implementation start | On hold pending this review (AGENTS.md §1.3 review gate). |
| D4 | Theme state mechanism | **Module store + `useSyncExternalStore`**, *not* a React Context — this codebase has zero Contexts and is 100% prop-drilled. See §3.8. |
| D5 | File layout | **Dedicated `client/src/theme/` module**; dark token overrides stay in `index.css` beside `:root`. See §3.8. |

---

## 1. Objective

Add a user-selectable **Light / System / Dark** theme to the SE Bulletin PWA, with the selector placed in the brand sidebar drawer, persisted across sessions, applied before first paint (no white flash on PWA cold start), and reaching WCAG AA+ contrast on every screen.

---

## 2. Verified codebase reconnaissance

All findings below were measured first-hand at their file:line. Do not re-derive them. **If you re-measure, see §2.4 first.**

### 2.1 What already exists (leverage this)

| Finding | Location | Why it matters |
| --- | --- | --- |
| A complete semantic token layer already exists in `:root` — surfaces, text, borders, alerts, shadows, radius, easing | `client/src/index.css:6-74` | Dark mode is a **token override problem**, not a rewrite. Only ~30 tokens need dark values. |
| `index.html` already ships dual `<meta name="theme-color">` + `<meta name="color-scheme" content="light dark">` | `client/index.html:7-9` | Someone anticipated dark mode. But the split meta tracks the **OS** only — see §4.3 for why it will ignore an in-app override. |
| Drawer is fully portal-rendered, ESC-closable, scroll-locked, reduced-motion aware | `BrandSidebarDrawer.tsx:24-47`, `.module.css:44-51` | The toggle inherits an already-correct a11y/motion shell. |
| Drawer has exactly 2 menu items + 1 divider + footer | `BrandSidebarDrawer.tsx:117-182` | Vertical room for a third section without crowding (§3.4). |
| Established `localStorage` persistence patterns | `App.tsx:37`, `bookmarkStorage.ts:5,22`, `notificationService.ts:102-116` | Follow the `sesb_*` key-naming convention. |

### 2.2 The blockers (this is the real scope)

| # | Finding | Evidence | Consequence |
| --- | --- | --- | --- |
| B1 | **903 hardcoded hex literals** across **33** `.module.css` files, vs **707** `var(--)` | measured across `client/src/**/*.module.css` | A `[data-theme="dark"]` block re-themes only what already uses tokens. **The rest stays light-on-light and becomes unreadable.** |
| B2 | **138 inline hex colors in `.tsx`** `style={{}}` | measured across `client/src/**/*.tsx` (all digit lengths) | CSS class rules cannot reach these. Must become `var(--…)` inline or move into classes. *v1 said "~40" — that was a truncated grep result read as a measurement (§2.4).* |
| B3 | **6 frosted-glass `rgba(255,255,255,·)` backgrounds** in app chrome | `TopAppBar.module.css:7` (0.88) · `BottomNav.module.css:7` (0.92) · `PostDetailView.module.css:30` (0.88) · `PostDetailView.module.css:530` (0.95) · `PwaInstallPrompt.module.css:14` (0.95) · `PilotGate.module.css:40` (0.98) | **Entirely invisible to a hex-only scan.** The top bar, bottom nav and sticky detail headers stay bright white glass floating over dark cards. Needs `--color-surface-glass` (§3.5). |
| B4 | **Light-toned surface gradients** | `FeedCard.module.css:110` `linear-gradient(180deg,#FFFDF8 0%,#FFFFFF 64px)` · `CeoWisdomSection.module.css:34` `linear-gradient(145deg,#FFFFFF 0%,#F8FAFC 100%)` | Pinned bulletins and the CEO Wisdom card render as stark white cards on the dark feed. Exempt from "leave gradients alone" (§3.6). |
| B5 | **Token role inversion risk** — `--color-primary` / `--color-primary-container` / `--color-forest-green` are used as **both** text **and** solid button backgrounds | `background` + `color:#FFFFFF`: `CreateBulletinPage.module.css:93` `.publishBtn`, `PostDetailView.module.css:474` `.avatarFallback`. Text-only sites: `TopAppBar.module.css:58`, `DesktopSidebar.module.css:34`, `CommentDrawer.module.css:165`, `BottomNav.module.css:56,61`, `FeedCard.module.css:412`, `InteractivePollCard.module.css:22` … | Naively lightening these tokens to fix *text* contrast turns the primary **Publish CTA** white-on-`#34D399` = **1.92:1** and avatar initials white-on-`#60A5FA` = **2.5:1**. Both hard-fail AGENTS.md §2.2. **Roles must be split (§3.5).** |
| B6 | **No `color-scheme` CSS property anywhere in `client/src`** | grep → 0 hits | Native scrollbars, `<input>`/`<textarea>` internals, caret and selection won't invert → white artifacts on dark. |
| B7 | **Zero React Context in the entire app** | `createContext`/`useContext`/`useSyncExternalStore` → 0 hits; `App.tsx` (547 lines) prop-drills everything | A `ThemeProvider` would introduce a brand-new global pattern via a styling feature. See D4 / §3.8. |
| B8 | **`TopAppBar` is `display: none` at `≥1024px`** | `TopAppBar.module.css:15-19`; `DesktopSidebar.tsx:25-44` brand header only navigates home | **Desktop users cannot open the drawer at all** → a drawer-only switch doesn't exist on desktop. See §4.1. |
| B9 | SW precaches `/index.html` as `CACHE_NAME = 'sesb-bulletin-v2'` | `client/public/sw.js:2,5` | Editing `index.html` requires a cache bump or returning users get a stale shell. |
| B10 | Custom scrollbar styles hardcoded light | `index.css:144-156` | Needs a dark variant. |

### 2.3 Color frequency (drives the migration strategy)

Hardcoded hex across all `.module.css`:

```
154  #FFFFFF    78  #0055A4    76  #64748B    68  #1E293B    52  #F8FAFC
 46  #E2E8F0    46  #F1F5F9    33  #94A3B8    32  #E8EDF2    31  #CBD5E1
 21  #0F172A    18  #EFF6FF    18  #334155    17  #475569    15  #DBEAFE
 14  #1A7A5A    13  #10B981    12  #DC2626    11  #FEE2E2    11  #0B0F17
```

**≈ 680 of 903 (75%)** fall into the semantic set above — highly concentrated, so a mechanical migration is realistic.

Highest-impact files: `ProfilePage` 154 · `CreateBulletinPage` 108 · `FeedCard` 63 · `KinabaluSkylineHero` 56 · `PostDetailView` 51 · `NotificationsView` 46 · `LoginPage` 46 · `SearchDirectoryPage` 40 · `BrandSidebarDrawer` 40 · `AchievementsDeck` 36.

Also measured: **239 `rgb()`/`rgba()`** and **22 `linear-gradient()`** across `.module.css` — the two families a hex scan cannot see.

### 2.4 Measurement caveats — read before re-measuring anything

Two process failures produced errors in v1. They are recorded so they are not repeated:

1. **A truncated tool result was read as a measurement.** The v1 inline-`.tsx` count came from a grep run at `limit: 40`, which returned `Found 40 matches` + `truncated`. That was written into the plan as "~40+". The true count is **138**. *When a search reports truncation, re-run it without a limit before quoting the number.*
2. **The scan pattern encoded the assumption.** v1 scanned `#[0-9A-Fa-f]{6}`, which structurally cannot match `rgba(255,255,255,0.88)` or the hex inside a `linear-gradient()`. The verification gate would therefore have **certified the frosted-glass bug as clean**. Always scan `rgba?\(|hsl\(|#[0-9A-Fa-f]{3,8}` (now §7).

A missing token is a bug. A detector that cannot see the bug is how it ships.

---

## 3. Specification

### 3.1 Theme model — three states, not two

```
type ThemePreference = 'light' | 'system' | 'dark';   // default: 'system'
```

- `localStorage['sesb_theme']` holds the *preference*.
- JS resolves preference → *effective* theme and writes `document.documentElement.dataset.theme = 'light' | 'dark'`.
- When preference is `system`, a `matchMedia('(prefers-color-scheme: dark)')` listener keeps the effective theme live-synced with the OS.

**Why three states**: `index.html` already declares OS-aware `theme-color`. A binary toggle that ignores the OS is the most common dark-mode complaint, and "follow my phone" is what staff expect on a corporate PWA.

### 3.2 Theme resolution — pre-paint, zero flash

Add a **blocking inline script in `<head>` of `client/index.html`**, before the module entry, that:

1. Reads `localStorage['sesb_theme']` (default `'system'`).
2. Resolves against `matchMedia('(prefers-color-scheme: dark)')`.
3. Sets `document.documentElement.dataset.theme`.
4. Writes the single managed `<meta id="app-theme-color">` (§4.3 — **do not append a second tag**).
5. Sets `document.documentElement.style.colorScheme`.

This must be synchronous and inline — a React effect fires after first paint and visibly flashes white. This is a PWA with a service worker; cold-start flash is the most visible defect of a naive implementation.

### 3.3 CSS mechanism — single override block

Because JS always resolves to a concrete `data-theme`, **only one override block is needed**:

```css
:root {
  color-scheme: light;
  /* existing tokens, unchanged — index.css:6-74 */
}

:root[data-theme='dark'] {
  color-scheme: dark;
  /* dark overrides — §3.5 */
}
```

**Rules:**
- Do NOT touch the light `:root` token values (light theme must stay pixel-identical).
- Do NOT introduce a `@media (prefers-color-scheme: dark)` block — JS owns resolution; two sources of truth drift.
- Every dark override must reuse an existing token name. New tokens only where §3.5 adds them.

### 3.4 The switch — `BrandSidebarDrawer`

**Placement**: a new section between the *Saved Posts* item (`BrandSidebarDrawer.tsx:119-146`) and the divider before *Log Out* (`:148`):

```
[ User identity card ]
  Saved Posts
  ──────────────── divider
  Appearance              ← NEW (stacked: header row, then full-width pill)
  ──────────────── divider
  Log Out
[ footer ]
```

**Control**: a **3-segment pill** (`Light · System · Dark`), *not* a binary switch — it must express three states.

#### Geometry — STACKED, not inline (overflow is guaranteed otherwise)

Measured container widths:

| Surface | Container | Padding | **Usable width** |
| --- | --- | --- | --- |
| `BrandSidebarDrawer` | `min(320px, 86vw)` (`.module.css:24`) | `16px` left + `16px` right | **288px** @393vp · **277px** @360vp |
| `DesktopSidebar` | `240px` (`AppShell.module.css:22`) | `12px 8px` (`DesktopSidebar.module.css:5`) | **224px** |

A single row needs `36 icon + 12 gap + ~90 label + 24 gaps + 3×44 segments = ~282px+` → **overflows both surfaces**, forcing either clipping, truncation, or sub-44px segments (AGENTS.md §2.5 hard requirement).

**Required layout — two stacked rows:**

```
┌──────────────────────────────────────┐
│ [icon] Appearance                   │   ← header row, .menuItem geometry
│        Light, dark or match device   │      min-height 52px, radius 12px
├──────────────────────────────────────┤
│ ┌────────┬─────────┬────────────┐    │
│ │ ☀ Light│ ◐ System│ ☾ Dark     │    │   ← full-width pill, 100%
│ └────────┴─────────┴────────────┘    │      segments ~74–94px wide each
└──────────────────────────────────────┘      40–44px tall (icon + 12px label)
```

- Header row: reuse `.menuItem` — `min-height: 52px`, `border-radius: 12px`, `1px` border, `padding: 10px 14px`. Leading icon Material Symbols `light_mode`/`brightness_auto`/`dark_mode`, `20px`, in the standard 36×36 `.menuIconWrap`.
- Label `Appearance` 13px/700 (`.menuItemLabel`). Sub-label `Light, dark or match device` **12px** — 12px floor, never 10/11px (AGENTS.md §2.4).
- Pill spans `width: 100%` of the padded container; `display: grid; grid-template-columns: repeat(3, 1fr)` so segments are equal without hand-computed widths.
- Segment height **44px**; each holds a `16px` icon + `12px` label, stacked or inline. At 224px usable → 74px/segment; at 288px → 94px/segment. Both comfortably fit `icon + "System"`.
- Active segment: `--color-primary-container` background + `#FFFFFF` text; inactive transparent + `--color-text-muted`.

**Motion (AGENTS.md §2.5, `emil-design-eng` + `animate`):**
- Active-segment indicator moves via **`transform: translateX()` only** — never `left`, `width`, `margin`. With `grid-template-columns: repeat(3,1fr)` the indicator is a 33.333%-wide absolutely-positioned child translated by `0 / 100% / 200%`.
- Duration **180–240ms**, `cubic-bezier(0.16, 1, 0.3, 1)` (`var(--ease-expo)`).
- Row press feedback: `:active { transform: scale(0.98) }`, 120ms.
- `@media (prefers-reduced-motion: reduce)` → indicator switches instantly.
- Hover gated behind `@media (hover: hover) and (pointer: fine)`.
- `-webkit-tap-highlight-color: transparent` + `touch-action: manipulation` on all three segments.
- **Do not close the drawer on selection** — the user must see the result and compare segments. Only `Log Out`/`Saved Posts` auto-close.

**Theme-switch transition**: apply a temporary `theme-transitioning` class on `<html>` for ~240ms enabling `transition: background-color, color, border-color`, then remove it. Without it the flip is jarring; with a *permanent* global transition every hover in the app goes sluggish. Never transition layout properties.

**A11y**: `role="radiogroup"` with `role="radio" aria-checked` segments (or a visually-hidden radio `fieldset`). Arrow-key navigation recommended. Visible `:focus-visible` ring via `--color-border-focus`.

### 3.5 Dark palette — with **split token roles**

Elevation on dark uses **borders + lighter surfaces**, never darker shadows (shadows don't read on dark).

#### 3.5.1 New tokens (add to light `:root` too, then override)

v1 lightened `--color-primary` and `--color-forest-green` in place. That is **wrong** — both are used as solid backgrounds carrying `#FFFFFF` text (B5). Split instead:

| Token | Light default | Dark value | Purpose |
| --- | --- | --- | --- |
| `--color-primary` | `#003E7A` | **unchanged** | backgrounds / solid fills |
| `--color-primary-container` | `#0055A4` | **unchanged** | button + active-pill background, `#FFFFFF` text = 7.2:1 |
| `--color-primary-text` | `#0055A4` | **`#60A5FA`** | **NEW** — links, icons, active labels on dark (6.8:1 on `#151C2B`) |
| `--color-forest-green` | `#1A7A5A` | **unchanged** | solid button background, `#FFFFFF` text = 5.3:1 |
| `--color-forest-text` | `#1A7A5A` | **`#34D399`** | **NEW** — green text/icons on dark (8.9:1 on `#151C2B`) |
| `--color-surface-glass` | `rgba(255,255,255,0.88)` | **`rgba(15,23,42,0.85)`** | **NEW** — frosted chrome (B3) |

**Migration rule for the split**: every site whose property is `color:` / `fill:` / `caret-color` and reads `var(--color-primary)` or `var(--color-forest-green)` → switch to the `-text` variant. Sites using `background:` / `background-color:` keep the base token. `border-color:` sites → `-text` variant (a `#0055A4` hairline on `#0B0F17` is ~2.7:1 and effectively invisible).

Complete measured baseline (re-verified; exclude `--color-primary-container|hover|light|text` variants):

**A. `color:` → swap to `-text` (15 sites, 15 edits)**
`CreateBulletinPage:1127` · `CommentDrawer:165` · `PostDetailView:358,363,367` · `DesktopSidebar:34` · `DesktopWidgetsRail:48,105` · `TopAppBar:58` · `FeedCard:412,482` · `InteractivePollCard:22` · `QuoteBulletinModal:260` · `ReshareBottomSheet:115` · `index.css:104`
> `index.css:104` is `::selection` — swap it **and** add the dark `::selection` rule (§3.7), since it pairs with a light-blue selection background.

**B. `border-color:` → swap to `-text` (5 sites, 5 edits)** — a `#0055A4` hairline on `#0B0F17` is ~2.7:1 and effectively invisible.
`CreateBulletinPage:1069,1096,1136` · `InteractivePollCard:58,80`

**C. `background:` → LEAVE ON BASE TOKEN (6 sites, 0 edits)**
`CreateBulletinPage:80,93` (`.publishBtn`) · `PostDetailView:474` (`.avatarFallback`) · `EmojiReactionDock:79` · `QuoteBulletinModal:95` · `ErrorBoundary:75`

**D. `.tsx` inline** — `FeedCard.tsx:449` `color: 'var(--color-primary)'` → `'var(--color-primary-text)'` (part of the 138 in B2).

**Total role-split scope: 21 edits across 11 files.** Gate: after migration, groups A+B must be empty and group C must be unchanged — verify with the script in §7.

#### 3.5.2 Dark override block

```css
:root[data-theme='dark'] {
  color-scheme: dark;

  /* Surfaces — never pure #000; slate so layers can step up */
  --color-surface-base:  #0B0F17;   /* canvas */
  --color-surface-card:  #151C2B;   /* card / modal */
  --color-surface-alt:   #1E293B;   /* chips, alt rows */
  --color-surface-hover: #243044;
  --color-surface-glass: rgba(15, 23, 42, 0.85);   /* frosted chrome, B3 */
  --color-border-subtle: #263244;
  --color-border-focus:  #60A5FA;   /* defined ONCE */

  /* Text — ratios measured against the card surface #151C2B */
  --color-text-main: #F1F5F9;   /* 15.7:1 */
  --color-text-body: #CBD5E1;   /* 11.6:1 */
  --color-text-muted: #94A3B8;   /*  6.7:1 */

  /* Brand — backgrounds UNCHANGED, only the -text variants lighten */
  --color-primary:          #003E7A;   /* unchanged */
  --color-primary-container:#0055A4;   /* unchanged — white text 7.2:1 */
  --color-primary-text:     #60A5FA;   /* NEW — 6.8:1 on card */
  --color-primary-hover:    #0B4A8F;
  --color-primary-light:    #12263F;   /* was #EBF3FB tint */

  --color-forest-green:     #1A7A5A;   /* unchanged — white text 5.3:1 */
  --color-forest-text:      #34D399;   /* NEW — 8.9:1 on card */
  --color-forest-hover:     #146348;
  --color-forest-light:     #0F2A22;   /* was #E6F5EF tint */

  /* Accent CTA — UNCHANGED: #10B981 + #0B0F17 ink = 10.8:1 in both themes */
  --color-accent-green: #10B981;
  --color-dark-ink:     #0B0F17;

  /* Semantic alerts must lighten to read on dark */
  --color-safety-orange:    #FBBF24;   /* was #D97706 */
  --color-safety-orange-bg: #3A2A0B;
  --color-alert-red:        #F87171;   /* was #BA1A1A */
  --color-alert-red-bg:     #3B1416;

  /* Elevation: pair every shadow with a border */
  --shadow-card:          0 1px 2px rgba(0,0,0,0.4);
  --shadow-card-elevated: 0 4px 16px rgba(0,0,0,0.5);
  --shadow-popover:       0 12px 32px rgba(0,0,0,0.6);
  --shadow-fab:           0 8px 20px -3px rgba(16,185,129,0.32), 0 4px 8px -2px rgba(16,185,129,0.18);

  /* ALWAYS-white / theme-gated tokens */
  --surface-logo-badge: #FFFFFF;   /* never darkens — §4.8 */
  --image-dim: 0.92;               /* light default is 1 — §4.7 */
}
```

**Hard contrast rules (AGENTS.md §2.2 — gates, not suggestions):**
- ❌ Never white text on `#10B981` (2.5:1).
- ❌ Never white text on `--color-forest-text` (`#34D399` = **1.9:1**) or `--color-primary-text` (`#60A5FA` = **2.5:1**).
- ✅ `#10B981` surfaces carry `#0B0F17` ink → 10.8:1 in **both** themes.
- ✅ Body ≥ 4.5:1, large text ≥ 3:1, AAA (7:1) for primary reading copy.
- ✅ Keep the **12px font floor** — never shrink text to fit dark layouts.

### 3.6 Migration strategy (the bulk of the work)

**Option A — full token migration of all 903 hex → NOT CHOSEN** (~33 files, ~940 edits, high regression risk).

**Option B — semantic migration, brand hexes untouched → DECIDED (D1)**
Migrate the ~680 semantic occurrences (§2.3) to tokens; leave brand hexes (`#0055A4` as button bg, `#1A7A5A` as button bg, SESB/TNB/SESI logo colors, story gradients) hardcoded — correct in both themes.
- ~18 files, ~700 edits, mechanical, verifiable by grep.
- File order (highest hex count first): `ProfilePage` → `CreateBulletinPage` → `FeedCard` → `PostDetailView` → `NotificationsView` → `LoginPage` → `SearchDirectoryPage` → `BrandSidebarDrawer` → `AchievementsDeck` → `PwaInstallPrompt` → `SavedPostsDrawer` → `PilotGate` → `QuoteBulletinModal` → `CreateStoryModal` → `CeoWisdomSection` → `InteractivePollCard` → remaining.
- Run `build` + `lint` after each file. **Do not commit per file** — see §6.

**Five disambiguation rules (all must be applied):**

1. `#FFFFFF` as a **page/card/modal/drawer background** → `var(--color-surface-card)`.
2. `#FFFFFF` as a **logo badge surface, avatar ring, or text-on-color** → leave hardcoded white (§4.8).
3. `#FFFFFF` as **text on a colored button/badge** → leave hardcoded white.
4. **Gradients**: only *surface-tinted* gradients move. `FeedCard.module.css:110` and `CeoWisdomSection.module.css:34` → dark slate equivalents (`linear-gradient(180deg, #1E293B 0%, #151C2B 64px)` / `linear-gradient(145deg, #151C2B 0%, #1E293B 100%)`). **Do not touch** `KinabaluSkylineHero.module.css:17` — that is `.themeDay`, which already ships `.themeDusk`/`.themeNight`; slating it destroys working variants. **Do not touch** `AchievementsDeck.module.css:127` — gold achievement badge, brand.
5. **`rgba()`**: only the **6 frosted backgrounds in B3** become `var(--color-surface-glass)`. The other **38** white `rgba()` occurrences are white text/hairlines/borders on already-dark or brand surfaces and **must stay** (§3.7).

**Frosted-glass mapping:**

| Site | Becomes |
| --- | --- |
| `TopAppBar.module.css:7` `rgba(255,255,255,0.88)` | `var(--color-surface-glass)` |
| `BottomNav.module.css:7` `rgba(255,255,255,0.92)` | `var(--color-surface-glass)` |
| `PostDetailView.module.css:30` `rgba(255,255,255,0.88)` | `var(--color-surface-glass)` |
| `PostDetailView.module.css:530` `rgba(255,255,255,0.95)` | `var(--color-surface-glass)` |
| `PwaInstallPrompt.module.css:14` `rgba(255,255,255,0.95)` | `var(--color-surface-glass)` |
| `PilotGate.module.css:40` `rgba(255,255,255,0.98)` | `var(--color-surface-glass)` |

**Inline `.tsx` hex**: **138 occurrences** across `.tsx` (B2). Convert semantic ones (e.g. `color: '#0055A4'` → `'var(--color-primary-text)'`, `'#64748B'` → `'var(--color-text-muted)'`). Spinners in `App.tsx:29`, `TabRouter.tsx:27`, `OverlayHost.tsx:28` → `var(--color-border-subtle)` + `var(--color-primary-container)`.

### 3.7 Do-not-theme allowlist (the mirror-image failure)

Theming these would break working surfaces — the same error as leaving chrome white, in reverse. White `rgba()` on dark/brand surfaces is **correct**:

| File | Count | Why it's already right |
| --- | --- | --- |
| `StoryViewerModal.module.css` | 3 | Surface is `rgba(0,0,0,0.92)` / `#0B0F17` — white is scrim + text |
| `ImageViewerModal.module.css` | 4 | Surface is `rgba(5,8,15,0.96)` — white is controls/hairlines |
| `CreateStoryModal.module.css` | 9 | Surfaces `rgba(11,15,23,0.85)` / `#0B0F17` — white is text/borders |
| `SesiKnowledgeHubBanner.module.css` | 6 | Brand gradient `#0055A4 → #1A7A5A`; white at 0.06–0.15 alpha is decorative overlay |
| `KinabaluSkylineHero.module.css` | 8 | Self-contained `.themeDay`/`themeDusk`/`themeNight` — verify legibility only |
| `LoginPage.module.css:73`, `ProfilePage.module.css:54,1178,1442` | 4 | Borders over cover imagery |

Other non-obvious surfaces:

| Surface | Handling |
| --- | --- |
| `CreateStoryModal` canvas export writes `#FFFFFF` | Export-only pixels, not UI. **Do not theme.** |
| Custom scrollbars `index.css:144-156` | Add `[data-theme='dark']` variants (`#263244` track, `#475569` thumb). |
| `::selection` `index.css:102-105` | Add dark variant. |
| `PwaInstallPrompt`, `Toast` | Confirm they sit above themed surfaces and shadows read on dark. |
| Skeleton / empty / error states | Theme explicitly — the most commonly forgotten states. |

### 3.8 File layout & state mechanism

**Dark mode is not a `features/` entry.** `features/` holds route-able views (`auth`, `feed`, `post`, `profile`, `create`, `stories`, `notifications`, `directory`). Theme has no route and no `TabKey`. Give it a dedicated module:

```
client/src/theme/
  themeStore.ts          # singleton + useSyncExternalStore  (D4)
  useTheme.ts            # thin consumer hook → { preference, effectiveTheme, setPreference }
  ThemeSwitcher.tsx      # stacked header row + 3-segment pill (§3.4)
  ThemeSwitcher.module.css
  themeStorage.ts        # localStorage read/write, `sesb_theme` key
                         #   mirrors services/bookmarkStorage.ts

client/src/index.css     # :root light tokens  +  :root[data-theme='dark']
                         #   → KEEP TOGETHER. Do not split dark tokens into a
                         #     separate file: nobody compares them side by side.
client/index.html        # pre-paint script + single <meta id="app-theme-color">
client/public/sw.js      # CACHE_NAME bump
```

Deliberate exceptions:
- **Dark tokens stay in `index.css`** next to the light `:root`. One token home, light and dark visible together.
- **The migration isn't a file you create** — it's ~700 edits *to* 18 existing files. It cannot be siloed, and hiding it in a new folder would misrepresent the scope.

**State mechanism — D4: singleton store + `useSyncExternalStore`, not a Context.**

The app has **zero** `createContext`/`useContext` (B7) and prop-drills everything from `App.tsx`. A `ThemeProvider` would make a styling feature the origin of a new global pattern, and v1's "mount the hook once at `main.tsx`" was simply wrong — a hook cannot be mounted; and calling `useTheme()` independently in two components with `useState` gives two disconnected instances where toggling in the desktop sidebar doesn't update the drawer.

```ts
// client/src/theme/themeStore.ts
let state = { preference: 'system', effectiveTheme: 'light' };
const listeners = new Set<() => void>();

export function setPreference(p: ThemePreference) { /* resolve, persist, notify */ }
export function getSnapshot() { return state; }          // MUST be referentially stable
export function subscribe(fn: () => void) { /* … */ }

export function useTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
```

- `useTheme()` in `BrandSidebarDrawer` and `DesktopSidebar` reads the **same** singleton → no Provider, no drilling, both update together.
- Cross-tab `storage` events and `matchMedia` subscription fall out naturally.
- The pre-paint script owns first paint; the store hydrates from `document.documentElement.dataset.theme`.

⚠️ **`getSnapshot` must return a cached, referentially stable object.** Returning a fresh `{...}` each call makes React re-render infinitely. Memoize/freeze; recreate the object only when state actually changes.

**Where the switch renders**: `<ThemeSwitcher />` inside `BrandSidebarDrawer.tsx` (replacing the planned inline markup) and again in `DesktopSidebar.tsx` footer — one component, two mounts, one store.

---

## 4. Recommendations (beyond the request)

Items 1–5 are **required** for shippable rather than demo-grade.

1. **🖥️ Desktop entry point — DECIDED (D2).** `TopAppBar` is `display:none` at `≥1024px` (`TopAppBar.module.css:15-19`) and `DesktopSidebar`'s brand header only navigates home (`DesktopSidebar.tsx:25-44`). Mount the same `<ThemeSwitcher />` in `DesktopSidebar`'s footer, sharing the store. Do **not** change desktop brand-header navigation.

2. **No-flash pre-paint script (§3.2).** Non-negotiable for a PWA — white flash on every dark cold start is the #1 visible defect.

3. **Dynamic `<meta name="theme-color">` — replace, don't append.** The browser uses the **first tag whose media query matches, in document order**. `index.html:7-8` has two media-qualified tags; an unconditioned tag *appended* by JS lands after them, so the OS-light tag still wins and the Android/PWA status bar stays `#F5F7FA`. **Fix**: collapse to a single `<meta name="theme-color" id="app-theme-color">` with **no `media` attribute**, and have both the pre-paint script and the store write its `content`. Remove the two existing tags.

4. **`color-scheme` CSS property (§3.3).** Without it, native scrollbars, input chrome, caret and selection stay light on a dark page.

5. **Three states with `System` default (§3.1)** + live `matchMedia` listening + `storage`-event cross-tab sync.

6. **Executable `GATES.md` entry `G14`.** `node -e` checks: (a) `index.css` contains the `data-theme='dark'` block; (b) `ThemeSwitcher` is referenced from **both** `BrandSidebarDrawer` and `DesktopSidebar` (reachability at ≥1024px); (c) `index.html` has exactly **one** `theme-color` meta and no `media` attribute; (d) build+lint pass; (e) `impeccable.cmd detect` → zero defects.

7. **Optional image dimming.** Feed photos on `#0B0F17` can look harsh: `filter: brightness(var(--image-dim)) saturate(0.95)` on feed images only, `1 → 0.92`, dark-gated, **never** on logos, charts, or poll graphics.

8. **Brand-asset fidelity guard.** SESB/TNB/SESI logos need **white badge surfaces** (AGENTS.md). `--surface-logo-badge: #FFFFFF` stays white in dark, else `sabah_electricity_logo.png` / `tnb_logo.png` / `sesi_logo.png` vanish into the canvas. Most likely "looks broken" regression.

9. **Elevation semantics.** On dark, add `1px var(--color-border-subtle)` to every card/modal/drawer that currently relies on shadow alone — state it explicitly so the executor doesn't just copy shadow tokens across.

10. **Out of scope — defer:** Supabase `profiles` theme sync (Phase 2); time-of-day auto-dimming; a third toggle in `BottomNav`.

---

## 5. Steps

1. **Read first** (AGENTS.md §1.1 — from memory is prohibited):
   `.agents/skills/design-taste-frontend/SKILL.md`, `high-end-visual-design/SKILL.md`, `emil-design-eng/SKILL.md`, `animate/SKILL.md`, `mobile-native/SKILL.md`, `impeccable/SKILL.md`.
2. **Add tokens** to `index.css`: the three new tokens (`--color-primary-text`, `--color-forest-text`, `--color-surface-glass`) in light `:root`, then the §3.5.2 dark block. Do not alter existing light values.
3. **Pre-paint script + single managed meta** in `client/index.html` (remove the two media-qualified tags); bump `CACHE_NAME` in `client/public/sw.js`.
4. **Build `client/src/theme/`** per §3.8: `themeStore.ts` (stable `getSnapshot`), `themeStorage.ts`, `useTheme.ts`.
5. **Build `ThemeSwitcher.tsx` + `.module.css`** — stacked layout, §3.4.
6. **Mount it twice**: in `BrandSidebarDrawer.tsx` (new section before the Log Out divider) and in `DesktopSidebar.tsx` footer (D2).
7. **Apply the role split (§3.5.1)** — swap `color:`/`fill:`/`caret-color` sites to `-text` tokens; leave `background:` sites alone.
8. **Migrate hex → tokens** per §3.6 rules 1–3, file order as listed, `build` + `lint` after each file.
9. **Migrate the 6 frosted-glass backgrounds** (§3.6 rule 5) and the 2 surface gradients (rule 4).
10. **Convert the 138 inline `.tsx` hexes** (B2) — semantic ones only.
11. **Apply the do-not-theme allowlist** (§3.7) — verify these were *not* touched.
12. **Theme the remaining non-obvious surfaces** (§3.7 table).
13. **Add the theme-transition guard** (§3.4).

---

## 6. Boundaries (do not do these)

- Do not change any existing light `:root` token value — light theme must stay pixel-identical.
- Do not lighten `--color-primary`, `--color-primary-container` or `--color-forest-green` in place — use the `-text` variants (§3.5.1). Doing so breaks the Publish CTA and avatar initials.
- Do not add a `@media (prefers-color-scheme: dark)` block (JS owns resolution).
- Do not append a second `<meta name="theme-color">` — replace with the single managed tag (§4.3).
- Do not introduce a React Context for theme (D4) — this codebase has none.
- Do not theme anything on the §3.7 allowlist, logo badges, exported story images, or brand gradients.
- Do not animate layout properties (`height`, `width`, `top`, `margin`, `left`) for the toggle or the theme flip — `transform` and `opacity` only.
- Do not add `_redirects` (AGENTS.md §2.8 — breaks the Cloudflare Workers deploy).
- Do not push to remote. **Local commits**: batching by file within one task session is fine *if* the user has pre-approved committing for this task; otherwise stage and leave uncommitted, and ask before the first `git commit`. Never push.
- Do not use `text-[10px]`/`text-[11px]`, and do not put white text on `#10B981`.

> *v1 contradiction resolved:* `one file per commit` (old §5.7) conflicted with `do not commit unless explicitly instructed` (AGENTS.md §2.8). Committing policy now lives **only** in this section.

---

## 7. Verification (all must pass before "done")

- **Mechanical**: `cd client; npm run build; npm run lint` → 0 errors.
- **Defect scan**: `cmd /c ".\.agents\skills\impeccable\scripts\impeccable.cmd detect --json client\src"` → zero defects.
- **Migration proof (fixed regex — v1 was hex-only, §2.4):**
  ```
  rg -n "rgba?\(|hsl\(|#[0-9A-Fa-f]{3,8}" client/src --glob "*.module.css"
  ```
  Result must contain **only**: brand/gradient/logo-badge colors, the 38 allowlisted white `rgba()` (§3.7), and dark-surface values. **Zero** semantic light-surface hex, and **zero** of the 6 frosted backgrounds left as `rgba(255,255,255,·)`.
- **Role-split proof (21 edits; A+B empty, C unchanged).** ⚠️ **Do not use a one-line `rg` for this** — the obvious patterns fail two ways: `Select-String -Path "src\**\*.css"` only descends **one** directory level (silently missing `features/post/*`, `features/create/*`), and `var\(--color-primary\)` rejects every `var(--color-primary, #0055A4)` fallback usage. Both were real bugs in this document's earlier draft. Use the recursive classifier:
  ```powershell
  $files = Get-ChildItem "client\src" -Recurse -Include "*.css","*.tsx" -File
  $A=@(); $B=@(); $C=@()
  foreach ($f in $files) { $ln=0; Get-Content $f.FullName | ForEach-Object {
    $ln++; $line=$_
    if ($line -notmatch 'var\(--color-(primary|forest-green)') { return }
    if ($line -match 'var\(--color-primary-(container|hover|light|text)') { return }
    if ($line -match 'var\(--color-forest-(green|text)-(hover|light)') { return }
    if     ($line -match '(?<![\w-])color\s*:\s*var\(--color-(primary|forest-green)(\s*,[^)]*)?\)') { $A+=,@($f.Name,$ln) }
    elseif ($line -match 'border(?:-color)?\s*:[^;]*var\(--color-(primary|forest-green)(\s*,[^)]*)?\)') { $C+=,@($f.Name,$ln) }
    elseif ($line -match 'background(?:-color)?\s*:[^;]*var\(--color-(primary|forest-green)(\s*,[^)]*)?\)') { $B+=,@($f.Name,$ln) }
  } }
  "A text (must be 0): $($A.Count)";  $A
  "C border (must be 0): $($C.Count)"; $C
  "B background (must stay 6): $($B.Count)"; $B
  ```
  **Pass when** `A = 0`, `C = 0`, `B = 6`. Pre-migration baseline: **A=15, C=5, B=6.**
- **Light-theme regression**: `git diff` shows no change to any light `:root` value; light-mode screenshots before/after pixel-identical.
- **No-flash**: hard-reload with preference = Dark and OS = Light → no white frame.
- **Browser subagent, mobile 393×852**: open drawer → toggle Light/System/Dark → verify feed, cards, drawer, bottom nav, comment drawer, story viewer, image viewer, create bulletin, profile, notifications, empty states, skeletons, error states in **both** themes. Capture screenshots.
- **Browser subagent, desktop ≥1024px**: switch reachable via `DesktopSidebar` (D2); `DesktopSidebar`/`DesktopWidgetsRail` themed; `TopAppBar` absent.
- **Contrast spot-check**: `--color-text-body` on `--color-surface-card` ≥ 4.5:1; white on `--color-primary-container` ≥ 4.5:1; white on `--color-forest-green` ≥ 4.5:1; `#10B981` pills carry `#0B0F17` ink.
- **Persistence**: select Dark → hard reload → still Dark; two tabs → toggle in one → both update.
- **Reduced motion**: `prefers-reduced-motion: reduce` → indicator snaps, no theme-transition animation.
- **Touch**: every segment ≥44×44px; `-webkit-tap-highlight-color: transparent`; no sticky hover on touch.
- **PWA**: standalone display-mode status bar matches the selected theme (single managed meta).
- **Overflow**: at **360px** viewport the pill fits with no horizontal scroll and no clipped labels (§3.4 widths: 277px usable).
- **Done when**: every check has recorded evidence, appended to `GATES.md` as `G14`.
