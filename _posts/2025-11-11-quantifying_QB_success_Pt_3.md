---
layout: post
title: "Quantifying QB Success: Archetypal Trajectories and Current Pending Decisions (Part 3)"
date: 2025-11-11
categories: [Analytics, Quarterbacks, Tableau]
---

## Opening: The Daniel Jones Problem
In March 2023, the New York Giants extended Daniel Jones with a 4-year, $160M contract ($40M AAV). The decision sparked immediate debate because his track record painted an ambiguous picture. Through his first four seasons, Jones had accumulated respectable volume: 14,582 passing yards, 4th highest among his 2019 draft class. But his efficiency told a different story: 5.83 career ANY/A, ranking in the bottom third of starting quarterbacks. His Year 4 performance showed 3,205 yards with 6.14 ANY/A—modest improvement, but hardly elite. Both were still well below our 4,200 era-adjusted yards and 6.5 ANY/A.

The Giants bet on the trajectory, leaning on the last year like we have observed in the temporal bias evaluation. Within one year, that contract became one of the league's most criticized decisions as Jones regressed to 5.01 ANY/A in Year 5. In less than 2 years (Nov 2024), he was benched and then cut just four days later.

This case study exemplifies much of the noise in quarterback evaluation: teams systematically overweight recent performance when they aren't in an obvious signing situation, and in doing so they underweight the benchmarks we've observed which actually predict long-term success. Articles 1 and 2 quantified this bias—Year 2 performance receives 59.8% weight in Year 4 decisions despite representing only 25% of available data.  

Indeed, the public discussion around signing a team's franchise quarterback often prioritizes volume production (total yards) even when we've seen that efficiency metrics (ANY/A) are just as important. The Daniel Jones extension is one manifestation: a quarterback with decent volume but marginal efficiency, evaluated during a contract year with recency bias amplifying one improved season. Our framework would have flagged this risk.

The purpose of this article is to first evaluate all of our first round quarterbacks since the year 2000 to identify archetypal career paths and similar trajectory comparables using temporally-weighted similarity matching, and then use our threshold evaluation framework built from articles 1 and 2 to provide analysis and recommendations moving forward.

### Building on Articles 1 & 2: The Foundation

Articles 1 and 2 established the analytical infrastructure for quarterback contract prediction:

**From Article 1:**
- Contract renewal as the objective success measure, removing subjective evaluation bias
- Era-adjustment methodology eliminating cross-temporal bias (+6.84% offensive yards inflation, +17% TD inflation from 2000-2024)
- Identification of Total Yards (era-adjusted) and ANY/A (era-adjusted) as primary predictive metrics going forward

**From Article 2:**
- Non-linear temporal decay patterns with extreme recency bias across all decision windows
- Temporal weighting quantification: Year 3 performance receives **59.8% weight** in Year 4 contract decisions versus 25% equal-weight baseline
- Performance threshold identification: ~4,200 era-adjusted yards and ~6.5 ANY/A as critical inflection points

### Integrating Trajectory Data with Probability Surfaces

The probability surfaces from Article 2 represent the real-time comparable landscape teams navigate when evaluating quarterbacks. Each point on the heat map shows: given X years of experience and Y level of performance, what percentage of historical quarterbacks received contract extensions?

By overlaying individual quarterback career trajectories onto these probability surfaces, we can track how each QB's path moves through the probability space, revealing:

- **Current position**: Where does performance place them today?
- **Momentum direction**: Are they trending toward or away from high-probability zones?
- **Historical precedent**: Which past quarterbacks followed similar paths?
- **Contract timing**: When did comparable players receive extensions?

### Technical Implementation

**How Trajectories Work:**
We plot each quarterback's performance year-by-year. Josh Allen's path illustrates the concept:
```
Josh Allen (2018-2021):
  Year 0: 2,749 yards, 4.42 ANY/A
  Year 1: 3,648 yards, 5.77 ANY/A
  Year 2: 5,019 yards, 7.88 ANY/A
  Year 3: 5,212 yards, 6.42 ANY/A  leads to CONTRACT SIGNED
```

Each season becomes a point on the heat map. The line connecting these points shows how Allen moved through the probability landscape—from low-probability rookie numbers through his breakout Year 2 and into the high-probability zone where he received his extension.

## Mapping Career Paths

Articles 1 and 2 established what performance levels predict contracts and when those performances matter most. Now we can see these patterns in action by overlaying actual quarterback careers onto the probability surfaces.

Each line in the visualizations below represents one quarterback's journey from draft day through Year 5. Some trajectories climb steadily into high-probability zones. Others plateau in the middle. Many are dragged down into the bottom zones. Together, they reveal the archetypal career paths that lead to extensions—or early exits. On this visual, you can select any quarterback trajectory you want to look at. Of note, quarterbacks who were signed but then traded afterwards (think Jared Goff, Carson Wentz etc...) display as unsigned due to the current signing logic implementation.

### 6 year Yards overlay

