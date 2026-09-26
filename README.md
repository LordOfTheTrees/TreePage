# TreePage

The source for [my personal site and portfolio](https://lordofthetrees.github.io/TreePage/) —
Andrew Erbs, product and strategy. It's a Jekyll site on GitHub Pages, with a
small set of Netlify serverless functions handling contact forms and
privacy-conscious visitor analytics.

## Stack

- **Jekyll**, statically hosted on GitHub Pages
- **Netlify Functions** (Node) for the contact/feedback forms and analytics
  ingestion, backed by **Supabase**
- **GitHub Actions**: CI on every PR (Jekyll build, ESLint, `node --test`),
  plus a weekly workflow that pulls and aggregates analytics data

## Features

- Project and document showcase, driven by `_data/`
- Blog (`_posts/`)
- Photo gallery, sourced live from the repo via the GitHub Contents API
- Contact and anonymous feedback forms, with shared abuse guards (honeypot,
  size limits, a global send budget)
- A public analytics dashboard — see [`docs/analytics.md`](docs/analytics.md)
  for the design decisions behind it, several of which look like bugs and
  are not

## Local setup

Prerequisites: Ruby 3.3.0 (see `.ruby-version`), RubyGems, and a C compiler
for native gem extensions. Node 22+ if you're touching the Netlify functions.

```
git clone https://github.com/LordOfTheTrees/TreePage.git
cd TreePage
bundle install
bundle exec jekyll serve --host 0.0.0.0 --port 4000
```

Then open `http://localhost:4000/TreePage/` — note the `/TreePage` baseurl;
the bare root 404s.

For the Netlify functions and their tests:

```
npm install
npm run lint
npm test
```

The functions need `SUPABASE_URL` and `SUPABASE_ANON_KEY` to actually reach
a database; the Jekyll site runs fine without them.

## Repo layout

- `_data/projects.yml`, `_data/documents.yml` — the project and document
  showcase content
- `_posts/` — blog posts
- `netlify/functions/` — the serverless functions; `netlify/lib/form-guard.js`
  holds the abuse-guard logic shared by the two email-sending functions
- `assets/js/` — browser-side code (`util.js` loads first on every page as
  `window.TreePage`)
- `_sass/` — all styling; no inline `<style>` blocks
- `tests/` — Node's built-in test runner over the functions and shared JS

See [`AGENTS.md`](AGENTS.md) for the full build/serve/lint/test command
reference, and [`docs/analytics.md`](docs/analytics.md) before changing
anything in the analytics subsystem.

## Deployment

The Jekyll site deploys to GitHub Pages on every push to `main`. The
Netlify functions deploy from the same repo via Netlify, configured in
`netlify.toml`.

## License

Apache 2.0
