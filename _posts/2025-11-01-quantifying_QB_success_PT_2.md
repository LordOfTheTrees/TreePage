---
layout: post
title: "Quantifying QB Success: Temporal Weighting Patterns in Contract Decisions, Part 2"
date: 2025-11-01
categories: [Analytics, Quarterbacks, Tableau]
---

Article 1 established which metrics predict quarterback contract decisions most strongly, identifying Total Yards (era-adjusted) and ANY/A (era-adjusted)¹ as the key granular and open-source predictors which balance volume production with efficiency. However, that analysis treated all career years equally, averaging performance across Years 1-3 with uniform weights. This approach optimized overall prediction accuracy but obscured a crucial dimension of organizational evaluation: teams don't weight all career years equally when making contract decisions.

The question Article 1 left unanswered is not which metrics matter, but **when** they matter most. Does a quarterback's rookie season carry the same weight as their most recent performance? Do teams exhibit recency bias, weighting recent seasons heavier while discounting earlier career data? Or do organizations take a balanced, long-term view of quarterback development?

This analysis decomposes the temporal patterns in contract evaluation, revealing systematic biases in how teams weight performance across a quarterback's early career. The findings have immediate practical implications: understanding when performance matters most enables better prediction of which current quarterbacks are on track for extensions versus which face uncertain futures.

## Executive Summary

Article 2 quantifies the temporal dimension of quarterback evaluation that Article 1's methodology masked. By transforming calendar years into contract-relative timelines and running year-specific regressions, this analysis reveals non-linear recency weighting in organizational decision-making.

**Article 2 Contributions:**
- **Extreme recency weighting**: Year 2 performance received **69.9% weight** in Year 3 decisions versus 33.3% equal-weight baseline—a **2.10x multiplier** (p = 0.002)
- **U-shaped importance curve**: Organizations prioritized rookie year (8.4-16.4% weight) and most recent year (46-70% weight) over middle career years
- **Temporal weight decay**: Recent-year weighting moderated as more data accumulated (70% → 60% → 46% from Year 3 to Year 5 decisions)
- **Consistent performance thresholds**: ~4,200 era-adjusted yards and ~6.5 ANY/A emerged as boundaries where contract probability exceeded 60%

These patterns demonstrate that teams heavily discount middle-career performance, creating evaluation blind spots that may lead to suboptimal contract timing. The extreme recency weighting suggests organizations either believe recent performance better predicts future output, or face institutional pressures that prioritize the possiblity of immediate results continuation over being saddled with bad long-term contracts. 

Though we would always expect any quarterback to improve year over year on their rookie deal, we believe that the discontinuity in relative weights far outweighs the expected gains from the second to last year (hereafter called Y-2 in this article for brevity) to Y-1. If that is true, then general managers consistently over-weight the imporance of the last year. Since it is well documented that coaches make decisions which are centered around retention their own employment, we speculate that this bias towards the last year also derives from contract instability. General managers that sign lengthy extensions for their quarterbacks which dont work out, arent around to pay for the consequences. They only reap the rewards if the decision is correct and their employment is retained.

**Scope and Limitations:**

These patterns describe organizational behavior in our 180-QB sample from 2000-2020. CBA changes, analytics adoption, or evolving quarterback archetypes could shift future patterns. We document what organizations did, not whether these behaviors optimally predict winning games or future quarterback performance.

### Bridge to Article 3: Why Temporal Patterns Enable Trajectory Prediction

Article 3 will overlay individual quarterback trajectories on probability surfaces, showing which current QBs are trending toward extensions versus missed opportunities. These trajectory predictions require accurate temporal weighting - we cannot calculate a quarterback's current contract probability without knowing how teams weight each year of their career.

## From WHICH Metrics to WHEN They Matter

### The Temporal Blind Spot in Article 1

Article 1 identified Total Yards (era-adjusted) and ANY/A (era-adjusted) as the metrics that best predict contract decisions when balanced against other considerations like open-source formulas (QBR), and relatively less noise from group performance (Wins, Pts, TDs, etc...). The regression approach averaged quarterback performance across Years 0-N equally, assigning each year identical weight in the model. This equal weighting assumption enabled clean identification of which statistical categories matter most, but imposed a critical constraint: the model could not reveal whether teams weight Y-0 performance the same as Y-N performance.

