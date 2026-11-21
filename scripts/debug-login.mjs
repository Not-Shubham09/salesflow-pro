import fs from 'fs';

async function debugLogin() {
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
      console.log(`[BROWSER CONSOLE]:`, text);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.error(`[BROWSER EXCEPTION]:`, msg.params.exceptionDetails);
    } else if (msg.method === 'Network.requestWillBeSent') {
      if (!msg.params.request.url.includes('/@vite') && !msg.params.request.url.includes('/node_modules')) {
        console.log(`[NET REQ]:`, msg.params.request.method, msg.params.request.url);
      }
    } else if (msg.method === 'Network.responseReceived') {
      if (!msg.params.response.url.includes('/@vite') && !msg.params.response.url.includes('/node_modules')) {
        console.log(`[NET RES]:`, msg.params.response.status, msg.params.response.url);
      }
    } else if (msg.method === 'Network.loadingFailed') {
      console.log(`[NET FAIL]:`, msg.params.errorText, msg.params.requestId);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  console.log('Clearing localStorage and navigating to /login...');
  await send('Runtime.evaluate', { expression: 'localStorage.clear()' });
  await send('Page.navigate', { url: 'http://localhost:4028/login' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Clicking Sales Manager button...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const mgrBtn = buttons.find(b => b.innerText.includes('Sales Manager'));
      if (mgrBtn) {
        mgrBtn.click();
        return 'clicked';
      }
      return 'not found';
    })()`
  });

  console.log('Waiting 10s and tracking events...');
  for (let i = 1; i <= 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const url = (await send('Runtime.evaluate', { expression: 'window.location.href' })).result.value;
    const bodySnippet = (await send('Runtime.evaluate', { expression: 'document.body.innerText.substring(0, 100)' })).result.value;
    console.log(`[Second ${i}] URL: ${url} | Text: ${bodySnippet.replace(/\n/g, ' ')}`);
    if (url.includes('/sales-dashboard')) {
      console.log('SUCCESSFULLY NAVIGATED TO DASHBOARD at second', i);
      break;
    }
  }

  ws.close();
}

debugLogin();
