# Andrew Erbs - Personal Website

This repository contains the source code for my personal website, built with Jekyll and hosted on GitHub Pages. It should be extremely easy to repurpose to match your needs.

## Features

- Responsive design
- Project showcase
- Blog functionality
- Contact form
- Analytics integration (see [`docs/analytics.md`](docs/analytics.md))

## Setup

### Prerequisites

- Ruby 3.3.0 (see `.ruby-version`)
- RubyGems
- GCC and Make (for compiling gems with native extensions)

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/yourusername.github.io.git
   cd yourusername.github.io
   ```

2. Install dependencies:
   ```
   bundle install
   ```

3. Run the site locally:
   ```
   bundle exec jekyll serve
   ```

4. Open your browser to `http://localhost:4000`

## Customization

- Edit `_config.yml` to update site-wide settings
- Modify files in `_posts` to add blog content
- Update `_data/projects.yml` to showcase your work
- Add documents to be shared in `_data/documents.yml`

## Documentation

- [`docs/analytics.md`](docs/analytics.md) — how visitor tracking works, the
  published data contract, and the design decisions behind it. **Read this before
  changing the analytics functions, the sync workflow, or the dashboard.** Several
  choices there look like bugs and are deliberate.
- [`AGENTS.md`](AGENTS.md) — build, serve, and lint/test commands.

## Deployment

This site is automatically deployed to GitHub Pages whenever changes are pushed to the main branch.

## License

apache 2.0