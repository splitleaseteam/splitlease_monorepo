# On-Call Handoff

## Overview

This runbook covers the on-call handoff process including shift transitions, documentation requirements, and ongoing issue tracking. Proper handoffs ensure continuity and prevent issues from falling through the cracks.

## Prerequisites

- Access to all monitoring systems
- Slack access (#incidents, #oncall channels)
- PagerDuty access (if applicable)
- Supabase Dashboard access
- Cloudflare Dashboard access

## On-Call Responsibilities

| Responsibility | Description |
|---------------|-------------|
| Monitor alerts | Respond to alerts within SLA |
| Triage issues | Classify severity, route appropriately |
| First response | Acknowledge and begin investigation |
| Escalate | Engage additional help when needed |
| Document | Keep incident log updated |
| Handoff | Transfer context to next on-call |

## Handoff Checklist

### Outgoing On-Call

- [ ] Document all active issues in handoff notes
- [ ] Update status of ongoing incidents
- [ ] Note any pending deployments or changes
- [ ] Flag known issues that may trigger alerts
- [ ] Transfer any open PagerDuty incidents
- [ ] Post handoff summary in #oncall Slack channel
- [ ] Ensure incoming person acknowledges receipt

### Incoming On-Call

- [ ] Read handoff notes thoroughly
- [ ] Review recent incidents (last 24-48 hours)
- [ ] Check all monitoring dashboards
- [ ] Verify access to all systems
- [ ] Acknowledge handoff in Slack
- [ ] Test alert routing (optional)

## Handoff Document Template

Post this in #oncall channel at shift change:

```markdown
## On-Call Handoff: [Date] [Time]

**Outgoing:** @[name]
**Incoming:** @[name]

### Active Issues
1. [Issue description] - Status: [status] - Tracking: [link]
2. [Issue description] - Status: [status] - Tracking: [link]

### Recent Incidents (last 24h)
- [Time]: [Brief description] - Resolved/Ongoing
- [Time]: [Brief description] - Resolved/Ongoing

### Pending Changes
- [ ] [Scheduled deployment/change] - [Time]
- [ ] [Scheduled maintenance] - [Time]

### Known Issues / Watch Items
- [Description of flaky system]
- [Description of expected alert that can be ignored]

### Notes
[Any additional context the incoming person needs]

---
Incoming acknowledges: [ ]
```

## Monitoring Dashboards

### Primary Dashboards

| System | URL | What to Monitor |
|--------|-----|-----------------|
| Cloudflare | dashboard.cloudflare.com | Traffic, errors, SSL |
| Supabase | app.supabase.com | Functions, DB, Auth |
| Slack | #incidents channel | Alert notifications |

### Key Metrics to Check

1. **Frontend (Cloudflare)**
   - Error rate (should be <1%)
   - Response time (should be <500ms)
   - SSL certificate status

2. **Edge Functions (Supabase)**
   - Function invocations
   - Error count
   - Execution time

3. **Database (Supabase)**
   - Connection count
   - CPU usage
   - Disk usage

4. **Sync Queue**
   ```sql
   SELECT status, COUNT(*) FROM sync_queue GROUP BY status;
   ```

## Alert Response SLAs

| Severity | Acknowledge | Begin Investigation |
|----------|-------------|---------------------|
| SEV1 | 5 minutes | Immediately |
| SEV2 | 15 minutes | 15 minutes |
| SEV3 | 1 hour | 2 hours |
| SEV4 | 4 hours | Next business day |

## Contact Information

### Escalation Contacts

| Role | Contact | When |
|------|---------|------|
| Engineering Lead | @[name] / [phone] | SEV1, SEV2 |
| Backend Lead | @[name] | Database, Functions |
| Frontend Lead | @[name] | UI, Performance |
| CTO | @[name] / [phone] | Extended outages |

### External Contacts

| Service | Support Contact |
|---------|-----------------|
| Supabase | support@supabase.io |
| Cloudflare | Dashboard ticket |
| Bubble | support@bubble.io |

## Common Scenarios

### "I'm getting paged but can't reproduce"

1. Check if alert is from a single user report
2. Try from different network/device
3. Check monitoring for corroborating data
4. If isolated, mark as monitoring and document

### "There's an ongoing incident from previous shift"

1. Read all incident notes carefully
2. Join the incident Slack thread
3. Ask clarifying questions
4. Update the incident timeline with your actions

### "I need to escalate but it's 3am"

1. For SEV1/SEV2, always escalate per SLA
2. Use phone call, not just Slack
3. Document that you escalated
4. Continue working while waiting for response

### "I'm not sure of the severity"

1. When in doubt, err on higher severity
2. You can always downgrade later
3. Better to over-communicate than under

## Shift Schedule

### Standard Rotation

| Day | Primary | Secondary |
|-----|---------|-----------|
| Mon-Fri Day | [Name] | [Name] |
| Mon-Fri Night | [Name] | [Name] |
| Weekend | [Name] | [Name] |

### Handoff Times

- Day shift: 9:00 AM local
- Night shift: 6:00 PM local
- Weekend: 9:00 AM Saturday

## Emergency Procedures

### Can't Reach Incoming On-Call

1. Try all contact methods (Slack, phone, email)
2. Wait 15 minutes
3. Contact secondary on-call
4. If no one available, contact Engineering Lead
5. Continue coverage until resolved

### Major Incident During Handoff

1. Pause handoff
2. Both people work the incident together
3. Outgoing person can lead since they have context
4. Complete handoff after incident resolves

### Personal Emergency During On-Call

1. Post in #oncall immediately
2. Contact secondary on-call
3. If no secondary, contact Engineering Lead
4. Provide whatever context you can before stepping away

## Post-Shift Tasks

1. Update any documentation that was unclear
2. File tickets for improvements discovered
3. Complete any post-mortem tasks assigned
4. Provide feedback on on-call process

## Verification

At start of shift, verify:

1. **Alert routing works:**
   - Check you received recent test alerts
   - Or trigger a test alert

2. **System access:**
   - Log into Supabase Dashboard
   - Log into Cloudflare Dashboard
   - Verify Slack notifications enabled

3. **Contact info current:**
   - Your phone number is correct in PagerDuty
   - You can reach escalation contacts

## Related Runbooks

- [common-alerts.md](common-alerts.md) - How to handle specific alerts
- [troubleshooting-guide.md](troubleshooting-guide.md) - General troubleshooting
- [../incidents/incident-response-template.md](../incidents/incident-response-template.md) - Incident management

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
