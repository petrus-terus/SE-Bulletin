# Gates: Profile Cleanup, Brand Logo Slide-out Sidebar & Saved Posts

OWNS: client/src/components/ProfilePage.tsx, client/src/components/ProfilePage.module.css, client/src/components/TopAppBar.tsx, client/src/components/TopAppBar.module.css, client/src/components/BrandSidebarDrawer.tsx, client/src/components/BrandSidebarDrawer.module.css, client/src/App.tsx, client/src/types/bulletin.ts

Scope: Clean up the Profile Page fields (division, role dropdown, Bangunan KWASA location, remove Staff ID/Email/Desk Ext, remove New Post & Logout buttons, lock default Sabah Grid Horizon banner and Sabah Electricity crest avatar), and introduce a slide-out sidebar triggered by the top bar Sabah Electricity logo containing Saved Posts and Log Out.

- [x] G1: Profile Division & Role Dropdown
  CHECK: node -e "const fs=require('fs'); const code=fs.readFileSync('client/src/components/ProfilePage.tsx','utf8'); if(code.includes('INFORMATION & DIGITAL') && code.includes('Chief Information & Digital Officer (CIDO)') && code.includes('Senior Manager') && code.includes('Head') && code.includes('Staff')) { console.log('profile division and role passed'); } else { process.exit(1); }"
  EXPECT: profile division and role passed
  EVIDENCE: Verified. Division dropdown offers only 'INFORMATION & DIGITAL' and Role dropdown includes 'Role', 'Chief Information & Digital Officer (CIDO)', 'Senior Manager', 'Head', and 'Staff'.

- [x] G2: Profile Location & Removed Contact Fields
  CHECK: node -e "const fs=require('fs'); const code=fs.readFileSync('client/src/components/ProfilePage.tsx','utf8'); if(code.includes('Bangunan KWASA') && !code.includes('SESB-1001') && !code.includes('irfan@sesb.com.my') && !code.includes('Ext. 4102')) { console.log('location and contact cleanup passed'); } else { process.exit(1); }"
  EXPECT: location and contact cleanup passed
  EVIDENCE: Verified. Location locked to 'Bangunan KWASA'. Staff ID, Corporate Email, and Desk Ext form fields successfully removed from ProfilePage.tsx.

- [x] G3: Fixed Banner & Fixed Sabah Electricity Crest Avatar
  CHECK: node -e "const fs=require('fs'); const code=fs.readFileSync('client/src/components/ProfilePage.tsx','utf8'); if(!code.includes('Authentic Sabah Electricity Scenic Presets') && !code.includes('avatarCameraBtn') && !code.includes('changeCoverBtn') && code.includes('/grid_horizon_hero.jpg') && code.includes('/sabah_electricity_logo.png')) { console.log('fixed banner and crest passed'); } else { process.exit(1); }"
  EXPECT: fixed banner and crest passed
  EVIDENCE: Verified. Scenic presets grid removed, default banner set to Sabah Grid Horizon Sunset (/grid_horizon_hero.jpg), and avatar locked to Sabah Electricity crest (/sabah_electricity_logo.png) with camera overlays eliminated.

- [x] G4: Profile Page Action Buttons Cleanup
  CHECK: node -e "const fs=require('fs'); const code=fs.readFileSync('client/src/components/ProfilePage.tsx','utf8'); if(!code.includes('createShortcutBtn') && !code.includes('logoutBtn')) { console.log('profile buttons cleanup passed'); } else { process.exit(1); }"
  EXPECT: profile buttons cleanup passed
  EVIDENCE: Verified. Removed duplicate '+ New Post' button and removed 'Switch / Log Out' button from ProfilePage header.

- [x] G5: Brand Logo Pop-Up Sidebar with Saved Posts & Log Out
  CHECK: node -e "const fs=require('fs'); const app=fs.readFileSync('client/src/App.tsx','utf8'); const top=fs.readFileSync('client/src/components/TopAppBar.tsx','utf8'); if(app.includes('BrandSidebarDrawer') && (top.includes('onBrandClick') || top.includes('onLogoClick'))) { console.log('brand logo sidebar wired passed'); } else { process.exit(1); }"
  EXPECT: brand logo sidebar wired passed
  EVIDENCE: Verified. TopAppBar logo brand group triggers BrandSidebarDrawer with smooth slide-out motion, housing Saved Posts and Log Out.

- [x] G6: TypeScript Typecheck & Impeccable Defect Scan
  CHECK: node -e "const { execSync } = require('child_process'); execSync('npm run build', { cwd: 'client', stdio: 'inherit' }); console.log('typescript build passed');"
  EXPECT: typescript build passed
  EVIDENCE: Verified. 'npm run build' completed with 0 errors. 'impeccable.cmd detect' returned zero defects [].

- [x] G7: Mobile Viewport 393x852 Visual & Interactive Verification
  EVIDENCE: Verified via automated Chrome DevTools Protocol test (scripts/verify-ui.mjs) on mobile viewport (393x852). Captured full visual evidence: brand_sidebar_drawer.png, saved_posts_drawer.png, profile_clean_view.png, and edit_profile_modal.png.
