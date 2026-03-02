---
layout: post
title: "QB Injuries: Do NFL GM's Assume Health?"
date: 2026-3-02
categories: [Analytics, Quarterbacks, Decision Psychology]
---

*Ongoing Insights from my work evaluating first-round drafted quarterback success and failure since 2000.*

## Introduction

When writing my third article evaluating QB trajectories, I had to project out the completion of the current season for those quarterbacks playing in it. As a rough method, I extrapolated out per-game performance statistics and expanded them out to expected projected totals for the season. But in so doing, I stumbled upon an interesting empirical question: "Do NFL GM's assume health for their QB's, or do they assume that previous injury trends will continue at the same rate?" What does the data say based on decisionmaking with the "best" prospects selected at the top of the draft? That's what we'll be diving into today.

*Note for readers joining mid-series: all yardage figures in this article use era-adjusted statistics, which normalize for offensive inflation across NFL eras (see [Article 1]({% link _posts/2025-10-18-quantifying_QB_success_Pt_1.md %}) for methodology). This means a 4,000-yard season in 2008 and a 4,000-yard season in 2023 are expressed on the same scale. ANY/A figures are also era-adjusted unless otherwise noted.*

## The Two Mental Models

When a quarterback misses games due to injury, general managers face a fundamental evaluation choice. Consider Jayden Daniels in 2025: through 7 games, he was on pace for ~3,740 era-adjusted yards and a 5.86 ANY/A. But his raw season total reflected only those 7 games of production.

There are two possible mental models a GM could apply:

**Model A: "Assume Health"**
Evaluate the quarterback based on what they do *when they play*. If Daniels produces 220 era-adjusted yards per game over 7 starts, project that out to a full 17-game season (~3,740 yards). The injury shortened the sample, but the talent is evident. Treat the missed games as noise.

**Model B: "Penalize Availability"**
Use the raw season total as-is. Daniels produced ~1,540 era-adjusted yards in 7 games? That's what goes in the ledger. Availability is the best ability, and production is production regardless of the reason it was limited. Under this model, injury history is itself a predictive signal: a quarterback who has missed time before is likely to miss time again.

Both models have intuitive appeal. Model A rewards efficiency and talent evaluation. Model B rewards durability and pragmatism. But only one of them better predicts what teams *actually do* when contract decisions come around.

## How We Test This

To answer this question empirically, I built an injury projection system into the existing analytical pipeline from [Articles 1-3]({% link _posts/2025-11-11-quantifying_QB_success_Pt_3.md %}). Here's the methodology:

### The Projection Logic

For every quarterback-season in our dataset (59 first-round QBs, 2000-2020 draft classes), we apply the following rules to era-adjusted counting stats (total yards, passing TDs, passing yards, rushing yards):

1. **Full seasons** (games started >= season length): No projection needed. Use the era-adjusted value as-is.
2. **Partial seasons after first start** (GS > 0 but < season length): Calculate per-game average, then project to full 16 or 17-game season.
3. **Initial seasons before first start** (GS = 0, backup role): Use era-adjusted value as-is. No projection for a quarterback who hasn't yet been given the starting role.
4. **Complete season skips** (GS = NaN, injury/conduct): Fill by averaging the surrounding seasons, or set to zero if the player never returned.

Rate statistics like ANY/A and Rushing Success % are left untouched, since they already represent per-play efficiency and don't need games-played normalization.

This creates two parallel column sets in the master dataset:
- `_adj` columns: Era-adjusted statistics (what actually happened)
- `_adj_proj` columns: Era-adjusted + injury-projected statistics (what *would have happened* over a full season at the observed per-game pace)

### The Comparison

We then run identical logistic regression models (L2-regularized, 5-fold cross-validated, 80/20 train-test split with identical random seeds) on both column sets, predicting the same target: **did the quarterback receive a second contract from their drafting team?**

