---
layout: post
title: "Quantifying QB Success: Archetypal Trajectories and Current Pending Decisions (Part 3)"
date: 2025-11-16
categories: [Analytics, Quarterbacks, Tableau]
---

## I. How We Overlaid the Data and Heatmaps

### Building on Articles 1 & 2: The Foundation

Articles 1 and 2 established the analytical infrastructure for quarterback contract prediction:

**From Article 1:**
- Contract renewal as the objective success measure, removing subjective evaluation bias
- Era-adjustment methodology eliminating cross-temporal bias (+6.84% offensive yards inflation, +17% TD inflation from 2000-2024)
- Identification of Total Yards (era-adjusted) and ANY/A (era-adjusted) as primary predictive metrics

**From Article 2:**
- Temporal weighting quantification: Year 2 performance receives **69.9% weight** in Year 3 contract decisions versus 33.3% equal-weight baseline (2.10x multiplier)
- Non-linear temporal decay patterns with extreme recency bias across all decision windows
- Performance threshold identification: ~4,200 era-adjusted yards and ~6.5 ANY/A as critical inflection points

### Integrating Trajectory Data with Probability Surfaces

The probability surfaces from Article 2 represent the decision-making landscape teams navigate when evaluating quarterbacks. Each point on the heat map shows: given X years of experience and Y level of performance, what percentage of historical quarterbacks received contract extensions?

**Critical Innovation:** By overlaying individual quarterback career trajectories onto these probability surfaces, we transform static performance thresholds into dynamic career path analysis. A quarterback's trajectory becomes a line moving through the probability space, revealing:

- **Current position**: Where does performance place them today?
- **Momentum direction**: Are they trending toward or away from high-probability zones?
- **Historical precedent**: Which past quarterbacks followed similar paths?
- **Contract timing**: When did comparable players receive extensions?

### Technical Implementation

**Trajectory Construction:**
For each quarterback, we sequence their year-by-year performance chronologically:
```
Josh Allen trajectory (2018-2021):
  Year 0: 2,749 yards, 4.42 ANY/A  (rookie season)
  Year 1: 3,648 yards, 5.77 ANY/A  (growth year)
  Year 2: 5,019 yards, 7.88 ANY/A  (breakout season)
  Year 3: 5,212 yards, 6.42 ANY/A  → CONTRACT SIGNED AFTER
```

**Probability Surface Integration:**
Each season plots as coordinates (years_since_draft, performance_metric) on the heat map. The underlying KNN model calculates contract probability at that exact point using temporal weights from Article 2. The trajectory line connects these season-points, showing the quarterback's path through the probability landscape.

--------------------------------INSERT THE COMPLETE COMPARISON CHART HERE UP FRONT

## II. How We Generate the Comparisons: QB_comp_tool.py

### Similarity Methodology: Temporally-Weighted Distance Calculation

The comparison tool implements trajectory-based similarity matching using weighted Euclidean distance across career stages. This approach differs from simple "nearest stats" matching by incorporating **both** performance levels **and** temporal career progression.

**Core Algorithm:**
For each target QB, we:
1. Extract their year-by-year performance trajectory (Years 0 through decision year)
2. Calculate weighted distance to every historical QB's trajectory
3. Apply temporal weights from Article 2 (ex: Year 2 weighted 69.9% for Year 3 decisions)
4. Rank by similarity score (lower distance = more similar)
5. Return top 5 comparables with contract outcomes

**A Reminder on Why Temporal Weighting Matters:**
Standard similarity metrics treat all years equally, but teams don't evaluate that way. A QB with:
- Year 0: 2,500 yards
- Year 1: 3,500 yards  
- Year 2: 5,000 yards

Is MORE similar (in team evaluation) to Josh Allen than a QB with:
- Year 0: 3,500 yards
- Year 1: 3,500 yards
- Year 2: 3,500 yards

Even though the second QB has higher average production. The trajectory **SHAPE** matters more than the average.

### Dual-Metric Comparison Framework

We generate comparisons for **both** predictive metrics independently:

**Volume-Based Comps (Total Yards):** Identifies quarterbacks with similar production trajectories
**Efficiency-Based Comps (ANY/A):** Identifies quarterbacks with similar effectiveness patterns

