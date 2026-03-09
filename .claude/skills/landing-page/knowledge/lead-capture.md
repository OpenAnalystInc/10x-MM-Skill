<!-- TL;DR: Form optimization rules (fewer fields, progressive profiling, inline validation). 8 lead capture
mechanisms (inline forms, modals, exit-intent, sticky bars, slide-ins, content gates, quiz magnets, chat).
Lead magnet ranking. Field impact on conversion. Integration patterns. Multi-step forms. GDPR compliance. -->

# Lead Capture Optimization

> **Used by**: Build Agent, Copywriting Agent, Design Agent
> **When**: Designing forms, implementing capture mechanisms, optimizing conversion points

---

## Form Optimization Rules

### The Fewer Fields Rule
Every form field you add reduces conversion by approximately 5-10%. Only ask for what you truly need at this stage.

| Fields | Typical Conversion Impact |
|--------|--------------------------|
| 1 field (email only) | Baseline (highest conversion) |
| 2 fields (email + name) | -5 to -10% |
| 3 fields (+ company/phone) | -15 to -25% |
| 4+ fields | -25 to -40% |

### Progressive Profiling
Don't ask everything upfront. Collect additional data over time:
1. **First touch**: Email only
2. **Second interaction**: First name
3. **Third interaction**: Company, role
4. **Qualification**: Phone, budget, timeline

### Inline Validation
- Validate fields as the user types, not after they hit submit
- Show green checkmarks for valid entries
- Show specific error messages ("Please enter a valid email" not "Invalid input")
- Never clear the entire form on error
- Auto-format phone numbers and postal codes

### Smart Form Defaults
- Use `type="email"` for email fields (triggers email keyboard on mobile)
- Add `autocomplete` attributes for browser autofill
- Pre-select the most common option in dropdowns
- Use placeholder text as hints, not labels
- Make submit button text describe the value: "Get My Free Guide" not "Submit"

---

## 8 Lead Capture Mechanisms

### 1. Inline Forms (Embedded in Page)

**Best for**: Above-fold capture, blog post CTAs, pricing page signups.

```html
<form class="inline-capture" data-track="hero_signup">
  <input type="email" placeholder="Enter your email" required
         autocomplete="email" aria-label="Email address">
  <button type="submit">Get Started Free</button>
  <p class="form-hint">No credit card required. Unsubscribe anytime.</p>
</form>
```

**Design Rules**:
- Place in the natural reading flow, not off to the side
- High contrast button against the background
- Include a trust line below the button (no spam, unsubscribe anytime)
- Visible without scrolling on the primary landing page

---

### 2. Modal Popups (Timed or Scroll-Triggered)

**Best for**: Special offers, content upgrades, high-value lead magnets.

**Trigger Strategies**:
| Trigger | When to Use | Typical Timing |
|---------|------------|----------------|
| **Time delay** | Engaged visitors | 15-30 seconds |
| **Scroll depth** | Content readers | After 50-60% scroll |
| **Page count** | Returning visitors | 2nd or 3rd page view |
| **Click trigger** | User-initiated | On CTA click |

**Design Rules**:
- Dim the background overlay (rgba black at 50-60% opacity)
- Easy, obvious close button (X in top-right, clicking overlay closes)
- Mobile: full-screen takeover or bottom sheet, never a tiny centered modal
- Don't show again for 7-30 days after dismissal (use localStorage)
- Never show on first visit within 5 seconds

---

### 3. Exit-Intent Popups

**Best for**: Last-chance offers, reducing bounce rate, high-exit pages.

**Detection Pattern (Desktop)**:
```javascript
document.addEventListener('mouseout', function(e) {
  if (e.clientY < 10 && !sessionStorage.getItem('exit_shown')) {
    showExitPopup();
    sessionStorage.setItem('exit_shown', 'true');
  }
});
```

**Mobile Alternative** (no mouse exit on mobile):
- Trigger on back-button press or tab switch
- Use scroll-up detection (user scrolling back toward address bar)
- Show after a prolonged idle period (30+ seconds no interaction)

**Content Strategy**:
- Different offer than the main page CTA
- Discount, bonus, or lower commitment ("Not ready? Get the free guide instead")
- Strong headline addressing why they're leaving

---

### 4. Sticky Bars (Top or Bottom)

**Best for**: Persistent offers, announcements, secondary CTAs.

```html
<div class="sticky-bar" role="complementary" aria-label="Special offer">
  <p>Limited time: Get 20% off with code <strong>LAUNCH20</strong></p>
  <a href="#signup" class="sticky-bar-cta">Claim Offer</a>
  <button class="sticky-bar-close" aria-label="Dismiss">&times;</button>
</div>
```

