import { DefaultReporter } from 'vitest/reporters';
import { getTests, getFullName } from '@vitest/runner/utils';

export default class SummaryReporter extends DefaultReporter {
  // Silence per-file output
  onTestModuleEnd() {}

  // Silence per-test failure output during run
  onTestCaseResult() {}
  onTestSuiteResult() {}

  // Silence console.log forwarding from tests
  onUserConsoleLog() {}

  // Print a concise failed test list + summary table
  reportSummary(files, errors) {
    const failedTests = getTests(files).filter(t => t.result?.state === 'fail');

    if (failedTests.length > 0) {
      this.log(`\n Failed Tests:`);
      for (const test of failedTests) {
        const filePath = this.relative(test.file.filepath);
        this.log(`  \x1b[31m✗\x1b[0m ${getFullName(test)} \x1b[2m(${filePath})\x1b[0m`);
      }
      this.log('');
    }

    this.reportTestSummary(files, errors);
  }
}