**Example Output Structure:**
```
Target QB: Justin Fields
Decision Year: 4

VOLUME COMPS (Total Yards):
1. Cam Newton (similarity: 412) - PAID
2. Marcus Mariota (similarity: 458) - NOT PAID  
Payment rate: 60%

EFFICIENCY COMPS (ANY/A):
1. Sam Bradford (similarity: 0.43) - NOT PAID
2. Ryan Tannehill (similarity: 0.68) - PAID
Payment rate: 40%
```
## I. CAREER PATH TREND IDENTIFICATION

### Dataset Overview
- **73 quarterbacks** from 2000-2024 draft classes
- **24 received second contracts** (32.9% success rate)
- **49 did not receive extensions** from drafting team
- Draft position shows minimal impact on contract probability (Top 5: 31.4%, 6-15: 36.8%, 16-32: 31.6%)

### Critical Performance Benchmarks

**Year 3 Performance Gap (The "Contract Year")**
- **Paid QBs Average:** 3,639 yards, 6.68 ANY/A
- **Unpaid QBs Average:** 2,453 yards, 5.31 ANY/A
- **Gap:** 1,186 yards, 1.37 ANY/A difference

**Performance Thresholds for Contract Eligibility (Year 3)**
| Threshold | ANY/A | Total Yards |
|-----------|-------|-------------|
| 25th Percentile (Paid) | 5.78 | 3,570 |
| **Median (Paid)** | **6.63** | **4,030** |
| 75th Percentile (Paid) | 7.46 | 4,359 |
| Median (Unpaid) | 5.30 | 2,451 |

**Growth Trajectory Indicators**
- **Paid QBs:** Average improvement of **+1,016 yards** from Year 1 to Year 3
- **Unpaid QBs:** Average improvement of **+214 yards** from Year 1 to Year 3

---

## II. TRAJECTORY ARCHETYPES FOR COMPARISON ANALYSIS

### Archetype 1: **ELITE EARLY DEVELOPER**
*Characteristic: Explosive Year 2-3 breakthrough, sustained excellence*

**Defining Pattern:**
- Year 1: Decent (4.5-6.0 ANY/A)
- Year 2: Major leap (+2.0 ANY/A improvement)
- Year 3: Elite level (7.5+ ANY/A)

**Historical Examples:**

**Patrick Mahomes (2017, Pick 10) - Immediate Dominance Variant**
- Y0: 300 yards, 6.14 ANY/A (backup, 1 start)
- **Y1: 5,456 yards, 9.00 ANY/A (MVP - highest ANY/A in dataset)**
- Y2: 4,306 yards, 8.46 ANY/A (sustained elite)
- Y3: 5,102 yards, 8.40 ANY/A → CONTRACT ($450M/10yr)

**Joe Burrow (2020, Pick 1) - Consistency After Recovery**
- Y0: 2,861 yards, 5.77 ANY/A (solid rookie, ACL tear Week 11)
- **Y1: 4,767 yards, 7.56 ANY/A (comeback elite season)**
- Y2: 4,757 yards, 6.79 ANY/A (maintained efficiency)
- Y3: 2,403 yards, 5.56 ANY/A → CONTRACT ($275M/5yr)

**Justin Herbert (2020, Pick 6) - High-Floor Elite**
- **Y0: 4,619 yards, 6.89 ANY/A (elite rookie season)**
- Y1: 5,359 yards, 6.99 ANY/A (sustained excellence)
- Y2: 4,912 yards, 6.24 ANY/A (modest regression but still good)
- Y3: 3,371 yards, 6.17 ANY/A → CONTRACT ($262.5M/5yr)

**Lamar Jackson (2018, Pick 32) - Mobile Elite Developer**
- Y0: 1,927 yards, 6.06 ANY/A (mid-season starter, limited sample)
- **Y1: 4,392 yards, 8.27 ANY/A (MVP season - explosive breakout)**
- Y2: 3,803 yards, 6.75 ANY/A (maintained elite tier)
- Y3: 3,678 yards, 5.81 ANY/A (regression but still started)
- Contract: Year 5 (after franchise tag) $260M/5yr

