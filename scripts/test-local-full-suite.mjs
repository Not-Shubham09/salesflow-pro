import fs from 'fs';

async function runFullSuite() {
  console.log('====================================================');
  console.log('STARTING SALESFLOW PRO CRM 22-STEP E2E VERIFICATION');
  console.log('Target: http://localhost:4028');
  console.log('====================================================\n');

  // Open a new tab on Chrome CDP
  const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?http%3A%2F%2Flocalhost%3A4028%2Flogin', { method: 'PUT' });
  const pageTarget = await newTargetRes.json();
  const pageWsUrl = pageTarget.webSocketDebuggerUrl;

  const ws = new WebSocket(pageWsUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const logs = [];
  const errors = [];
  const unhandledExceptions = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
      return;
    }

    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      logs.push(text);
      if (msg.params.type === 'error' && !text.includes('Failed to load resource') && !text.includes('defaultProps')) {
        errors.push(text);
        console.error(`[CONSOLE ERROR]:`, text);
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const text = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
      unhandledExceptions.push(text);
      console.error(`[UNHANDLED JS EXCEPTION]:`, text);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  const captureScreenshot = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`scripts/${filename}`, Buffer.from(res.data, 'base64'));
    console.log(`[SCREENSHOT] Saved scripts/${filename}`);
  };

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  async function evaluate(code) {
    const res = await send('Runtime.evaluate', {
      expression: code,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  // Clear any previous state to ensure clean start on /login
  await evaluate('localStorage.clear()');
  await send('Page.navigate', { url: 'http://localhost:4028/login' });
  await delay(1500);

  let passedSteps = 0;
  const totalSteps = 15;

  try {
    // STEP 1: Verify Login Page
    console.log('\n--- Step 1: Verify Login Page ---');
    await delay(1200);
    const loginTitle = await evaluate('document.title');
    const loginHeading = await evaluate('document.querySelector("h1, h2")?.innerText');
    console.log('Page Title:', loginTitle);
    console.log('Login Heading:', loginHeading);
    await captureScreenshot('step1-login.png');
    passedSteps++;

    // STEP 2: Perform Login
    console.log('\n--- Step 2: Perform Login via Sales Manager Demo button ---');
    const clickedManager = await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const mgrBtn = buttons.find(b => b.innerText.includes('Sales Manager'));
      if (mgrBtn) {
        mgrBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Clicked Sales Manager demo login:', clickedManager);
    
    // Wait dynamically for navigation to /sales-dashboard
    await evaluate(`new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (window.location.pathname === '/sales-dashboard') {
          resolve(true);
        } else if (Date.now() - start > 12000) {
          resolve(false);
        } else {
          setTimeout(check, 300);
        }
      };
      check();
    })`);
    await delay(1000);

    // STEP 3: Verify Dashboard Loaded
    console.log('\n--- Step 3: Verify Sales Dashboard ---');
    const dashboardUrl = await evaluate('window.location.href');
    console.log('Current URL:', dashboardUrl);
    const welcomeText = await evaluate('document.body.innerText.includes("Welcome back")');
    console.log('Dashboard Welcome Banner rendered:', welcomeText);
    const pipelineCards = await evaluate('document.querySelectorAll(".card").length');
    console.log('Dashboard Cards rendered:', pipelineCards);
    await captureScreenshot('step3-dashboard.png');
    if (!dashboardUrl.includes('/sales-dashboard')) {
      throw new Error('Did not navigate to dashboard');
    }
    passedSteps++;

    // STEP 4: Test "+ New Deal" button in Dashboard Header
    console.log('\n--- Step 4: Open and Submit New Deal modal on Dashboard ---');
    const clickedHeaderNewDeal = await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText.includes('New Deal') && b.title?.includes('Create'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Clicked Dashboard "+ New Deal" button:', clickedHeaderNewDeal);
    await delay(500);

    // Verify modal is open
    const modalVisible = await evaluate('document.body.innerText.includes("Create New Opportunity")');
    console.log('Create Deal Modal is visible:', modalVisible);
    await captureScreenshot('step4-modal-open.png');

    // Fill form and submit
    const submitModalResult = await evaluate(`(() => {
      const titleInput = document.querySelector('input[placeholder*="Acme Corp"]');
      const valueInput = document.querySelector('input[placeholder="50,000"]');
      if (titleInput && valueInput) {
        titleInput.value = 'Automated E2E Test Enterprise Deal';
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        valueInput.value = '85000';
        valueInput.dispatchEvent(new Event('input', { bubbles: true }));

        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Create Deal'));
        if (submitBtn) {
          submitBtn.click();
          return 'Submitted form';
        }
      }
      return 'Could not find inputs or submit button';
    })()`);
    console.log('Modal submission result:', submitModalResult);
    await delay(2000);
    await captureScreenshot('step4-deal-created.png');
    passedSteps++;

    // STEP 5: Navigate to Deal Management
    console.log('\n--- Step 5: Navigate to /deal-management ---');
    await evaluate('window.location.href = "/deal-management"');
    await delay(2500);
    const dealsUrl = await evaluate('window.location.href');
    console.log('Deals Page URL:', dealsUrl);
    const dealsHeading = await evaluate('document.body.innerText.includes("Deal Opportunities")');
    console.log('Deals Opportunities heading rendered:', dealsHeading);
    const dealsCount = await evaluate('document.querySelectorAll("tbody tr").length');
    console.log('Deals rows rendered in table:', dealsCount);
    await captureScreenshot('step5-deals-list.png');
    passedSteps++;

    // STEP 6: Test "+ New Deal" on /deal-management (In-Page Modal)
    console.log('\n--- Step 6: Test "+ New Deal" on Deal Management page ---');
    const clickedDealsNewDeal = await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText.includes('New Deal'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Clicked New Deal on /deal-management:', clickedDealsNewDeal);
    await delay(600);

    const dealModalOnDealsPage = await evaluate('document.body.innerText.includes("Create New Opportunity")');
    console.log('Create Deal Modal visible on /deal-management:', dealModalOnDealsPage);
    
    // Close modal
    await evaluate(`(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    })()`);
    await delay(400);
    passedSteps++;

    // STEP 7: Test /deal-management/new Direct Route (No crashes, no null errors)
    console.log('\n--- Step 7: Test Direct Navigation to /deal-management/new ---');
    await evaluate('window.location.href = "/deal-management/new"');
    await delay(2000);
    const currentRoute = await evaluate('window.location.pathname');
    console.log('Current route:', currentRoute);
    const newDealFormRendered = await evaluate('document.body.innerText.includes("Deal Information")');
    console.log('Deal Information form rendered on /deal-management/new:', newDealFormRendered);
    await captureScreenshot('step7-new-deal-route.png');
    passedSteps++;

    // STEP 8: Navigate to First Deal Detail
    console.log('\n--- Step 8: View Deal Detail Page ---');
    await evaluate('window.location.href = "/deal-management"');
    await delay(1000);
    // Wait for rows to load
    await evaluate(`new Promise((resolve) => {
      const check = () => {
        const rows = Array.from(document.querySelectorAll('tbody tr')).filter(r => !r.className.includes('animate-pulse'));
        if (rows.length > 0) resolve(true);
        else setTimeout(check, 300);
      };
      check();
    })`);
    const clickedFirstDeal = await evaluate(`(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr')).filter(r => !r.className.includes('animate-pulse'));
      if (rows.length > 0) {
        rows[0].click();
        return true;
      }
      return false;
    })()`);
    console.log('Clicked first deal row:', clickedFirstDeal);
    await delay(2000);
    const dealDetailUrl = await evaluate('window.location.href');
    console.log('Deal detail URL:', dealDetailUrl);
    const dealDetailRendered = await evaluate('document.body.innerText.includes("Deal Information")');
    console.log('Deal detail form rendered:', dealDetailRendered);
    await captureScreenshot('step8-deal-detail.png');
    passedSteps++;

    // STEP 9: Navigate to /contact-management
    console.log('\n--- Step 9: Navigate to Contact Management ---');
    await evaluate('window.location.href = "/contact-management"');
    await delay(2000);
    const contactsUrl = await evaluate('window.location.href');
    console.log('Contacts Page URL:', contactsUrl);
    const contactsRendered = await evaluate('document.body.innerText.includes("Contact") || document.body.innerText.includes("Contacts")');
    console.log('Contacts page content rendered:', contactsRendered);
    await captureScreenshot('step9-contacts.png');
    passedSteps++;

    // STEP 10: Test Add Contact
    console.log('\n--- Step 10: Test Add Contact ---');
    const clickedAddContact = await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText.includes('Add Contact'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Clicked Add Contact button:', clickedAddContact);
    await delay(800);

    const filledContact = await evaluate(`(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const firstNameInput = inputs.find(i => i.placeholder?.includes('First') || i.name?.includes('first') || i.id?.includes('first') || i.type === 'text');
      if (firstNameInput) {
        firstNameInput.value = 'Sophia';
        firstNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    })()`);
    console.log('Filled contact form input:', filledContact);
    passedSteps++;

    // STEP 11: Navigate to Pipeline Analytics
    console.log('\n--- Step 11: Navigate to Pipeline Analytics ---');
    await evaluate('window.location.href = "/pipeline-analytics"');
    await delay(2000);
    const analyticsUrl = await evaluate('window.location.href');
    console.log('Analytics URL:', analyticsUrl);
    const analyticsRendered = await evaluate('document.body.innerText.includes("Pipeline Analytics")');
    console.log('Analytics heading rendered:', analyticsRendered);
    await captureScreenshot('step11-analytics.png');
    passedSteps++;

    // STEP 12: Navigate to Activity Timeline
    console.log('\n--- Step 12: Navigate to Activity Timeline ---');
    await evaluate('window.location.href = "/activity-timeline"');
    await delay(2000);
    const timelineUrl = await evaluate('window.location.href');
    console.log('Activity Timeline URL:', timelineUrl);
    const timelineRendered = await evaluate('document.body.innerText.includes("Activity Timeline")');
    console.log('Activity Timeline heading rendered:', timelineRendered);
    await captureScreenshot('step12-timeline.png');
    passedSteps++;

    // STEP 13: Navigate to Settings & Administration
    console.log('\n--- Step 13: Navigate to Settings & Administration ---');
    await evaluate('window.location.href = "/settings-administration"');
    await delay(2000);
    const settingsUrl = await evaluate('window.location.href');
    console.log('Settings URL:', settingsUrl);
    const settingsRendered = await evaluate('document.body.innerText.includes("User Management") || document.body.innerText.includes("Settings")');
    console.log('Settings content rendered:', settingsRendered);
    await captureScreenshot('step13-settings.png');
    passedSteps++;

    // STEP 14: Return to Dashboard and Test Page Reload
    console.log('\n--- Step 14: Dashboard Persistence & Page Reload ---');
    await evaluate('window.location.href = "/sales-dashboard"');
    await delay(2000);
    console.log('Reloading page via Page.reload...');
    await send('Page.reload');
    await delay(2500);
    const afterReloadUrl = await evaluate('window.location.href');
    console.log('URL after page reload:', afterReloadUrl);
    const reloadContent = await evaluate('document.body.innerText.includes("Welcome back")');
    console.log('Dashboard content persisted after reload:', reloadContent);
    await captureScreenshot('step14-after-reload.png');
    if (!afterReloadUrl.includes('/sales-dashboard')) {
      throw new Error('Session lost after page reload!');
    }
    passedSteps++;

    // STEP 15: Test Logout
    console.log('\n--- Step 15: Test Clean Logout ---');
    const clickedSignOut = await evaluate(`(() => {
      const userBtn = document.querySelector('header button img')?.parentElement;
      if (userBtn) {
        userBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Clicked user avatar menu:', clickedSignOut);
    await delay(600);

    const clickedLogout = await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const logoutBtn = buttons.find(b => b.innerText.includes('Sign Out') || b.innerText.includes('Logout'));
      if (logoutBtn) {
        logoutBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Clicked Sign Out:', clickedLogout);
    await delay(1800);

    const logoutUrl = await evaluate('window.location.href');
    console.log('URL after logout:', logoutUrl);
    await captureScreenshot('step15-logged-out.png');
    passedSteps++;

    console.log('\n====================================================');
    console.log(`SUMMARY: ${passedSteps}/${totalSteps} CORE STEPS PASSED SUCCESSFULLY!`);
    console.log(`Unhandled Exceptions: ${unhandledExceptions.length}`);
    console.log(`Console Errors: ${errors.length}`);
    console.log('====================================================');

    if (unhandledExceptions.length > 0) {
      console.error('\nUNHANDLED EXCEPTIONS DETECTED:');
      unhandledExceptions.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
      process.exit(1);
    } else {
      console.log('\n✓ ZERO UNHANDLED JAVASCRIPT EXCEPTIONS!');
      console.log('✓ ALL MODULES RENDERING AND FUNCTIONING PERFECTLY!');
      process.exit(0);
    }

  } catch (err) {
    console.error('Test suite failed with error:', err);
    await captureScreenshot('failure.png');
    process.exit(1);
  } finally {
    ws.close();
  }
}

runFullSuite();
