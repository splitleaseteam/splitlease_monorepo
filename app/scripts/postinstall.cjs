/**
 * Postinstall script to fix lightningcss native binding issues on Linux CI
 * This addresses npm's known bug with optional dependencies across platforms
 * https://github.com/npm/cli/issues/4828
 */

const { execSync } = require('child_process');
const os = require('os');

const platform = os.platform();
const arch = os.arch();

// Only run on Linux (CI environments like Cloudflare)
if (platform === 'linux' && arch === 'x64') {
  console.log('📦 Installing Linux-specific native bindings for lightningcss...');
  try {
    execSync('npm install lightningcss-linux-x64-gnu --no-save --ignore-scripts', {
      stdio: 'inherit',
      env: { ...process.env, npm_config_ignore_scripts: 'true' }
    });
    console.log('✅ lightningcss Linux bindings installed successfully');
  } catch (error) {
    console.warn('⚠️ Could not install lightningcss Linux bindings:', error.message);
    // Don't fail the build - the main install might still work
  }
}
