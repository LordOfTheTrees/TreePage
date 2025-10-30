---
layout: post
title: "Quantifying QB Success: Temporal Weighting Patterns in Contract Decisions, Part 2"
date: 2025-10-31
categories: [Analytics, Quarterbacks, Tableau]
---

Article 1 established which metrics predict quarterback contract decisions, identifying Total Yards (era-adjusted) and ANY/A (era-adjusted) as the key predictors balancing volume production with efficiency. However, that analysis treated all career years equally, averaging performance across Years 1-3 with uniform weights. This approach optimized overall prediction accuracy but obscured a crucial dimension of organizational evaluation: teams don't weight all career years equally when making contract decisions.

The question Article 1 left unanswered is not which metrics matter, but **when** they matter most. Does a quarterback's rookie season carry the same weight as their most recent performance? Do teams exhibit recency bias, weighting recent seasons heavier while discounting earlier career data? Or do organizations take a balanced, long-term view of quarterback development?

This analysis decomposes the temporal patterns in contract evaluation, revealing systematic biases in how teams weight performance across a quarterback's early career. The findings have immediate practical implications: understanding when performance matters most enables better prediction of which current quarterbacks are on track for extensions versus which face uncertain futures despite strong career averages.

## Executive Summary

Article 2 quantifies the temporal dimension of quarterback evaluation that Article 1's methodology masked. By transforming calendar years into contract-relative timelines and running year-specific regressions, this analysis reveals non-linear recency weighting in organizational decision-making.

**Article 2 Contributions:**
- Quantifies extreme recency bias in organizational evaluation: Year 2 performance receives **69.9% weight** in Year 3 decisions versus 33.3% equal-weight baseline - a **2.10x multiplier**
- Reveals non-linear temporal decay patterns with middle career years receiving disproportionately low weight
- Establishes temporally-weighted KNN methodology for probability surface generation
- Identifies critical performance thresholds from heat map analysis: **~4,200 era-adjusted yards** and **~6.5 ANY/A** emerge as key inflection points for contract probability

**Key Findings:**
- **Strong recency weighting**: Most recent season receives 2-3x more weight than equal-weight baseline across all decision years
- **U-shaped importance curve**: Rookie year (8.4-16.4% weight) and most recent year (46-70% weight) prioritized over middle career years (<5% weight in some cases)
- **Temporal weight decay**: Recent-year weighting moderates as more data accumulates (70% → 60% → 46% from Year 3 to Year 5 decisions)
- **Performance thresholds**: Heat maps reveal ~4,200 total yards and ~6.5 ANY/A as critical decision boundaries where contract probability exceeds 60%

These patterns demonstrate that teams heavily discount middle-career performance, creating evaluation blind spots that may lead to suboptimal contract timing. The extreme recency weighting suggests organizations either believe recent performance better predicts future output, or face institutional pressures that prioritize immediate results over comprehensive career evaluation.

## From WHICH Metrics to WHEN They Matter

### The Temporal Blind Spot in Article 1

Article 1 identified Total Yards (era-adjusted) and ANY/A (era-adjusted) as the metrics that best predict contract decisions. The regression approach averaged quarterback performance across Years 1-3 equally, assigning each year identical weight in the model. This equal weighting assumption enabled clean identification of which statistical categories matter most, but imposed a critical constraint: the model could not reveal whether teams weight rookie performance the same as Year 3 performance.

Consider Josh Allen's trajectory through his first three seasons:
- Year 0 (2018): 2,074 total yards - below replacement level
- Year 1 (2019): 3,089 total yards - modest improvement  
- Year 2 (2020): 4,544 total yards - elite breakout season

Article 1's methodology would calculate Allen's three-year average (3,236 yards) and use that single value to predict his contract outcome. This approach correctly predicted Allen's extension - his average performance exceeded the threshold for contract renewal. But it cannot answer whether the Bills' decision was driven primarily by the Year 2 breakout, or whether they weighted all three seasons equally in their evaluation.

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

The separate coefficients reveal how much each career stage contributes to contract decisions. If teams weight all years equally, coefficients should be roughly identical. If teams exhibit recency bias, recent-year coefficients should dominate. The magnitude of these differences quantifies organizational temporal weighting patterns.

### Bridge to Article 3: Why Temporal Patterns Enable Trajectory Prediction

