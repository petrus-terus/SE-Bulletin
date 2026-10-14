# 004 — Replace `transition: all` with property-specific transitions + tokenize easing

- **Status**: TODO
- **Commit**: `debeccb`
- **Severity**: MEDIUM
- **Category**: Performance / Cohesion (consolidation)
- **Estimated scope**: ~8 CSS files, mechanical search-replace

## Objective

Two mechanical debts spread across the app:
1. `transition: all` animates unintended properties off-GPU → jank-prone on the highest-frequency surfaces (bottom nav, desktop nav).
2. The literal cubic-bezier `(0.16, 1, 0.3, 1)` is hand-typed ~100× instead of using `var(--transition-*)` tokens → drift risk.

Both are consolidation work with zero visual change.

## Problem & current code (verbatim)

### `transition: all` occurrences

- `client/src/layout/BottomNav.module.css:44` — `.tabItem { ... transition: all var(--transition-fast); }` (bottom nav = most-used animated surface; affects `transform`, `color`)
- `client/src/layout/DesktopSidebar.module.css:58,114,144` — `.navItem` / `.createButton` / `.userFooter` all `transition: all var(--transition-fast);`
- `client/src/shared/FeedCard.module.css:160` — `.optionsButton { transition: all var(--transition-fast); }`
- `client/src/features/feed/DepartmentFilters.module.css:28` — `.filterPill { transition: all var(--transition-fast); }`
- `client/src/features/post/CommentDrawer.module.css:258,280` — `.inputField`, `.sendButton` `transition: all var(--transition-fast);`
- `client/src/features/profile/ProfilePage.module.css:901` — `.transition: all 120ms ease;`
- `client/src/features/auth/LoginPage.module.css:417` — `.transition: all 150ms ease;`

### Token bypass

`client/src/index.css:66-69` defines the tokens, but every module hand-types the curve, e.g. `TopAppBar.module.css:39`, `FeedCard.module.css:14`, `PostDetailView.module.css:284`, dozens across `ProfilePage.module.css`.

## Target

Each `transition: all Xms Y` becomes the explicit property list that actually changes in that component:

- `.tabItem`/`.navItem`/`.filterPill` → `transition: transform var(--transition-fast), color var(--transition-fast), background-color var(--transition-fast);`
- `.optionsButton` → `transition: transform var(--transition-fast), color var(--transition-fast);`
- `.inputField` → `transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);`
- `.sendButton` → `transition: transform var(--transition-fast), background var(--transition-fast);`

For the curve-drift items, swap the hand-typed `cubic-bezier(0.16, 1, 0.3, 1)` for `var(--ease-expo)` / `var(--transition-*)` in the same files (e.g. the bullets above), making the change behavior-identical.

## Repo conventions to follow

- The tokens live in `client/src/index.css:66-69` (`--ease-expo`, `--transition-fast/normal/smooth`).
- Exemplar of the correct property list style: `client/src/layout/BottomNav.module.css:118` `.centerFab { transition: transform var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast); }` — list exactly the animated properties.
- To decide what a component actually animates, read its `:hover` / `:active` / class-toggle rules first, then list those properties.

## Steps

1. Open each file below and replace its `transition: all ...` with the property-specific rule shown in Target; confirm the list matches the component's real `:hover`/`:active`/state changes (transform is always present in this codebase, so it's safe to include).
   - `BottomNav.module.css:44`
   - `DesktopSidebar.module.css:58,114,144`
   - `FeedCard.module.css:160`
   - `DepartmentFilters.module.css:28`
   - `CommentDrawer.module.css:258,280`
   - `ProfilePage.module.css:901`
   - `LoginPage.module.css:417`
2. Tokenize: in each module that hand-types `cubic-bezier(0.16, 1, 0.3, 1)` for a duration that already has a token (`--transition-fast/normal/smooth`), replace with the token. For the 300-400ms outliers, see plan 006 (`et.al`) — leave explicit pure `300ms var(--ease-expo)` as-is (correct usage).
3. Run build + lint.

## Boundaries

- This is a behavior-preserving mechanical refactor: keep durations and curves identical in effect — the only intended changes are property lists (fewer animated props) and the token substitution (`cubic-bezier(0.16,1,0.3,1)` ↔ `var(--ease-expo)` are the same curve).
- Do NOT touch `index.css` `:root` token values.
- Do NOT pick up other findings (like-pop amplitudes are Plan 003's scope; `left` layout animation is Plan 006's).

## Verification

- **Mechanical**: `cd client && npm run build && npm run lint` pass.
- **Diff review**: `git diff` shows only the intended `transition:` lines changed — no visual differences.
- **Feel check**: bottom nav tab switching, filter pill press, comment input focus all feel the same as before (no sloppier transitions).
- **Done when**: zero `transition: all` remains (grep `transition: all` → no hits in `client/src`), and `cubic-bezier(0.16, 1, 0.3, 1)` literal is only found where the token truly can't apply.
