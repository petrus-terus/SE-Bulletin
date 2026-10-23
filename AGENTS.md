# Sabah Electricity (SESB) — Agent Operating Handbook

> **Project**: Sabah Electricity Sdn. Bhd. (SESB) — Internal Bulletin App (PWA)  
> **Repository Root**: `D:\SE Bulletin`  
> **Brand & Target**: Wisma SESB HQ Staff (Phase 1 Pilot) -> Statewide SESB (Phase 2 Enterprise)  
> **Specifications Document**: [PROJECT_SPEC.md](./PROJECT_SPEC.md)

---

## 1. Two-Tier Workflow Execution Protocol

To maximize token efficiency while preserving exceptional code and craft quality, all tasks must follow this two-tier model:

### Tier 1: Fast-Path (Atomic Fixes, Copy Changes, Small Tweaks < 30 lines)
1. **Direct Edit**: Modify target files directly following the Core Non-Negotiables below. Do NOT load multiple external skill files or block for a pre-code approval proposal.
2. **Local Verification**: Run the verification gate (`npm --prefix client run check-all` and `impeccable detect`).
3. **Report**: Summarize changes concisely with verification results and the exact `git commit` command.

### Tier 2: Heavy-Path (New Features, New Screens, Major Redesigns, Motion Sequences)
1. **Inspect Modular Rules**: Read the targeted domain rule from `docs/agent-rules/` using the Path-Based Trigger Table below.
2. **Inspect Targeted Skill**: Read *only* the specific relevant skill (`animate`, `emil-design-eng`, or `mobile-native`) instead of all skills at once.
3. **Pre-Code Proposal Gate**: Present a structured proposal to the user (Target Component, Design/Motion Intent, Token Mapping, `| Before | After | Why |` table). **Wait for user approval before coding.**
4. **Implement**: Code modularly using component sandboxing (keep page components thin, isolate sub-components).
5. **Verify**: Run full verification (`npm --prefix client run check-all` + `impeccable detect` + 393×852 mobile viewport check).

---

## 2. Path-Based Rule Trigger Table

Inspect (`view_file`) the specific rule file **only** when touching the matching directory or file type:

| When Touching Files In | Inspect Rule File | Focus Area |
|---|---|---|
| `client/src/ui/`, `client/src/shared/`, `client/src/features/`, `*.module.css` | `docs/agent-rules/ui-craft.md` | WCAG AAA 10.8:1 contrast, `tabular-nums`, `active:scale-[0.98]`, motion curves, touch targets |
| `client/src/services/`, `client/src/context/`, `client/src/hooks/` | `docs/agent-rules/cloud-sync-state.md` | Dual-persistence, Realtime payloads, foreign key resolution, counter math integrity |
| `client/src/utils/cropImage*`, `MediaCropModal*`, `AvatarCrop*` | `docs/agent-rules/media-canvas.md` | Local file priority, CORS-clean canvas export, client-side compression before storage upload |
| `server/**`, `*.cs`, `*.csproj`, `*.sln`, SignalR hubs | `docs/agent-rules/backend-dotnet.md` | Clean Architecture, MediatR CQRS, EF Core migrations, SQL Server RBAC, SignalR contracts |

---

## 3. Core Brand & Design Non-Negotiables

| Token | Hex Value | Rule / Usage |
|---|---|---|
| **Forest Green** | `#1A7A5A` | Kinabalu green peak, active story rings, primary CTAs |
| **Deep Blue** | `#0055A4` | Kinabalu blue peak, active tab icons, department pills |
| **Accent Green** | `#10B981` | Floating "+" create button, online presence dot. **MUST use `#0B0F17` dark ink text (10.8:1 WCAG AAA). NEVER use white text.** |
| **Canvas Background**| `#F5F7FA` | App shell, viewport background |
| **Card Surface** | `#FFFFFF` | Feed cards, story cards, modals, sheets (`rounded-xl` / 12px) |
| **Borders** | `#E8EDF2` | Subtle card borders, input outlines, dividers |

- **Typography Floor**: Strict minimum of **12px (`text-xs`)**. No micro-text.
- **Tabular Numerals**: Always apply `font-mono tabular-nums` to all counters (likes, comments, countdown timers, employee IDs).
- **Motion Safety**: Animate `transform` and `opacity` only. Never animate layout geometry (`height`, `width`, `margin`).
- **Mobile Touch**: Ensure `touch-action: manipulation;` and `-webkit-tap-highlight-color: transparent;` on all interactive buttons. Minimum 44×44px touch targets.
- **Domain Realism**: Use authentic SESB locations (Wisma SESB HQ, Tenom Pangi Hydro, Sepanggar Power), departments (HR, Operations, HSE, Comms, IT), and `@sesb.com.my` emails.

---

## 4. Mandatory Verification & Git Protocol

### Automated Verification Gate
Before declaring any task complete, run:
```powershell
npm --prefix client run check-all; cmd /c ".\.agents\skills\impeccable\scripts\impeccable.cmd detect --json client/src"
```
*Guarantees zero TypeScript errors, passing unit tests, zero linter violations, and zero mechanical design anti-patterns.*

### Git Commit & Push Discipline
- **NO Auto-Commits**: Never run `git commit` or `git push` automatically without explicit user confirmation.
- **Semantic Formatting**: Always recommend semantic commit commands to the user (e.g. `git add .; git commit -m "feat(feed): add interactive poll card"`).
- **Windows Syntax**: In PowerShell, always chain commands with `;` (semicolon). Never use `&&`.