Article 3 will overlay individual quarterback trajectories on probability surfaces, showing which current QBs are trending toward extensions versus missed opportunities. These trajectory predictions require accurate temporal weighting - we cannot calculate a quarterback's current contract probability without knowing how teams weight each year of their career.

For example, C.J. Stroud after Year 1 (2023 rookie season): To predict his Year 2 contract probability, we need to know how much teams weight rookie performance versus how much they will weight his upcoming Year 1 performance. Article 2's temporal weights provide this missing piece, enabling Article 3 to position any quarterback accurately on the probability surface at any point in their career.

## Data Pipeline: Contract-Relative Timeline Construction

### The Calendar Year Problem

Standard statistical analysis organizes quarterback data by calendar year - Josh Allen's 2018 season, 2019 season, 2020 season. This structure works well for seasonal comparisons but fails for contract analysis because contract timing doesn't align with calendar boundaries.

Josh Allen signed his extension in August 2021, before the 2021 season began. The Bills' decision was based on three complete regular seasons:
- 2018 season (Year 0): Completed January 2019
- 2019 season (Year 1): Completed January 2020
- 2020 season (Year 2): Completed January 2021
- Extension signed: August 2021

Allen's 2021 season performance could not have influenced the contract decision - those games occurred after the extension was signed. Calendar-year organization treats 2021 as the "contract year," but this is temporally backwards. We need to reorganize data by decision timing, not calendar dates.

The misalignment creates measurement error. If we include 2021 season statistics in Allen's contract evaluation, we're incorporating information that did not exist when the decision was made. This retrospective contamination biases our understanding of what factors actually drove the extension.

### Contract-Relative Timeline Construction

The solution transforms calendar years into contract-relative years, aligning performance data with decision timing.

**Step 1: Identify Payment Year**

For each first-round quarterback drafted 2000-2020, we scraped contract data from Spotrac and Over The Cap to identify the first significant non-rookie contract signed with their drafting team. This includes fifth-year option exercises, franchise tags, and extensions, but excludes free agent signings with other teams or contracts following trades. The restriction to same-team contracts ensures we're analyzing organizational evaluation of their own draft pick, not market evaluation of a quarterback with a new team.

We record `payment_year` as the calendar year in which the contract was signed, and create a binary indicator `got_paid` (1 if contract exists, 0 otherwise). This binary outcome serves as our dependent variable - quarterbacks who receive second contracts from their drafting team have met organizational thresholds, while those who don't have failed to demonstrate sufficient value.

**Step 2: Calculate Years Relative to Payment**

We then transform each season into decision-relative time:

```
years_to_payment = season - payment_year
```

This calculation creates a standardized timeline across all quarterbacks, where `years_to_payment = -1` represents the most recent complete season before the contract decision, `years_to_payment = -2` represents two seasons prior, and so on.

**Josh Allen example transformation:**

| Season | Stats | Payment_Year | Years_to_Payment | Label |
|--------|-------|--------------|------------------|-------|
| 2018 | 2,074 yds | 2021 | -3 | Year 0 (rookie) |
| 2019 | 3,089 yds | 2021 | -2 | Year 1 |
| 2020 | 4,544 yds | 2021 | -1 | Year 2 (most recent) |
| 2021 | 4,407 yds | 2021 | 0 | Year 3 (excluded) |

The critical detail: NFL regular seasons run September through January (16-17 games). All statistics reflect regular season performance only - preseason exhibitions and playoff games are excluded. Preseason games involve heavy roster experimentation and do not reflect regular decision-making, while playoff games are not guaranteed and sample sizes vary dramatically by team success. Regular season performance provides a consistent 16-17 game sample across all quarterbacks, which is what organizations use for evaluation.

Contracts are typically signed during the offseason (March through August). For Allen, the 2020 season concluded in January 2021, followed by contract signing in August 2021. Performance from the 2021 season occurred entirely after the extension was signed - those games could not have influenced the decision. The `years_to_payment = 0` designation captures this timing: it's the season during which the contract was signed, but games played after signing.

This transformation ensures all performance data is naturally lagged - there is no risk of including "future" information that didn't exist at decision time.

### Creating Temporal Lag Features

For each performance metric (Total Yards, ANY/A), we generate lookback windows representing performance at different career stages:

```
For each metric:
  lag1 = performance 1 year ago (most recent complete season)
  lag2 = performance 2 years ago
  lag3 = performance 3 years ago
  lag4 = performance 4 years ago
```

These lags map to different decision years:

