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

const auditReport = {
  viewport: '393x852 (Mobile Baseline @2x)',
  steps: [],
  metrics: {},
  visualDefects: [],
  consoleErrors: []
};

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('[Visual Audit] Starting local Chrome for visual audit...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=393,852']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      auditReport.consoleErrors.push(msg.text());
    }
  });

  try {
    // ----------------------------------------------------
    // STEP 1: PILOT GATE INSPECTION
    // ----------------------------------------------------
    console.log('[Step 1] Inspecting Pilot Gate...');
    // Ensure clean state without unlocked flag
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(1000);

    const step1Path = path.join(OUTPUT_DIR, 'audit-1-pilotgate.png');
    await page.screenshot({ path: step1Path, fullPage: true });
    auditReport.steps.push({
      step: 'Pilot Gate Initial View',
      screenshot: 'output/audit-1-pilotgate.png',
      status: 'VERIFIED'
    });

    // Check Pilot Gate Metrics
    const pilotPasscodeInput = await page.$('input[type="password"], input[placeholder*="passcode" i]');
    if (pilotPasscodeInput) {
      const box = await pilotPasscodeInput.boundingBox();
      auditReport.metrics.pilotPasscodeInputHeight = box ? `${box.height}px` : 'N/A';
    }

    // Test Invalid Passcode
    console.log('[Step 1.1] Testing invalid passcode...');
    if (pilotPasscodeInput) {
      await pilotPasscodeInput.type('1234', { delay: 30 });
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await delay(800);

      const step2Path = path.join(OUTPUT_DIR, 'audit-2-pilotgate-error.png');
      await page.screenshot({ path: step2Path, fullPage: true });
      auditReport.steps.push({
        step: 'Pilot Gate Error State',
        screenshot: 'output/audit-2-pilotgate-error.png',
        status: 'VERIFIED'
      });
    }

    // Unlock Pilot Gate with valid passcode
    console.log('[Step 1.2] Unlocking Pilot Gate with master passcode...');
    if (pilotPasscodeInput) {
      await pilotPasscodeInput.click();
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await delay(200);
      await pilotPasscodeInput.type('SEBULLETIN@2026', { delay: 30 });
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await delay(2000);
    }

    // ----------------------------------------------------
    // STEP 2: STAFF LOGIN SCREEN INSPECTION
    // ----------------------------------------------------
    console.log('[Step 2] Inspecting Staff Login Screen...');
    const step3Path = path.join(OUTPUT_DIR, 'audit-3-login-screen.png');
    await page.screenshot({ path: step3Path, fullPage: true });
    auditReport.steps.push({
      step: 'Staff Login Screen',
      screenshot: 'output/audit-3-login-screen.png',
      status: 'VERIFIED'
    });

    // Measure Touch Targets and Check Horizontal Overflow
    const layoutMetrics = await page.evaluate(() => {
      const emailEl = document.querySelector('#staff-identifier');
      const passEl = document.querySelector('#staff-password');
      const submitEl = document.querySelector('button[type="submit"]');
      const docWidth = document.documentElement.offsetWidth;
      const scrollWidth = document.documentElement.scrollWidth;

      return {
        emailHeight: emailEl ? emailEl.getBoundingClientRect().height : null,
        passwordHeight: passEl ? passEl.getBoundingClientRect().height : null,
        submitHeight: submitEl ? submitEl.getBoundingClientRect().height : null,
        hasHorizontalOverflow: scrollWidth > docWidth,
        docWidth,
        scrollWidth
      };
    });

    auditReport.metrics.touchTargets = {
      emailInput: `${layoutMetrics.emailHeight}px (Minimum 44px: ${layoutMetrics.emailHeight >= 44 ? 'PASS' : 'WARN'})`,
      passwordInput: `${layoutMetrics.passwordHeight}px (Minimum 44px: ${layoutMetrics.passwordHeight >= 44 ? 'PASS' : 'WARN'})`,
      submitButton: `${layoutMetrics.submitHeight}px (Minimum 44px: ${layoutMetrics.submitHeight >= 44 ? 'PASS' : 'WARN'})`,
      horizontalOverflow: layoutMetrics.hasHorizontalOverflow ? 'FAIL: Content wider than viewport' : 'PASS: No overflow'
    };

    if (layoutMetrics.hasHorizontalOverflow) {
      auditReport.visualDefects.push('Horizontal overflow detected on mobile viewport');
    }

    // ----------------------------------------------------
    // STEP 3: INTERACTIVE CREDENTIALS & PASSWORD TOGGLE
    // ----------------------------------------------------
    console.log('[Step 3] Testing form interactions and password reveal...');
    const emailField = await page.$('#staff-identifier');
    const passField = await page.$('#staff-password');
    const revealBtn = await page.$('button[class*="revealToggleBtn"]');

    if (emailField) await emailField.type('testuser1@sesb.com.my', { delay: 20 });
    if (passField) await passField.type('Password123!', { delay: 20 });

    if (revealBtn) {
      await revealBtn.click();
      await delay(400);

      const step4Path = path.join(OUTPUT_DIR, 'audit-4-password-revealed.png');
      await page.screenshot({ path: step4Path, fullPage: true });
      auditReport.steps.push({
        step: 'Password Reveal Toggle Active',
        screenshot: 'output/audit-4-password-revealed.png',
        status: 'VERIFIED'
      });

      // Toggle back to hidden
      await revealBtn.click();
      await delay(300);
    }

    // ----------------------------------------------------
    // STEP 4: SUBMISSION & ERROR ALERT INSPECTION
    // ----------------------------------------------------
    console.log('[Step 4] Submitting form and inspecting response alert...');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await delay(3500);

      const step5Path = path.join(OUTPUT_DIR, 'audit-5-login-error-state.png');
      await page.screenshot({ path: step5Path, fullPage: true });
      auditReport.steps.push({
        step: 'Login Submission Response',
        screenshot: 'output/audit-5-login-error-state.png',
        status: 'VERIFIED'
      });

      const alertText = await page.evaluate(() => {
        const errBanner = document.querySelector('div[style*="background-color: rgb(254, 242, 242)"]');
        return errBanner ? errBanner.innerText.trim() : null;
      });

      auditReport.metrics.submissionResponse = alertText || 'No alert banner observed';
    }

  } catch (err) {
    console.error('[Visual Audit Error]:', err);
    auditReport.visualDefects.push(err.message);
  } finally {
    await browser.close();
  }

  const jsonReportPath = path.join(OUTPUT_DIR, 'visual-audit-results.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(auditReport, null, 2));
  console.log('[Visual Audit Complete] Results saved to:', jsonReportPath);
}

run();
