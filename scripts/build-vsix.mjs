import { execSync } from 'child_process';
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const readmePath = resolve(root, 'README.md');
const marketplacePath = resolve(root, 'README_MARKETPLACE.md');
const backupPath = resolve(root, 'README_GITHUB.bak');

// Backup GitHub README
copyFileSync(readmePath, backupPath);

try {
  // Replace with marketplace README
  const marketContent = readFileSync(marketplacePath, 'utf8');
  writeFileSync(readmePath, marketContent);

  // Build VSIX
  execSync('npx vsce package', { cwd: root, stdio: 'inherit' });
} finally {
  // Restore GitHub README
  copyFileSync(backupPath, readmePath);
  if (existsSync(backupPath)) {
    import('fs').then(fs => fs.unlinkSync(backupPath));
  }
}