**Decision Year 3** (evaluating for 5th-year option):
- Filter: `years_to_payment = -1`
- lag1 → Year 2 performance  
- lag2 → Year 1 performance
- lag3 → Year 0 (rookie) performance

**Decision Year 4** (evaluating for extension):
- Filter: `years_to_payment = -1` or `0` (varies by QB)
- lag1 → Year 3 performance
- lag2 → Year 2 performance
- lag3 → Year 1 performance  
- lag4 → Year 0 (rookie) performance

The contract-relative structure enables direct comparison across quarterbacks: we can ask "how much does rookie performance matter in Year 3 decisions?" and get a consistent answer across the entire sample, despite quarterbacks being drafted in different calendar years and receiving contracts at different times.

### Sample Composition

Not all first-round quarterbacks reach each decision window. Some never establish themselves as starters (insufficient playing time), some get traded before reaching extension eligibility, and others sign contracts earlier than typical due to exceptional early performance.

**QBs eligible for each decision window (2000-2020 draft classes):**

| Decision Year | Evaluation Window | N QBs | Got Paid | Not Paid |
|---------------|-------------------|-------|----------|----------|
| Year 3 | Years 0-2 | 45 | 18 | 27 |
| Year 4 | Years 0-3 | 42 | 21 | 21 |
| Year 5 | Years 0-4 | 38 | 24 | 14 |
| Year 6 | Years 0-5 | 12 | 6 | 6 |

The Year 3 decision window has the largest sample (n=45) and roughly 60/40 split between paid and unpaid outcomes. This balanced distribution provides statistical power for detecting temporal patterns. Year 6 has limited sample size due to franchise tags, fifth-year option mechanics, and pre-2011 CBA differences - we report these results but they should be interpreted cautiously given the small sample.

The increasing "got paid" ratio across decision years reflects survivorship bias - quarterbacks who reach Year 5 without being released have already demonstrated sufficient value to remain on rosters, selecting for higher-quality players in later windows.

## Methodological Framework: Year-Specific Regressions

### Regression Specification

For each decision year, we estimate a separate logistic regression with year-specific coefficients:

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

Total Yards combines passing and rushing production, capturing dual-threat ability while maintaining broad sample representation. ANY/A provides a rate-based efficiency measure that accounts for touchdowns, interceptions, and sacks, offering stability across different offensive schemes and playing time variations.

## Results: Temporal Weighting Patterns

### Total Yards Temporal Weighting

The year-specific regressions reveal extreme recency weighting across all decision windows, with the most recent complete season dominating contract decisions.

**Decision Year 3** (5th-year option evaluation | Years 0-2 available):

| Year | Weight | Coefficient |
|------|--------|-------------|
| Year 2 (most recent) | **69.9%** | 0.154 |
| Year 1 | 21.7% | 0.048 |
| Year 0 (rookie) | 8.4% | 0.018 |

Year 2 performance receives nearly 70% of total weight in Year 3 contract decisions. This represents an 8.3x multiplier relative to rookie performance (69.9% / 8.4%) and a 3.2x multiplier relative to Year 1 performance (69.9% / 21.7%). Under equal weighting, each year would receive 33.3% weight. Year 2's actual weight is 2.10x the equal-weight baseline (69.9% / 33.3%).

The pattern suggests organizations make Year 3 contract decisions almost entirely based on the most recent season, with earlier career performance serving primarily as tiebreakers between quarterbacks with similar recent production.

**Decision Year 4** (extension window | Years 0-3 available):

| Year | Weight | Coefficient |
|------|--------|-------------|
| Year 3 (most recent) | **59.7%** | 0.183 |
| Year 2 | 18.0% | 0.055 |
| Year 0 (rookie) | 13.9% | 0.043 |
| Year 1 | 8.4% | 0.026 |

Recent-year dominance persists in Year 4 decisions, though moderating slightly to 59.7% weight. Interestingly, rookie year performance (13.9%) receives higher weight than Year 1 performance (8.4%), suggesting a U-shaped importance curve. Organizations appear to value both the most recent data and the initial talent evaluation from the draft, while discounting middle career years.

Against a 25% equal-weight baseline (four years available), Year 3 weight represents a 2.39x multiplier (59.7% / 25.0%). The U-shaped pattern indicates teams may use rookie performance as an anchor - "this is the talent we drafted" - while middle years get dismissed as developmental noise.

