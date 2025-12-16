# Netlify Analytics Setup Guide

## Overview
This analytics system uses Netlify Functions as a lightweight proxy for IP geolocation API calls (avoiding CORS and hiding API keys). Visit data is stored in `_data/visits.json` in the GitHub repository via GitHub API. Data is aggregated monthly via GitHub Actions into `_data/analytics-stats.json`.

## Architecture
1. **Netlify Function** (`track-visit.js`):
   - Gets visitor location via IP geolocation API
   - Appends visit data to `_data/visits.json` in GitHub repo via GitHub API

2. **GitHub Actions**: 
   - Monthly workflow (1st of each month) that aggregates `_data/visits.json` into `_data/analytics-stats.json`

3. **Analytics Dashboard**: 
   - Reads from `analytics-stats.json` endpoint (served via Jekyll from `_data/analytics-stats.json`)

## Setup Instructions

### 1. Netlify Configuration

1. Deploy your site to Netlify (or connect existing Netlify site)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set environment variables in Netlify dashboard (Site settings → Environment variables):
   - `GITHUB_TOKEN`: GitHub Personal Access Token with `repo` scope
   - `GITHUB_REPO_OWNER`: Repository owner (default: `LordOfTheTrees`)
   - `GITHUB_REPO_NAME`: Repository name (default: `TreePage`)
   - `IP_API_KEY`: (Optional) API key for ipapi.co if you have one

### 2. GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope (full control of private repositories)
3. Copy the token and add it to Netlify environment variables as `GITHUB_TOKEN`

### 3. GitHub Actions Secrets

The workflow uses `GITHUB_TOKEN` automatically (provided by GitHub Actions), so no additional secrets are needed for the aggregation workflow.

### 4. Testing

1. Visit your site - visits should be tracked via Netlify Function
2. Check `_data/visits.json` in your repo - it should contain visit entries
3. Manually trigger the GitHub Action (`.github/workflows/aggregate-analytics.yml`) to test aggregation
4. Check `_data/analytics-stats.json` for aggregated data
5. Visit `/analytics-view.html` to see the dashboard

## Monthly Aggregation

The GitHub Action runs on the 1st of each month at midnight UTC. It:
1. Reads `_data/visits.json`
2. Aggregates by country, region, and timeline
3. Generates `_data/analytics-stats.json`
4. Commits and pushes the updated stats file

## File Locations

- Netlify Function: `netlify/functions/track-visit.js`
- Visit data: `_data/visits.json` (committed to repo)
- Aggregated stats: `_data/analytics-stats.json` (committed to repo)
- Stats endpoint: `analytics-stats.json` (Jekyll page serving the data)
- GitHub Action: `.github/workflows/aggregate-analytics.yml`
- Tracking script: `assets/js/analytics.js`
- Analytics page: `analytics-view.html`

## Rate Limits

- **GitHub API**: 5,000 requests/hour (sufficient for tracking)
- **ipapi.co**: 1,000 requests/day (free tier) - consider upgrading if needed
- **Netlify Functions**: 125,000 invocations/month (free tier - sufficient for personal site)

## Privacy

No personal identifying information is collected. Only geographic information (country, region, city) and timestamp are stored.
