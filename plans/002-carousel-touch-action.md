# 002 — Fix inverted carousel `touch-action` + add scroll containment

- **Status**: TODO
- **Commit**: `debeccb`
- **Severity**: HIGH
- **Category**: Performance / mobile-native (touch & scroll)
- **Estimated scope**: 5 CSS files, 6 one-line edits

## Objective

Two touch/scroll defects break the mobile feel on real devices. Fix both: (a) carousels declare `touch-action: pan-x`, which tells the browser it may only pan horizontally starting on the track — so a vertical swipe that begins over the image gallery scrolls nothing (the feed "sticks"); (b) inner scroll containers have no `overscroll-behavior: contain`, so hitting the end of a drawer's list rubber-bands the whole page behind it.

## Problem & current code (verbatim)

### 1. Carousel traps vertical scrolling

`client/src/shared/FeedCard.module.css:232-242` (`multiImageTrack`):

```css
.multiImageTrack {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  ...
  touch-action: pan-x;
}
```

`client/src/features/profile/AchievementsDeck.module.css:40-51` (`.horizontalTrack`):

```css
.horizontalTrack {
  ...
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  ...
  touch-action: pan-x;
}
```

Both are native scroll-snap tracks. Per the mobile playbook, a horizontal carousel should let the browser keep vertical panning (`pan-y`), or omit `touch-action` entirely since native `scroll-snap` needs none. `pan-x` inverts this: browsers may only pan X starting there, blocking page scroll over the gallery. (Correct siblings for reference: `StoriesBar.module.css:13` `touch-action: pan-x pan-y`.)

### 2. Inner scroll containers lack scroll chaining containment

These `overflow-y: auto` containers have no `overscroll-behavior: contain` → scrolling past the end of the list moves the page behind:

- `client/src/features/post/CommentDrawer.module.css:128-135` (`.commentsList { flex: 1; overflow-y: auto; ... }`)
- `client/src/features/post/SavedPostsDrawer.module.css:119-127` (`.sheetBody { flex: 1; overflow-y: auto; ... }`)
- `client/src/layout/BrandSidebarDrawer.module.css:19-38` (`.drawer { ... overflow-y: auto; ... }`)
- `client/src/shared/QuoteBulletinModal.module.css:8-13` (`.modalOverlay { ... overflow-y: auto; ... }`)

## Target

### 1. `client/src/shared/FeedCard.module.css:241`

```css
.multiImageTrack {
  ...
  touch-action: pan-y; /* keep horizontal for the browser? no: native snap handles X; browser keeps Y */
}
```

Exact replacement for line 241: `touch-action: pan-x;` → `touch-action: pan-y;`. (In a native `scroll-snap` track the browser implements X scrolling via its own gesture recognizer regardless; `pan-y` merely guarantees vertical swipe start-over-track still scrolls the page.)

### `client/src/features/profile/AchievementsDeck.module.css:50`

`touch-action: pan-x;` → `touch-action: pan-y;`.

### 2. Add to each container's rule

```css
overscroll-behavior: contain;
```

For `CommentDrawer.module.css` `.commentsList`, `SavedPostsDrawer.module.css` `.sheetBody`, `BrandSidebarDrawer.module.css` `.drawer`, `QuoteBulletinModal.module.css` `.modalOverlay`.

Also add `overscroll-behavior-x: contain;` to the horizontal pill strip `client/src/features/notifications/NotificationsView.module.css:94-105` (`.filtersRow { ... overflow-x: auto; ... }`) — the one strip that lacks it (siblings `StoriesBar` and `DepartmentFilters` already have it).

## Repo conventions to follow

- The repo already uses `overscroll-behavior-x: contain` + `touch-action: pan-x pan-y` on `StoriesBar.module.css:12-14` and `DepartmentFilters.module.css:8-9` — imitate that roll-out exactly.
- Put `overscroll-behavior: contain` inside the existing rule block; don't create new rules.

## Steps

1. `FeedCard.module.css:241`: `pan-x` → `pan-y`.
2. `AchievementsDeck.module.css:50`: `pan-x` → `pan-y`.
3. `CommentDrawer.module.css` `.commentsList`: add `overscroll-behavior: contain;`.
4. `SavedPostsDrawer.module.css` `.sheetBody`: add `overscroll-behavior: contain;`.
5. `BrandSidebarDrawer.module.css` `.drawer`: add `overscroll-behavior: contain;`.
6. `QuoteBulletinModal.module.css` `.modalOverlay`: add `overscroll-behavior: contain;` (nested `overflow-y: auto` on `.modalContent` is fine).
7. `NotificationsView.module.css` `.filtersRow`: add `overscroll-behavior-x: contain;`.

## Boundaries

- Do NOT touch any `.tsx` handler — these are pure CSS fixes; no scroll listeners.
- Do NOT set `touch-action: none` on the carousels (users need to scroll past them).
- Do NOT remove `scroll-snap-type`.

## Verification

- **Mechanical**: `cd client && npm run build` then `npm run lint` — both must pass.
- **Feel check (real device — required for scroll feel)**:
  - On a phone, open a feed with a multi-image post: start a vertical swipe on the image and the whole page must scroll (currently it sticks).
  - Open CommentDrawer, scroll comments to the very bottom and continue — only the drawer must bounce in place; the page behind must NOT move.
  - Same for BrandSidebarDrawer and the Quote modal.
- **Done when**: all 7 edits present and the carousel no longer blocks vertical scroll on hardware.

**Note**: `pan-x`→`pan-y` and overscroll behavior are only observable on real touch hardware; emulation does not reproduce them. The declarations are confirmed from source.