**Decision Year 5** (free agency evaluation | Years 0-4 available):

| Year | Weight | Coefficient |
|------|--------|-------------|
| Year 4 (most recent) | **46.3%** | 0.156 |
| Year 3 | 29.4% | 0.099 |
| Year 0 (rookie) | 16.4% | 0.055 |
| Year 2 | 3.7% | 0.012 |
| Year 1 | 4.2% | 0.014 |

Recent-year weighting continues to moderate as more data accumulates, dropping to 46.3% in Year 5 decisions. However, this still represents a 2.32x multiplier against the 20% equal-weight baseline (46.3% / 20.0%). Middle years (1-2) receive minimal weight, combining for less than 8% of total decision signal.

The temporal decay pattern shows organizations increase the weight of recent performance, but never achieve equal weighting even with five years of data available. Year 4 alone carries more weight than Years 1-3 combined (46.3% vs. 37.3%).

### Quantifying the Recency Bias

To quantify the magnitude of recency weighting, we calculate the recency ratio:

```
Recency Ratio = (Most Recent Year Weight) / (Equal Weight Baseline)
```

This ratio measures how much more teams weight recent performance relative to naive equal averaging across all available years.

**Total Yards Recency Ratios:**
- Decision Year 3: 69.9% vs. 33.3% baseline = **2.10x multiplier**
- Decision Year 4: 59.7% vs. 25.0% baseline = **2.39x multiplier**
- Decision Year 5: 46.3% vs. 20.0% baseline = **2.32x multiplier**

Teams consistently weight the most recent season 2-3 times more heavily than simple averaging would suggest. This pattern holds remarkably stable across decision years - as more data becomes available, teams don't shift toward equal weighting, but rather maintain a consistent ~2-2.5x recency multiplier.

The consistency suggests this weighting pattern reflects either (1) genuine predictive validity where recent performance better forecasts future output, or (2) institutional pressures that prioritize immediate results over comprehensive career evaluation. We cannot distinguish between these interpretations from the data alone, but we can quantify that the bias exists and is substantial.

It's worth noting these patterns don't necessarily represent "bias" in the pejorative sense. If quarterbacks genuinely improve over time and recent performance better predicts future performance than career averages, heavier recent-year weighting may be rational. The 2-3x magnitude quantifies how much teams prioritize recent data, not whether this approach is optimal.

## From Temporal Weights to Probability Surfaces

### The Prediction Challenge  

Understanding temporal weighting patterns enables a new type of analysis: calculating contract probability for any combination of (Years Since Draft, Performance Level). Given a quarterback's position in their career and current production level, what is the probability they receive a contract extension?

This question requires moving beyond regression coefficients to full probability surfaces. We need to generate predictions not just for observed quarterback-seasons in our sample, but for the entire performance space - every possible combination of career timing and statistical output.

The challenge is incorporating temporal weighting into the prediction methodology. Standard machine learning approaches would treat all career years equally, but we now know teams weight Year 2 performance 3x more heavily than Year 1 for early contract decisions. Any prediction approach that ignores these temporal patterns will generate inaccurate probability estimates.

### Why K-Nearest Neighbors with Temporal Weighting

We use K-Nearest Neighbors (KNN) as the prediction methodology for several reasons:

**Non-parametric flexibility**: KNN makes no assumptions about functional form or linearity. Contract probability may have threshold effects (4,000 yards matters very differently than 3,900 yards) or interaction effects (Year 2 performance matters more when combined with strong Year 0) that linear models struggle to capture.

**Intuitive similarity**: The KNN logic aligns with how teams actually evaluate quarterbacks: "This QB's trajectory looks similar to Player X, who received an extension." We're formalizing the pattern-matching that scouts and general managers already do informally.

**Handles sparse data**: With 42-45 observations per decision window, we don't have enough data for complex neural networks or ensemble methods. KNN works well with small samples by averaging over local neighborhoods.

However, standard KNN has a critical flaw for our application: it treats all dimensions equally when calculating distances. A quarterback one year apart in career stage would count the same as a quarterback 500 yards apart in production. But we know from the temporal weighting analysis that a one-year difference in career stage matters enormously - Year 2 performance has 3x more impact than Year 1 performance.

### Weighted Distance Calculation

Standard KNN calculates distance as:

```
D(x, x') = √[(year - year')² + (performance - performance')²]
```

This treats year differences identically regardless of which career stage. A Year 0 to Year 1 difference counts the same as a Year 2 to Year 3 difference, contradicting our temporal weighting findings.

