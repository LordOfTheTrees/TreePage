// Event validation for the treepage-track beacon, plus the browser tracker.
// The Edge Function and this file import the same module.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const TRACKER = path.join(ROOT, 'assets/js/track.js');

let telemetry;

test.before(async () => {
  telemetry = await import('../supabase/functions/_shared/telemetry.mjs');
});

test.beforeEach(() => {
  telemetry.resetRateLimit();
});

const SALT = 'test-salt-value-0123456789';
const DAY = new Date('2026-11-20T03:41:00.000Z');

function request(method, body, headers) {
  return new Request('https://uwwokqqfnqtdlddbvqgk.supabase.co/functions/v1/treepage-track', {
    method,
    headers: {
      origin: 'https://lordofthetrees.github.io',
      'content-type': 'text/plain;charset=UTF-8',
      'x-forwarded-for': '203.0.113.8, 10.0.0.1',
      'user-agent': 'TestAgent/1.0',
      ...(headers || {})
    },
    body: method === 'GET' || method === 'OPTIONS' ? undefined : body
  });
}

async function ingest(body, headers, deps) {
  const inserted = [];
  const response = await telemetry.handleTelemetry(
    request('POST', typeof body === 'string' ? body : JSON.stringify(body), headers),
    {
      getSalt: async () => SALT,
      insert: async (row) => { inserted.push(row); },
      now: () => DAY,
      nowMs: () => 1_000,
      ...(deps || {})
    }
  );
  return { status: response.status, inserted, allow: response.headers.get('access-control-allow-origin') };
}

test('allowlist matches the tracker and the migration style', () => {
  assert.deepEqual(telemetry.ALLOWED_EVENTS, [
    'page_view',
    'substack_subscribe_submit',
    'substack_link_click',
    'outbound_click',
    'resume_download',
    'gallery_photo_open',
    'project_card_click',
    'scroll_depth',
    'experiment_exposure'
  ]);
  const source = fs.readFileSync(TRACKER, 'utf8');
  telemetry.ALLOWED_EVENTS.forEach((name) => {
    assert.ok(source.includes(`'${name}'`), `tracker should send ${name}`);
  });
  assert.equal(source.includes('localStorage.'), false);
  assert.equal(source.includes('document.cookie'), false);
  const gzipped = zlib.gzipSync(Buffer.from(source)).length;
  assert.ok(gzipped < 3072, `gzipped tracker is ${gzipped} bytes`);

  const sql = fs.readFileSync(
    path.join(ROOT, 'supabase/migrations/20261120200000_create_treepage_events.sql'),
    'utf8'
  );
  assert.match(sql, /create table public\.treepage_events/i);
  assert.match(sql, /create table public\.telemetry_config/i);
  assert.match(sql, /treepage_salt/);
  assert.match(sql, /extensions\.gen_random_bytes\(32\)/);
  assert.doesNotMatch(sql, /alter table public\.visits/i);
  assert.doesNotMatch(sql, /drop table/i);
  assert.doesNotMatch(sql, /insert into public\.visits/i);
  assert.match(
    fs.readFileSync(path.join(ROOT, 'supabase/config.toml'), 'utf8'),
    /\[functions\.treepage-track\]\s+verify_jwt = false/
  );
});

