/**
 * 10x PDF Generator — Program-First Architecture
 *
 * Converts HTML pages to PDF using Puppeteer (headless Chrome).
 * NO manual PDF construction — renders the same HTML the user sees.
 *
 * Usage:
 *   node pdf.js <input-html> [output-pdf] [options]
 *   node pdf.js --project <project-name>
 *
 * As module:
 *   const { htmlToPdf, projectToPdf, urlToPdf } = require('./pdf');
 */

const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, '..', 'projects');

// ──────────────────────────────────────────────
// Core PDF Functions
// ──────────────────────────────────────────────

/**
 * Convert an HTML string to PDF buffer
 *
 * @param {string} html - Full HTML string
 * @param {object} options - PDF options
 * @returns {Promise<Buffer>} PDF buffer
 */
async function htmlToPdf(html, options = {}) {
  const puppeteer = require('puppeteer');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({
      width: options.width || 1440,
      height: options.height || 900,
      deviceScaleFactor: options.scale || 2
    });

    // Load HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: options.timeout || 30000
    });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // Optional: wait for specific selector
    if (options.waitFor) {
      await page.waitForSelector(options.waitFor, { timeout: 10000 });
    }

    // Generate PDF
    const pdfOptions = {
      format: options.format || 'A4',
      printBackground: true,
      margin: options.margin || {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: options.headerFooter || false,
      preferCSSPageSize: options.cssPageSize || false,
    };

    // Support landscape
    if (options.landscape) {
      pdfOptions.landscape = true;
    }

    // Support custom page size
    if (options.width && options.height) {
      delete pdfOptions.format;
      pdfOptions.width = `${options.pageWidth || 210}mm`;
      pdfOptions.height = `${options.pageHeight || 297}mm`;
    }

    const pdfBuffer = await page.pdf(pdfOptions);
    return pdfBuffer;

  } finally {
    await browser.close();
  }
}

/**
 * Convert an HTML file to PDF
 */
async function fileToPdf(inputPath, outputPath, options = {}) {
  const html = fs.readFileSync(inputPath, 'utf8');

  // Resolve relative paths in HTML (images, CSS, etc.)
  const baseDir = path.dirname(path.resolve(inputPath));
  const resolvedHtml = resolveLocalPaths(html, baseDir);

  const pdfBuffer = await htmlToPdf(resolvedHtml, options);

  const outPath = outputPath || inputPath.replace(/\.html?$/i, '.pdf');
  fs.writeFileSync(outPath, pdfBuffer);

  return outPath;
}

/**
 * Convert a project's build output to PDF
 */
async function projectToPdf(projectName, options = {}) {
  const projectRoot = path.join(PROJECTS_DIR, projectName);
  const buildDir = path.join(projectRoot, 'build');
  const indexPath = path.join(buildDir, 'index.html');

  if (!fs.existsSync(indexPath)) {
    throw new Error(`No build output found at ${indexPath}. Run build first.`);
  }

  // Read HTML and inline all assets (CSS, JS) for PDF
  let html = fs.readFileSync(indexPath, 'utf8');
  html = inlineAssets(html, buildDir);

  const outputPath = options.output || path.join(projectRoot, `${projectName}.pdf`);
  const pdfBuffer = await htmlToPdf(html, options);
  fs.writeFileSync(outputPath, pdfBuffer);

  console.log(`PDF generated: ${outputPath}`);
  console.log(`Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

  return outputPath;
}

/**
 * Convert a live URL to PDF
 */
async function urlToPdf(url, outputPath, options = {}) {
  const puppeteer = require('puppeteer');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: options.width || 1440,
      height: options.height || 900,
      deviceScaleFactor: options.scale || 2
    });

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: options.timeout || 30000
    });

    await page.evaluateHandle('document.fonts.ready');

    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      printBackground: true,
      margin: options.margin || { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });

    fs.writeFileSync(outputPath, pdfBuffer);
    return outputPath;

  } finally {
    await browser.close();
  }
}

/**
 * Generate a report PDF from markdown content
 */
async function markdownToPdf(markdownContent, outputPath, options = {}) {
  const { marked } = require('marked');

  const htmlBody = marked.parse(markdownContent);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.7;
      color: #1e293b;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    h1 { font-size: 2rem; margin: 2rem 0 1rem; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    h2 { font-size: 1.5rem; margin: 1.5rem 0 0.75rem; color: #1e293b; }
    h3 { font-size: 1.25rem; margin: 1.25rem 0 0.5rem; color: #334155; }
    p { margin: 0.75rem 0; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    blockquote { border-left: 4px solid #3b82f6; margin: 1rem 0; padding: 0.5rem 1rem; background: #eff6ff; }
    ul, ol { margin: 0.5rem 0; padding-left: 1.5rem; }
    li { margin: 0.25rem 0; }
    img { max-width: 100%; height: auto; }
    a { color: #2563eb; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0; }

    .header-meta { color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }

    @media print {
      body { padding: 0; }
      pre { white-space: pre-wrap; }
    }
  </style>
</head>
<body>
  <div class="header-meta">
    ${options.title ? `<strong>${options.title}</strong><br>` : ''}
    Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    ${options.author ? ` | ${options.author}` : ''}
  </div>
  ${htmlBody}
</body>
</html>`;

  const pdfBuffer = await htmlToPdf(html, {
    format: 'A4',
    margin: { top: '25mm', right: '20mm', bottom: '25mm', left: '20mm' },
    ...options
  });

  fs.writeFileSync(outputPath, pdfBuffer);
  return outputPath;
}

// ──────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────

/**
 * Resolve relative file:// paths for local HTML rendering
 */
function resolveLocalPaths(html, baseDir) {
  // Convert relative CSS links to inline
  return html.replace(
    /<link\s+rel="stylesheet"\s+href="([^"]+)"/g,
    (match, href) => {
      if (href.startsWith('http')) return match;
      const cssPath = path.join(baseDir, href);
      if (fs.existsSync(cssPath)) {
        const css = fs.readFileSync(cssPath, 'utf8');
        return `<style>${css}</style`;
      }
      return match;
    }
  );
}

