# Analytics Implementation Status & Next Steps

## Current State

### What's Been Implemented

1. **Netlify Functions Created:**
   - `netlify/functions/get-location.js` - Proxy for IP geolocation API (hides API keys, avoids CORS)
   - `netlify/functions/store-visit.js` - Currently uses `/tmp` storage (NOT persistent - needs update)
   - `netlify/functions/export-visits.js` - Exports visits for weekly sync (needs Supabase integration)

2. **GitHub Actions Workflow:**
   - `.github/workflows/sync-analytics.yml` - Weekly sync workflow (runs Mondays)
   - Currently configured to fetch from Netlify export endpoint
   - Aggregates data and commits to `assets/data/analytics-stats.json`

3. **Frontend Updates:**
   - `assets/js/analytics.js` - Updated to call Netlify Functions and read from `assets/data/analytics-stats.json`
   - `assets/js/analytics-display.js` - Updated to work with new data format
   - `analytics-view.html` - Updated description text

4. **Configuration Files:**
   - `netlify.toml` - Netlify configuration
   - `assets/data/analytics-stats.json` - Empty stats file (initialized)

## Architecture Decision

**Storage Solution: Supabase**
- Netlify Functions are stateless, so `/tmp` doesn't persist
- Need persistent storage for visit data
- **Decision: Use Supabase** (free tier: 500MB database, unlimited API requests)
- Supabase project URL: `https://supabase.com/dashboard/project/uwwokqqfnqtdlddbvqgk`

**Why Netlify Functions:**
- Acts as proxy for IP geolocation API (hides API keys, avoids CORS issues)
- No server management needed

## What Needs to Be Done

### 1. Set Up Supabase Database

**Create a table for visits:**
```sql
CREATE TABLE visits (
  id BIGSERIAL PRIMARY KEY,
  country TEXT NOT NULL,
  region TEXT,
  city TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_visits_timestamp ON visits(timestamp);
CREATE INDEX idx_visits_country ON visits(country);
```

**Get API credentials:**
- Go to Supabase Dashboard → Settings → API
- Copy:
  - Project URL (e.g., `https://uwwokqqfnqtdlddbvqgk.supabase.co`)
  - `anon` public key (safe for client-side use)

### 2. Update Netlify Functions

**Update `netlify/functions/store-visit.js`:**
- Remove `/tmp` file storage
- Add Supabase client
- Insert visit into Supabase `visits` table
- Use environment variable for Supabase URL and anon key

**Update `netlify/functions/export-visits.js`:**
- Remove `/tmp` file reading
- Query Supabase `visits` table
- Return all visits as JSON
- Use environment variable for Supabase URL and anon key

### 3. Configure Environment Variables

**Netlify Dashboard:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon/public key
- `IP_API_KEY` (optional) - API key for ipapi.co if you have one
- `EXPORT_AUTH_TOKEN` - Random token for securing export endpoint

**GitHub Secrets:**
- `NETLIFY_SITE_URL` - Your Netlify site URL
- `NETLIFY_EXPORT_TOKEN` - Same as `EXPORT_AUTH_TOKEN`
- `SUPABASE_URL` - For GitHub Action to query Supabase directly (or use Netlify export)
- `SUPABASE_ANON_KEY` - For GitHub Action

### 4. Update GitHub Actions Workflow

**Option A: Query Supabase directly from GitHub Action**
- Add Supabase credentials to GitHub Secrets
- Query Supabase `visits` table directly
- Aggregate and commit to repo

**Option B: Use Netlify export endpoint**
- Keep current approach
- Netlify function queries Supabase and returns data
- GitHub Action fetches from Netlify

**Recommendation: Option A** (simpler, fewer moving parts)

### 5. Testing

1. Deploy to Netlify
2. Set environment variables
3. Visit site - should track to Supabase
4. Manually trigger GitHub Action
5. Verify `assets/data/analytics-stats.json` is updated
6. Check analytics page displays data

## File Structure

```
netlify/
  functions/
    get-location.js      ✅ Done (IP geolocation proxy)
    store-visit.js       ⚠️ Needs Supabase integration
    export-visits.js     ⚠️ Needs Supabase integration

.github/
  workflows/
    sync-analytics.yml   ⚠️ May need update for Supabase

assets/
  js/
    analytics.js         ✅ Updated for Netlify Functions
    analytics-display.js ✅ Updated for new data format
  data/
    analytics-stats.json ✅ Initialized (empty)

analytics-view.html      ✅ Updated description
netlify.toml            ✅ Created
```

## Key Decisions Made

1. **Netlify Functions** - For IP geolocation proxy (avoids CORS, hides API keys)
2. **Supabase** - For persistent visit storage (free tier sufficient)
3. **Weekly Sync** - GitHub Action aggregates and commits to repo (avoids rate limits)
4. **Static File Display** - Analytics page reads from `assets/data/analytics-stats.json` (served as static file)

## Next Steps Summary

1. Create Supabase table for visits
2. Get Supabase API credentials
3. Update `store-visit.js` to write to Supabase
4. Update `export-visits.js` to read from Supabase
5. Update GitHub Action to query Supabase (or use Netlify export)
6. Set environment variables in Netlify and GitHub
7. Test end-to-end flow

## Notes

- CORS: Cross-Origin Resource Sharing - browser security that blocks cross-domain requests. Netlify Functions avoid this by making server-to-server calls.
- Netlify Functions are stateless - `/tmp` doesn't persist between invocations
- Supabase free tier: 500MB database, 2GB bandwidth, unlimited API requests
- Weekly sync runs every Monday at midnight UTC

