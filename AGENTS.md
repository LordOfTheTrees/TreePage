# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

This is **TreePage**, a Jekyll-based personal portfolio/blog site with Netlify serverless functions for analytics. See `README.md` for general setup.

### Services

| Service | Command | URL |
|---|---|---|
| Jekyll dev server | `bundle exec jekyll serve --host 0.0.0.0 --port 4000` | `http://localhost:4000/TreePage/` |

Note the `/TreePage/` baseurl — navigating to `http://localhost:4000/` alone returns a 404.

### Ruby

Ruby 3.3.0 is installed at `/home/ubuntu/.rubies/ruby-3.3.0/bin` and added to `PATH` via `~/.bashrc`. The `.ruby-version` file specifies `3.3.0`.

### Build & Run

- **Build**: `bundle exec jekyll build` — outputs to `_site/`
- **Serve (dev)**: `bundle exec jekyll serve --host 0.0.0.0 --port 4000` — includes live reload via `--watch`
- **Node deps** (Netlify functions only): `npm install`

### Lint / Test

- **Lint**: `npm run lint` — ESLint over `assets/js`, `netlify/`, and `tests/` (config in `eslint.config.js`).
- **Test**: `npm test` — Node's built-in runner over `tests/`. Covers the Netlify functions (with Resend and Supabase stubbed) and the shared browser helpers.
- **Build**: `bundle exec jekyll build` — fails on Liquid errors, bad front matter, missing includes, and non-ASCII characters in `_sass/` (Sass 3.7 parses SCSS as US-ASCII).

CI runs all three on every pull request and push to `main` (`.github/workflows/ci.yml`).

### Netlify Functions

Serverless functions live in `netlify/functions/` and require `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables. These are only needed for the analytics subsystem and are **not required** for the Jekyll site to run locally.

### Shared code

- `netlify/lib/form-guard.js` — request handling and abuse guards shared by `send-contact` and `send-feedback`. Lives outside `netlify/functions/` on purpose so the bundler treats it as a dependency, not a function.
- `assets/js/util.js` — `escapeHtml` and `debounce`, loaded first on every page as `window.TreePage`.
- `assets/js/photo-utils.js` — photo fetching and filename parsing shared by the photography page and the homepage banner.
- `_sass/` — all styling. There are no inline `<style>` blocks; page-specific rules live in `_home.scss`, `_photography.scss`, `_analytics.scss`.

### Analytics — read before editing

**Read [`docs/analytics.md`](docs/analytics.md) before changing anything in
`netlify/functions/export-visits.js`, `netlify/functions/track-visit.js`,
`.github/workflows/sync-analytics.yml`, `assets/js/analytics*.js`, or the disclosure
text in `analytics-view.html`.**

Several choices in that subsystem look like bugs and are deliberate. The load-bearing
ones, each of which has a plausible-looking "fix" that breaks something:

- Raw visit rows are published on purpose — the timeline and country charts read them.
- `totalVisits` comes from a separate count query, **not** `len(visits)`. Making the
  numbers "agree" freezes the counter permanently.
- The export takes the **newest** 1000 rows. Removing the limit, or raising it above
  1000 without adding pagination, silently re-truncates (PostgREST caps at 1000).
- `export-visits` has no auth by design. Adding a required token without configuring
  it in both Netlify and GitHub Actions breaks the weekly sync.
- The privacy wording in `analytics-view.html` is deliberate and rests on a recorded
  rationale. Do not reword it without the site owner's sign-off.

### Known Gotchas

- Jekyll 3.9.x with Ruby 3.3+ emits a `bigdecimal` deprecation warning from the `liquid` gem — this is harmless and can be ignored.
- The `Gemfile.lock` may reference a newer Bundler version than what ships with Ruby 3.3.0; Bundler auto-upgrades on first `bundle install`.
