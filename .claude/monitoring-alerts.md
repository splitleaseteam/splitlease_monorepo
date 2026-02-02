# Monitoring and Alerting Guide

**Document Version**: 1.0
**Last Updated**: 2026-01-29
**Scope**: Phase 4 - Production Monitoring Setup

---

## Overview

This guide covers the monitoring and alerting infrastructure for Split Lease production. It includes setup instructions for error tracking, analytics, performance monitoring, and alert thresholds.

---

## 1. Sentry Error Tracking

### Setup

1. **Create Sentry Project**
   - Go to [sentry.io](https://sentry.io)
   - Create new project: `split-lease-frontend` (React)
   - Create new project: `split-lease-edge-functions` (Node/Deno)

2. **Install Sentry SDK (Frontend)**

   ```bash
   cd app
   bun add @sentry/react @sentry/tracing
   ```

3. **Configure Sentry (Frontend)**

   Create `app/src/lib/sentry.js`:
   ```javascript
   import * as Sentry from '@sentry/react';

   export const initSentry = () => {
     if (import.meta.env.VITE_ENVIRONMENT === 'production') {
       Sentry.init({
         dsn: import.meta.env.VITE_SENTRY_DSN,
         integrations: [
           Sentry.browserTracingIntegration(),
           Sentry.replayIntegration(),
         ],
         // Performance Monitoring
         tracesSampleRate: 0.1, // 10% of transactions
         // Session Replay
         replaysSessionSampleRate: 0.1,
         replaysOnErrorSampleRate: 1.0,
         // Environment
         environment: import.meta.env.VITE_ENVIRONMENT,
         // Release tracking
         release: import.meta.env.VITE_APP_VERSION,
       });
     }
   };

   export const captureException = (error, context = {}) => {
     console.error(error);
     if (import.meta.env.VITE_ENVIRONMENT === 'production') {
       Sentry.captureException(error, { extra: context });
     }
   };

   export const captureMessage = (message, level = 'info') => {
     if (import.meta.env.VITE_ENVIRONMENT === 'production') {
       Sentry.captureMessage(message, level);
     }
   };
   ```

4. **Environment Variables**

   Add to Cloudflare Pages:
   ```
   VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   VITE_APP_VERSION=1.0.0
   ```

### Sentry Alert Rules

Configure the following alerts in Sentry:

| Alert Name | Condition | Threshold | Action |
|------------|-----------|-----------|--------|
| High Error Rate | Error count | > 100/hour | Slack + Email |
| New Error Type | First seen error | Any | Slack |
| Critical Error | Error with tag `critical` | Any | PagerDuty |
| Auth Failures | Error message contains "auth" | > 10/15min | Slack |
| Payment Errors | Error message contains "stripe" or "payment" | Any | Slack + Email |

### Sentry Dashboard Widgets

Create dashboard with:
- Error rate over time
- Top 10 errors by frequency
- Affected users count
- Browser/device breakdown
- Error trends by release

---

## 2. Cloudflare Analytics

### Built-in Analytics

Cloudflare Pages provides automatic analytics:

1. **Access Analytics**
   - Cloudflare Dashboard > Pages > splitlease > Analytics

2. **Key Metrics to Monitor**

   | Metric | Location | Purpose |
   |--------|----------|---------|
   | Total Requests | Overview | Traffic volume |
   | Unique Visitors | Web Analytics | User count |
   | Page Views | Web Analytics | Engagement |
   | Cache Hit Rate | Performance | CDN efficiency |
   | Error Rate | Overview | 4xx/5xx responses |
   | Bandwidth | Overview | Data transfer |

### Web Analytics Setup

1. **Enable Cloudflare Web Analytics** (if not using Workers)
   - Dashboard > Analytics > Web Analytics
   - Add site: `split.lease`
   - Add beacon script (auto-injected by Pages)

2. **Custom Events** (optional)

   ```javascript
   // Track custom events
   if (window.cfBeacon) {
     cfBeacon('event', {
       name: 'proposal_created',
       value: proposalId
     });
   }
   ```

### Cloudflare Alert Rules

Configure in Cloudflare Dashboard > Notifications:

| Alert Name | Trigger | Threshold |
|------------|---------|-----------|
| High Error Rate | HTTP 5xx responses | > 5% of requests |
| Traffic Spike | Requests per second | > 2x normal |
| DDoS Attack | WAF events | Automatic |
| SSL Certificate Expiry | Days until expiry | < 30 days |

---

## 3. Supabase Performance Monitoring

### Database Monitoring

1. **Access Dashboard**
   - Supabase Dashboard > Project > Database > Performance

2. **Key Metrics**

   | Metric | Target | Alert Threshold |
   |--------|--------|-----------------|
   | Active Connections | < 80% of pool | > 90% |
   | Query Time (p95) | < 200ms | > 500ms |
   | Rows Read/sec | Varies | > 10,000/sec |
   | Index Usage | > 95% | < 80% |
   | Disk Usage | < 80% | > 90% |

3. **Slow Query Log**
   - Enable: Project Settings > Database > Logging
   - Set `log_min_duration_statement` to `500` (ms)

### Edge Functions Monitoring

1. **Access Logs**
   ```bash
   # Real-time logs
   supabase functions logs <function-name> --project-ref $SUPABASE_PROJECT_ID_PROD

   # Historical logs
   supabase functions logs <function-name> --project-ref $SUPABASE_PROJECT_ID_PROD --since 1h
   ```

2. **Key Metrics**

   | Metric | Target | Alert Threshold |
   |--------|--------|-----------------|
   | Response Time (p50) | < 100ms | > 200ms |
   | Response Time (p95) | < 300ms | > 500ms |
   | Error Rate | < 1% | > 5% |
   | Invocation Count | Varies | Sudden drop |
   | Cold Start Rate | < 10% | > 25% |

3. **Custom Logging in Edge Functions**

   ```typescript
   // Add structured logging
   const logEvent = (event: string, data: Record<string, unknown>) => {
     console.log(JSON.stringify({
       timestamp: new Date().toISOString(),
       event,
       ...data,
     }));
   };

   // Usage
   logEvent('proposal_created', { userId, proposalId, duration: endTime - startTime });
   ```

### Supabase Alerts Setup

1. **Database Alerts**
   - Dashboard > Project Settings > Alerts
   - Configure email notifications for:
     - Database approaching storage limit
     - High CPU usage
     - Connection pool exhaustion

2. **Integration with Slack**

   Create Edge Function for custom alerts:
   ```typescript
   // supabase/functions/_shared/alerts.ts
   export const sendAlert = async (
     severity: 'info' | 'warning' | 'critical',
     message: string,
     details?: Record<string, unknown>
   ) => {
     const webhookUrl = Deno.env.get('SLACK_WEBHOOK_DATABASE_WEBHOOK');

     const emoji = {
       info: ':information_source:',
       warning: ':warning:',
       critical: ':rotating_light:',
     }[severity];

     await fetch(webhookUrl!, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         text: `${emoji} *[${severity.toUpperCase()}]* ${message}`,
         attachments: details ? [{
           color: severity === 'critical' ? 'danger' : 'warning',
           fields: Object.entries(details).map(([k, v]) => ({
             title: k,
             value: String(v),
             short: true,
           })),
         }] : undefined,
       }),
     });
   };
   ```

---

## 4. Alert Thresholds Configuration

### API Response Times

| Endpoint Category | p50 Target | p95 Target | Alert Threshold |
|-------------------|------------|------------|-----------------|
| Auth (login/signup) | 150ms | 400ms | > 600ms |
| Listing Read | 100ms | 250ms | > 400ms |
| Listing Write | 200ms | 500ms | > 800ms |
| Proposal CRUD | 150ms | 400ms | > 600ms |
| Messages | 100ms | 300ms | > 500ms |
| Search | 200ms | 600ms | > 1000ms |
| Bidding | 100ms | 300ms | > 500ms |
| Payments | 500ms | 1500ms | > 2500ms |

### Error Rates

| Category | Normal | Warning | Critical |
|----------|--------|---------|----------|
| Overall Error Rate | < 1% | 1-3% | > 5% |
| Auth Errors | < 0.5% | 0.5-2% | > 3% |
| Payment Errors | < 0.1% | 0.1-1% | > 1% |
| Database Errors | < 0.1% | 0.1-0.5% | > 1% |
| Edge Function Errors | < 1% | 1-3% | > 5% |

### Database Connection Pool

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Active Connections | < 50% | 50-80% | > 90% |
| Idle Connections | > 20% | 10-20% | < 10% |
| Connection Wait Time | < 50ms | 50-200ms | > 500ms |

### Edge Function Metrics

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Cold Start Rate | < 10% | 10-20% | > 30% |
| Memory Usage | < 70% | 70-85% | > 90% |
| Execution Duration | < 5s | 5-10s | > 10s |
| Timeout Rate | < 0.1% | 0.1-1% | > 2% |

---

## 5. Monitoring Dashboard Setup

### Grafana Dashboard (Optional)

If using external monitoring:

```yaml
# grafana-dashboard.yaml
panels:
  - title: "Request Rate"
    type: graph
    targets:
      - expr: rate(http_requests_total[5m])

  - title: "Error Rate"
    type: graph
    targets:
      - expr: rate(http_errors_total[5m]) / rate(http_requests_total[5m])

  - title: "Response Time (p95)"
    type: graph
    targets:
      - expr: histogram_quantile(0.95, http_request_duration_seconds_bucket)

  - title: "Database Connections"
    type: gauge
    targets:
      - expr: pg_stat_activity_count
```

### Slack Channel Structure

Set up dedicated channels:

| Channel | Purpose | Alerts |
|---------|---------|--------|
| `#split-lease-alerts` | Critical alerts | Errors > 5%, Payment failures |
| `#split-lease-monitoring` | All monitoring | Warnings, metrics |
| `#split-lease-deployments` | Deploy notifications | CI/CD results |

---

## 6. Health Check Endpoints

### Frontend Health

```javascript
// app/src/pages/health.html (static page)
// Returns 200 OK if served correctly
```

### Edge Functions Health

Each function should respond to health action:

```typescript
// Handle health check
if (action === 'health') {
  return new Response(JSON.stringify({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: Deno.env.get('FUNCTION_VERSION') || 'unknown',
    },
  }), { headers: corsHeaders });
}
```

### Database Health

```sql
-- Check database health
SELECT
  pg_is_in_recovery() as is_replica,
  pg_stat_activity.count as active_connections,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections
FROM pg_stat_activity;
```

---

## 7. Incident Response

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P1 | Critical - Service down | < 15 min | Auth broken, DB down |
| P2 | Major - Degraded service | < 1 hour | Slow response, partial outage |
| P3 | Minor - Limited impact | < 4 hours | Single feature broken |
| P4 | Low - Cosmetic/minor | Next business day | UI glitch, minor bug |

### Incident Runbook

1. **Acknowledge** - Respond in Slack within SLA
2. **Assess** - Determine severity and impact
3. **Communicate** - Update status page if P1/P2
4. **Investigate** - Check logs, metrics, recent deploys
5. **Mitigate** - Apply fix or rollback
6. **Resolve** - Confirm service restored
7. **Post-mortem** - Document for P1/P2 incidents

### Quick Diagnosis Commands

```bash
# Check recent Edge Function logs
supabase functions logs auth-user --project-ref $SUPABASE_PROJECT_ID_PROD --since 30m

# Check recent deployments
gh run list --workflow=deploy-frontend-prod.yml --limit=5

# Check Cloudflare status
curl -s https://www.cloudflarestatus.com/api/v2/summary.json | jq '.status'

# Check Supabase status
curl -s https://status.supabase.com/api/v2/summary.json | jq '.status'

# Quick database health check
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 8. Implementation Checklist

### Sentry Setup

- [ ] Create Sentry projects (frontend + backend)
- [ ] Install Sentry SDK in frontend
- [ ] Configure environment variables
- [ ] Set up alert rules
- [ ] Create dashboard
- [ ] Test error capture

### Cloudflare Analytics

- [ ] Verify Web Analytics enabled
- [ ] Configure notification alerts
- [ ] Set up custom dashboard
- [ ] Enable Real User Monitoring

### Supabase Monitoring

- [ ] Enable query logging
- [ ] Configure database alerts
- [ ] Set up Edge Function monitoring
- [ ] Create Slack integration for alerts

### Alert Configuration

- [ ] Define all thresholds in monitoring tool
- [ ] Set up escalation policies
- [ ] Configure on-call schedule
- [ ] Test alert delivery

---

## 9. Useful Links

- **Sentry Dashboard**: https://sentry.io/organizations/split-lease/
- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **Supabase Dashboard**: https://supabase.com/dashboard/project/qcfifybkaddcoimjroca
- **GitHub Actions**: https://github.com/SplitLease/split-lease/actions
- **Slack Alerts Channel**: #split-lease-alerts

---

**Document maintained by**: Engineering Team
**Review frequency**: Quarterly
