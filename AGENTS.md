# Project Context, Operating Rules & Craft Standards

> **Project**: Sabah Electricity Sdn. Bhd. (SESB) — Internal Bulletin App (PWA)  
> **Repository Root**: `D:\SE Bulletin`  
> **Brand & Target**: Wisma SESB HQ Staff (Phase 1) -> Statewide SESB (Phase 2)  
> **Specifications Document**: [PROJECT_SPEC.md](./PROJECT_SPEC.md)

---

## 1. Mandatory Impeccable Protocol for UI/UX, Generation & Animation

For **ANY** UI/UX changes, new UI component generation, styling modifications, visual redesigns, or animation work:

1. **Activate the `impeccable` Skill**:
   - Always load and reference `.agents/skills/impeccable` (or global `impeccable`).
   - Use the appropriate craft lens (`polish`, `delight`, `animate`, `bolder`, `quieter`, `clarify`, `harden`, `typeset`).

2. **Formulate a Structured, Detailed Prompt**:
   Before writing any code, craft a structured specification detailing:
   - **Target Component / Screen**: What element is being built or modified.
   - **Design & Layout Intent**: Chunking, 16–20px spacing, 12px corner radius (`rounded-xl`), elimination of visual clutter ("anti-slop").
   - **Color & Contrast Token Mapping**: `#1A7A5A` (Forest Green), `#0055A4` (Deep Blue), `#10B981` (CTA Accent with `#0B0F17` dark ink text for 10.8:1 WCAG AAA contrast).
   - **Animation & Motion Choreography**: Trigger events, timing curves (e.g., exponential ease-out `cubic-bezier(0.16, 1, 0.3, 1)`), duration (150–250ms), tactile compression (`active:scale-[0.98]`), and state transitions.
   - **Instrumentation Craft**: `font-mono tabular-nums` for counters, timers, and timestamps.
   - **States**: Default, hover/active, loading shimmer skeleton, empty state, and error handling.

3. **Mandatory User Review Gate (Ask Before Implementation)**:
   - **DO NOT write code immediately.**
   - Present the structured UI/UX & motion proposal clearly to the user.
   - Ask for the user's review and approval before beginning implementation.

4. **Mandatory Post-Implementation Impeccable Gate (Run Before Declaring Done)**:
   - Immediately upon completing code for any screen or component, run the mechanical defect scanner:
     `cmd /c ".\.agents\skills\impeccable\scripts\impeccable.cmd detect --json <targets>"`
   - Resolve all anti-patterns (layout transitions, easing issues, contrast flaws) in a single batch.
   - Perform a visual and interaction audit pass (`impeccable polish`) verifying 44px touch targets, tabular numerals, and responsive behavior.
   - Verify visually via the browser subagent in 393×852 mobile viewport before considering the task finished.

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

### 2.5 Micro-Interactions & Tactile Feel
- Add active compression (`active:scale-[0.98]`) on all interactive buttons, filter pills, and bottom tabs.
- Use smooth Apple HIG-style spring toasts for asynchronous actions (saving a draft, copying a post link, reporting a post, toggling notification settings).

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

- **Frontend**: React + Vite PWA (Mobile-first 393x852 iPhone baseline) with Service Worker (Cache API + IndexedDB) for offline feed browsing and Web Push notifications.
- **Styling**: Pure modern CSS / CSS Variables / CSS Modules. Do NOT install or use Tailwind CSS (avoids class clutter and ensures fine-grained control over Apple HIG spring animations).
- **Backend**: ASP.NET Core 8 Web API (C#) aligned with internal SESB enterprise standards.
- **Real-Time**: SignalR Hub (`/hubs/bulletin`) for live reactions, online presence dots, real-time comment counts, and emergency safety broadcasts.
- **Database**: SQL Server / PostgreSQL with Entity Framework Core.
- **Storage**: On-premise internal SESB network storage mount (`/app_data/media`) behind corporate intranet.
- **Authentication**: Corporate `@sesb.com.my` email with 6-digit OTP verification via internal SESB SMTP.

---

## 5. Governance & Role-Based Access Control (RBAC)

1. **General Staff**: Status Updates, Photo/Video galleries, threaded comments, likes, drafts, employee directory search.
2. **Department Admin**: Official department-tagged **Announcements**, 24h Department Stories, toggle comments ON/OFF, pin up to 2 announcements, moderate comments.
3. **Super Admin / Corporate Comms**: Emergency HSE/grid broadcasts, department management, global audit logs.

---

## 6. Specification Reference
For the full functional requirements, database ERD, API endpoints, and screen flows, refer to [PROJECT_SPEC.md](./PROJECT_SPEC.md).