<div class='tableauPlaceholder' id='viz1762873306032' style='position: relative'>
  <noscript>
    <a href='#'>
      <img alt='6Y Double Yds' src='https://public.tableau.com/static/images/6Y/6YearYardsoverlay/6YDoubleYds/1_rss.png' style='border: none' />
    </a>
  </noscript>
  <object class='tableauViz' style='display:none;'>
    <param name='host_url' value='https%3A%2F%2Fpublic.tableau.com%2F' /> 
    <param name='embed_code_version' value='3' /> 
    <param name='site_root' value='' />
    <param name='name' value='6YearYardsoverlay/6YDoubleYds' />
    <param name='tabs' value='no' />
    <param name='toolbar' value='yes' />
    <param name='static_image' value='https://public.tableau.com/static/images/6Y/6YearYardsoverlay/6YDoubleYds/1.png' /> 
    <param name='animate_transition' value='yes' />
    <param name='display_static_image' value='yes' />
    <param name='display_spinner' value='yes' />
    <param name='display_overlay' value='yes' />
    <param name='display_count' value='yes' />
    <param name='language' value='en-US' />
  </object>
</div>
<script type='text/javascript'>
  var divElement = document.getElementById('viz1762873306032');
  var vizElement = divElement.getElementsByTagName('object')[0];
  if (divElement.offsetWidth > 800) { 
    vizElement.style.width='1100px';
    vizElement.style.height='877px';
  } else if (divElement.offsetWidth > 500) { 
    vizElement.style.width='1100px';
    vizElement.style.height='877px';
  } else { 
    vizElement.style.width='100%';
    vizElement.style.height='827px';
  }
  var scriptElement = document.createElement('script');
  scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
  vizElement.parentNode.insertBefore(scriptElement, vizElement);
</script>

For the Yards chart, we can clearly observe a trend for teams to begin to "settle for medioctrity" as the years drag on, and general managers are forced to reckon with the riskiness of drafting another quarterback.

### 6 year ANY/A overlay

<div class='tableauPlaceholder' id='viz1762873388924' style='position: relative'>
  <noscript>
    <a href='#'>
      <img alt='6Y Double ANY' src='https://public.tableau.com/static/images/6Y/6YearANYAoverlay/6YDoubleANY/1_rss.png' style='border: none' />
    </a>
  </noscript>
  <object class='tableauViz' style='display:none;'>
    <param name='host_url' value='https%3A%2F%2Fpublic.tableau.com%2F' /> 
    <param name='embed_code_version' value='3' /> 
    <param name='site_root' value='' />
    <param name='name' value='6YearANYAoverlay/6YDoubleANY' />
    <param name='tabs' value='no' />
    <param name='toolbar' value='yes' />
    <param name='static_image' value='https://public.tableau.com/static/images/6Y/6YearANYAoverlay/6YDoubleANY/1.png' /> 
    <param name='animate_transition' value='yes' />
    <param name='display_static_image' value='yes' />
    <param name='display_spinner' value='yes' />
    <param name='display_overlay' value='yes' />
    <param name='display_count' value='yes' />
    <param name='language' value='en-US' />
  </object>
</div>
<script type='text/javascript'>
  var divElement = document.getElementById('viz1762873388924');
  var vizElement = divElement.getElementsByTagName('object')[0];
  if (divElement.offsetWidth > 800) { 
    vizElement.style.width='1100px';
    vizElement.style.height='877px';
  } else if (divElement.offsetWidth > 500) { 
    vizElement.style.width='1100px';
    vizElement.style.height='877px';
  } else { 
    vizElement.style.width='100%';
    vizElement.style.height='827px';
  }
  var scriptElement = document.createElement('script');
  scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
  vizElement.parentNode.insertBefore(scriptElement, vizElement);
</script>

For the ANY/A chart, we do not observe a similiar "settling" trend. General managers appear to treat the observed ~6.5 threshold with more consistency.

## II. How We Generate Comparisons

### Similarity Methodology: Temporally-Weighted Distance Calculation

The comparison tool implements trajectory-based similarity matching using weighted Euclidean distance across career stages. This approach differs from simple "nearest stats" matching by incorporating **both** performance levels **and** temporal career progression.

**Core Algorithm:**
For each target QB, we:
1. Extract their year-by-year performance trajectory (Years 0 through decision year)
2. Calculate weighted distance to every historical QB's trajectory
3. Apply temporal weights from Article 2 (ex: Year 2 weighted 69.9% for Year 3 decisions)
4. Rank by similarity score (lower distance = more similar)
5. Return top 10 comparables with contract outcomes

We generate comparisons for both predictive metrics independently. That creates both **Volume-Based Comps (Total Yards) and Efficiency-Based Comps (ANY/A).

## I. CAREER PATH TREND IDENTIFICATION

------------------------------double check this--------------------
### Dataset Overview
- **47 quarterbacks** from 2000-2020 draft classes (eligible for second contracts)
- **24 received second contracts** (51% success rate)
- **23 did not receive extensions** from drafting team
- Draft position shows minimal impact on contract probability (breakdown per your Article 2 data)

### Critical Performance Benchmarks

**Year 3 Performance Gap (The "Contract Year")**
- **Paid QBs Average:** 3,639 yards, 6.68 ANY/A
- **Unpaid QBs Average:** 2,453 yards, 5.31 ANY/A
- **Gap:** 1,186 yards, 1.37 ANY/A difference

**Growth Trajectory Indicators**
- **Paid QBs:** Average improvement of **+1,016 yards** from Year 1 to Year 3
- **Unpaid QBs:** Average improvement of **+214 yards** from Year 1 to Year 3

**ANY/A (Adjusted Net Yards per Attempt) Delta**
- **Paid QBs:** Average improvement of **+0.73** from Year 1 to Year 3
- **Unpaid QBs:** Average improvement of **+0.42** from Year 1 to Year 3

## II. TRAJECTORY ARCHETYPES FOR COMPARISON ANALYSIS

