# Speed Optimization Reference

<!--
TL;DR: Performance optimization checklist targeting Core Web Vitals (LCP < 2.5s,
INP < 200ms, CLS < 0.1) with actionable techniques for images, CSS, JavaScript,
fonts, and delivery — ranked by impact for maximum page speed gains.
-->

## Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5s - 4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | < 200ms | 200ms - 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 |

### What Each Metric Measures
- **LCP:** How fast the largest visible element loads (hero image, headline block). Measures perceived load speed.
- **INP:** How fast the page responds to user interactions (clicks, taps, key presses). Replaced FID in March 2024.
- **CLS:** How much the layout shifts unexpectedly during load. Measures visual stability.

---

## Image Optimization

### Format Selection

| Format | Best For | Browser Support | Compression |
|--------|----------|----------------|-------------|
| **WebP** | Photos, complex images | 97%+ browsers | 25-35% smaller than JPEG |
| **AVIF** | Photos (modern browsers) | 92%+ browsers | 50% smaller than JPEG |
| **SVG** | Icons, logos, illustrations | Universal | Infinitely scalable, tiny size |
| **PNG** | Images requiring transparency | Universal | Lossless, larger file size |
| **JPEG** | Fallback for older browsers | Universal | Lossy, good compression |

**Decision rule:** Use AVIF with WebP fallback for photos. Use SVG for anything that can be vector. Use PNG only when transparency is needed and SVG is not feasible.

### Responsive Images

```html
<!-- srcset with sizes for responsive loading -->
<img
  src="hero-800.webp"
  srcset="
    hero-400.webp 400w,
    hero-800.webp 800w,
    hero-1200.webp 1200w,
    hero-1600.webp 1600w
  "
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 80vw, 1200px"
  alt="Descriptive alt text"
  width="1200"
  height="675"
  loading="lazy"
  decoding="async"
/>

<!-- picture element for format fallback -->
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="Descriptive alt text" width="1200" height="675" />
</picture>
```

**Always set explicit `width` and `height` attributes** to prevent CLS. The browser uses these to calculate aspect ratio before the image loads.

### Lazy Loading

```html
<!-- Native lazy loading for below-fold images -->
<img src="feature.webp" loading="lazy" decoding="async" alt="..." />

<!-- NEVER lazy load the hero/LCP image — it must load immediately -->
<img src="hero.webp" loading="eager" fetchpriority="high" alt="..." />
```

**Intersection Observer for advanced lazy loading:**
```javascript
const lazyImages = document.querySelectorAll('img[data-src]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      observer.unobserve(img);
    }
  });
}, { rootMargin: '200px' }); // Start loading 200px before visible

lazyImages.forEach(img => observer.observe(img));
```

### Image Compression Targets

| Type | Quality Setting | Target File Size |
|------|----------------|-----------------|
| Hero image (full-width) | 80-85% JPEG / lossless WebP | < 200KB |
| Feature images | 75-80% JPEG / lossy WebP | < 100KB |
| Thumbnails | 70-75% JPEG / lossy WebP | < 30KB |
| Icons (SVG) | Optimized with SVGO | < 5KB each |
| Background patterns | Minimal, tiled if possible | < 20KB |

---

## CSS Optimization

### Critical CSS Inline

Inline the CSS needed for above-the-fold content directly in `<head>`:

```html
<head>
  <!-- Critical CSS inlined for instant rendering -->
  <style>
    /* Only styles needed for above-fold content */
    :root { --primary: #2563eb; --text: #1e293b; }
    body { margin: 0; font-family: system-ui, sans-serif; color: var(--text); }
    .hero { min-height: 80vh; display: flex; align-items: center; }
    .hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.1; }
    .cta-btn { background: var(--primary); color: #fff; padding: 1rem 2rem; }
    /* ... minimal above-fold styles ... */
  </style>

  <!-- Non-critical CSS loaded asynchronously -->
  <link rel="preload" href="/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="/styles.css" /></noscript>
</head>
```

### Remove Unused CSS

- **PurgeCSS:** Strips unused selectors from production builds
- **Coverage tab (Chrome DevTools):** Identify unused CSS percentage
- **Target:** Less than 20% unused CSS in production

### CSS Minification