test('stores a truncated daily hash and drops ip, user agent, query, and email', async () => {
  const { status, inserted } = await ingest({
    event: 'page_view',
    path: '/TreePage/pages/about/?email=person@example.com',
    referrer: 'https://www.google.com/search?q=hello',
    utm_source: 'newsletter',
    utm_medium: 'has space',
    utm_campaign: 'fall',
    device_class: 'tablet',
    props: { depth: 25, email: 'person@example.com', note: 'hi@there', name: 'A', host: 'github.com' }
  }, { 'cf-ipcountry': 'us', 'user-agent': 'Mozilla/5.0 (iPhone)' });

  assert.equal(status, 204);
  assert.equal(inserted.length, 1);
  const row = inserted[0];
  assert.equal(row.event, 'page_view');
  assert.equal(row.path, '/TreePage/pages/about/');
  assert.equal(row.referrer_domain, 'google.com');
  assert.equal(row.utm_source, 'newsletter');
  assert.equal(row.utm_medium, null);
  assert.equal(row.utm_campaign, 'fall');
  assert.equal(row.device_class, 'mobile');
  assert.equal(row.country, 'US');
  assert.equal(row.experiment_key, null);
  assert.deepEqual(row.props, { depth: 25, host: 'github.com' });
  assert.match(row.session_id, /^[0-9a-f]{16}$/);
  const blob = JSON.stringify(row);
  assert.equal(blob.includes('203.0.113.8'), false);
  assert.equal(blob.includes('iPhone'), false);
  assert.equal(blob.includes('person@example.com'), false);

  const again = await telemetry.coarseSessionId({
    ip: '203.0.113.8',
    userAgent: 'Mozilla/5.0 (iPhone)',
    salt: SALT,
    day: '2026-11-20'
  });
  assert.equal(again, row.session_id);
  const nextDay = await telemetry.coarseSessionId({
    ip: '203.0.113.8',
    userAgent: 'Mozilla/5.0 (iPhone)',
    salt: SALT,
    day: '2026-11-21'
  });
  assert.notEqual(nextDay, row.session_id);
});

