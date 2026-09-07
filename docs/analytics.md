# Analytics subsystem

How visitor tracking works, what it publishes, and — most importantly — **why it is
built this way**. Several choices here look like bugs or oversights and are not.
Read the Design decisions section before changing anything in this subsystem.

## Data flow

```
visitor loads any page
  └─ assets/js/analytics.js            POST, fire-and-forget
       └─ netlify/functions/track-visit.js
            ├─ geolocation from the x-nf-geo header (Netlify edge, MaxMind)
            └─ INSERT into Supabase `visits`

weekly, Mondays 00:00 UTC
  └─ .github/workflows/sync-analytics.yml
       └─ GET netlify/functions/export-visits.js
            └─ newest 1000 rows + exact all-time count
       └─ aggregates, writes assets/data/analytics-stats.json, commits

visitor loads /analytics-view.html
  └─ analytics.js fetches assets/data/analytics-stats.json (static)
       └─ analytics-display.js renders country bars + weekly timeline
```

Only `track-visit` runs per page view. The dashboard reads a static file; it never
queries Supabase directly.

## Stored fields

The `visits` table holds exactly four fields per row:

| Field | Example | Source |
|---|---|---|
| `country` | `United States` | `x-nf-geo` header |
| `region` | `Connecticut` | `x-nf-geo` header |
| `city` | `New Haven` | `x-nf-geo` header |
| `timestamp` | `2026-09-07T13:30:08Z` | insert time |

No IP address is stored. No cookie, session ID, device identifier, user agent,
referrer, or page path is stored. Nothing links one visit to another.

## Published contract

`export-visits` returns:

| Field | Meaning |
|---|---|
| `visits` | Newest `windowSize` rows, reversed into chronological order |
| `total` | Exact all-time row count, from a separate `head: true` query |
| `returned` | `visits.length` |
| `windowSize` | The configured window (`RECENT_VISIT_LIMIT`) |
| `exportedAt` | ISO timestamp |

The workflow writes `assets/data/analytics-stats.json`:

| Field | Scope |
|---|---|
| `totalVisits` | **All time, whole table** |
| `visitsAnalyzed` | The published window only |
| `visitsByCountry`, `visitsByRegion`, `timeline`, `visits` | The published window only |
| `lastUpdated` | Sync time, timezone-aware UTC |

`totalVisits` and `visitsAnalyzed` are **expected to differ** once the table exceeds
the window. That is not an inconsistency to fix — see D2.

## Design decisions

Each of these is deliberate. Each has a plausible-looking "fix" that breaks
something. If you are about to change one, make sure you can answer the *breaks*
column first.

### D1 — Raw visit rows are published, not just aggregates

**Why.** The dashboard's exploration views — the weekly timeline slider and the
country distribution chart in `analytics-display.js` — read individual records.
Granularity is the feature.

**Breaks if changed.** Replacing `visits` with aggregates silently kills the
timeline and country charts. `createVisualAnalytics(stats.visits)` is a no-op
against an empty array, so the page renders with sections simply missing rather
than erroring — an easy regression to ship without noticing.

### D2 — `totalVisits` comes from a separate count query, not `len(visits)`

**Why.** The export returns a bounded window. Counting the returned rows would peg
the running total at the window size forever.

**Breaks if changed.** `totalVisits` freezes at 1000 and never moves again. This is
the *exact* symptom of the bug fixed in PR #10, arriving by a different route, and
it looks identical from the outside. Do not "simplify" this into `len(visits)` to
make the numbers agree.

### D3 — The export takes the *newest* N rows, ordered descending, then reverses

**Why.** PostgREST caps any unbounded select at 1000 rows. The original code ordered
*ascending* with no limit, so once the table passed 1000 it returned the oldest 1000
and silently dropped everything newer — the dashboard froze on 31 Aug 2026 while
Supabase kept recording. Ordering descending with an explicit `.limit()` makes the
bound intentional instead of accidental, and keeps the window tracking current
traffic. The reverse restores chronological order, which every consumer assumes.

**`RECENT_VISIT_LIMIT` is tunable.** Any value **up to 1000** can be changed freely;
it is a payload-size and display preference, not a magic number.

**Above 1000 requires pagination.** PostgREST will silently truncate at 1000 no
matter what limit you ask for. Raising the constant past 1000 without adding a
`.range()` loop reintroduces the original bug — and reintroduces it *invisibly*,
because a truncated response is indistinguishable from a complete one.

**Breaks if changed.** Removing the limit, or raising it above 1000 without
pagination, re-freezes the dashboard. Dropping the `.reverse()` renders the timeline
backwards.

### D4 — `export-visits` has no authentication

