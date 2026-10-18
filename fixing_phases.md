# SE Bulletin — Comprehensive Remediation & Fixing Phases

> **Document Status**: Active Implementation Roadmap  
> **Source**: Complete System Audit (State, UI/UX, Cloud Sync, Craft, Performance)

---

## Phase 1: High-Priority Functional Fixes & Cloud State Parity

- [x] **1.1 PostDetailView Missing Reply Bar Styles**:
  - Added `.bottomReplyBar`, `.replyInput`, and `.sendBtn` in `client/src/features/post/PostDetailView.module.css`.
  - Included sticky bottom positioning, `padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px))`, 16px iOS auto-zoom prevention font-size floor, and tactile compression.
- [x] **1.2 Fix Hardcoded User Names in Comment Prompts**:
  - `client/src/features/post/PostDetailView.tsx`: Replaced `"Write a comment as Mohd Irfan..."` with dynamic `placeholder={`Write a comment as ${currentUserName || 'colleague'}...`}`.
  - `client/src/features/post/CommentDrawer.tsx`: Dynamic `placeholder={`Write a comment as ${currentUser.name}...`}`.
- [x] **1.3 Fix Broken Notification Deep-Links (Orphaned Target IDs)**:
  - `client/src/services/notificationService.ts`: Re-mapped non-existent `targetPostId: 'post-1'` and `'post-safety-1'` to actual post IDs (`post-career-day-warning`, `post-our-brand`, `post-poll-idd-coffee`, `post-madani-link`, `post-esg-challenge`). Added automatic runtime healing in `getStoredNotifications()`.
- [x] **1.4 Fix Notification Deep-Link Navigation & Optimistic Comments**:
  - `client/src/hooks/usePostActions.ts`: Optimistic comment insertion with instant UI feedback and server reconciliation.
  - `client/src/App.tsx`: Notification clicks transition directly to target `PostDetailView` on home feed with smooth scroll.
- [x] **1.5 Realtime Listener Stale Closures & Self-Echo Prevention**:
  - `client/src/hooks/useRealtimeSync.ts`: Used `currentUserRef` snapshot to prevent channel churn.
  - Filtered out author's own posts, comments, and edits to eliminate self-echo toasts and duplicate notification entries.
- [x] **1.6 Realtime Rich Payload Mapping & Counter Integrity**:
  - `client/src/hooks/useRealtimeSync.ts`: Mapped all columns on UPDATE and preserved counter math integrity on self-actions.

---

## Phase 2: Craft Standards, Accessibility & Brand Fidelity

- [x] **2.1 Enforce Typography Minimum Floor (>= 12px)**:
  - Replaced all instances of `font-size: 10px;` and `font-size: 11px;` with `12px` floor:
    - `ProfilePage.module.css`: lines 1031, 1040, 1092
    - `InteractivePollCard.module.css`: line 197
    - `QuoteBulletinModal.module.css`: line 162
    - `PwaInstallPrompt.module.css`: line 92
- [x] **2.2 Accessibility: Reduced Motion Support**:
  - Added `@media (prefers-reduced-motion: reduce) { animation: none !important; transform: none !important; transition: none !important; }` to:
    - `Toast.module.css` (`toastSlideIn`)
    - `ImageViewerModal.module.css` (`fadeIn`)
    - `ErrorBoundary.module.css` (`cardFadeIn`)
    - `PostDetailView.module.css` (`slideIn`, `heartPop`, `backdropFadeIn`)
    - `StoryViewerModal.module.css` (`overlay`, `modalFrame`, `progressBarFill`)
- [x] **2.3 Mobile Touch: Sticky Hover Gating**:
  - Gated all interactive `:hover` rules in `@media (hover: hover) and (pointer: fine)` across:
    - `StoryViewerModal.module.css`: `.closeButton:hover`
    - `LoginPage.module.css`: `.forgotLink:hover`
- [x] **2.4 Brand Fidelity in ErrorBoundary**:
  - `ErrorBoundary.tsx`: Replaced generic `bolt` icon with official Sabah Electricity logo badge (`/sabah_electricity_logo.png`) and `/sesb_logo.png` fallback.
- [x] **2.5 Fix BrandSidebarDrawer User Identity**:
  - `BrandSidebarDrawer.tsx`: Dynamic `currentUser.avatarUrl` with fallback to `/sabah_electricity_logo.png`, and dynamic `currentUser.department` instead of hardcoded strings.
- [x] **2.6 Fix Broken Avatar Fallback in DesktopSidebar**:
  - `DesktopSidebar.tsx`: Replaced 404 `/default_avatar.png` with official `/sabah_electricity_logo.png`.
- [x] **2.7 Authentic SESB Divisions & Locations in ProfilePage**:
  - `ProfilePage.tsx`: Populated authentic statewide SESB divisions (`Information & Digital`, `Operations & Grid`, `Engineering & Distribution`, `Safety & Health (HSE)`, `Corporate Communications`, `Human Resources`, `Finance & Procurement`, `Chief Executive Officer (CEO) Office`) and locations (`Wisma SESB HQ, Kota Kinabalu`, `Bangunan KWASA`, `Tenom Pangi Hydro Power Station`, `Sepanggar Bay Power Station`, `Sandakan Regional Station`, `Tawau Regional Station`, `Labuan Regional Office`).
- [x] **2.8 Fix Artificial Counter Inflation in ProfilePage**:
  - `ProfilePage.tsx`: Enforced strict data integrity — `totalReactions` reduced strictly with `0` initial baseline: `userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0)`.

---

## Phase 3: Performance & Resource Optimization

- [x] **3.1 Deduplicate Modals in FeedCard**:
  - `FeedCard.tsx`: Removed local duplicate `ReshareBottomSheet` and `QuoteBulletinModal` instances from every `FeedCard`. All reshares now route directly through root-level modals in `OverlayHost.tsx`.
- [x] **3.2 Wrap Heavy List Operations in `useMemo`**:
  - `App.tsx`: Memoized `postCounts`, `filteredPosts`, `latestCeoPost`, and `feedPosts`.
  - `SearchDirectoryPage.tsx`: Memoized `allStaff`, `filteredEmployees`, `filteredPosts`, and `filteredDepartments`.
  - `TrendingSection.tsx`: Memoized `trendingPosts` array allocation, sorting, and slicing.
- [x] **3.3 Optimize Feed Image Loading**:
  - `FeedCard.tsx`: Added `loading="lazy"` and `decoding="async"` across single feed images, multi-image slides, and quoted post media.
- [x] **3.4 Upload Canvas Text Stories to Supabase Storage**:
  - `CreateStoryModal.tsx`: Canvas text stories convert to high-efficiency JPEG blobs and persist to Supabase Storage bucket (`bulletin-media`) via `uploadPhoto`.
- [x] **3.5 Linting Cleanliness**:
  - `client`: `oxlint` reports 0 errors across 62 files.
- [x] **3.6 Align Database Schema Default in Deployment Guide**:
  - `docs/PILOT_DEPLOYMENT_GUIDE.md`: Updated default for `reactions_breakdown` to `'{"laugh":0,"fire":0,"clap":0,"cry":0}'::jsonb`.
