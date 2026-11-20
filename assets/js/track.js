// First-party beacon. No cookies, no localStorage, no third-party script.
// A tab experiment seed may sit in sessionStorage and is never sent.
(function (w, d) {
  'use strict';

  const fallback = 'https://uwwokqqfnqtdlddbvqgk.supabase.co/functions/v1/treepage-track';
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign'];
  const utmRe = /^[-A-Za-z0-9._~+]{1,64}$/;
  const keyRe = /^[a-z][a-z0-9_]{0,39}$/;
  const varRe = /^[a-z][a-z0-9_]{0,31}$/;
  const marks = [25, 50, 75, 100];
  const tag = d.currentScript;
  const endpoint = (tag && tag.getAttribute('data-endpoint')) || fallback;
  let experiments = [];
  try {
    const parsed = JSON.parse((tag && tag.getAttribute('data-experiments')) || '[]');
    if (Array.isArray(parsed)) experiments = parsed;
  } catch { /* ignore a bad config */ }

  let utm = null;
  const seen = {};
  let optedOut = false;

  function privacyOptOut() {
    try {
      const nav = w.navigator || {};
      return (nav.doNotTrack || w.doNotTrack) === '1' || nav.globalPrivacyControl === true;
    } catch { return false; }
  }

  function readUtm() {
    if (utm) return utm;
    const fields = {};
    try {
      const params = new URLSearchParams(w.location.search);
      utmKeys.forEach((key) => {
        const value = params.get(key);
        if (value && utmRe.test(value)) fields[key] = value;
      });
    } catch { /* ignore a bad location */ }
    utm = fields;
    return fields;
  }

  function deviceClass() {
    try {
      const narrow = w.matchMedia('(max-width: 768px)').matches;
      const coarse = w.matchMedia('(pointer: coarse)').matches;
      return narrow || coarse ? 'mobile' : 'desktop';
    } catch { return 'desktop'; }
  }

  function hostOf(href) {
    try {
      return new URL(href, w.location.origin).hostname.toLowerCase().replace(/^www\./, '');
    } catch { return ''; }
  }

  function send(body) {
    try {
      const json = JSON.stringify(body);
      if (json.length > 2000) return;
      const nav = w.navigator;
      if (nav && typeof nav.sendBeacon === 'function' && nav.sendBeacon(endpoint, json)) return;
      w.fetch(endpoint, {
        method: 'POST',
        body: json,
        headers: { 'content-type': 'text/plain;charset=UTF-8' },
        keepalive: true,
        credentials: 'omit',
        mode: 'cors'
      }).catch(() => {});
    } catch { /* never break the page */ }
  }

  function track(event, extra) {
    if (optedOut) return;
    const body = { event, path: w.location.pathname, device_class: deviceClass(), ...readUtm() };
    const referrer = d.referrer ? hostOf(d.referrer) : '';
    if (referrer) body.referrer = referrer;
    if (extra) Object.assign(body, extra);
    send(body);
  }

  function withHost(host) {
    return host ? { props: { host: host.slice(0, 80) } } : null;
  }

  function isResume(link, href) {
    const path = href.split('?')[0].toLowerCase();
    const text = (link.textContent || '').toLowerCase();
    if (path.endsWith('/resume.pdf') || path.endsWith('/resume')) return true;
    if (path.indexOf('resume') !== -1 && path.endsWith('.pdf')) return true;
    return link.hasAttribute('download') && text.indexOf('resume') !== -1;
  }

  function onClick(event) {
    const target = event.target;
    if (!target || !target.closest) return;
    if (target.closest('.photo-item')) { track('gallery_photo_open'); return; }
    const link = target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return;
    const host = hostOf(href);
    if (isResume(link, href)) { track('resume_download', withHost(host)); return; }
    if (host === 'substack.com' || host.endsWith('.substack.com')) {
      track('substack_link_click');
      return;
    }
    if (link.closest('article.card, .project-card, .more-work')) {
      track('project_card_click', withHost(host));
      return;
    }
    const own = (w.location.hostname || '').replace(/^www\./, '').toLowerCase();
    const listed = host === 'linkedin.com' || host.endsWith('.linkedin.com')
      || host === 'github.com' || host.endsWith('.github.com');
    let contact = false;
    if (host && host !== own) {
      const text = (link.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      let path = '';
      try { path = new URL(href, w.location.origin).pathname.toLowerCase(); } catch { path = ''; }
      contact = text === 'contact' || path.indexOf('/contact') !== -1;
    }
    if ((listed || contact) && host) track('outbound_click', withHost(host));
  }

  function onSubmit(event) {
    const form = event.target;
    const action = form && form.getAttribute ? form.getAttribute('action') || '' : '';
    if (action.indexOf('treeflow.substack.com') !== -1) track('substack_subscribe_submit');
  }

  function fnv(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function variantsOf(experiment) {
    if (!experiment || !keyRe.test(experiment.key) || !Array.isArray(experiment.variants)) return null;
    const variants = [];
    experiment.variants.forEach((variant) => {
      if (varRe.test(variant) && variants.indexOf(variant) === -1) variants.push(variant);
    });
    if (variants.length < 2 || variants.length > 8) return null;
    return variants;
  }

  function assignVariants() {
    const assigned = {};
    const usable = [];
    experiments.forEach((experiment) => {
      const variants = variantsOf(experiment);
      if (variants) usable.push({ key: experiment.key, variants });
    });
    if (!usable.length) return assigned;
    let seed = 'session';
    try {
      seed = w.sessionStorage.getItem('tp_exp_seed') || '';
      if (!seed) {
        seed = Math.random().toString(36).slice(2) + Date.now().toString(36);
        w.sessionStorage.setItem('tp_exp_seed', seed);
      }
    } catch { seed = 'session'; }
    usable.forEach((experiment) => {
      const index = fnv(`${experiment.key}\n${seed}`) % experiment.variants.length;
      assigned[experiment.key] = experiment.variants[index];
    });
    return assigned;
  }

  function checkScroll() {
    const max = d.documentElement.scrollHeight - w.innerHeight;
    const pct = max <= 0 ? 100 : (w.scrollY / max) * 100;
    marks.forEach((mark) => {
      if (seen[mark] || pct < mark) return;
      seen[mark] = true;
      track('scroll_depth', { props: { depth: mark } });
    });
  }

  function boot() {
    optedOut = privacyOptOut();
    if (optedOut) return;
    const assigned = assignVariants();
    w.TreePage = Object.assign(w.TreePage || {}, {
      experiment(key) { return assigned[key] || null; }
    });
    track('page_view');
    Object.keys(assigned).forEach((key) => {
      track('experiment_exposure', { experiment_key: key, variant: assigned[key] });
    });
    d.addEventListener('click', onClick, true);
    d.addEventListener('submit', onSubmit, true);
    w.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
