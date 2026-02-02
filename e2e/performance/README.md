# Split Lease Performance Testing Suite

Comprehensive performance testing framework for the Split Lease application.

## Overview

This directory contains two types of performance tests:

1. **API Response Time Tests** (`api-response-times.test.ts`) - Playwright-based tests that measure individual API endpoint response times and detect regressions.

2. **Load Testing** (`load-testing/`) - k6-based load tests that simulate multiple concurrent users to test system behavior under load.

## Quick Start

### API Response Time Tests (Playwright)

```bash
# From project root
npx playwright test e2e/performance/api-response-times.test.ts

# Run with specific browser
npx playwright test e2e/performance/api-response-times.test.ts --project=chromium

# Run with UI mode
npx playwright test e2e/performance/api-response-times.test.ts --ui
```

### Load Tests (k6)

```bash
# Install k6 first (see load-testing/README.md)

# Run smoke test
k6 run e2e/performance/load-testing/scenarios/listing-search.js

# Run full load test
k6 run e2e/performance/load-testing/run-all-scenarios.js
```

## Directory Structure

```
performance/
|-- README.md                           # This file
|-- api-response-times.test.ts          # Playwright performance tests
|-- load-testing/
    |-- README.md                       # Load testing documentation
    |-- k6.config.js                    # k6 configuration
    |-- run-all-scenarios.js            # Comprehensive load test
    |-- scenarios/
        |-- user-registration-login.js  # Auth flow tests
        |-- listing-search.js           # Search tests
        |-- proposal-submission.js      # Proposal tests
        |-- realtime-messaging.js       # Messaging tests
```

## Performance Thresholds

### API Response Times (P95)

| Endpoint Category | Threshold |
|-------------------|-----------|
| Page Load | 5000ms |
| Listing Search | 2000ms |
| Listing Detail | 1500ms |
| Proposal Create | 3000ms |
| Proposal List | 2000ms |
| Message Send | 1000ms |
| Message List | 1500ms |
| Authentication | 2000ms |

### Error Rates

| Condition | Target |
|-----------|--------|
| Normal Load | < 1% |
| Stress Load | < 5% |
| Spike Load | < 15% |

## When to Run Performance Tests

### API Response Time Tests

- **On PR Merge**: Automated via CI to catch regressions
- **After Deployments**: Verify production performance
- **During Development**: When optimizing specific endpoints

### Load Tests

- **Before Major Releases**: Validate system capacity
- **After Infrastructure Changes**: Verify scaling behavior
- **Periodically**: Weekly or monthly baseline checks
- **On Demand**: When investigating performance issues

## CI/CD Integration

### Playwright Performance Tests

Add to `.github/workflows/e2e.yml`:

```yaml
- name: Run Performance Tests
  run: npx playwright test e2e/performance/api-response-times.test.ts
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
```

### k6 Load Tests

See `load-testing/README.md` for GitHub Actions configuration.

## Interpreting Results

### Playwright Test Output

```
API Response Times - Page Load Performance
  Home Page load time should be within threshold
    Min: 850ms
    Max: 1200ms
    Mean: 980ms
    P95: 1150ms
    PASS (threshold: 5000ms)
```

### k6 Test Output

```
     data_received..................: 15 MB  156 kB/s
     data_sent......................: 2.1 MB 22 kB/s
     http_req_duration..............: avg=234ms min=45ms max=2.1s p(95)=890ms
     http_req_failed................: 0.50%
     iterations.....................: 5000   52/s

     checks.........................: 98.50% 4925 out of 5000
```

## Troubleshooting

### Slow Test Execution

- Reduce sample size for development testing
- Use `--workers=1` for consistent measurements
- Ensure no other applications are consuming resources

### High Variance in Results

- Run more samples for statistical significance
- Check for background processes
- Verify network stability

### Threshold Failures

1. Check recent code changes
2. Review database query performance
3. Check for cold starts in edge functions
4. Monitor infrastructure metrics

## Contributing

When adding new performance tests:

1. Follow existing naming conventions
2. Include clear threshold documentation
3. Add appropriate tags for filtering
4. Update this README with new test descriptions
