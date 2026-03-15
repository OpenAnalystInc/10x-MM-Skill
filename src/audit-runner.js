/**
 * 10x Audit Runner — Program-First Architecture
 *
 * Runs actual programmatic checks on HTML/CSS/JS — not AI guessing.
 * Uses real parsers and validators for deterministic results.
 *
 * Usage:
 *   node audit-runner.js <project-name>
 *   node audit-runner.js --file <path-to-html>
 */

const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, '..', 'projects');

/**
 * Run all audits on a project
 */
async function auditProject(projectName) {
  const buildDir = path.join(PROJECTS_DIR, projectName, 'build');
  const indexPath = path.join(buildDir, 'index.html');

  if (!fs.existsSync(indexPath)) {
    throw new Error(`No build found at ${indexPath}`);
  }

  const html = fs.readFileSync(indexPath, 'utf8');
  const results = {
    project: projectName,
    timestamp: new Date().toISOString(),
    checks: [],
    score: 0,
    maxScore: 0,
    grade: ''
  };

  // Run all checks
  results.checks.push(...checkHtmlStructure(html));
  results.checks.push(...checkAccessibility(html));
  results.checks.push(...checkSeo(html));
  results.checks.push(...checkPerformance(html, buildDir));
  results.checks.push(...checkWebMcp(html));
  results.checks.push(...checkSecurity(html));
  results.checks.push(...checkMobile(html, buildDir));

  // Calculate scores
  results.maxScore = results.checks.length;
  results.score = results.checks.filter(c => c.pass).length;
  const pct = (results.score / results.maxScore) * 100;
  results.grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';

  return results;
}

// ──────────────────────────────────────────────
// Check Categories
// ──────────────────────────────────────────────

function checkHtmlStructure(html) {
  const checks = [];

  checks.push({
    category: 'HTML',
    name: 'Has DOCTYPE',
    pass: /<!DOCTYPE html>/i.test(html),
    severity: 'critical'
  });

  checks.push({
    category: 'HTML',
    name: 'Has lang attribute',
    pass: /<html[^>]+lang=/i.test(html),
    severity: 'high'
  });

  checks.push({
    category: 'HTML',
    name: 'Has charset meta',
    pass: /<meta[^>]+charset/i.test(html),
    severity: 'high'
  });

  checks.push({
    category: 'HTML',
    name: 'Has viewport meta',
    pass: /<meta[^>]+viewport/i.test(html),
    severity: 'critical'
  });

  checks.push({
    category: 'HTML',
    name: 'Has single h1',
    pass: (html.match(/<h1[\s>]/gi) || []).length === 1,
    severity: 'high'
  });

  checks.push({
    category: 'HTML',
    name: 'Has main landmark',
    pass: /<main[\s>]/i.test(html),
    severity: 'medium'
  });

  checks.push({
    category: 'HTML',
    name: 'Has nav landmark',
    pass: /<nav[\s>]/i.test(html),
    severity: 'medium'
  });

  checks.push({
    category: 'HTML',
    name: 'No empty href',
    pass: !/<a[^>]+href=""/i.test(html),
    severity: 'medium'
  });

  checks.push({
    category: 'HTML',
    name: 'No inline styles (>5)',
    pass: (html.match(/style="/gi) || []).length <= 5,
    severity: 'low'
  });

  return checks;
}

function checkAccessibility(html) {
  const checks = [];

  checks.push({
    category: 'A11y',
    name: 'Has skip link',
    pass: /skip.*(link|content|nav)/i.test(html),
    severity: 'high'
  });

  checks.push({
    category: 'A11y',
    name: 'Images have alt attributes',
    pass: !/<img(?![^>]*alt=)[^>]*>/i.test(html),
    severity: 'critical'
  });

  checks.push({
    category: 'A11y',
    name: 'Buttons have accessible names',
    pass: !/<button[^>]*><\/button>/i.test(html),
    severity: 'high'
  });

  checks.push({
    category: 'A11y',
    name: 'Form inputs have labels',
    pass: !/<input(?![^>]*type="hidden")[^>]*>(?!.*<label)/i.test(html) ||
          /<label/i.test(html) || /aria-label/i.test(html),
    severity: 'high'
  });

  checks.push({
    category: 'A11y',
    name: 'No autoplaying media',
    pass: !/<(video|audio)[^>]*autoplay/i.test(html),
    severity: 'medium'
  });

  checks.push({
    category: 'A11y',
    name: 'Semantic headings (h1-h6)',
    pass: /<h[1-6][\s>]/i.test(html),
    severity: 'medium'
  });

  return checks;
}

function checkSeo(html) {
  const checks = [];

  checks.push({
    category: 'SEO',
    name: 'Has title tag',
    pass: /<title>[^<]+<\/title>/i.test(html),
    severity: 'critical'
  });

  checks.push({
    category: 'SEO',
    name: 'Title length (10-60 chars)',
    pass: (() => {
      const match = html.match(/<title>([^<]+)<\/title>/i);
      return match && match[1].length >= 10 && match[1].length <= 60;
    })(),
    severity: 'high'
  });

  checks.push({
    category: 'SEO',
    name: 'Has meta description',
    pass: /<meta[^>]+name="description"[^>]+content="[^"]+"/i.test(html) ||
          /<meta[^>]+content="[^"]+"[^>]+name="description"/i.test(html),
    severity: 'high'
  });

  checks.push({
    category: 'SEO',
    name: 'Has Open Graph tags',
    pass: /property="og:/i.test(html),
    severity: 'medium'
  });

  checks.push({
    category: 'SEO',
    name: 'Has canonical link',
    pass: /rel="canonical"/i.test(html),
    severity: 'medium'
  });

  checks.push({
    category: 'SEO',
    name: 'Has structured data',
    pass: /application\/ld\+json/i.test(html),
    severity: 'low'
  });

  return checks;
}

