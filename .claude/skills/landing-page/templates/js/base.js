// 10x Landing Page — Base JavaScript (Template-Generated)
// Program-first: this code runs as-is, no AI generation needed

(function() {
  'use strict';

  // ──────── Mobile Navigation ────────
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('active');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu when clicking a nav link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  // ──────── Smooth Scroll ────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ──────── Scroll Animations ────────
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  } else {
    // Fallback: show all elements immediately
    document.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('visible'));
  }

  // ──────── Form Handling ────────
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const formData = new FormData(this);
      const data = Object.fromEntries(formData.entries());
      const submitBtn = this.querySelector('[type="submit"]');

      // Show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
      }

      // Dispatch custom event for tracking
      this.dispatchEvent(new CustomEvent('form-submit', {
        bubbles: true,
        detail: { formName: this.getAttribute('toolname') || this.id, data }
      }));

      // Reset after delay (actual submission handled by WebMCP or custom handler)
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText || 'Submit';
        }
      }, 2000);
    });
  });

  // ──────── WebMCP Initialization ────────
  if (typeof WebMCP !== 'undefined') {
    try {
      const mcp = new WebMCP();

      // Register all interactive elements as tools
      document.querySelectorAll('[toolname]').forEach(el => {
        const toolName = el.getAttribute('toolname');
        const toolDesc = el.getAttribute('tooldescription') || toolName;

        mcp.registerTool({
          name: toolName,
          description: toolDesc,
          element: el
        });
      });
    } catch (err) {
      // WebMCP init failed silently — page still works
    }
  }

})();
