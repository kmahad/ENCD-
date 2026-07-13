const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Desktop-based Vercel Build Script Starting ---');
console.log('Current directory:', process.cwd());

try {
  // Go to root directory (two folders up from apps/desktop)
  const rootDir = path.resolve(__dirname, '../..');
  console.log('Monorepo root directory:', rootDir);

  console.log('1. Installing dependencies from root...');
  execSync('pnpm install', { cwd: rootDir, stdio: 'inherit' });

  console.log('2. Building @encrypter/crypto-core...');
  execSync('pnpm --filter @encrypter/crypto-core build', { cwd: rootDir, stdio: 'inherit' });

  console.log('3. Building @encrypter/web...');
  execSync('pnpm --filter @encrypter/web build', { cwd: rootDir, stdio: 'inherit' });

  console.log('4. Copying apps/web/dist to apps/desktop/dist...');
  const srcDist = path.join(rootDir, 'apps/web/dist');
  const destDist = path.resolve(__dirname, 'dist');
  
  if (fs.existsSync(destDist)) {
    fs.rmSync(destDist, { recursive: true, force: true });
  }
  fs.mkdirSync(destDist, { recursive: true });

  // Recursive copy helper
  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  copyDir(srcDist, destDist);

  console.log('5. Verifying apps/desktop/dist contents:', fs.readdirSync(destDist));
  console.log('--- Desktop-based Vercel Build Script Finished Successfully ---');
} catch (error) {
  console.error('--- Build Script Failed! ---');
  console.error(error);
  process.exit(1);
}