The model uses averaged lag features (Years 1-3 prior performance), team metrics (W-L%, era-adjusted points), and the same regularization hyperparameter search. The only thing that changes between the two models is whether counting stats use raw season totals or health-projected season totals.

If GMs "assume health," then the projected model should outperform the baseline, because projecting partial seasons to full seasons better reflects how teams actually weigh performance.

## What the Data Says

| Metric | Baseline (Era-Adjusted) | Projected (+ Injury Projection) | Difference |
|--------|:-----------------------:|:-------------------------------:|:----------:|
| **F1-Score** | 0.7748 | 0.7857 | **+0.0109** |
| **Accuracy** | 0.7573 | 0.7670 | **+0.0097** |
| **Precision** | 0.7544 | 0.7586 | +0.0042 |
| **Recall** | 0.7963 | 0.8148 | **+0.0185** |
| **AUC-ROC** | 0.7702 | 0.7978 | **+0.0276** |
| CV AUC | 0.8185 | 0.8156 | -0.0029 |

The injury-projected model wins on every test-set metric except cross-validation AUC, where the baseline holds a marginal edge of 0.3%.

Let's unpack what each of these improvements actually means:

**AUC-ROC (+0.0276):** This is the largest single improvement, and it measures the model's ability to discriminate between QBs who get paid and those who don't across all possible classification thresholds. A nearly 3-point lift in AUC-ROC from a single methodological change (projecting partial seasons) is meaningful. It means that when you rank all quarterbacks by their predicted contract probability, the projected model does a better job of putting the eventual "paid" QBs above the "unpaid" ones.

**Recall (+0.0185):** The projected model catches more of the quarterbacks who actually received contracts. In concrete terms, it correctly identifies 81.5% of paid QBs versus 79.6% for the baseline. This matters because the cost of a false negative here is significant: missing on a franchise quarterback's extension candidacy is arguably worse than overpredicting borderline cases.

**F1-Score (+0.0109) and Accuracy (+0.0097):** Both improve modestly, confirming the overall pattern without suggesting the improvement is driven by any single metric artifact.

**CV AUC (-0.0029):** The one metric where the baseline marginally outperforms. Cross-validation AUC measures in-sample generalization, and the fact that it's essentially flat (0.8185 vs 0.8156) while test-set performance improves suggests the projected model generalizes slightly better to unseen data without overfitting the training set.

### The Interpretation

The injury-projected model is more predictive of contract decisions. This means that when we evaluate quarterbacks the way GMs appear to, the per-game pace matters more than the raw season total. **More NFL general managers appear to assume health than not.**

This finding has an intuitive logic to it: a GM evaluating Joe Burrow after his ACL-shortened rookie season (2,868 era-adjusted yards in 10 games) is unlikely to penalize him for the 6 games he missed. They saw what he did in 10 starts and projected forward. The data confirms this is how the league more often behaves, because the model that mimics this mental process is more accurate.

It's worth noting that this finding may be position-specific. GMs may feel more comfortable assuming health for quarterbacks precisely because the rules are designed to keep them healthy. Whether this same "assume health" heuristic holds for running backs, offensive linemen, or other positions with higher injury exposure is an open question that would require expanding the dataset beyond quarterbacks to test.

## Where This Shows Up: Case Studies

### Joe Burrow: The Gold Standard Recovery

Burrow's career is the clearest illustration of why GMs assume health:

| Year | Era-Adj Yards | Games Started | Per-Game Pace | Projected Yards |
|------|:------------:|:------------:|:-------------:|:--------------:|
| Y0 (2020) | 2,868 | 10 | 286.8 | 4,589 |
| Y1 (2021) | 4,780 | 16 | 298.7 | 4,780 |
| Y2 (2022) | 4,770 | 16 | 298.1 | 4,770 |
| Y3 (2023) | 2,410 | 10 | 241.0 | 4,097 |

