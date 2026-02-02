# Quick Start Guide - Pattern 2: Urgency Countdown Backend

Get up and running with the urgency pricing backend in under 10 minutes.

## Prerequisites

Ensure you have these installed:
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.0

## Installation (3 minutes)

### 1. Install Dependencies

```bash
cd C:\Users\igor\implementation\pattern_2\backend
npm install
```

### 2. Set Up Environment

```bash
# Copy environment template
copy .env.example .env

# Edit .env with your local settings
notepad .env
```

Minimal `.env` for local development:
```bash
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/urgency_pricing
REDIS_URL=redis://localhost:6379
ENABLE_CACHING=true
URGENCY_STEEPNESS=2.0
LOG_LEVEL=info
```

### 3. Set Up Database

```bash
# Create database
psql -U postgres
CREATE DATABASE urgency_pricing;
\q

# Run migrations
psql -U postgres -d urgency_pricing -f src/db/migrations/001_create_urgency_pricing_tables.sql
```

### 4. Start Services

```bash
# Start Redis (if not running)
redis-server

# Start application
npm run dev
```

## Verify Installation (1 minute)

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "urgency-pricing",
  "version": "1.0.0",
  "timestamp": "2026-01-28T..."
}
```

### Test Pricing Calculation

```bash
curl -X POST http://localhost:3000/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d "{\"targetDate\": \"2026-02-15T00:00:00Z\", \"basePrice\": 180}"
```

Expected response (7 days out from 2026-01-28):
```json
{
  "success": true,
  "data": {
    "currentPrice": 810,
    "currentMultiplier": 4.5,
    "urgencyLevel": "HIGH",
    "daysUntilCheckIn": 7,
    ...
  }
}
```

## Common Use Cases

### Calculate Single Price

```javascript
// JavaScript example
const response = await fetch('http://localhost:3000/api/pricing/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetDate: '2026-02-15T00:00:00Z',
    basePrice: 180,
    urgencySteepness: 2.0
  })
});

const data = await response.json();
console.log(`Price: $${data.data.currentPrice}`);
// Output: Price: $810
```

### Calculate Batch Prices

```javascript
const response = await fetch('http://localhost:3000/api/pricing/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requests: [
      { targetDate: '2026-02-15', basePrice: 180 },
      { targetDate: '2026-02-22', basePrice: 180 },
      { targetDate: '2026-03-01', basePrice: 180 }
    ]
  })
});

const data = await response.json();
data.results.forEach((result, i) => {
  if (result.success) {
    console.log(`Date ${i+1}: $${result.data.currentPrice}`);
  }
});
```

### Get Quick Price

```bash
# Simple GET request
curl "http://localhost:3000/api/pricing/quick?targetDate=2026-02-15&basePrice=180"
```

Response:
```json
{
  "price": 810,
  "multiplier": 4.5,
  "urgencyLevel": "HIGH",
  "daysOut": 7
}
```

### Add Event Multiplier

```javascript
const response = await fetch('http://localhost:3000/api/pricing/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventName: 'Tech Conference 2026',
    startDate: '2026-03-10',
    endDate: '2026-03-15',
    cities: ['nyc'],
    multiplier: 3.5
  })
});
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Tests

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode (re-run on changes)
npm run test:watch
```

### Check Coverage

```bash
npm test -- --coverage
```

Expected coverage: >80% on all metrics

## Development Workflow

### 1. Make Changes

Edit TypeScript files in `src/`

### 2. Run in Dev Mode

```bash
npm run dev
```

This will:
- Auto-compile TypeScript
- Auto-restart on changes
- Show detailed logs

### 3. Test Changes

```bash
# Run tests
npm test

# Or test manually
curl -X POST http://localhost:3000/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d "{\"targetDate\": \"2026-02-15\", \"basePrice\": 180}"
```

### 4. Build for Production

```bash
npm run build
```

Output: `dist/` directory with compiled JavaScript

## Understanding the Formula

### Exponential Urgency Formula

```
multiplier = exp(steepness × (1 - days_out/lookback_window))
```

With default parameters (steepness=2.0, lookback=90):

| Days Out | Calculation | Multiplier | Price ($180 base) |
|----------|-------------|------------|-------------------|
| 90       | exp(2.0 × (1 - 90/90)) = exp(0) | 1.0x | $180 |
| 30       | exp(2.0 × (1 - 30/90)) = exp(1.33) | 2.2x | $396 |
| 14       | exp(2.0 × (1 - 14/90)) = exp(1.69) | 3.2x | $576 |
| 7        | exp(2.0 × (1 - 7/90)) = exp(1.84) | 4.5x | $810 |
| 3        | exp(2.0 × (1 - 3/90)) = exp(1.93) | 6.4x | $1,152 |
| 1        | exp(2.0 × (1 - 1/90)) = exp(1.98) | 8.8x | $1,584 |

### Market Demand Example

```
totalMultiplier = base × dayOfWeek × seasonal × event
                = 1.0 × 1.25 × 1.0 × 1.0
                = 1.25 (Monday in normal season)
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <pid> /F

# Or use different port
set PORT=3001
npm run dev
```

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping

# If not, start Redis
redis-server

# Or disable caching temporarily
set ENABLE_CACHING=false
npm run dev
```

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Verify DATABASE_URL in .env
echo %DATABASE_URL%

# Test connection
psql %DATABASE_URL% -c "SELECT 1"
```

### TypeScript Compilation Errors

```bash
# Clean and rebuild
rmdir /s /q dist
npm run build

# Check for type errors
npm run typecheck
```

## Next Steps

1. **Read Full Documentation**: See `README.md`
2. **Review API Endpoints**: See `src/api/routes.ts`
3. **Understand Core Logic**: See `src/core/urgencyCalculator.ts`
4. **Deploy to Production**: See `DEPLOYMENT.md`
5. **View Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`

## Quick Reference

### Environment Variables

```bash
PORT=3000                          # Server port
DATABASE_URL=postgresql://...      # Database connection
REDIS_URL=redis://...              # Redis connection
URGENCY_STEEPNESS=2.0             # Urgency curve steepness
LOG_LEVEL=info                     # Logging level
```

### NPM Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run all tests
npm run test:unit    # Run unit tests
npm run test:watch   # Watch mode testing
npm run lint         # Lint code
npm run format       # Format code
```

### API Endpoints

```bash
POST   /api/pricing/calculate      # Single pricing calculation
POST   /api/pricing/batch          # Batch pricing (up to 100)
GET    /api/pricing/quick          # Quick pricing
POST   /api/pricing/calendar       # Calendar view (up to 90 dates)
POST   /api/pricing/events         # Add event multiplier
GET    /api/pricing/stats          # Cache statistics
GET    /api/pricing/health         # Health check
GET    /health                     # Health check
```

### Key Files

```
src/core/urgencyCalculator.ts      # Exponential formula
src/core/marketDemandCalculator.ts # Market multipliers
src/api/routes.ts                  # API endpoints
src/cache/urgencyPricingCache.ts   # Redis caching
src/db/urgencyPricingRepository.ts # Database layer
```

## Support

For issues or questions:
1. Check `README.md` for detailed documentation
2. Review `DEPLOYMENT.md` for production setup
3. See `IMPLEMENTATION_SUMMARY.md` for architecture details
4. Refer to `FILE_INDEX.md` for file navigation

---

**Time to Get Started**: ~10 minutes
**Next Step**: Test the `/calculate` endpoint!