### Archetype 1: **ELITE EARLY DEVELOPER**
*Characteristic: Explosive Year 2-3 breakthrough, sustained excellence*

**Defining Pattern:**
- Year 1: Decent (4.5-6.0 ANY/A)
- Year 2: Major leap (+2.0 ANY/A improvement)
- Year 3: Elite level (7.5+ ANY/A)

**Historical Examples:**

**Joe Burrow (2020, Pick 1)**
- Y0: 2,861 yards, 5.77 ANY/A (solid rookie, ACL tear Week 11)
- **Y1: 4,767 yards, 7.56 ANY/A (comeback elite season)**
- Y2: 4,757 yards, 6.79 ANY/A (maintained half of efficiency gains)
- Y3: 2,403 yards, 5.56 ANY/A leads to CONTRACT ($275M/5yr)

**Lamar Jackson (2018, Pick 32)**
- Y0: 1,927 yards, 6.06 ANY/A (mid-season starter, limited sample)
- **Y1: 4,392 yards, 8.27 ANY/A (MVP season - explosive breakout)**
- Y2: 3,803 yards, 6.75 ANY/A (maintained elite tier)
- Y3: 3,678 yards, 5.81 ANY/A (regression but still started)
- Y4: 4,511 yards, 7.36 ANY/A leads to Contract after franchise tag ($260M/5yr)

**Deshaun Watson (2017, Pick 12)**
- Y0: 2,005 yards, 7.29 ANY/A (limited games, showed flash)
- **Y1: 4,793 yards, 6.95 ANY/A (full season elite)**
- Y2: 4,323 yards, 6.70 ANY/A (minor regression, but consistent)
- Y3: 5,324 yards, 8.29 ANY/A leads to CONTRACT

**Justin Herbert (2020, Pick 6)**
- Y0: 4,619 yards, 6.89 ANY/A (elite rookie season)
- **Y1: 5,359 yards, 6.99 ANY/A (even better second year)**
- Y2: 4,912 yards, 6.24 ANY/A (modest regression but still good)
- Y3: 3,371 yards, 6.17 ANY/A leads to CONTRACT ($262.5M/5yr)

**Key Indicators:**
- Year 2 or 3 production above 4,500 yards
- Consistent efficiency (5.5+ ANY/A) in all seasons
- Often a big jump in ANY/A of 1.5+ points between Year 1-3
- Clear upward trajectory visible by Year 2

The obligatory Mahomes variant:

**Patrick Mahomes (2017, Pick 10) - Immediate Dominance Variant**
- Y0: 300 yards, 6.14 ANY/A (backup, 1 start)
- **Y1: 5,456 yards, 9.00 ANY/A (MVP season)**
- Y2: 4,306 yards, 8.46 ANY/A (sustained elite)
- Y3: 5,102 yards, 8.40 ANY/A leads to CONTRACT ($450M/10yr)

---

### Archetype 2: **STEADY RELIABLE IMPROVER**
The key characteristic of this group is incremental growth, either in efficiency, yards, or both, that is reliable but not spectacular.

**Historical Examples:**

**Ryan Tannehill (2012, Pick 8)**
- Y1: 3,621 yards, 5.36 ANY/A
- Y2: 4,276 yards, 5.11 ANY/A
- Y3: 4,475 yards, 5.95 ANY/A
- Y4: 4,456 yards, 6.02 ANY/A leads to Contract

**Matt Ryan (2008, Pick 3)**
- Y1: 3,702 yards, 7.24 ANY/A
- Y2: 3,089 yards, 5.77 ANY/A
- Y3: 3,975 yards, 6.41 ANY/A
- Y4: 4,414 yards, 7.01 ANY/A leads to Contract

**Joe Flacco (2008, Pick 18)**
- Y1: 3,291 yards, 5.46 ANY/A
- Y2: 3,822 yards, 6.31 ANY/A
- Y3: 3,850 yards, 6.57 ANY/A
- Y4: 3,831 yards, 5.85 ANY/A leads to Contract

**Key Indicators:**
- Consistent playing time across Years 1-4
- Year-over-year improvement (even if modest)
- Average minimum 3,500 yards annually
- ANY/A floor of 5.75+ by Year 3
- No major regression seasons

**Defining Efficiency Pattern:**
- Year 1: Adequate (5.0-5.5 ANY/A)
- Year 2: Modest improvement (+0.5-1.0 ANY/A)
- Year 3-4: Solid production (5.75+ ANY/A)

---

### Archetype 3: **LATE BLOOMER**
The key characteristic of this group is a slow or limited start for any reason, with a dramatic Year 3+ emergence. This group is obviously dominated by players like Aaron rodgers based on our way of labeling years based on drafting, and not based on being the year long starter.

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
- **Y4: 4,948 yards, 7.70 ANY/A leads to CONTRACT**

**Jordan Love (2020, Pick 26) - Modern Parallel**
- Y0: 0 yards, N/A (backup to Rodgers, did not play)
- Y1: 442 yards, 4.54 ANY/A (backup to Rodgers, 3 appearances)
- Y2: 195 yards, 10.28 ANY/A (backup to Rodgers, 2 games, small sample)
- **Y3: 4,418 yards, 6.68 ANY/A (FIRST FULL SEASON - immediate production)**
- **Y4: 4,807 yards, 7.48 ANY/A leads to CONTRACT ($220M/4yr)**