**Deshaun Watson (2017, Pick 12) - Sustained Excellence**
- Y0: 2,005 yards, 7.29 ANY/A (limited games, showed flash)
- Y1: 4,793 yards, 6.95 ANY/A (full season elite)
- Y2: 4,323 yards, 6.70 ANY/A (consistent)
- **Y3: 5,324 yards, 8.29 ANY/A → CONTRACT**


**Key Indicators:**
- ANY/A improvement of 1.5+ points between Year 1-3
- Year 3 production above 4,500 yards
- Consistent efficiency (5.5+ ANY/A) in all seasons
- Clear upward trajectory visible by Year 2

---

### Archetype 2: **STEADY RELIABLE IMPROVER**
*Characteristic: Incremental growth, reliable but not spectacular*

**Defining Pattern:**
- Year 1: Adequate (5.0-5.5 ANY/A)
- Year 2: Modest improvement (+0.5-1.0 ANY/A)
- Year 3: Solid production (5.5-6.5 ANY/A)

**Historical Examples:**

**Ryan Tannehill (2012, Pick 8)**
- Y1: 3,621 yards, 5.36 ANY/A
- Y2: 4,276 yards, 5.11 ANY/A
- Y3: 4,475 yards, 5.95 ANY/A
- Y4: 4,456 yards, 6.02 ANY/A
- Contract: Year 4
- Pattern: Consistent volume, gradual efficiency gains

**Matt Ryan (2008, Pick 3)**
- Y1: 3,702 yards, 7.24 ANY/A
- Y2: 3,089 yards, 5.77 ANY/A
- Y3: 3,975 yards, 6.41 ANY/A
- Y4: 4,414 yards, 7.01 ANY/A
- Pattern: Strong start, dip, recovery to elite level

**Joe Flacco (2008, Pick 18)**
- Y1: 3,291 yards, 5.46 ANY/A
- Y2: 3,822 yards, 6.31 ANY/A
- Y3: 3,850 yards, 6.57 ANY/A
- Y4: 3,831 yards, 5.85 ANY/A
- Pattern: Steady 3,800-yard producer with adequate efficiency

**Derek Carr (2014, Pick 36 - 2nd round)** 
- Y0: 3,565 yards, 4.99 ANY/A
- Y1: 3,987 yards, 5.85 ANY/A (+0.86 improvement)
- Y2: 3,937 yards, 6.54 ANY/A (+0.69 improvement)
- **Y3: 3,890 yards, 6.09 ANY/A → CONTRACT (Year 4)**

**Key Indicators:**
- Consistent playing time across Years 1-3
- Year-over-year improvement (even if modest)
- Minimum 3,500 yards annually
- ANY/A floor of 5.5+ by Year 3
- No major regression seasons

---

### Archetype 3: **LATE BLOOMER**
*Characteristic: Slow/limited start for any reason, dramatic Year 3+ emergence*

**Defining Pattern:**
- Year 1: Limited action or poor efficiency (3.0-5.0 ANY/A)
- Year 2: Modest improvement
- Year 3-4: Major breakthrough (7.0+ ANY/A)

**Historical Examples:**

**Aaron Rodgers (2005, Pick 24) - Gold Standard Late Bloomer**
- Y0: 76 yards, -0.44 ANY/A (backup to Favre, 1 start)
- Y1: 60 yards, 1.62 ANY/A (backup to Favre, minimal action)
- Y2: 259 yards, 7.14 ANY/A (backup to Favre, 2 starts)
- **Y3: 4,434 yards, 6.86 ANY/A (FIRST FULL SEASON - immediate production)**
- **Y4: 4,948 yards, 7.70 ANY/A → CONTRACT**

**Jordan Love (2020, Pick 26) - Modern Parallel**
- Y0: 0 yards, N/A (backup to Rodgers, did not play)
- Y1: 442 yards, 4.54 ANY/A (backup to Rodgers, 3 appearances)
- Y2: 195 yards, 10.28 ANY/A (backup to Rodgers, 2 games, small sample)
- **Y3: 4,418 yards, 6.68 ANY/A (FIRST FULL SEASON - immediate production)**
- **Y4: 4,807 yards, 7.48 ANY/A → CONTRACT ($220M/4yr)**