Our temporally-weighted KNN approach modifies the distance calculation to incorporate year-specific weights:

**Step 1**: Standardize both dimensions (year and performance) to have mean 0 and standard deviation 1. This ensures neither dimension dominates purely due to scale.

**Step 2**: Scale the year dimension by temporal weights:

```
For each year in career stage:
    weight = temporal_weight[year]  # From regression analysis
    scale_factor = √(weight × decision_year)
    year_dimension[year] *= scale_factor
```

This scaling makes differences in heavily-weighted years contribute more to the distance calculation. For Decision Year 3 with Total Yards:

- Year 0: weight = 8.4% → scale_factor = 0.50
- Year 1: weight = 21.7% → scale_factor = 0.81
- Year 2: weight = 69.9% → scale_factor = 1.45

A quarterback who differs by 500 yards in Year 2 is now effectively 3x further away than a quarterback who differs by 500 yards in Year 0 (1.45 / 0.50 = 2.9x). This reflects how teams actually weight these differences in their decisions.

**Step 3**: Calculate Euclidean distance in the weighted space:

```
D(x, x') = √[(weighted_year - weighted_year')² + (standardized_perf - standardized_perf')²]
```

**Step 4**: Find K nearest neighbors and calculate probability:

```
P(contract) = (count of neighbors who got paid) / K × 100%
```

This probability estimate reflects similar historical trajectories, weighted by how teams actually evaluate career stages.

### K Value Selection and Sensitivity

We generate probability surfaces for multiple K values (K = 5, 10, 15, 20) to enable sensitivity analysis. Different K values represent different trade-offs:

- **K = 5**: High sensitivity to local patterns, captures sharp transitions, more volatile predictions
- **K = 10**: Moderate smoothing, preserves important gradients
- **K = 15**: Balanced approach, smooths outliers while maintaining structure  
- **K = 20**: Heavy smoothing, may obscure important boundaries

Rather than selecting a single "optimal" K, we provide surfaces for multiple values. This allows users to see how neighborhood size affects predictions and choose based on their use case - scouting departments might prefer K=5 for sharp decision boundaries, while contract negotiators might prefer K=15 for more stable estimates.

The multiple K approach also serves as a robustness check. If probability estimates vary wildly across K values, it indicates we're in a sparse region of the performance space with limited historical precedent. If estimates are stable across K values, we can be more confident in the prediction.

### Creating the Probability Surface

We generate a fine grid across the performance space:

- **X-axis (Years)**: 0.0 to 6.0 in 40 equal steps (0.15-year increments)
- **Y-axis (Performance)**: Minimum to maximum observed values in 100 equal steps
- **Total grid**: 4,000 prediction points per surface (40 × 100)

For each grid point, we:
1. Transform to weighted space using temporal scaling factors
2. Calculate distances to all observed quarterback-seasons  
3. Find K nearest neighbors
4. Calculate contract probability as percentage of neighbors who got paid

The output provides contract probability estimates for every possible combination of career timing and performance level, ready for visualization as heat maps.

## Heat Map Results: Critical Performance Thresholds

The probability surfaces reveal sharp performance thresholds where contract likelihood shifts dramatically. These thresholds represent de facto organizational standards - performance levels below which quarterbacks rarely receive extensions, and above which contracts become much more likely.

### Total Yards Surface (Decision Year 3)

The heat map visualization shows Years 0-2 on the X-axis, Total Yards (era-adjusted) on the Y-axis, with contract probability displayed as an orange-to-blue color gradient (orange = high probability, blue = low probability).

**Critical threshold identified**: Approximately **4,200 era-adjusted total yards** in Year 2.

Quarterbacks who exceed this mark in their most recent season show dramatically higher contract probability regardless of earlier career performance. The threshold appears as a sharp horizontal boundary in the heat map - the transition from blue to orange zones occurs rapidly as production crosses 4,200 yards.

**Interpretation zones:**

- **Orange zones (>60% probability)**: Year 2 production above ~4,200 yards. Even quarterbacks with mediocre rookie seasons reach high contract probability if their most recent year clears this threshold.

- **White/transitional zones (40-60% probability)**: Moderate Year 2 performance around 3,500-4,200 yards. Contract decisions in this range appear more sensitive to career trajectory - upward trends more likely to receive extensions than flat trajectories.

