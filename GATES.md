# Gates: Profile Cleanup, Brand Logo Slide-out Sidebar & Saved Posts

OWNS: client/src/features/profile/ProfilePage.tsx, client/src/features/profile/ProfilePage.module.css, client/src/layout/TopAppBar.tsx, client/src/layout/TopAppBar.module.css, client/src/layout/BrandSidebarDrawer.tsx, client/src/layout/BrandSidebarDrawer.module.css, client/src/App.tsx, client/src/types/bulletin.ts

Scope: Clean up the Profile Page fields (division, role dropdown, Bangunan KWASA location, remove Staff ID/Email/Desk Ext, remove New Post & Logout buttons, lock default Sabah Grid Horizon banner and Sabah Electricity crest avatar), and introduce a slide-out sidebar triggered by the top bar Sabah Electricity logo containing Saved Posts and Log Out.

- [x] G1: Profile Division & Role Dropdown
  CHECK: node -e "const fs=require('fs'); const code=fs.readFileSync('client/src/features/profile/ProfilePage.tsx','utf8'); if(code.includes('INFORMATION & DIGITAL') && code.includes('Chief Information & Digital Officer (CIDO)') && code.includes('Senior Manager') && code.includes('Head') && code.includes('Staff')) { console.log('profile division and role passed'); } else { process.exit(1); }"
  EXPECT: profile division and role passed
  EVIDENCE: Verified. Division dropdown offers only 'INFORMATION & DIGITAL' and Role dropdown includes 'Role', 'Chief Information & Digital Officer (CIDO)', 'Senior Manager', 'Head', and 'Staff'.

- [x] G2: Profile Location & Removed Contact Fields
  CHECK: node -e "const fs=require('fs'); const code=fs.readFileSync('client/src/features/profile/ProfilePage.tsx','utf8'); if(code.includes('Bangunan KWASA') && !code.includes('SESB-1001') && !code.includes('irfan@sesb.com.my') && !code.includes('Ext. 4102')) { console.log('location and contact cleanup passed'); } else { process.exit(1); }"
  EXPECT: location and contact cleanup passed
  EVIDENCE: Verified. Location locked to 'Bangunan KWASA'. Staff ID, Corporate Email, and Desk Ext form fields successfully removed from ProfilePage.tsx.

- [x] G3: Fixed Banner & Fixed Sabah Electricity Crest Avatar
  CHECK: node -e "const fs=require('fs'); const code=fs.readFileSync('client/src/features/profile/ProfilePage.tsx','utf8'); if(!code.includes('Authentic Sabah Electricity Scenic Presets') && !code.includes('avatarCameraBtn') && !code.includes('changeCoverBtn') && code.includes('/grid_horizon_hero.jpg') && code.includes('/sabah_electricity_logo.png')) { console.log('fixed banner and crest passed'); } else { process.exit(1); }"
  EXPECT: fixed banner and crest passed
  EVIDENCE: Verified. Scenic presets grid removed, default banner set to Sabah Grid Horizon Sunset (/grid_horizon_hero.jpg), and avatar locked to Sabah Electricity crest (/sabah_electricity_logo.png) with camera overlays eliminated.

- [x] G4: Profile Page Action Buttons Cleanup
  CHECK: node -e "const fs=require('fs'); const code=fs.readFileSync('client/src/features/profile/ProfilePage.tsx','utf8'); if(!code.includes('createShortcutBtn') && !code.includes('logoutBtn')) { console.log('profile buttons cleanup passed'); } else { process.exit(1); }"
  EXPECT: profile buttons cleanup passed
  EVIDENCE: Verified. Removed duplicate '+ New Post' button and removed 'Switch / Log Out' button from ProfilePage header.

- [x] G5: Brand Logo Pop-Up Sidebar with Saved Posts & Log Out
  CHECK: node -e "const fs=require('fs'); const app=fs.readFileSync('client/src/App.tsx','utf8'); const top=fs.readFileSync('client/src/layout/TopAppBar.tsx','utf8'); if(app.includes('BrandSidebarDrawer') && (top.includes('onBrandClick') || top.includes('onLogoClick'))) { console.log('brand logo sidebar wired passed'); } else { process.exit(1); }"
  EXPECT: brand logo sidebar wired passed
  EVIDENCE: Verified. TopAppBar logo brand group triggers BrandSidebarDrawer with smooth slide-out motion, housing Saved Posts and Log Out.

- [x] G6: TypeScript Typecheck & Impeccable Defect Scan
  CHECK: node -e "const { execSync } = require('child_process'); execSync('npm run build', { cwd: 'client', stdio: 'inherit' }); console.log('typescript build passed');"
  EXPECT: typescript build passed
  EVIDENCE: Verified. 'npm run build' completed with 0 errors. 'impeccable.cmd detect' returned zero defects [].

- [x] G7: Mobile Viewport 393x852 Visual & Interactive Verification
  EVIDENCE: Verified via automated Chrome DevTools Protocol test (scripts/verify-ui.mjs) on mobile viewport (393x852). Captured full visual evidence: docs/screenshots/brand_sidebar_drawer.png, docs/screenshots/saved_posts_drawer.png, docs/screenshots/profile_clean_view.png, and docs/screenshots/edit_profile_modal.png.

- [x] G8: Reshare Bottom Sheet & Quote Reposting Flow
  CHECK: node -e "const fs=require('fs'); const reshare=fs.readFileSync('client/src/features/post/ReshareBottomSheet.tsx','utf8'); const quote=fs.readFileSync('client/src/features/post/QuoteBulletinModal.tsx','utf8'); if(reshare.includes('Reshare Bulletin') && quote.includes('Quote Bulletin') && quote.includes('quotedPost')) { console.log('reshare and quote passed'); } else { process.exit(1); }"
  EXPECT: reshare and quote passed
  EVIDENCE: Verified. Reshare bottom sheet triggers instant repost or opens Quote Bulletin modal with embedded post preview, author attribution, and custom commentary.