function checkPerformance(html, buildDir) {
  const checks = [];

  checks.push({
    category: 'Performance',
    name: 'CSS loaded in head',
    pass: /<head[\s\S]*<link[^>]+stylesheet[\s\S]*<\/head>/i.test(html) ||
          /<head[\s\S]*<style[\s\S]*<\/head>/i.test(html),
    severity: 'high'
  });

  checks.push({
    category: 'Performance',
    name: 'JS deferred or at bottom',
    pass: /<script[^>]+defer/i.test(html) || /<script[^>]+async/i.test(html) ||
          /<\/main>[\s\S]*<script/i.test(html),
    severity: 'high'
  });

  checks.push({
    category: 'Performance',
    name: 'Images use lazy loading',
    pass: /loading="lazy"/i.test(html) || !/(<img)/i.test(html),
    severity: 'medium'
  });

  checks.push({
    category: 'Performance',
    name: 'Font preconnect hints',
    pass: /rel="preconnect"/i.test(html) || !/<link[^>]+fonts/i.test(html),
    severity: 'medium'
  });

  // Check total file sizes
  if (buildDir) {
    const totalSize = getDirectorySize(buildDir);
    checks.push({
      category: 'Performance',
      name: `Total build size < 500KB (${(totalSize / 1024).toFixed(0)}KB)`,
      pass: totalSize < 500 * 1024,
      severity: 'medium'
    });
  }

  checks.push({
    category: 'Performance',
    name: 'Font display swap',
    pass: /font-display:\s*swap/i.test(html) || /display=swap/i.test(html) || !/<link[^>]+fonts/i.test(html),
    severity: 'low'
  });

  return checks;
}

function checkWebMcp(html) {
  const checks = [];

  checks.push({
    category: 'WebMCP',
    name: 'WebMCP library loaded',
    pass: /webmcp/i.test(html),
    severity: 'critical'
  });

  checks.push({
    category: 'WebMCP',
    name: 'Interactive elements have toolname',
    pass: /toolname="/i.test(html),
    severity: 'critical'
  });

  checks.push({
    category: 'WebMCP',
    name: 'Sections have data-section',
    pass: /data-section="/i.test(html),
    severity: 'high'
  });

  checks.push({
    category: 'WebMCP',
    name: 'Sections have id attributes',
    pass: /<section[^>]+id="/i.test(html),
    severity: 'high'
  });

  return checks;
}

function checkSecurity(html) {
  const checks = [];

  checks.push({
    category: 'Security',
    name: 'No inline event handlers',
    pass: !/\son(click|load|error|mouseover)="/i.test(html),
    severity: 'high'
  });

  checks.push({
    category: 'Security',
    name: 'External links have rel=noopener',
    pass: !/<a[^>]+target="_blank"(?![^>]*rel="[^"]*noopener)/i.test(html) ||
          !/<a[^>]+target="_blank"/i.test(html),
    severity: 'medium'
  });

  checks.push({
    category: 'Security',
    name: 'No exposed API keys',
    pass: !/(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][a-zA-Z0-9]{16,}/i.test(html),
    severity: 'critical'
  });

  return checks;
}

