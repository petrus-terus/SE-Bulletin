# De-Spaghetti Refactor Plan — SE Bulletin

- **Status**: TODO (awaiting approval — nothing implemented)
- **Author**: codebase audit, 2026-10-20
- **Scope**: `client/src` maintainability refactor. **Zero intended visual change.**
- **Relationship to plans 001–006**: separate series (code structure, not motion). Do not add to the motion index.

> **⚠️ Coordination note**: the working tree currently has **uncommitted user WIP** in
> `CreateBulletinPage.*`, `CreateStoryModal.*`, `StoryViewerModal.*`. Phase 5 touches two of those
> files — it must wait until that WIP is committed. Phases 1, 2, 4 are conflict-free.

## Audit summary (why this plan exists)

Verified first-hand at the file:line cited below. No `TODO/FIXME/HACK`, no commented-out code, no
circular imports — the rot is concentrated in duplication + state tangles, not general chaos.

| Hotspot | Symptom |
| --- | --- |
| `services/bulletinService.ts` (1094 L) | God-repository: fetch/map, mutations, storage, story GC, broadcasts, view analytics, localStorage. Inconsistent error contract (rethrow vs swallow vs silent `[]`). |
| `hooks/useRealtimeSync.ts` (407 L) | One 368-line effect (L32–399), 10 handlers, 8× `eslint-disable no-explicit-any`. **Duplicates the service's row→entity mappers with drift.** |
| `App.tsx` (610 L) | ~23 `useState`; 6 modal booleans + 5 nav IDs; 36-prop `TabRouter` call, ~40-prop `OverlayHost` call; `usePostActions` receives 14 arguments. |
| `FeedCard.tsx` ↔ `PostDetailView.tsx` | The detail view is a **fork** of the card: permissions block, hashtag formatter, copy-link, PDF card, quoted card, delete dialog all duplicated (~250 lines + matching CSS). |
| `CreateBulletinPage` / `ProfilePage` / `CreateStoryModal` | 22 / 12 / 18 `useState` respectively; dead & derived state; 9-setter reset; 15-level JSX nesting. |
| Constants | `'dept-ops'` ×8, location list ×5 (divergent), logo `onError` fallback ×17, avatar-initials ×6, localStorage-Set ×5, `realtime:bulletin-live` ×4. |

---

## Phase 1 — Shared row mappers (fixes live-data drift) — HIGH

**Objective**: one source of truth for Supabase row → `Post` / `Story` / `Comment` mapping, killing
the validation drift between initial fetch and realtime inserts.

### Problem (verified)

- `bulletinService.ts:142-187` vs `useRealtimeSync.ts:124-158` — near-identical Post mappers that
  have **drifted**:
  - Poll: service validates via Zod (`174-180`), realtime passes `row.poll_data || row.poll`
    **unvalidated** (`useRealtimeSync.ts:153`).
  - `viewsCount`: `|| 0` (service `166`) vs `|| 1` (realtime `145`).
  - Avatar: service has the CEO special-case (`152-154`), realtime does not → live CEO posts get the
    generic logo.
  - Service lacks `reactions`/`quotedPost`/`isEdited` is present, realtime lacks `quotedPost`/
    `isEdited`/`editedAt`.
  - Author-id fallback differs (service `147` throws on `author_name === null`; realtime `129` doesn't
    strip non-alphanumerics).
- `bulletinService.ts:331-376` vs `useRealtimeSync.ts:43-84` — Story mapper with **literal duplicate
  regexes** (`341/349` vs `51/58`) and video-extension sniffing.
- Avatar-initials expression ×6: `bulletinService.ts:677-682, 707-712`, `usePostActions.ts:308-313`,
  `useRealtimeSync.ts:192-197, 283-288, 345-350`.
- `isSelf` author check ×3 in `useRealtimeSync.ts:162-169, 256-263, 304-311`.
- Broadcast channel find-or-create boilerplate ×2: `bulletinService.ts:425-443, 569-587`.

### Steps

1. Create **`client/src/services/rowMappers.ts`** exporting:
   - `parsePollData(raw, postId)` — the Zod schemas moved verbatim from `bulletinService.ts:7-20`.
   - `getAvatarInitials(name)` — null-safe (`name || 'SE'`).
   - `isAuthorSelf(row, currentUser)` — the triplicated `isSelf` predicate.
   - `mapRowToPost(row, { timestamp? })`, `mergeUpdatedPostRow(post, row)` (the 20-field UPDATE
     merge from `useRealtimeSync.ts:218-252`), `mapRowToStory(row, { viewsCount?, hasUnread? })`,
     `parseStoryCaption(caption)`, `isVideoMediaUrl(url)`, `mapRowToComment(row, { timestamp? })`.
   - `broadcastLiveEvent(event, payload)` — or a sibling `services/realtimeBroadcast.ts`.
