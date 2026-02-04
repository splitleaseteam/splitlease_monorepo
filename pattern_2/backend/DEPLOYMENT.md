# Deployment Guide - Pattern 2: Urgency Countdown Backend

Production deployment guide for urgency pricing backend system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Redis Setup](#redis-setup)
5. [Application Deployment](#application-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Monitoring & Logging](#monitoring--logging)
8. [Scaling](#scaling)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: >= 18.0.0
- **PostgreSQL**: >= 14.0
- **Redis**: >= 6.0
- **RAM**: Minimum 2GB (4GB recommended)
- **CPU**: Minimum 2 cores (4 cores recommended)
- **Storage**: 20GB minimum

### Required Tools

```bash
# Node.js and npm
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0

# PostgreSQL client
psql --version

# Redis client
redis-cli --version

# Docker (optional)
docker --version
docker-compose --version
```

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd pattern_2/backend
```

### 2. Install Dependencies

```bash
npm ci --only=production
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with production values:

```bash
# Production configuration
NODE_ENV=production
PORT=3000

# Database (use production credentials)
DATABASE_URL=postgresql://user:password@prod-db.example.com:5432/urgency_pricing
DB_POOL_SIZE=20
DB_SSL=true

# Redis (use production endpoint)
REDIS_URL=redis://prod-redis.example.com:6379
ENABLE_CACHING=true

# Urgency configuration (from simulation)
URGENCY_STEEPNESS=2.0
URGENCY_LOOKBACK_WINDOW=90

# API configuration
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_CORS=true
CORS_ORIGINS=https://your-frontend.com

# Background jobs
ENABLE_SCHEDULER=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

## Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -h prod-db.example.com -U postgres

# Create database
CREATE DATABASE urgency_pricing;

# Create user (if needed)
CREATE USER urgency_user WITH PASSWORD 'secure_password';

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE urgency_pricing TO urgency_user;
```

### 2. Run Migrations

```bash
# Run migration SQL file
psql -h prod-db.example.com \
     -U urgency_user \
     -d urgency_pricing \
     -f src/db/migrations/001_create_urgency_pricing_tables.sql
```

### 3. Verify Tables

```sql
-- Connect to database
\c urgency_pricing

-- List tables
\dt

-- Should show:
-- - urgency_pricing_cache
-- - market_demand_multipliers
-- - event_multipliers
-- - urgency_pricing_config
```

### 4. Index Optimization

```sql
-- Analyze tables for query optimization
ANALYZE urgency_pricing_cache;
ANALYZE market_demand_multipliers;
ANALYZE event_multipliers;
```

## Redis Setup

### 1. Configure Redis

```bash
# Redis configuration file (redis.conf)
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

### 2. Start Redis

```bash
# Start Redis with configuration
redis-server /etc/redis/redis.conf

# Verify connection
redis-cli ping  # Should return PONG
```

### 3. Test Connection

```bash
# Set test key
redis-cli set test "urgency_pricing_ready"

# Get test key
redis-cli get test

# Delete test key
redis-cli del test
```

## Application Deployment

### 1. Build Application

```bash
# Build TypeScript to JavaScript
npm run build

# Verify build
ls dist/
```

### 2. Start Application

```bash
# Using npm
npm start

# Or using PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name urgency-pricing

# Save PM2 configuration
pm2 save
pm2 startup
```

### 3. Verify Application

```bash
# Health check
curl http://localhost:3000/health

# Should return:
# {"status":"healthy","service":"urgency-pricing","version":"1.0.0"}

# Test pricing endpoint
curl -X POST http://localhost:3000/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "targetDate": "2026-02-15T00:00:00Z",
    "basePrice": 180
  }'
```

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
# Production Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
```

### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/urgency_pricing
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=urgency_pricing
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 3. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3

# Stop services
docker-compose down
```

## Monitoring & Logging

### 1. Application Logs

```bash
# PM2 logs
pm2 logs urgency-pricing

# Docker logs
docker-compose logs -f app

# Tail logs
tail -f /var/log/urgency-pricing.log
```

### 2. Metrics Monitoring

Key metrics to monitor:

- **Request rate**: Requests per second
- **Response time**: P50, P95, P99 latency
- **Cache hit rate**: Percentage of cache hits
- **Error rate**: 4xx and 5xx responses
- **Database connections**: Active connection count
- **Redis memory**: Memory usage
- **Job execution time**: Background job duration

### 3. Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Cache statistics
curl http://localhost:3000/api/pricing/stats

# Database health
psql -c "SELECT 1" $DATABASE_URL

# Redis health
redis-cli ping
```

## Scaling

### Horizontal Scaling

```bash
# Using PM2 cluster mode
pm2 start dist/index.js -i max --name urgency-pricing

# Using Docker Compose
docker-compose up -d --scale app=5

# Using Kubernetes (example)
kubectl scale deployment urgency-pricing --replicas=5
```

### Load Balancing

Example Nginx configuration:

```nginx
upstream urgency_pricing {
    least_conn;
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://urgency_pricing;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Database Scaling

- **Read replicas**: Set up PostgreSQL read replicas for analytics queries
- **Connection pooling**: Use PgBouncer for connection pooling
- **Partitioning**: Partition `urgency_pricing_cache` by date

### Redis Scaling

- **Redis Cluster**: For high availability
- **Redis Sentinel**: For automatic failover
- **Separate caches**: Separate cache instances for different urgency levels

## Backup & Recovery

### Database Backup

```bash
# Automated daily backup
0 2 * * * pg_dump -h prod-db.example.com -U urgency_user urgency_pricing | gzip > /backups/urgency_pricing_$(date +\%Y\%m\%d).sql.gz

# Backup with custom format
pg_dump -h prod-db.example.com -U urgency_user -Fc urgency_pricing > backup.dump

# Restore from backup
pg_restore -h prod-db.example.com -U urgency_user -d urgency_pricing backup.dump
```

### Redis Backup

```bash
# Enable Redis persistence
redis-cli CONFIG SET save "900 1 300 10 60 10000"

# Manual snapshot
redis-cli BGSAVE

# Copy RDB file
cp /var/lib/redis/dump.rdb /backups/redis_$(date +%Y%m%d).rdb
```

## Troubleshooting

### Common Issues

**Issue**: High response times

```bash
# Check cache hit rate
curl http://localhost:3000/api/pricing/stats

# Check database connections
psql -c "SELECT count(*) FROM pg_stat_activity" $DATABASE_URL

# Check Redis memory
redis-cli INFO memory
```

**Issue**: Database connection errors

```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check pool size
grep DB_POOL_SIZE .env
```

**Issue**: Redis connection errors

```bash
# Check Redis status
redis-cli ping

# Check Redis logs
tail -f /var/log/redis/redis.log

# Test connection
redis-cli -h <redis-host> -p <redis-port> ping
```

**Issue**: High memory usage

```bash
# Check Node.js memory
pm2 monit

# Check Redis memory
redis-cli INFO memory

# Adjust Redis maxmemory
redis-cli CONFIG SET maxmemory 2gb
```

### Debug Mode

Enable debug logging:

```bash
# Set log level to debug
export LOG_LEVEL=debug

# Restart application
pm2 restart urgency-pricing

# View debug logs
pm2 logs urgency-pricing --lines 100
```

## Security Checklist

- [ ] Environment variables secured (no hardcoded secrets)
- [ ] Database SSL enabled
- [ ] Redis password set
- [ ] CORS configured with specific origins
- [ ] Rate limiting enabled
- [ ] Helmet.js security headers enabled
- [ ] Regular dependency updates
- [ ] Database backups automated
- [ ] Monitoring and alerting configured
- [ ] Firewall rules configured

## Production Checklist

- [ ] All tests passing (`npm test`)
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis configured and running
- [ ] Health check endpoint responding
- [ ] Cache statistics endpoint working
- [ ] Background jobs scheduler running
- [ ] Monitoring configured
- [ ] Logging configured
- [ ] Backups automated
- [ ] Load testing completed
- [ ] Security audit completed

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0
