# Urgency Pricing Verification Tests

Comprehensive test suite for the urgency-pricing Edge Function.

## Running Tests

### Local Testing

```bash
# 1. Start Supabase locally
supabase start

# 2. Serve the urgency-pricing function
supabase functions serve urgency-pricing

# 3. Run verification script
cd supabase/functions/urgency-pricing/tests
deno run --allow-net --allow-env verify-urgency-pricing.ts
```

### Production Testing

```bash
# Set environment variables
export SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
export SUPABASE_ANON_KEY="YOUR_ANON_KEY"

# Run verification script
deno run --allow-net --allow-env verify-urgency-pricing.ts
```

## Test Suites

### Suite 1: Formula Correctness (Steepness 2.0)
Tests the exponential urgency formula with steepness = 2.0:
- ✓ 90 days out → 1.0x multiplier
- ✓ 30 days out → 2.2x multiplier
- ✓ 14 days out → 3.2x multiplier
- ✓ 7 days out → 4.5x multiplier
- ✓ 3 days out → 6.4x multiplier
- ✓ 1 day out → 8.8x multiplier
- ✓ 0 days (today) → max multiplier (capped at 10.0x)

### Suite 2: Urgency Level Classification
Tests urgency level thresholds:
- ✓ CRITICAL (0-3 days)
- ✓ HIGH (3-7 days)
- ✓ MEDIUM (7-14 days)
- ✓ LOW (14+ days)

### Suite 3: Edge Cases & Validation
Tests error handling:
- ✓ Negative base price → 400 error
- ✓ Invalid date format → 400 error
- ✓ Missing required fields → 400 error
- ✓ Zero base price → 400 error

### Suite 4: Caching Behavior
Tests database-backed cache:
- ✓ Cache miss on first call
- ✓ Cache hit on second call
- ✓ Cache miss with different parameters

### Suite 5: Batch & Calendar Actions
Tests batch processing:
- ✓ Batch processing (multiple requests)
- ✓ Calendar view (date range)

### Suite 6: Health & Stats
Tests utility endpoints:
- ✓ Health check
- ✓ Statistics endpoint

## Expected Output

```
╔═══════════════════════════════════════════════════════════════╗
║   URGENCY PRICING VERIFICATION SUITE                          ║
╚═══════════════════════════════════════════════════════════════╝

Testing endpoint: http://127.0.0.1:54321/functions/v1/urgency-pricing

[TEST SUITE 1] Formula Correctness (Steepness 2.0)
  Testing 90 days out (baseline 1.0x)...
  Testing 30 days out (2.2x)...
  Testing 7 days out (4.5x)...
  Testing 1 day out (8.8x)...
  Testing 0 days out (today)...

...

╔═══════════════════════════════════════════════════════════════╗
║   ✓ ALL TESTS PASSED - READY FOR DEPLOYMENT                  ║
╚═══════════════════════════════════════════════════════════════╝
```

## Tolerance Levels

Multiplier tests use tolerance to account for floating-point precision:
- ±0.05 for baseline (1.0x)
- ±0.1 for low multipliers (2.2x, 3.2x, 4.5x)
- ±0.2 for high multipliers (6.4x, 8.8x)
- ±0.5 for max cap (10.0x)

## Golden Rule Validation

The verification script confirms:
1. **Backend is Source of Truth**: All calculations happen server-side
2. **No Client-Side Calculation**: Frontend cannot override pricing
3. **Formula Integrity**: Steepness 2.0 is enforced
4. **Cache Consistency**: Cached values match recalculated values

## Troubleshooting

### Connection Refused
```
Error: Connection refused
```
**Solution**: Ensure Supabase is running (`supabase start`)

### 401 Unauthorized
```
Error: HTTP 401
```
**Solution**: Set `SUPABASE_ANON_KEY` environment variable

### Tests Fail on Formula
```
✗ 7 days out → 4.5x multiplier
  Expected: 4.5, Got: 4.3
```
**Solution**: Check if steepness is correctly set to 2.0 in the calculation

## Manual Testing

Use the test payloads in `../test-payloads.json`:

```bash
curl -X POST http://localhost:54321/functions/v1/urgency-pricing \
  -H "Content-Type: application/json" \
  -d '{
    "action": "calculate",
    "payload": {
      "targetDate": "2026-02-15T00:00:00Z",
      "basePrice": 180,
      "urgencySteepness": 2.0
    }
  }'
```