2. `bulletinService.ts`: delete the local Zod schemas, replace the `getPosts` / `getStories` /
   `getComments` mapping bodies with mapper calls, replace `addComment`'s inline initials
   (`707-712`), replace both broadcast blocks with `broadcastLiveEvent(...)`.
3. `useRealtimeSync.ts`: replace the inline Post/Story/Comment mappers, the UPDATE merge blob and
   the 3 `isSelf` blocks with mapper calls; drop the now-unneeded `eslint-disable` lines that
   guarded mapper code (payload-cast disables may remain).
4. `usePostActions.ts:308-313` → `getAvatarInitials`.

### Reconciliations (behavior decisions — review before implementing)

| # | Drift | Proposed canonical | Rationale |
| --- | --- | --- | --- |
| D1 | Poll validated vs not | **Validate everywhere** | Malformed poll JSON drops to `undefined` instead of crashing/odd UI. |
| D2 | `viewsCount` `\|\| 0` vs `\|\| 1` | **`\|\| 0`** | Matches fetch path; realtime-only effect is a brand-new post showing 0 instead of 1. |
| D3 | CEO avatar only in fetch | **Everywhere** | Realtime currently loses it → inconsistent avatar for the same author. |
| D4 | Story `viewsCount` random (service `374`) vs `1` (realtime `83`) | **Keep both as call-site options** in Phase 1 (behavior preserved), then decide separately | `Math.floor(Math.random()*25)+12` is **fabricated analytics in a production path** — worth removing, but it changes on-screen numbers → product decision, not a refactor. |
| D5 | Story lifetime: `STORY_EXPIRY_MS` 48h (`:51`), fetch window 24h (`:324`), countdown assumes 24h (`:332`) | **Out of scope — flag only** | Real semantics question (are stories 24h or 48h?). Separate decision. |

### Boundaries

- No query/mutation logic changes — **mapping only**.
- Do not touch the `createStory` caption-**building** direction (`[📍 …]` composition at
  `bulletinService.ts:396-404`); only parsing is unified.

### Verification

- `cd client && npm run build && npm run lint`.
- Grep: `payload.new as any` count drops; `no-explicit-any` disables in `useRealtimeSync.ts` drop
  from 8 toward ≤3 (payload casts only).
- Dev-server smoke: feed loads, a poll renders, a live post from a second session appears with the
  correct avatar + counts.

---

## Phase 2 — Extract shared FeedCard / PostDetailView blocks — HIGH

**Objective**: delete ~250 duplicated TSX lines + ~200 duplicated CSS lines by extracting five shared
units. **Pixel-identical output** (verified by CSS diff before extraction).

### Duplication map (verified line-for-line)

| Block | FeedCard | PostDetailView | CSS status |
| --- | --- | --- | --- |
| Permission logic (`isSuperAdmin`/`isOwnPost`/`canEdit`/`canDelete`) | `57-72` | `48-63` | n/a — identical incl. hardcoded UUID `270b3427…` |
| `handleCopyLink` | `97-108` | `65-72` | n/a — 1200ms vs 1500ms + menu-close difference |
| `renderFormattedContent` | `119-131` | `98-110` | inline color `var(--color-primary-text)` vs `#0055A4` |
| PDF card | `345-393` | `367-412` | `FeedCard.module.css:845-949` ≡ `PostDetailView.module.css:903-1009` **except** `margin: 10px/4px` vs `12px/12px` |
| Quoted-post card | `396-441` | `316-354` | `:370-439` vs `:540-596` — differs in radius (12 vs 14), padding (12 vs 14), hover/cursor, class names |
| Delete-confirm dialog | `620-682` | `596-652` | `:711-843` vs `:769-901` — **byte-identical CSS** |

### Steps

1. **`client/src/utils/postPermissions.ts`** — `getPostPermissions(post, {currentUserId,
   currentUserName, currentUserRole})` returning `{ isSuperAdmin, isOwnPost, canEdit, canDelete }`.
   Replace both inline blocks. (Takes `FeedCard.tsx:59-72` and `PostDetailView.tsx:48-63` verbatim.)
2. **`client/src/shared/FormattedContent.tsx`** — hashtag splitter. Use
   `color: 'var(--color-primary-text)'` (resolves to `#0055A4` light / `#60A5FA` dark —
   `index.css:12,152`). See reconciliation D7.
3. **`client/src/shared/PostPdfCard.tsx` + `.module.css`** — PDF block moved verbatim. Root accepts
   `className`; each parent keeps a **2-line local override** (`.pdfCard { margin-top: 10px;
   margin-bottom: 4px; }` in FeedCard, `12px/12px` in detail) so spacing is unchanged.
4. **`client/src/shared/QuotedPostCard.tsx` + `.module.css`** — same pattern: shared base, parent
   override class for the radius/padding/hover differences.
