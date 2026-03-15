/**
 * 10x Template Engine — Program-First Architecture
 *
 * Replaces AI-generated HTML with template-based generation.
 * AI provides the DATA (brief, copy, design tokens), code does the BUILDING.
 *
 * Usage:
 *   node template-engine.js <project-name> [template-name]
 *
 * As module:
 *   const { render, renderPage, listTemplates } = require('./template-engine');
 */

const fs = require('fs');
const path = require('path');
const Mustache = require('mustache');

// Paths
const TEMPLATES_DIR = path.join(__dirname, '..', '.claude', 'skills', 'landing-page', 'templates');
const COMPONENTS_DIR = path.join(__dirname, '..', 'components');
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');

// ──────────────────────────────────────────────
// Template Registry
// ──────────────────────────────────────────────

function listTemplates() {
  const templates = {};

  // Page templates
  const pageDir = path.join(TEMPLATES_DIR, 'pages');
  if (fs.existsSync(pageDir)) {
    fs.readdirSync(pageDir).filter(f => f.endsWith('.html')).forEach(f => {
      templates[f.replace('.html', '')] = path.join(pageDir, f);
    });
  }

  return templates;
}

function listComponents() {
  const components = {};
  if (fs.existsSync(COMPONENTS_DIR)) {
    fs.readdirSync(COMPONENTS_DIR).filter(f => f.endsWith('.html')).forEach(f => {
      components[f.replace('.html', '')] = path.join(COMPONENTS_DIR, f);
    });
  }
  return components;
}

// ──────────────────────────────────────────────
// Core Render Functions
// ──────────────────────────────────────────────

/**
 * Render a Mustache template with data
 */
function render(templateStr, data) {
  // Pre-process: resolve {{> component}} partials
  const partials = loadPartials();
  return Mustache.render(templateStr, data, partials);
}

/**
 * Load all component partials for Mustache {{> name}} syntax
 */
function loadPartials() {
  const partials = {};
  const components = listComponents();
  for (const [name, filePath] of Object.entries(components)) {
    partials[name] = fs.readFileSync(filePath, 'utf8');
  }

  // Also load section templates
  const sectionsDir = path.join(TEMPLATES_DIR, 'sections');
  if (fs.existsSync(sectionsDir)) {
    fs.readdirSync(sectionsDir).filter(f => f.endsWith('.html')).forEach(f => {
      const name = f.replace('.html', '');
      partials[`section-${name}`] = fs.readFileSync(path.join(sectionsDir, f), 'utf8');
    });
  }

  return partials;
}

/**
 * Build a complete page from project specs
 *
 * @param {string} projectName
 * @param {string} templateName - Which page template to use (default: 'landing')
 * @returns {{ html: string, css: string, js: string }}
 */
