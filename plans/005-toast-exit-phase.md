# 005 — Toast: add exit phase + reduce-motion guard

- **Status**: TODO
- **Commit**: `debeccb`
- **Severity**: MEDIUM
- **Category**: Interruptibility / Accessibility
- **Estimated scope**: 2 files (`ui/Toast.tsx`, `ui/Toast.module.css`) + 1 single rule

## Objective

The toast is the app's most frequent transient feedback channel, and it currently has two motion flaws: it **enters** with a keyframe but contains no **exit** phase (dismissal is a hard cut when `onDismiss` unmounts), and the whole file has **no `prefers-reduced-motion` guard**.

## Problem & current code (verbatim)

`client/src/ui/Toast.tsx:17-22`:

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    onDismiss();
  }, durationMs);
  return () => clearTimeout(timer);
}, [message, durationMs, onDismiss]);
```

`client/src/ui/Toast.tsx:26-34`:

```tsx
<div className={styles.toastContainer}>
  <div className={styles.toastPill} role="status" aria-live="polite">
    ...
  </div>
</div>
```

`client/src/ui/Toast.module.css:23`:

```css
.toastPill { ... animation: toastSlideIn 280ms var(--ease-expo); ... }
```

`@keyframes toastSlideIn` (32-41):

```css
@keyframes toastSlideIn {
  0%   { opacity: 0; transform: translateY(-16px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
```

There is no `@keyframes`/rule for exiting and no reduced-motion block anywhere in `Toast.module.css`. `App.tsx:343-349` renders a single `Toast` while `toast` is set, so dismissal = instant unmount of the pill.

## Target

### `client/src/ui/Toast.tsx` — introduce an explicit exit phase

Add an `exiting` state and drive the CSS class off it, so the pill animates out along the same path it entered, then unmounts after `onExit`. Structure:

```tsx
const [exiting, setExiting] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setExiting(true), durationMs);
  return () => clearTimeout(timer);
}, [durationMs]);

if (exiting) {
  // t=0 starts exit; unmount after it completes
  const exitMs = 200;
  const t = setTimeout(onDismiss, exitMs);
  return () => clearTimeout(t); // cleanup combined in effect below is preferred
}
```

Cleaner single-effect version (preferred — replaces current useEffect 17-22):

```tsx
useEffect(() => {
  const exitTimer = setTimeout(() => setExiting(true), durationMs);
  const unmountTimer = setTimeout(onDismiss, durationMs + 200); // 200ms = exitMs below
  return () => { clearTimeout(exitTimer); clearTimeout(unmountTimer); };
}, [durationMs, onDismiss]);
```

And on the pill:

```tsx
<div className={`${styles.toastPill} ${exiting ? styles.toastExiting : ''}`} role="status" aria-live="polite">
```

### `client/src/ui/Toast.module.css` — exit keyframe (mirror entry)

```css
.toastExiting {
  animation: toastExit 200ms var(--ease-expo) forwards;
}

@keyframes toastExit {
  0%   { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-16px) scale(0.96); } /* same path as entry */
}
```

And add the file's first reduced-motion block:

```css
@media (prefers-reduced-motion: reduce) {
  .toastPill,
  .toastExiting {
    animation: none;
  }
}
```

## Repo conventions to follow

- Use the exact `var(--ease-expo)` curve and the same 280ms entry already used; the exit mirrors the entry path (spatial consistency).
- The app already gates every other overlay behind `prefers-reduced-motion`; this fills the one gap.
- App.tsx owns toast state — do NOT touch `App.tsx` (the `Toast` already receives `onDismiss`).

## Steps

1. `Toast.tsx`: add `const [exiting, setExiting] = useState(false);` and replace the 17-22 effect with the two-timer version above.
2. `Toast.tsx:27-33`: add `exiting ? styles.toastExiting : ''` to the pill's className.
3. `Toast.module.css`: add `.toastExiting` + `@keyframes toastExit` as above.
4. `Toast.module.css`: add the reduced-motion block.

## Boundaries

- Only `Toast.tsx` and `Toast.module.css`; do NOT touch `App.tsx` or the toast container styles.
- Do NOT add a library — WAAPI/timers are fine, no new deps.
- Do NOT break the accessibility text (`role="status" aria-live="polite"` stays).

## Verification

- **Mechanical**: `cd client && npm run build && npm run lint` pass.
- **Feel check**:
  - Trigger any toast (like a bookmark save) — it slides in, then slides back up the same path and is fully gone before the next toast can appear.
  - Trigger two toasts in a row quickly: the first must exit before the second is cleanly shown (no overlapping pills, no hard cut).
  - DevTools → simulate `prefers-reduced-motion: reduce`: toast appears/disappears instantly, no slide.
- **Done when**: a toast never hard-cuts on dismiss and reduced-motion users get zero slide.