5. **`client/src/shared/DeletePostDialog.tsx` + `.module.css`** — CSS copied byte-identical (it's
   already identical in both files). Props: `{ postId, title?, onConfirm, onCancel }` where
   `onConfirm` closes+deletes (detail view additionally calls `onBack()`), and FeedCard keeps its
   `aria-labelledby` id via `postId`.
6. Remove the now-dead blocks + orphaned CSS from both files.

### Reconciliations

| # | Difference | Proposed | Note |
| --- | --- | --- | --- |
| D6 | Dialog icon color `var(--color-alert-red)` (Feed) vs `#DC2626` (detail) | Unify to `var(--color-alert-red, #EF4444)` | Both are the same red family; **visually near-identical but technically a 1-pixel-color change on one screen** → confirm. |
| D7 | Hashtag color `var(--color-primary-text)` vs `#0055A4` | Unify to the token | Token **is** `#0055A4` in light mode → detail view gains correct dark-mode blue. Strictly an improvement. |
| D8 | Delete dialog copy is identical; detail view calls `onBack()` after delete | Keep via `onConfirm` prop | No text change. |

### Boundaries

- **Do not extract the engagement bars** — they only look similar (different labels, `justLiked`
  animation, different markup). Extracting them would *introduce* risk, not remove it.
- Do not reorder any DOM: the shared components must slot into the exact same position.
- Keep `FeedCard`'s options menu, gallery, preview comment where they are (Phase 5 territory).

### Verification

- `npm run build && npm run lint`.
- `cmd /c ".\.agents\skills\impeccable\scripts\impeccable.cmd detect --json client/src/shared client/src/shared/FeedCard.tsx client/src/features/post/PostDetailView.tsx"`.
- Browser check at 393×852: feed card PDF/quote/delete flows **and** detail view PDF/quote/delete
  flows — screenshots before/after compared side by side.
- `git diff` review: only deletions + imports in the two parent files; new files are verbatim moves.

---

## Phase 3 — App.tsx overlay state + prop drilling — MEDIUM

**Objective**: make overlay state exclusive and shrink the 36/40-prop call sites.

1. Replace the 6 modal booleans (`isCreateOpen` L60, `editingPost` L61, `isCreateStoryOpen` L62,
   `isBrandSidebarOpen` L63, `isShowcaseOpen` L64, `isSavedPostsOpen` L65) + 5 nav IDs
   (`viewedProfileEmployee` L56, `activeCommentPostId` L66, `activeResharePostId` L67,
   `activeQuotePostId` L68, `selectedPostId` L70) with one discriminated union
   (`type OverlayState = { kind: 'none' } | { kind: 'create' } | { kind: 'story' } | …`) — makes
   "two overlays at once" unrepresentable.
2. Extract `useAuthSession()` (auth listener L147–194 incl. the inline 17-line fallback employee
   L157–173) and `useProfileUpdates()` (L296–354) into hooks.
3. Reduce `usePostActions` from 14 arguments (L87–115) to a single `{ posts, setPosts,
   setCommentsByPost, currentUser, … }` options object.
4. **Context for feed props**: introduce a `BulletinContext` (post actions + current user) consumed
   by `FeedCard`/`ProfilePage`/`SearchDirectoryPage`, removing the 13-prop passthrough restated at
   3 call sites (`TabRouter` L190–209, `SearchDirectoryPage` L395, `ProfilePage` L704–722).

**Boundaries**: no rendering/logic changes; `TabRouterProps` (30) and `OverlayHostProps` (~50) shrink
only by prop removal, not by behavior edits. Fix the two dead spots found: `TabRouter.tsx:82`
(`_previousTab` unused) + `TabRouter.tsx:263-268` (both branches equal) and `OverlayHost.tsx:213`
(`onSubmit={() => {}}` no-op) — verify they're truly dead first.

**Verification**: `npm run build && npm run lint`; full manual click-through (create bulletin, create
story, comment drawer, quote, reshare, saved drawer, sidebar, showcase, profile push/back).

---

## Phase 4 — bulletinService error contract + floating promises — MEDIUM/HIGH (correctness)

**Objective**: make failure visible and consistent; no unhandled rejections.

1. Document + enforce one policy: **repository throws; UI catches and toasts**. Convert the
   swallow-and-continue cases:
   - `deleteStory` `554-556` currently logs and continues → makes `App.tsx:118-133`'s
     try/catch-toast **dead code**. Make it rethrow (or remove the dead toast — pick one).
   - `toggleLike` `771-773`, `recordPostView` `902-904`, `deleteStorageFiles` `477-479`,
     `cleanupExpiredStories` `532-534` — decide per method: GC/storage cleanup may legitimately
     swallow; `toggleLike` should surface.
   - Distinguish "error" from "empty": `getComments` `669-671` returns `[]` on DB error,
     `getProfile` `929` returns `null`. Minimum viable fix: `console.error` + rethrow for comments,
     or an explicit `{ data, error }` return — keep it small: rethrow and let `App.tsx:247-262`
     catch.
