---
layout: default
permalink: /docs/telemetry.html
sitemap: false
title: Product telemetry
description: "How this site records product events such as page views, subscribe intent, and experiments, in a table kept separate from the public visits dashboard."
redirect_from:
  - /TreePage/docs/telemetry.html
---

# Product telemetry

TreePage records first-party product events so a biweekly review can measure traffic, engagement, Substack signup intent, and simple experiments. The browser sends a small JSON body to the Supabase Edge Function `treepage-track`. The function writes rows to `public.treepage_events` in the Supabase project **Website Visit Tracking** (`uwwokqqfnqtdlddbvqgk`).

That project also holds other sites. This table is namespaced for TreePage. Leave `public.visits`, `public.form_send_log`, and `public.octagonelo_events` alone.

The tracker is `assets/js/track.js` (about 7 KB of source, under 3 KB gzipped, which is what GitHub Pages sends). It uses `navigator.sendBeacon` with a string body (`text/plain;charset=UTF-8`, a CORS-safelisted type, so the browser does not preflight). If `sendBeacon` is missing it falls back to `fetch` with `keepalive`. It does not use cookies, `localStorage`, or any third-party script.

## Relationship to `public.visits`

The existing visit pipeline is unchanged. `assets/js/analytics.js` still POSTs to the Netlify `track-visit` function, which still inserts `country`, `region`, `city`, and `timestamp` into `public.visits`. The weekly export, `assets/data/analytics-stats.json`, and the public dashboard still read that table. See [`docs/analytics.md`](analytics.html).

`page_view` in `treepage_events` is an additional event, not a replacement. Once it has a comparable history, `public.visits` can be retired. Until then, do not delete the table or stop `track-visit`.

The dashboard sentence in `analytics-view.html` describes the visits dashboard only. It is deliberate. Do not reword it. The guarantees below apply to `treepage_events`, which does store a coarse daily session id, a path, and a referrer domain. That is a different collection from `public.visits`, and the footer note is the public description of it.

## Privacy

The function builds a coarse session id by hashing, with SHA-256, the client IP (the first value in `x-forwarded-for`), the user agent, the UTC date, and a salt, joined with `|` in that order. Only the first 16 hex characters are stored. The value rotates at midnight UTC. It cannot be reversed into an IP or a user agent, and those raw values are never written.

The salt is `TELEMETRY_SALT` when that env var is set. Otherwise the function reads `public.telemetry_config` where `key = 'treepage_salt'` and caches the value for the life of the instance. The migration inserts a random salt with `encode(extensions.gen_random_bytes(32), 'hex')` when the row is absent. The table has RLS forced, no policies, and no grants for `anon` or `authenticated`. Only `service_role` can select it.

A request is dropped (HTTP 204, nothing stored) when the `DNT` header is `1` or the `Sec-GPC` header is `1`. The browser tracker also skips the send when `navigator.doNotTrack` is `1` or Global Privacy Control is set.

Paths are stored without a query string. A path that contains `@` is dropped. Referrers are reduced to a hostname, with a leading `www.` removed. Country is stored only when a proxy already sent a two-letter code on `cf-ipcountry`, `x-vercel-ip-country`, `cloudfront-viewer-country`, or `x-country-code`. Unknown codes such as `XX` and `T1` are omitted. Device class is `mobile` or `desktop`, from the client hint when it is one of those two values, otherwise from the user agent. The user agent itself is not stored.

The `props` object is a handful of short scalars (at most 12 keys, strings at most 80 characters). Keys that look like email, name, message, password, token, or IP are dropped, as are strings that contain `@`.

The subscribe form posts the email straight to `treeflow.substack.com`. The beacon for `substack_subscribe_submit` fires on submit and does not read the email field.

UTM source, medium, and campaign are read from the page URL and kept in memory for that page only. They are not written to `localStorage` or `sessionStorage`.

CORS allows `https://lordofthetrees.github.io` and `http://localhost` or `http://127.0.0.1` (any port). Other origins are rejected.

## Events

| Event | When it fires | Props |
| --- | --- | --- |
| `page_view` | Each full page load | none |
| `substack_subscribe_submit` | Submit of the form that posts to `treeflow.substack.com` | none (no email) |
| `substack_link_click` | A click on a `substack.com` link | none |
| `outbound_click` | A click on LinkedIn, GitHub, or an off-site contact link, outside a project card | `host` |
| `resume_download` | A click on a resume link (href contains `resume` and ends in `.pdf`, ends in `/resume`, or a download link whose text says resume). The site has no resume link today, so this does not fire until one is added | `host` |
| `gallery_photo_open` | A click on a photo in `#photo-gallery` (`.photo-item`) | none |
| `project_card_click` | A click on a link inside a homepage card (`article.card`), the homepage "More work" list (`.more-work`), or a projects-page card (`.project-card`). GitHub project links are this event, not also `outbound_click` | `host` |
| `scroll_depth` | The reader reaches 25, 50, 75, and 100 percent of the page, once each | `depth` |
| `experiment_exposure` | Once per configured experiment, on each page load | none (key and variant are columns) |

`experiment_exposure` is sent by the browser. The function accepts it only with a valid `experiment_key` and `variant`.

## Experiments

Active experiments live in `_data/experiments.yml`. The file ships with an empty list, so no variant is assigned, nothing is written to `sessionStorage`, and no exposure row is sent.

To start one, edit that file and redeploy the site:

```yaml
experiments:
  - key: example_copy
    variants:
      - control
      - short
```

