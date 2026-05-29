/**
 * Build a self-contained HTML snapshot of the live digital twin dashboard.
 *
 * Hits every /api/* endpoint on the running server, inlines the JSON
 * responses into a single HTML file, and patches window.fetch so the page
 * reads from the inlined data instead of the network. POST endpoints
 * (send-approval) are stubbed to return a "demo disabled" response.
 *
 * Usage:
 *   node scripts/build_digital_twin_snapshot.js [--out path] [--base http://localhost:3700]
 *
 * Default output: C:\Users\FallonD\Documents\Change Management\digital-twin-demo-YYYY-MM-DD.html
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const args = process.argv.slice(2);
function arg(flag, def) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}

const BASE = arg('--base', 'http://localhost:3700');
const today = new Date().toISOString().slice(0, 10);
const DEFAULT_OUT = path.join(
  process.env.USERPROFILE || process.env.HOME || '.',
  'Documents',
  'Change Management',
  `digital-twin-demo-${today}.html`
);
const OUT = arg('--out', DEFAULT_OUT);

const ENDPOINTS = [
  '/api/data',
  '/api/calendar',
  '/api/swarm-metrics',
  '/api/swarm-trend?weeks=12',
  '/api/ccb-dev',
  '/api/swarm',
  '/api/swarm?env=dev',
  '/api/approvals',
  '/api/approvals?env=dev',
];

function get(pathOrUrl) {
  return new Promise((resolve, reject) => {
    const u = pathOrUrl.startsWith('http') ? pathOrUrl : BASE + pathOrUrl;
    const req = http.get(u, (res) => {
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (buf += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('timeout')));
  });
}

async function getJson(p) {
  const r = await get(p);
  if (r.status !== 200) throw new Error(`HTTP ${r.status} for ${p}`);
  try { return JSON.parse(r.body); } catch (e) { throw new Error(`Bad JSON from ${p}: ${e.message}`); }
}

(async () => {
  console.log(`Snapshot source: ${BASE}`);
  console.log('Fetching dashboard HTML...');
  const htmlRes = await get('/');
  if (htmlRes.status !== 200) throw new Error(`Dashboard HTML returned ${htmlRes.status}`);
  let html = htmlRes.body;
  console.log(`  HTML: ${(html.length / 1024).toFixed(1)} KB`);

  console.log('Capturing API responses...');
  const data = {};
  let ok = 0;
  let fail = 0;
  for (const ep of ENDPOINTS) {
    try {
      data[ep] = await getJson(ep);
      const sz = JSON.stringify(data[ep]).length;
      console.log(`  ${ep.padEnd(32)} ${(sz / 1024).toFixed(1).padStart(7)} KB`);
      ok++;
    } catch (e) {
      console.warn(`  ${ep.padEnd(32)} FAIL: ${e.message}`);
      data[ep] = null;
      fail++;
    }
  }

  const stamp = new Date();
  const stampLocal = stamp.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' });

  const banner = `
<style>
  body { padding-top: 38px !important; }
  #demo-banner {
    position: fixed; top: 0; left: 0; right: 0;
    background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
    color: #1f2937; padding: 9px 16px;
    font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13px; font-weight: 600;
    z-index: 99999; text-align: center;
    border-bottom: 2px solid #b45309;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    letter-spacing: 0.2px;
  }
  #demo-banner .pill {
    display: inline-block; background: #1f2937; color: #fbbf24;
    padding: 1px 8px; border-radius: 10px; font-size: 11px; margin-right: 8px;
  }
  #demo-banner .meta { font-weight: 500; opacity: 0.85; margin-left: 8px; }
</style>
<div id="demo-banner">
  <span class="pill">DEMO SNAPSHOT</span>
  Read-only — no live data, refresh and approval actions are disabled
  <span class="meta">Captured: ${stampLocal} PT</span>
</div>`;

  // Inline the captured data as a separate <script type="application/json"> block
  // so it can't break the JS parser regardless of what's inside the JSON.
  // Escape </ → <\/ to be safe inside a script tag of any type.
  const dataJson = JSON.stringify(data).replace(/<\/(script|style)/gi, '<\\/$1');

  const dataIsland = `
<script id="__demo_data" type="application/json">${dataJson}</script>`;

  const stub = `
<script>
(function() {
  try {
    var node = document.getElementById('__demo_data');
    window.__DEMO_DATA__ = node ? JSON.parse(node.textContent) : {};
  } catch (e) {
    console.error('[demo] failed to parse demo data:', e);
    window.__DEMO_DATA__ = {};
  }
  window.__DEMO_TIMESTAMP__ = ${JSON.stringify(stamp.toISOString())};
  console.info('[demo] loaded snapshot with endpoints:', Object.keys(window.__DEMO_DATA__));

  function makeResp(body, opts) {
    opts = opts || {};
    return Promise.resolve({
      ok: opts.ok !== false,
      status: opts.status || 200,
      statusText: opts.statusText || 'OK',
      headers: { get: function() { return null; } },
      json: function() { return Promise.resolve(body); },
      text: function() { return Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)); },
      clone: function() { return makeResp(body, opts); },
    });
  }

  function candidateKeys(input) {
    var raw = typeof input === 'string' ? input : (input && input.url) || '';
    var keys = [raw];
    try {
      var u = new URL(raw, 'http://snapshot.local/');
      keys.push(u.pathname + (u.search || ''));
      keys.push(u.pathname);
    } catch (e) { /* ignore */ }
    var unique = [];
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] && unique.indexOf(keys[i]) === -1) unique.push(keys[i]);
    }
    return unique;
  }

  var origFetch = window.fetch ? window.fetch.bind(window) : null;

  window.fetch = function(input, init) {
   try {
    var keys = candidateKeys(input);
    var method = ((init && init.method) || (typeof input === 'object' && input && input.method) || 'GET').toUpperCase();
    var primary = keys[0] || '';

    // POST endpoints: refuse with friendly demo response
    if (method !== 'GET') {
      console.info('[demo] blocked', method, primary);
      return makeResp({ ok: false, demo: true, error: 'Demo snapshot — write actions are disabled.' }, { status: 200 });
    }

    // /api/refresh: pretend we refreshed but keep the original timestamp
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] === '/api/refresh' || keys[i].indexOf('/api/refresh?') === 0) {
        return makeResp({ ok: true, demo: true, lastRefresh: window.__DEMO_TIMESTAMP__ });
      }
    }

    // Look for any candidate key in the captured data, exact then base
    for (var j = 0; j < keys.length; j++) {
      var k = keys[j];
      if (Object.prototype.hasOwnProperty.call(window.__DEMO_DATA__, k)) {
        return makeResp(window.__DEMO_DATA__[k]);
      }
      var base = k.split('?')[0];
      if (Object.prototype.hasOwnProperty.call(window.__DEMO_DATA__, base)) {
        return makeResp(window.__DEMO_DATA__[base]);
      }
    }

    if (primary.indexOf('/api/') >= 0 || primary.indexOf('api/') === 0) {
      console.warn('[demo] no captured data for', primary, 'tried keys:', keys);
      return makeResp({ ok: true, demo: true, missing: primary, note: 'No data captured at snapshot time.' });
    }

    // Non-API requests: pass through if a real server is somehow reachable; otherwise fail soft
    if (origFetch) {
      try { return origFetch(input, init); } catch (e) { return makeResp(null, { ok: false, status: 0 }); }
    }
    return makeResp(null, { ok: false, status: 0 });
   } catch (err) {
    console.error('[demo] fetch override threw:', err);
    return makeResp({ ok: false, demo: true, error: 'Snapshot fetch override error: ' + err.message });
   }
  };

  // Visually disable any approval/send buttons after DOM ready
  function disableWriteControls() {
    var sels = [
      'button[onclick*="send-approval"]',
      'button[onclick*="sendApproval"]',
      'button[onclick*="approve"]',
      '[data-action="send-approval"]',
    ];
    document.querySelectorAll(sels.join(',')).forEach(function(b) {
      b.disabled = true;
      b.style.opacity = '0.45';
      b.style.cursor = 'not-allowed';
      b.title = 'Disabled in demo snapshot';
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', disableWriteControls);
  } else {
    disableWriteControls();
  }
})();
</script>`;

  // Inject data island + override stub before </head>
  // Order matters: data island must come BEFORE the stub so getElementById works synchronously.
  const inject = dataIsland + '\n' + stub;
  if (/<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, inject + '\n</head>');
  } else if (/<body[^>]*>/i.test(html)) {
    html = html.replace(/<body([^>]*)>/i, '<body$1>' + inject);
  } else {
    html = inject + html;
  }

  // Inject the banner right after <body ...>
  if (/<body[^>]*>/i.test(html)) {
    html = html.replace(/<body([^>]*)>/i, '<body$1>' + banner);
  } else {
    html = banner + html;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, html, 'utf8');

  console.log('');
  console.log(`Wrote: ${OUT}`);
  console.log(`Size:  ${(html.length / 1024).toFixed(1)} KB`);
  console.log(`Endpoints captured: ${ok} ok, ${fail} failed`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
