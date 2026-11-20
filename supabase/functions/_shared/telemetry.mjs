// Privacy-preserving event validation for the treepage-track beacon.
// No I/O. The Edge Function and the Node tests both import this module.
// Session ids are a daily salted hash. The raw IP and user agent are never
// placed on the row that gets stored.

export const ALLOWED_EVENTS = Object.freeze([
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

const ALLOWED = new Set(ALLOWED_EVENTS);

export const RATE_LIMIT = 180;
export const RATE_WINDOW_MS = 60_000;
export const MAX_BODY_BYTES = 4096;

const MAX_PROPS = 12;
const MAX_PROP_STRING = 80;
const SESSION_HEX_LEN = 16;

const MOBILE_UA = /mobile|android|iphone|ipad|ipod|webos|blackberry|opera mini/i;
const UTM_RE = /^[-A-Za-z0-9._~+]{1,64}$/;
const PROP_KEY_RE = /^[a-z][a-z0-9_]{0,31}$/;
const EXPERIMENT_KEY_RE = /^[a-z][a-z0-9_]{0,39}$/;
const VARIANT_RE = /^[a-z][a-z0-9_]{0,31}$/;
const SENSITIVE_PROP_KEYS = new Set([
  'email',
  'ip',
  'ip_address',
  'user_agent',
  'ua',
  'password',
  'token',
  'name',
  'message'
]);
const COUNTRY_HEADERS = [
  'cf-ipcountry',
  'x-vercel-ip-country',
  'cloudfront-viewer-country',
  'x-country-code'
];
const SKIP_COUNTRIES = new Set(['XX', 'T1']);

const rateBuckets = new Map();

export function resetRateLimit() {
  rateBuckets.clear();
}

export function privacyOptOut(headers) {
  const dnt = (headers.get('dnt') || '').trim();
  const gpc = (headers.get('sec-gpc') || '').trim();
  return dnt === '1' || gpc === '1';
}

// First address in x-forwarded-for. Hash input only. Never persist the return value.
export function clientIp(headers) {
  const forwarded = headers.get('x-forwarded-for') || '';
  if (!forwarded) return '';
  const first = forwarded.split(',')[0].trim();
  return first;
}

export function utcDay(date) {
  return date.toISOString().slice(0, 10);
}

export async function coarseSessionId({ ip, userAgent, salt, day }) {
  const material = `${ip}|${userAgent}|${day}|${salt}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex.slice(0, SESSION_HEX_LEN);
}

export function originAllowed(origin) {
  if (!origin || typeof origin !== 'string') return false;
  if (origin === 'https://lordofthetrees.github.io') return true;
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:') return false;
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
}

export function corsHeaders(origin) {
  const vary = { vary: 'Origin' };
  if (!originAllowed(origin)) return vary;
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}

export function referrerDomain(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text || text.length > 500 || text.includes('@')) return null;
  const candidate = text.includes('://') ? text : `https://${text}`;
  let host;
  try {
    host = new URL(candidate).hostname;
  } catch {
    return null;
  }
  if (!host) return null;
  host = host.toLowerCase().replace(/\.$/, '');
  if (host.startsWith('www.')) host = host.slice(4);
  if (!host || host.length > 253 || /\s/.test(host)) return null;
  return host;
}

export function cleanPath(value) {
  if (typeof value !== 'string') return null;
  let text = value.trim();
  if (!text) return null;
  if (text.includes('://')) {
    try {
      text = new URL(text).pathname || '/';
    } catch {
      return null;
    }
  }
  text = text.split('?')[0].split('#')[0];
  if (!text.startsWith('/')) text = `/${text}`;
  if (text.includes('@')) return null;
  return text.slice(0, 200) || null;
}

export function cleanUtm(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text || !UTM_RE.test(text)) return null;
  return text;
}

function cleanToken(value, pattern) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!pattern.test(text)) return null;
  return text;
}

export function deviceClassFor(userAgent, hinted) {
  if (hinted === 'mobile' || hinted === 'desktop') return hinted;
  if (!userAgent) return null;
  return MOBILE_UA.test(userAgent) ? 'mobile' : 'desktop';
}

export function countryFromHeaders(headers) {
  for (const name of COUNTRY_HEADERS) {
    const raw = (headers.get(name) || '').trim().toUpperCase();
    if (raw.length === 2 && /^[A-Z]{2}$/.test(raw) && !SKIP_COUNTRIES.has(raw)) return raw;
  }
  return null;
}

function dropProp(raw) {
  if (raw === null || typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || Math.abs(raw) > 1_000_000_000) return undefined;
    return raw;
  }
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text || text.length > MAX_PROP_STRING || text.includes('@')) return undefined;
    return text;
  }
  return undefined;
}

