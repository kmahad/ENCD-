const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Vercel Build Script Starting ---');
console.log('Current directory:', process.cwd());
console.log('Files in root:', fs.readdirSync('.'));

try {
  console.log('1. Building @encrypter/crypto-core...');
  execSync('pnpm --filter @encrypter/crypto-core build', { stdio: 'inherit' });

  console.log('2. Building @encrypter/web...');
  execSync('pnpm --filter @encrypter/web build', { stdio: 'inherit' });

  console.log('3. Checking apps/web/dist...');
  if (fs.existsSync('apps/web/dist')) {
    console.log('apps/web/dist contents:', fs.readdirSync('apps/web/dist'));
  } else {
    throw new Error('apps/web/dist does not exist after build!');
  }

  console.log('4. Copying apps/web/dist to root dist...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  fs.mkdirSync('dist', { recursive: true });
  
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
  copyDir('apps/web/dist', 'dist');
  
  console.log('5. Verifying root dist contents:', fs.readdirSync('dist'));
  console.log('--- Vercel Build Script Finished Successfully ---');
} catch (error) {
  console.error('--- Build Script Failed! ---');
  console.error(error);
  process.exit(1);
}
