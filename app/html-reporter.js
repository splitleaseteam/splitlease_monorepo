import { DefaultReporter } from 'vitest/reporters';
import { getTests, getFullName } from '@vitest/runner/utils';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export default class HtmlReporter extends DefaultReporter {
  // Silence all console output — SummaryReporter handles that
  onInit(ctx) { this.ctx = ctx; }
  log() {}
  reportSummary(files, errors) {
    this.generateHtmlReport(files, errors);
  }

  generateHtmlReport(files) {
    const allTests = getTests(files);
    const total = allTests.length;
    const passed = allTests.filter(t => t.result?.state === 'pass').length;
    const failed = allTests.filter(t => t.result?.state === 'fail').length;
    const skipped = allTests.filter(t => t.result?.state === 'skip' || t.mode === 'skip' || t.mode === 'todo').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    const failedTests = allTests.filter(t => t.result?.state === 'fail');
    const errorFamilies = this.classifyErrors(failedTests);
    const allGreen = failed === 0;

    const html = this.buildHtml({ total, passed, failed, skipped, passRate, errorFamilies, allGreen });
    const outPath = resolve(process.cwd(), 'test-results.html');
    writeFileSync(outPath, html, 'utf-8');
    process.stdout.write(`\n  HTML report: ${pathToFileURL(outPath).href}\n\n`);
  }

  classifyErrors(failedTests) {
    const families = new Map();

    for (const test of failedTests) {
      const error = test.result?.errors?.[0] || {};
      const errorType = error.name || 'Error';
      const normalizedMsg = this.normalizeMessage(error.message || 'Unknown error');
      const key = `${errorType}::${normalizedMsg}`;
      const friendlyLabel = this.getFriendlyLabel(errorType, normalizedMsg);

      if (!families.has(key)) {
        families.set(key, {
          errorType,
          normalizedMessage: normalizedMsg,
          friendlyLabel,
          tests: [],
        });
      }

      families.get(key).tests.push({
        name: getFullName(test),
        filePath: test.file?.filepath || 'unknown',
        duration: test.result?.duration ?? 0,
        error,
      });
    }

    // Sort by count descending
    return [...families.values()].sort((a, b) => b.tests.length - a.tests.length);
  }

  normalizeMessage(msg) {
    return msg
      .replace(/\[.*?\]/g, '[...]')              // arrays → [...]
      .replace(/'[^']*'/g, "'...'")               // single-quoted strings → '...'
      .replace(/"[^"]*"/g, "'...'")               // double-quoted strings → '...'
      .replace(/\b\d+(\.\d+)?\b/g, 'N')           // numbers → N
      .replace(/\s+/g, ' ')                        // collapse whitespace
      .trim();
  }

  getFriendlyLabel(errorType, normalizedMsg) {
    if (errorType === 'AssertionError' || errorType === 'AssertionError' || errorType === 'AssertError') {
      if (normalizedMsg.includes('deeply equal') || normalizedMsg.includes('toEqual'))
        return 'Deep equality mismatch';
      if (normalizedMsg.includes('toBe') && (normalizedMsg.includes('true') || normalizedMsg.includes('false')))
        return 'Boolean assertion failed';
      if (normalizedMsg.includes('NaN'))
        return 'NaN handling error';
      if (normalizedMsg.includes('toBeNull') || normalizedMsg.includes('null'))
        return 'Null assertion failed';
      if (normalizedMsg.includes('toBeDefined') || normalizedMsg.includes('undefined'))
        return 'Undefined value error';
    }
    if (normalizedMsg.includes('deeply equal') || normalizedMsg.includes('toEqual'))
      return 'Deep equality mismatch';
    if (normalizedMsg.includes('NaN'))
      return 'NaN handling error';
    return null;
  }

  buildHtml({ total, passed, failed, skipped, passRate, errorFamilies, allGreen }) {
    const timestamp = new Date().toLocaleString();
    const passRateNum = parseFloat(passRate);
    const barColor = passRateNum === 100 ? '#34c759' : passRateNum >= 80 ? '#ff9f0a' : '#ff3b30';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Test Results</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: #f5f5f7;
    color: #1d1d1f;
    line-height: 1.5;
    padding: 40px 24px;
    max-width: 960px;
    margin: 0 auto;
  }
  h1 { font-size: 28px; font-weight: 600; margin-bottom: 4px; }
  .timestamp { font-size: 13px; color: #86868b; margin-bottom: 32px; }

  /* Stat Cards */
  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 12px;
  }
  .stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .stat-card .value {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .stat-card .label {
    font-size: 13px;
    color: #86868b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }
  .stat-card.total .value { color: #1d1d1f; }
  .stat-card.passed .value { color: #34c759; }
  .stat-card.failed .value { color: #ff3b30; }
  .stat-card.skipped .value { color: #ff9f0a; }

  /* Pass Rate Bar */
  .pass-rate-bar {
    background: #e5e5ea;
    border-radius: 6px;
    height: 8px;
    margin-bottom: 40px;
    overflow: hidden;
  }
  .pass-rate-bar .fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.3s ease;
  }

  /* Celebration State */
  .celebration {
    text-align: center;
    padding: 80px 20px;
  }
  .celebration .checkmark {
    font-size: 64px;
    margin-bottom: 16px;
  }
  .celebration h2 {
    font-size: 24px;
    font-weight: 600;
    color: #34c759;
  }
  .celebration p {
    font-size: 15px;
    color: #86868b;
    margin-top: 8px;
  }

  /* Error Family Card */
  .family-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .family-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .family-badge {
    background: #ff3b30;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 12px;
    min-width: 28px;
    text-align: center;
  }
  .family-type {
    font-size: 15px;
    font-weight: 600;
    color: #1d1d1f;
  }
  .family-label {
    font-size: 13px;
    color: #86868b;
    margin-left: auto;
  }
  .family-message {
    font-size: 13px;
    color: #6e6e73;
    font-family: 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
    background: #f5f5f7;
    padding: 8px 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    word-break: break-word;
  }

  /* Test Row */
  details.test-row {
    border-top: 1px solid #f0f0f2;
  }
  details.test-row summary {
    padding: 12px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    list-style: none;
  }
  details.test-row summary::-webkit-details-marker { display: none; }
  details.test-row summary::before {
    content: '\\25B6';
    font-size: 10px;
    color: #86868b;
    transition: transform 0.2s;
    flex-shrink: 0;
  }
  details.test-row[open] summary::before {
    transform: rotate(90deg);
  }
  .test-name { font-weight: 500; }
  .test-duration {
    font-size: 12px;
    color: #86868b;
    margin-left: auto;
    flex-shrink: 0;
  }
  .test-details {
    padding: 0 0 16px 18px;
  }
  .test-filepath {
    font-size: 12px;
    color: #86868b;
    font-family: 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
    margin-bottom: 12px;
  }
  .diff-block {
    font-size: 12px;
    font-family: 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
    background: #fafafa;
    border: 1px solid #e5e5ea;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .diff-block .expected { color: #34c759; }
  .diff-block .received { color: #ff3b30; }
  .stack-trace {
    font-size: 11px;
    font-family: 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
    color: #86868b;
    background: #fafafa;
    border: 1px solid #e5e5ea;
    border-radius: 8px;
    padding: 12px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 200px;
    overflow-y: auto;
  }

  @media (max-width: 600px) {
    .stats { grid-template-columns: repeat(2, 1fr); }
    body { padding: 24px 16px; }
  }
</style>
</head>
<body>
  <h1>Test Results</h1>
  <p class="timestamp">${this.escapeHtml(timestamp)}</p>

  <div class="stats">
    <div class="stat-card total"><div class="value">${total}</div><div class="label">Total</div></div>
    <div class="stat-card passed"><div class="value">${passed}</div><div class="label">Passed</div></div>
    <div class="stat-card failed"><div class="value">${failed}</div><div class="label">Failed</div></div>
    <div class="stat-card skipped"><div class="value">${skipped}</div><div class="label">Skipped</div></div>
  </div>
  <div class="pass-rate-bar"><div class="fill" style="width:${passRate}%;background:${barColor}"></div></div>

  ${allGreen ? this.buildCelebration(total) : this.buildErrorFamilies(errorFamilies)}
</body>
</html>`;
  }

  buildCelebration(total) {
    return `<div class="celebration">
    <div class="checkmark">&#10003;</div>
    <h2>All ${total} tests passing</h2>
    <p>Everything looks great. No failures to report.</p>
  </div>`;
  }

  buildErrorFamilies(families) {
    return families.map(family => {
      const label = family.friendlyLabel
        ? `<span class="family-label">${this.escapeHtml(family.friendlyLabel)}</span>`
        : '';

      const testRows = family.tests.map(t => {
        const duration = t.duration >= 1000
          ? `${(t.duration / 1000).toFixed(1)}s`
          : `${Math.round(t.duration)}ms`;

        const diff = this.buildDiff(t.error);
        const stack = t.error.stack
          ? `<div class="stack-trace">${this.escapeHtml(this.cleanStack(t.error.stack))}</div>`
          : '';

        return `<details class="test-row">
        <summary>
          <span class="test-name">${this.escapeHtml(t.name)}</span>
          <span class="test-duration">${duration}</span>
        </summary>
        <div class="test-details">
          <div class="test-filepath">${this.escapeHtml(t.filePath)}</div>
          ${diff}${stack}
        </div>
      </details>`;
      }).join('\n      ');

      return `<div class="family-card">
    <div class="family-header">
      <span class="family-badge">${family.tests.length}</span>
      <span class="family-type">${this.escapeHtml(family.errorType)}</span>
      ${label}
    </div>
    <div class="family-message">${this.escapeHtml(family.normalizedMessage)}</div>
    ${testRows}
  </div>`;
    }).join('\n  ');
  }

  buildDiff(error) {
    const expected = error.expected;
    const actual = error.actual;

    if (expected === undefined && actual === undefined) {
      if (error.message) {
        return `<div class="diff-block">${this.escapeHtml(error.message)}</div>`;
      }
      return '';
    }

    const expectedStr = this.formatValue(expected);
    const actualStr = this.formatValue(actual);

    return `<div class="diff-block"><span class="expected">- Expected: ${this.escapeHtml(expectedStr)}</span>\n<span class="received">+ Received: ${this.escapeHtml(actualStr)}</span></div>`;
  }

  formatValue(val) {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'string') return `"${val}"`;
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  }

  cleanStack(stack) {
    return stack
      .split('\n')
      .filter(line => !line.includes('node_modules'))
      .slice(0, 15)
      .join('\n');
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
