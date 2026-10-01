# Project Context, Operating Rules & Craft Standards

> **Project**: Sabah Electricity Sdn. Bhd. (SESB) — Internal Bulletin App (PWA)  
> **Repository Root**: `D:\SE Bulletin`  
> **Brand & Target**: Wisma SESB HQ Staff (Phase 1) -> Statewide SESB (Phase 2)  
> **Specifications Document**: [PROJECT_SPEC.md](./PROJECT_SPEC.md)

---

## 1. Mandatory Impeccable Protocol for UI/UX, Generation & Animation

For **ANY** UI/UX changes, new UI component generation, styling modifications, visual redesigns, or animation work:

1. **Activate & Inspect the Integrated Craft Pipeline (Mandatory `view_file` Pre-Check)**:
   - **Explicit Pre-Code Inspection**: Before writing or proposing any frontend code, the agent MUST explicitly inspect (`view_file`) the relevant skill instruction files rather than relying on memory:
     * Layout & Taste: `.agents/skills/design-taste-frontend/SKILL.md` and `.agents/skills/high-end-visual-design/SKILL.md`
     * Polish & Review: `.agents/skills/emil-design-eng/SKILL.md` (mandatory `| Before | After | Why |` review tables)
     * Motion & Timing: `.agents/skills/animate/SKILL.md` and `.agents/skills/find-animation-opportunities/SKILL.md`
     * Mobile-Native: `.agents/skills/mobile-native/SKILL.md` (tap latency, sticky hover prevention, safe areas)
     * Defect Detection: `.agents/skills/impeccable/SKILL.md`

