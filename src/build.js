/**
 * 10x Build Pipeline — Program-First Architecture
 *
 * Unified build command that orchestrates:
 *   template-engine → minify → inline → (optional: pdf)
 *
 * Usage:
 *   node build.js <project-name> [--inline] [--minify] [--pdf]
 */

const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, '..', 'projects');

async function buildProject(projectName, options = {}) {
  const projectRoot = path.join(PROJECTS_DIR, projectName);
  const buildDir = path.join(projectRoot, 'build');

  if (!fs.existsSync(projectRoot)) {
    throw new Error(`Project "${projectName}" not found at ${projectRoot}`);
  }

  const results = { steps: [] };

  // Step 1: Template rendering
  console.log('Step 1: Rendering templates...');
  const { renderPage } = require('./template-engine');

  const templateName = options.template || 'landing';

  try {
    const rendered = renderPage(projectName, templateName);

    fs.mkdirSync(path.join(buildDir, 'css'), { recursive: true });
    fs.mkdirSync(path.join(buildDir, 'js'), { recursive: true });

    fs.writeFileSync(path.join(buildDir, 'index.html'), rendered.html);
    if (rendered.css) fs.writeFileSync(path.join(buildDir, 'css', 'styles.css'), rendered.css);
    if (rendered.js) fs.writeFileSync(path.join(buildDir, 'js', 'main.js'), rendered.js);

    results.steps.push({ step: 'template', status: 'done' });
  } catch (err) {
    // If template not found, check if build/index.html already exists
    if (fs.existsSync(path.join(buildDir, 'index.html'))) {
      console.log('  Using existing build/index.html (no template override)');
      results.steps.push({ step: 'template', status: 'skipped', reason: 'existing build' });
    } else {
      throw err;
    }
  }

  // Step 2: Minify (optional)
  if (options.minify) {
    console.log('Step 2: Minifying...');
    const { minifyProject } = require('./minify');
    const minResult = await minifyProject(projectName);
    results.steps.push({ step: 'minify', status: 'done', saved: minResult.totalSaved });
    console.log(`  Saved ${(minResult.totalSaved / 1024).toFixed(1)} KB`);
  }

  // Step 3: Inline (optional)
  if (options.inline) {
    console.log('Step 3: Inlining assets...');
    const { inlineToFile } = require('./inline');
    const inlineResult = inlineToFile(projectName);
    results.steps.push({ step: 'inline', status: 'done', size: inlineResult.size });
    results.inlinePath = inlineResult.path;
    console.log(`  Output: ${inlineResult.path} (${(inlineResult.size / 1024).toFixed(1)} KB)`);
  }

  // Step 4: PDF (optional)
  if (options.pdf) {
    console.log('Step 4: Generating PDF...');
    const { projectToPdf } = require('./pdf');
    const pdfPath = await projectToPdf(projectName);
    results.steps.push({ step: 'pdf', status: 'done', path: pdfPath });
  }

  // Step 5: Update project status
  const statusPath = path.join(projectRoot, 'status.json');
  if (fs.existsSync(statusPath)) {
    const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    status.phases.build = {
      status: 'completed',
      completedAt: new Date().toISOString(),
      options: { minify: !!options.minify, inline: !!options.inline, pdf: !!options.pdf }
    };
    status.lastBuild = new Date().toISOString();
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  }

  return results;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node build.js <project-name> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --minify     Minify HTML/CSS/JS');
    console.log('  --inline     Create single inline HTML file');
    console.log('  --pdf        Generate PDF version');
    console.log('  --all        Enable all options');
    console.log('  --template   Template name (default: landing)');
    process.exit(0);
  }

  const projectName = args.find(a => !a.startsWith('--'));
  const options = {
    minify: args.includes('--minify') || args.includes('--all'),
    inline: args.includes('--inline') || args.includes('--all'),
    pdf: args.includes('--pdf') || args.includes('--all'),
    template: (() => { const i = args.indexOf('--template'); return i >= 0 ? args[i + 1] : 'landing'; })()
  };

  (async () => {
    try {
      console.log(`\n=== Building ${projectName} ===\n`);
      const results = await buildProject(projectName, options);
      console.log('\n=== Build Complete ===\n');
      results.steps.forEach(s => {
        console.log(`  ${s.status === 'done' ? '+' : '-'} ${s.step}: ${s.status}`);
      });
    } catch (err) {
      console.error('Build failed:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = { buildProject };
