<!-- TL;DR: GA4 setup (gtag.js snippet, recommended events). Meta Pixel and Google Ads conversion tracking.
UTM parameter naming conventions. Custom event tracking patterns (scroll, clicks, forms, video, time).
Data layer for GTM. Privacy/consent requirements (GDPR, CCPA). Event naming conventions. -->

# Analytics & Tracking Setup

> **Used by**: Build Agent, Launch Agent
> **When**: Implementing tracking code, setting up conversion measurement, preparing for launch

---

## GA4 Setup

### Base Installation

Place this snippet in the `<head>` of every page, before any other scripts:

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Replace `G-XXXXXXXXXX` with the actual Measurement ID from GA4 Admin > Data Streams.

### Recommended GA4 Events for Landing Pages

```javascript
// Page scroll milestones (enhanced measurement handles 90%, add custom for 25/50/75)
gtag('event', 'scroll_milestone', {
  percent_scrolled: 25
});

// CTA click
gtag('event', 'cta_click', {
  cta_text: 'Start Free Trial',
  cta_location: 'hero'
});

// Form submission
gtag('event', 'generate_lead', {
  form_name: 'hero_signup',
  form_location: 'above_fold'
});

// Video engagement
gtag('event', 'video_start', {
  video_title: 'Product Demo'
});

// Pricing interaction
gtag('event', 'view_pricing', {
  plan_selected: 'pro'
});
```

### GA4 Enhanced Measurement (Auto-Tracked)
Enable these in GA4 Admin > Data Streams > Enhanced Measurement:
- Page views
- Scrolls (90% depth)
- Outbound clicks
- Site search
- Video engagement (YouTube embeds)
- File downloads

---

## Meta Pixel Setup

### Base Pixel Code

Place in the `<head>` of every page:

```html
<!-- Meta Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.net/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"/>
</noscript>
```

### Standard Events for Landing Pages

```javascript
// Visitor views main content
fbq('track', 'ViewContent', {
  content_name: 'Landing Page - Product X',
  content_category: 'landing_page'
});

// Lead form submission
fbq('track', 'Lead', {
  content_name: 'Hero Signup Form',
  content_category: 'lead_capture'
});

// Purchase or paid conversion
fbq('track', 'Purchase', {
  value: 49.00,
  currency: 'USD',
  content_name: 'Pro Plan'
});

// Add to cart / begin checkout
fbq('track', 'InitiateCheckout', {
  value: 49.00,
  currency: 'USD'
});

// Completed registration
fbq('track', 'CompleteRegistration', {
  content_name: 'Free Trial Signup'
});
```

---

## Google Ads Conversion Tracking

### Conversion Snippet

Place on the thank-you or confirmation page only:

```html
<!-- Google Ads Conversion -->
<script>
  gtag('event', 'conversion', {
    'send_to': 'AW-XXXXXXXXX/XXXXXXXXXXXXXXXXXXXX',
    'value': 1.0,
    'currency': 'USD'
  });
</script>
```

### Linking GA4 and Google Ads
1. In GA4: Admin > Google Ads Links > Link
2. Import GA4 conversions into Google Ads for smarter bidding
3. Mark key events as conversions in GA4 Admin > Events

---

## UTM Parameter Strategy

### Parameter Definitions

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `utm_source` | Where the traffic comes from | `google`, `facebook`, `newsletter` |
| `utm_medium` | How it arrives | `cpc`, `email`, `social`, `organic` |
| `utm_campaign` | Which campaign | `spring_launch_2024`, `black_friday` |
| `utm_content` | Which creative/variant | `hero_video_v2`, `testimonial_ad` |
| `utm_term` | Keyword (paid search) | `best_crm_software` |

### Naming Conventions
- All lowercase, no spaces
- Use underscores for word separation: `spring_launch` not `spring-launch`
- Be consistent and document in a shared spreadsheet
- Include date or version when relevant: `q1_2024_launch`

### URL Structure Example
```
https://example.com/landing?utm_source=facebook&utm_medium=cpc&utm_campaign=spring_launch_2024&utm_content=testimonial_video_v1
```

### Common Source/Medium Pairs
| Source | Medium | Use Case |
|--------|--------|----------|
| `google` | `cpc` | Google Ads |
| `facebook` | `cpc` | Meta Ads |
| `newsletter` | `email` | Email campaigns |
| `twitter` | `social` | Organic social posts |
| `partner_name` | `referral` | Partner traffic |
| `linkedin` | `cpc` | LinkedIn Ads |

---

## Custom Event Tracking Patterns

### Scroll Depth Tracking

```javascript
const scrollThresholds = [25, 50, 75, 100];
const tracked = new Set();

window.addEventListener('scroll', () => {
  const scrollPercent = Math.round(
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
  );
  scrollThresholds.forEach(threshold => {
    if (scrollPercent >= threshold && !tracked.has(threshold)) {
      tracked.add(threshold);
      gtag('event', 'scroll_depth', { percent: threshold });
    }
  });
});
```

