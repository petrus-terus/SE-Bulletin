# 006 — Overlay entrance for StoryViewer + progress reduced-motion

- **Status**: TODO
- **Commit**: `debeccb`
- **Severity**: MEDIUM (opportunity)
- **Category**: Missed opportunity (find-animation-opportunities)

## Objective

The StoryViewer is the **only** overlay in the app that teleports in with zero entrance animation — every sibling overlay fades 180-220ms (`FeedCard.modalBackdrop`, `QuoteBulletinModal`, `ImageViewerModal`, `CreateStoryModal`, `CommentDrawer`). It also lacks a reduced-motion block for its always-on progress bar. Small, self-contained fix.

## Problem & current code (verbatim)

`client/src/features/stories/StoryViewerModal.module.css:1-14`:

```css
.overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

No `animation` on the overlay. The frame has no entrance either, so the whole dark screen pops in.

`client/src/features/stories/StoryViewerModal.module.css:49-57` (progress):

```css
.progressBarFill {
  height: 100%;
  width: 100%;
  background: #FFFFFF;
  border-radius: var(--radius-pill);
  transform-origin: left;
  transition: transform 100ms linear;   /* continuous motion, no reduced-motion guard */
  will-change: transform;
}
```

The file has no `@media (prefers-reduced-motion: reduce)` block at all.

## Target

### Entrance

`client/src/features/stories/StoryViewerModal.module.css` — add to `.overlay` and its sibling:

```css
.overlay { ... animation: overlayFade 180ms var(--ease-expo) forwards; }
.modalFrame { ... animation: frameScale 200ms var(--ease-expo) forwards; }

@keyframes overlayFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes frameScale {
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}
```

These mirror the repo's own `backdropFadeIn` (180ms) + `dialogScaleIn` (scale 0.94→1, 200ms) patterns in `FeedCard.module.css:620-672` / `PostDetailView.module.css:601-636`.

### Reduced motion (applies to entrance + progress)

```css
@media (prefers-reduced-motion: reduce) {
  .overlay, .modalFrame, .progressBarFill { animation: none; }
  .modalFrame { transform: none; }
  .progressBarFill { transition: none; }
}
```

## Repo conventions to follow

- Use `var(--ease-expo)` token (defined `index.css:66`), as every sibling overlay does.
- Exemplar: `FeedCard.module.css:630` `.modalBackdrop { animation: backdropFadeIn 180ms ease-out forwards; }` and `FeedCard.module.css:653` `.confirmDialog { animation: dialogScaleIn 200ms cubic-bezier(0.16,1,0.3,1) forwards; }` — the opacity-only overlay fade plus a scale-in content frame is exactly this app's modal pattern.
- The progress bar is a legitimate `linear` (a driven progress indicator, `transform-origin: left`, GPU-safe) — do NOT change its easing, only guard it.

## Steps

1. `StoryViewerModal.module.css`: add `animation: overlayFade 180ms var(--ease-expo) forwards;` to `.overlay` and define `@keyframes overlayFade`.
2. Same file: add `animation: frameScale 200ms var(--ease-expo) forwards;` to `.modalFrame` and define `@keyframes frameScale`.
3. Same file: add the reduced-motion block (entrance off, progress transition off).

## Boundaries

- Do NOT touch `StoryViewerModal.tsx` (progress bar logic, keyboard nav, tap zones all stay).
- Do NOT change `.progressBarFill`'s `transform-origin` or `linear` easing — only gate it under reduce.
- Do NOT slow it down — 180-200ms; do not add springs in a keyframe (this is an occasional surface; a timed keyframe is correct, no gesture).

## Verification

- **Mechanical**: `cd client && npm run build && npm run lint` pass.
- **Feel check**:
  - Open a story → overlay fades in in one smooth beat after ~180ms, frame scales 0.97→1 (no teleport).
  - DevTools, slow to 10% playback: the entrance is a fade + tiny scale, not a slide-in from any edge.
  - Reduced-motion on: story appears instantly and the top progress bar doesn't move.
- **Done when**: the story viewer no longer teleports and reduce-motion users see no progress motion.