- **Blue zones (<40% probability)**: Year 2 production below ~3,500 yards. Quarterbacks in this region rarely receive contracts regardless of strong rookie performance. The 70% Year 2 weighting makes it nearly impossible to overcome poor recent production with strong Year 0-1 performance.

The sharp 4,200-yard threshold suggests organizations use production volume as a primary filter. This represents approximately 262 yards per game over a 16-game season, or 247 yards per game over a 17-game season - well above replacement level but below elite tier (4,500+ yards).

Interestingly, the threshold location is fairly stable across Year 0 and Year 1 performance levels, indicating Year 2 production matters almost independently. A quarterback with 2,000 rookie yards who reaches 4,400 yards in Year 2 has similar contract probability as a quarterback with 3,500 rookie yards who reaches 4,400 yards in Year 2. The 70% Year 2 weighting dominates the signal.

### ANY/A Surface (Decision Year 3)

The ANY/A heat map shows similar structure but with efficiency-based thresholds rather than volume-based.

**Critical threshold identified**: Approximately **6.5 ANY/A** in Year 2.

Unlike total yards, the ANY/A threshold shows more uniform importance across career years. Quarterbacks who consistently maintain ~6.5+ ANY/A across all career stages show high contract probability even without a single dominant season. This suggests teams view efficiency differently than volume - consistent efficiency signals sustainable performance, while volume might be scheme-dependent or context-dependent.

**Interpretation:**

- **Orange zones (>60% probability)**: Year 2 ANY/A above ~6.5. The threshold is sharper than total yards - the transition from 40% to 70% probability occurs over roughly 0.5 ANY/A, representing very tight efficiency standards.

- **Transitional zones (40-60% probability)**: ANY/A between ~5.5-6.5 in Year 2. Quarterbacks in this range can improve their probability with strong Year 0-1 consistency, unlike volume metrics where Year 2 dominates almost entirely.

- **Blue zones (<40% probability)**: Year 2 ANY/A below ~5.5. This efficiency level represents below-average performance, and even strong rookie efficiency cannot overcome recent struggles.

The ANY/A surface shows less volatility than total yards - fewer sharp transitions and more gradual probability changes. This likely reflects that efficiency metrics are more stable year-to-year than volume metrics, which can fluctuate based on offensive scheme, coaching changes, or team situation.

Notably, the ~6.5 ANY/A threshold aligns closely with league-average efficiency during the 2015-2024 period (after era adjustment). This suggests teams use a "prove you're above average" standard for efficiency - quarterbacks must demonstrate they can beat league-average efficiency to merit extensions, even if their volume production is strong.

## Bridge to Article 3: Trajectory Mapping and Similarity Analysis

### How Temporal Weights Enable Trajectory Visualization

Article 3 will overlay individual quarterback trajectories on these probability surfaces, showing career paths as lines moving through the performance space. Each quarterback's season becomes a point on the heat map, with their multi-year trajectory connecting these points to reveal development patterns.

The temporal weighting embedded in the probability surfaces ensures accurate positioning at each career stage. When we plot C.J. Stroud's Year 1 season on the surface, the underlying probability already reflects that teams will weight his Year 1 performance 70% when making Year 3 decisions. We don't need separate models for different career stages - the surface itself incorporates temporal weighting patterns.

This enables direct visual comparison: Which current quarterbacks are following trajectories similar to Josh Allen (low Year 0, breakout Year 2)? Which resemble Baker Mayfield (solid start, plateau or decline)? The trajectories reveal not just current position but momentum - whether a quarterback is trending toward high-probability zones or away from them.

### Trajectory Similarity Analysis

Article 3's core innovation is identifying historical quarterbacks with similar career paths to current players. Similarity is based on:

- Performance level at each career stage (absolute production)
- Trajectory shape (steady growth vs. breakout vs. decline)  
- Position relative to probability thresholds (crossing into orange zones vs. staying blue)

**Example application**: Josh Allen's trajectory from 2018-2020 can be matched against historical patterns to find precedents. Which other quarterbacks had similar Year 0-1 performance but then broke out in Year 2? Did those quarterbacks receive extensions immediately like Allen, or did teams wait to see if the improvement sustained?

The similarity analysis enables several strategic insights:

1. **Contract timing prediction**: If a current quarterback's trajectory matches historical patterns that led to Year 3 extensions, we can predict they're on track for early deals.

