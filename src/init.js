const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest, options = {}) {
  const { skip = [] } = options;
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (skip.some(s => destPath.endsWith(s))) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, options);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = function init() {
  const cwd = process.cwd();
  const templateDir = path.join(__dirname, '..', 'template');

  if (!fs.existsSync(templateDir)) {
    console.error('Error: template directory not found. Package may be corrupted.');
    process.exit(1);
  }

  const claudeDir = path.join(cwd, '.claude');
  const isUpdate = fs.existsSync(claudeDir);

  if (isUpdate) {
    console.log('Existing .claude/ directory found. Updating skill files...');
    console.log('(Your .env and .mcp.json will be preserved)\n');
  }

  // Files to skip if they already exist (user config)
  const skipIfExists = [];
  if (fs.existsSync(path.join(cwd, '.env'))) {
    skipIfExists.push('.env');
  }
  if (fs.existsSync(path.join(cwd, '.mcp.json'))) {
    skipIfExists.push('.mcp.json');
  }

  // Copy template
  const entries = fs.readdirSync(templateDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(templateDir, entry.name);
    const destPath = path.join(cwd, entry.name);

    if (skipIfExists.includes(entry.name)) {
      console.log(`  Skipped ${entry.name} (already exists)`);
      continue;
    }

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
      console.log(`  Copied ${entry.name}/`);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  Copied ${entry.name}`);
    }
  }

  // Ensure .env.example is always copied (even if .env exists)
  const exampleSrc = path.join(templateDir, '.env.example');
  if (fs.existsSync(exampleSrc)) {
    fs.copyFileSync(exampleSrc, path.join(cwd, '.env.example'));
  }

  // Create .mm/ session tracking directory
  const mmDir = path.join(cwd, '.mm');
  const sessionsDir = path.join(mmDir, 'sessions');
  fs.mkdirSync(sessionsDir, { recursive: true });
  console.log('  Created .mm/sessions/');

  // Write .mm/.gitignore
  const mmGitignore = path.join(mmDir, '.gitignore');
  if (!fs.existsSync(mmGitignore)) {
    fs.writeFileSync(mmGitignore, 'sessions/\n!.gitignore\n');
    console.log('  Created .mm/.gitignore');
  }

  console.log(`
10x Marketing Manager initialized!

Next steps:
  1. Open Claude Code in this directory:  claude
  2. Run /setup to configure your credentials
  3. Run /health to verify your MCP connection
  4. Start creating: "Build me a landing page for..."

You need a 10x.in account. Sign up at https://10x.in if you don't have one.
Your PAT is available in your 10x.in profile settings.
`);
};