test('rejects unknown events, bad origins, opt-out, and oversized bodies', async () => {
  assert.equal((await ingest({ event: 'click' })).status, 400);
  assert.equal((await ingest('not-json')).status, 400);
  assert.equal((await ingest({ event: 'page_view' }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await ingest({ event: 'page_view' }, { origin: 'http://localhost:4000' })).status, 204);
  assert.equal((await ingest({ event: 'page_view' }, { origin: 'http://127.0.0.1:4000' })).status, 204);
  assert.equal((await ingest({ event: 'page_view' }, { dnt: '1' })).status, 204);
  assert.equal((await ingest({ event: 'page_view' }, { 'sec-gpc': '1' })).inserted.length, 0);
  assert.equal((await ingest('x'.repeat(4097))).status, 400);

  const optedOut = await ingest({ event: 'page_view' }, { dnt: '1' });
  assert.equal(optedOut.inserted.length, 0);

  const missingSalt = await ingest({ event: 'page_view' }, {}, { getSalt: async () => null });
  assert.equal(missingSalt.status, 204);
  assert.equal(missingSalt.inserted.length, 0);

  const options = await telemetry.handleTelemetry(
    request('OPTIONS', undefined, { origin: 'https://lordofthetrees.github.io' }),
    { getSalt: async () => SALT, insert: async () => {} }
  );
  assert.equal(options.status, 204);
  assert.equal(options.headers.get('access-control-allow-origin'), 'https://lordofthetrees.github.io');

  const get = await telemetry.handleTelemetry(
    request('GET', undefined),
    { getSalt: async () => SALT, insert: async () => {} }
  );
  assert.equal(get.status, 405);
});

test('experiment exposure requires a valid key and variant, and rate limits per session', async () => {
  const bad = await ingest({ event: 'experiment_exposure', experiment_key: 'Bad', variant: 'control' });
  assert.equal(bad.status, 400);
  assert.equal(bad.inserted.length, 0);

  const good = await ingest({
    event: 'experiment_exposure',
    experiment_key: 'example_copy',
    variant: 'control',
    props: { email: 'a@b.c' }
  });
  assert.equal(good.status, 204);
  assert.equal(good.inserted[0].experiment_key, 'example_copy');
  assert.equal(good.inserted[0].variant, 'control');
  assert.deepEqual(good.inserted[0].props, {});

  telemetry.resetRateLimit();
  let last = 204;
  for (let i = 0; i < telemetry.RATE_LIMIT + 1; i += 1) {
    last = (await ingest({ event: 'page_view' })).status;
  }
  assert.equal(last, 429);
});

test('country codes XX and T1 are omitted and a desktop hint is kept', async () => {
  const unknown = await ingest({ event: 'page_view', device_class: 'desktop' }, {
    'cf-ipcountry': 'XX',
    'user-agent': 'Mozilla/5.0 (iPhone)'
  });
  assert.equal(unknown.inserted[0].country, null);
  assert.equal(unknown.inserted[0].device_class, 'desktop');
});

function element(spec) {
  const node = {
    tag: spec.tag || 'div',
    classes: spec.classes || [],
    attrs: spec.attrs || {},
    textContent: spec.text || '',
    parent: spec.parent || null
  };
  node.getAttribute = (name) => (Object.prototype.hasOwnProperty.call(node.attrs, name) ? node.attrs[name] : null);
  node.hasAttribute = (name) => Object.prototype.hasOwnProperty.call(node.attrs, name);
  node.closest = (selector) => {
    const sels = selector.split(',').map((item) => item.trim());
    let current = node;
    while (current) {
      if (sels.some((sel) => matches(current, sel))) return current;
      current = current.parent;
    }
    return null;
  };
  return node;
}

function matches(node, selector) {
  if (selector === 'a') return node.tag === 'a';
  if (selector === 'article.card') return node.tag === 'article' && node.classes.includes('card');
  if (selector.startsWith('.')) return node.classes.includes(selector.slice(1));
  return false;
}

function loadTracker(options) {
  const sent = [];
  const listeners = { document: {}, window: {} };
  const store = options.session || new Map();
  const experiments = JSON.stringify(options.experiments || []);
  const script = {
    getAttribute(name) {
      if (name === 'data-endpoint') return 'https://uwwokqqfnqtdlddbvqgk.supabase.co/functions/v1/treepage-track';
      if (name === 'data-experiments') return experiments;
      return null;
    }
  };
  const document = {
    readyState: options.readyState || 'interactive',
    currentScript: script,
    referrer: options.referrer || '',
    documentElement: { scrollHeight: options.scrollHeight || 5000 },
    addEventListener(type, fn) {
      (listeners.document[type] || (listeners.document[type] = [])).push(fn);
    }
  };
  const window = {
    location: {
      pathname: options.path || '/TreePage/',
      search: options.search || '',
      hostname: 'lordofthetrees.github.io',
      origin: 'https://lordofthetrees.github.io'
    },
    innerHeight: options.innerHeight || 800,
    scrollY: options.scrollY || 0,
    TreePage: {},
    doNotTrack: options.dnt || null,
    navigator: {
      doNotTrack: options.dnt || null,
      globalPrivacyControl: Boolean(options.gpc),
      sendBeacon(url, body) {
        if (options.beacon === false) return false;
        sent.push({ url, body: String(body) });
        return true;
      }
    },
    sessionStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => { store.set(key, String(value)); }
    },
    matchMedia: () => ({ matches: Boolean(options.mobile) }),
    fetch: (url, init) => {
      sent.push({ url, body: String(init.body), contentType: init.headers['content-type'] });
      return Promise.resolve({ ok: true });
    },
    addEventListener(type, fn) {
      (listeners.window[type] || (listeners.window[type] = [])).push(fn);
    }
  };
  const sandbox = { window, document, URL, URLSearchParams, console };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(TRACKER, 'utf8'), sandbox);
  const events = () => sent.map((item) => JSON.parse(item.body));
  return {
    sent,
    events,
    store,
    window,
    fire(target, type, event) {
      (listeners[target][type] || []).forEach((fn) => fn(event));
    }
  };
}

test('tracker sends page_view with utm and skips storage, email, and opt-out', () => {
  const page = loadTracker({
    search: '?utm_source=newsletter&utm_medium=email&utm_campaign=fall&email=person@example.com',
    referrer: 'https://www.google.com/search?q=hi',
    scrollY: 0
  });
  const view = page.events().find((event) => event.event === 'page_view');
  assert.equal(view.path, '/TreePage/');
  assert.equal(view.utm_source, 'newsletter');
  assert.equal(view.utm_medium, 'email');
  assert.equal(view.utm_campaign, 'fall');
  assert.equal(view.referrer, 'google.com');
  assert.equal(view.device_class, 'desktop');
  assert.equal(JSON.stringify(page.events()).includes('person@example.com'), false);
  assert.equal(page.store.has('tp_exp_seed'), false);
  assert.equal(page.sent[0].url, 'https://uwwokqqfnqtdlddbvqgk.supabase.co/functions/v1/treepage-track');

  const quiet = loadTracker({ dnt: '1' });
  assert.equal(quiet.sent.length, 0);
  const gpc = loadTracker({ gpc: true });
  assert.equal(gpc.sent.length, 0);
});