**Philip Rivers (2004, Pick 4) - Borderline (Year 2 first start)**
- Y0: 30 yards, 6.90 ANY/A (backup to Brees)
- Y1: 120 yards, 2.24 ANY/A (backup to Brees)
- **Y2: 3,610 yards, 6.98 ANY/A (first season as starter)**
- Y3: 3,336 yards, 5.87 ANY/A (regression in efficiency year)
- Y4: 4,275 yards, 8.30 ANY/A

**Key Indicators:**
- Limited Year 1-3 opportunity (injury, backup role, or bad situation)
- Dramatic improvement when given consistent starts
- Year 3-4 performance exceeds 7.5 ANY/A

---

### Archetype 4: **EARLY PEAK**
The key characteristic of this group is a strong initial performance, combined with a plateau or a decline.

**Historical Examples:**

**Mac Jones (2021, Pick 15)**
**- Y1: 3,962 yards, 6.26 ANY/A**
- Y2: 3,116 yards, 5.38 ANY/A
- Y3: 2,222 yards, 4.50 ANY/A
- Y3: 1,764 yards, 4.97 ANY/A

**Blake Bortles (2014, Pick 3)**
- Y1: 3,418 yards, 3.89 ANY/A
- **Y2: 4,855 yards, 6.20 ANY/A (major jump in efficiency)**
- Y3: 4,357 yards, 5.31 ANY/A (regression)
- Y4: 4,085 yards, 6.30 ANY/A (contract year, efficiency improvement)
- Y5: 3,133 yards, 5.38 ANY/A

**Marcus Mariota (2015, Pick 2)**
- Y1: 3,028 yards, 6.21 ANY/A
- **Y2: 4,009 yards, 7.26 ANY/A**
- Y3: 3,639 yards, 5.59 ANY/A
- Y4: 2,725 yards, 5.97 ANY/A

**Carson Wentz (2016, Pick 2)**
- Y1: 3,850 yards, 5.72 ANY/A
- **Y2: 3,550 yards, 7.96 ANY/A (MVP candidate before injury)**
- Y3: 3,284 yards, 5.22 ANY/A

**Sam Bradford (2010, Pick 1) - Never Reached Peak Again**
- **Y0: 3,714 yards, 4.87 ANY/A (ROTY)**
- Y1: 2,269 yards, 4.61 ANY/A (regression)
- Y2: 3,953 yards, 5.78 ANY/A (strong improvement)
- Y3: 1,770 yards, 6.24 ANY/A

**Key Indicators:**
- Best season occurs in Year 1 or 2
- Year 3+ shows effiency and/or yards regression (1.0+ ANY/A drop)
- **As we noted previously teams often misjudge based on recency bias peak, causing them to abandon players where there is a chance of salvaging them (think Sam Darnold or Geno Smith)**

---

### Performance Inflection Points Summary

**Critical Thresholds for Contract Probability:**

| Year | Minimum ANY/A | Target ANY/A | Minimum Yards | Target Yards |
|------|---------------|--------------|---------------|--------------|
| Year 1 | 5.0 | 5.5+ | 1,900 | 2,900 |
| Year 2 | 5.5 | 6.0+ | 3,000 | 3,900 |
| **Year 3** | **6.0** | **6.5+** | **3,600** | **4,000** |
| Year 4 (contract) | 6.3 | 6.8+ | 3,300 | 3,800 |

**Growth Requirements:**
- **ANY/A:** Year 1 to Year 3 improvement: Minimum +0.8, Target +1.5
- **Yards:** Year 1 to Year 3 improvement: Minimum +300 yards, Target +900 yards
- No season below 5.0 ANY/A after Year 2
- No Year 3 regression from Year 2 by more than 1.0 ANY/A

---

## III. Trajectory Comparison Case Studies

### Case Study 1: Archetype 1 (Joe Burrow to CJ stroud?) (mac jones to CJ?)

Here is the comparison laid out on our trajectory charts for both volume and efficiency:

<div class='tableauPlaceholder' id='viz1762874124521' style='position: relative'>
  <noscript>
    <a href='#'>
      <img alt='4Y Double ANYA' src='https://public.tableau.com/static/images/Ye/Year4contractdecisionsANYAoverlay/4YDoubleANYA/1_rss.png' style='border: none' />
    </a>
  </noscript>
  <object class='tableauViz' style='display:none;'>
    <param name='host_url' value='https%3A%2F%2Fpublic.tableau.com%2F' /> 
    <param name='embed_code_version' value='3' /> 
    <param name='site_root' value='' />
    <param name='name' value='Year4contractdecisionsANYAoverlay/4YDoubleANYA' />
    <param name='tabs' value='no' />
    <param name='toolbar' value='yes' />
    <param name='static_image' value='https://public.tableau.com/static/images/Ye/Year4contractdecisionsANYAoverlay/4YDoubleANYA/1.png' /> 
    <param name='animate_transition' value='yes' />
    <param name='display_static_image' value='yes' />
    <param name='display_spinner' value='yes' />
    <param name='display_overlay' value='yes' />
    <param name='display_count' value='yes' />
    <param name='language' value='en-US' />
  </object>
</div>
<script type='text/javascript'>
  var divElement = document.getElementById('viz1762874124521');
  var vizElement = divElement.getElementsByTagName('object')[0];
  if (divElement.offsetWidth > 800) { 
    vizElement.style.width='1100px';
    vizElement.style.height='877px';
  } else if (divElement.offsetWidth > 500) { 
    vizElement.style.width='1100px';
    vizElement.style.height='877px';
  } else { 
    vizElement.style.width='100%';
    vizElement.style.height='827px';
  }
  var scriptElement = document.createElement('script');
  scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
  vizElement.parentNode.insertBefore(scriptElement, vizElement);
