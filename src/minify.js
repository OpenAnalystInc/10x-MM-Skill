/**
 * 10x Minifier — Program-First Architecture
 *
 * Minifies HTML, CSS, and JS using real libraries (not AI estimation).
 *
 * Usage:
 *   node minify.js <project-name>
 *   node minify.js --file <path>
 */

const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, '..', 'projects');

/**
 * Minify HTML string
 */
async function minifyHtml(html) {
  const { minify } = require('html-minifier-terser');
  return minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    minifyCSS: true,
    minifyJS: true,
    sortAttributes: true,
    sortClassName: true,
  });
}

/**
 * Minify CSS string
 */
function minifyCss(css) {
  const CleanCSS = require('clean-css');
  const result = new CleanCSS({
    level: 2,
    returnPromise: false
  }).minify(css);

  if (result.errors.length > 0) {
    throw new Error(`CSS minification errors: ${result.errors.join(', ')}`);
  }

  return result.styles;
}

/**
 * Minify JS string
 */
async function minifyJs(js) {
  const { minify } = require('terser');
  const result = await minify(js, {
    compress: { drop_console: false, passes: 2 },
    mangle: true,
    format: { comments: false }
  });
  return result.code;
}

/**
 * Minify all files in a project's build directory
 */
async function minifyProject(projectName) {
  const buildDir = path.join(PROJECTS_DIR, projectName, 'build');

  if (!fs.existsSync(buildDir)) {
    throw new Error(`Build directory not found: ${buildDir}`);
  }

  const results = { files: [], totalSaved: 0 };

  // Minify HTML files
  const htmlFiles = findFiles(buildDir, /\.html$/);
  for (const file of htmlFiles) {
    const original = fs.readFileSync(file, 'utf8');
    const minified = await minifyHtml(original);
    fs.writeFileSync(file, minified);
    const saved = original.length - minified.length;
    results.files.push({ file: path.relative(buildDir, file), type: 'html', originalSize: original.length, minifiedSize: minified.length, saved });
    results.totalSaved += saved;
  }

  // Minify CSS files
  const cssFiles = findFiles(buildDir, /\.css$/);
  for (const file of cssFiles) {
    const original = fs.readFileSync(file, 'utf8');
    const minified = minifyCss(original);
    fs.writeFileSync(file, minified);
    const saved = original.length - minified.length;
    results.files.push({ file: path.relative(buildDir, file), type: 'css', originalSize: original.length, minifiedSize: minified.length, saved });
    results.totalSaved += saved;
  }

  // Minify JS files
  const jsFiles = findFiles(buildDir, /\.js$/);
  for (const file of jsFiles) {
    const original = fs.readFileSync(file, 'utf8');
    const minified = await minifyJs(original);
    fs.writeFileSync(file, minified);
    const saved = original.length - minified.length;
    results.files.push({ file: path.relative(buildDir, file), type: 'js', originalSize: original.length, minifiedSize: minified.length, saved });
    results.totalSaved += saved;
  }

  return results;
}

function findFiles(dir, pattern) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, pattern));
    } else if (pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node minify.js <project-name>');
    process.exit(0);
  }

  (async () => {
    try {
      const results = await minifyProject(args[0]);

      console.log('Minification Results:');
      console.log('─'.repeat(60));

      for (const f of results.files) {
        const pct = ((f.saved / f.originalSize) * 100).toFixed(1);
        console.log(`  ${f.file}: ${(f.originalSize / 1024).toFixed(1)}KB → ${(f.minifiedSize / 1024).toFixed(1)}KB (-${pct}%)`);
      }

      console.log('─'.repeat(60));
      console.log(`  Total saved: ${(results.totalSaved / 1024).toFixed(1)} KB`);
    } catch (err) {
      console.error('Minification failed:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = { minifyHtml, minifyCss, minifyJs, minifyProject };