/**
 * Inline all local CSS and JS into the HTML
 */
function inlineAssets(html, baseDir) {
  // Inline CSS
  html = html.replace(
    /<link\s+rel="stylesheet"\s+href="([^"]+)"[^>]*>/g,
    (match, href) => {
      if (href.startsWith('http')) return match;
      const filePath = path.join(baseDir, href);
      if (fs.existsSync(filePath)) {
        return `<style>\n${fs.readFileSync(filePath, 'utf8')}\n</style>`;
      }
      return match;
    }
  );

  // Inline JS
  html = html.replace(
    /<script\s+src="([^"]+)"[^>]*><\/script>/g,
    (match, src) => {
      if (src.startsWith('http')) return match;
      const filePath = path.join(baseDir, src);
      if (fs.existsSync(filePath)) {
        return `<script>\n${fs.readFileSync(filePath, 'utf8')}\n</script>`;
      }
      return match;
    }
  );

  // Convert relative image paths to data URIs
  html = html.replace(
    /src="((?!http|data:)[^"]+\.(png|jpg|jpeg|gif|svg|webp))"/g,
    (match, src, ext) => {
      const filePath = path.join(baseDir, src);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        return `src="data:${mime};base64,${data.toString('base64')}"`;
      }
      return match;
    }
  );

  return html;
}

// ──────────────────────────────────────────────
// CLI Mode
// ──────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('10x PDF Generator — Program-First Architecture');
    console.log('');
    console.log('Usage:');
    console.log('  node pdf.js <input.html> [output.pdf]     Convert HTML file to PDF');
    console.log('  node pdf.js --project <name>               Convert project build to PDF');
    console.log('  node pdf.js --url <url> <output.pdf>       Convert URL to PDF');
    console.log('  node pdf.js --md <input.md> <output.pdf>   Convert Markdown to PDF');
    console.log('');
    console.log('Options:');
    console.log('  --format A4|Letter|Legal     Page format (default: A4)');
    console.log('  --landscape                  Landscape orientation');
    console.log('  --scale <n>                  Device scale factor (default: 2)');
    process.exit(0);
  }

  (async () => {
    try {
      const options = {};

      // Parse options
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--format') { options.format = args[++i]; continue; }
        if (args[i] === '--landscape') { options.landscape = true; continue; }
        if (args[i] === '--scale') { options.scale = parseFloat(args[++i]); continue; }
      }

      if (args[0] === '--project') {
        const result = await projectToPdf(args[1], options);
        console.log(`Done: ${result}`);

      } else if (args[0] === '--url') {
        const result = await urlToPdf(args[1], args[2], options);
        console.log(`Done: ${result}`);

      } else if (args[0] === '--md') {
        const md = fs.readFileSync(args[1], 'utf8');
        const result = await markdownToPdf(md, args[2] || args[1].replace(/\.md$/, '.pdf'), options);
        console.log(`Done: ${result}`);

      } else {
        const result = await fileToPdf(args[0], args[1], options);
        console.log(`Done: ${result}`);
      }
    } catch (err) {
      console.error('PDF generation failed:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = { htmlToPdf, fileToPdf, projectToPdf, urlToPdf, markdownToPdf };
