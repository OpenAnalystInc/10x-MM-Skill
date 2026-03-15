/**
 * 10x HTML Inliner — Program-First Architecture
 *
 * Takes a multi-file build (HTML + CSS + JS) and produces a single
 * self-contained HTML file ready for deployment via inlineHtml API.
 *
 * Usage:
 *   node inline.js <project-name>
 *   node inline.js <input-dir> <output-file>
 *
 * As module:
 *   const { inlineProject, inlineDir } = require('./inline');
 */

const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, '..', 'projects');

/**
 * Inline all assets from a project's build directory
 * Returns a single self-contained HTML string
 */
function inlineProject(projectName) {
  const buildDir = path.join(PROJECTS_DIR, projectName, 'build');
  return inlineDir(buildDir);
}

/**
 * Inline all assets from a directory containing index.html
 */
function inlineDir(buildDir) {
  const indexPath = path.join(buildDir, 'index.html');

  if (!fs.existsSync(indexPath)) {
    throw new Error(`No index.html found in ${buildDir}`);
  }

  let html = fs.readFileSync(indexPath, 'utf8');

  // Inline CSS files
  html = html.replace(
    /<link\s+[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gi,
    (match, href) => {
      if (href.startsWith('http')) return match; // Keep external CDN links
      const cssPath = path.resolve(buildDir, href);
      if (fs.existsSync(cssPath)) {
        const css = fs.readFileSync(cssPath, 'utf8');
        return `<style>\n${css}\n</style>`;
      }
      return match;
    }
  );

  // Inline JS files
  html = html.replace(
    /<script\s+[^>]*src="([^"]+)"([^>]*)><\/script>/gi,
    (match, src, attrs) => {
      if (src.startsWith('http')) return match; // Keep external CDN scripts
      const jsPath = path.resolve(buildDir, src);
      if (fs.existsSync(jsPath)) {
        const js = fs.readFileSync(jsPath, 'utf8');
        // Preserve defer/async attributes as comments for reference
        return `<script>\n${js}\n</script>`;
      }
      return match;
    }
  );

  // Inline SVG images (favicon, icons)
  html = html.replace(
    /href="([^"]+\.svg)"/gi,
    (match, href) => {
      if (href.startsWith('http') || href.startsWith('data:')) return match;
      const svgPath = path.resolve(buildDir, href);
      if (fs.existsSync(svgPath)) {
        const svg = fs.readFileSync(svgPath, 'utf8');
        const encoded = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
        return `href="${encoded}"`;
      }
      return match;
    }
  );

  // Inline small images as data URIs (< 100KB)
  html = html.replace(
    /src="((?!http|data:)[^"]+\.(png|jpg|jpeg|gif|webp|svg))"/gi,
    (match, src, ext) => {
      const imgPath = path.resolve(buildDir, src);
      if (fs.existsSync(imgPath)) {
        const stats = fs.statSync(imgPath);
        if (stats.size < 100 * 1024) { // Only inline < 100KB
          const data = fs.readFileSync(imgPath);
          const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
          return `src="data:${mime};base64,${data.toString('base64')}"`;
        }
      }
      return match;
    }
  );

  return html;
}

/**
 * Inline and write to file
 */
function inlineToFile(projectName, outputPath) {
  const html = inlineProject(projectName);
  const outPath = outputPath || path.join(PROJECTS_DIR, projectName, `${projectName}-inline.html`);
  fs.writeFileSync(outPath, html);
  return { path: outPath, size: Buffer.byteLength(html, 'utf8') };
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node inline.js <project-name> [output-file]');
    process.exit(0);
  }

  try {
    const projectName = args[0];
    const outputPath = args[1];

    // Check if first arg is a directory or project name
    if (fs.existsSync(args[0]) && fs.statSync(args[0]).isDirectory()) {
      const html = inlineDir(args[0]);
      const out = args[1] || path.join(args[0], 'inline.html');
      fs.writeFileSync(out, html);
      console.log(`Inlined: ${out} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
    } else {
      const result = inlineToFile(projectName, outputPath);
      console.log(`Inlined: ${result.path} (${(result.size / 1024).toFixed(1)} KB)`);
    }
  } catch (err) {
    console.error('Inline failed:', err.message);
    process.exit(1);
  }
}

module.exports = { inlineProject, inlineDir, inlineToFile };
