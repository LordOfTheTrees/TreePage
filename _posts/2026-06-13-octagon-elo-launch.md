---
layout: post-banner
title: "OctagonELO Is Live: Pre-Fight MMA Predictions You Can Read"
date: 2026-6-13
categories: [Product, Combat Sports, Data Science]
banner_image: /assets/images/octagon-elo/octagon-elo-banner.png
banner_alt: "OctagonELO: MMA fight predictions and analytics"
---

*OctagonELO is live today at [octagonelo.com](https://octagonelo.com). Here is the problem it solves, how the model turns fight history into calibrated probabilities, and what you get on the site right now.*

## Introduction

If you follow MMA seriously, you already know the gap between watching a card and understanding it. Odds boards compress everything into a single number. Highlight reels tell you who won, not how likely each path to that win was. Analyst podcasts are fun, but they rarely give you a full distribution over finish versus decision, or tell you when a forecast is shaky because a fighter changed divisions, has a thin résumé, or is coming off a long layoff.

That gap is what OctagonELO is for. It is not a hot-take generator. It is a **pre-fight handicapping site** that estimates how a booked bout could break: win or lose, by KO/TKO, submission, or decision, with **90% confidence intervals** that widen when the data honestly says the situation is hard to read.

The forecasting pipeline behind the site is the MMA ELO + multinomial handicapping work I have been building in the open modeling repo ([MMA_Handicapping](https://github.com/LordOfTheTrees/MMA_Handicapping)). The production app ships from a sibling deploy repo and refreshes predictions on a weekly cadence as new fight results land.

**OctagonELO is live today.** Not a closed beta, not a waitlist. You can open the next UFC card, browse division ELO rankings, search fighter profiles, and drill into individual bouts now.

## The consumer problem: probabilities without false precision

Two things compete in every fight fan's head:

1. You want a sharp read on the matchup before the walkout.
2. You also want to know when that read is fragile (division moves, sparse history, unusual layoffs).

Most prediction products pick one side of that trade. They either spit out a confident win percentage with no method breakdown, or they hide behind vibes. OctagonELO is built around a different stance: **uncertainty is first-class**. The model communicates what it does not know through confidence intervals that widen with data sparsity, not through fake precision.

The output is a calibrated **six-outcome distribution** from Fighter A's perspective:

- Win by KO/TKO
- Win by Submission
- Win by Decision
- Lose by Decision
- Lose by KO/TKO
- Lose by Submission

Those six probabilities are mutually exclusive and sum to one. From them you also get the aggregates fans actually argue about: total win%, finish win%, and go-to-decision%.

## How OctagonELO closes the loop

The core experience is deliberately simple to describe:

- **Events calendar** lists upcoming and past UFC cards. Each bout links to a full model view refreshed with the latest weekly artifact export.
- **Per-bout prediction pages** show days since last fight (with percentile context against historical layoffs), a split win-probability bar by method, marginal confidence summaries, and a six-outcome bar chart with 90% CI markers.
- **Rankings browser** surfaces active ELO by weight class and gender, with an uncertainty column that tells you how tight the model's belief is around each rating.
- **Fighter profiles** (via search or rankings) carry static attributes (reach, height, stance, pedigree signals) plus per-division ELO state and fight ledger rows.
- **About the model** documents the methodology: data distributions across large samples of booked fights, and short decision records on ELO per division, matchup features, and when Cauchy-style wide ranges apply.

Under the hood, the pipeline is a strict chain: tiered fight data, per-division ELO construction, ELO-weighted style features, matchup interaction terms, multinomial logistic regression, and bootstrap confidence intervals. **Interpretability is non-negotiable** in the design. Every coefficient has a readable meaning, and bout pages expose the matchup feature vector ("why these numbers") plus an explain-style contribution layer for users who want to scroll deeper.

### ELO as the spine

ELO is built **per weight class**, with K scaled by result certainty (dominant finishes move ratings more than disputed split decisions). It does two jobs at once:

1. **Upstream weighting** — past performance stats are weighted by the quality of opposition they were produced against.
2. **Direct signal** — the ELO differential between two fighters at fight time is itself a regression feature, capturing residual quality the style axes do not fully explain.

Cold-start handling leans on pedigree priors (wrestling, boxing, BJJ signals) so prospects are not treated like empty slots.

### Matchup features that respect A vs B

The model does not just diff two fighters' career averages. It encodes interaction terms (striking matchup, grappling matchup, finish matchup) so the feature vector respects symmetry: the prediction for A vs B is the mirror of B vs A. Physical deltas (reach, height, stance mismatch, age) and style-axis differentials (striker, grappler, finish threat, finish vulnerability) round out the 12-feature vector fed to the multinomial head.

### When the model says "this is hard"

Long layoffs, division changes, and thin in-division histories trigger wider intervals. Fight pages surface **days idle** per corner with percentile placement in the all-time layoff distribution, and flag Cauchy-style instability when bootstrap evidence is insufficient. That is the point: a 12% win probability with a 5–12% band reads differently than the same point estimate with a tight band.

## Inside the site (screenshots from octagonelo.com)

Below is a current screenshot from the live site as of launch week. Predictions reflect the model snapshot exported on **June 6, 2026** and refresh on the weekly backend cadence.

![Bout page: win probability, layoffs, and confidence intervals]({{ '/assets/images/octagon-elo/prediction-page.png' | relative_url }})

## What is free, what is subscribed

OctagonELO is live with a straightforward access model:


| Content                               | Free                      | Subscribed       |
| ------------------------------------- | ------------------------- | ---------------- |
| Next upcoming event (not yet started) | Full predictions          | Full predictions |
| Events beyond the next card           | Locked                    | Unlocked         |
| Fighter search and profiles           | Full access               | Full access      |
| ELO rankings browser                  | Full access               | Full access      |
| ELO trajectory charts                 | Blurred teaser            | Unlocked         |
| Hypothetical bout builder             | Locked (subscribe prompt) | Full access      |


The next card that has not started is open for everyone. Once an event begins, its prediction window closes. That keeps the free tier useful without pretending every future fight on the calendar is a teaser forever.

## Launch and what is next

OctagonELO is **live at [octagonelo.com](https://octagonelo.com)** today. Open UFC Freedom 250 (June 14, 2026 in Washington, DC) for the current free card: Topuria vs Gaethje, Pereira vs Gane, O'Malley vs Zahabi, and the rest of the main slate. Past events like UFC Fight Night: Muhammad vs Bonfim are browsable with full bout-level views.

Check back here on my site and follow my LinkedIn for methodology notes, model decision write-ups, and feature updates as the pipeline and site evolve. The open modeling repo ([MMA_Handicapping](https://github.com/LordOfTheTrees/MMA_Handicapping)) remains where architecture decisions, export contracts, and training code live.

---

OctagonELO is the project I built to make pre-fight MMA handicapping legible: six outcomes, honest intervals, and an interpretable feature stack you can argue with. If you want probabilities that respect what the data actually knows (and what it does not), the site is open now.