2. Fix the 6 floating promises in `usePostActions.ts` (`56, 106, 140, 168, 209, 265`) — `await` or
   `.catch()` (note `updatePost` rethrows).
3. Wrap `OverlayHost.tsx:195-199`'s `await bulletinService.createPost(...)` in try/catch + toast —
   today a failed publish is an unhandled rejection with **no user feedback**.
4. Move the side effect out of the `setNotifications` updater in `useRealtimeSync.ts:199-203,
   352-356` (`saveStoredNotifications` runs twice under StrictMode).
5. Empty catch at `bulletinService.ts:97` → `console.warn` (matches sibling handlers).

**Verification**: dev tools network tab → simulate a failed insert (offline mode) and confirm the
toast appears instead of silent failure; `npm run build && npm run lint`.

---

## Phase 5 — State untangling + constant dedup — LOW/MEDIUM (**blocked on user WIP commit**)

**⚠️ Touches `CreateBulletinPage.*` and `CreateStoryModal.*`, which have uncommitted user changes.
Start only after that WIP is committed.**

1. **`CreateBulletinPage.tsx`** (22 `useState`): remove dead state — `isOfficial` (L49, write-only),
   `charCount` (L52, derived → compute from `content` or `useMemo`), `audienceScope` (L57, never
   persisted → either wire into `handleSubmit` L243-321 or delete the 61-line sheet L868-928),
   unreachable compression badge L611-621 (`compressedSizeFormatted` is never assigned). Replace
   `alert()` at L146/L188/L211 with the app's `Toast`. Merge the department/audience sheets
   (L804-865 ≡ L868-928) into one `OptionSheet`.
2. **`CreateStoryModal.tsx`** (18 `useState`): extract a `useStoryDraft()` reducer — the 9-setter
   reset (`L214-228`) becomes `reset()`. Deduplicate the photo/video `floatingControls` block
   (L679-719 ≡ L769-808) and the location pill (×3). Add `finally { setIsUploading(false) }` —
   early returns at L361/372/374 currently leave the spinner stuck. Fix `SESB_GRADIENTS` (L13-18)
   being re-encoded as a hard-coded if/else in `createTextCardImage` (L40-52).
3. **`ProfilePage.tsx`**: replace `profileData` + 7 mirrored `temp*` fields (L110-123) with one edit
   form state; the duplicated bio default (L114-117 ≡ L281-284) becomes a constant. Extract the
   224-line edit modal (L754-977) to `EditProfileModal.tsx` (also removes the 15-level nest).
4. **Constant dedup**: `client/src/constants/bulletin.ts` (or add to `types`/existing constants) for
   `'dept-ops'` ×8, `SESB_LOCATIONS` ×5 (currently **divergent**), fallback logo path, and a shared
   `<Avatar>`/`onError` helper replacing the 17 logo-fallback copies.
5. **`FeedCard.tsx`**: remove the 4 unused props (`_currentUserAvatar`, `_onReactionSelect`,
   `_onReshareToggle`, `_onQuotePost`) and the redundant `onReshareToggle`/`onReshareClick` pair —
   *after* confirming no call site passes them meaningfully.

**Verification**: `npm run build && npm run lint`, impeccable detect, browser pass at 393×852 over
create-bulletin, create-story, profile-edit flows.

---

## Execution order & dependencies

| Order | Phase | Risk | Depends on |
| --- | --- | --- | --- |
| 1 | **Phase 1** — row mappers | Low | — (conflict-free) |
| 2 | **Phase 2** — shared components | Low/Med (visual) | — (conflict-free) |
| 3 | **Phase 4** — error contract | Med (correctness) | Phase 1 (same file) |
| 4 | **Phase 3** — App overlay state | Med | Phase 1's `isAuthorSelf` optional |
| 5 | **Phase 5** — state/constants | Med | **user WIP committed** |

Phases 1+2 can run in parallel (different files). Phase 4 must follow Phase 1 (both edit
`bulletinService.ts`).

## Global gates (per AGENTS.md)

- Every phase: `cd client && npm run build && npm run lint`.
- UI-touching phases (2, 3, 5): impeccable `detect`, animation/motion audit (no layout-property
  transitions introduced), browser verification at **393×852**.
- No commits without explicit user instruction; never push.

## Open questions for the user

1. **D4** — remove the fabricated random story view counts (`bulletinService.ts:374`) now, or later?
2. **D5** — are 24h stories meant to expire at 24h or 48h? (three conflicting constants today)
3. **D6** — OK to unify the delete-dialog icon red?
4. Scope check — do you want all 5 phases, or stop after 1+2 (the highest-leverage pair)?