</script>

#### Comparison for Volume

<div class='tableauPlaceholder' id='viz1762874210745' style='position: relative'>
  <noscript>
    <a href='#'>
      <img alt='4Y Double Yards' src='https://public.tableau.com/static/images/Ye/Year4contractdecisionsyardsoverlay/4YDoubleYards/1_rss.png' style='border: none' />
    </a>
  </noscript>
  <object class='tableauViz' style='display:none;'>
    <param name='host_url' value='https%3A%2F%2Fpublic.tableau.com%2F' /> 
    <param name='embed_code_version' value='3' /> 
    <param name='site_root' value='' />
    <param name='name' value='Year4contractdecisionsyardsoverlay/4YDoubleYards' />
    <param name='tabs' value='no' />
    <param name='toolbar' value='yes' />
    <param name='static_image' value='https://public.tableau.com/static/images/Ye/Year4contractdecisionsyardsoverlay/4YDoubleYards/1.png' /> 
    <param name='animate_transition' value='yes' />
    <param name='display_static_image' value='yes' />
    <param name='display_spinner' value='yes' />
    <param name='display_overlay' value='yes' />
    <param name='display_count' value='yes' />
    <param name='language' value='en-US' />
  </object>
</div>
<script type='text/javascript'>
  var divElement = document.getElementById('viz1762874210745');
  var vizElement = divElement.getElementsByTagName('object')[0];
  if (divElement.offsetWidth > 800) { 
    vizElement.style.width='1100px';
    vizElement.style.height='877px';
  } else if (divElement.offsetWidth > 500) { 
    vizElement.style.width='1100px';
    vizElement.style.height='877px';
  } else { 
    vizElement.style.width='100%';
    vizElement.style.height='827px';
  }
  var scriptElement = document.createElement('script');
  scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
  vizElement.parentNode.insertBefore(scriptElement, vizElement);
</script>

-----------------------------I don't love these comps. Let's rework this section


#### Case Study 2: Archetype 2
**Comparable:** Jordan Love trajectory (2020-2023)
**Current Evaluation Targets:** 

| Metric | QB1 | QB2 | Variance |
|--------|-----------------|-------------------|----------|

**Analysis Points:**
- 

---

#### Case Study 3: Archetype 3
**Comparable:** 
**Current Evaluation Targets:** ???

| Metric | QB1 | QB2 | Variance |
|--------|-----------------|-------------------|----------|

**Analysis Points:**

---

#### Case Study 4: Archetype 4
**Comparable:** Blake Bortles trajectory (2014-2018)
**Current Evaluation Targets:** Justin Fields???

| Metric | QB1 | QB2 | Variance |
|--------|-----------------|-------------------|----------|

**Analysis Points:**
- Bortles' Year 2 spike led to mistaken extension

---

## 2025 QB Contract Probability Analysis
### Based on Historical Comparable Trajectories

---

### DETAILED QB PROFILES

---

#### **JAYDEN DANIELS** (2024, Pick 2)
**Contract Probability Based on Pre-2025 Season:** 40% Production | 30% Efficiency  
**Contract Probability Based on 2025 Per Game Average Extrapolated Out:** 50% Production | 60% Efficiency

**Career Performance:**

| Year | Yards | Yards Δ | ANY/A | ANY/A Δ |
|------|-------|---------|-------|---------|
| Y1 (2024) | 4,459 | - | 6.50 | - |
| Y2 (2025) | 4,097* | -362 | 6.36 | -0.14 |

*Extrapolated from 6 games

**Top Paid Comparables:** Cam Newton, Kyler Murray, Justin Herbert
**Top Unpaid Comparables:** Jameis Winston, Robert Griffin III, Baker Mayfield
**Analysis:** Dont get injured, since that elite volume production in year 1 locks in paid comparables right now. Unfortunately, he is injured so we'll see how this year actually ends in volume production, and how that adjusts the comparables. He'll be hoping it is much more of a Joe Burrow situation than a RG3 one.
**Key Metric:** Sustain 6.3+ ANY/A through Year 3 to lock in elite probability (currently tracking at 6.36 through 6 games). 
---


#### **DRAKE MAYE** (2024, Pick 3)
**Contract Probability Based on Pre-2025 Season:** 40% Production | 10% Efficiency  
**Contract Probability Based on 2025 Per Game Average Extrapolated Out:** 40% Production | 60% Efficiency

**Career Performance:**

| Year | Yards | Yards Δ | ANY/A | ANY/A Δ |
|------|-------|---------|-------|---------|
| Y1 (2024) | 2,697 | - | 5.10 | - |
| Y2 (2025) | 4,825* | +2,128 | 7.97 | +2.87 |

*Extrapolated from 10 games

**Top Paid Comparables:** Ben Roethlisberger, Joe Burrow, Josh Allen
**Top Unpaid Comparables:** Brandon Weeden, Patrick Ramsey, Mitchell Trubisky

**Analysis:** The +2.87 ANY/A leap from Year 1 to Year 2 is exactly what teams want to see—comparable to Josh Allen and Joe Burrow's explosive improvements. Limited Year 1 sample (mid-season start) actually helps him here, as the 2,697 yards don't drag down his production comps. If he finishes 2025 near the 4,825-yard projection, he vaults into elite Big Ben/Allen territory. The real risk is that 10-game sample proves to be a hot streak rather than a sustainable baseline.
**Key Metric:** Limited Year 1 sample (mid-season start) creates uncertainty; needs full 16+ game Year 2 sample to validate that elite 7.97 ANY/A is sustainable

