# 003 — Align like-pop: unify amplitude + gate `prefers-reduced-motion`

- **Status**: TODO
- **Commit**: `debeccb`
- **Severity**: HIGH
- **Category**: Accessibility / Cohesion
- **Estimated scope**: 2 CSS files, 2 edits + 1 media-query guard

## Objective

The same "like" interaction animates with **two different hand-typed keyframes** depending on where it lives — and the post-detail one violates reduced-motion. Unify them: one amplitude, both gated.

## Problem & current code (verbatim)

### Feed card like (the reference)

`client/src/shared/FeedCard.module.css:429-451`:

```css
.likeHeartPop {
  animation: heartPop 300ms var(--ease-expo);
  font-variation-settings: 'FILL' 1;
}

@keyframes heartPop {
  0%   { transform: scale(0.9); }
  50%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .likeHeartPop {
    animation: none;
    transform: none;
  }
}
```

### Post-detail like (the divergent one)

`client/src/features/post/PostDetailView.module.css:295-311`:

```css
.likeIconActive {
  color: #EF4444;
  font-variation-settings: 'FILL' 1;
  animation: heartPop 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes heartPop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.35); }
  100% { transform: scale(1); }
}
```

The only reduced-motion block in that file (`PostDetailView.module.css:638-643`) targets `.modalBackdrop, .confirmDialog` — the like pop is **ungated**. So reduced-motion users still get a 1.35× pop on a frequently-tapped, keyboard-invokable control, while the identical interaction in the feed is reduced to nothing. Same motion, two amplitudes (1.15 vs 1.35), divergent accessibility.

## Target

Unify PostDetailView's feed-mirror to the reference behavior.

`client/src/features/post/PostDetailView.module.css:295-311` — replace with:

```css
.likeIconActive {
  color: #EF4444;
  font-variation-settings: 'FILL' 1;
  animation: heartPop 300ms var(--ease-expo);
  font-variation-settings: 'FILL' 1;
}

@keyframes heartPop {
  0%   { transform: scale(0.9); }
  50%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .likeIconActive {
    animation: none;
    transform: none;
  }
}
```

And append `.likeIconActive` to the existing screen-level reduced-motion block if kept (see steps).

## Repo conventions to follow

- Use the `var(--ease-expo)` token (defined `index.css:66`), not the literal cubic-bezier.
- The FeedCard block above is the in-repo exemplar — match it exactly.
- The app standard: reduced motion removes movement but keeps color feedback (`color: #EF4444` and `FILL` persist).

## Steps

1. In `PostDetailView.module.css`, change `animation: heartPop 300ms cubic-bezier(0.16, 1, 0.3, 1);` (line 298) to `animation: heartPop 300ms var(--ease-expo);`.
2. Change the `@keyframes heartPop` (301-311) to the FeedCard amplitudes `scale(0.9)` / `scale(1.15)` / `scale(1)`.
3. Add a `@media (prefers-reduced-motion: reduce)` block for `.likeIconActive` (either extend the file's existing block at 638-643 to include `.likeIconActive`, or add a sibling block) with `animation: none; transform: none;`.

## Boundaries

- Do NOT change the FeedCard like — it is already correct.
- Do NOT touch the like button layout, color, or the FILL variation setting.
- Do NOT touch other reduced-motion blocks in the file.

## Verification

- **Mechanical**: `cd client && npm run build && npm run lint` — both pass.
- **Feel check**:
  - Tap like in a feed card and in post detail: both pops feel identical (1.15×).
  - DevTools Rendering → Emulate `prefers-reduced-motion: reduce`: tapping like in post detail must show NO scale animation (color/`FILL` change only).
  - Use the keyboard (Enter) to like in post detail — same reduced behavior.
- **Done when**: both interactions share the gated, 1.15× keyframe.