Keys and variant names are a lowercase letter followed by lowercase letters, digits, and underscores (key up to 40 characters, variant up to 32, two to eight variants). On load the browser reads a random seed from `sessionStorage` (`tp_exp_seed`), creating one for the tab when it is missing. The variant is `hash(experiment key + seed)` modulo the variant list. The same tab keeps the same variant until the tab closes. The seed is not sent. Count distinct `session_id` values, knowing that the server session id rotates at midnight UTC and is not the same string as the tab seed.

`window.TreePage.experiment(key)` returns the assigned variant, or `null` when that key is not running. The shipped site does not change any copy from it.

## Ingest

`POST https://uwwokqqfnqtdlddbvqgk.supabase.co/functions/v1/treepage-track`

The function parses a JSON body whether the content type is `text/plain` or `application/json`. Opt-out, and a missing salt or missing Supabase env, return 204 and write nothing. Bodies larger than 4 KB, invalid JSON, and unknown event names return 400. An `experiment_exposure` without a valid key and variant returns 400. Each coarse session may record 180 events per 60 seconds inside one instance; the next request returns 429. The limit lives in memory, so two instances each keep their own counter.

The insert uses the Supabase REST API (`/rest/v1/treepage_events`). The database key is `SUPABASE_SECRET_KEY` when that Edge Function secret is set, and `SUPABASE_SERVICE_ROLE_KEY` otherwise. Every REST call sends `apikey`. `Authorization: Bearer` is added only when the key starts with `eyJ`, which is how a legacy JWT service-role key is shaped. New secret keys (`sb_secret_...`) are not JWTs, so they are sent as `apikey` only. A failed insert is logged and still returns 204.

### `verify_jwt`

`supabase/config.toml`:

```toml
[functions.treepage-track]
verify_jwt = false
```

This is a public beacon. `sendBeacon` cannot send a JWT. Deploying with verification left on rejects every event at the gateway.

## Deploy

`supabase/migrations/20261120200000_create_treepage_events.sql` is already applied on project `uwwokqqfnqtdlddbvqgk` (Website Visit Tracking). It created `public.treepage_events` and `public.telemetry_config`, including the `treepage_salt` row. Do not run it again. On a fresh project, paste that file into the SQL editor and run it once. Do not use `supabase db push` against this project from a second repo: OctagonELO migrations may already be in the remote history, and a push from this checkout can refuse to run.

The script creates `public.treepage_events` and `public.telemetry_config`, indexes `created_at` and `event`, enables and forces row level security, and creates no policies. `anon` and `authenticated` have no grants. It inserts `treepage_salt` only when that key is absent.

After it runs, this should return zero rows and one salt row (the salt value is not shown here on purpose):

```sql
select count(*) from public.treepage_events;
select key, char_length(value) from public.telemetry_config where key = 'treepage_salt';
```

Deploy the function with the Supabase CLI, from this repo:

```bash
supabase link --project-ref uwwokqqfnqtdlddbvqgk
supabase functions deploy treepage-track
```

`verify_jwt = false` comes from `supabase/config.toml`. The equivalent one-shot flag is `supabase functions deploy treepage-track --no-verify-jwt`.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to Edge Functions automatically. Legacy JWT keys (`eyJ...`) retire in early 2027. To future-proof this function, set `SUPABASE_SECRET_KEY` (an `sb_secret_...` value) as an Edge Function secret before then. The function reads that secret first and falls back to `SUPABASE_SERVICE_ROLE_KEY`. Set `TELEMETRY_SALT` only if you want to override the table salt. Do not put either key in the site, in git, or in GitHub Pages.

Local Jekyll (`http://localhost:4000/`) is an allowed origin, so a deployed function will accept events from `jekyll serve`. The function has to be deployed first. Missing configuration returns 204, so a local page with the function unreachable still renders.

## Example queries

Daily visitors (distinct coarse sessions with a page view):

```sql
select
  (created_at at time zone 'utc')::date as day,
  count(distinct session_id) as visitors
from public.treepage_events
where event = 'page_view'
group by 1
order by 1 desc;
```

Top pages over the last 14 days:

```sql
select path, count(*) as views
from public.treepage_events
where event = 'page_view'
  and created_at >= now() - interval '14 days'
group by path
order by views desc
limit 30;
```

Subscribe conversion by day. A session counts as a submit when it fired `substack_subscribe_submit`. The form can still fail at Substack after that.

```sql
with views as (
  select
    (created_at at time zone 'utc')::date as day,
    count(distinct session_id) as visitors
  from public.treepage_events
  where event = 'page_view'
  group by 1
),
signups as (
  select
    (created_at at time zone 'utc')::date as day,
    count(distinct session_id) as submits
  from public.treepage_events
  where event = 'substack_subscribe_submit'
  group by 1
)
select
  views.day,
  views.visitors,
  coalesce(signups.submits, 0) as submits,
  round(coalesce(signups.submits, 0)::numeric / nullif(views.visitors, 0), 4) as conversion
from views
left join signups using (day)
order by views.day desc;
```

Experiment conversion, using subscribe submits as the outcome. Replace the experiment key.

```sql
with exposed as (
  select distinct session_id, variant
  from public.treepage_events
  where event = 'experiment_exposure'
    and experiment_key = 'example_copy'
),
converted as (
  select distinct session_id
  from public.treepage_events
  where event = 'substack_subscribe_submit'
)
select
  exposed.variant,
  count(*) as exposed_sessions,
  count(converted.session_id) as converted_sessions
from exposed
left join converted using (session_id)
group by exposed.variant
order by exposed.variant;
```