**Philip Rivers (2004, Pick 4) - Borderline (Year 2 first start)**
- Y0: 30 yards, 6.90 ANY/A (backup to Brees)
- Y1: 120 yards, 2.24 ANY/A (backup to Brees)
- **Y2: 3,610 yards, 6.98 ANY/A (first season as starter)**
- Y3: 3,336 yards, 5.87 ANY/A
- Y4: 4,275 yards, 8.30 ANY/A

**Jimmy Garoppolo (2014, Pick 62 - 2nd round)**
- Y0-Y3: Backup in New England (minimal action)
- Y4: Traded to SF mid-season, immediate production in limited games
- Y5: First full season as starter → strong performance


**Key Indicators:**
- Limited Year 1 opportunity (injury, backup role, or bad situation)
- Dramatic improvement when given consistent starts
- Year 3-4 performance exceeds 6.5 ANY/A
- Team/system change or coaching improvement often coincides

---

### Archetype 4: **EARLY PEAK**
*Characteristic: Strong initial performance, plateau or decline*

**Defining Pattern:**
- Year 1-2: Promising (5.5+ ANY/A)
- Year 3: Plateau or regression
- Year 4+: Decline or inconsistency

**Historical Examples:**

**Blake Bortles (2014, Pick 3)**
- Y1: 3,418 yards, 3.89 ANY/A
- **Y2: 4,855 yards, 6.20 ANY/A**
- Y3: 4,357 yards, 5.31 ANY/A
- Y4: 4,085 yards, 6.30 ANY/A (contract year)
- Y5: 3,133 yards, 5.38 ANY/A
- Contract: Year 4 (failed investment)
- Pattern: Year 2 peak never repeated

**Marcus Mariota (2015, Pick 2)**
- Y1: 3,028 yards, 6.21 ANY/A
- **Y2: 4,009 yards, 7.26 ANY/A**
- Y3: 3,639 yards, 5.59 ANY/A
- Y4: 2,725 yards, 5.97 ANY/A
- Pattern: Year 2 excellence, then decline

**Carson Wentz (2016, Pick 2)**
- Y1: 3,850 yards, 5.72 ANY/A
- **Y2: 3,550 yards, 7.96 ANY/A (MVP candidate before injury)**
- Y3: 3,284 yards, 5.22 ANY/A
- Y4+: Inconsistent performance, multiple teams
- Pattern: Never recovered Year 2 form

**Sam Bradford (2010, Pick 1) - Never Reached Peak Again**
- **Y0: 3,714 yards, 4.87 ANY/A (ROTY)**
- Y1: 2,269 yards, 4.61 ANY/A (regression)
- Y2: 3,953 yards, 5.78 ANY/A (improvement)
- Y3: 1,770 yards, 6.24 ANY/A (injury-shortened)
- Never extended by St. Louis, multiple teams thereafter

**Key Indicators:**
- Best season occurs in Year 2
- Year 3+ shows regression (1.0+ ANY/A drop)
- Volume maintained but efficiency declines
- **Warning sign: Teams often misjudge based on Year 2 peak**

---

### Performance Inflection Points Summary

**Critical Thresholds for Contract Probability:**

| Year | Minimum ANY/A | Target ANY/A | Minimum Yards |
|------|---------------|--------------|---------------|
| Year 1 | 5.0 | 5.5+ | 2,500 |
| Year 2 | 5.5 | 6.0+ | 3,200 |
| **Year 3** | **6.0** | **6.5+** | **3,800** |
| Year 4 (contract) | 6.3 | 6.8+ | 4,000 |

**Growth Requirements:**
- Year 1 to Year 3 improvement: Minimum +0.8 ANY/A, Target +1.5 ANY/A
- No season below 5.0 ANY/A after Year 2
- Year 3 regression from Year 2 by more than 1.0 ANY/A = high risk

---

## III. Trajectory Comparison Case Studies

### Case Study 1: Elite Early Developer with Year 2 Regression Pattern
**Historical Comparable:** Matt Ryan trajectory (2008-2011) - Similarity Score: 0.534
**Current Evaluation Target:** C.J. Stroud (2023 class)

