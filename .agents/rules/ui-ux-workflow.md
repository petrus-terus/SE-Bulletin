---
description: Mandatory UI/UX and animation design protocol requiring impeccable skill execution and user pre-approval
globs: ["**/*.{tsx,jsx,html,css,cshtml,vue,svelte,ts,js}"]
---

# UI/UX, Generation & Animation Protocol (Impeccable Gate)

## 1. Golden Rule
For **ANY** UI/UX changes, frontend component generation, redesigns, styling updates, or animations:
1. **Activate the `impeccable` skill** first.
2. Formulate a **Structured, Detailed Impeccable Prompt** following the template below.
3. **STOP and ask the user for approval** before touching or writing any implementation code.

---

## 2. Structured Impeccable Prompt Template

Before implementing any UI or animation, construct and present a proposal containing:

```markdown
### 🎨 Impeccable UI/UX & Motion Specification Proposal

#### 1. Scope & Intent
- **Target Component / Screen**: (e.g., Home Feed Card, Department Story Carousel, Create Post Bottom Sheet)
- **Design Objective**: (e.g., Enhance scannability, add tactile micro-interactions, eliminate visual noise)

#### 2. Visual Tokens & Aesthetics
- **Brand Colors**: `#1A7A5A` (Forest Green), `#0055A4` (Deep Blue), `#10B981` (CTA Accent with `#0B0F17` dark ink text).
- **Surfaces & Borders**: `#F5F7FA` canvas, `#FFFFFF` card, `#E8EDF2` subtle borders, `12px` rounded corners (`rounded-xl`).
- **Typography & Scale**: Min 12px floor (`text-xs`), `font-mono tabular-nums` on all counters/timers.

#### 3. Motion & Animation Choreography
- **Interaction Triggers**: (e.g., tap, hover, pull-to-refresh, slide-in)
- **Duration & Timing Curve**: (e.g., 200ms `cubic-bezier(0.16, 1, 0.3, 1)` Apple spring)
- **Tactile Feedback**: `active:scale-[0.98]` compression on interactive triggers.
- **State Transitions**: Smooth enter/exit fades (0 opacity -> 100 opacity with 4px translation).

#### 4. Anti-Slop & Quality Checklist
- [ ] WCAG AAA contrast verified (dark text on green pills).
- [ ] No layout jitter (tabular numerals applied).
- [ ] Empty, loading (skeleton shimmer), and error states designed.
- [ ] Responsive across 393x852 iPhone baseline up to desktop.
```

---

## 3. Mandatory User Alignment Gate
**NEVER proceed directly to code without presenting the structured proposal above to the user.**
Always conclude the proposal by asking the user:
> *"Does this UI/UX and animation approach look good to you, or would you like to adjust any details before I implement it?"*