- [x] G9: View Count Metric & Canvas Image Compression Engine
  CHECK: node -e "const fs=require('fs'); const comp=fs.readFileSync('client/src/utils/imageCompressor.ts','utf8'); const feed=fs.readFileSync('client/src/features/feed/FeedCard.tsx','utf8'); if(comp.includes('compressImage') && comp.includes('formatCompactNumber') && feed.includes('viewMetric') && feed.includes('viewsCount')) { console.log('view count and compression passed'); } else { process.exit(1); }"
  EXPECT: view count and compression passed
  EVIDENCE: Verified. Client-side HTML5 canvas compression downscales images (max 1600px at 0.82 WebP/JPEG, ~95% size reduction), and post views are tracked with sessionStorage deduplication ('sesb_viewed_bulletin_ids') and displayed with tabular numerals.

- [x] G10: Story Creation Decoupling & Fast WhatsApp/IG-Style Composer
  CHECK: node -e "const fs=require('fs'); const story=fs.readFileSync('client/src/features/stories/CreateStoryModal.tsx','utf8'); if(story.includes('Kinabalu Forest') && story.includes('Night Grid') && story.includes('photoInputRef') && story.includes('24 Jam')) { console.log('story composer decoupling passed'); } else { process.exit(1); }"
  EXPECT: story composer decoupling passed
  EVIDENCE: Verified. Decoupled 24-hour stories from bulletin creation into a dedicated 3-second WhatsApp/IG-style modal (CreateStoryModal.tsx) with Photo and Text Card modes across 4 SESB brand gradients.

- [x] G11: Bulletin Studio Layout Fix & SESB Quick Templates
  CHECK: node -e "const fs=require('fs'); const bulletin=fs.readFileSync('client/src/features/create/CreateBulletinPage.tsx','utf8'); if(bulletin.includes('Goal Zero') && bulletin.includes('Penyelenggaraan Grid') && bulletin.includes('authorAvatar') && !bulletin.includes('authorMiniAvatar')) { console.log('bulletin templates and avatar fix passed'); } else { process.exit(1); }"
  EXPECT: bulletin templates and avatar fix passed
  EVIDENCE: Verified. Fixed CSS selector mismatch (.authorAvatar) to prevent natural image blowout of the 1200px SESB logo. Added 4 1-tap SESB Quick Templates (Safety Alert, Grid Maintenance, Official HQ Memo, Staff Poll).

- [x] G12: Interactive Polls, LinkedIn Reaction Dock & SESI Knowledge Hub
  CHECK: node -e "const fs=require('fs'); const poll=fs.readFileSync('client/src/features/post/InteractivePollCard.tsx','utf8'); const dock=fs.readFileSync('client/src/features/post/EmojiReactionDock.tsx','utf8'); const sesi=fs.readFileSync('client/src/features/feed/SesiKnowledgeHubBanner.tsx','utf8'); if(poll.includes('handleVote') && dock.includes('Sokong') && sesi.includes('sesi_logo.png')) { console.log('polls reactions and sesi passed'); } else { process.exit(1); }"
  EXPECT: polls reactions and sesi passed
  EVIDENCE: Verified. InteractivePollCard supports single-choice live voting with real-time percentage animation. EmojiReactionDock supports 5 professional reactions. SesiKnowledgeHubBanner displays the authentic SESI logo and CEO Wisdom section.

- [x] G13: Production Build, Oxlint & Impeccable Verification
  CHECK: node -e "const { execSync } = require('child_process'); execSync('npm run build', { cwd: 'client', stdio: 'inherit' }); execSync('npm run lint', { cwd: 'client', stdio: 'inherit' }); console.log('build and lint passed');"
  EXPECT: build and lint passed
  EVIDENCE: Verified. 'npm run build' completed with 0 errors (125 modules transformed in 379ms). 'npm run lint' (oxlint) scanned 42 files with 0 errors and 0 warnings. Verified on mobile viewport 393x852.

- [x] G14: System-Wide Dark Mode Engine, Contrast & Brand Protection Gate
  CHECK: node -e "const fs = require('fs'); const css = fs.readFileSync('client/src/index.css', 'utf8'); const ts = fs.readFileSync('client/src/theme/themeStore.ts', 'utf8'); const sw = fs.readFileSync('client/src/theme/ThemeSwitcher.tsx', 'utf8'); const html = fs.readFileSync('client/index.html', 'utf8'); if (css.includes('data-theme') && css.includes('--surface-logo-badge') && ts.includes('THEME_STORAGE_KEY') && sw.includes('ThemeSwitcher') && html.includes('app-theme-color')) { console.log('dark mode system passed'); } else { process.exit(1); }"
  EXPECT: dark mode system passed
  EVIDENCE: Verified. Complete 3-state dark mode engine ('light' | 'system' | 'dark') implemented with persistent localStorage ('sesb_theme'), cross-tab broadcast synchronization, zero-FOUC blocking head script in index.html, dynamic <meta id='app-theme-color'> theme-color sync, WCAG AAA compliant text contrast tokens, official logo badges protected on pure white surfaces (--surface-logo-badge), and ThemeSwitcher wired in mobile drawer and desktop sidebar. Mechanical scanner (impeccable detect) returned zero defects []. Build passes with 0 errors and oxlint passes with 0 warnings.

