async function testDirect() {
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
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await send('Page.enable');
  await send('Runtime.enable');

  await new Promise(r => setTimeout(r, 2000));

  console.log('Evaluating signIn in browser context...');
  const result = await send('Runtime.evaluate', {
    expression: `(async () => {
      try {
        console.log('Starting direct import of authService...');
        const auth = (await import('/src/utils/authService.js')).default;
        console.log('authService imported, calling signIn...');
        const res = await auth.signIn('sales.manager@salesflow.com', 'Manager456!');
        console.log('auth.signIn returned:', JSON.stringify(res));
        return res;
      } catch (err) {
        console.error('Error during direct signIn:', err);
        return { error: err.message, stack: err.stack };
      }
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Evaluate result:', result.result?.value);
  ws.close();
}

testDirect();