Consider Josh Allen's trajectory through his first three seasons:
- Year 0 (2018): 2,705 total yards (2,074 passing + 631 rushing)
- Year 1 (2019): 3,599 total yards (3,089 passing + 510 rushing)
- Year 2 (2020): 4,965 total yards (4,544 passing + 421 rushing)

Article 1's methodology would calculate Allen's three-year average (3,756 yards) and use that single value to predict his contract outcome. This approach correctly predicted Allen's extension - his average performance exceeded the threshold for contract renewal. But it cannot answer whether the Bills' decision was driven primarily by the Year 2 breakout, or whether they weighted all three seasons equally in their evaluation.

The question matters because two quarterbacks can have identical three-year averages through radically different paths:
- **QB A**: 3,500 yards each season (consistent performer)
- **QB B**: 2,000, 2,500, 5,500 yards (late bloomer with identical average)

If teams weight recent performance more heavily, QB B has higher contract probability despite identical averages. Article 1's equal-weighting assumption cannot distinguish between these scenarios.

### The Temporal Question This Analysis Addresses

This analysis decomposes Article 1's averaged approach into year-specific components:

**Article 1 specification:**
```
got_paid ~ average(lag1, lag2, lag3)  # Single coefficient per metric
```

**Article 2 specification:**  
```
got_paid ~ β₁·lag1 + β₂·lag2 + β₃·lag3  # Separate coefficient for each year
```

Where each lag represents performance from a different career stage:
- `lag1`: Most recent complete season (Year 2 for Year 3 decisions)
- `lag2`: Prior season (Year 1 for Year 3 decisions)  
- `lag3`: Earliest season in evaluation window (Year 0/rookie for Year 3 decisions)

The separate coefficients reveal how much each career stage contributes to contract decisions. If teams weight all years equally, coefficients should be roughly identical. If teams exhibit recency bias, recent-year coefficients should dominate. The magnitude of these differences quantifies organizational temporal weighting patterns observed since 2000.

## Data Pipeline: Contract-Relative Timeline Construction

### The Calendar Year Problem

Standard statistical analysis organizes quarterback data by calendar year, but contract decisions don't align with calendar boundaries. A quarterback who signs an extension in August 2021 made that decision based on seasons completed *before* the signing, not the upcoming season. Using calendar years creates temporal misalignment—we'd incorrectly include performance data that didn't exist when the decision was made. The solution is to transform calendar years into contract-relative years, aligning performance data with decision timing.

**Step 1: Identify Payment Year**

For each first-round quarterback drafted 2000-2020, we scraped contract data from Spotrac and Over The Cap³  to identify the first significant non-rookie contract signed with their drafting team. This includes fifth-year option exercises, franchise tags, and extensions, but excludes free agent signings with other teams or contracts following trades.

Payment year = calendar year the contract was signed. For Allen: Payment Year = 2021.

**Step 2: Calculate Contract-Relative Years**

Contract-relative year = Payment year - Season year - 1

The "-1" adjustment accounts for the temporal gap between season completion and contract signing. Allen's 2020 season (completed January 2021) is "lag 1" relative to his August 2021 contract—it's the most recent complete season when the decision was made.

**Step 3: Create Lagged Performance Variables**

For each quarterback-payment year observation, we create lagged variables representing each prior season:
- `lag1`: Most recent complete season before contract decision
- `lag2`: Second-most recent season
- `lag3`: Third-most recent season
- And so on for earlier years

Josh Allen's contract decision record (Payment Year 2021):
- `lag1` (Year 2): 4,544 yards, 7.21 ANY/A (2020 season)
- `lag2` (Year 1): 3,089 yards, 6.37 ANY/A (2019 season)
- `lag3` (Year 0): 2,074 yards, 4.55 ANY/A (2018 season)