2. **Market efficiency analysis**: Did historical quarterbacks with similar trajectories get paid before or after optimal timing? This identifies whether teams locked in value early or paid for peak performance.

3. **Risk assessment**: How often do quarterbacks who follow this trajectory pattern sustain their performance versus regress? This informs whether extensions are based on sustainable trends or outlier seasons.

### Contract Value Assessment: Getting Ahead vs. Falling Behind

One of Article 3's key applications is evaluating contract timing decisions as "getting ahead" of trajectory development versus "falling behind" by paying for past performance.

**Best value contracts (Getting ahead):**

Teams that signed quarterbacks before their trajectories crossed into high-probability zones locked in talent before the market recognized full value. Example pattern: extension after strong Year 2 but before elite Year 3 confirms the breakout is sustainable.

These contracts are "bargains" in retrospect - teams paid Year 3 prices for what became Year 5 performance. The quarterback's subsequent seasons exceeded the trajectory that warranted the contract, meaning the team captured surplus value.

**Worst value contracts (Falling behind):**

Teams that signed quarterbacks after their trajectories already showed decline signals paid premium prices for past performance while probability decreased. Example pattern: extension after peak year, followed by immediate regression toward replacement level.

These contracts are "overpayments" - teams paid for trajectory peaks that were already reversing. The quarterback's subsequent performance underperformed the trajectory that warranted the contract.

**Market timing analysis:**

Article 3 will identify the optimal signing points where probability is increasing but has not yet peaked. These represent moments when the trajectory clearly points toward high performance, but the quarterback hasn't yet delivered enough seasons to maximize leverage in negotiations.

The analysis will also reveal risk zones where trajectories suggest imminent decline despite strong recent performance. Teams signing contracts at these points are betting against trajectory momentum.

### Real-Time Trajectory Tracking for Current QBs

The probability surfaces enable real-time positioning of current NFL quarterbacks:

**2024 draft class (Year 0)**: Rookies just establishing their baseline position on the surface. Too early for contract predictions, but we can track which rookies start in orange zones (strong Year 0 production) versus blue zones (developmental Year 0).

**2023 draft class (Year 1)**: Second-year quarterbacks with one-season trajectories visible. We can see which are trending upward toward the 4,200-yard / 6.5 ANY/A thresholds versus which are stuck in blue zones. C.J. Stroud's position after Year 1 will indicate his Year 3 contract probability.

**2022 draft class (Year 2)**: Third-year quarterbacks approaching the critical Year 3 decision window. Year 2 performance receives 70% weight in Year 3 decisions, making this season determinative for most quarterbacks. Crossing the 4,200-yard threshold this season dramatically increases extension probability.

**2021 draft class (Year 3+)**: Complete picture available through three or more seasons. Contract outcomes should already be materializing - we can validate the model by comparing predictions to actual signings.

**Comparative trajectory analysis:**

The 2018 draft class provides a historical example of trajectory divergence:

| QB | Year 0 | Year 1 | Year 2 | Surface Position | Outcome |
|---|---|---|---|---|---|
| Josh Allen | 2,074 yd | 3,089 yd | 4,544 yd | Crossed threshold | $258M extension |
| Josh Rosen | 2,278 yd | 567 yd | --- | Exited sample | No contract |
| Baker Mayfield | 3,725 yd | 3,827 yd | 3,563 yd | Below threshold | 5th year option only |
| Lamar Jackson | 1,201 yd | 3,127 yd | 2,757 yd | Efficiency advantage | $260M extension |

**Trajectory insights:**

Allen's steep upward trajectory carried him across the 4,200-yard threshold in Year 2, triggering immediate extension. The Bills recognized the trajectory momentum and signed him before Year 3 could further increase his leverage.

Rosen's trajectory collapsed after Year 0 - he never established himself as a starter in Year 1, exiting the sample entirely. No trajectory, no contract.

Mayfield's flat trajectory kept him near but below the volume threshold throughout his first three years. The Browns exercised his fifth-year option (minimal commitment) but didn't offer an extension, waiting to see if Year 4 would break through the threshold.

Jackson's trajectory illustrates the importance of efficiency metrics - while his volume stayed below the 4,200-yard threshold, his ANY/A efficiency compensated. The Ravens valued the efficiency profile enough to extend despite lower volume production. This demonstrates that the surfaces interact - quarterbacks can reach high probability through either volume or efficiency paths.