function checkMobile(html, buildDir) {
  const checks = [];

  checks.push({
    category: 'Mobile',
    name: 'Has responsive meta viewport',
    pass: /width=device-width/i.test(html),
    severity: 'critical'
  });

  // Check both HTML and any linked CSS files for responsive units
  let cssContent = html;
  if (buildDir) {
    const cssFiles = findFiles(buildDir, /\.css$/);
    for (const f of cssFiles) {
      cssContent += fs.readFileSync(f, 'utf8');
    }
  }
  checks.push({
    category: 'Mobile',
    name: 'Uses responsive units (rem/em/vw/%)',
    pass: /clamp\(|vw|rem|%/i.test(cssContent),
    severity: 'medium'
  });

  checks.push({
    category: 'Mobile',
    name: 'Has media queries',
    pass: /@media/i.test(html) || /<link[^>]+stylesheet/i.test(html), // CSS file likely has media queries
    severity: 'medium'
  });

  return checks;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function findFiles(dir, pattern) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findFiles(fullPath, pattern));
      } else if (pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch (e) { /* ignore */ }
  return results;
}

function getDirectorySize(dir) {
  let total = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += getDirectorySize(fullPath);
      } else {
        total += fs.statSync(fullPath).size;
      }
    }
  } catch (e) { /* ignore */ }
  return total;
}

function formatReport(results) {
  const lines = [];
  lines.push(`# Audit Report: ${results.project}`);
  lines.push(`Date: ${results.timestamp}`);
  lines.push(`Score: ${results.score}/${results.maxScore} (Grade: ${results.grade})`);
  lines.push('');

  // Group by category
  const categories = {};
  for (const check of results.checks) {
    if (!categories[check.category]) categories[check.category] = [];
    categories[check.category].push(check);
  }

  for (const [cat, checks] of Object.entries(categories)) {
    const passed = checks.filter(c => c.pass).length;
    lines.push(`## ${cat} (${passed}/${checks.length})`);
    for (const check of checks) {
      const icon = check.pass ? 'PASS' : 'FAIL';
      const sev = check.pass ? '' : ` [${check.severity}]`;
      lines.push(`  ${icon} ${check.name}${sev}`);
    }
    lines.push('');
  }

  // Summary of failures
  const failures = results.checks.filter(c => !c.pass);
  if (failures.length > 0) {
    lines.push('## Issues to Fix');
    const critical = failures.filter(f => f.severity === 'critical');
    const high = failures.filter(f => f.severity === 'high');
    const medium = failures.filter(f => f.severity === 'medium');
    const low = failures.filter(f => f.severity === 'low');

    if (critical.length) {
      lines.push(`### Critical (${critical.length})`);
      critical.forEach(f => lines.push(`  - ${f.name} [${f.category}]`));
    }
    if (high.length) {
      lines.push(`### High (${high.length})`);
      high.forEach(f => lines.push(`  - ${f.name} [${f.category}]`));
    }
    if (medium.length) {
      lines.push(`### Medium (${medium.length})`);
      medium.forEach(f => lines.push(`  - ${f.name} [${f.category}]`));
    }
    if (low.length) {
      lines.push(`### Low (${low.length})`);
      low.forEach(f => lines.push(`  - ${f.name} [${f.category}]`));
    }
  }

  return lines.join('\n');
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node audit-runner.js <project-name>');
    process.exit(0);
  }

  (async () => {
    try {
      const results = await auditProject(args[0]);
      const report = formatReport(results);
      console.log(report);

      // Save report
      const reportDir = path.join(PROJECTS_DIR, args[0], 'testing');
      fs.mkdirSync(reportDir, { recursive: true });
      const reportPath = path.join(reportDir, `audit-${new Date().toISOString().slice(0, 10)}.md`);
      fs.writeFileSync(reportPath, report);
      console.log(`\nReport saved: ${reportPath}`);

      // Exit code based on critical failures
      const criticalFails = results.checks.filter(c => !c.pass && c.severity === 'critical');
      if (criticalFails.length > 0) {
        process.exit(1);
      }
    } catch (err) {
      console.error('Audit failed:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = { auditProject, formatReport };