This structure enables year-specific regression coefficients while maintaining temporal accuracy—each lagged variable represents actual performance data available when the contract decision was made.

The critical detail: NFL regular seasons run September through January (16-17 games). All statistics reflect regular season performance only - preseason exhibitions and playoff games are excluded. Preseason games involve heavy roster experimentation and do not reflect regular decision-making, while playoff games are not guaranteed and sample sizes vary dramatically by team success. Regular season performance provides a consistent 16-17 game sample across all quarterbacks, which is what organizations use for evaluation.

### Sample Composition

Not all first-round quarterbacks reach each decision window. Some never establish themselves as starters (insufficient playing time), some get traded before reaching extension eligibility, and others sign contracts earlier than typical due to exceptional early performance.

**QBs eligible for each decision window (2000-2020 draft classes):**

| Decision Year | Sample Size | Got Paid | Did Not Get Paid |
|---------------|-------------|----------|------------------|
| Year 3 | 142 | 56 (39%) | 86 (61%) |
| Year 4 | 118 | 61 (52%) | 57 (48%) |
| Year 5 | 89 | 55 (62%) | 34 (38%) |
| Year 6 | 47 | 34 (72%) | 13 (28%) |

This balanced distribution provides statistical power for detecting temporal patterns. Year 6 has limited sample size due to franchise tags, fifth-year option mechanics, and pre-2011 CBA differences—we report these results but they should be interpreted cautiously given the small sample.

The increasing "got paid" ratio across decision years reflects survivorship bias - quarterbacks who reach Year 5 without being released have already demonstrated sufficient value to remain on rosters, selecting for higher-quality players in later windows.

## Methodological Framework: Year-Specific Regressions

### Regression Specification

As mentioned above, for each decision year, we estimate a separate logistic regression with year-specific coefficients:

```
P(got_paid) = logit⁻¹(β₀ + β₁·Year₁ + β₂·Year₂ + ... + βₙ·Yearₙ)
```

Where each year is entered as a separate independent variable rather than averaged. The regression estimates how much each career stage contributes to contract decisions, with larger absolute coefficients indicating greater importance.

We calculate temporal weights by normalizing coefficients to sum to 100%:

```
Weight_year_i = |β_i| / Σ(|β_j|) × 100%
```

This transformation interprets each weight as "the percentage of the contract decision driven by this year's performance." A 70% weight for Year 2 means that year's performance accounts for 70% of the total signal used in contract decisions, with remaining years splitting the other 30%.

The year-specific approach differs from Article 1's ridge regression, which averaged all years equally. By estimating separate coefficients, we can directly test whether teams weight recent performance more heavily than career averages would suggest.

### Metrics Analyzed

We focus on Article 1's identified predictors: Total Yards (era-adjusted) and ANY/A (era-adjusted). These metrics balance volume production with efficiency, providing complementary views of quarterback performance. Both metrics use era adjustment factors from Article 1 to enable fair comparison across the 2000-2024 sample period, correcting for league-wide offensive inflation.

Total Yards combines passing and rushing production, capturing dual-threat ability while maintaining broad sample representation. ANY/A provides a rate-based efficiency measure that accounts for touchdowns, interceptions, and sacks.

## Results: Temporal Weighting Patterns

### Total Yards Temporal Weighting

The year-specific regressions reveal extreme recency weighting across all decision windows, with the most recent complete season dominating contract decisions.

**Decision Year 3** (5th-year option evaluation | Years 0-2 available):

| Year | Weight | P-Value |
|------|--------|---------|
| Year 2 (most recent) | **69.9%** | 0.002 |
| Year 1 | 21.7% | 0.043 |
| Year 0 (rookie) | 8.4% | 0.187 |

Year 2 performance receives nearly 70% of total weight in Year 3 contract decisions. This represents an 8.3x multiplier relative to rookie performance (69.9% / 8.4%) and a 3.2x multiplier relative to Year 1 performance (69.9% / 21.7%). Under equal weighting, each year would receive 33.3% weight. Year 2's actual weight is 2.10x the equal-weight baseline (69.9% / 33.3%).

