# Split Lease Load Testing

Performance and load testing suite for the Split Lease application using k6.

## Overview

This directory contains load testing scenarios that validate the application's performance under various load conditions. The tests measure response times, throughput, and error rates across critical user journeys.

## Prerequisites

### Install k6

**macOS (Homebrew):**
```bash
brew install k6
```

**Windows (Chocolatey):**
```powershell
choco install k6
```

**Windows (WinGet):**
```powershell
winget install k6 --source winget
```

**Docker:**
```bash
docker pull grafana/k6
```

**Manual Installation:**
Download from [k6.io/docs/get-started/installation](https://k6.io/docs/get-started/installation/)

## Directory Structure

```
load-testing/
|-- k6.config.js                    # Shared configuration and thresholds
|-- run-all-scenarios.js            # Comprehensive load test (all scenarios)
|-- README.md                       # This documentation
|-- scenarios/
|   |-- user-registration-login.js  # Authentication flow tests
|   |-- listing-search.js           # Search and filter tests
|   |-- proposal-submission.js      # Proposal CRUD tests
|   |-- realtime-messaging.js       # Messaging system tests
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Application base URL | `http://localhost:8000` |
| `SUPABASE_URL` | Supabase project URL | (required for API tests) |
| `SUPABASE_FUNCTIONS_URL` | Edge Functions URL | `{SUPABASE_URL}/functions/v1` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | (required for auth) |
| `TEST_GUEST_EMAIL` | Test guest email | `testguest@example.com` |
| `TEST_GUEST_PASSWORD` | Test guest password | `testpassword123` |
| `TEST_HOST_EMAIL` | Test host email | `testhost@example.com` |
| `TEST_HOST_PASSWORD` | Test host password | `testpassword123` |
| `LOAD_PROFILE` | Load profile to use | `load` |

### Load Profiles

| Profile | Description | Duration | Peak VUs |
|---------|-------------|----------|----------|
| `smoke` | Quick sanity check | 1 min | 1 |
| `load` | Normal expected load | ~16 min | 20 |
| `stress` | Push system limits | ~26 min | 150 |
| `spike` | Sudden load increase | ~6 min | 100 |
| `soak` | Extended duration | ~4.2 hours | 20 |

## Running Tests

### Quick Start

```bash
# Run smoke test (quick verification)
k6 run --env BASE_URL=http://localhost:8000 scenarios/listing-search.js

# Run with default load profile
k6 run run-all-scenarios.js

# Run with specific profile
k6 run --env LOAD_PROFILE=stress run-all-scenarios.js
```

### Individual Scenarios

```bash
# Authentication tests
k6 run scenarios/user-registration-login.js

# Search performance
k6 run scenarios/listing-search.js

# Proposal operations
k6 run scenarios/proposal-submission.js

# Messaging performance
k6 run scenarios/realtime-messaging.js
```

### With Full Configuration

```bash
k6 run \
  --env BASE_URL=https://splitlease.com \
  --env SUPABASE_URL=https://your-project.supabase.co \
  --env SUPABASE_ANON_KEY=your-anon-key \
  --env LOAD_PROFILE=load \
  run-all-scenarios.js
```

### Docker

```bash
docker run --rm -i grafana/k6 run - <run-all-scenarios.js

# With environment variables
docker run --rm -i \
  -e BASE_URL=http://host.docker.internal:8000 \
  grafana/k6 run - <run-all-scenarios.js
```

## Output and Reporting

### Console Output

k6 provides real-time metrics in the console during test execution.

### JSON Output

```bash
k6 run --out json=results.json run-all-scenarios.js
```

### HTML Report (via k6 Cloud)

```bash
# Requires k6 Cloud account
k6 cloud run-all-scenarios.js
```

### InfluxDB + Grafana

```bash
k6 run --out influxdb=http://localhost:8086/k6 run-all-scenarios.js
```

## Performance Thresholds

### HTTP Request Duration

| Endpoint | P95 Threshold | P99 Threshold |
|----------|--------------|---------------|
| Listing Search | 2000ms | 4000ms |
| Listing Detail | 1500ms | 3000ms |
| Proposal Create | 3000ms | 5000ms |
| Proposal List | 2000ms | 4000ms |
| Message Send | 1000ms | 2000ms |
| Message List | 1500ms | 3000ms |
| Login | 2000ms | 4000ms |
| Page Load | 5000ms | 8000ms |

### Error Rates

- Overall error rate: < 1% (normal load)
- Overall error rate: < 5% (stress load)
- Authentication errors: < 2%

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run Load Tests
        run: |
          k6 run \
            --env BASE_URL=${{ secrets.STAGING_URL }} \
            --env SUPABASE_URL=${{ secrets.SUPABASE_URL }} \
            --env SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }} \
            --env LOAD_PROFILE=smoke \
            e2e/performance/load-testing/run-all-scenarios.js

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: results.json
```

## Test Scenarios

### 1. User Registration & Login (`user-registration-login.js`)

Tests authentication system performance:
- User login flow
- Token refresh
- User profile retrieval
- Registration (sampled at 10%)

### 2. Listing Search (`listing-search.js`)

Tests search functionality:
- Basic search (no filters)
- Filtered search (borough, price, days)
- Pagination
- Listing detail pages

### 3. Proposal Submission (`proposal-submission.js`)

Tests proposal system:
- Proposal creation
- Listing proposals (guest/host views)
- Proposal status updates
- Concurrent submissions

### 4. Real-time Messaging (`realtime-messaging.js`)

Tests messaging system:
- Sending messages
- Listing threads
- Listing messages in thread
- Mark as read operations

### 5. Comprehensive Test (`run-all-scenarios.js`)

Combines all scenarios with realistic user distribution:
- 30% New users browsing
- 30% Returning guests checking status
- 20% Active bookers creating proposals
- 20% Heavy browsers searching

## Custom Metrics

The tests track custom metrics beyond standard k6 metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `login_duration` | Trend | Login response time |
| `search_duration` | Trend | Search API response time |
| `proposal_duration` | Trend | Proposal create response time |
| `message_duration` | Trend | Message send response time |
| `*_success_rate` | Rate | Success rate per operation |
| `*_errors` | Counter | Error count per operation |

## Troubleshooting

### Common Issues

**1. Authentication Failures**
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Ensure test users exist in the database
- Check that user passwords match

**2. High Error Rates**
- Check if the application is running
- Verify network connectivity
- Review application logs for errors
- Consider reducing virtual users

**3. Slow Response Times**
- Check database query performance
- Review edge function cold starts
- Consider connection pooling issues
- Monitor server resources

**4. Rate Limiting**
- Increase request delays in config
- Reduce concurrent virtual users
- Check Supabase rate limits

### Debug Mode

Run with verbose output:
```bash
k6 run --verbose run-all-scenarios.js
```

View HTTP request details:
```bash
k6 run --http-debug="full" run-all-scenarios.js
```

## Best Practices

1. **Always run smoke tests first** before running full load tests
2. **Use staging environment** for load testing, not production
3. **Clean up test data** after load test runs
4. **Monitor system resources** during tests (CPU, memory, database)
5. **Run tests during off-peak hours** to avoid affecting real users
6. **Document baseline metrics** before making changes
7. **Set realistic thresholds** based on actual requirements
8. **Review failed checks** to understand failure patterns

## Related Documentation

- [k6 Documentation](https://k6.io/docs/)
- [Playwright Performance Tests](../api-response-times.test.ts)
- [Split Lease Testing Guide](../../README.md)
