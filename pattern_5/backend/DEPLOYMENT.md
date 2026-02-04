#!/bin/bash
# ============================================================================
# PATTERN 5: FEE TRANSPARENCY - DEPLOYMENT CHECKLIST
# ============================================================================
# Complete deployment guide for Pattern 5 backend
# Version: 1.0
# Date: 2026-01-28
# ============================================================================

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  PATTERN 5: FEE TRANSPARENCY - DEPLOYMENT CHECKLIST          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# PRE-DEPLOYMENT CHECKS
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. PRE-DEPLOYMENT CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check environment variables
echo "□ Verify environment variables are set:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_WEBHOOK_SECRET"
echo ""

# Check dependencies
echo "□ Verify dependencies installed:"
echo "   - Supabase CLI: supabase --version"
echo "   - PostgreSQL client: psql --version"
echo "   - Deno: deno --version"
echo ""

# Check project structure
echo "□ Verify project structure:"
echo "   - migrations/ directory exists"
echo "   - edge-functions/ directory exists"
echo "   - tests/ directory exists"
echo ""

# ============================================================================
# STEP 1: DATABASE MIGRATIONS
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. DATABASE MIGRATIONS (Sequential Order Required)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "□ Migration 1: User Archetype Fields"
echo "   Command: supabase migration up --file 20260128000001_add_user_archetype_fields.sql"
echo "   Expected: 5 columns added, 3 indexes created, 1 view created"
echo ""

echo "□ Migration 2: Date Change Request Fee Fields"
echo "   Command: supabase migration up --file 20260128000002_add_datechangerequest_fee_fields.sql"
echo "   Expected: 9 columns added, 5 indexes created, 2 views created"
echo ""

echo "□ Migration 3: User Archetype Backfill"
echo "   Command: supabase migration up --file 20260128000003_backfill_user_archetypes.sql"
echo "   Expected: Historical user archetypes calculated"
echo "   Duration: ~1-5 minutes depending on user count"
echo ""

echo "□ Migration 4: Fee Breakdown Backfill"
echo "   Command: supabase migration up --file 20260128000004_backfill_datechangerequest_fees.sql"
echo "   Expected: Historical fee breakdowns populated"
echo "   Duration: ~2-10 minutes depending on request count"
echo ""

echo "□ Migration 5: Fee Calculation Trigger"
echo "   Command: supabase migration up --file 20260128000005_add_fee_calculation_trigger.sql"
echo "   Expected: 2 triggers created, 3 helper functions added"
echo ""

# ============================================================================
# STEP 2: HELPER FUNCTIONS
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. DATABASE HELPER FUNCTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "□ Deploy helper functions"
echo "   Command: psql -f utils/database-helpers.sql"
echo "   Expected: 8 functions created"
echo "   Functions:"
echo "     - get_fee_revenue_timeseries()"
echo "     - calculate_user_lifetime_value()"
echo "     - get_fee_metrics_by_archetype()"
echo "     - detect_fee_anomalies()"
echo "     - get_payment_success_rate()"
echo "     - bulk_update_payment_status()"
echo "     - export_fee_data_csv()"
echo "     - calculate_revenue_projection()"
echo ""

# ============================================================================
# STEP 3: EDGE FUNCTIONS
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. EDGE FUNCTIONS DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "□ Deploy process-date-change-fee"
echo "   Command: supabase functions deploy process-date-change-fee"
echo "   Endpoint: /functions/v1/process-date-change-fee"
echo ""

echo "□ Deploy create-payment-intent"
echo "   Command: supabase functions deploy create-payment-intent"
echo "   Endpoint: /functions/v1/create-payment-intent"
echo ""

echo "□ Deploy stripe-webhook"
echo "   Command: supabase functions deploy stripe-webhook"
echo "   Endpoint: /functions/v1/stripe-webhook"
echo ""

echo "□ Deploy admin-fee-dashboard"
echo "   Command: supabase functions deploy admin-fee-dashboard"
echo "   Endpoint: /functions/v1/admin-fee-dashboard"
echo ""

# ============================================================================
# STEP 4: SECRETS CONFIGURATION
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. SECRETS CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "□ Set Stripe secret key"
echo "   Command: supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx"
echo "   Note: Use test key (sk_test_) for staging"
echo ""

echo "□ Set Stripe webhook secret"
echo "   Command: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx"
echo "   Note: Get from Stripe Dashboard → Webhooks"
echo ""

# ============================================================================
# STEP 5: STRIPE WEBHOOK CONFIGURATION
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. STRIPE WEBHOOK SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "□ Configure Stripe webhook endpoint"
echo "   1. Go to: https://dashboard.stripe.com/webhooks"
echo "   2. Click: Add endpoint"
echo "   3. URL: https://[your-project].supabase.co/functions/v1/stripe-webhook"
echo "   4. Select events:"
echo "      ✓ payment_intent.succeeded"
echo "      ✓ payment_intent.payment_failed"
echo "      ✓ payment_intent.canceled"
echo "      ✓ charge.refunded"
echo "   5. Copy webhook secret"
echo "   6. Update STRIPE_WEBHOOK_SECRET"
echo ""

# ============================================================================
# STEP 6: TESTING
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. TESTING & VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "□ Run fee calculation tests"
echo "   Command: deno test tests/fee-calculations.test.ts"
echo "   Expected: 20+ tests passed"
echo ""

echo "□ Run edge function tests"
echo "   Command: deno test tests/edge-functions.test.ts"
echo "   Expected: 15+ tests passed"
echo ""

