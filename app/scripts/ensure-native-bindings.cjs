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
const BINARY_FILENAME = 'lightningcss.linux-x64-gnu.node';

// lightningcss resolves its optionalDependencies from its own nested node_modules
// NOT from the top-level node_modules (npm bug #4828)
const NESTED_PATH = path.join(__dirname, '..', 'node_modules', 'lightningcss', 'node_modules', REQUIRED_BINDING);
const TOP_LEVEL_PATH = path.join(__dirname, '..', 'node_modules', REQUIRED_BINDING);

function log(message) {
  console.log(`[ensure-native-bindings] ${message}`);
}

function isCI() {
  return process.env.CI === 'true' || process.env.CF_PAGES === '1';
}

function isLinux() {
  return os.platform() === 'linux';
}

function binaryExistsAtPath(basePath) {
  // Check if the actual native .node binary exists, not just the directory
  const binaryPath = path.join(basePath, BINARY_FILENAME);
  return fs.existsSync(binaryPath);
}

function bindingExists() {
  // Check nested path first (where lightningcss actually looks)
  return binaryExistsAtPath(NESTED_PATH) || binaryExistsAtPath(TOP_LEVEL_PATH);
}

function getNestedBindingVersion() {
  try {
    const pkgPath = path.join(NESTED_PATH, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      return pkg.version;
    }
  } catch (e) {
    return null;
  }
  return null;
}

function getInstalledVersion() {
  // Check nested path first (priority)
  const nestedVersion = getNestedBindingVersion();
  if (nestedVersion) return nestedVersion;

  // Fall back to top-level
  try {
    const pkgPath = path.join(TOP_LEVEL_PATH, 'package.json');
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
  log(`Installing ${REQUIRED_BINDING}@${REQUIRED_VERSION} to nested path...`);

  // Ensure the parent directory exists
  const nestedParent = path.join(__dirname, '..', 'node_modules', 'lightningcss', 'node_modules');
  fs.mkdirSync(nestedParent, { recursive: true });

  // Use npm pack to download and extract directly to nested location
  try {
    const appDir = path.join(__dirname, '..');

    // Download the package tarball
    execSync(`npm pack ${REQUIRED_BINDING}@${REQUIRED_VERSION}`, {
      stdio: 'inherit',
      cwd: appDir
    });

    const tarball = `${REQUIRED_BINDING}-${REQUIRED_VERSION}.tgz`;
    const tarballPath = path.join(appDir, tarball);

    // Create the nested target directory
    fs.mkdirSync(NESTED_PATH, { recursive: true });

    // Extract to nested location
    execSync(`tar -xzf "${tarball}" -C "${NESTED_PATH}" --strip-components=1`, {
      stdio: 'inherit',
      cwd: appDir
    });

    // Clean up tarball
    fs.unlinkSync(tarballPath);

    log(`Installed to nested path: ${NESTED_PATH}`);
  } catch (error) {
    console.error(`[ensure-native-bindings] FATAL: Could not install ${REQUIRED_BINDING}`);
    console.error(error.message);
    process.exit(1);
  }
}

function main() {
  log(`Platform: ${os.platform()}, CI: ${isCI()}`);

  // Only run on Linux (CI environment)
  if (!isLinux()) {
    log('Not running on Linux, skipping native binding check.');
    return;
  }

  // Check if binding exists at nested path (where lightningcss actually resolves)
  const nestedVersion = getNestedBindingVersion();
  const nestedBinaryExists = binaryExistsAtPath(NESTED_PATH);

  log(`Nested path: ${NESTED_PATH}`);
  log(`Package.json version: ${nestedVersion || 'not found'}`);
  log(`Binary exists: ${nestedBinaryExists}`);

  if (nestedVersion && nestedBinaryExists) {
    log(`Found ${REQUIRED_BINDING}@${nestedVersion} with binary at nested path`);

    if (nestedVersion === REQUIRED_VERSION) {
      log('Correct version with binary already installed at nested path.');
      return;
    }

    log(`Version mismatch: need ${REQUIRED_VERSION}, have ${nestedVersion}`);
  } else if (nestedVersion && !nestedBinaryExists) {
    log(`CRITICAL: package.json found but native binary is MISSING - will reinstall`);
    // Clean up incomplete installation
    try {
      fs.rmSync(NESTED_PATH, { recursive: true, force: true });
      log(`Removed incomplete installation at ${NESTED_PATH}`);
    } catch (e) {
      log(`Warning: Could not clean up incomplete installation: ${e.message}`);
    }
  } else {
    log(`${REQUIRED_BINDING} not found at nested path: ${NESTED_PATH}`);
  }

  installBinding();

  // Verify installation at nested path - check BOTH version AND binary
  const verifyVersion = getNestedBindingVersion();
  const verifyBinary = binaryExistsAtPath(NESTED_PATH);

  if (verifyVersion === REQUIRED_VERSION && verifyBinary) {
    log('Verification passed - nested path installation complete with binary.');
  } else {
    console.error(`[ensure-native-bindings] FATAL: Verification failed.`);
    console.error(`  Expected version: ${REQUIRED_VERSION}, got: ${verifyVersion}`);
    console.error(`  Binary exists: ${verifyBinary}`);
    console.error(`  Binary path: ${path.join(NESTED_PATH, BINARY_FILENAME)}`);
    process.exit(1);
  }
}

main();