**Why.** It previously had a check written as
`expectedToken && authToken !== expectedToken`, which meant an unset
`EXPORT_AUTH_TOKEN` skipped validation entirely. The workflow never sent a token, so
the check had never once executed in the endpoint's lifetime. It was removed rather
than left as inert code implying protection that was never in place.

The data it serves is coarse geolocation that is not individually identifiable
(see Privacy). There is nothing here that warrants gating.

**Breaks if changed.** Adding a required token without simultaneously configuring it
in **both** Netlify env vars and GitHub Actions secrets makes every Monday sync fail
with a 401. If you do want auth, fail *closed* (reject when the token is unset) —
the fail-open form above is worse than no check at all, because it reads as
protection in review.

### D5 — Geolocation comes from `x-nf-geo`, not ipapi.co

**Why.** The ipapi.co path produced 85–91% `Unknown` country. Netlify's edge geo
header produces 0%. The switch happened around July 2026 and the improvement is
unambiguous:

| Month | Unknown |
|---|---|
| Feb–Jun 2026 | 85.6% – 90.8% |
| Jul 2026 onward | **0.0%** |

`USE_IPAPI_GEO` in `track-visit.js` is `false` and exists only as a fallback for
hosting off Netlify, where `x-nf-geo` does not exist.

**Breaks if changed.** Setting `USE_IPAPI_GEO = true` on Netlify reverts geo quality
to roughly one-in-ten usable. The historical `Unknown` rows in the published data are
legacy artifacts of this era, not a current fault.

### D6 — The `analytics-view.html` disclosure wording is deliberate

**Why.** The paragraph beginning *"This dashboard shows anonymous visitor
statistics…"* is a considered statement of the site's privacy position, not casual
copy. See Privacy below for the reasoning it rests on.

**Breaks if changed.** Editing it for style risks misstating a position that was
chosen on purpose. Do not reword it without the site owner's explicit sign-off —
including to make it "more precise."

## Privacy rationale

This is the reasoning on record for why the dashboard's disclosure holds. It is
recorded here so that anyone changing what is collected can check their change
against it, rather than discovering the constraint afterward.

1. **No identifier is stored.** IP addresses are used transiently by Netlify's edge
   to resolve approximate location and are never written to the database. No
   cookies, device identifiers, or session tokens are set. No visit is linkable to
   another visit, or to a person.
2. **The geography is coarse.** Country / region / city is too broad to single out
   an individual. The records are anonymous statistical data, not pseudonymous data.
3. **Consequence.** Because no personal data is processed, no cookie-consent banner
   and no privacy-policy obligation is triggered.

**This rationale depends on points 1 and 2 remaining true.** Adding any field that
narrows identifiability — IP (even hashed), user agent, referrer, page path, screen
size, a session or visitor ID, or precise coordinates — invalidates the conclusion
in point 3 and means the disclosure text and the site's obligations both have to be
revisited. Treat any such addition as a decision requiring sign-off, not a routine
schema change.

## Known limitations

### The 52-week chart outruns the data window

`analytics-display.js` renders `TOTAL_WEEKS = 52` weeks. The data window is 1000
*visits*, which at the trailing-90-day rate of **6.1 visits/day** covers about **164
days — roughly 23 weeks**. The remaining ~29 weeks of the chart render as empty bars,
and the gap widens as traffic grows: at double the current rate the window covers
about 12 weeks of a 52-week chart.

**This is a defect, not a tradeoff.** Intended fix: reduce `TOTAL_WEEKS` to match the
window's real span. If full-year history is wanted later, the durable answer is to
have `export-visits` return a full-history daily rollup (one small row per day)
alongside the raw window — that restores 52 weeks without unbounding the payload.


## Rendering

Every value the dashboard interpolates into HTML (country and region names, counts)
passes through `escapeHtml` from `assets/js/util.js`. Geo strings come from Netlify's
edge today, but the renderer does not assume that stays true.

## Operations

**Environment variables** (Netlify): `SUPABASE_URL`, `SUPABASE_ANON_KEY` for
`track-visit` and `export-visits`; `RESEND_API_KEY` and `CONTACT_EMAIL` for the
contact and feedback forms. None are needed to run the Jekyll site locally.

**Force a sync** without waiting for Monday: Actions → *Sync Analytics Data* → Run
workflow. The run fails loudly if the export is unreachable or returns no visits —
it will not publish zeros over good data.

**Sanity check after a sync:** `totalVisits` should exceed the previous run's value
and `visitsAnalyzed` should equal `windowSize` once the table is past 1000. If
`totalVisits` matches `visitsAnalyzed` exactly and stays put across two runs, the
window bug has been reintroduced — start at D2 and D3.