---

#### **C.J. STROUD** (2023, Pick 2)  
**Contract Probability Based on Pre-2025 Season:** 40% Production | 10% Efficiency  
**Contract Probability Based on 2025 Per Game Average Extrapolated Out:** 60% Production | 50% Efficiency

**Career Performance:**

| Year | Yards | Yards Δ | ANY/A | ANY/A Δ |
|------|-------|---------|-------|---------|
| Y1 (2023) | 4,286 | - | 7.48 | - |
| Y2 (2024) | 3,960 | -326 | 5.44 | -2.04 |
| Y3 (2025) | 4,131* | +171 | 5.98 | +0.54 |

*Extrapolated from 8 games

**Top Paid Comparables:** Trevor Lawrence, Joe Flacco, Matt Ryan
**Top Unpaid Comparables:** Robert Griffin III, Jameis Winston, Mac Jones

**Analysis:** The classic "regression to the mean" case study. Elite 7.48 ANY/A rookie year looked like Patrick Mahomes; 5.44 ANY/A Year 2 looked like Mitchell Trubisky. Current 5.98 rebound suggests he's stabilizing around league-average efficiency rather than elite.

**Key Metric:** Efficiency regression from 7.48 → 5.44 → 5.98 raises sustainability concerns. Must hit 6.5+ ANY/A again in Year 3 to push efficiency into upper range

---

#### **BO NIX** (2024, Pick 12)  
**Contract Probability Based on Pre-2025 Season:** 20% Production | 40% Efficiency  
**Contract Probability Based on 2025 Per Game Average Extrapolated Out:** 40% Production | 20% Efficiency

**Career Performance:**

| Year | Yards | Yards Δ | ANY/A | ANY/A Δ |
|------|-------|---------|-------|---------|
| Y1 (2024) | 4,205 | - | 6.12 | - |
| Y2 (2025) | 3,963* | -242 | 5.74 | -0.38 |

*Extrapolated from 10 games

**Top Paid Comparables:** Trevor Lawrence, Kyler Murray, Cam Newton
**Top Unpaid Comparables:** Anthony Richardson, Jay Cutler, Marcus Mariota

**Analysis:**  The 6.12 → 5.74 ANY/A decline erodes his biggest advantage. Nix's 3,963-yard projection is adequate, pushing production to 40%, but the efficiency slide toward 5.74 is a red flag. Mariota and Wentz comps show what happens when efficiency fades.

**Key Metric:** Efficiency decline (6.12 → 5.74) threatens his primary advantage. Must rebound to 6.2+ ANY/A in Year 2 to maintain 40% efficiency probability; production already improved to 40%

---

#### **CALEB WILLIAMS** (2024, Pick 1)  
**Contract Probability Based on Pre-2025 Season:** 30% Production | 10% Efficiency  
**Contract Probability Based on 2025 Per Game Average Extrapolated Out:** 50% Production | 60% Efficiency

**Career Performance:**

| Year | Yards | Yards Δ | ANY/A | ANY/A Δ |
|------|-------|---------|-------|---------|
| Y1 (2024) | 4,030 | - | 5.09 | - |
| Y2 (2025) | 4,499* | +469 | 6.92 | +1.83 |

*Extrapolated from 9 games

**Top Paid Comparables:** Trevor Lawrence, Ryan Tannehill, Matt Ryan
**Top Unpaid Comparables:** Baker Mayfield, Patrick Ramsey, Robert Griffin III, 

**Analysis:** The +1.83 ANY/A leap (5.09 → 6.92) places Williams in elite company—comparable to Burrow's +1.79 post-injury comeback, Lamar's +2.21 MVP breakout, and Watson's sustained excellence after his rookie flash. 

However, the cautionary tales loom large. Blake Bortles posted identical 6.20 ANY/A in Year 2 after a 3.89 rookie season, then regressed to 5.31 in Year 3. The Jags extended him anyway, and regretted it immediately. Marcus Mariota's 7.26 ANY/A Year 2 (even better than Williams' 6.92) collapsed to 5.59 the next season, killing his contract hopes.

**Key Metric:** Massive efficiency leap (+1.83 ANY/A) in Year 2 is promising, but must sustain 6.5+ through full season and post production numbers around 4,000 total yards.

---

#### **MICHAEL PENIX JR.** (2024, Pick 8)  
**Contract Probability Based on Pre-2025 Season:** 10% Production | 30% Efficiency  
**Contract Probability Based on 2025 Per Game Average Extrapolated Out:** 20% Production | 50% Efficiency

**Career Performance:**

| Year | Yards | Yards Δ | ANY/A | ANY/A Δ |
|------|-------|---------|-------|---------|
| Y1 (2024) | 786 | - | 6.29 | - |
| Y2 (2025) | 3,970* | +3,184 | 6.41 | +0.12 |

*Extrapolated from 8 games

**Top Paid Comparables:** Jay Cutler, Lamar Jackson, Michael Vick
**Top Unpaid Comparables:** Rex Grossman, Jake Locker, Jameis Winston

**Analysis:** Schrödinger's QB—simultaneously shows elite mobility comps (Newton/Jackson/Vick) and complete statistical void. The 786 yards means production probability is purely speculative at 10-40%. Age 24 rookie behind veteran Kirk Cousins creates Jordan Love parallels, but Love had more Year 1 reps. The 3,970-yard projection from 8 games suggests legitimate starter upside, and 6.41 ANY/A efficiency is solid.

