// Test helpers: stub the external SDKs the functions depend on, and load the
// functions fresh so module-scope state (cached clients) starts clean per test.
const Module = require('module');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Mutable state the fake SDKs read at call time, so a test can steer behavior
// without reloading anything.
const state = {
  sent: [],           // emails the fake Resend "sent"
  inserted: [],       // rows the fake Supabase "inserted"
  counts: {},         // { [table]: number } returned for head/count selects
  countError: null,   // { message } to return from count selects
  throwOnQuery: false,
  throwOnInsert: false,
  resendThrows: false
};

function reset() {
  state.sent = [];
  state.inserted = [];
  state.counts = {};
  state.countError = null;
  state.throwOnQuery = false;
  state.throwOnInsert = false;
  state.resendThrows = false;
}

function fakeQuery(table) {
  const q = { _head: false, _limit: null, _desc: false };
  q.select = (_cols, opts) => { q._head = Boolean(opts && opts.head); return q; };
  q.eq = () => q;
  q.gte = () => q;
  q.lt = () => q;
  q.order = (_col, opts) => { q._desc = Boolean(opts && opts.ascending === false); return q; };
  q.limit = (n) => { q._limit = n; return q; };
  q.range = () => q;
  q.insert = (rows) => {
    if (state.throwOnInsert) return Promise.reject(new Error('insert failed'));
    state.inserted.push(...rows.map((r) => ({ table, ...r })));
    return Promise.resolve({ error: null });
  };
  q.delete = () => q;
  q.then = (resolve, reject) => {
    if (state.throwOnQuery) return reject(new Error('connection refused'));
    if (q._head) {
      return resolve({ count: state.counts[table] || 0, error: state.countError });
    }
    // Data selects: driven by state.rows[table] if a test sets it.
    const rows = (state.rows && state.rows[table]) || [];
    const sorted = q._desc ? [...rows].reverse() : rows;
    const n = q._limit ? Math.min(q._limit, 1000) : Math.min(sorted.length, 1000);
    return resolve({ data: sorted.slice(0, n), error: null });
  };
  return q;
}

const fakeSupabase = { createClient: () => ({ from: fakeQuery }) };

class FakeResend {
  constructor() {
    this.emails = {
      send: async (message) => {
        if (state.resendThrows) throw new Error('resend rejected');
        state.sent.push(message);
        return {};
      }
    };
  }
}

const originalLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === '@supabase/supabase-js') return fakeSupabase;
  if (request === 'resend') return { Resend: FakeResend };
  return originalLoad.call(this, request, ...rest);
};

// Drops cached netlify modules so a fresh require re-runs module scope.
function loadFresh(relPath) {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(path.join(ROOT, 'netlify'))) delete require.cache[key];
  }
  return require(path.join(ROOT, relPath));
}

const post = (obj) => ({ httpMethod: 'POST', headers: {}, body: JSON.stringify(obj) });

// Evaluates a browser script against a bare fake window and returns it.
function loadBrowserScript(relPath, win = {}) {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  new Function('window', 'document', 'console', 'setTimeout', 'clearTimeout', src)(
    win, win.document || {}, console, setTimeout, clearTimeout
  );
  return win;
}

// The function modules export { handler }; this returns the handler itself.
const loadHandler = (relPath) => loadFresh(relPath).handler;

module.exports = { state, reset, loadFresh, loadHandler, post, loadBrowserScript };