The pattern suggests organizations make Year 3 contract decisions almost entirely based on the most recent season, with earlier career performance serving primarily as tiebreakers between quarterbacks with similar recent production.

The rookie year coefficient showed higher uncertainty (p = 0.187), suggesting organizations placed varying weights on Year 0 performance when evaluating Year 3 decisions. This may different approaches in rational discounting of limited sample size or varying organizational beliefs around early struggles not predicting long-term development.

**Decision Year 4** (extension window | Years 0-3 available):

| Year | Weight | P-Value |
|------|--------|---------|
| Year 3 (most recent) | **59.8%** | 0.001 |
| Year 2 | 23.4% | 0.028 |
| Year 1 | 13.1% | 0.091 |
| Year 0 (rookie) | 3.7% | 0.312 |

Recent-year weighting moderated slightly (69.9% → 59.8%) as more career data accumulated, but organizations still weighted the most recent season 2.4x the equal-weight baseline of 25%. 

**Decision Year 5** (free agency evaluation | Years 0-4 available):

| Year | Weight | P-Value |
|------|--------|---------|
| Year 4 (most recent) | **46.2%** | 0.003 |
| Year 3 | 28.7% | 0.011 |
| Year 2 | 16.4% | 0.067 |
| Year 1 | 6.3% | 0.248 |
| Year 0 (rookie) | 2.4% | 0.401 |

By Year 5 decisions, recent-year dominance continued (46.2% vs. 20% equal-weight baseline), but middle-career years (Years 2-3) received more consideration than in earlier decision windows.

**Decision Year 6** (Late extensions | Years 0-5 available):

| Year | Weight | P-Value |
|------|--------|---------|
| Year 5 (most recent) | **38.9%** | 0.018 |
| Year 4 | 24.1% | 0.047 |
| Year 3 | 18.5% | 0.089 |
| Year 2 | 12.0% | 0.156 |
| Year 1 | 4.7% | 0.389 |
| Year 0 (rookie) | 1.8% | 0.521 |

Small sample size (n=47) requires cautious interpretation, but the pattern of recent-year weighting persisted. Year 5 received 2.3x the equal-weight baseline of 16.7%, though the relative advantage decreased compared to earlier decision windows.

### ANY/A Temporal Weighting

ANY/A showed similar recency patterns with some notable differences in coefficient magnitude:

**Decision Year 3:**

| Year | Weight | P-Value |
|------|--------|---------|
| Year 2 (most recent) | **64.3%** | 0.004 |
| Year 1 | 24.8% | 0.038 |
| Year 0 (rookie) | 10.9% | 0.203 |

**Decision Year 4:**

| Year | Weight | P-Value |
|------|--------|---------|
| Year 3 (most recent) | **56.4%** | 0.002 |
| Year 2 | 26.1% | 0.021 |
| Year 1 | 14.2% | 0.098 |
| Year 0 (rookie) | 3.3% | 0.341 |

**Decision Year 5:**

| Year | Weight | P-Value |
|------|--------|---------|
| Year 4 (most recent) | **43.8%** | 0.005 |
| Year 3 | 29.4% | 0.014 |
| Year 2 | 17.9% | 0.072 |
| Year 1 | 6.7% | 0.261 |
| Year 0 (rookie) | 2.2% | 0.423 |

ANY/A showed slightly less extreme recency weighting than Total Yards (64.3% vs. 69.9% for Year 3 decisions), but the same fundamental pattern emerged: organizations heavily prioritized recent performance over career averages. 

### Temporal Weighting Visualization

The chart below shows how organizations weighted each career year when making contract decisions. Each panel represents a different decision year (3, 4, 5, 6), with bars showing the relative weight assigned to each prior season's performance. Color indicates statistical significance from bootstrap analysis.

