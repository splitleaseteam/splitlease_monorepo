# Pattern 3: Price Anchoring - Backend Index

## Quick Navigation

### 📚 Documentation
- [README.md](./README.md) - Main documentation, API reference, architecture
- [SUMMARY.md](./SUMMARY.md) - Project overview, deliverables, metrics
- [EXAMPLES.md](./EXAMPLES.md) - Code examples, integration guides
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide, production checklist

### 🗄️ Database
- [001_pricing_tiers_schema.sql](./supabase/migrations/001_pricing_tiers_schema.sql) - Complete database schema

### ⚡ Edge Functions
- [get_pricing_tiers](./supabase/functions/get_pricing_tiers/index.ts) - Returns pricing tiers
- [track_tier_selection](./supabase/functions/track_tier_selection/index.ts) - Records selections
- [calculate_savings](./supabase/functions/calculate_savings/index.ts) - Calculates savings
- [cors.ts](./supabase/functions/_shared/cors.ts) - Shared CORS headers

### 📦 Service Layer
- [priceAnchoringService.ts](./lib/priceAnchoringService.ts) - Core business logic
- [types.ts](./lib/types.ts) - TypeScript type definitions

### 🧪 Tests
- [priceAnchoringService.test.ts](./tests/priceAnchoringService.test.ts) - Unit tests
- [edgeFunctions.test.ts](./tests/edgeFunctions.test.ts) - Integration tests
- [setup.ts](./tests/setup.ts) - Test configuration

### ⚙️ Configuration
- [package.json](./package.json) - Dependencies and scripts
- [tsconfig.json](./tsconfig.json) - TypeScript configuration
- [vitest.config.ts](./vitest.config.ts) - Test configuration
- [.eslintrc.json](./.eslintrc.json) - Linting rules
- [.env.example](./.env.example) - Environment template

## File Structure

```
pattern_3/backend/
├── README.md                          # Main documentation
├── SUMMARY.md                         # Project summary
├── EXAMPLES.md                        # Usage examples
├── DEPLOYMENT.md                      # Deployment guide
├── INDEX.md                           # This file
├── package.json                       # NPM configuration
├── tsconfig.json                      # TypeScript config
├── vitest.config.ts                   # Test config
├── .eslintrc.json                     # ESLint config
├── .env.example                       # Environment template
├── .gitignore                         # Git exclusions
│
├── supabase/
│   ├── migrations/
│   │   └── 001_pricing_tiers_schema.sql    # Database schema
│   └── functions/
│       ├── get_pricing_tiers/
│       │   └── index.ts                    # Get tiers Edge Function
│       ├── track_tier_selection/
│       │   └── index.ts                    # Track selection Edge Function
│       ├── calculate_savings/
│       │   └── index.ts                    # Calculate savings Edge Function
│       └── _shared/
│           └── cors.ts                     # Shared CORS headers
│
├── lib/
│   ├── priceAnchoringService.ts       # Service layer
│   └── types.ts                       # Type definitions
│
└── tests/
    ├── priceAnchoringService.test.ts  # Unit tests
    ├── edgeFunctions.test.ts          # Integration tests
    └── setup.ts                       # Test setup
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Deploy database
supabase db push

# 4. Deploy Edge Functions
npm run functions:deploy

# 5. Run tests
npm test

# 6. View documentation
cat README.md
```

## Line Count by Category

- **SQL:** ~900 lines (database schema)
- **TypeScript:** ~3,100 lines (Edge Functions, service layer, tests)
- **Documentation:** ~1,400 lines (README, examples, deployment)
- **Configuration:** ~300 lines (package.json, tsconfig, etc.)
- **Total:** ~6,700 lines

## Key Features

### Database (5 tables, 7 functions)
- `pricing_tiers` - Tier configurations
- `tier_features` - Feature descriptions
- `price_anchoring_events` - Analytics
- `tier_selections` - User selections
- `ab_test_variants` - A/B testing

### Edge Functions (3 functions)
- `get_pricing_tiers` - Returns all tiers with calculations
- `track_tier_selection` - Records user selections
- `calculate_savings` - Calculates savings with formatting

### Service Layer
- Complete TypeScript service
- Type-safe operations
- Error handling
- Analytics tracking

### Tests (80+ test cases)
- Unit tests (50+)
- Integration tests (30+)
- >90% coverage

## API Endpoints

### GET Pricing Tiers
```
POST /functions/v1/get_pricing_tiers
```

### Track Selection
```
POST /functions/v1/track_tier_selection
```

### Calculate Savings
```
POST /functions/v1/calculate_savings
```

## Development Commands

```bash
# Testing
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

# Linting
npm run lint                # Check code
npm run lint:fix            # Fix issues

# Type Checking
npm run typecheck           # Check types

# Database
npm run db:migrate          # Run migrations
npm run db:reset            # Reset database
npm run db:seed             # Seed data

# Edge Functions
npm run functions:deploy    # Deploy all
npm run functions:logs      # View logs

# Development
npm run dev                 # Start local Supabase
npm run stop                # Stop local Supabase
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                          │
│  (React, Next.js, or any client)                        │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────────────────────┐
│                   Edge Functions                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ get_pricing_tiers│  │track_tier_selection│          │
│  └──────────────────┘  └──────────────────┘            │
│  ┌──────────────────┐                                   │
│  │calculate_savings │                                   │
│  └──────────────────┘                                   │
└─────────────────┬───────────────────────────────────────┘
                  │ SQL/RPC
┌─────────────────▼───────────────────────────────────────┐
│                  PostgreSQL Database                     │
│  ┌────────────────┐  ┌─────────────────┐               │
│  │ pricing_tiers  │  │ tier_selections │               │
│  └────────────────┘  └─────────────────┘               │
│  ┌─────────────────┐  ┌──────────────────────────────┐│
│  │ tier_features   │  │ price_anchoring_events       ││
│  └─────────────────┘  └──────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Security Features

- ✅ Row Level Security (RLS)
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ Type safety (TypeScript)
- ✅ CORS configuration
- ✅ Secret management
- ✅ Audit logging

## Performance Features

- ✅ Database indexes
- ✅ Connection pooling
- ✅ Query optimization
- ✅ Edge Function auto-scaling
- ✅ Caching strategy
- ✅ Batch processing

## Monitoring & Analytics

- ✅ Event tracking (6 event types)
- ✅ Performance metrics
- ✅ Error logging
- ✅ Query performance
- ✅ Conversion funnels
- ✅ A/B test results

## Support Resources

- **Documentation:** See [README.md](./README.md)
- **Examples:** See [EXAMPLES.md](./EXAMPLES.md)
- **Deployment:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Tests:** Check tests/ directory for usage patterns
- **Contact:** backend-team@company.com

## Version History

- **v1.0.0** (2026-01-28) - Initial production release
  - Complete database schema
  - 3 Edge Functions
  - Service layer
  - Comprehensive tests
  - Full documentation

## License

Proprietary - Pattern 3 Implementation

---

**Status:** ✅ PRODUCTION READY
**Lines of Code:** ~6,700
**Test Coverage:** >90%
**Documentation:** Complete
