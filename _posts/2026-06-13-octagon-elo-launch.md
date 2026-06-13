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

If you follow MMA even casually, you'll know that the fight game hasn't had the same upswing in modern analytics capabilities as major team sports. With the introduction of widespread sports gambling and prediction markets, there are now ways to bet on every eventuality from a particular card and fight, but there aren't similarly transparent ways to see what the odds are, and what the best we can do without the UFC's proprietary tracking data.

That gap is what OctagonELO is for. It is a new pre-fight handicapping site that estimates the odds on how a bout is expected to break given past history: win or lose, by KO/TKO, submission, or decision; with outcome confidence intervals that widen when the situation is hard to predict.

The forecasting pipeline behind the site is the MMA ELO + multinomial handicapping work I have been building in the open modeling repo ([MMA_Handicapping](https://github.com/LordOfTheTrees/MMA_Handicapping)). The production app ships from a sibling deploy repo and refreshes predictions on a weekly cadence as new fight results land.

**OctagonELO is live today.** You can open the next UFC card, browse division ELO rankings, search fighter profiles, and drill into individual bouts now. For subscribers, you can see predictions on every fight currently booked, entire ELO rankings histories for every fighter in each division, and create any hypothetical matchup you would like to see today.

## The consumer's hidden problem: probabilities with false precision

When using any data source, two elements are always vital to understand:

1. What is the stated value (what most people say they care about they think deeper)
2. What is the level of confidence (or too often, what **should it be** when dealing with overconfident people)

Most prediction products choose the former, and never address the latter. They think it clutters the experience, providing unnecessary friction to users, and indeed undermines their own credibility. 

**I reject this approach categorically.**

OctagonELO is built around a different stance: **it's understanding of uncertainty is first-class**. The model communicates what it does not know through confidence intervals that widen with data sparsity and the inherent variance in MMA outcomes. It then provides expected outcomes for tgehe cumulatively exhaustive set of possible fight endings. The six-outcome distribution from Fighter A's perspective would be:

- Win by KO/TKO
- Win by Submission
- Win by Decision
- Lose by Decision
- Lose by KO/TKO
- Lose by Submission

In our model, those six probabilities are mutually exclusive and sum to one (plus a stated uncertainty range for each). From these six probabilities, you also sum to aggregates like: total win%, finish win%, and go-to-decision%.

## How OctagonELO makes understanding matchups easy

The core experience is deliberately simple to describe:

- **Events calendar** lists upcoming and past UFC cards. Each bout links to a full model view refreshed with the latest weekly artifact export.
- **Per-bout prediction pages** show days since last fight, a split win-probability bar by method, marginal confidence summaries, and a six-outcome bar chart with 90% confidence intervals. For simplicity, the layoffs tracker and the individual style matchup features also show their percentile context against all other historical bouts.
- **Rankings browser** Has rankings of active ELO by weight class and gender, with an uncertainty column that tells you how tight the model's belief is around each rating.
- **Fighter profiles** Accessible summary pages for static attributes (reach, height, stance, pedigree signals) plus per-division ELO charts and fight history rows.
- **About the model** documents the entire methodology from our public repo: all of the data distributions across our historical data, as well as a architecture decision record that explains every tradeoff we made along with our rationale. *Interpretability is non-negotiable** for us in the design, and that's part of why we have such a lengthy breakdown there.

### ELO as the spine

We chose to use ELO as the backbone of a non-stationary prediction mechanism. Any predicion architecture where strength of schedule and recent form isn't is baked in would be highly flawed ([Elo rating system](https://en.wikipedia.org/wiki/Elo_rating_system)). We use ELO built on a **per weight class** basis, with K scaled by result certainty (dominant finishes move ratings more than disputed split decisions). This does multiple jobs at once:

1. **Context aware rankings** - we adjust estimated skill level on the basis of how good the person they beat was at the time.
2. **Upstream weighting** — past performance stats like striking or grappling strength are weighted by the quality of opposition they were produced against.
3. **Direct signal** — the ELO differential between two fighters at fight time is itself a regression feature, capturing residual quality the style axes do not fully explain.

### When the model adjusts for uncertainty

Long layoffs, division changes, and thin in-division histories trigger wider intervals. Visually we show this through fight pages by surfacing **days idle** for each fighter with a percentile placement in the all-time layoff distribution, and flag Cauchy-style instability for the confidence interval when bootstrap evidence is insufficient. 

We hope to drive home the point that a 12% win probability with a 5–12% band reads very differently than the same point estimate with a +/- 1% band.

## Inside the site (screenshot/s from octagonelo.com)

Below is a current screenshot from the live site as of launch week. Predictions reflect the model snapshot exported on **June 6, 2026** and refresh on the weekly backend cadence.

![Bout page: win probability, layoffs, and confidence intervals]({{ '/assets/images/octagon-elo/prediction-page.png' | relative_url }})

## What is free, what is subscribed

OctagonELO is live with a straightforward access model:


| Content                               | Free                      | Subscribed       |
| ------------------------------------- | ------------------------- | ---------------- |
| Next upcoming event (not yet started) | Full access               | Full access      |
| Events beyond the next card           | Locked                    | Full access      |
| Fighter search and profiles           | Full access               | Full access      |
| ELO rankings browser                  | Full access               | Full access      |
| ELO trajectory charts                 | Blurred teaser            | Full access      |
| Hypothetical bout builder             | Locked                    | Full access      |

As long as I run the site, you will never have to pay for the next card yet to begin. It will always remain open for everyone. Once an event begins, its prediction window closes. If you are a sharp, you know that the initial lines for far away fights are where all the value is, so those are subscription only.

## Launch and what is next

OctagonELO is **live at [octagonelo.com](https://octagonelo.com)** today. Open UFC Freedom 250 (June 14, 2026 in Washington, DC) for the current free card: Topuria vs Gaethje, Pereira vs Gane, O'Malley vs Zahabi, and the rest of the main slate.

Check back here on my site, X, and my LinkedIn for methodology notes, model decision write-ups, and feature updates as the pipeline and site evolve. The open modeling repo ([MMA_Handicapping](https://github.com/LordOfTheTrees/MMA_Handicapping)) remains where architecture decisions, export contracts, and training code live.

---

OctagonELO is the project I built to make pre-fight MMA handicapping legible: six outcomes, humble intervals for uncertainty, and an interpretable feature stack you can argue with me about. If you want probabilities that respect what the data actually knows (and what it does not), the site is open now.