export function cleanProps(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const cleaned = {};
  for (const [key, raw] of Object.entries(value)) {
    if (Object.keys(cleaned).length >= MAX_PROPS) break;
    if (!PROP_KEY_RE.test(key) || SENSITIVE_PROP_KEYS.has(key)) continue;
    const coerced = dropProp(raw);
    if (coerced === undefined) continue;
    cleaned[key] = coerced;
  }
  if (JSON.stringify(cleaned).length > 1024) return {};
  return cleaned;
}

export async function buildRow({ body, headers, salt, now }) {
  const moment = now || new Date();
  const ip = clientIp(headers);
  const userAgent = headers.get('user-agent') || '';
  const sessionId = await coarseSessionId({
    ip,
    userAgent,
    salt,
    day: utcDay(moment)
  });
  const row = {
    event: body.event,
    path: cleanPath(body.path),
    referrer_domain: referrerDomain(body.referrer),
    utm_source: cleanUtm(body.utm_source),
    utm_medium: cleanUtm(body.utm_medium),
    utm_campaign: cleanUtm(body.utm_campaign),
    experiment_key: null,
    variant: null,
    device_class: deviceClassFor(userAgent, body.device_class),
    country: countryFromHeaders(headers),
    session_id: sessionId,
    props: cleanProps(body.props)
  };
  if (body.event === 'experiment_exposure') {
    row.experiment_key = cleanToken(body.experiment_key, EXPERIMENT_KEY_RE);
    row.variant = cleanToken(body.variant, VARIANT_RE);
    row.props = {};
  }
  return row;
}

// New Supabase secret keys (sb_secret_...) are not JWTs. Legacy service-role
// keys are JWTs and start with eyJ. Callers send apikey always, and
// Authorization: Bearer only for a JWT.
export function resolveSupabaseKey(env) {
  const source = env || {};
  const secret = String(source.SUPABASE_SECRET_KEY || '').trim();
  if (secret) return secret;
  return String(source.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}

export function supabaseRestHeaders(key, extra) {
  const headers = { ...(extra || {}), apikey: key };
  if (typeof key === 'string' && key.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${key}`;
  } else {
    delete headers.Authorization;
  }
  return headers;
}

export function consumeRateLimit(sessionId, nowMs) {
  const now = typeof nowMs === 'number' ? nowMs : Date.now();
  if (rateBuckets.size >= 4096) {
    for (const [key, entry] of rateBuckets) {
      if (now - entry.start >= RATE_WINDOW_MS) rateBuckets.delete(key);
    }
  }
  let entry = rateBuckets.get(sessionId);
  if (!entry || now - entry.start >= RATE_WINDOW_MS) {
    entry = { start: now, count: 0 };
  }
  if (entry.count >= RATE_LIMIT) {
    rateBuckets.set(sessionId, entry);
    return false;
  }
  entry.count += 1;
  rateBuckets.set(sessionId, entry);
  return true;
}

function jsonResponse(status, payload, headers) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...headers, 'content-type': 'application/json' }
  });
}

export async function handleTelemetry(request, deps) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  if (request.method === 'OPTIONS') {
    if (!originAllowed(origin)) return new Response(null, { status: 403, headers });
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'method not allowed' }, headers);
  }

  if (!originAllowed(origin)) {
    return jsonResponse(403, { error: 'origin not allowed' }, headers);
  }

  if (privacyOptOut(request.headers)) {
    return new Response(null, { status: 204, headers });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return jsonResponse(400, { error: 'payload too large' }, headers);
  }

  let parsed;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return jsonResponse(400, { error: 'invalid json' }, headers);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return jsonResponse(400, { error: 'invalid payload' }, headers);
  }
  if (typeof parsed.event !== 'string' || !ALLOWED.has(parsed.event)) {
    return jsonResponse(400, { error: 'unknown event' }, headers);
  }

  let salt = null;
  try {
    salt = await deps.getSalt();
  } catch {
    salt = null;
  }
  if (!salt) return new Response(null, { status: 204, headers });

  const row = await buildRow({
    body: parsed,
    headers: request.headers,
    salt,
    now: deps.now ? deps.now() : new Date()
  });

  if (parsed.event === 'experiment_exposure' && (!row.experiment_key || !row.variant)) {
    return jsonResponse(400, { error: 'invalid experiment' }, headers);
  }

  const nowMs = deps.nowMs ? deps.nowMs() : Date.now();
  if (!consumeRateLimit(row.session_id, nowMs)) {
    return jsonResponse(429, { error: 'rate limited' }, headers);
  }

  try {
    await deps.insert(row);
  } catch {
    console.error('telemetry insert failed');
  }
  return new Response(null, { status: 204, headers });
}
