# JavaScript Injection Patterns Reference

<!--
TL;DR: Safe, performance-optimized JavaScript injection patterns for analytics,
chat widgets, heatmaps, social proof, cookie consent, and custom tracking —
with async loading, error handling, CSP considerations, and debug mode.
-->

## Safe Injection Principles

1. **Never render-block:** All injected scripts must use `async`, `defer`, or dynamic insertion
2. **Always handle errors:** Wrap injected code in try/catch; never let third-party failures break the page
3. **Fallback gracefully:** The page must function fully without any injected script
4. **Minimize payload:** Only load what is needed; delay everything that can wait
5. **Respect privacy:** Honor cookie consent before firing tracking scripts
6. **Isolate scope:** Use IIFEs or modules to avoid global namespace pollution

---

## Common Injection Patterns

### 1. Analytics

#### Google Analytics 4 (GA4)

```html
<!-- Load GA4 asynchronously -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    send_page_view: true,
    cookie_flags: 'SameSite=None;Secure'
  });
</script>
```

#### Meta (Facebook) Pixel

```html
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
<noscript>
  <img height="1" width="1" style="display:none"
    src="https://www.facebook.net/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1" />
</noscript>
```

#### Google Ads Conversion Tracking

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-XXXXXXXXX');

  // Fire conversion on form submit or CTA click
  function trackConversion() {
    gtag('event', 'conversion', {
      send_to: 'AW-XXXXXXXXX/CONVERSION_LABEL',
      value: 1.0,
      currency: 'USD'
    });
  }
</script>
```

---

### 2. Chat Widgets

#### Intercom

```javascript
// Delay load until user interaction or 5s timeout
function loadIntercom() {
  if (window.Intercom) return;
  (function(){
    var w = window; var ic = w.Intercom;
    if (typeof ic === "function") { ic('reattach_activator'); ic('update', w.intercomSettings); }
    else {
      var d = document; var i = function(){ i.c(arguments); };
      i.q = []; i.c = function(args){ i.q.push(args); };
      w.Intercom = i;
      var s = d.createElement('script'); s.type = 'text/javascript';
      s.async = true; s.src = 'https://widget.intercom.io/widget/YOUR_APP_ID';
      d.head.appendChild(s);
    }
  })();
  window.Intercom('boot', { app_id: 'YOUR_APP_ID' });
}

// Load after 5 seconds or on first user interaction
var chatTimer = setTimeout(loadIntercom, 5000);
['mousemove', 'touchstart', 'scroll', 'keydown'].forEach(function(evt) {
  document.addEventListener(evt, function handler() {
    clearTimeout(chatTimer);
    loadIntercom();
    document.removeEventListener(evt, handler);
  }, { once: true });
});
```

#### Crisp

```javascript
function loadCrisp() {
  window.$crisp = [];
  window.CRISP_WEBSITE_ID = "YOUR_WEBSITE_ID";
  var s = document.createElement("script");
  s.src = "https://client.crisp.chat/l.js";
  s.async = true;
  document.head.appendChild(s);
}

// Delay load
setTimeout(loadCrisp, 5000);
```

#### Tawk.to

```javascript
function loadTawk() {
  var s = document.createElement("script");
  s.async = true;
  s.src = 'https://embed.tawk.to/YOUR_PROPERTY_ID/default';
  s.charset = 'UTF-8';
  s.setAttribute('crossorigin', '*');
  document.head.appendChild(s);
}

