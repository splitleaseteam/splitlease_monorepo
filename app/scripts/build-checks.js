import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, '..');

const stripAnsi = (str) => str.replace(/\u001b\[[0-9;]*m/g, '');

function runCommand(cmd) {
  try {
    const output = execSync(cmd, {
      cwd: appDir,
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '1' },
      maxBuffer: 50 * 1024 * 1024,
    });
    return output.toString();
  } catch (err) {
    return (err.stdout?.toString() ?? '') + (err.stderr?.toString() ?? '');
  }
}

// --- ESLint ---
const eslintRaw = runCommand('npx eslint src/');
const eslintClean = stripAnsi(eslintRaw);
writeFileSync(resolve(appDir, 'lint-report.txt'), eslintClean, 'utf8');

let eslintSummary = '';
const eslintMatch = eslintClean.match(
  /✖\s+(\d+)\s+problems?\s+\((\d+)\s+errors?,\s+(\d+)\s+warnings?\)/
);
if (eslintMatch) {
  const [, , errors, warnings] = eslintMatch;
  eslintSummary =
    Number(errors) > 0
      ? `  \u2716 ESLint: ${errors} errors, ${warnings} warnings`
      : `  \u26A0 ESLint: ${warnings} warnings`;
} else if (eslintClean.trim() === '') {
  eslintSummary = '  \u2714 ESLint: no issues';
} else {
  eslintSummary = '  \u26A0 ESLint: see lint-report.txt for details';
}
eslintSummary += '  \u2192 lint-report.txt';

// --- Knip ---
const knipRaw = runCommand('npx knip');
const knipClean = stripAnsi(knipRaw);
writeFileSync(resolve(appDir, 'knip-report.txt'), knipClean, 'utf8');

let knipParts = [];
const knipSectionRegex = /^(.+?)\s+\((\d+)\)\s*$/gm;
let match;
while ((match = knipSectionRegex.exec(knipClean)) !== null) {
  const label = match[1].trim().toLowerCase().replace(/^unused\s+/, '');
  knipParts.push(`${match[2]} ${label}`);
}

// Check for configuration hints
const hintMatch = knipClean.match(
  /Configuration hints\s*\n([\s\S]*?)(?=\n\n|\nUnused|\n---|\Z)/
);
let hintCount = 0;
if (hintMatch) {
  const hintLines = hintMatch[1]
    .split('\n')
    .filter((l) => l.trim().startsWith('-') || l.trim().startsWith('*'));
  hintCount = hintLines.length;
}

let knipSummary = '';
if (knipParts.length > 0 || hintCount > 0) {
  const parts = [...knipParts];
  if (hintCount > 0) parts.push(`${hintCount} config hints`);
  knipSummary = `  \u26A0 Knip: ${parts.join(', ')}`;
} else if (knipClean.trim() === '') {
  knipSummary = '  \u2714 Knip: no issues';
} else {
  knipSummary = '  \u26A0 Knip: see knip-report.txt for details';
}
knipSummary += '  \u2192 knip-report.txt';

// --- Dashboard ---
const line = '\u2500'.repeat(50);
console.log('');
console.log(line);
console.log('  Build Checks');
console.log(line);
console.log(eslintSummary);
console.log(knipSummary);
console.log(line);
console.log('');

process.exit(0);
