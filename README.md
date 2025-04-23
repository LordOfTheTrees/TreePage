# Andrew Erbs - Personal Website

This repository contains the source code for my personal website, built with Jekyll and hosted on GitHub Pages.

## Features

- Responsive design
- Project showcase
- Blog functionality
- Contact form
- Analytics integration

## Setup

### Prerequisites

- Ruby 2.7.0 or higher
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

## Deployment

This site is automatically deployed to GitHub Pages whenever changes are pushed to the main branch.

## License

apache 2.0