2. **Formulate a Structured, Detailed Prompt**:
   Before writing any code, craft a structured specification detailing:
   - **Target Component / Screen**: What element is being built or modified.
   - **Design & Layout Intent**: Chunking, 16–20px spacing, 12px corner radius (`rounded-xl`), elimination of visual clutter ("anti-slop").
   - **Color & Contrast Token Mapping**: `#1A7A5A` (Forest Green), `#0055A4` (Deep Blue), `#10B981` (CTA Accent with `#0B0F17` dark ink text for 10.8:1 WCAG AAA contrast).
   - **Animation & Motion Choreography (`emil-design-eng` + `animate`)**:
     * **Strict Property Isolation**: Only animate `transform` and `opacity`. NEVER animate layout geometry (`height`, `width`, `top`, `margin`) to prevent layout thrashing and frame drops.
     * **Zero Ease-In on Entry**: Never use `ease-in` on entering UI; always use exponential ease-out `cubic-bezier(0.16, 1, 0.3, 1)` or physical spring parameters.
     * **Duration Budget**: 150–250ms for micro-interactions; 300–400ms for modal sheets/drawers.
     * **Tactile Compression**: Active scale compression (`transform: scale(0.98)` / `active:scale-[0.98]`).
   - **Mobile-Native Touch Ergonomics (`mobile-native`)**:
     * `touch-action: manipulation;` on all interactive elements to eliminate the 300ms tap delay.
     * `-webkit-tap-highlight-color: transparent;` to kill grey tap boxes.
     * Minimum 44×44px touch targets.
     * Safe area padding (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
   - **Instrumentation Craft**: `font-mono tabular-nums` for counters, timers, and timestamps.
   - **States**: Default, hover/active, loading shimmer skeleton, empty state, and error handling.

3. **Mandatory User Review Gate (Ask Before Implementation)**:
   - **DO NOT write code immediately.**
   - Present the structured UI/UX & motion proposal clearly to the user.
   - Ask for the user's review and approval before beginning implementation.

4. **Mandatory Post-Implementation Verification & Audit Gate (Run Before Declaring Done)**:
   - **Mechanical Defect Scanner**: Immediately upon completing code for any screen or component, run:
     `cmd /c ".\.agents\skills\impeccable\scripts\impeccable.cmd detect --json <targets>"`
   - **Motion Audit Pass (`review-animations`)**: Verify that no layout transitions were introduced, easings follow ease-out curves, and there is zero layout jitter.
   - **Visual & Interaction Audit (`impeccable polish`)**: Verify 44px touch targets, tabular numerals, and responsive behavior.
   - **Browser Subagent Viewport Check**: Verify visually via the browser subagent in 393×852 mobile viewport before considering the task finished.

---

## 2. User Style & Engineering Craft Preferences (From e-Bidding Benchmark)

### 2.1 Zero "UI Slop" & Clean Design
- Keep cards, headers, and navigation clean, modern, and uncluttered.
- Eliminate visual noise: do not add redundant badges, jarring colored boxes, or messy metadata rows.
- Maintain generous 16–20px spacing between feed posts and 12px rounded card corners (`rounded-xl`).

### 2.2 Contrast Rules (Strict WCAG AAA)
- **NEVER use white text on emerald / bright green (`#10B981`)** — contrast ratio is only 2.54:1 (fails accessibility).
- **ALWAYS use dark ink text (`#0B0F17` / `text-slate-950`) on emerald/green buttons & pills** to achieve an authoritative **10.8:1 WCAG AAA** contrast ratio.
- Primary buttons should use Deep Blue (`#0055A4`) with white text, or Forest Green (`#1A7A5A`) with white text. Reserved bright green (`#10B981`) for floating "+" CTAs and active indicators with dark text.

### 2.3 Instrumentation & Tabular Numerals
- **Always apply `font-mono tabular-nums`** to:
  - Like counts, comment counts, and share counts
  - 24-hour Story countdown timers
  - Post timestamps (e.g. `2h ago`, `14:32`)
  - Employee IDs (e.g. `SESB-1001`, `EMP123`)
  - Phone extension numbers
- This prevents horizontal layout jitter during real-time SignalR counter updates.

### 2.4 Typography Minimum Floor
- **Strict floor of 12px (`text-xs` / `text-[12px]`)**.
- **NEVER use micro-text** (`text-[10px]` or `text-[11px]`) on any metadata, badges, or timestamps.

### 2.5 Micro-Interactions, Animation & Mobile-Native Feel (`emil-design-eng` + `mobile-native`)
- Add active compression (`transform: scale(0.98)` / `active:scale-[0.98]`) on all interactive buttons, filter pills, and bottom tabs.
- Strictly animate `transform` and `opacity` only; never animate `height`, `width`, or layout shifts.
- Entry easings must use exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`).
- Use smooth Apple HIG-style spring toasts (Sonner-style) for asynchronous actions.
- Ensure `-webkit-tap-highlight-color: transparent;` and `touch-action: manipulation;` are applied to eliminate mobile tap latency and flash artifacts.
- Respect 44×44px minimum touch targets and iOS safe areas (`env(safe-area-inset-bottom)`).

### 2.6 Authentic Sabah Electricity Domain Realism
- In all mock data, seed data, and previews, use authentic Sabah Electricity context:
  - Locations: Wisma SESB (HQ Kota Kinabalu), Tenom Pangi Hydro Station, Sepanggar Power Station, Sandakan & Tawau regional stations.
  - Departments: HR, Operations, Engineering, Safety & Health (HSE), Corporate Communications, Finance, IT.
  - Staff IDs: `SESB-1001`, `EMP123`, `ENG-402`.
  - Corporate emails: `@sesb.com.my`.

### 2.7 Verification & Git Discipline
- **Browser Subagent Verification**: Always verify interactive UI, modals, tab switching, and responsive mobile layouts (393x852) on the local dev server before declaring a task complete.
- **Git Commit Protocol**: Commit with clean, semantic commit prefixes (e.g., `feat(ui): ...`, `feat(feed): ...`, `fix(contrast): ...`).
- **Git Push Protocol**: Do **NOT** push to remote git repositories without explicit user permission. Always test locally first.

### 2.8 Learned Rules & Execution Constraints
- **Windows PowerShell Syntax**: Always use `;` (semicolon) as a command separator when chaining shell commands in Windows PowerShell (e.g. `git add .; git commit -m "..."`). Do NOT use `&&`.
- **Git Commit Discipline**: Only perform local git commits when explicitly instructed by the user or pre-approved for the current task. Never auto-commit routine edits.
- **Feed Card Image Fallbacks**: All dynamic or external `<img>` elements in feed cards and user avatars MUST implement `onError` fallback handlers and empty `alt=""` tags (or fallback containers) to prevent broken image icons, text overflow, and layout overlap.
- **Mandatory Pre-Code Skill Verification**: Never generate frontend components or styles without first reading the corresponding `SKILL.md` files for that interaction type. Memory or loose adherence is strictly prohibited.
- **1:1 Authentic Brand Asset Fidelity**: Never substitute generic placeholder icons (e.g., generic lightning bolts, stock symbols, or artificial logos) when authentic corporate parent/subsidiary branding exists (e.g., Tenaga Nasional Berhad / SESB). Always use 1:1 official vector/cropped brand assets inside designated high-contrast white badge surfaces with `onError` fallbacks.
- **Mandatory Reduced Motion & Sticky Hover Gating**:
  - Every CSS keyframe animation or continuous pulse MUST include `@media (prefers-reduced-motion: reduce) { animation: none; transform: none; }`.
  - Every interactive hover transition on cards or buttons MUST be gated inside `@media (hover: hover) and (pointer: fine)` to prevent stuck hover states on mobile touchscreens.
- **Cloudflare Pages SPA Routing**: Always maintain `client/public/_redirects` with `/*  /index.html  200` so deep-links, browser refreshes, and PWA launch URLs never trigger Cloudflare 404 errors.
- **Supabase Storage over Base64**: Do not persist large base64 image strings into PostgreSQL table columns. Upload image blobs directly to the Supabase Storage bucket (`bulletin-media`) and store the resulting public CDN URL.
- **Supabase Row Level Security (RLS)**: Always verify that tables (`posts`, `comments`, `profiles`, `likes`) in Supabase have active RLS policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` so queries do not fail silently.

---

## 3. Brand Identity & Design System Tokens

| Token | Hex Value | Usage Context |
|---|---|---|
| **Forest Green** | `#1A7A5A` | Kinabalu green peak, active story rings, primary CTAs |
| **Deep Blue** | `#0055A4` | Kinabalu blue peak, active tab icons, department pills |
| **Accent Green** | `#10B981` | Floating "+" create button, online presence dot (with `#0B0F17` text) |
| **Canvas Background** | `#F5F7FA` | App shell, viewport background |
| **Card Surface** | `#FFFFFF` | Feed cards, story cards, modals, sheets |
| **Borders / Dividers** | `#E8EDF2` | Subtle card borders, input outlines, dividers |
| **Dark Text** | `#1E293B` | Headings, post titles, high contrast copy |
| **Muted Text** | `#64748B` | Timestamps, designations, secondary counters |
| **HSE Orange** | `#F59E0B` | Safety alerts, priority notices |
| **Alert Red** | `#EF4444` | Grid emergency alerts, unread notification badges |

---

## 4. Tech Stack & Architecture

### 4.1 Phase 1 Pilot Architecture (Active Deployment)
- **Frontend Hosting**: **Cloudflare Pages** (Vite React PWA, static `dist` bundle, global CDN, automated SSL/HTTPS).
- **Backend & Database**: **Supabase** (Managed PostgreSQL, PostgREST REST API, WebSocket Realtime Engine for live reactions and comment sync).
- **Media Storage**: **Supabase Storage** (Public bucket `bulletin-media` for field photos, announcement flyers, and avatars).
- **PWA Capabilities**: Service Worker with Cache API, Web Manifest, iOS 3-step illustrated install sheet, and Android 1-click install banner.
- **Pilot Authentication**: Enterprise corporate login supporting `@sesb.com.my` accounts with instant session persistence (`localStorage`).

### 4.2 Phase 2 Enterprise On-Prem Architecture (Internal SESB Intranet)
- **Frontend**: React + Vite PWA behind corporate reverse proxy.
- **Backend**: ASP.NET Core 8 Web API (C#) aligned with internal SESB enterprise standards.
- **Real-Time**: SignalR Hub (`/hubs/bulletin`) for live reactions, online presence dots, and emergency safety broadcasts.
- **Database**: SQL Server / PostgreSQL on-premise.
- **Storage**: On-premise internal SESB network storage mount (`/app_data/media`) behind Wisma SESB firewall.
- **Authentication**: Corporate `@sesb.com.my` email with 6-digit OTP verification via internal SESB SMTP.

---

## 5. Governance & Role-Based Access Control (RBAC)

1. **General Staff**: Status Updates, Photo/Video galleries, threaded comments, likes, drafts, employee directory search.
2. **Department Admin**: Official department-tagged **Announcements**, 24h Department Stories, toggle comments ON/OFF, pin up to 2 announcements, moderate comments.
3. **Super Admin / Corporate Comms**: Emergency HSE/grid broadcasts, department management, global audit logs.

---

## 6. Specification Reference
For the full functional requirements, database ERD, API endpoints, and screen flows, refer to [PROJECT_SPEC.md](./PROJECT_SPEC.md).
For the step-by-step pilot deployment guide, SQL schemas, and Cloudflare configuration, refer to [docs/PILOT_DEPLOYMENT_GUIDE.md](./docs/PILOT_DEPLOYMENT_GUIDE.md).