<div class='tableauPlaceholder' id='viz1762029290305' style='position: relative'><noscript><a href='#'><img alt='Side by Side Dashboard ' src='https:&#47;&#47;public.tableau.com&#47;static&#47;images&#47;QB&#47;QBYearWeightsbyDecisionYear&#47;SidebySideDashboard&#47;1_rss.png' style='border: none' /></a></noscript><object class='tableauViz'  style='display:none;'><param name='host_url' value='https%3A%2F%2Fpublic.tableau.com%2F' /> <param name='embed_code_version' value='3' /> <param name='site_root' value='' /><param name='name' value='QBYearWeightsbyDecisionYear&#47;SidebySideDashboard' /><param name='tabs' value='no' /><param name='toolbar' value='yes' /><param name='static_image' value='https:&#47;&#47;public.tableau.com&#47;static&#47;images&#47;QB&#47;QBYearWeightsbyDecisionYear&#47;SidebySideDashboard&#47;1.png' /> <param name='animate_transition' value='yes' /><param name='display_static_image' value='yes' /><param name='display_spinner' value='yes' /><param name='display_overlay' value='yes' /><param name='display_count' value='yes' /><param name='language' value='en-US' /><param name='filter' value='publish=yes' /></object></div>                <script type='text/javascript'>                    var divElement = document.getElementById('viz1762029290305');                    var vizElement = divElement.getElementsByTagName('object')[0];                    if ( divElement.offsetWidth > 800 ) { vizElement.style.width='1100px';vizElement.style.height='877px';} else if ( divElement.offsetWidth > 500 ) { vizElement.style.width='1100px';vizElement.style.height='877px';} else { vizElement.style.width='100%';vizElement.style.height='727px';}                     var scriptElement = document.createElement('script');                    scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';                    vizElement.parentNode.insertBefore(scriptElement, vizElement);                </script>

The visualization reveals consistent recency bias across both volume (Total Yards) and efficiency (ANY/A) metrics. The most recent season consistently receives the highest weight, with earlier years receiving progressively less consideration in organizational decision-making.

### Cross-Metric Consistency

Both Total Yards and ANY/A demonstrated:
1. **Extreme recent-year weighting**: Most recent season received 2-3.5x equal-weight baseline
2. **Monotonic recency gradient**: Each earlier season received progressively less weight, with Year 0 consistently showing the lowest importance
3. **Temporal decay**: Recent-year advantage decreased as more data accumulated (70% → 46% across decision windows)
4. **Weak early-career signal**: Year 0-1 coefficients showed high p-values and unstable bootstrap distributions

The consistency across volume (Total Yards) and efficiency (ANY/A) metrics suggests these temporal patterns reflect organizational evaluation processes rather than metric-specific artifacts.

## Probability Surface Generation: Temporally-Weighted KNN

### The Prediction Challenge  

Understanding temporal weighting patterns enables a new type of analysis: calculating contract probability for any combination of (Years Since Draft, Performance Level). Given a quarterback's position in their career and current production level, what is the probability they receive a contract extension?

This question requires moving beyond regression coefficients to full probability surfaces. We need to generate predictions not just for observed quarterback-seasons in our sample, but for the entire performance space - every possible combination of career timing and statistical output.

The temporal weights enable construction of probability surfaces that incorporate organizational weighting patterns. Rather than treating all career years equally, we weight each year by its observed importance in contract decisions. Any prediction approach that ignores these temporal patterns will generate inaccurate probability estimates.

### Why K-Nearest Neighbors with Temporal Weighting

We use K-Nearest Neighbors (KNN) because it naturally captures similarity patterns—"this QB's trajectory looks like Player X who got paid"—without assuming linear relationships. KNN works well with our sample size (~45 QBs per decision window) by averaging over local neighborhoods rather than fitting complex models.

Standard KNN has a critical limitation: it treats all dimensions equally when calculating distances. A quarterback one year apart in career stage would count the same as a quarterback 500 yards apart in production. But we know from the temporal weighting analysis that year differences matter enormously—Year 2 performance receives 3x more weight than Year 0 in organizational decisions.

**Temporally-Weighted Distance Calculation:**

Standard KNN operates in 2-dimensional space: (years_since_draft, metric_value). However, treating both dimensions equally ignores organizational temporal weighting—a difference of 500 yards in Year 2 should matter more than 500 yards in Year 0.

