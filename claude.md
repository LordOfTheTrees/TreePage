# TreePage - Andrew Erbs Personal Website

This is a Jekyll-based personal website and portfolio hosted on GitHub Pages. The site showcases projects, blog posts about data analysis, photography, and professional information.

## Project Overview

**Site URL**: https://lordofthetrees.github.io/TreePage
**Framework**: Jekyll (Ruby-based static site generator)
**Hosting**: GitHub Pages
**Base Path**: `/TreePage`

## Technology Stack

- **Jekyll**: Static site generator (v4.3.4)
- **Ruby**: 2.7.0+
- **Markdown**: Kramdown for content
- **Sass/SCSS**: For styling (compressed in production)
- **JavaScript**: Custom analytics integration
- **Netlify Functions**: Backend analytics processing
- **GitHub Pages**: Static site hosting

## Project Structure

```
/
├── _config.yml              # Jekyll site configuration
├── _data/
│   ├── projects.yml         # Project portfolio data
│   └── documents.yml        # Shared documents data
├── _includes/               # Reusable HTML components
├── _layouts/                # Page templates
├── _posts/                  # Blog posts (Markdown)
│   └── YYYY-MM-DD-title.md
├── _sass/                   # Sass stylesheets
├── assets/                  # Images, CSS, JS
├── pages/                   # Static pages (about, contact, etc.)
├── netlify/                 # Netlify Functions for analytics
├── index.html               # Homepage
└── analytics-*.{html,json}  # Analytics dashboard files
```

## Key Features

### Blog Posts
- Located in `_posts/` directory
- Named with format: `YYYY-MM-DD-title.md`
- Written in Markdown with YAML frontmatter
- Topics include NFL QB analytics, data science, and technical projects

### Projects Portfolio
- Data stored in `_data/projects.yml`
- Includes 7+ major projects covering:
  - Data analytics (NFL QB analysis, Airbnb investment analysis)
  - AI automation (Jira-Claude integration, News Intelligence)
  - Web applications (Sports calendar generators, Jiu-Jitsu app)

### Analytics System
- Custom analytics tracking via Netlify Functions
- Dashboard at `analytics-view.html`
- Stats stored in `analytics-stats.json`
- Backend URL: https://remarkable-syrniki-5c721e.netlify.app

### Pages
- **About**: Professional background
- **Projects**: Portfolio showcase
- **Posts**: Blog index
- **Photography**: Photo gallery
- **Contact**: Contact form

## Development Workflow

### Local Development

```bash
# Install dependencies
bundle install

# Run development server
bundle exec jekyll serve

# Access at http://localhost:4000/TreePage
```

### Content Creation

**New Blog Post:**
1. Create file: `_posts/YYYY-MM-DD-post-title.md`
2. Add YAML frontmatter:
   ```yaml
   ---
   layout: post
   title: "Your Title"
   date: YYYY-MM-DD
   categories: [category]
   ---
   ```
3. Write content in Markdown
4. Images go in `assets/images/`

**New Project:**
1. Edit `_data/projects.yml`
2. Add entry with required fields:
   - title
   - description
   - technologies (array)
   - github_url
   - key_features (array)

### Styling

- Sass files in `_sass/`
- Main styles compiled from `assets/css/`
- Compressed in production (see `_config.yml`)

## Git Branch Strategy

- **Main branch**: Production site (auto-deploys to GitHub Pages)
- **Feature branches**: Use `claude/*` prefix for AI-assisted development
- Current branch: `claude/create-claude-md-P4ZpP`

## Important Notes

### Jekyll Specifics
- `baseurl: "/TreePage"` is critical for GitHub Pages subdirectory hosting
- Liquid templating engine used in layouts and includes
- Site builds automatically on push to main branch
- Build excludes: Gemfile, node_modules, vendor, README.md

### Content Guidelines
- Blog posts focus on data science, sports analytics, and technical projects
- Professional tone with detailed technical explanations
- Code examples and visualizations are common
- Projects emphasize practical applications and measurable outcomes

### Common Tasks

**Add a new page:**
1. Create file in `pages/` directory
2. Add YAML frontmatter with layout and title
3. Link from navigation if needed

**Update site metadata:**
- Edit `_config.yml` for site-wide settings
- Update title, description, social links
- Modify plugin configuration

**Deploy changes:**
1. Commit changes to feature branch
2. Test locally with `bundle exec jekyll serve`
3. Push to branch
4. Merge to main for production deployment

## Dependencies

See `Gemfile` for complete list. Key gems:
- jekyll (~> 4.3.4)
- jekyll-feed
- jekyll-seo-tag
- jekyll-sitemap

## Analytics Integration

The site includes custom analytics:
- Page view tracking
- Netlify Functions backend
- Privacy-focused (no third-party trackers)
- Dashboard for viewing stats
- JSON storage for aggregated data

## Contact & Links

- **GitHub**: @lordofthetrees
- **LinkedIn**: andrew-erbs-59bb9365
- **License**: Apache 2.0

## Tips for Working with This Codebase

1. **Test locally** before pushing - Jekyll builds can fail silently
2. **Check `_config.yml`** when adding plugins or changing structure
3. **Use relative URLs** with `{{ site.baseurl }}` for subdirectory hosting
4. **Validate YAML** in frontmatter - syntax errors break builds
5. **Optimize images** before adding to `assets/` - large files slow the site
6. **Follow naming conventions** for posts (date-based) and pages (lowercase with hyphens)
7. **Check GitHub Pages build status** after pushing to main branch

## Known Configuration

- Ruby version: 2.7.0 (see `.ruby-version`)
- Jekyll environment: production (for GitHub Pages)
- Markdown parser: kramdown
- Permalinks: Default Jekyll structure
- Collections: Projects collection with output enabled
