/**
 * ensure-native-bindings.cjs
 *
 * Ensures platform-specific native bindings are available for the build.
 * Addresses npm bug #4828 where optional dependencies generated on one platform
 * may not resolve correctly on another platform during CI builds.
 *
 * Run this in prebuild on CI to ensure lightningcss Linux bindings are present.
 */

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const REQUIRED_BINDING = 'lightningcss-linux-x64-gnu';
const REQUIRED_VERSION = '1.30.2';

function log(message) {
  console.log(`[ensure-native-bindings] ${message}`);
}

function isCI() {
  return process.env.CI === 'true' || process.env.CF_PAGES === '1';
}

function isLinux() {
  return os.platform() === 'linux';
}

function bindingExists() {
  const bindingPath = path.join(__dirname, '..', 'node_modules', REQUIRED_BINDING);
  return fs.existsSync(bindingPath);
}

function getInstalledVersion() {
  try {
    const pkgPath = path.join(__dirname, '..', 'node_modules', REQUIRED_BINDING, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      return pkg.version;
    }
  } catch (e) {
    return null;
  }
  return null;
}

function installBinding() {
  log(`Installing ${REQUIRED_BINDING}@${REQUIRED_VERSION}...`);
  try {
    execSync(`npm install ${REQUIRED_BINDING}@${REQUIRED_VERSION} --no-save --force`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    log('Installation complete.');
  } catch (error) {
    log(`Warning: Installation via npm failed, trying direct download...`);
    // Fallback: use npm pack and extract
    try {
      execSync(`npm pack ${REQUIRED_BINDING}@${REQUIRED_VERSION}`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      const tarball = `${REQUIRED_BINDING}-${REQUIRED_VERSION}.tgz`;
      const targetDir = path.join(__dirname, '..', 'node_modules', REQUIRED_BINDING);
      fs.mkdirSync(targetDir, { recursive: true });
      execSync(`tar -xzf ${tarball} -C ${targetDir} --strip-components=1`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      fs.unlinkSync(path.join(__dirname, '..', tarball));
      log('Fallback installation complete.');
    } catch (fallbackError) {
      console.error(`[ensure-native-bindings] FATAL: Could not install ${REQUIRED_BINDING}`);
      console.error(fallbackError.message);
      process.exit(1);
    }
  }
}

function main() {
  log(`Platform: ${os.platform()}, CI: ${isCI()}`);

  // Only run on Linux (CI environment)
  if (!isLinux()) {
    log('Not running on Linux, skipping native binding check.');
    return;
  }

  // Check if binding exists
  if (bindingExists()) {
    const installedVersion = getInstalledVersion();
    log(`Found ${REQUIRED_BINDING}@${installedVersion || 'unknown'}`);

    if (installedVersion === REQUIRED_VERSION) {
      log('Correct version already installed.');
      return;
    }

    log(`Version mismatch: need ${REQUIRED_VERSION}, have ${installedVersion}`);
  } else {
    log(`${REQUIRED_BINDING} not found in node_modules.`);
  }

  installBinding();

  // Verify installation
  if (bindingExists() && getInstalledVersion() === REQUIRED_VERSION) {
    log('Verification passed.');
  } else {
    console.error(`[ensure-native-bindings] FATAL: Verification failed after installation.`);
    process.exit(1);
  }
}

main();
