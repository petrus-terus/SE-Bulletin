# UI & Craft Engineering Rules

> **Scope**: Triggered whenever creating or editing UI components, CSS modules, design tokens, layout styling, or animations in `client/src/ui/`, `client/src/shared/`, `client/src/features/`, or `client/src/theme/`.

---

## 1. Zero "UI Slop" & Clean Design
- Maintain generous **16–20px spacing** between feed posts and **12px rounded card corners (`rounded-xl`)**.
- Eliminate visual noise: do not add redundant badges, jarring colored boxes, or messy metadata rows.
- Keep cards, headers, and navigation clean, modern, and uncluttered.
- **Feed Card Image Fallbacks**: All dynamic or external `<img>` elements in feed cards and user avatars MUST implement `onError` fallback handlers and empty `alt=""` tags (or fallback containers) to prevent broken image icons, text overflow, and layout overlap.
- **CSS Selector Class Parity & Avatar Dimensions**: Always ensure avatar image classes (e.g. `.authorAvatar`) have strict width, height (e.g. 40–44px), `flex-shrink: 0`, and `object-fit: cover` to prevent high-res corporate logos from blowing out mobile viewports.
- **1:1 Authentic Brand Asset Fidelity**: Never substitute generic placeholder icons (e.g., generic lightning bolts, stock symbols) when authentic corporate parent/subsidiary branding exists (e.g., Tenaga Nasional Berhad / SESB). Always use 1:1 official vector/cropped brand assets inside designated high-contrast white badge surfaces with `onError` fallbacks.

---

## 2. Contrast Rules (Strict WCAG AAA)
- **NEVER use white text on emerald / bright green (`#10B981`)** — contrast ratio is only 2.54:1 (fails accessibility).
- **ALWAYS use dark ink text (`#0B0F17` / `text-slate-950`) on emerald/green buttons & pills** to achieve an authoritative **10.8:1 WCAG AAA** contrast ratio.
- Primary buttons should use Deep Blue (`#0055A4`) with white text, or Forest Green (`#1A7A5A`) with white text. Reserve bright green (`#10B981`) for floating "+" CTAs and active indicators with dark text.

---

## 3. Typography & Instrumentation Floor
- **Strict floor of 12px (`text-xs` / `text-[12px]`)**: NEVER use micro-text (`text-[10px]` or `text-[11px]`) on any metadata, badges, or timestamps.
- **Always apply `font-mono tabular-nums`** to:
  - Like counts, comment counts, and share counts
  - 24-hour Story countdown timers
  - Post timestamps (e.g. `2h ago`, `14:32`)
  - Employee IDs (e.g. `SESB-1001`, `EMP123`)
  - Phone extension numbers
  *(This prevents horizontal layout jitter during real-time counter updates).*

---

## 4. Animation & Motion Choreography (`emil-design-eng` + `animate`)
- **Strict Property Isolation**: Only animate `transform` and `opacity`. NEVER animate layout geometry (`height`, `width`, `top`, `margin`) to prevent layout thrashing and frame drops.
- **Zero Ease-In on Entry**: Never use `ease-in` on entering UI; always use exponential ease-out `cubic-bezier(0.16, 1, 0.3, 1)` or physical spring parameters.
- **Duration Budget**: 150–250ms for micro-interactions; 300–400ms for modal sheets/drawers.
- **Tactile Compression**: Active scale compression (`transform: scale(0.98)` / `active:scale-[0.98]`) on all interactive buttons, filter pills, and bottom tabs.
- **Mandatory Reduced Motion**:
  - Every CSS keyframe animation or continuous pulse MUST include `@media (prefers-reduced-motion: reduce) { animation: none; transform: none; }`.
- **Sticky Hover Gating**:
  - Every interactive hover transition on cards or buttons MUST be gated inside `@media (hover: hover) and (pointer: fine)` to prevent stuck hover states on mobile touchscreens.

---

## 5. Mobile-Native Touch Ergonomics (`mobile-native`)
- `touch-action: manipulation;` on all interactive elements to eliminate the 300ms tap delay.
- `-webkit-tap-highlight-color: transparent;` to kill grey tap boxes.
- Minimum **44×44px touch targets** for buttons, tabs, and avatar icons.
- Safe area padding (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) on fixed headers, floating buttons, and bottom navbars.
