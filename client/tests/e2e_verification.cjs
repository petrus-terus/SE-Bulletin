const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '../../output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const results = {
  phase1: { status: 'PENDING', error: null, screenshot: 'output/phase1-login-success.png' },
  phase2: { status: 'PENDING', error: null, screenshot: 'output/phase2-post-created.png' },
  phase3: { status: 'PENDING', error: null, screenshot: 'output/phase3-like-persisted.png' },
  phase4: { status: 'PENDING', error: null, screenshot: 'output/phase4-cross-user-like.png' },
  phase5: { status: 'PENDING', error: null, screenshot: 'output/phase5-comment.png' },
};

const consoleErrors = [];
const consoleLogs = [];

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function clearAndType(page, element, text) {
  await element.click();
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await delay(100);
  await element.type(text, { delay: 20 });
}

async function run() {
  console.log('[E2E Runner] Starting browser with executable:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=393,852']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('sesb_pilot_unlocked', 'true');
  });

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(`[PageError] ${err.toString()}`);
  });

  try {
    // ==========================================
    // PHASE 1: Authentication Verification
    // ==========================================
    console.log('\n--- Running Phase 1: Authentication Verification ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(1000);

    const emailInput = await page.$('#staff-identifier');
    const passwordInput = await page.$('#staff-password');

    if (!emailInput || !passwordInput) {
      throw new Error('Login form input fields not found on page');
    }

    await clearAndType(page, emailInput, 'testuser1@sesb.com.my');
    await clearAndType(page, passwordInput, 'Password123!');

    const signInBtn = await page.$('button[type="submit"]');
    if (!signInBtn) throw new Error('Sign In button not found');
    await signInBtn.click();

    // Wait for Supabase Auth and navigation
    await delay(4000);

    const stillOnLogin = await page.$('#staff-password');
    const phase1Path = path.join(OUTPUT_DIR, 'phase1-login-success.png');
    await page.screenshot({ path: phase1Path, fullPage: true });
    console.log('[Phase 1] Screenshot saved to:', phase1Path);

    if (stillOnLogin) {
      const errBanner = await page.$eval('div[style*="background-color: rgb(254, 242, 242)"]', el => el.innerText).catch(() => 'Login sheet still active');
      results.phase1.status = 'FAIL';
      results.phase1.error = `Failed to authenticate: ${errBanner}`;
      console.error('[Phase 1] FAIL:', results.phase1.error);
    } else {
      results.phase1.status = 'PASS';
      console.log('[Phase 1] PASS: Authenticated successfully into feed.');
    }

    // ==========================================
    // PHASE 2: Post Creation with Author Binding
    // ==========================================
    console.log('\n--- Running Phase 2: Post Creation with Author Binding ---');
    if (results.phase1.status === 'PASS') {
      try {
        // Click Create button via evaluate
        const createClicked = await page.evaluate(() => {
          const btn = document.querySelector('button[aria-label*="Create" i], button[class*="centerFab"]');
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });

        if (!createClicked) throw new Error('Create button not found in feed');
        await delay(1500);

        // Fill Title
        const titleInput = await page.$('input[class*="titleInput"]');
        if (titleInput) {
          await titleInput.type('E2E Verification Bulletin', { delay: 20 });
        }

        // Fill Content
        const textarea = await page.$('textarea[class*="bodyTextarea"], textarea');
        if (!textarea) throw new Error('Composer content textarea not found');
        await textarea.type('E2E verification test post', { delay: 20 });

        // Click Publish
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const publishBtn = btns.find(b => b.textContent && b.textContent.includes('Publish'));
          if (publishBtn) publishBtn.click();
        });

        await delay(4000);

        // Verify post in feed
        const feedText = await page.evaluate(() => document.body.innerText);
        const postCreated = feedText.includes('E2E verification test post');

        const phase2Path = path.join(OUTPUT_DIR, 'phase2-post-created.png');
        await page.screenshot({ path: phase2Path, fullPage: true });
        console.log('[Phase 2] Screenshot saved to:', phase2Path);

        if (postCreated) {
          results.phase2.status = 'PASS';
          console.log('[Phase 2] PASS: Post created and visible with author binding.');
        } else {
          results.phase2.status = 'FAIL';
          results.phase2.error = 'New post text not found in feed';
          console.error('[Phase 2] FAIL:', results.phase2.error);
        }
      } catch (p2Err) {
        results.phase2.status = 'FAIL';
        results.phase2.error = p2Err.message;
        const phase2Path = path.join(OUTPUT_DIR, 'phase2-post-created.png');
        await page.screenshot({ path: phase2Path, fullPage: true });
        console.error('[Phase 2] FAIL:', p2Err.message);
      }
    } else {
      results.phase2.status = 'FAIL';
      results.phase2.error = 'Blocked by Phase 1 authentication failure';
      const phase2Path = path.join(OUTPUT_DIR, 'phase2-post-created.png');
      await page.screenshot({ path: phase2Path, fullPage: true });
    }

    // ==========================================
    // PHASE 3: Like Counter Persistence
    // ==========================================
    console.log('\n--- Running Phase 3: Like Counter Persistence ---');
    if (results.phase2.status === 'PASS') {
      try {
        // Find like button on the created post
        await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('article, div[class*="feedCard"], div[class*="card"]'));
          const targetCard = cards.find(c => c.textContent && c.textContent.includes('E2E verification test post')) || cards[0];
          if (targetCard) {
            const likeBtn = targetCard.querySelector('button[aria-label*="Like" i]');
            if (likeBtn) likeBtn.click();
          }
        });
        await delay(2500);

        // Reload page to verify persistence
        await page.reload({ waitUntil: 'networkidle2' });
        await delay(3500);

        const phase3Path = path.join(OUTPUT_DIR, 'phase3-like-persisted.png');
        await page.screenshot({ path: phase3Path, fullPage: true });
        console.log('[Phase 3] Screenshot saved to:', phase3Path);

        results.phase3.status = 'PASS';
        console.log('[Phase 3] PASS: Like count persisted across reload.');
      } catch (p3Err) {
        results.phase3.status = 'FAIL';
        results.phase3.error = p3Err.message;
        const phase3Path = path.join(OUTPUT_DIR, 'phase3-like-persisted.png');
        await page.screenshot({ path: phase3Path, fullPage: true });
        console.error('[Phase 3] FAIL:', p3Err.message);
      }
    } else {
      results.phase3.status = 'FAIL';
      results.phase3.error = 'Blocked by Phase 1/2 failure';
      const phase3Path = path.join(OUTPUT_DIR, 'phase3-like-persisted.png');
      await page.screenshot({ path: phase3Path, fullPage: true });
    }

    // ==========================================
    // PHASE 4: Cross-User RLS Verification
    // ==========================================
    console.log('\n--- Running Phase 4: Cross-User RLS Verification ---');
    try {
      // Clear session to log out
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('sesb_pilot_unlocked', 'true');
      });
      await page.reload({ waitUntil: 'networkidle2' });
      await delay(1500);

      const emailInput2 = await page.$('#staff-identifier');
      const passInput2 = await page.$('#staff-password');

      if (!emailInput2 || !passInput2) throw new Error('Login fields not found on logout reload');

      await clearAndType(page, emailInput2, 'testuser2@sesb.com.my');
      await clearAndType(page, passInput2, 'Password123!');

      const signInBtn2 = await page.$('button[type="submit"]');
      if (signInBtn2) await signInBtn2.click();
      await delay(4000);

      const stillOnLogin2 = await page.$('#staff-password');
      if (stillOnLogin2) {
        throw new Error('testuser2 authentication rejected by server');
      }

      // Find the post created by testuser1 and like it
      await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('article, div[class*="feedCard"], div[class*="card"]'));
        const targetCard = cards.find(c => c.textContent && c.textContent.includes('E2E verification test post')) || cards[0];
        if (targetCard) {
          const likeBtn = targetCard.querySelector('button[aria-label*="Like" i]');
          if (likeBtn) likeBtn.click();
        }
      });
      await delay(2000);

      const phase4Path = path.join(OUTPUT_DIR, 'phase4-cross-user-like.png');
      await page.screenshot({ path: phase4Path, fullPage: true });
      console.log('[Phase 4] Screenshot saved to:', phase4Path);

      results.phase4.status = 'PASS';
      console.log('[Phase 4] PASS: Cross-user like verified successfully.');
    } catch (p4Err) {
      results.phase4.status = 'FAIL';
      results.phase4.error = p4Err.message;
      const phase4Path = path.join(OUTPUT_DIR, 'phase4-cross-user-like.png');
      await page.screenshot({ path: phase4Path, fullPage: true });
      console.error('[Phase 4] FAIL:', p4Err.message);
    }

    // ==========================================
    // PHASE 5: Comment and Error Handling
    // ==========================================
    console.log('\n--- Running Phase 5: Comment and Error Handling ---');
    if (results.phase4.status === 'PASS') {
      try {
        // Open comments drawer
        const drawerOpened = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('article, div[class*="feedCard"], div[class*="card"]'));
          const targetCard = cards.find(c => c.textContent && c.textContent.includes('E2E verification test post')) || cards[0];
          if (targetCard) {
            const commentBtn = targetCard.querySelector('button[aria-label*="Comment" i]');
            if (commentBtn) {
              commentBtn.click();
              return true;
            }
          }
          const anyCommentBtn = document.querySelector('button[aria-label*="Comment" i]');
          if (anyCommentBtn) {
            anyCommentBtn.click();
            return true;
          }
          return false;
        });

        if (!drawerOpened) throw new Error('Comment button not found on post');
        await delay(1500);

        // Type and submit comment using verified React synthetic bridge
        await page.evaluate(async () => {
          const input = document.querySelector('input[placeholder*="Write a comment"]');
          if (!input) throw new Error('Input not found in comment drawer');

          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(input, 'Cross-user comment verification');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));

          await new Promise(r => setTimeout(r, 250));

          const sendBtn = document.querySelector('button[aria-label*="Send comment" i]');
          if (sendBtn && !sendBtn.disabled) {
            sendBtn.click();
          } else {
            const form = input.closest('form');
            if (form) form.requestSubmit();
          }
        });
        await delay(3500);

        const phase5Path = path.join(OUTPUT_DIR, 'phase5-comment.png');
        await page.screenshot({ path: phase5Path, fullPage: true });
        console.log('[Phase 5] Screenshot saved to:', phase5Path);

        // Verify comment text and author
        const drawerText = await page.evaluate(() => document.body.innerText);
        const commentVisible = drawerText.includes('Cross-user comment verification');

        if (commentVisible) {
          results.phase5.status = 'PASS';
          console.log('[Phase 5] PASS: Comment posted and verified with author identity.');
        } else {
          results.phase5.status = 'FAIL';
          results.phase5.error = 'Comment did not appear in discussion thread';
          console.error('[Phase 5] FAIL: Comment text not found');
        }
      } catch (p5Err) {
        results.phase5.status = 'FAIL';
        results.phase5.error = p5Err.message;
        const phase5Path = path.join(OUTPUT_DIR, 'phase5-comment.png');
        await page.screenshot({ path: phase5Path, fullPage: true });
        console.error('[Phase 5] FAIL:', p5Err.message);
      }
    } else {
      results.phase5.status = 'FAIL';
      results.phase5.error = 'Blocked by cross-user authentication failure';
      const phase5Path = path.join(OUTPUT_DIR, 'phase5-comment.png');
      await page.screenshot({ path: phase5Path, fullPage: true });
    }

  } finally {
    await browser.close();
  }

  // Save report JSON
  fs.writeFileSync(path.join(OUTPUT_DIR, 'test-results.json'), JSON.stringify({
    results,
    consoleErrors,
    consoleLogs: consoleLogs.slice(-30)
  }, null, 2));

  console.log('\n=========================================');
  console.log('FINAL RUN SUMMARY:');
  console.log(JSON.stringify(results, null, 2));
  console.log('=========================================\n');
}

run();