Under the raw-total model, Burrow's Year 0 and Year 3 look like massive production drops. Under the projected model, his per-game output was remarkably consistent across his first three seasons, with a moderate Y3 decline. Cincinnati gave him a 5-year, $275M extension after Year 3, precisely because they were evaluating the per-game quarterback, not the injury-shortened season totals.

### Sam Bradford: When the Model Breaks Down

Not every injury story resolves cleanly. Sam Bradford's career—1st overall pick in 2010—is instructive precisely because it represents the edge case:

| Year | Era-Adj Yards | Games Started | Per-Game Pace |
|------|:------------:|:------------:|:-------------:|
| Y0 (2010) | 3,724 | 16 | 232.7 |
| Y1 (2011) | 2,275 | 10 | 227.5 |
| Y2 (2012) | 3,963 | 16 | 247.7 |
| Y3 (2013) | 1,775 | 7 | 253.5 |

Bradford's per-game production actually *improved* over time. The projected model would evaluate him favorably. But the Rams ultimately moved on, in part because availability itself had become the concern. This is where the "assume health" heuristic starts to strain: at some point, the frequency of injury becomes the signal, not the per-game output.

Our model captures the majority case, but Bradford-type scenarios remind us that GMs aren't purely mechanical in their evaluation. There's a threshold—likely somewhere around 3+ significantly shortened seasons—where availability concerns override per-game talent assessment.

### Carson Wentz: The Injury Inflection Point

Wentz represents an instructive case where the "assume health" model looked reasonable at extension time but proved wrong in hindsight:

| Year | Era-Adj Yards | GS | ANY/A | Context |
|------|:------------:|:--:|:-----:|---------|
| Y0 (2016) | 4,029 | 16 | 5.18 | Full season starter |
| Y1 (2017) | 3,673 | 13 | 7.55 | MVP candidate, ACL tear Week 14 |
| Y2 (2018) | 3,227 | 11 | 6.99 | Back injury, missed 5 games |
| Y3 (2019) | 4,352 | 16 | 6.34 | Full season, mild regression |
| Y4 (2020) | 2,935 | 12 | 4.02 | Collapse, benched |

In Year 1, Wentz was on pace for roughly 4,520 era-adjusted yards and looked like the next great franchise quarterback. His Year 2, even injury-shortened, still showed 6.99 ANY/A — a modest regression from elite, not a collapse. The Eagles extended him after Year 2, and the "assume health" model supported it: two consecutive seasons of strong per-game efficiency (7.55 and 6.99 ANY/A), temporarily limited only by injuries.

The problem emerged later. Year 3 brought a full healthy season but continued efficiency erosion (6.34), and Year 4 was the true collapse (4.02 ANY/A, benched). The "assume health" model was right about the extension timing — Wentz's per-game numbers through Y2 genuinely warranted the investment — but it couldn't account for the long-term physical toll that eventually degraded the underlying talent. Under Model B (penalize availability), the back-to-back shortened seasons should have been a red flag. History proved Model B correct in this specific case.

## Implications

### What This Means for Current QB Evaluation

This finding has direct application to the quarterback class I evaluated in Article 3. For the current class:

- **Jayden Daniels** (7 games in 2025): The projected model supports evaluating him at his per-game pace rather than penalizing the missed time. We might expect that his style of play and build would make him more susceptible to injuries, but the model indicates that more GM's than not will injury adjust and expect him to be healthy over the long term. His 5.86 ANY/A across 7 games carries real predictive weight.

### The Broader Pattern

The "assume health" finding connects to the temporal bias patterns identified in Article 2. Recall that GMs dramatically overweight recent performance (Year 3 receiving 59.8% weight in Year 4 decisions). Combined with the injury projection finding, we get a more complete picture of the GM mental model:

**GMs evaluate quarterbacks based on their most recent per-game performance, projected to a full season, with extreme recency weighting.**

This is simultaneously rational and dangerous. It's rational because per-game performance is a better measure of talent than injury-penalized totals. It's also rational because we expect that players learn and get better faster than they physically decline due to age (particularly in the early part of their careers we are most concerned with). That said, this is also dangerous because it assumes that past availability problems won't recur, and because the recency bias means a single healthy season can overwrite years of injury concerns.