**Key Metric:** Sample size is everything— no real production track record in year 1. Needs 12+ starts in Year 2 to establish legitimate baseline, but efficiency is solid at 6.41
---

#### **BRYCE YOUNG** (2023, Pick 1)  
**Contract Probability Based on Pre-2025 Season:** 20% Production | 10% Efficiency 
**Contract Probability Based on 2025 Per Game Average Extrapolated Out:** 10% Production | 10% Efficiency

**Career Performance:**

| Year | Yards | Yards Δ | ANY/A | ANY/A Δ |
|------|-------|---------|-------|---------|
| Y1 (2023) | 3,138 | - | 3.69 | - |
| Y2 (2024) | 2,652 | -486 | 5.11 | +1.42 |
| Y3 (2025) | 3,018* | +366 | 4.61 | -0.50 |

*Extrapolated from 9 games

**Top Paid Comparables:** Ben Roethlisberger, Mark Sanchez, Matt Ryan
**Top Unpaid Comparables:** Justin Fields, Mac Jones, David Carr

**Analysis:** The worst-case scenario is unfolding in real-time. Year 3 regression from 5.11 to 4.61 ANY/A is historically catastrophic. The database shows <5% of QBs below 4.7 ANY/A in Year 3 receive extensions. The 3,018-yard projection shows even volume is declining.

**Key Metric:** Efficiency regression (5.11 → 4.61) in Year 3 is catastrophic. At 4.61 ANY/A, historically <5% of comps get paid. We project they are likely to part ways after this season.
---

### PROBABILITY METHODOLOGY

**Production Probability:** Based on total yards trajectory through decision year compared to historical comps who received contracts

**Efficiency Probability:** Based on ANY/A (Adjusted Net Yards per Attempt) trajectory through decision year compared to historical comps who received contracts

**Decision Year:** Historical point where teams typically make extension decisions (usually Year 4 offseason after rookie deal Year 3)

**Note:** Production and Efficiency probabilities are shown separately as they measure different aspects of QB performance and are not independent metrics. Do not combine or average them.

---

1. **Efficiency is the Leading Indicator of Growth Trajectory:** ANY/A changes predict extension probability before volume stats reveal the pattern. QBs who improve efficiency by +1.5 ANY/A or more between Year 1 and Year 2 (Maye +2.87, Williams +1.83, Burrow +1.79, Lamar +2.21) signal developmental upside that teams pay for. Conversely, efficiency regression in Year 2-3 (Stroud -2.04 then +0.54, Young +1.42 then -0.50) triggers immediate concern regardless of volume production. Teams trust efficiency trends as real skill development; volume can be scheme/opportunity-driven.

2. **Year 1 Efficiency Threshold: The 5.5 ANY/A Floor:** First-year performance below 5.5 ANY/A creates extension skepticism that requires extraordinary Year 2-3 recovery. Daniels (6.50), Nix (6.12), and Maye (5.10 mid-season) cleared or approached this bar. Williams (5.09) and especially Young (3.69) started in deep holes requiring Burrow/Goff-level transformations. Historical data shows <15% of QBs starting below 5.0 ANY/A receive extensions from their drafting team, even after improvement.

3. **Year 2 Efficiency Threshold: The 6.5 ANY/A Separation Point:** Second-year performance above 6.5 ANY/A with 3,500+ yards creates 60%+ extension probability regardless of Year 1 struggles. Maye (7.97), Williams (6.92), and Daniels (6.36) are tracking above or near this critical threshold. Stroud (5.98) and Nix (5.74) fall into the "prove-it Year 3" category between 5.5-6.5 ANY/A—not bad enough to abandon, not good enough to pay yet. Young (4.61) sits below the 5.5 floor where historical recovery rate is <5%.

