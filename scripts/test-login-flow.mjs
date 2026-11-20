import fs from 'fs';

async function main() {
  const targetUrl = 'https://crm-management-alpha.vercel.app/login';
  console.log(`Testing full login & dashboard flow on ${targetUrl}...`);

  const verRes = await fetch('http://127.0.0.1:9222/json/version');
  const verData = await verRes.json();

  const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(targetUrl), { method: 'PUT' });
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
      console.log(`[BROWSER CONSOLE ${msg.params.type.toUpperCase()}]:`, text);
      logs.push(text);
      if (msg.params.type === 'error') errors.push(text);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const text = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
      console.error(`[BROWSER EXCEPTION]:`, text);
      errors.push(text);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  console.log('1. Waiting 3 seconds on /login...');
  await new Promise(r => setTimeout(r, 3000));

  // Take screenshot of Login page
  const loginScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (loginScreenshot?.data) {
    fs.writeFileSync('scripts/login-page-screenshot.png', Buffer.from(loginScreenshot.data, 'base64'));
    console.log('✓ Login page screenshot saved to scripts/login-page-screenshot.png');
  }

  // Click the Sales Manager demo button
  console.log('2. Clicking "Sales Manager" demo login card...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      // Find button containing Sales Manager
      const buttons = Array.from(document.querySelectorAll('button'));
      const mgrBtn = buttons.find(b => b.innerText.includes('Sales Manager'));
      if (mgrBtn) {
        mgrBtn.click();
        return 'Clicked Sales Manager button';
      }
      return 'Button not found';
    })()`
  });
  console.log('Click result:', clickRes.result.value);

  console.log('3. Waiting 4 seconds for authentication and dashboard navigation...');
  await new Promise(r => setTimeout(r, 4000));

  // Check state of the page
  const evalRes = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      url: window.location.href,
      title: document.title,
      bodyTextSnippet: document.body.innerText.substring(0, 1000),
      hasKanban: !!document.querySelector('.kanban-board, [data-rbd-droppable-id], [class*="PipelineStage"], [class*="pipeline"]'),
      hasHeader: !!document.querySelector('header'),
      dealCardsCount: document.querySelectorAll('[data-rbd-draggable-id], [class*="DealCard"], [class*="deal"]').length
    })`
  });

  const dashboardInfo = JSON.parse(evalRes.result.value || '{}');
  console.log('\n--- DASHBOARD PAGE STATE ---');
  console.log('Current URL:', dashboardInfo.url);
  console.log('Page Title:', dashboardInfo.title);
  console.log('Has Header:', dashboardInfo.hasHeader);
  console.log('Deal Cards Count:', dashboardInfo.dealCardsCount);
  console.log('\nBody Text Snippet:\n', dashboardInfo.bodyTextSnippet);

  // Take screenshot of Dashboard
  const dashScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (dashScreenshot?.data) {
    fs.writeFileSync('scripts/dashboard-screenshot.png', Buffer.from(dashScreenshot.data, 'base64'));
    console.log('✓ Dashboard screenshot saved to scripts/dashboard-screenshot.png');
  }

  // Close target
  await fetch(`http://127.0.0.1:9222/json/close/${pageTarget.id}`);
  ws.close();

  console.log('\n--- TEST RESULT ---');
  console.log('Total Errors:', errors.length);
  if (dashboardInfo.url.includes('/sales-dashboard')) {
    console.log('SUCCESS: Navigated and rendered /sales-dashboard successfully!');
  } else {
    console.error('FAILED: Did not navigate to /sales-dashboard. Current URL:', dashboardInfo.url);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Login test failed:', err);
  process.exit(1);
});