function renderPage(projectName, templateName = 'landing') {
  const projectRoot = path.join(PROJECTS_DIR, projectName);

  // Load all project data
  const data = loadProjectData(projectRoot);

  // Load page template
  const templatePath = path.join(TEMPLATES_DIR, 'pages', `${templateName}.html`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template "${templateName}" not found at ${templatePath}`);
  }

  const template = fs.readFileSync(templatePath, 'utf8');
  const html = render(template, data);

  // Load and render CSS template
  const cssTemplatePath = path.join(TEMPLATES_DIR, 'css', 'base.css');
  let css = '';
  if (fs.existsSync(cssTemplatePath)) {
    const cssTemplate = fs.readFileSync(cssTemplatePath, 'utf8');
    css = render(cssTemplate, data);
  }

  // Load and render JS template
  const jsTemplatePath = path.join(TEMPLATES_DIR, 'js', 'base.js');
  let js = '';
  if (fs.existsSync(jsTemplatePath)) {
    const jsTemplate = fs.readFileSync(jsTemplatePath, 'utf8');
    js = render(jsTemplate, data);
  }

  return { html, css, js };
}

/**
 * Load all project specification files into a single data object
 */
function loadProjectData(projectRoot) {
  const data = {
    year: new Date().getFullYear(),
    timestamp: new Date().toISOString(),
  };

  // Load brief
  const briefPath = path.join(projectRoot, 'requirements', 'brief.json');
  if (fs.existsSync(briefPath)) {
    data.brief = JSON.parse(fs.readFileSync(briefPath, 'utf8'));
    data.projectName = data.brief.projectName || 'Landing Page';
    data.oneLiner = data.brief.summary?.oneLiner || '';
    data.domain = data.brief.domain || 'saas';
  }

  // Load colors
  const colorsPath = path.join(projectRoot, 'design', 'colors.json');
  if (fs.existsSync(colorsPath)) {
    data.colors = JSON.parse(fs.readFileSync(colorsPath, 'utf8'));
  } else {
    data.colors = getDefaultColors();
  }

  // Load typography
  const typographyPath = path.join(projectRoot, 'design', 'typography.json');
  if (fs.existsSync(typographyPath)) {
    data.typography = JSON.parse(fs.readFileSync(typographyPath, 'utf8'));
  } else {
    data.typography = getDefaultTypography();
  }

  // Load copy
  const copyPath = path.join(projectRoot, 'copy', 'page-copy.json');
  if (fs.existsSync(copyPath)) {
    data.copy = JSON.parse(fs.readFileSync(copyPath, 'utf8'));
  }

  // Load sections config
  const sectionsPath = path.join(projectRoot, 'requirements', 'sections.json');
  if (fs.existsSync(sectionsPath)) {
    data.sections = JSON.parse(fs.readFileSync(sectionsPath, 'utf8'));
  }

  // Flatten for Mustache access
  flattenColors(data);
  flattenTypography(data);
  flattenCopy(data);

  return data;
}

function flattenColors(data) {
  const c = data.colors;
  data.colorPrimary = c.brand?.primary || '#2563eb';
  data.colorPrimaryLight = c.brand?.primaryLight || '#3b82f6';
  data.colorPrimaryDark = c.brand?.primaryDark || '#1d4ed8';
  data.colorBg = c.neutral?.background || '#ffffff';
  data.colorSurface = c.neutral?.surface || '#f8fafc';
  data.colorBorder = c.neutral?.border || '#e2e8f0';
  data.colorText = c.neutral?.textPrimary || '#1e293b';
  data.colorTextSecondary = c.neutral?.textSecondary || '#64748b';

  // Accent colors
  data.colorSuccess = c.accent?.success || '#22c55e';
  data.colorWarning = c.accent?.warning || '#f59e0b';
  data.colorError = c.accent?.error || '#ef4444';
}

function flattenTypography(data) {
  const t = data.typography;
  data.fontHeading = t.fonts?.heading || 'Inter';
  data.fontBody = t.fonts?.body || 'Inter';
  data.fontHeadingEncoded = encodeURIComponent(data.fontHeading);
  data.fontBodyEncoded = encodeURIComponent(data.fontBody);
  data.textH1 = t.scale?.h1 || 'clamp(2.5rem, 5vw, 4rem)';
  data.textH2 = t.scale?.h2 || 'clamp(2rem, 4vw, 3rem)';
  data.textH3 = t.scale?.h3 || 'clamp(1.5rem, 3vw, 2rem)';
  data.textBody = t.scale?.body || '1rem';
  data.textSmall = t.scale?.small || '0.875rem';
}

function flattenCopy(data) {
  const c = data.copy || {};
  data.headline = c.headline || '[HEADLINE]';
  data.subheadline = c.subheadline || '[SUBHEADLINE]';
  data.ctaPrimary = c.ctaPrimary || 'Get Started';
  data.ctaSecondary = c.ctaSecondary || 'Learn More';
  data.heroProof = c.heroProof || '';
  data.features = c.features || [];
  data.testimonials = c.testimonials || [];
  data.faqItems = c.faqItems || [];
  data.ctaHeadline = c.ctaHeadline || '[CTA HEADLINE]';
  data.ctaText = c.ctaText || '';
  data.ctaButton = c.ctaButton || 'Get Started Now';
  data.ctaReassurance = c.ctaReassurance || '';
  data.footerText = c.footerText || '';

  // Boolean helpers for Mustache
  data.hasFeatures = data.features.length > 0;
  data.hasTestimonials = data.testimonials.length > 0;
  data.hasFaq = data.faqItems.length > 0;
  data.hasHeroProof = !!data.heroProof;
  data.hasCtaReassurance = !!data.ctaReassurance;
  data.hasFooterText = !!data.footerText;
}

function getDefaultColors() {
  return {
    brand: { primary: '#2563eb', primaryLight: '#3b82f6', primaryDark: '#1d4ed8' },
    neutral: { background: '#ffffff', surface: '#f8fafc', border: '#e2e8f0', textPrimary: '#1e293b', textSecondary: '#64748b' },
    accent: { success: '#22c55e', warning: '#f59e0b', error: '#ef4444' }
  };
}

function getDefaultTypography() {
  return {
    fonts: { heading: 'Inter', body: 'Inter' },
    scale: { h1: 'clamp(2.5rem, 5vw, 4rem)', h2: 'clamp(2rem, 4vw, 3rem)', h3: 'clamp(1.5rem, 3vw, 2rem)', body: '1rem', small: '0.875rem' }
  };
}

// ──────────────────────────────────────────────
// CLI Mode
// ──────────────────────────────────────────────

if (require.main === module) {
  const projectName = process.argv[2];
  const templateName = process.argv[3] || 'landing';

  if (!projectName) {
    console.log('Usage: node template-engine.js <project-name> [template-name]');
    console.log('');
    console.log('Available templates:');
    const templates = listTemplates();
    Object.keys(templates).forEach(t => console.log(`  ${t}`));
    process.exit(0);
  }

  try {
    const result = renderPage(projectName, templateName);

    const buildDir = path.join(PROJECTS_DIR, projectName, 'build');
    fs.mkdirSync(path.join(buildDir, 'css'), { recursive: true });
    fs.mkdirSync(path.join(buildDir, 'js'), { recursive: true });

    fs.writeFileSync(path.join(buildDir, 'index.html'), result.html);
    if (result.css) fs.writeFileSync(path.join(buildDir, 'css', 'styles.css'), result.css);
    if (result.js) fs.writeFileSync(path.join(buildDir, 'js', 'main.js'), result.js);

    console.log(`Built ${projectName} using template "${templateName}"`);
    console.log(`Output: ${buildDir}`);
  } catch (err) {
    console.error('Build failed:', err.message);
    process.exit(1);
  }
}

module.exports = { render, renderPage, renderPage, listTemplates, listComponents, loadProjectData };
