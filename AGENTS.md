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

There are no dedicated lint or test commands configured in this repository. Jekyll build itself (`bundle exec jekyll build`) serves as the primary validation — it will fail on Liquid template errors, invalid YAML front matter, or missing includes.

### Netlify Functions

Serverless functions live in `netlify/functions/` and require `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables. These are only needed for the analytics subsystem and are **not required** for the Jekyll site to run locally.

### Known Gotchas

- Jekyll 3.9.x with Ruby 3.3+ emits a `bigdecimal` deprecation warning from the `liquid` gem — this is harmless and can be ignored.
- The `Gemfile.lock` may reference a newer Bundler version than what ships with Ruby 3.3.0; Bundler auto-upgrades on first `bundle install`.