echo "□ Run database trigger tests"
echo "   Command: psql -f tests/database-triggers.test.sql"
echo "   Expected: 6 tests passed"
echo ""

echo "□ Test fee calculation (manual)"
echo "   curl -X POST https://[project].supabase.co/functions/v1/process-date-change-fee \\"
echo "     -H \"Authorization: Bearer [token]\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"leaseId\":\"test\",\"monthlyRent\":2000}'"
echo "   Expected: fee_breakdown with total_fee = 30"
echo ""

echo "□ Test Stripe webhook (manual)"
echo "   1. Use Stripe CLI: stripe listen --forward-to [webhook-url]"
echo "   2. Trigger test event: stripe trigger payment_intent.succeeded"
echo "   3. Verify webhook received and processed"
echo ""

# ============================================================================
# STEP 7: DATA VALIDATION
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. DATA VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "□ Verify user archetype data"
echo "   Query: SELECT archetype, COUNT(*) FROM user WHERE archetype IS NOT NULL GROUP BY archetype;"
echo "   Expected: Distribution across 5 archetype types"
echo ""

echo "□ Verify fee breakdown backfill"
echo "   Query: SELECT COUNT(*) FROM datechangerequest WHERE fee_breakdown IS NOT NULL;"
echo "   Expected: 100% of paid requests have fee_breakdown"
echo ""

echo "□ Check fee calculation accuracy"
echo "   Query: SELECT * FROM detect_fee_anomalies(0.01);"
echo "   Expected: No anomalies (or very few edge cases)"
echo ""

echo "□ Verify payment status distribution"
echo "   Query: SELECT * FROM get_payment_success_rate();"
echo "   Expected: Majority status = 'paid'"
echo ""

# ============================================================================
# STEP 8: MONITORING SETUP
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. MONITORING & ALERTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "□ Set up edge function monitoring"
echo "   - Monitor response times (<1000ms)"
echo "   - Track error rates (<1%)"
echo "   - Alert on failed payments"
echo ""

echo "□ Set up database monitoring"
echo "   - Monitor trigger execution time (<50ms)"
echo "   - Track fee calculation errors"
echo "   - Alert on anomaly detection"
echo ""

echo "□ Set up Stripe monitoring"
echo "   - Monitor webhook delivery success"
echo "   - Track payment success rates"
echo "   - Alert on refund spikes"
echo ""

# ============================================================================
# STEP 9: ROLLBACK PLAN
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "10. ROLLBACK PLAN (If Issues Occur)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "□ Disable fee calculation trigger"
echo "   Command: DROP TRIGGER trigger_auto_calculate_fee_breakdown ON datechangerequest;"
echo ""

echo "□ Revert to previous migration state"
echo "   Command: supabase migration down"
echo ""

echo "□ Disable edge functions"
echo "   Command: supabase functions delete [function-name]"
echo ""

echo "□ Remove Stripe webhook"
echo "   1. Go to Stripe Dashboard"
echo "   2. Delete webhook endpoint"
echo ""

# ============================================================================
# STEP 10: POST-DEPLOYMENT VERIFICATION
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "11. POST-DEPLOYMENT VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "□ Verify all migrations applied"
echo "   Command: supabase migration list"
echo "   Expected: All 5 migrations marked as applied"
echo ""

echo "□ Verify all edge functions deployed"
echo "   Command: supabase functions list"
echo "   Expected: 4 functions listed"
echo ""

echo "□ Verify fee calculations working"
echo "   1. Create test date change request"
echo "   2. Verify fee_breakdown auto-populated"
echo "   3. Check total_fee = 1.5% of base_price"
echo ""

echo "□ Verify Stripe integration"
echo "   1. Create test payment intent"
echo "   2. Complete payment with test card"
echo "   3. Verify webhook updates payment_status"
echo ""

echo "□ Verify admin dashboard"
echo "   1. Call admin-fee-dashboard API"
echo "   2. Verify revenue metrics returned"
echo "   3. Check time series data"
echo ""

# ============================================================================
# DEPLOYMENT METRICS
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "12. DEPLOYMENT METRICS TO TRACK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Performance Metrics:"
echo "  □ Fee calculation time: target <10ms"
echo "  □ Edge function response: target <1000ms"
echo "  □ Database trigger execution: target <50ms"
echo "  □ Stripe API call: target <500ms"
echo ""

echo "Business Metrics:"
echo "  □ Payment success rate: target >95%"
echo "  □ Fee acceptance rate: target >90%"
echo "  □ Average transaction value"
echo "  □ Platform revenue per transaction"
echo ""

echo "Quality Metrics:"
echo "  □ Test coverage: target 100%"
echo "  □ Fee calculation accuracy: target 100%"
echo "  □ Webhook delivery success: target >99%"
echo "  □ Error rate: target <1%"
echo ""

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT CHECKLIST COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Next Steps:"
echo "1. Monitor edge function logs for first 24 hours"
echo "2. Review payment success rates"
echo "3. Validate fee calculations with sample data"
echo "4. Update documentation with actual URLs"
echo "5. Train support team on fee transparency features"
echo ""

echo "Documentation:"
echo "- API Docs: README.md"
echo "- Testing Guide: tests/README.md"
echo "- Troubleshooting: TROUBLESHOOTING.md"
echo ""

echo "Support Contacts:"
echo "- Technical Issues: dev-team@splitlease.com"
echo "- Stripe Issues: stripe-support@splitlease.com"
echo "- Database Issues: database-admin@splitlease.com"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  DEPLOYMENT READY FOR PRODUCTION                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