test('tracker classifies clicks and keeps the experiment variant for the tab', () => {
  const page = loadTracker({
    experiments: [{ key: 'example_copy', variants: ['control', 'short'] }],
    scrollHeight: 5000,
    scrollY: 0
  });
  const exposure = page.events().find((event) => event.event === 'experiment_exposure');
  assert.equal(exposure.experiment_key, 'example_copy');
  assert.ok(exposure.variant === 'control' || exposure.variant === 'short');
  assert.equal(page.window.TreePage.experiment('example_copy'), exposure.variant);
  assert.equal(page.store.has('tp_exp_seed'), true);

  const again = loadTracker({
    experiments: [{ key: 'example_copy', variants: ['control', 'short'] }],
    session: page.store,
    scrollHeight: 5000,
    scrollY: 0
  });
  const second = again.events().find((event) => event.event === 'experiment_exposure');
  assert.equal(second.variant, exposure.variant);

  const card = element({ tag: 'article', classes: ['card'] });
  const repo = element({
    tag: 'a',
    parent: card,
    text: 'Repo',
    attrs: { href: 'https://github.com/LordOfTheTrees/foo' }
  });
  page.fire('document', 'click', { target: repo });
  const names = page.events().map((event) => event.event);
  assert.ok(names.includes('project_card_click'));
  assert.equal(names.filter((name) => name === 'outbound_click').length, 0);
  assert.equal(page.events().find((event) => event.event === 'project_card_click').props.host, 'github.com');

  page.fire('document', 'click', {
    target: element({ tag: 'a', text: 'LinkedIn', attrs: { href: 'https://www.linkedin.com/in/andrew' } })
  });
  assert.equal(
    page.events().filter((event) => event.event === 'outbound_click').pop().props.host,
    'linkedin.com'
  );

  page.fire('document', 'click', {
    target: element({ tag: 'a', text: 'Substack', attrs: { href: 'https://treeflow.substack.com' } })
  });
  assert.ok(page.events().some((event) => event.event === 'substack_link_click'));

  page.fire('document', 'click', {
    target: element({ tag: 'a', text: 'Resume', attrs: { href: '/TreePage/resume.pdf' } })
  });
  assert.equal(
    page.events().filter((event) => event.event === 'resume_download').pop().props.host,
    'lordofthetrees.github.io'
  );

  page.fire('document', 'click', { target: element({ classes: ['photo-item'] }) });
  assert.ok(page.events().some((event) => event.event === 'gallery_photo_open'));

  const form = element({
    tag: 'form',
    attrs: { action: 'https://treeflow.substack.com/api/v1/free?nojs=true' }
  });
  form.emailValue = 'secret@example.com';
  page.fire('document', 'submit', { target: form });
  const submit = page.events().filter((event) => event.event === 'substack_subscribe_submit').pop();
  assert.ok(submit);
  assert.equal(JSON.stringify(submit).includes('secret@example.com'), false);
  assert.equal(submit.props, undefined);

  page.window.scrollY = 1050;
  page.fire('window', 'scroll', {});
  assert.deepEqual(
    page.events().filter((event) => event.event === 'scroll_depth').map((event) => event.props.depth),
    [25]
  );
});

test('tracker falls back to a text/plain keepalive fetch', () => {
  const page = loadTracker({ beacon: false, scrollHeight: 5000, scrollY: 0 });
  assert.equal(page.sent[0].contentType, 'text/plain;charset=UTF-8');
  assert.equal(JSON.parse(page.sent[0].body).event, 'page_view');
});
