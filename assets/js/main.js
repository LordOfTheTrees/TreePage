document.addEventListener('DOMContentLoaded', function() {
  // Menu button is in the header markup. It stays hidden while the links fit
  // on one row (the approved 390 and 560 layouts) and only collapses the nav
  // when the row would overflow.
  const header = document.querySelector('.site-header');
  const wrap = header ? header.querySelector('.wrap') : null;
  const nav = document.getElementById('site-nav');
  const toggle = header ? header.querySelector('.menu-toggle') : null;

  if (wrap && nav && toggle) {
    function setOpen(open) {
      wrap.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    }

    function rowFits() {
      const wasMenu = wrap.classList.contains('is-menu');
      const wasOpen = wrap.classList.contains('is-open');
      wrap.classList.remove('is-menu', 'is-open');
      const previousWrap = nav.style.flexWrap;
      const previousShrink = nav.style.flexShrink;
      nav.style.flexWrap = 'nowrap';
      nav.style.flexShrink = '0';
      const overflows = wrap.scrollWidth > wrap.clientWidth + 1;
      nav.style.flexWrap = previousWrap;
      nav.style.flexShrink = previousShrink;
      if (wasMenu) wrap.classList.add('is-menu');
      if (wasOpen) wrap.classList.add('is-open');
      return !overflows;
    }

    function syncMenu() {
      if (rowFits()) {
        wrap.classList.remove('is-menu');
        setOpen(false);
        return;
      }
      wrap.classList.add('is-menu');
    }

    toggle.addEventListener('click', function () {
      setOpen(!wrap.classList.contains('is-open'));
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (!wrap.classList.contains('is-menu')) return;
        setOpen(false);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !wrap.classList.contains('is-open')) return;
      setOpen(false);
      toggle.focus();
    });

    syncMenu();
    const onResize = window.TreePage && window.TreePage.debounce
      ? window.TreePage.debounce(syncMenu, 100)
      : syncMenu;
    window.addEventListener('resize', onResize);
  }

  // Smooth scrolling for anchor links. CSS scroll-behavior covers the common
  // case; this also moves focus for the skip link and honors reduced motion.
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      if (id === '#main') {
        target.focus({ preventScroll: true });
      }
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', id);
      }
    });
  });

  // Wires a form to a Netlify function. `collect` returns the JSON payload, or
  // null after marking invalid fields, in which case `invalidMessage` is shown.
  function wireForm({ formId, statusId, endpoint, idleLabel, successMessage, invalidMessage, collect }) {
    const form = document.getElementById(formId);
    if (!form) return;

    const statusEl = document.getElementById(statusId);
    const submitBtn = form.querySelector('button[type="submit"]');
    const functionUrl = `${window.NETLIFY_FUNCTIONS_URL || ''}/.netlify/functions/${endpoint}`;

    function showStatus(msg, type) {
      statusEl.textContent = msg;
      statusEl.className = 'form-status ' + type;
      statusEl.hidden = false;
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const payload = collect(form);
      if (!payload) {
        showStatus(invalidMessage, 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      statusEl.hidden = true;

      try {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, website: honeypotValue(form) })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showStatus(successMessage, 'success');
          form.reset();
        } else {
          showStatus(data.error || 'Something went wrong. Please try again.', 'error');
        }
      } catch {
        showStatus('Could not reach the server. Please try again later.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = idleLabel;
      }
    });
  }

  // Marks a field valid or invalid and returns whether it passed.
  function validate(input, ok) {
    input.classList.toggle('error', !ok);
    return ok;
  }

  wireForm({
    formId: 'contact-form',
    statusId: 'form-status',
    endpoint: 'send-contact',
    idleLabel: 'Send Message',
    successMessage: 'Message sent! Thanks for reaching out.',
    invalidMessage: 'Please fill out all required fields correctly.',
    collect() {
      const name = document.getElementById('name');
      const email = document.getElementById('email');
      const subject = document.getElementById('subject');
      const message = document.getElementById('message');

      // Evaluate every field so each one gets marked, not just the first failure.
      const results = [
        validate(name, Boolean(name.value.trim())),
        validate(email, Boolean(email.value.trim()) && isValidEmail(email.value)),
        validate(message, Boolean(message.value.trim()))
      ];
      if (!results.every(Boolean)) return null;

      return {
        name: name.value.trim(),
        email: email.value.trim(),
        subject: subject.value.trim(),
        message: message.value.trim()
      };
    }
  });

  wireForm({
    formId: 'feedback-form',
    statusId: 'feedback-form-status',
    endpoint: 'send-feedback',
    idleLabel: 'Send Anonymous Feedback',
    successMessage: 'Feedback sent anonymously. Thank you.',
    invalidMessage: 'Please enter your feedback before sending.',
    collect() {
      const message = document.getElementById('feedback-message');
      if (!validate(message, Boolean(message.value.trim()))) return null;

      return {
        topic: document.getElementById('feedback-topic').value,
        action: document.getElementById('feedback-action').value,
        message: message.value.trim()
      };
    }
  });

  // Honeypot value. Empty for humans; automated form fillers populate it.
  function honeypotValue(form) {
    const field = form.querySelector('input[name="website"]');
    return field ? field.value : '';
  }

  function isValidEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
});