We apply temporal weights by scaling the year dimension:
```python
For each observation at year Y:
    scale_factor = √(temporal_weight[Y] × decision_year)
    scaled_year_dimension = standardized_year × scale_factor
```

This makes heavily-weighted years contribute more to distance calculations. For Decision Year 3:
- Year 0 (8.4% weight): scale_factor = 0.50
- Year 1 (21.7% weight): scale_factor = 0.81  
- Year 2 (69.9% weight): scale_factor = 1.45

A quarterback differing by one year in Year 2 is now ~3x "further" in distance space than differing by one year in Year 0, reflecting how organizations actually weight these career stages.


### K-Nearest Neighbors Implementation

With temporally-weighted performance scores, we implement KNN classification to generate probability surfaces:

**Algorithm:**
1. Calculate temporally-weighted performance for all historical QBs at each decision year
2. For each point (Total Yards, ANY/A) on the probability surface grid:
   - Find K nearest historical QBs in weighted performance space
   - Calculate contract probability = (# who got paid) / K
3. Repeat for multiple K values (5, 10, 15, 20) to enable sensitivity analysis

**Distance metric:** Euclidean distance in 2-dimensional space (years_since_draft, metric_value) after standardization. We generate separate probability surfaces for Total Yards and ANY/A rather than combining them into a single multi-metric model.

**Grid resolution:** 100 × 100 grid covering [0, 6000] Total Yards or [0, 10] ANY/A performance space.

## Heat Map Results: Critical Performance Thresholds

The probability surfaces reveal sharp performance thresholds where contract likelihood shifts dramatically. These thresholds represent de facto organizational standards - performance levels below which quarterbacks rarely receive extensions, and above which contracts become much more likely.

**Total Yards threshold:** ~4,200 era-adjusted yards
- Below 4,000 yards: Contract probability < 40% across all decision years
- 4,000-4,400 yards: Probability increases sharply (transition zone)
- Above 4,400 yards: Contract probability > 60%, continuing to increase with additional production

**ANY/A threshold:** ~6.5 
- Below 6.0: Contract probability < 35% even with high volume
- 6.0-7.0: Transition zone where volume production becomes decisive
- Above 7.0: Contract probability > 70% if paired with adequate volume

These thresholds appeared consistently across decision years and K values, suggesting they represent bright-line standards in organizational evaluation. Quarterbacks below these boundaries rarely received contracts in our sample regardless of other performance dimensions.

### Multiple K Value Analysis

We generated surfaces for K = 5, 10, 15, 20 to assess sensitivity to neighborhood size. Smaller K values use fewer historical comparisons per prediction point, while larger K values average over more neighbors. This allows users to choose K based on their use case and to verify that probability estimates are stable across different neighborhood sizes rather than artifacts of a single K choice. Often, we select the K=20 for the background of our visuals in article 3 because they are less noisy and easier to use as a background.

All K values showed consistent threshold locations (~4,200 yards, ~6.5 ANY/A), but probability gradient steepness varied.


--------------------------------------------------------insert chart backgrounds here

### Bridge to Article 3: Trajectory Mapping and Similarity Analysis

Article 3 will overlay individual quarterback trajectories on these probability surfaces, showing career paths as lines moving through the performance space. Each quarterback's season becomes a point on the heat map, with their multi-year trajectory connecting these points to reveal development patterns, and payment chances/outcomes.

## Interpretation: Organizational Decision-Making Patterns

### What These Patterns Reveal About Organizational Behavior

Our sample shows organizations heavily prioritized recent performance when making contract decisions. Year 2 performance alone drives 70% of Year 3 contract decisions, with earlier career years generally serving primarily as tiebreakers across various contract timelines.

This weighting pattern describes **what organizations did** in our 2000-2020 sample. It does not address whether this behavior optimally predicts future quarterback performance or maximizes team success. Those questions require separate analysis comparing organizational decisions to subsequent on-field outcomes.

The temporal weighting patterns create several observable behaviors in contract markets:

### Observable Implications

**Late-bloomer advantage:** Quarterbacks with poor Year 0-1 performance but strong Year 2 breakouts (Josh Allen pattern) received disproportionately high contract probability despite lower career averages. Organizations in our sample effectively "forgot" early struggles when recent performance signaled improvement.

**Early-success trap:** Quarterbacks with strong Year 0-1 followed by Year 2 decline (Josh Rosen pattern) saw contract probability collapse despite strong career averages. Organizations heavily penalized recent regression regardless of earlier success.

**Middle-career blind spot:** Years 1-2 in Year 5 decisions received minimal weight (6-16%) despite representing significant sample size. Organizations appeared to treat these as "too old to matter, too new to establish baseline," creating evaluation gaps.

**Threshold rigidity:** The ~4,200 yard and ~6.5 ANY/A boundaries showed sharp probability transitions. Quarterbacks producing 4,150 yards faced substantially lower contract probability than those producing 4,250 yards despite minimal performance difference. This suggests bright-line evaluation standards rather than smooth continuous assessment.

### Confidence in Patterns

Bootstrap analysis showed high confidence in recent-year dominance patterns:
- Year 2 weight > 60% in Year 3 decisions: 92% of resampled datasets
- Recent year weight > equal-weight baseline: 98% of resampled datasets
- Threshold location ±200 yards: 85% of resampled datasets

Lower confidence in specific early-year weights:
- Year 0 coefficient sign: Stable in only 67% of resampled datasets
- Year 1 weight in Year 5+ decisions: Wide bootstrap confidence intervals²

We're highly confident organizations overweight recent performance. We have moderate confidence in exact magnitude of early-career discounting due to smaller coefficients and higher p-values.

### What These Patterns Mean for Decision-Making

The extreme recency weighting we observed raises a fundamental question: are organizations making rational predictions, or are they falling into systematic biases?

**The "recency is signal" interpretation:** Organizations may believe recent performance predicts future success better than career averages. If quarterback performance is unstable—where this year's output tells you more about next year than earlier seasons do—then heavy recency weighting makes sense. Year 2 matters 3x more because it's 3x more predictive.

**The "recency is bias" interpretation:** Organizations may overweight recent performance due to institutional pressures—fan expectations, media scrutiny, or front office job security tied to immediate results. If so, market inefficiencies emerge: teams who can look past one bad recent season might acquire undervalued talent, while teams who avoid chasing one great season might dodge overpayments.

We observe the behavior; we can't prove which interpretation is correct from our data alone.

### What Article 2 Delivers to Article 3

This analysis provides the foundational components for trajectory visualization:

**Temporal framework**: Year-by-year weights quantify how organizations weight each career stage, enabling accurate probability calculations at any point in a quarterback's development.

**Probability surfaces**: Temporally-weighted KNN heat maps provide contract likelihood estimates across the full performance space, incorporating organizational weighting patterns into predictions.

**Performance thresholds**: Identified boundaries (~4,200 yards, ~6.5 ANY/A) serve as reference markers for trajectory analysis - quarterbacks crossing these thresholds enter high-probability zones.

**Multiple K values**: Surfaces generated for K = 5, 10, 15, 20 enable sensitivity analysis and let users choose neighborhood size based on use case.

Article 3 will implement trajectory mapping on these probability surfaces, overlaying individual quarterback career paths to identify similarity patterns and contract timing analysis. The combination enables real-time contract prediction: given any quarterback's position in their career and current production level, we can calculate probability of extension based on how organizations weighted similar historical cases.

---

**Footnotes:**

¹ Era adjustment factors correct for league-wide offensive changes over time (e.g., total offensive yards increased 6.84% from 2000-2024). This enables fair comparison of quarterback performance across different seasons. Full methodology in Article 1.

² Bootstrap resampling randomly samples our dataset with replacement 10,000 times, re-estimating temporal weights for each sample. This produces confidence distributions showing how stable patterns are across different possible samples from the same population.

³ Contract data from Spotrac (spotrac.com) and Over The Cap (overthecap.com). We included fifth-year option exercises, franchise tags, and extensions signed with the drafting team. We excluded free agent signings with other teams and contracts following trades.