- Remove whitespace, comments, and unnecessary characters
- Tools: cssnano, clean-css, Lightning CSS
- **Expected savings:** 15-30% file size reduction

### CSS Performance Tips

```css
/* Use contain for sections that don't affect outside layout */
.section { contain: content; }

/* Avoid expensive properties in animations */
/* GOOD: transform and opacity (GPU-accelerated) */
.animate { transition: transform 0.3s, opacity 0.3s; }

/* BAD: width, height, top, left (trigger layout recalc) */
.animate-bad { transition: width 0.3s, top 0.3s; }

/* Use will-change sparingly for known animations */
.card:hover { will-change: transform; }
```

---

## JavaScript Optimization

### Script Loading Strategies

```html
<!-- defer: Download parallel, execute after HTML parsed (preserves order) -->
<script src="app.js" defer></script>

<!-- async: Download parallel, execute immediately when ready (no order guarantee) -->
<script src="analytics.js" async></script>

<!-- module: Deferred by default, supports import/export -->
<script type="module" src="app.mjs"></script>
```

**Decision rule:**
- `defer` for your main application code (needs DOM)
- `async` for independent scripts (analytics, tracking)
- `type="module"` for modern bundled code

### Code Splitting

Split JavaScript by route or component so users only download what they need:

```javascript
// Dynamic import for below-fold components
const loadTestimonials = () => import('./testimonials.js');

// Load on scroll or interaction
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadTestimonials().then(module => module.init());
      observer.unobserve(entry.target);
    }
  });
});
observer.observe(document.querySelector('#testimonials'));
```

### Tree Shaking

- Import only what you need: `import { debounce } from 'lodash-es'` not `import _ from 'lodash'`
- Use ES module syntax (`import`/`export`) for tree-shaking eligibility
- Check bundle analyzer output for unnecessary dependencies

### Minimize Third-Party Scripts

| Script Type | Performance Cost | Recommendation |
|-------------|-----------------|----------------|
| Analytics (GA4) | ~20-50KB, moderate | Load async, delay if possible |
| Chat widgets | 100-500KB, heavy | Load on interaction or after 5s delay |
| Social embeds | 200-800KB, very heavy | Use static screenshots with links |
| Font services | 50-150KB, moderate | Self-host fonts instead |
| A/B testing | 30-100KB, moderate | Use lightweight or server-side |
| Tag managers | 50-200KB+, variable | Audit regularly, remove unused tags |

---

## Font Optimization

### Font Loading Strategy

```html
<head>
  <!-- Preload the most critical font file -->
  <link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin />
</head>
```

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var-latin.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap; /* Show fallback font immediately, swap when loaded */
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
                 U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122,
                 U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

### Font-Display Values

| Value | Behavior | Best For |
|-------|----------|----------|
| `swap` | Show fallback immediately, swap when loaded | Body text, most use cases |
| `optional` | Use font only if cached, otherwise skip | Non-critical decorative fonts |
| `fallback` | Short invisible period, then fallback | Headlines where flash is distracting |

### Font Subsetting

- Subset to Latin characters only (saves 60-80% for CJK fonts)
- Use `unicode-range` in `@font-face` for automatic subsetting
- Tools: `glyphhanger`, `fonttools`, Google Fonts `&text=` parameter
- Limit to 2 font families maximum (1 heading + 1 body)

### System Font Stack Fallback

```css
/* High-quality system font stack for zero-load-time fallback */
body {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont,
               'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
```

---

## Server and Delivery Optimization

### CDN (Content Delivery Network)

- Serve all static assets from a CDN (images, CSS, JS, fonts)
- Popular options: Cloudflare, Vercel Edge, AWS CloudFront, Netlify CDN
- CDN reduces latency by serving from the geographically nearest server

### Compression

```
# Enable Brotli (preferred) and Gzip compression
# Brotli: 15-25% better compression than Gzip

# Nginx example
brotli on;
brotli_types text/html text/css application/javascript application/json image/svg+xml;
gzip on;
gzip_types text/html text/css application/javascript application/json image/svg+xml;
```

### Caching Headers

```
# Long cache for fingerprinted/hashed assets
Cache-Control: public, max-age=31536000, immutable
# Example: /assets/app.a1b2c3.js

# Short cache for HTML (so updates propagate quickly)
Cache-Control: public, max-age=0, must-revalidate
# Example: /index.html
```

