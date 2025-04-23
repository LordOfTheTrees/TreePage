source "https://rubygems.org"

# Use a specific Jekyll version for local development
gem "jekyll", "~> 3.9.3"

# This is the default theme for new Jekyll sites
gem "minima", "~> 2.5"

# GitHub Pages compatibility - use this instead of the github-pages gem
gem "kramdown-parser-gfm", "~> 1.1.0"

# Plugins
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end

# Windows and JRuby specific gems
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Required for Ruby 3.0+
gem "webrick", "~> 1.8"