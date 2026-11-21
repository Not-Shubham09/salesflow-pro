import fs from 'fs';

async function testNewDeal() {
  console.log('Testing "New Deal" button click...');

  const verRes = await fetch('http://127.0.0.1:9222/json/version');
  const verData = await verRes.json();

  const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?https%3A%2F%2Fcrm-management-alpha.vercel.app%2Flogin', { method: 'PUT' });
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
      console.log(`[CONSOLE ${msg.params.type}]:`, text);
      logs.push(text);
      if (msg.params.type === 'error') errors.push(text);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const text = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
      console.error(`[EXCEPTION]:`, text);
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

  console.log('Waiting 2s on /login...');
  await new Promise(r => setTimeout(r, 2000));

  console.log('Logging in as Sales Manager...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const mgrBtn = buttons.find(b => b.innerText.includes('Sales Manager'));
      if (mgrBtn) mgrBtn.click();
    })()`
  });

  console.log('Waiting 3s for dashboard...');
  await new Promise(r => setTimeout(r, 3000));

  // Check where we are
  let currentUrl = (await send('Runtime.evaluate', { expression: 'window.location.href' })).result.value;
  console.log('Current URL after login:', currentUrl);

  // Now test QuickActions "+ Add Deal" on Dashboard
  console.log('\n--- TEST A: Clicking QuickActions "Add Deal" on Dashboard ---');
  const addDealQuickClick = await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addDealBtn = buttons.find(b => b.innerText.includes('Add Deal') || b.innerText.includes('New Deal'));
      if (addDealBtn) {
        addDealBtn.click();
        return 'Clicked ' + addDealBtn.innerText;
      }
      return 'No Add Deal button found on dashboard';
    })()`
  });
  console.log('Add Deal button click result:', addDealQuickClick.result.value);
  await new Promise(r => setTimeout(r, 1000));

  let urlAfterQuick = (await send('Runtime.evaluate', { expression: 'window.location.href' })).result.value;
  console.log('URL after Quick Add Deal:', urlAfterQuick);

  // Now navigate to /deal-management
  console.log('\n--- TEST B: Navigating to /deal-management ---');
  await send('Runtime.evaluate', {
    expression: `window.location.href = '/deal-management'`
  });
  await new Promise(r => setTimeout(r, 3000));

  let urlInDeals = (await send('Runtime.evaluate', { expression: 'window.location.href' })).result.value;
  console.log('URL in Deal Management:', urlInDeals);

  // Now click "New Deal" in /deal-management
  console.log('\n--- TEST C: Clicking "New Deal" in Deal Management ---');
  const newDealClick = await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const newDealBtn = buttons.find(b => b.innerText.includes('New Deal'));
      if (newDealBtn) {
        newDealBtn.click();
        return 'Clicked New Deal button';
      }
      return 'No New Deal button found in deal management';
    })()`
  });
  console.log('New Deal button click result:', newDealClick.result.value);
  await new Promise(r => setTimeout(r, 2000));

  let urlAfterNewDeal = (await send('Runtime.evaluate', { expression: 'window.location.href' })).result.value;
  console.log('URL after clicking New Deal:', urlAfterNewDeal);

  const finalState = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 500)
    })`
  });
  console.log('Final Page State:\n', JSON.parse(finalState.result.value || '{}'));

  // Close target
  await fetch(`http://127.0.0.1:9222/json/close/${pageTarget.id}`);
  ws.close();
}

testNewDeal().catch(console.error);
