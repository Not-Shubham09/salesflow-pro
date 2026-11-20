import fs from 'fs';

async function main() {
  const targetUrl = process.argv[2] || 'https://crm-management-alpha.vercel.app/';
  console.log(`Navigating to ${targetUrl} via Chrome CDP...`);

  // 1. Get browser version and websocket debugger URL
  const verRes = await fetch('http://127.0.0.1:9222/json/version');
  const verData = await verRes.json();
  const browserWs = verData.webSocketDebuggerUrl;

  // 2. Create a new target page
  const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(targetUrl), { method: 'PUT' });
  const pageTarget = await newTargetRes.json();
  const pageWsUrl = pageTarget.webSocketDebuggerUrl;
  console.log('Opened page target:', pageTarget.id);

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
  const failedRequests = [];
  const thisRequests = new Map();

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
      logs.push({ type: msg.params.type, text });
      if (msg.params.type === 'error') {
        errors.push(text);
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const text = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
      console.error(`[BROWSER UNCAUGHT EXCEPTION]:`, text);
      errors.push(text);
    } else if (msg.method === 'Network.loadingFailed') {
      const url = thisRequests.get(msg.params.requestId) || 'unknown';
      console.error(`[NETWORK FAILED]: ${msg.params.errorText} for URL: ${url}`);
      failedRequests.push({ url, error: msg.params.errorText });
    } else if (msg.method === 'Network.requestWillBeSent') {
      thisRequests.set(msg.params.requestId, msg.params.request.url);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  // Enable CDP domains
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  console.log('Waiting 4 seconds for page execution & rendering...');
  await new Promise(r => setTimeout(r, 4000));

  // Get current document HTML
  const evalRes = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      title: document.title,
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 500),
      rootHtml: document.getElementById('root')?.innerHTML?.substring(0, 500)
    })`
  });

  const pageInfo = JSON.parse(evalRes.result.value || '{}');
  console.log('\n--- BROWSER PAGE STATE ---');
  console.log('Current URL:', pageInfo.url);
  console.log('Page Title:', pageInfo.title);
  console.log('Body Text:\n', pageInfo.bodyText);
  console.log('Root HTML Preview:\n', pageInfo.rootHtml);

  // Take screenshot
  const screenshotRes = await send('Page.captureScreenshot', { format: 'png' });
  if (screenshotRes?.data) {
    fs.writeFileSync('scripts/alpha-screenshot.png', Buffer.from(screenshotRes.data, 'base64'));
    console.log('Screenshot saved to scripts/alpha-screenshot.png');
  }

  // Close target
  await fetch(`http://127.0.0.1:9222/json/close/${pageTarget.id}`);
  ws.close();

  console.log('\n--- SUMMARY ---');
  console.log('Total Console Errors:', errors.length);
  console.log('Total Failed Network Requests:', failedRequests.length);
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