setTimeout(loadTawk, 5000);
```

---

### 3. Popup/Modal Libraries

#### Custom Lightweight Popup

```javascript
(function() {
  var DELAY_MS = 5000;       // Show after 5 seconds
  var COOKIE_DAYS = 7;       // Don't show again for 7 days
  var COOKIE_NAME = 'popup_dismissed';

  if (getCookie(COOKIE_NAME)) return;

  setTimeout(function() {
    var overlay = document.createElement('div');
    overlay.id = 'popup-overlay';
    overlay.innerHTML = `
      <div class="popup-modal" role="dialog" aria-labelledby="popup-title" aria-modal="true">
        <button class="popup-close" aria-label="Close popup">&times;</button>
        <h2 id="popup-title">Get 20% Off Your First Order</h2>
        <p>Subscribe to our newsletter and save on your first purchase.</p>
        <form id="popup-form">
          <input type="email" placeholder="Enter your email" required aria-label="Email address" />
          <button type="submit">Claim Discount</button>
        </form>
      </div>
    `;

    // Styles
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';

    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector('.popup-close').addEventListener('click', closePopup);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePopup();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closePopup();
    });

    function closePopup() {
      overlay.remove();
      setCookie(COOKIE_NAME, '1', COOKIE_DAYS);
    }
  }, DELAY_MS);

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + value + '; expires=' + expires + '; path=/; SameSite=Lax';
  }
})();
```

#### Exit-Intent Popup

```javascript
(function() {
  if (getCookie('exit_popup_seen')) return;

  document.addEventListener('mouseout', function handler(e) {
    if (e.clientY < 10 && e.relatedTarget === null) {
      document.removeEventListener('mouseout', handler);
      showExitPopup();
    }
  });

  // Mobile fallback: trigger on back button or after inactivity
  var inactivityTimer;
  function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(showExitPopup, 30000); // 30s inactivity
  }
  if ('ontouchstart' in window) {
    ['touchstart', 'scroll'].forEach(function(evt) {
      document.addEventListener(evt, resetTimer, { passive: true });
    });
    resetTimer();
  }

  function showExitPopup() {
    // Insert popup DOM (similar to custom popup above)
    setCookie('exit_popup_seen', '1', 7);
  }
})();
```

---

### 4. Heatmap and Recording Tools

#### Hotjar

```javascript
function loadHotjar() {
  (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:YOUR_SITE_ID,hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
}

// Delay to avoid impacting page load
setTimeout(loadHotjar, 3000);
```

#### Microsoft Clarity

```javascript
function loadClarity() {
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window,document,"clarity","script","YOUR_PROJECT_ID");
}