----------------------insert tableau comparison here


| Metric | Matt Ryan Y0-Y1 | C.J. Stroud Y0-Y1 | Variance |
|--------|-----------------|-------------------|----------|
| Y0 ANY/A | 7.24 | 7.48 | +0.24 (Stroud ahead) |
| Y1 ANY/A | 5.77 | 5.44 | -0.33 (Ryan ahead) |
| Y0 Yards | 3,702 | 4,286 | +584 (Stroud ahead) |
| Y1 Yards | 3,089 | 3,960 | +871 (Stroud ahead) |
| Y0→Y1 Growth | -1.47 ANY/A | -2.04 ANY/A | Stroud declined more |

**Matt Ryan's Full Trajectory:**
- Y0: 3,702 yards, 7.24 ANY/A (elite rookie)
- Y1: 3,089 yards, 5.77 ANY/A (-1.47 regression)
- Y2: 3,975 yards, 6.41 ANY/A (+0.64 recovery)
- Y3: 4,414 yards, 7.01 ANY/A (+0.60 continued growth) → Extended

**Analysis Points:**
- Both posted elite rookie efficiency (7.2+ ANY/A), then regressed significantly in Year 1
- Stroud's Y1 decline (-2.04 ANY/A) steeper than Ryan's (-1.47 ANY/A), but from higher baseline
- Ryan's pattern: Recovery in Y2 (+0.64 ANY/A) followed by Y3 elite return (7.01) led to extension
- Critical question: Will Stroud follow Ryan's Y2 recovery trajectory or continue plateau?
- Historical precedent: 3 of 8 QBs (37.5%) with similar elite rookie → Y1 regression pattern recovered to earn extensions
- Stroud needs minimum 6.3+ ANY/A in Year 2 to match Ryan's recovery path
- Volume production advantage (Stroud Y1: 3,960 vs Ryan Y1: 3,089) suggests organizational confidence remains despite efficiency decline

**Contract probability implications:** 
- IF Y2 rebounds to 6.5+ ANY/A: 85% extension probability (Ryan precedent)
- IF Y2 plateaus at 5.5-6.2 ANY/A: 50% extension probability (requires elite Y3)
- IF Y2 declines below 5.5 ANY/A: 20% extension probability (Early Peak risk)

-------------------continue here later

#### Case Study 2: Late Bloomer Pattern Recognition
**Comparable:** Jordan Love trajectory (2020-2023)
**Current Evaluation Targets:** 

| Metric | QB1 | QB2 | Variance |
|--------|-----------------|-------------------|----------|

**Analysis Points:**
- Love demonstrated immediate competence when given full control
- 

---

#### Case Study 3: Steady Improver Baseline
**Comparable:** 
**Current Evaluation Targets:** ???

| Metric | QB1 | QB2 | Variance |
|--------|-----------------|-------------------|----------|

**Analysis Points:**
- Lawrence matched Tannehill's gradual improvement, earned early extension

---

#### Case Study 4: Early Peak Risk Assessment
**Comparable:** Blake Bortles trajectory (2014-2018)
**Current Evaluation Targets:** Justin Fields???

| Metric | QB1 | QB2 | Variance |
|--------|-----------------|-------------------|----------|

**Analysis Points:**
- Bortles' Year 2 spike led to mistaken extension

---

### Section IV: Current Market Analysis (2021-2024)

#### HIGH PROBABILITY COHORT (>75% contract probability)

**Tier 1A: Immediate Extension Candidates**

**C.J. Stroud** (2023, Pick 2) - ??% probability
- Y1: 4,135 yards, 6.30 ANY/A (ROTY)
- Y2: 3,960 yards, 5.44 ANY/A
- Comparable: Justin Herbert trajectory (strong rookie, immediate consistency)
- Risk Factor: Year 2 ANY/A decline (-0.86)
- Projected Contract: Post-Y3 (2026), $50-55M AAV
- Key Metric: Needs Y3 rebound to 6.5+ ANY/A to maximize value

