import http from 'http';
import fs from 'fs';
import path from 'path';

// 1. Get targets from CDP
function getTargets() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/list', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  const targets = await getTargets();
  const pageTarget = targets.find(t => t.url.includes('3001') && t.type === 'page');
  if (!pageTarget) {
    console.error('Target page not found:', targets);
    process.exit(1);
  }

  console.log('Connecting to target:', pageTarget.title, pageTarget.webSocketDebuggerUrl);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise(resolve => ws.onopen = resolve);
  console.log('Connected to CDP session.');

  // Set device emulation: 393 x 852
  await send('Emulation.setDeviceMetricsOverride', {
    width: 393,
    height: 852,
    deviceScaleFactor: 2,
    mobile: true,
  });

  // Evaluate helper
  const evalExpr = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  };

  // Reload or ensure page is on latest code
  console.log('Reloading page...');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 1200));

  // Ensure Material Symbols font is loaded
  await evalExpr(`(async () => {
    try {
      await document.fonts.load('20px "Material Symbols Outlined"');
      await document.fonts.ready;
    } catch(e) {}
  })()`);
  await new Promise(r => setTimeout(r, 500));

  // Check 1: TopAppBar brand group
  const brandCheck = await evalExpr(`(() => {
    const brand = document.querySelector('header [aria-label*="Sabah Electricity Navigation Menu"]');
    const menuIcon = brand ? brand.querySelector('.material-symbols-outlined') : null;
    return {
      brandFound: Boolean(brand),
      menuIconText: menuIcon ? menuIcon.textContent.trim() : null
    };
  })()`);
  console.log('Check 1 (Top App Bar Brand):', brandCheck);

  // Click brand group to open sidebar drawer
  await evalExpr(`(() => {
    const brand = document.querySelector('header [aria-label*="Sabah Electricity Navigation Menu"]');
    if (brand) brand.click();
  })()`);
  await new Promise(r => setTimeout(r, 400));

  // Check 2: BrandSidebarDrawer DOM
  const drawerCheck = await evalExpr(`(() => {
    const drawer = document.querySelector('nav[aria-label="Navigation Menu"]');
    if (!drawer) return { open: false };
    const text = drawer.innerText;
    return {
      open: true,
      hasSavedPosts: text.includes('Saved Posts'),
      hasLogout: text.includes('Log Out'),
      hasDivision: text.includes('INFORMATION & DIGITAL')
    };
  })()`);
  console.log('Check 2 (Brand Sidebar Drawer):', drawerCheck);

  // Capture screenshot of Brand Sidebar Drawer
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  const shot1Path = path.join(process.cwd(), 'docs/screenshots/brand_sidebar_drawer.png');
  fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
  console.log('Saved ' + shot1Path);

  // Click Saved Posts inside the drawer
  await evalExpr(`(() => {
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Navigation Menu"] button'));
    const savedBtn = btns.find(b => b.innerText.includes('Saved Posts'));
    if (savedBtn) savedBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 400));

  // Check 3: SavedPostsDrawer
  const savedCheck = await evalExpr(`(() => {
    const sheet = document.querySelector('aside[aria-label="Saved Posts"]');
    if (!sheet) return { open: false };
    return {
      open: true,
      text: sheet.innerText.slice(0, 100)
    };
  })()`);
  console.log('Check 3 (Saved Posts Drawer):', savedCheck);

  // Capture screenshot of Saved Posts Drawer
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  const shot2Path = path.join(process.cwd(), 'docs/screenshots/saved_posts_drawer.png');
  fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
  console.log('Saved ' + shot2Path);

  // Close Saved Posts drawer by clicking close button
  const closeRes = await evalExpr(`(() => {
    const closeBtn = document.querySelector('aside[aria-label="Saved Posts"] button[aria-label="Close saved posts"]');
    if (closeBtn) {
      closeBtn.click();
      return { found: true };
    }
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    return { found: false, sentEscape: true };
  })()`);
  console.log('Close Saved Posts Drawer attempt:', closeRes);
  await new Promise(r => setTimeout(r, 500));

  // Switch to Profile Tab
  console.log('Navigating to Profile tab...');
  await evalExpr(`(() => {
    const tabs = Array.from(document.querySelectorAll('nav[aria-label="Bottom Navigation"] button'));
    const profileTab = tabs.find(b => b.innerText.includes('Profile'));
    if (profileTab) profileTab.click();
    window.scrollTo({ top: 0, behavior: 'instant' });
  })()`);
  await new Promise(r => setTimeout(r, 600));

  // Check 4: Profile Page
  const profileCheck = await evalExpr(`(() => {
    const cover = document.querySelector('img[alt="Corporate Cover Banner"]');
    const avatar = document.querySelector('img[alt*="Mohd Irfan"], img[class*="profileAvatar"]');
    const deptBadge = document.querySelector('[class*="deptBadge"]');
    const location = document.querySelector('[class*="empIdRow"]');
    const btns = Array.from(document.querySelectorAll('[class*="actionPillsRow"] button'));
    const editCoverBtn = document.querySelector('button[aria-label="Change Cover Photo"]');
    const editAvatarBtn = document.querySelector('button[aria-label="Change Profile Picture"]');
    return {
      coverSrc: cover ? cover.src : null,
      avatarSrc: avatar ? avatar.src : null,
      divisionText: deptBadge ? deptBadge.textContent.trim() : null,
      locationText: location ? location.textContent.trim() : null,
      buttonLabels: btns.map(b => b.textContent.trim()),
      hasEditCoverBtn: Boolean(editCoverBtn),
      hasEditAvatarBtn: Boolean(editAvatarBtn)
    };
  })()`);
  console.log('Check 4 (Profile Page Content):', profileCheck);

  // Capture screenshot of Profile Page
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  const shot3Path = path.join(process.cwd(), 'docs/screenshots/profile_clean_view.png');
  fs.writeFileSync(shot3Path, Buffer.from(shot3.data, 'base64'));
  console.log('Saved ' + shot3Path);

  // Click Edit Profile button
  await evalExpr(`(() => {
    const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Edit Profile'));
    if (editBtn) editBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 400));

  // Check 5: Edit Profile Modal
  const modalCheck = await evalExpr(`(() => {
    const modal = document.querySelector('[role="dialog"][aria-label="Edit Profile"]');
    if (!modal) return { open: false };
    const selects = Array.from(modal.querySelectorAll('select')).map(s => {
      const label = s.closest('[class*="fieldGroup"]')?.querySelector('label')?.textContent.trim();
      const options = Array.from(s.options).map(o => o.textContent.trim());
      return { label, options };
    });
    const inputs = Array.from(modal.querySelectorAll('input:not([type="file"])')).map(i => {
      const label = i.closest('[class*="fieldGroup"]')?.querySelector('label')?.textContent.trim();
      return { label, value: i.value };
    });
    const uploadBannerBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Upload Banner'));
    const quickAvatarBtn = modal.querySelector('button[title="Upload profile picture"]');
    return {
      open: true,
      selects,
      inputs,
      hasUploadBannerBtn: Boolean(uploadBannerBtn),
      hasQuickAvatarBtn: Boolean(quickAvatarBtn)
    };
  })()`);
  console.log('Check 5 (Edit Profile Modal):', JSON.stringify(modalCheck, null, 2));

  // Capture screenshot of Edit Profile Modal
  const shot4 = await send('Page.captureScreenshot', { format: 'png' });
  const shot4Path = path.join(process.cwd(), 'docs/screenshots/edit_profile_modal.png');
  fs.writeFileSync(shot4Path, Buffer.from(shot4.data, 'base64'));
  console.log('Saved ' + shot4Path);

  // Close modal
  await evalExpr(`(() => {
    const closeBtn = document.querySelector('button[title="Close modal"]');
    if (closeBtn) closeBtn.click();
  })()`);

  ws.close();
  console.log('Automated UI verification completed successfully!');
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