4. **Year 3 is the Revelation Point—Trajectories Crystallize:** By the end of Year 3, the comparable set stabilizes and extension decisions lock in. Elite Early Developers (Mahomes, Herbert, Burrow) have already demonstrated 6.5+ ANY/A sustainability for multiple seasons. Late Bloomers (Allen, Goff) show clear Year 2-3 efficiency jumps that hold. Early Peaks (Stroud's potential path) must prove Year 1 performance wasn't a statistical outlier. The key pattern: QBs who haven't reached 6.0+ ANY/A by end of Year 3 almost never get extended—teams view Year 4 as "playing out the string" on rookie deals before moving on.

5. **Injury-Adjusted Volume Projections Need Deeper Analysis:** Current methodology extrapolates per-game production to 17 games (ex: Daniels 4,097 projected from 6 games), but this may not reflect how teams actually evaluate injury-impacted seasons. Do teams use games-played volume (penalizing Daniels for missing time) or per-game pace (rewarding him for elite efficiency when healthy)? Future research should separate "injury-year outliers" from "established volume ceiling" in the comparable matching algorithm.

6. **Production and Efficiency Create Four Quadrants:** High production + high efficiency (Daniels ideal case, Maye/Williams trajectory) = elite extensions ($50M+ AAV). High production + low efficiency (Stroud, possibly Nix) = team-friendly deals or fifth-year option delays. Low production + high efficiency (Penix potential) = prove-it extensions. Low production + low efficiency (Young) = non-tendered or traded. Further analysis is needed to validate that teams actually behave in this manner around the two (Low & High variant) quadrants.

7. **Sample Size Creates Unique Risk/Reward:** Penix (786 Y1 yards) and Maye (2,697 Y1 yards, mid-season start) have the highest variance. Small samples mean current projections (Penix 3,970 Y2, Maye 4,825 Y2) could either validate elite upside or expose unsustainable hot streaks. Full Year 2 seasons will shift their probabilities ±20 points in either direction.

---

## QB Performance Ranges (Paid QBs, Years 1-4)

### ANY/A (Adjusted Net Yards per Attempt)

| Year | Absolute Min | Lower Bound (Q1) | Average | Upper Bound (Q3) | Max |
|------|--------------|------------------|---------|------------------|-----|
| Year 1 | -0.44* | 4.57 | 5.80 | 6.41 | 14.52 |
| Year 2 | 1.62 | 5.45 | 6.11 | 6.85 | 9.00 |
| Year 3 | 4.47 | 5.78 | 6.68 | 7.46 | 10.28 |
| Year 4 | 4.47 | 5.56 | 6.21 | 6.80 | 8.40 |

'*' of interest, this was Aaron Rodgers in his rookie year. He had a -0.44 ANY/A and only 75.8 adjusted total yards. 

### Total Yards (Adjusted)

| Year | Absolute Min | Lower Bound (Q1) | Average | Upper Bound (Q3) | Max |
|------|--------------|------------------|---------|------------------|-----|
| Year 1 | 71.6 | 1,943.7 | 2,795.1 | 3,702.0 | 4,927.9 |
| Year 2 | 59.9 | 3,017.3 | 3,511.3 | 4,763.6 | 5,456.3 |
| Year 3 | 195.0 | 3,569.7 | 3,639.3 | 4,359.4 | 5,172.0 |
| Year 4 | 2,128.1 | 3,280.1 | 3,766.7 | 4,421.9 | 5,323.8 |

**Note:** Lower Bound = 25th percentile (Q1), Upper Bound = 75th percentile (Q3)

---

# Overall Research Summary

This three-part analysis examined 25 years of NFL quarterback evaluation by studying first-round draft picks from 2000-2024, using contract renewal decisions as an objective measure of organizational success. The research revealed systematic biases in how teams evaluated quarterbacks and provided a data-driven framework for predicting which current QBs were likely to receive extensions.

**Article 1** established the foundation by developing an era-adjustment methodology that accounted for offensive inflation over time (+6.84% in total yards, +17% in passing touchdowns). Through ridge regression analysis of 65 quarterbacks and 350+ season records, the study identified Total Yards (era-adjusted) and ANY/A (Adjusted Net Yards per Attempt) as the most predictive metrics for contract decisions. Surprisingly, the analysis revealed that team-dependent factors like wins received nearly equal weighting to individual performance metrics, contradicting the conventional wisdom that teams prioritized individual quarterback skill. 

**Article 2** uncovered extreme temporal bias in how organizations weighted performance across a quarterback's career. Rather than evaluating all years equally, teams dramatically overweighted recent performance—Year 3 had 59.8% weight in Year 4 contract decisions versus 25% equal-weight baseline. This created a "late bloomer advantage" for quarterbacks like Josh Allen who broke out in their final contract year, while penalizing those who regressed recently despite strong career averages. The analysis also identified critical performance thresholds: approximately 4,200 era-adjusted yards and 6.5 ANY/A represented inflection points where contract probability exceeded 60%. These temporal patterns enabled the creation of probability heat maps showing contract likelihood across different performance levels and career stages.

**Article 3** applied the framework to current NFL quarterbacks, overlaying individual career trajectories onto the probability surfaces to identify archetypal paths and predict future contract decisions. The analysis identified four quarterback archetypes: Elite Early Developers, Steady Reliable Improvers, Late Bloomers, and Early Peaks. The framework demonstrated that efficiency and volume metrics served as leading indicators—quarterbacks who improved ANY/A by +1.5 or more between Years 1-2 and sustained 4,200+ era-adjusted yards signaled developmental upside that teams paid for, while those who failed to reach 6.0+ ANY/A by Year 3 almost never received extensions from their drafting team. Applied to current quarterbacks awaiting extensions, the framework projected divergent outcomes: Jayden Daniels showed the highest contract probability with elite efficiency despite limited sample size, Caleb Williams and Drake Maye demonstrated promising upward trajectories when factored in with projected 2025 data, CJ Stroud faced a critical prove-it Year 3 after efficiency decline, and Bryce Young's continued regression placed him below historical recovery thresholds.

## Areas for Future Research

**Injury-Adjusted Performance Modeling:** Evaluate whether removing injury-impacted seasons and extrapolating per-game performance improves prediction accuracy compared to using raw season totals, addressing how teams actually evaluate injury-shortened years.

**Fifth-Year Option Exercise Patterns:** Analyze whether teams systematically use the fifth-year option differently for quarterbacks with high production/low efficiency versus low production/high efficiency profiles, revealing organizational risk tolerance.

**Multi-Round Draft Analysis:** Expand the dataset beyond first-round picks to include all drafted quarterbacks, testing whether the identified patterns and thresholds hold across different draft capital investments and expectation levels.

**Contract Value Prediction:** Determine the most predictive factors for percentage of salary cap at signing, examining whether contract year performance, career trajectory shape, or market timing drives compensation levels.

**Draft Position Expectations:** Develop draft slot-specific trajectory benchmarks (picks 1-5, 6-10, 11-20, 21-32) to evaluate whether quarterbacks outperform or underperform positional expectations and how this influences extension decisions.