**Jayden Daniels** (2024, Pick 2) - ??% probability (early projection)
- Y1: 4,459 yards, 6.50 ANY/A
- Comparable: Josh Allen Year 1 production with better efficiency
- Archetype: Elite Early Developer (if sustained)
- Risk Factor: Single season sample, injury history
- Projected Contract: Post-Y3 (2027), market rate TBD
- Key Metric: Must maintain 6.0+ ANY/A in Year 2-3

**Bo Nix** (2024, Pick 12) - ??% probability (early projection)
- Y1: 4,205 yards, 6.12 ANY/A (late draft position, older prospect)
- Comparable: Russell Wilson trajectory (later pick, immediate competence)
- Archetype: Steady Improver with high floor
- Risk Factor: Limited upside ceiling, age (24 years old as rookie)
- Projected Contract: Post-Y3 (2027), $35-42M AAV range
- Key Metric: Consistency matters more than peak

---

#### MEDIUM PROBABILITY COHORT (35-75%)

**Tier 2A: Development Curve Incomplete**

**Caleb Williams** (2024, Pick 1) - ??% probability (very early)
- Y1: 4,030 yards, 5.09 ANY/A
- Comparable: Bryce Young Year 1 volume, similar efficiency concerns
- Risk Factors: Sub-5.5 ANY/A as top pick, high INT rate (behind Young Y1)
- Upside: Volume production suggests confidence/opportunity
- Key Metric: Year 2 must show 6.0+ ANY/A to avoid Young's trajectory

**Bryce Young** (2023, Pick 1) - ??% probability
- Y1: 3,138 yards, 3.69 ANY/A (worst among recent top picks)
- Y2: 2,652 yards, 5.11 ANY/A (improvement but still below threshold)
- Comparable: Jared Goff Year 1 (historically bad start)
- Archetype: Requires Late Bloomer transformation
- Risk Factors: Worst Year 1 efficiency in database, size concerns
- Upside Scenario: Year 3 leap to 6.5+ ANY/A (Goff pattern) → 65% probability
- Downside Scenario: Plateaus at 5.5 ANY/A → 15% probability
- Key Metric: Needs 2.0+ ANY/A improvement in Year 3 to remain viable
- Historical Precedent: Only Goff recovered from sub-4.0 ANY/A Year 1

**Justin Fields** (2021, Pick 11) - 00% probability (already traded)
- Y1: 1,937 yards, 5.18 ANY/A
- Y2: 3,143 yards, 6.03 ANY/A
- Y3: 2,855 yards, 5.86 ANY/A
- Y4: 1,395 yards, 5.86 ANY/A (traded mid-season)
- Archetype: Stalled Steady Improver
- Analysis: Never broke through 6.5+ ANY/A ceiling, team moved on
- Comparable: Between Tannehill (succeeded) and Mariota (declined)
- New Team Scenario (PIT): 35% probability of extension with year change


---

**Tier 2B: Limited Opportunity / Development Stalled** these people dont count (traded)

**Mac Jones** (2021, Pick 15) - 00% probability
- Y1: 3,904 yards, 5.96 ANY/A (strong start)
- Y2: 3,213 yards, 4.81 ANY/A (regression)
- Y3: 2,183 yards, 5.02 ANY/A
- Y4: 1,764 yards, 4.97 ANY/A (traded)
- Archetype: Classic Early Peak pattern
- Analysis: Peaked in Year 1, never recovered
- Comparable: Blake Bortles efficiency decline (but worse)
- Current Status: Backup in JAX, extension highly unlikely

**Trey Lance** (2021, Pick 3) - 00% probability
- Y1: 741 yards, 4.80 ANY/A (limited opportunity)
- Y2: 414 yards, 4.35 ANY/A (season-ending injury)
- Y3-Y4: Minimal playing time, traded twice
- Archetype: Failed Late Bloomer (no opportunity to establish baseline)
- Analysis: Talent unclear due to lack of sample size
- Comparable: No historical pattern match (unique bust trajectory)