Article 3 will apply this same analysis to current quarterbacks, identifying which are following "Allen-like" trajectories toward immediate extensions, which resemble "Mayfield-like" flat patterns suggesting delayed decisions, and which show "Rosen-like" warning signs of exit from starting roles.

## Conclusions

### Core Findings

This analysis reveals systematic temporal weighting patterns in organizational quarterback evaluation:

**Extreme recency weighting**: Teams weight the most recent season 2-3x more heavily than naive equal-weighting would suggest, maintaining this ratio consistently across decision years. Year 2 performance alone drives 70% of Year 3 contract decisions, with earlier career years serving primarily as tiebreakers.

**Non-linear temporal decay**: Weights don't decline uniformly with age of data. Instead, we observe U-shaped patterns where rookie year performance receives higher weight than middle career years. This suggests organizations anchor on initial draft evaluation while discounting developmental noise in Years 1-2.

**Critical performance thresholds**: Probability surfaces reveal sharp decision boundaries at approximately 4,200 era-adjusted total yards and 6.5 ANY/A. These thresholds represent de facto organizational standards - production levels below which contracts are rare, and above which probability increases dramatically.

**Persistent patterns across decision timing**: The 2-3x recency multiplier holds stable from Year 3 through Year 5 decisions. As more data accumulates, teams don't shift toward equal weighting but rather maintain consistent prioritization of recent performance.

### Implications for Organizational Evaluation

The temporal patterns raise questions about optimal evaluation strategies. The extreme recency weighting suggests organizations either believe recent performance better predicts future output, or face institutional pressures that prioritize immediate results over comprehensive career assessment.

If the recency weighting reflects rational belief about predictive validity, it implies quarterback performance is highly non-stationary - future seasons correlate more strongly with the most recent season than with career averages. This would justify heavy discounting of older data.

Alternatively, if recency weighting reflects institutional bias rather than optimal prediction, it creates exploitable inefficiencies. Teams that can identify quarterbacks undervalued by recent poor performance could acquire talent below market rate. Similarly, teams that avoid overvaluing recent outlier seasons could prevent overpayment for unsustainable peaks.

The sharp performance thresholds (~4,200 yards, ~6.5 ANY/A) suggest bright-line standards that may not align with actual performance discontinuities. There's likely no meaningful difference between a quarterback who produces 4,150 yards versus 4,250 yards, yet the probability surfaces show substantial contract likelihood differences. This threshold rigidity may lead to suboptimal contract timing - missing on slightly-below-threshold quarterbacks who are improving, while overpaying slightly-above-threshold quarterbacks who got lucky.

### What Article 2 Delivers to Article 3

This analysis provides the foundational components for trajectory visualization:

**Temporal framework**: Year-by-year weights quantify how organizations weight each career stage, enabling accurate probability calculations at any point in a quarterback's development.

**Probability surfaces**: Temporally-weighted KNN heat maps provide contract likelihood estimates across the full performance space, incorporating organizational weighting patterns into predictions.

**Performance thresholds**: Identified boundaries (~4,200 yards, ~6.5 ANY/A) serve as reference markers for trajectory analysis - quarterbacks crossing these thresholds enter high-probability zones.

**Multiple K values**: Surfaces generated for K = 5, 10, 15, 20 enable sensitivity analysis and let users choose neighborhood size based on use case.

Article 3 will implement trajectory mapping on these probability surfaces, overlaying individual quarterback career paths to identify similarity patterns and contract value opportunities. The analysis will reveal which current NFL quarterbacks are following historical patterns toward extensions versus which face uncertain futures despite strong career averages.

The combination enables real-time contract prediction: given any quarterback's position in their career and current production level, we can calculate probability of extension, identify similar historical trajectories, and assess whether current market timing represents optimal value or missed opportunity.

---

**Footnotes:**

The methodological details and data outputs support reproducibility of the temporal weighting analysis and probability surface generation. Temporal weight matrices document year-by-year coefficient patterns for both volume (Total Yards) and efficiency (ANY/A) metrics across decision windows. Probability surfaces provide contract likelihood estimates across the full performance-time space for multiple neighborhood sizes, enabling sensitivity analysis. Individual trajectory data captures year-by-year quarterback performance progressions for overlay analysis in interactive visualizations.

**Next Article**: Article 3 implements trajectory mapping on these probability surfaces, identifying contract value opportunities through historical similarity analysis and revealing which current NFL quarterbacks are following paths toward extensions versus missed opportunities.