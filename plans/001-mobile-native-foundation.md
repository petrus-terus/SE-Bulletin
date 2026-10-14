# 001 — Mobile-native foundation pass (assets, viewport, inputs, taps)

- **Status**: TODO
- **Commit**: `debeccb`
- **Severity**: HIGH
- **Category**: Accessibility / Performance (mobile-native platform layer)
- **Estimated scope**: 3 files (`client/index.html`, `client/src/index.css`, `client/public/manifest.json`), ~12 one-line edits

## Objective

This app is a mobile-first PWA installed on iOS/Android. These platform-layer tells make it feel like "a website in a browser" instead of an installed app, and one of them (iOS input zoom) actively harms usage. All fixes are single declarations; none change markup structure.

## Problem & current code (verbatim)

### 1. iOS zooms into every input (font-size < 16px)

`client/src/index.css:106-109`:

```css
input, textarea, select {
  font-family: inherit;
  caret-color: var(--color-primary-container);
}
```

No font-size is set, so inputs inherit small sizes: `CommentDrawer.module.css:255` (`var(--font-size-sm)` = 13px), `PostDetailView.module.css:538` (13px), `CreateBulletinPage.module.css:569/588/1090` (15/13/13px), `ProfilePage.module.css:1336/1356` (14px). iOS Safari auto-zooms into any focused input under 16px and does not zoom back out on blur → cropped, drifted layout.

### 2. No `overscroll-behavior` → pull-to-refresh hijacks the PWA

`client/src/index.css:86-98`:

```css
html, body {
  width: 100%;
  min-height: 100%;
  background-color: var(--color-surface-base);
  ...
  overflow-x: hidden;
}
```

No `overscroll-behavior: none` → Android Chrome pull-to-refresh and iOS page rubber-band trigger even inside the app, where the feed is the document.

### 3. Single `theme-color`, mismatched with a white header

`client/index.html:7`:

```html
<meta name="theme-color" content="#1A7A5A" />
```

Plus `index.html:15`: `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`. And `client/public/manifest.json:12`: `"theme_color": "#1A7A5A"`.

One green bar for both light and dark mode; the header beneath it is white (`TopAppBar.module.css`), so the status icons/clock in black-translucent mode sit over white with no tint → invisible status text.

### 4. No `interactive-widget=resizes-content` in the viewport meta

`client/index.html:6`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

On Android, the software keyboard overlays the layout viewport, covering the fixed reply/comment bars in `CommentDrawer` / `CreateStoryModal` and the bottom nav.

### 5. `-webkit-tap-highlight-color` scoped to `button, a` only

`client/src/index.css:167-169`:

```css
button, a {
  -webkit-tap-highlight-color: transparent;
}
```

Elements with `role="button"` or clickable divs (filter pills, chat bubbles, drawer rows) can still flash gray on tap in iOS Safari.

### 6. Control text selectable / long-press callout

`client/src/layout/BottomNav.module.css:70-72` (`.tabLabel`), `client/src/shared/FeedCard.module.css:385-401` (`.actionButton`), `client/src/features/stories/StoryViewerModal.module.css:103-120` (`.closeButton`) all lack `user-select`/`-webkit-touch-callout` → long-press selects label text / pops the copy callout on iOS.

## Target

Apply all of the following. Exact values only.

### `client/index.html`

Replace line 6:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
```

Replace line 7 with per-scheme themes matching the header background:

```html
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F5F7FA" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0B0F17" />
<meta name="color-scheme" content="light dark" />
```

Change line 15 (`apple-mobile-web-app-status-bar-style`) from `black-translucent` to `default` so the installed PWA status bar matches the document, or keep `black-translucent` only if a dark scrim is guaranteed under the status bar — `default` is the safer choice for a white header.

### `client/src/index.css`

On `html, body` (line 86 block) add:

```css
overscroll-behavior: none;
```

On the `input, textarea, select` rule (line 106) add:

```css
font-size: 16px;
```

Replace the `button, a` tap-highlight block (167-169) with a global reset:

```css
html {
  -webkit-tap-highlight-color: transparent;
}
button, a {
  -webkit-tap-highlight-color: transparent; /* keep for safety on old WebKit */
}
```

### `client/public/manifest.json`

Change `"theme_color"` (line 12) to `"#F5F7FA"` to match light-mode chrome. (It cannot be per-scheme; the HTML `theme-color` meta overrides at runtime.)

## Repo conventions to follow

- All CSS tokens live in `client/src/index.css` `:root`; do not inline new color literals for the screen surfaces — but `#F5F7FA` (canvas) and `#0B0F17` (dark ink) are already the established tokens `--color-surface-base` and `--color-dark-ink`. Use the literal hex in the `<meta>` tags (HTML cannot read CSS vars) and leave `:root` untouched.
- Exemplar of correct pattern: `LoginPage.module.css` inputs already use `font-size: 16px` — the standard to extend app-wide.

## Steps

1. `client/index.html`: edit line 6 viewport — append `, interactive-widget=resizes-content`.
2. `client/index.html`: replace line 7 with the two `<meta name="theme-color" ...>` + `<meta name="color-scheme" ...>`.
3. `client/index.html`: change line 15 status-bar style to `default`.
4. `client/src/index.css`: add `overscroll-behavior: none;` inside `html, body`.
5. `client/src/index.css`: add `font-size: 16px;` inside `input, textarea, select`.
6. `client/src/index.css`: broaden tap-highlight reset to `html`.
7. `client/public/manifest.json`: set `"theme_color": "#F5F7FA"`.
8. (Optional, LOW) add `user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;` to `.tabLabel` in `BottomNav.module.css`, `.actionButton` in `FeedCard.module.css`, `.closeButton` in `StoryViewerModal.module.css`.

## Boundaries

- Do NOT touch any other file.
- Do NOT add per-component font-size overrides; the global 16px rule in `index.css` is the fix (it only increases, so the small text on desktop layouts that sets explicit smaller sizes elsewhere is unaffected where a component sets its own `font-size` AFTER the base rule).
- Do NOT remove `viewport-fit=cover` (safe areas depend on it).
- Do NOT add `user-scalable=no` or `maximum-scale=1` (accessibility failure; the 16px fix is the correct remedy).

## Verification

- **Mechanical**: from `client/`, run `npm run build` (tsc -b && vite build) — must pass. `npm run lint` (oxlint) — zero warnings.
- **Feel check (real hardware — REQUIRED for these symptoms)**:
  - Open the dev server on `0.0.0.0`, load on an iOS device: tap the comment input → the page must NOT zoom in. Tap a filter pill → no gray flash.
  - Installed PWA on iOS: status bar text must be legible (matches `default`), and pull-to-refresh at the top of the feed must NOT trigger page reload.
  - Android: focus the reply input with the keyboard open → the reply bar must sit above the keyboard, not under it.
  - In DevTools (Rendering → Emulate prefers-color-scheme) toggle dark/light → `theme-color` updates.
- **Done when**: all six edits present and the iOS zoom and Android keyboard-chew behaviors are gone on a real phone.

**Note**: symptoms 1-4 can only be fully verified on real hardware (device emulation cannot reproduce input zoom, overscroll, status-bar chrome, or the software keyboard). The code edits themselves are confirmed from source.