**Zach Wilson** (2021, Pick 2) - 00% probability
- Y1: 2,539 yards, 3.88 ANY/A
- Y2: 1,800 yards, 4.99 ANY/A (limited)
- Y3: 2,489 yards, 4.30 ANY/A
- Archetype: Below Early Peak threshold (never competent)
- Analysis: Never achieved minimum 5.5 ANY/A benchmark
- Comparable: Worst trajectory in recent top-5 pick history
- Current Status: Backup, no path to extension

---

#### LOW PROBABILITY COHORT (<35%)
----------------------------- these people dont count (traded)

**Drake Maye** (2024, Pick 3) - 28% probability (very early)
- Y1: 2,697 yards, 5.10 ANY/A (mid-season promotion)
- Risk Factors: Limited sample, sub-5.5 ANY/A start
- Upside: Limited Y1 data, significant opportunity in Y2
- Key Metric: Full Year 2 evaluation critical

**Michael Penix** (2024, Pick 8) - 22% probability (very early)
- Y1: 786 yards, 6.29 ANY/A (backup, late-season play)
- Context: Age 24 rookie, backup to veteran
- Archetype: If starts Year 2 could match Jordan Love pattern
- Risk Factor: May not get opportunity until Year 3-4

---


## IV. STRATEGIC APPLICATIONS: Contract Timing Optimization

**Extension Decision Framework:**

**Tier 1: Extend Early (Post-Year 3)**
- Criteria: 6.5+ ANY/A in Year 3, upward trajectory, Top 10 volume
- Examples: Josh Allen, Joe Burrow, Patrick Mahomes
- Risk: Minimal - elite performance established
- Cost Savings: $5-8M AAV vs. waiting for Year 4 market (double check this number in APY%)
- **Current Candidates:** C.J. Stroud (if Y3 rebounds), Jayden Daniels (if sustained)

**Tier 2: Wait-and-See (Through Year 4)**
- Criteria: 5.8-6.3 ANY/A, inconsistent efficiency, questions remain
- Examples: Ryan Tannehill, Derek Carr, Matt Ryan
- Risk: Moderate - potential overpay if Year 4 spike
- Cost Impact: Market rate, no discount
- **Current Candidates:** Anthony Richardson, Bryce Young

**Tier 3: Fifth-Year Option / Tag**
- Criteria: Below 5.8 ANY/A in Year 3, declining trajectory, major concerns (or strong last year spike I think)
- Examples: Blake Bortles, Marcus Mariota, Daniel Jones
- Risk: High - likely misallocated capital
- Strategy: Exercise option, evaluate in contract year
- **Current Candidates:** none of these count right now...

**Tier 4: Move On**
- Criteria: Sub-5.0 ANY/A in Year 3, no improvement trajectory
- Examples: Zach Wilson, Trey Lance, Kyle Boller
- Strategy: Decline option, draft replacement
- **Current Candidates:** none of these count right now...

### Market Inefficiency Identification

**Undervalued Profiles:**

1. **Single Year Regression Overreaction**
   - Historical: Trevor Lawrence Y3 dip (5.99 ANY/A) → still extended
   - Pattern: Single-year regression often rebounds
   - Current Watch: C.J. Stroud Year 2 decline
   - Opportunity: Buy "dip" if underlying metrics strong

2. **Late Bloomers with Limited Sample Size**
   - Historical: Jordan Love (3 years backup → immediate success)
   - Current Watch: Anthony Richardson (injury-limited sample)
   - Inefficiency: Market underweights talent due to opportunity gap
   - Opportunity: Acquire before breakout season

3. **Late-Round Picks with Elite Early Developer Trajectory** (cant really talk about this given we only did first round QBs in this analysis)
   - Historical: Lamar Jackson (Pick 32), Russell Wilson (Pick 75)
   - Current Watch: Bo Nix (Pick 12 - showing immediate competence)
   - Inefficiency: Draft position bias suppresses perceived value
   - Opportunity: Teams hesitant to extend "lower pedigree" QBs early

**Overvalued Profiles:**

1. **High Volume, Low Efficiency Producers**
   - Historical: Jameis Winston (5,400 yards, 6.21 ANY/A → not extended)
   - Pattern: Yards without efficiency = unsustainable
   - Current Watch: Caleb Williams (4,030 yards, 5.09 ANY/A)
   - Risk: Volume masks fundamental limitations