### CTA Click Tracking

```javascript
document.querySelectorAll('[data-cta]').forEach(btn => {
  btn.addEventListener('click', () => {
    gtag('event', 'cta_click', {
      cta_text: btn.textContent.trim(),
      cta_location: btn.dataset.cta,
      cta_url: btn.href || 'none'
    });
  });
});
```

### Form Submission Tracking

```javascript
document.querySelectorAll('form[data-track]').forEach(form => {
  form.addEventListener('submit', (e) => {
    const formName = form.dataset.track;
    gtag('event', 'form_submit', {
      form_name: formName,
      form_location: form.closest('section')?.id || 'unknown'
    });
  });
});
```

### Video Play Tracking

```javascript
document.querySelectorAll('video[data-track]').forEach(video => {
  video.addEventListener('play', () => {
    gtag('event', 'video_play', {
      video_title: video.dataset.track,
      video_duration: Math.round(video.duration)
    });
  });

  video.addEventListener('ended', () => {
    gtag('event', 'video_complete', {
      video_title: video.dataset.track
    });
  });
});
```

### Time on Page Tracking

```javascript
const timeThresholds = [30, 60, 120, 300]; // seconds
timeThresholds.forEach(seconds => {
  setTimeout(() => {
    gtag('event', 'time_on_page', { seconds: seconds });
  }, seconds * 1000);
});
```

---

## Data Layer Setup for GTM

### Base Data Layer (Before GTM Container)

```html
<script>
  window.dataLayer = window.dataLayer || [];
  dataLayer.push({
    'pageType': 'landing_page',
    'pageName': 'Product Launch LP',
    'pageCategory': 'marketing',
    'userStatus': 'anonymous'
  });
</script>

<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
```

### Pushing Custom Events to Data Layer

```javascript
// CTA interaction
dataLayer.push({
  'event': 'cta_interaction',
  'ctaText': 'Start Free Trial',
  'ctaLocation': 'hero',
  'ctaType': 'primary'
});

// Form submission
dataLayer.push({
  'event': 'form_submission',
  'formName': 'lead_capture',
  'formLocation': 'hero_section',
  'formFields': 3
});

// Purchase/conversion
dataLayer.push({
  'event': 'purchase',
  'transactionValue': 49.00,
  'transactionCurrency': 'USD',
  'productName': 'Pro Plan'
});
```

---

## Privacy & Consent

### Cookie Banner Requirements

Every landing page with analytics must include a cookie consent mechanism:

```html
<div id="cookie-banner" role="dialog" aria-label="Cookie consent">
  <p>We use cookies to analyze site traffic and improve your experience.</p>
  <button id="accept-cookies">Accept</button>
  <button id="reject-cookies">Reject</button>
  <a href="/privacy">Privacy Policy</a>
</div>
```

### Consent-Based Loading Pattern

```javascript
// Don't fire tracking until consent is given
function loadAnalytics() {
  // Load GA4, Meta Pixel, etc. only after consent
  gtag('consent', 'update', {
    'analytics_storage': 'granted',
    'ad_storage': 'granted'
  });
}

// Default: denied
gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied'
});

// On accept click
document.getElementById('accept-cookies').addEventListener('click', () => {
  loadAnalytics();
  localStorage.setItem('cookie_consent', 'granted');
  document.getElementById('cookie-banner').hidden = true;
});
```

### GDPR Essentials (EU Visitors)
- Explicit opt-in required before tracking (no pre-checked boxes)
- Must explain what data is collected and why
- Easy way to withdraw consent
- Link to full privacy policy
- Data processing agreement with analytics providers

### CCPA Essentials (California Visitors)
- "Do Not Sell My Personal Information" link required
- Must disclose categories of personal information collected
- Opt-out mechanism for data sales
- Less strict than GDPR: opt-out model, not opt-in

---

## Event Naming Conventions

### Standard Prefix Categories

| Prefix | Category | Examples |
|--------|----------|---------|
| `cta_` | Call-to-action interactions | `cta_click`, `cta_hover`, `cta_view` |
| `form_` | Form interactions | `form_start`, `form_submit`, `form_error` |
| `video_` | Video engagement | `video_play`, `video_pause`, `video_complete` |
| `scroll_` | Scroll behavior | `scroll_depth`, `scroll_milestone` |
| `nav_` | Navigation interactions | `nav_click`, `nav_menu_open` |
| `social_` | Social interactions | `social_share`, `social_follow` |
| `content_` | Content engagement | `content_expand`, `content_download` |

### Naming Rules
- Always use `snake_case`
- Prefix with category for easy filtering
- Keep names under 40 characters
- Be descriptive but concise: `cta_click` not `user_clicked_on_call_to_action_button`
- Include context via event parameters, not the event name