**Design Rules**:
- Keep height under 60px (don't steal too much viewport)
- High contrast, readable at a glance
- Dismissable with close button
- Bottom bars perform better on mobile (closer to thumb zone)
- Don't cover navigation or important content

---

### 5. Slide-In Widgets

**Best for**: Blog content upgrades, "Hey, before you go" nudges.

**Behavior**:
- Slides in from bottom-right corner after scroll depth trigger (typically 40-60%)
- Less intrusive than modals, more noticeable than inline forms
- Stays visible as user scrolls but can be minimized

**Design Rules**:
- Max width 350px on desktop
- Clear close/minimize option
- Relevant to the content being read
- Don't overlap primary CTA buttons

---

### 6. Content Gates (PDF, Video, Tool Access)

**Best for**: High-value resources, research reports, exclusive content.

**Pattern**:
```
Show preview/teaser content → Gate the full resource behind email capture
```

**Implementation Approaches**:
| Approach | Conversion Rate | User Experience |
|----------|----------------|-----------------|
| **Full gate** (no preview) | Lower | Worse — user doesn't know what they're getting |
| **Partial gate** (show 30%) | Higher | Better — user sees value before committing |
| **Social gate** (share to unlock) | Variable | Good for viral content |

**Design Rules**:
- Show a compelling preview of gated content
- Display the table of contents or key highlights
- Use a blurred preview of the full content below the gate
- Make the value of unlocking crystal clear

---

### 7. Quiz / Calculator Lead Magnets

**Best for**: Personalized recommendations, assessments, cost calculators.

**Flow**:
```
Start Quiz → 3-7 Questions → Email Gate → Personalized Results
```

**Why They Convert (30-50% opt-in rates)**:
- Curiosity drives completion
- Personalized results feel valuable
- Investment in answering creates commitment
- Results page becomes a natural sales tool

**Design Rules**:
- Progress bar showing completion percentage
- One question per screen (don't overwhelm)
- Visual, clickable answer options (not dropdowns)
- Gate the results, not the quiz (let them invest first)
- Results page should lead naturally to your offer

---

### 8. Chat-to-Capture (Chatbot to Email)

**Best for**: Service businesses, complex products, high-touch sales.

**Flow**:
```
Chatbot greeting → Qualify with questions → Offer resource/booking → Capture email
```

**Design Rules**:
- Conversational tone, not robotic
- 3-5 messages maximum before asking for email
- Provide value before asking (answer a question, give a recommendation)
- "Where should I send your recommendation?" as the capture moment
- Fallback to human agent option for complex queries

---

## Lead Magnet Types Ranked by Conversion

| Rank | Type | Typical Opt-in Rate | Effort to Create |
|------|------|-------------------|-----------------|
| 1 | **Checklists / Cheat Sheets** | 40-60% | Low |
| 2 | **Templates / Swipe Files** | 35-50% | Low-Medium |
| 3 | **Quizzes / Assessments** | 30-50% | Medium |
| 4 | **Free Tools / Calculators** | 25-45% | High |
| 5 | **Ebooks / Guides** | 20-35% | Medium |
| 6 | **Webinars / Workshops** | 20-35% | Medium-High |
| 7 | **Video Courses** | 15-30% | High |
| 8 | **Free Trials** | 10-25% | High |
| 9 | **Whitepapers / Reports** | 10-20% | Medium-High |
| 10 | **Newsletters** | 5-15% | Low (ongoing) |

**Key insight**: The highest-converting lead magnets are specific, immediately useful, and quick to consume. A "7-Point SEO Checklist" outperforms a "Complete Guide to SEO" every time.

---

## Form Field Impact on Conversion

### Field-by-Field Impact

| Field | Impact on Conversion | When to Include |
|-------|---------------------|-----------------|
| **Email** | Baseline (required) | Always |
| **First Name** | -5% | When personalization matters |
| **Last Name** | -5% | Rarely needed at capture stage |
| **Phone** | -10 to -15% | Only for sales-qualified leads or callbacks |
| **Company** | -5 to -10% | B2B qualification only |
| **Job Title** | -5 to -10% | B2B segmentation only |
| **Address** | -15 to -20% | Physical product delivery only |
| **Custom questions** | -5% each | When segmentation justifies the cost |

### Recommendations by Funnel Stage

| Stage | Recommended Fields |
|-------|-------------------|
| **Top of funnel** (awareness) | Email only |
| **Middle of funnel** (consideration) | Email + First Name |
| **Bottom of funnel** (decision) | Email + Name + Phone/Company |
| **Purchase** | Full details (justified by transaction) |

---

## Integration Patterns

### Mailchimp

```html
<form action="https://YOUR_DOMAIN.us1.list-manage.com/subscribe/post?u=XXXXX&id=XXXXX"
      method="POST">
  <input type="email" name="EMAIL" required>
  <input type="text" name="FNAME">
  <!-- Bot honeypot field -->
  <div style="position:absolute;left:-5000px" aria-hidden="true">
    <input type="text" name="b_XXXXX_XXXXX" tabindex="-1" value="">
  </div>
  <button type="submit">Subscribe</button>
</form>
```

### ConvertKit (API)

```javascript
async function subscribeToConvertKit(email, firstName) {
  const response = await fetch('https://api.convertkit.com/v3/forms/FORM_ID/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: 'YOUR_PUBLIC_API_KEY',
      email: email,
      first_name: firstName
    })
  });
  return response.json();
}
```

### HubSpot Forms

```html
<script charset="utf-8" type="text/javascript"
  src="//js.hsforms.net/forms/embed/v2.js"></script>
<script>
  hbspt.forms.create({
    region: "na1",
    portalId: "YOUR_PORTAL_ID",
    formId: "YOUR_FORM_ID",
    target: "#hubspot-form-container"
  });
</script>
```

### Zapier Webhook (Universal)

```javascript
async function sendToZapier(formData) {
  await fetch('https://hooks.zapier.com/hooks/catch/XXXXX/XXXXX/', {
    method: 'POST',
    body: JSON.stringify({
      email: formData.email,
      name: formData.name,
      source: window.location.href,
      timestamp: new Date().toISOString()
    })
  });
}
```

**Zapier enables connection to 5,000+ apps** without custom integration code. Use it as a universal fallback when a direct integration isn't available.

---

## Multi-Step Form Pattern

### Why Multi-Step Forms Convert Better
- Reduces perceived complexity (3 easy steps vs. 1 intimidating form)
- Commitment escalation (after completing step 1, users are invested)
- Progress indicators create completion motivation
- Each step can be tracked for drop-off analysis

### Implementation Structure

```html
<form class="multi-step-form" data-track="multi_step_signup">
  <!-- Step 1: Low commitment -->
  <div class="step" data-step="1">
    <h3>Step 1 of 3: What best describes you?</h3>
    <div class="option-grid">
      <button type="button" class="option" data-value="startup">Startup</button>
      <button type="button" class="option" data-value="agency">Agency</button>
      <button type="button" class="option" data-value="enterprise">Enterprise</button>
    </div>
  </div>

  <!-- Step 2: Medium commitment -->
  <div class="step" data-step="2" hidden>
    <h3>Step 2 of 3: What's your biggest challenge?</h3>
    <div class="option-grid">
      <button type="button" class="option" data-value="leads">Getting leads</button>
      <button type="button" class="option" data-value="conversion">Converting visitors</button>
      <button type="button" class="option" data-value="retention">Keeping customers</button>
    </div>
  </div>

  <!-- Step 3: The ask -->
  <div class="step" data-step="3" hidden>
    <h3>Step 3 of 3: Where should we send your plan?</h3>
    <input type="email" name="email" placeholder="Enter your email" required>
    <button type="submit">Get My Custom Plan</button>
  </div>

  <!-- Progress bar -->
  <div class="progress-bar">
    <div class="progress-fill" style="width: 33%"></div>
  </div>
</form>
```

### Design Rules
- Start with the easiest, lowest-commitment question
- Save the email/contact fields for the final step
- Show a clear progress indicator (step X of Y or progress bar)
- Allow going back to previous steps
- Track drop-off at each step for optimization

---

## GDPR-Compliant Capture

### Required Elements

Every lead capture form targeting EU visitors must include:

```html
<form>
  <input type="email" name="email" required>

  <!-- Explicit consent checkbox (NOT pre-checked) -->
  <label class="consent-checkbox">
    <input type="checkbox" name="consent" required>
    I agree to receive marketing emails. You can unsubscribe at any time.
    <a href="/privacy" target="_blank">Privacy Policy</a>
  </label>

  <!-- Optional: separate consent for different purposes -->
  <label class="consent-checkbox">
    <input type="checkbox" name="consent_analytics">
    I agree to the processing of my data for personalized recommendations.
  </label>

  <button type="submit">Get My Free Guide</button>

  <p class="privacy-notice">
    We respect your privacy. Your data is processed by [Company Name]
    for the purpose of sending you relevant content. You may withdraw
    consent at any time by clicking unsubscribe in any email.
    <a href="/privacy">Full Privacy Policy</a>
  </p>
</form>
```

### GDPR Compliance Checklist
- [ ] Consent checkbox is NOT pre-checked
- [ ] Clear explanation of what they're consenting to
- [ ] Link to full privacy policy
- [ ] Name of the data controller (your company)
- [ ] Purpose of data processing stated
- [ ] Easy unsubscribe mechanism in every email
- [ ] Data processing records maintained
- [ ] Ability to export/delete user data on request
- [ ] No bundled consent (marketing consent separate from service terms)
- [ ] Age verification if targeting under-16 audiences

### Double Opt-In Pattern
Required in some EU countries (Germany, Austria) and best practice everywhere:
1. User submits form
2. Confirmation email sent with verification link
3. User clicks link to confirm subscription
4. Only then added to marketing list

**Benefit**: Cleaner list, higher engagement, stronger legal standing.
**Tradeoff**: 20-30% of opt-ins never confirm. Worth it for quality and compliance.
