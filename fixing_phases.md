# SE Bulletin — Comprehensive Remediation & Fixing Phases

> **Document Status**: Active Implementation Roadmap  
> **Source**: Complete System Audit (State, UI/UX, Cloud Sync, Craft, Performance)

---

## Phase 1: High-Priority Functional Fixes & Cloud State Parity

- [ ] **1.1 PostDetailView Missing Reply Bar Styles**:
  - Add `.bottomReplyBar`, `.replyInput`, and `.sendBtn` to `client/src/components/PostDetailView.module.css`.
  - Include fixed/sticky positioning at bottom, `padding-bottom: calc(12px + var(--safe-area-bottom, env(safe-area-inset-bottom)))`, 44px min-touch target, and frosted glass background.
- [ ] **1.2 Fix Hardcoded User Names in Comment Prompts**:
  - `client/src/components/PostDetailView.tsx:542`: Replace `"Write a comment as Mohd Irfan..."` with dynamic `placeholder={`Write a comment as ${currentUserName || 'colleague'}...`}`.
  - `client/src/components/CommentDrawer.tsx:148`: Replace `"Write a comment as Mohd Irfan..."` with dynamic `placeholder={`Write a comment as ${currentUser.name || 'colleague'}...`}`.
- [ ] **1.3 Fix Broken Notification Deep-Links (Orphaned Target IDs)**:
  - `client/src/services/notificationService.ts`: Replace non-existent `targetPostId: 'post-1'` and `'post-safety-1'` with actual post IDs from `INITIAL_POSTS` (`post-career-day-warning`, `post-our-brand`, `post-poll-idd-coffee`, `post-madani-link`).
- [ ] **1.4 Fix Orphaned Comments in `commentsByPost`**:
  - `client/src/App.tsx:133-178`: Re-map seed comments from `'post-101'`, `'post-102'`, `'post-103'` to active post IDs (`post-career-day-warning`, `post-our-brand`, `post-poll-idd-coffee`).
- [ ] **1.5 Realtime Listener Stale Closures & Self-Echo Prevention**:
  - `client/src/App.tsx`: Use `useRef` snapshots for `postsRef` and `currentUserRef` so the long-lived Realtime listener accesses the latest state without triggering channel resubscription loops.
  - Filter out events authored by the current user to prevent duplicate toasts and self-notifications.
- [ ] **1.6 Realtime Incomplete Payload in `setSelectedPostForDetail`**:
  - `client/src/App.tsx:428-453`: Ensure `setSelectedPostForDetail` maps all rich columns on UPDATE (`viewsCount`, `resharesCount`, `pdfUrl`, `pdfName`, `pdfSize`, `departmentName`, `departmentId`, `departmentColor`, `officialNotice`).

---

## Phase 2: Craft Standards, Accessibility & Brand Fidelity

- [ ] **2.1 Enforce Typography Minimum Floor (>= 12px)**:
  - Replace all 16 instances of `font-size: 10px;` and `font-size: 11px;` with `12px` (`var(--font-size-xs)`):
    - `ProfilePage.module.css:1049, 1058, 1110`
    - `InteractivePollCard.module.css:196`
    - `BrandSidebarDrawer.module.css:91, 185, 260, 316, 322`
    - `SavedPostsDrawer.module.css:219, 270, 285`
    - `QuoteBulletinModal.module.css:161`
    - `PwaInstallPrompt.module.css:92`
    - `KinabaluSkylineHero.module.css:400`
    - `ErrorBoundary.module.css:142`
- [ ] **2.2 Accessibility: Reduced Motion Support**:
  - Add `@media (prefers-reduced-motion: reduce) { animation: none; transform: none; }` to:
    - `Toast.module.css` (`toastSlideIn`)
    - `ImageViewerModal.module.css` (`fadeIn`)
    - `ErrorBoundary.module.css` (`cardFadeIn`)
    - `PostDetailView.module.css` (`slideIn`, `heartPop`, `backdropFadeIn`)
- [ ] **2.3 Mobile Touch: Sticky Hover Gating**:
  - Wrap ungated `:hover` rules in `@media (hover: hover) and (pointer: fine)` in:
    - `index.css:196, 221` (`.btn-accent:hover`, `.btn-primary:hover`)
    - `StoryViewerModal.module.css:118` (`.closeButton:hover`)
    - `LoginPage.module.css:281` (`.forgotLink:hover`)
- [ ] **2.4 Brand Fidelity in ErrorBoundary**:
  - `ErrorBoundary.tsx:52`: Replace generic `bolt` icon with official Sabah Electricity logo badge (`/sabah_electricity_logo.png`) and `onError` fallback.
- [ ] **2.5 Fix BrandSidebarDrawer User Identity**:
  - `BrandSidebarDrawer.tsx:101, 112`: Use dynamic `currentUser.avatarUrl` instead of hardcoded `/sabah_electricity_logo.png`, and dynamic `currentUser.department` instead of hardcoded `INFORMATION & DIGITAL`.
- [ ] **2.6 Fix Broken Avatar Fallback in DesktopSidebar**:
  - `DesktopSidebar.tsx:112`: Replace 404 `/default_avatar.png` with `/user_face.png`.
- [ ] **2.7 Authentic SESB Divisions & Locations in ProfilePage**:
  - `ProfilePage.tsx:38-48, 80-85, 867-893`: Populate `SESB_DIVISIONS` and `SESB_LOCATIONS` with authentic SESB departments (Operations, HSE, HR, Engineering, Corporate Comms, Finance, IT) and stations (Wisma SESB HQ, Tenom Pangi Hydro, Sepanggar Power Station, Sandakan, Tawau).
- [ ] **2.8 Fix Artificial Counter Inflation in ProfilePage**:
  - `ProfilePage.tsx:165-168`: Fix `totalReactions` reduce math to `userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0)`.

---

## Phase 3: Performance & Resource Optimization

- [ ] **3.1 Deduplicate Modals in FeedCard**:
  - `FeedCard.tsx:676-692`: Remove local `ReshareBottomSheet` and `QuoteBulletinModal` instances from every `FeedCard`. Route actions through the root-level modals in `App.tsx`.
- [ ] **3.2 Wrap Heavy List Operations in `useMemo`**:
  - `App.tsx`: Memoize `postCounts`, `filteredPosts`, `latestCeoPost`, and `feedPosts`.
  - `SearchDirectoryPage.tsx`: Memoize `allStaff`, `filteredEmployees`, `filteredPosts`, and `filteredDepartments`.
  - `TrendingSection.tsx`: Memoize `trendingPosts` sorting.
  - `KinabaluSkylineHero.tsx`: Memoize SVG coordinate scaling and chart price points.
- [ ] **3.3 Optimize Feed Image Loading**:
  - `FeedCard.tsx`: Add `loading="lazy"` and `decoding="async"` to feed card images and media slides.
- [ ] **3.4 Upload Canvas Text Stories to Supabase Storage**:
  - `CreateStoryModal.tsx`: Convert canvas data to Blob/File and upload through `bulletinService.uploadPhoto` instead of sending huge base64 strings to DB.
- [ ] **3.5 Fix `oxlint` Unused Variable Warning**:
  - `bulletinService.ts:739`: Change `catch (e)` to `catch`.
- [ ] **3.6 Align Database Schema Default in Deployment Guide**:
  - `docs/PILOT_DEPLOYMENT_GUIDE.md:83`: Update default for `reactions_breakdown` to `'{"laugh":0,"fire":0,"clap":0,"cry":0}'`.
