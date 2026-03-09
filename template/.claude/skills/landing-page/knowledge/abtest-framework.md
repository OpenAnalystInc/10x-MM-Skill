# A/B Testing Framework

<!--
TL;DR: Complete A/B testing framework with hypothesis templates, prioritized test
ideas, sample size guidance, statistical significance rules, implementation patterns,
and documentation templates to systematically improve landing page conversions.
-->

## Hypothesis Template

Every test must start with a clear hypothesis:

> **If we** [specific change], **then** [metric] **will** [improve/decrease] **by** [estimated amount] **because** [reasoning based on data or principle].

### Examples

- "If we change the headline from feature-focused to benefit-focused, then click-through rate will improve by 15% because visitors care more about outcomes than capabilities."
- "If we add customer logos above the fold, then form submissions will increase by 10% because social proof reduces perceived risk."
- "If we reduce form fields from 5 to 3, then form completion rate will increase by 20% because fewer fields reduce friction."

### Hypothesis Quality Checklist

- [ ] Identifies a specific, single change
- [ ] Names the exact metric being measured
- [ ] Predicts a directional outcome (increase or decrease)
- [ ] Provides a rationale grounded in evidence or principle
- [ ] Is testable within a reasonable timeframe

---

## What to Test (Ranked by Impact)

### Tier 1: Highest Impact

| Element | What to Vary | Why It Matters |
|---------|-------------|----------------|
| **1. Headlines** | Benefit vs. feature, specific vs. vague, short vs. long, question vs. statement | First thing visitors read; determines if they stay or leave |
| **2. CTA Text and Color** | Action words, benefit framing, color contrast, size, placement | Directly affects click-through; small changes yield big results |
| **3. Hero Image/Video** | Photo vs. illustration, product vs. lifestyle, video vs. static, with vs. without faces | Sets emotional tone and first impression in milliseconds |

### Tier 2: High Impact

| Element | What to Vary | Why It Matters |
|---------|-------------|----------------|
| **4. Social Proof Placement** | Above fold vs. mid-page, logos vs. testimonials, quantity of proof | Builds trust; placement affects when and whether visitors see it |
| **5. Form Length** | Number of fields, multi-step vs. single, optional vs. required fields | Direct friction point; fewer fields often means more completions |
| **6. Page Layout** | Section order, single column vs. two column, long vs. short page | Affects content consumption and scroll-to-conversion journey |

### Tier 3: Moderate Impact

| Element | What to Vary | Why It Matters |
|---------|-------------|----------------|
| **7. Pricing Display** | Monthly vs. annual, with vs. without comparison, anchoring tactics | Directly affects purchase decision framing |
| **8. Trust Signals** | Guarantees, security badges, certifications, media logos | Reduces anxiety at decision point; more effective near CTA |

### Tier 4: Refinement

| Element | What to Vary | Why It Matters |
|---------|-------------|----------------|
| 9. Body copy length | Short vs. detailed sections | Depends on audience awareness level |
| 10. Navigation | With vs. without nav, sticky vs. static | Can distract from primary conversion goal |
| 11. Color scheme | Warm vs. cool, high vs. low contrast | Subtle emotional influence |
| 12. Microcopy | Button labels, form labels, error messages | Reduces confusion and friction |

---

## Sample Size and Duration

### Minimum Sample Size Rules

- **Minimum 100 conversions per variant** before evaluating results
- For a page with 5% conversion rate, that means 2,000 visitors per variant
- For a page with 2% conversion rate, that means 5,000 visitors per variant
- **Total minimum:** 2x the per-variant number (control + one variant)

### Quick Sample Size Reference

| Current Conversion Rate | Minimum Detectable Effect | Visitors per Variant | Total Visitors Needed |
|------------------------|--------------------------|---------------------|----------------------|
| 1% | 50% relative (1% → 1.5%) | ~14,000 | ~28,000 |
| 2% | 25% relative (2% → 2.5%) | ~12,000 | ~24,000 |
| 5% | 20% relative (5% → 6%) | ~5,000 | ~10,000 |
| 10% | 15% relative (10% → 11.5%) | ~4,000 | ~8,000 |
| 20% | 10% relative (20% → 22%) | ~3,500 | ~7,000 |

### Duration Rules

- **Minimum 2 full weeks** (captures weekly traffic patterns)
- **Maximum 8 weeks** (beyond this, external factors skew results)
- **Must include** at least 1 full business cycle (weekday + weekend patterns)
- **Never stop early** because one variant "looks like it's winning"

