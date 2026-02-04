# Incident Response Template

## Overview

This template provides a standardized framework for responding to and documenting incidents affecting the Split Lease platform. Use this template for any unplanned service disruption.

## Prerequisites

- Access to monitoring dashboards
- Slack access (#incidents channel)
- PagerDuty access (if applicable)
- Supabase Dashboard access
- Cloudflare Dashboard access

## Incident Classification

### Severity Levels

| Severity | Definition | Response Time | Examples |
|----------|------------|---------------|----------|
| **SEV1** | Complete service outage | 15 min | Site down, all users affected |
| **SEV2** | Major feature unavailable | 30 min | Payments broken, can't login |
| **SEV3** | Degraded service | 2 hours | Slow performance, some errors |
| **SEV4** | Minor issue | 24 hours | UI bug, non-critical feature broken |

### Classification Criteria

**SEV1 - Critical**
- Complete site unavailability
- Database unreachable
- All authentication failing
- Data loss occurring
- Security breach

**SEV2 - High**
- Major feature completely broken (payments, proposals)
- Authentication partially working
- High error rate (>10% of requests)
- Significant data inconsistency

**SEV3 - Medium**
- Performance degradation
- Non-critical feature broken
- Elevated error rate (1-10%)
- Intermittent failures

**SEV4 - Low**
- Cosmetic issues
- Minor UX problems
- Isolated user reports
- Documentation errors

## Incident Response Procedure

### Phase 1: Detection & Triage (0-15 min)

1. **Acknowledge the incident**
   - Note the time of first alert/report
   - Confirm the incident is real (not false positive)

2. **Initial Assessment**
   - What is affected?
   - How many users impacted?
   - Is the issue ongoing or resolved?

3. **Assign Severity**
   - Use the classification table above
   - When in doubt, err on the side of higher severity

4. **Communication**
   - Post in #incidents Slack channel:
   ```
   INCIDENT DECLARED - [SEV#]
   Issue: [Brief description]
   Impact: [Who/what is affected]
   Status: Investigating
   IC: [Your name]
   ```

### Phase 2: Investigation (15-60 min)

1. **Gather Information**
   - Check monitoring dashboards
   - Review recent deployments
   - Check for external factors (third-party outages)
   - Review error logs

2. **Form a Hypothesis**
   - What changed recently?
   - When did the issue start?
   - What's the pattern of failures?

3. **Document Findings**
   - Keep a running timeline
   - Screenshot relevant graphs/errors
   - Note what you've tried

### Phase 3: Mitigation (Ongoing)

1. **Implement Fix or Workaround**
   - Prioritize stopping the bleeding
   - A temporary fix is better than no fix
   - Document what you changed

2. **Verify Fix**
   - Monitor error rates
   - Test affected functionality
   - Get user confirmation if possible

3. **Update Status**
   ```
   UPDATE - [SEV#] - [Time]
   Status: Mitigated
   Action taken: [What you did]
   Impact: [Current state]
   Next steps: [What's remaining]
   ```

### Phase 4: Resolution

1. **Confirm Service Restored**
   - All functionality working
   - Error rates normal
   - Performance normal

2. **Close Incident**
   ```
   RESOLVED - [SEV#] - [Time]
   Duration: [Total incident time]
   Root cause: [Brief summary]
   Fix: [What resolved it]
   ```

3. **Schedule Post-Mortem**
   - For SEV1/SEV2: Within 48 hours
   - For SEV3: Within 1 week
   - SEV4: Document but no formal post-mortem

## Communication Templates

### Initial Notification

**Internal (Slack):**
```
:rotating_light: INCIDENT DECLARED - SEV[#]
Time: [HH:MM UTC]
Issue: [One-line description]
Impact: [Users/features affected]
Status: Investigating
IC: @[name]
```

**External (if customer-facing):**
```
We are aware of an issue affecting [service/feature]. Our team is investigating. We will provide updates every [30 minutes/1 hour].
```

### Update Notification

**Internal (Slack):**
```
:arrow_right: UPDATE - [Time UTC]
Status: [Investigating/Identified/Mitigating/Monitoring]
Update: [What's new]
Next: [What we're doing next]
ETA: [If known]
```

### Resolution Notification

**Internal (Slack):**
```
:white_check_mark: RESOLVED - [Time UTC]
Duration: [X hours Y minutes]
Summary: [What happened and what fixed it]
Post-mortem scheduled: [Yes/No - date if yes]
```

**External (if customer-facing):**
```
The issue affecting [service/feature] has been resolved. Service is fully restored. We apologize for any inconvenience and will be conducting a review to prevent similar issues.
```

## Post-Mortem Template

### Incident Summary

| Field | Value |
|-------|-------|
| Incident ID | INC-YYYYMMDD-### |
| Severity | SEV# |
| Duration | X hours Y minutes |
| Affected Services | List |
| User Impact | Description |

### Timeline

| Time (UTC) | Event |
|------------|-------|
| HH:MM | Issue first reported |
| HH:MM | Incident declared |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed |
| HH:MM | Service restored |

### Root Cause Analysis

**What happened:**
[Detailed description of the failure]

**Why it happened:**
[The underlying cause]

**Contributing factors:**
- Factor 1
- Factor 2

### Impact Assessment

- **Users affected:** [Number/percentage]
- **Revenue impact:** [If applicable]
- **Data impact:** [Any data loss/corruption]

### Action Items

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Action 1 | @name | Date | Open |
| Action 2 | @name | Date | Open |

### Lessons Learned

**What went well:**
- Item 1
- Item 2

**What could be improved:**
- Item 1
- Item 2

## Escalation

### Escalation Matrix

| Severity | Who to Contact | How |
|----------|---------------|-----|
| SEV1 | Engineering Lead, CTO | Phone + Slack |
| SEV2 | Engineering Lead | Slack + Phone |
| SEV3 | On-call engineer | Slack |
| SEV4 | Team lead | Slack |

### External Escalation

| Service | Support Contact |
|---------|-----------------|
| Supabase | support@supabase.io |
| Cloudflare | Dashboard support ticket |
| Bubble | support@bubble.io |

## Related Runbooks

- [outage-frontend.md](outage-frontend.md) - Frontend outage response
- [outage-edge-functions.md](outage-edge-functions.md) - Edge Function issues
- [outage-database.md](outage-database.md) - Database issues
- [outage-bubble-sync.md](outage-bubble-sync.md) - Bubble sync issues

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