setTimeout(loadClarity, 3000);
```

---

### 5. Social Proof Notifications

#### Custom Social Proof Toast

```javascript
(function() {
  var notifications = [
    { name: 'Sarah from New York', action: 'signed up', time: '2 minutes ago' },
    { name: 'James from London', action: 'purchased', time: '5 minutes ago' },
    { name: 'Maria from Toronto', action: 'signed up', time: '8 minutes ago' }
  ];

  var SHOW_DELAY = 8000;      // First notification after 8s
  var DISPLAY_TIME = 4000;     // Show for 4 seconds
  var INTERVAL = 15000;        // Time between notifications
  var index = 0;

  function showNotification() {
    if (index >= notifications.length) return;
    var n = notifications[index];

    var toast = document.createElement('div');
    toast.className = 'social-proof-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<strong>' + n.name + '</strong> ' + n.action + ' <span>' + n.time + '</span>';
    toast.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:9998;font-size:14px;transform:translateY(100px);opacity:0;transition:all 0.3s ease;';

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(function() {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    // Animate out and remove
    setTimeout(function() {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
      setTimeout(function() { toast.remove(); }, 300);
    }, DISPLAY_TIME);

    index++;
  }

  setTimeout(function() {
    showNotification();
    setInterval(showNotification, INTERVAL);
  }, SHOW_DELAY);
})();
```

---

### 6. Cookie Consent

#### Custom Cookie Consent Banner

```javascript
(function() {
  var COOKIE_NAME = 'cookie_consent';

  if (getCookie(COOKIE_NAME)) {
    if (getCookie(COOKIE_NAME) === 'accepted') {
      loadTrackingScripts();
    }
    return;
  }

  var banner = document.createElement('div');
  banner.id = 'cookie-consent';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML = `
    <div class="cookie-content">
      <p>We use cookies to improve your experience and analyze site traffic.
         <a href="/privacy" target="_blank">Privacy Policy</a></p>
      <div class="cookie-actions">
        <button id="cookie-accept" class="cookie-btn-accept">Accept All</button>
        <button id="cookie-reject" class="cookie-btn-reject">Reject Non-Essential</button>
      </div>
    </div>
  `;
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#1e293b;color:#f8fafc;padding:16px 24px;z-index:10000;font-size:14px;';

  document.body.appendChild(banner);

  document.getElementById('cookie-accept').addEventListener('click', function() {
    setCookie(COOKIE_NAME, 'accepted', 365);
    banner.remove();
    loadTrackingScripts();
  });

  document.getElementById('cookie-reject').addEventListener('click', function() {
    setCookie(COOKIE_NAME, 'rejected', 365);
    banner.remove();
  });

  function loadTrackingScripts() {
    // Only load analytics/tracking after consent
    loadGA4();
    loadHotjar();
    loadMetaPixel();
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + value + '; expires=' + expires + '; path=/; SameSite=Lax';
  }
})();
```

#### Cookiebot Integration

```html
<script id="Cookiebot" src="https://consent.cookiebot.com/uc.js"
  data-cbid="YOUR_DOMAIN_GROUP_ID"
  data-blockingmode="auto"
  type="text/javascript" async></script>

<!-- Scripts that require consent use data-cookieconsent attribute -->
<script type="text/plain" data-cookieconsent="statistics"
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

---

### 7. Custom Event Tracking

#### Scroll Depth Tracking

```javascript
(function() {
  var milestones = [25, 50, 75, 100];
  var tracked = {};

  function getScrollPercent() {
    var h = document.documentElement;
    var b = document.body;
    var st = h.scrollTop || b.scrollTop;
    var sh = (h.scrollHeight || b.scrollHeight) - h.clientHeight;
    return Math.round((st / sh) * 100);
  }

  window.addEventListener('scroll', function() {
    var percent = getScrollPercent();
    milestones.forEach(function(m) {
      if (percent >= m && !tracked[m]) {
        tracked[m] = true;
        trackEvent('scroll_depth', { depth: m + '%' });
      }
    });
  }, { passive: true });
})();
```

#### CTA Click Tracking

```javascript
document.querySelectorAll('[data-track-cta]').forEach(function(el) {
  el.addEventListener('click', function() {
    trackEvent('cta_click', {
      cta_text: el.textContent.trim(),
      cta_location: el.dataset.trackCta,
      cta_href: el.href || null
    });
  });
});
```

#### Form Interaction Tracking

```javascript
(function() {
  var forms = document.querySelectorAll('form[data-track-form]');

  forms.forEach(function(form) {
    var formName = form.dataset.trackForm;
    var started = false;

    // Track form start (first field interaction)
    form.querySelectorAll('input, textarea, select').forEach(function(field) {
      field.addEventListener('focus', function() {
        if (!started) {
          started = true;
          trackEvent('form_start', { form_name: formName });
        }
      }, { once: true });
    });

    // Track form submission
    form.addEventListener('submit', function() {
      trackEvent('form_submit', { form_name: formName });
    });

    // Track form abandonment
    window.addEventListener('beforeunload', function() {
      if (started) {
        trackEvent('form_abandon', { form_name: formName });
      }
    });
  });
})();
```

#### Video Engagement Tracking

```javascript
document.querySelectorAll('video[data-track-video]').forEach(function(video) {
  var videoName = video.dataset.trackVideo;
  var quartiles = { 25: false, 50: false, 75: false, 100: false };

  video.addEventListener('play', function() {
    trackEvent('video_play', { video_name: videoName });
  });

  video.addEventListener('pause', function() {
    trackEvent('video_pause', {
      video_name: videoName,
      percent_watched: Math.round((video.currentTime / video.duration) * 100) + '%'
    });
  });

  video.addEventListener('timeupdate', function() {
    var percent = Math.round((video.currentTime / video.duration) * 100);
    [25, 50, 75, 100].forEach(function(q) {
      if (percent >= q && !quartiles[q]) {
        quartiles[q] = true;
        trackEvent('video_progress', { video_name: videoName, milestone: q + '%' });
      }
    });
  });
});
```

---

### 8. A/B Test Variant Code

See [abtest-framework.md](./abtest-framework.md) for complete implementation patterns.

```javascript
// Minimal variant injection
(function() {
  var variant = getCookie('ab_test') || (Math.random() < 0.5 ? 'a' : 'b');
  setCookie('ab_test', variant, 30);
  document.documentElement.setAttribute('data-variant', variant);

  // CSS-driven variants
  // [data-variant="b"] .hero-headline { /* variant styles */ }
})();
```

---

## Script Loading Best Practices

### async vs defer vs module

| Attribute | Download | Execute | Order Preserved | Use For |
|-----------|----------|---------|----------------|---------|
| (none) | Blocks parsing | Immediately | Yes | Never for injected scripts |
| `async` | Parallel | When ready | No | Independent scripts (analytics) |
| `defer` | Parallel | After DOM parsed | Yes | App code that needs DOM |
| `type="module"` | Parallel | After DOM parsed | Yes | Modern ES module code |

### Dynamic Script Insertion Pattern

```javascript
function loadScript(src, options) {
  return new Promise(function(resolve, reject) {
    var script = document.createElement('script');
    script.src = src;
    script.async = true;

    if (options && options.id) script.id = options.id;
    if (options && options.attrs) {
      Object.keys(options.attrs).forEach(function(key) {
        script.setAttribute(key, options.attrs[key]);
      });
    }

    script.onload = resolve;
    script.onerror = function() {
      console.warn('Failed to load script: ' + src);
      reject(new Error('Script load failed: ' + src));
    };

    document.head.appendChild(script);
  });
}

// Usage
loadScript('https://cdn.example.com/widget.js')
  .then(function() { /* Initialize widget */ })
  .catch(function() { /* Fallback behavior */ });
```

### Loading Order

```
Phase 1 (Immediate): Critical page functionality
  └── Inline <script> in <head> (only if absolutely necessary)

Phase 2 (After DOM): Core application code
  └── <script src="app.js" defer>

Phase 3 (Async): Analytics and essential tracking
  └── <script src="analytics.js" async>

Phase 4 (Delayed 3-5s): Nice-to-have widgets
  └── Chat widgets, heatmaps, social proof
  └── Load via setTimeout or requestIdleCallback

Phase 5 (On interaction): Heavy optional tools
  └── Video players, full chat initialization
  └── Load via IntersectionObserver or event listeners
```

---

## Performance-Safe Injection Template

### Using requestIdleCallback

```javascript
// Load non-critical scripts when browser is idle
function loadWhenIdle(fn) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(fn, { timeout: 5000 });
  } else {
    setTimeout(fn, 3000); // Fallback for Safari
  }
}

loadWhenIdle(function() {
  loadScript('https://static.hotjar.com/c/hotjar-XXXXX.js');
});

loadWhenIdle(function() {
  loadChatWidget();
});
```

### Using IntersectionObserver Triggers

```javascript
// Load scripts only when a section becomes visible
function loadOnVisible(selector, loadFn) {
  var target = document.querySelector(selector);
  if (!target) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        loadFn();
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '200px' }); // 200px before visible

  observer.observe(target);
}

// Load testimonial carousel JS only when testimonials section is near
loadOnVisible('#testimonials', function() {
  loadScript('/js/carousel.js');
});

// Load video player only when video section is near
loadOnVisible('#demo-video', function() {
  loadScript('https://player.vimeo.com/api/player.js');
});
```

---

## Data Layer / Event Bus Pattern

Use a centralized event bus for clean event handling across all injected scripts:

```javascript
// Initialize data layer / event bus
window.siteEvents = window.siteEvents || [];

// Generic tracking function used throughout the page
function trackEvent(eventName, eventData) {
  var event = {
    event: eventName,
    data: eventData || {},
    timestamp: Date.now(),
    page: window.location.pathname
  };

  // Push to data layer
  window.siteEvents.push(event);

  // Forward to GA4 (if loaded)
  if (typeof gtag === 'function') {
    gtag('event', eventName, eventData);
  }

  // Forward to Meta Pixel (if loaded)
  if (typeof fbq === 'function') {
    fbq('trackCustom', eventName, eventData);
  }

  // Debug mode logging
  if (window.__DEBUG_TRACKING) {
    console.log('[Track]', eventName, eventData);
  }
}

// Process any events that were queued before scripts loaded
function processEventQueue() {
  window.siteEvents.forEach(function(event) {
    // Re-dispatch to newly loaded analytics
  });
}
```

---

## Content Security Policy (CSP) Considerations

When adding third-party scripts, update the Content-Security-Policy header:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self'
    https://www.googletagmanager.com
    https://connect.facebook.net
    https://static.hotjar.com
    https://widget.intercom.io
    https://www.clarity.ms
    'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self'
    https://www.google-analytics.com
    https://region1.google-analytics.com
    https://*.hotjar.com
    https://*.intercom.io;
  frame-src 'self'
    https://www.youtube.com
    https://player.vimeo.com;
  font-src 'self' https://fonts.gstatic.com;
```

### CSP Best Practices for Landing Pages

- **Avoid `unsafe-eval`** — use `unsafe-inline` only when necessary (most third-party scripts require it)
- **Use nonce-based CSP** for inline scripts when possible: `script-src 'nonce-randomValue'`
- **Audit third-party domains** — only allowlist domains you actually use
- **Use report-uri** to monitor violations without blocking: `Content-Security-Policy-Report-Only`
- **Test changes** in report-only mode before enforcing

---

## Debug Mode Pattern

Enable verbose logging for tracking and injected scripts via URL parameter:

```javascript
// Enable debug mode with ?debug_tracking=true in the URL
(function() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('debug_tracking') === 'true') {
    window.__DEBUG_TRACKING = true;

    // Override trackEvent to log all events
    var originalTrack = window.trackEvent;
    window.trackEvent = function(name, data) {
      console.group('%c[Tracking Event]', 'color: #2563eb; font-weight: bold;');
      console.log('Event:', name);
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('Timestamp:', new Date().toISOString());
      console.log('Page:', window.location.pathname);
      console.groupEnd();

      if (originalTrack) originalTrack(name, data);
    };

    // Log all script loads
    var originalLoadScript = window.loadScript;
    if (originalLoadScript) {
      window.loadScript = function(src, options) {
        console.log('%c[Script Load]', 'color: #059669;', src);
        return originalLoadScript(src, options);
      };
    }

    // Show debug banner
    var debugBanner = document.createElement('div');
    debugBanner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fbbf24;color:#1e293b;text-align:center;padding:4px;font-size:12px;z-index:99999;font-family:monospace;';
    debugBanner.textContent = 'TRACKING DEBUG MODE — Check console for events';
    document.body.prepend(debugBanner);

    console.log('%c=== Tracking Debug Mode Enabled ===', 'color: #2563eb; font-size: 16px; font-weight: bold;');
    console.log('All tracking events will be logged to console.');
    console.log('Remove ?debug_tracking=true from URL to disable.');
  }
})();
```

---

## Script Tag Templates Quick Reference

### Consolidated Template

```html
<!-- === PHASE 1: Cookie Consent (blocks tracking until consent) === -->
<script>
  // Inline cookie consent logic (see Cookie Consent section above)
</script>

<!-- === PHASE 2: Core Analytics (async, fires after consent) === -->
<!-- GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>

<!-- === PHASE 3: Data Layer === -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');

  // Centralized trackEvent function
  function trackEvent(name, data) { /* see Data Layer section */ }
</script>

<!-- === PHASE 4: Deferred app code === -->
<script src="/js/app.js" defer></script>

<!-- === PHASE 5: Delayed third-party (chat, heatmaps, social proof) === -->
<script>
  // Load after idle or 5-second delay
  function loadWhenIdle(fn) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn, { timeout: 5000 });
    } else {
      setTimeout(fn, 3000);
    }
  }

  loadWhenIdle(function() { /* Load Hotjar/Clarity */ });
  loadWhenIdle(function() { /* Load Chat widget */ });
  loadWhenIdle(function() { /* Load Social proof */ });
</script>

<!-- === Debug Mode === -->
<script>
  // Debug mode activation (see Debug Mode section above)
</script>
```