## Limitations and Future Research

### What This Analysis Doesn't Capture

**Injury type specificity.** Our model treats all missed games identically: an ACL tear, a concussion protocol absence, and a coach's decision to sit a healthy quarterback all look the same in the games-started column. Future work should classify injury types and test whether GMs discount certain injuries (soft tissue, recurring) more than others (catastrohic, acute, contact-related). For quarterbacks returning from major injuries (Burrow's wrist, Wentz's ACL, Tua Tagovailoa's concussions), this assumption may not hold. A more sophisticated model could incorporate injury-type-specific recovery curves.

**Severity gradients.** Missing 2 games versus missing 10 games may trigger qualitatively different evaluation frameworks. There's likely a threshold below which missed games are truly treated as noise and above which availability becomes a primary concern. Our current approach doesn't model this non-linearity.

**Cross-validation stability.** The one metric where the baseline outperforms (CV AUC: 0.8185 vs 0.8156) suggests the projected model may introduce minor instability in smaller cross-validation folds. With only 59 quarterbacks in the dataset, the difference between an 80% training set and a single CV fold can be 10+ players. Expanding the dataset to include non-first-round quarterbacks (a priority from Article 3's future research agenda) would help stabilize these comparisons but would introduce new questions about the "quality of the prospect" with respect to competition.

### The Fifth-Year Option Connection

One area flagged in Article 3 that becomes more interesting in light of this finding: do teams exercise the fifth-year option differently based on injury history? If GMs assume health in contract evaluations, they may also assume health when deciding to pick up the option. Testing this would help validate whether the "assume health" heuristic extends beyond the primary extension decision.

## Conclusion

The data suggests a lean, not a mandate. Injury-projected statistics are slightly more predictive of actual contract decisions than raw season totals across most classification metrics, but the improvements are modest: roughly 1-3% across F1, accuracy, and precision, with an AUC-ROC lift of +0.028. The direction is consistent, but the magnitude leaves room for legitimate disagreement. A GM who prefers to penalize availability isn't wildly out of step with the data; they're just slightly less aligned with the aggregate historical pattern.

That said, the pattern does point in a direction. When the Bengals evaluated Joe Burrow after his injury-shortened Year 3, they likely weren't anchoring to his 2,410 era-adjusted yards and concluding he'd regressed. More probably, they were looking at a quarterback who had produced at a ~4,100-yard pace when healthy that year, and at a ~4,600-yard pace in his similarly shortened rookie season, and projecting forward from there. The $275M contract reflected the projected quarterback more than the abbreviated stat line. But we can't know for certain that every front office weighs things this way, and the modest improvement in our model's predictiveness suggests some teams may not.

For fans and analysts, the takeaway is nuanced rather than definitive: per-game numbers likely deserve more weight than raw totals when evaluating injury-shortened seasons, because the league's decision-makers appear to lean that direction on balance. But it's a lean, not a consensus. The Wentz and Bradford cases remind us that assuming health carries real downside risk, and the closeness of our two models suggests there's a meaningful minority of contract decisions where availability concerns *did* factor into the outcome.

On average, across 25 years of first-round quarterback data, projecting health is somewhat closer to how teams behave than penalizing for time missed. Whether that's the right approach, or whether the GMs who discount for injury history are the smarter ones in the long run, remains an open question.

---

*This is the fourth article in a series on quarterback evaluation. [Article 1]({% link _posts/2025-10-18-quantifying_QB_success_Pt_1.md %}) established era-adjustment methodology and predictive metrics. [Article 2]({% link _posts/2025-11-01-quantifying_QB_success_PT_2.md %}) identified temporal bias in contract decisions. [Article 3]({% link _posts/2025-11-11-quantifying_QB_success_Pt_3.md %}) applied the framework to current QB trajectories.*
