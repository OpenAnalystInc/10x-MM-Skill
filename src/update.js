const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = function update() {
  const cwd = process.cwd();
  const templateDir = path.join(__dirname, '..', 'template');

  if (!fs.existsSync(path.join(cwd, '.claude'))) {
    console.error('No .claude/ directory found. Run "10x-mm init" first.');
    process.exit(1);
  }

  // Always preserve these user-specific files
  const preserve = ['.env', '.mcp.json'];
  const backups = {};

  // Back up user files
  for (const file of preserve) {
    const filePath = path.join(cwd, file);
    if (fs.existsSync(filePath)) {
      backups[file] = fs.readFileSync(filePath);
    }
  }

  // Copy template (overwrite everything)
  const entries = fs.readdirSync(templateDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(templateDir, entry.name);
    const destPath = path.join(cwd, entry.name);

    if (preserve.includes(entry.name)) continue;

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
      console.log(`  Updated ${entry.name}/`);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  Updated ${entry.name}`);
    }
  }

  // Restore user files
  for (const [file, content] of Object.entries(backups)) {
    fs.writeFileSync(path.join(cwd, file), content);
    console.log(`  Preserved ${file}`);
  }

  console.log('\nUpdate complete. Your .env and .mcp.json were preserved.');
  console.log('Run /health in Claude Code to verify everything works.');
};