---

## Statistical Significance

### Core Rules

- **Minimum confidence level: 95%** (p-value < 0.05)
- **Do not peek at results** and make decisions before the test reaches full sample size
- **Pre-commit to a runtime** before launching the test
- **One primary metric per test** (secondary metrics can be observed but not used to declare winners)

### Why "Peeking" Invalidates Results

Checking results multiple times during a test and stopping when you see significance inflates false positive rates. A test designed for 95% confidence that is checked daily can have an actual false positive rate of 30%+.

**Solution:** Set a sample size target, wait until it is reached, then evaluate once.

### Reading Results

| Outcome | What It Means | Action |
|---------|--------------|--------|
| Variant wins at 95%+ confidence | Statistically significant improvement | Implement the variant |
| Control wins at 95%+ confidence | The change made things worse | Keep the control, learn why |
| No significant difference | Not enough evidence either way | Keep control; test a bolder change |
| Variant wins at 80-94% confidence | Suggestive but not conclusive | Extend the test or retest with more traffic |

### Segmentation Analysis (Post-Test)

After declaring a winner, check if results hold across segments:

- **Device type:** Desktop vs. mobile vs. tablet
- **Traffic source:** Organic vs. paid vs. social vs. direct
- **New vs. returning visitors**
- **Geography** (if relevant)
- **Time of day / day of week**

A variant might win overall but lose for mobile users, indicating a responsive design issue.

---

## Test Implementation Patterns

### Pattern 1: Client-Side (JavaScript Variant Swap)

Best for simple element changes (headlines, button text, images, colors).

```javascript
// Simple client-side A/B test
(function() {
  // Determine variant (50/50 split, persistent via cookie)
  let variant = getCookie('ab_hero_test');
  if (!variant) {
    variant = Math.random() < 0.5 ? 'control' : 'variant_a';
    setCookie('ab_hero_test', variant, 30); // 30-day cookie
  }

  // Apply variant
  if (variant === 'variant_a') {
    const headline = document.querySelector('.hero h1');
    if (headline) {
      headline.textContent = 'Double Your Revenue in 90 Days';
    }
  }

  // Track exposure
  trackEvent('ab_test_exposure', {
    test_name: 'hero_headline_q1',
    variant: variant
  });
})();

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + value + '; expires=' + expires + '; path=/; SameSite=Lax';
}
```

**Pros:** Easy to implement, no server changes needed
**Cons:** Can cause flash of original content (FOOC), relies on JS execution

**Mitigating FOOC:**
```css
/* Hide test element until JS assigns variant */
[data-ab-test="hero_headline"] { opacity: 0; transition: opacity 0.15s; }
[data-ab-test="hero_headline"].ab-ready { opacity: 1; }
```

### Pattern 2: URL Redirect

Best for testing completely different page designs or layouts.

```javascript
// Redirect test - runs in <head> before page renders
(function() {
  const variant = getCookie('ab_page_test');
  if (variant === 'variant_a' && !window.location.pathname.includes('/v2')) {
    window.location.replace('/landing-v2');
    return;
  }
  if (!variant) {
    const assigned = Math.random() < 0.5 ? 'control' : 'variant_a';
    setCookie('ab_page_test', assigned, 30);
    if (assigned === 'variant_a') {
      window.location.replace('/landing-v2');
    }
  }
})();
```

**Pros:** No FOOC, can test entirely different designs
**Cons:** Requires two separate pages, redirect adds latency, URL differences visible

### Pattern 3: Server-Side

Best for high-traffic sites, complex changes, or when FOOC must be eliminated.

```javascript
// Express.js example
app.get('/landing', (req, res) => {
  let variant = req.cookies.ab_landing;
  if (!variant) {
    variant = Math.random() < 0.5 ? 'control' : 'variant_a';
    res.cookie('ab_landing', variant, { maxAge: 30 * 86400000 });
  }

  res.render(variant === 'variant_a' ? 'landing-variant' : 'landing-control', {
    abVariant: variant
  });
});
```

**Pros:** No FOOC, no client-side JS needed, most reliable
**Cons:** Requires server changes, more complex deployment

---

## Tracking Setup

### Event Naming Convention

```
ab_test_exposure   → Fired when user sees a variant
ab_test_click      → Fired when user clicks the test element
ab_test_conversion → Fired when user completes the goal action
```

### Minimum Tracking Data Points

Each event should include:

```javascript
{
  test_name: 'hero_headline_2024_q1',    // Unique, descriptive test identifier
  variant: 'variant_a',                   // Which variant the user saw
  timestamp: Date.now(),                   // When the event occurred
  session_id: getSessionId(),              // To deduplicate
  device_type: getDeviceType(),            // Desktop, mobile, tablet
  traffic_source: getUTMSource()           // Where the user came from
}
```

### Conversion Attribution

- Attribute conversions to the **first variant seen** (not the most recent)
- Use cookies or local storage to persist variant assignment
- Ensure the same user always sees the same variant (consistency)
- Handle returning visitors: keep their original assignment

---

## Test Documentation Template

```markdown
## Test: [Descriptive Name]

### Hypothesis
If we [change], then [metric] will [direction] by [amount] because [reason].

### Test Details
- **Test ID:** [unique identifier]
- **Element tested:** [headline / CTA / image / layout / etc.]
- **Primary metric:** [conversion rate / click-through rate / etc.]
- **Secondary metrics:** [bounce rate, time on page, etc.]
- **Target sample size:** [number] per variant
- **Planned duration:** [start date] to [end date]
- **Traffic allocation:** [50/50, 70/30, etc.]

### Variants
| Variant | Description | Screenshot/Mockup |
|---------|------------|-------------------|
| Control | [Current version] | [link] |
| Variant A | [Description of change] | [link] |

### Results
- **Winner:** [Control / Variant A]
- **Confidence level:** [X]%
- **Primary metric lift:** [+/- X%]
- **Control:** [metric value] ([sample size] visitors)
- **Variant A:** [metric value] ([sample size] visitors)

### Segment Analysis
| Segment | Control | Variant A | Significant? |
|---------|---------|-----------|-------------|
| Desktop | | | |
| Mobile | | | |
| Organic | | | |
| Paid | | | |

### Learnings
[What did this test teach us about our audience, messaging, or design?]

### Next Steps
[Implement winner? Run follow-up test? Investigate segment differences?]
```

---

## Common Mistakes

### 1. Testing Too Many Things at Once
- **Problem:** Changing headline AND image AND CTA simultaneously
- **Fix:** Isolate one variable per test. If you must test multiple elements, use multivariate testing with enough traffic.

### 2. Stopping Too Early
- **Problem:** Declaring a winner after 2 days because one variant leads
- **Fix:** Pre-commit to sample size and duration. Wait for both thresholds.

### 3. No Hypothesis
- **Problem:** "Let's just try a different color and see what happens"
- **Fix:** Every test needs a written hypothesis before launch. No hypothesis = no test.

### 4. Ignoring Segments
- **Problem:** Overall winner masks a loser for your highest-value segment
- **Fix:** Always check segment breakdowns after declaring overall results.

### 5. Testing Low-Traffic Pages
- **Problem:** Running tests on pages with 500 visitors/month
- **Fix:** Need at least 1,000 visitors/week per variant for meaningful results. Focus on high-traffic pages first.

### 6. Running Too Many Concurrent Tests
- **Problem:** Multiple tests on the same page create interaction effects
- **Fix:** Maximum 1 test per page. Use a test calendar to manage sequencing.

### 7. Not Documenting Results
- **Problem:** Running tests but not recording what was learned
- **Fix:** Use the documentation template above. Build a knowledge base of all past tests.

### 8. Copying Competitors' Tests
- **Problem:** "Company X changed their button to green, so let's do that"
- **Fix:** What works for them may not work for your audience. Run your own tests.

---

## Post-Test Process

### Step 1: Evaluate Results
- Confirm statistical significance (95%+ confidence)
- Check for segment anomalies
- Verify no external factors skewed results (holiday traffic, outage, campaigns)

### Step 2: Implement Winner
- Deploy the winning variant to 100% of traffic
- Remove test code (variant swap scripts, cookies, tracking)
- Update the production codebase with the winning version
- Verify conversion tracking still works after cleanup

### Step 3: Document Learnings
- Fill out the test documentation template
- Add to the team's testing knowledge base
- Share results with stakeholders
- Note any surprising findings or audience insights

### Step 4: Plan Next Test
- Use learnings to generate the next hypothesis
- Move to the next-highest-impact element from the priority list
- Ensure enough traffic has accumulated since the last test
- Schedule the test on the testing calendar

### Continuous Testing Cadence
- **High traffic (10K+ visitors/week):** Run tests back-to-back, always have one active
- **Medium traffic (2-10K visitors/week):** 1-2 tests per month
- **Low traffic (< 2K visitors/week):** 1 test per month, focus on high-impact elements only
