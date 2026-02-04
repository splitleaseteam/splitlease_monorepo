# Split Lease Operational Runbooks

This directory contains comprehensive operational runbooks for the Split Lease platform. These runbooks provide step-by-step procedures for deployment, incident response, maintenance, on-call operations, and business operations.

## Directory Structure

```
runbooks/
├── deployment/           # Deployment procedures
│   ├── deploy-frontend.md
│   ├── deploy-edge-functions.md
│   └── deploy-database-migrations.md
│
├── incidents/           # Incident response procedures
│   ├── incident-response-template.md
│   ├── outage-frontend.md
│   ├── outage-edge-functions.md
│   ├── outage-database.md
│   └── outage-bubble-sync.md
│
├── maintenance/         # Maintenance procedures
│   ├── database-maintenance.md
│   ├── log-management.md
│   └── dependency-updates.md
│
├── oncall/             # On-call procedures
│   ├── oncall-handoff.md
│   ├── common-alerts.md
│   └── troubleshooting-guide.md
│
└── business/           # Business operations
    ├── new-user-issues.md
    ├── payment-issues.md
    └── proposal-stuck.md
```

## Quick Reference

| Scenario | Runbook |
|----------|---------|
| Deploy frontend changes | [deployment/deploy-frontend.md](deployment/deploy-frontend.md) |
| Deploy Edge Functions | [deployment/deploy-edge-functions.md](deployment/deploy-edge-functions.md) |
| Run database migrations | [deployment/deploy-database-migrations.md](deployment/deploy-database-migrations.md) |
| Site is down | [incidents/outage-frontend.md](incidents/outage-frontend.md) |
| Edge Function errors | [incidents/outage-edge-functions.md](incidents/outage-edge-functions.md) |
| Database issues | [incidents/outage-database.md](incidents/outage-database.md) |
| Bubble sync failing | [incidents/outage-bubble-sync.md](incidents/outage-bubble-sync.md) |
| User signup problems | [business/new-user-issues.md](business/new-user-issues.md) |
| Payment failures | [business/payment-issues.md](business/payment-issues.md) |
| Proposal stuck | [business/proposal-stuck.md](business/proposal-stuck.md) |

## Contact Information

| Role | Contact |
|------|---------|
| Engineering Lead | Slack: #engineering |
| DevOps | Slack: #devops |
| On-Call | PagerDuty rotation |
| Database Admin | Slack: #database |

## Runbook Standards

All runbooks follow a consistent format:

1. **Overview** - Brief description of when to use
2. **Prerequisites** - Access and tools needed
3. **Procedure** - Step-by-step instructions
4. **Verification** - How to confirm success
5. **Rollback** - How to undo if needed
6. **Escalation** - When and who to contact
7. **Related Runbooks** - Links to related procedures
8. **Revision History** - Change tracking

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial runbook creation |