2. **Early Peak QBs Post-Year 2**
   - Historical: Blake Bortles (Y2: 6.20 ANY/A → extended → bust)
   - Warning Signs: Year 2 spike, Year 3 regression
   - Current Watch: Mac Jones peaked Y1, steady decline
   - Risk: Mistaking variance for growth


3. **Top-5 Pick Bias Premium** (idk about this one...)
   - Historical: Sam Bradford, David Carr, Baker Mayfield
   - Pattern: Draft capital creates sunk cost fallacy
   - Current Example: Bryce Young (worst ANY/A, still viewed as franchise QB)
   - Risk: Organizational pressure to validate pick overrides data

---

## V. COMPARATIVE PLAYER EVALUATION MATRIX

### Current Class Trajectory Mapping (2021-2024 Drafts)

| Player | Draft | Y3 ANY/A | Trajectory | Comparable | Contract Probability |
|--------|-------|----------|------------|------------|---------------------|
| **2021 Class** |
| Trevor Lawrence | 1 | 5.99 | Steady Improver | Tannehill | **PAID** ✓ |
| Zach Wilson | 2 | 4.30 | Failed | Worst in DB | 8% |
| Trey Lance | 3 | N/A | No Opportunity | Unique | 12% |
| Justin Fields | 11 | 5.86 | Stalled Improver | Mariota | 42% |
| Mac Jones | 15 | 5.02 | Early Peak | Bortles (worse) | 38% |
| **2022 Class** |
| Kenny Pickett | 20 | 5.50 | Marginal | Bridgewater | 25% |
| **2023 Class** |
| Bryce Young | 1 | 5.11 | Needs Breakthrough | Goff Y1 | 48% |
| C.J. Stroud | 2 | 5.44 | Watch Year 3 | Herbert (concern) | 85% |
| Anthony Richardson | 4 | 4.74 | Incomplete | L. Jackson (limited) | 55% |
| **2024 Class** |
| Caleb Williams | 1 | 5.09 | Early Warning | Young Y1 | 45% |
| Jayden Daniels | 2 | 6.50 | Elite Start | Allen/Burrow | 78% |
| Drake Maye | 3 | 5.10 | Insufficient Data | TBD | 28% |
| Michael Penix | 8 | 6.29 | Backup | Love pattern? | 22% |
| Bo Nix | 12 | 6.12 | Strong Floor | Wilson/Tannehill | 72% |

---

## VI. SUMMARY: KEY INSIGHTS FROM ANALYSIS

### Critical Findings for Trajectory Comparison Section:

1. **Year 3 is the Determinant Season**
   - 6.63 ANY/A median for paid QBs vs. 5.30 for unpaid
   - 1.37 ANY/A gap is the strongest predictor of contract outcome
   - Volume threshold: 3,800+ yards minimum for extension consideration

2. **Growth Trajectory Matters More Than Draft Position**
   - Top 5 picks: 31.4% contract rate
   - Picks 6-15: 36.8% contract rate
   - Late Round (16-32): 31.6% contract rate
   - **Conclusion:** Performance curve trumps first-round draft capital

3. **Four Distinct Career Archetypes with Predictive Power**
   - Elite Early Developer: Highest success rate (90%+), explosive Year 2-3
   - Steady Improver: Moderate success (70%), incremental growth required
   - Late Bloomer: Variable (50-75%), dependent on opportunity timing
   - Early Peak: Highest bust rate (60% failure), Year 2 spike misleading

4. **Current Market Stratification (2021-2024 Classes)**
   - High Confidence (>70%): C.J. Stroud, Jayden Daniels, Bo Nix
   - Development Watch (30-70%): Anthony Richardson, Bryce Young, Justin Fields, Caleb Williams
   - Low Probability (<30%): Zach Wilson, Trey Lance, Kenny Pickett, Mac Jones

5. **Market Inefficiencies to Exploit**
   - Undervalued: Late-round picks with immediate competence (Bo Nix model)
   - Overvalued: Early Peak QBs post-Year 2 (Bortles/Mariota trap)
   - Hidden Value: Limited-sample Late Bloomers (Richardson/Love model)

---