### Resource Hints

```html
<head>
  <!-- Preconnect to critical origins (saves DNS + TLS time) -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://cdn.example.com" crossorigin />

  <!-- DNS prefetch for less critical origins -->
  <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

  <!-- Preload critical resources -->
  <link rel="preload" href="/fonts/heading.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/hero.webp" as="image" />
</head>
```

---

## HTML Optimization

### Minification

- Remove HTML comments, whitespace, and optional tags in production
- Tools: html-minifier-terser, HTMLMinifier
- **Expected savings:** 10-20% file size reduction

### Preload Critical Resources

Preload resources the browser discovers late:

```html
<!-- Preload hero image (discovered late because it's in CSS or below other assets) -->
<link rel="preload" href="/images/hero.webp" as="image" fetchpriority="high" />

<!-- Preload critical font -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />

<!-- Preload above-fold CSS if loaded externally -->
<link rel="preload" href="/critical.css" as="style" />
```

### Reduce DOM Size

- Target: < 1500 DOM elements for landing pages
- Avoid deeply nested elements (flatten where possible)
- Use CSS for visual effects instead of empty wrapper divs
- Virtualize or lazy-render long lists

---

## Lighthouse Audit Checklist

Run Lighthouse in Chrome DevTools (Incognito mode) and target these scores:

| Category | Target Score | Key Factors |
|----------|-------------|-------------|
| **Performance** | 90+ | LCP, INP, CLS, Total Blocking Time, Speed Index |
| **Accessibility** | 95+ | Contrast, alt text, ARIA, keyboard nav, focus management |
| **Best Practices** | 95+ | HTTPS, no console errors, safe links, image aspect ratios |
| **SEO** | 95+ | Meta tags, heading hierarchy, crawlable links, mobile-friendly |

### Common Lighthouse Failures and Fixes

| Issue | Fix |
|-------|-----|
| Render-blocking resources | Inline critical CSS, defer JS |
| Images not sized correctly | Add explicit width/height attributes |
| Large network payloads | Compress, split, lazy load |
| Excessive DOM size | Simplify markup, remove wrapper divs |
| Missing meta description | Add descriptive meta tag |
| Low contrast text | Increase color contrast to 4.5:1+ |
| Missing alt text | Add descriptive alt to all images |
| No HTTPS | Enable SSL/TLS |

---

## Quick Wins Ranked by Impact

Prioritize optimizations in this order for maximum speed gains with minimum effort:

| Priority | Optimization | Typical Impact | Effort |
|----------|-------------|----------------|--------|
| 1 | **Compress and resize images** | -40-70% page weight | Low |
| 2 | **Use WebP/AVIF format** | -25-50% image size | Low |
| 3 | **Lazy load below-fold images** | -30-50% initial load | Low |
| 4 | **Inline critical CSS** | -0.5-1.5s render time | Medium |
| 5 | **Minify CSS and JS** | -15-30% file size | Low |
| 6 | **Defer non-critical JS** | -0.3-1.0s blocking time | Low |
| 7 | **Enable compression (Brotli/Gzip)** | -60-80% transfer size | Low |
| 8 | **Set font-display: swap** | Eliminates invisible text flash | Low |
| 9 | **Preconnect to origins** | -100-300ms per origin | Low |
| 10 | **Self-host fonts** | -100-500ms (removes third-party request) | Medium |
| 11 | **Add explicit image dimensions** | Eliminates CLS from images | Low |
| 12 | **Use CDN** | -50-200ms latency | Medium |
| 13 | **Set long cache headers** | Instant repeat visits | Low |
| 14 | **Delay third-party scripts** | -0.5-3.0s load time | Medium |
| 15 | **Reduce DOM complexity** | Faster rendering, lower memory | Medium |

### Performance Budget for Landing Pages

| Resource | Budget |
|----------|--------|
| Total page weight | < 1MB (ideally < 500KB) |
| HTML | < 50KB |
| CSS (total) | < 100KB |
| JavaScript (total) | < 200KB |
| Images (total) | < 500KB |
| Fonts | < 100KB (2 files max) |
| Third-party scripts | < 150KB |
| HTTP requests | < 30 |
| Time to Interactive | < 3.5s |
