# SkyCrop Railway Deployment Guide

## Overview

This comprehensive guide covers the deployment of SkyCrop to Railway, including both staging and production environments. The guide is based on existing deployment scripts and Railway best practices to ensure reliable, scalable deployments.

## Table of Contents

1. [Prerequisites and Environment Setup](#1-prerequisites-and-environment-setup)
2. [Railway CLI Installation and Authentication](#2-railway-cli-installation-and-authentication)
3. [Project Initialization and Configuration](#3-project-initialization-and-configuration)
4. [Environment Variables Setup](#4-environment-variables-setup)
5. [Database and Redis Configuration](#5-database-and-redis-configuration)
6. [Deployment Commands and Monitoring](#6-deployment-commands-and-monitoring)
7. [Post-Deployment Verification Steps](#7-post-deployment-verification-steps)
8. [Troubleshooting Common Issues](#8-troubleshooting-common-issues)

---

## 1. Prerequisites and Environment Setup

### System Requirements

- **Node.js**: Version 18 or higher
- **npm**: Latest version
- **Git**: For version control
- **Railway Account**: [railway.app](https://railway.app)
- **API Keys**: OpenWeatherMap, external services

### Required Accounts and Services

- [ ] Railway account with billing enabled
- [ ] OpenWeatherMap API key ([openweathermap.org](https://openweathermap.org/api))
- [ ] SendGrid account (optional, for email notifications)
- [ ] Firebase project (optional, for push notifications)
- [ ] Sentry account (optional, for error tracking)

### Local Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd SkyCrop

# Install dependencies
cd backend
npm install

# Copy environment template
cp backend-env-example.txt .env

# Configure local environment variables
# Edit .env with your local settings
```

### Pre-Deployment Checklist

Run the pre-deployment checklist script:

```bash
cd backend
./scripts/pre-deployment-checklist.sh
```

This script validates:
- ✅ Backend tests passing
- ✅ Test coverage >80%
- ✅ Environment configuration files
- ✅ Required environment variables
- ✅ OpenAPI documentation
- ✅ Dependencies installed
- ✅ Database migrations ready
- ✅ Code linting
- ✅ Security checks

---

## 2. Railway CLI Installation and Authentication

### Install Railway CLI

**Windows:**
```bash
npm install -g @railway/cli
```

**macOS:**
```bash
brew install railway
```

**Linux:**
```bash
npm install -g @railway/cli
```

**Or use npx (no installation required):**
```bash
npx @railway/cli
```

### Authenticate with Railway

```bash
# Login to Railway
railway login

# Verify authentication
railway whoami
```

**Expected Output:**
```
Logged in as: your-email@example.com
```

### Link to Existing Project (Optional)

If you have an existing Railway project:

```bash
# Link to existing project
railway link

# Or link to specific project
railway link --project <project-id>
```

---

## 3. Project Initialization and Configuration

### Create New Railway Project

```bash
# Initialize new project
railway init

# Name your project (e.g., skycrop-backend)
# Choose your preferred region
```

### Add Required Services

#### PostgreSQL Database
```bash
# Add PostgreSQL service
railway add --database postgres

# Verify database is added
railway services
```

#### Redis Cache
```bash
# Add Redis service
railway add --database redis

# Verify Redis is added
railway services
```

### Project Structure Configuration

Railway automatically detects your project structure. Ensure your `backend/` directory contains:

- `package.json`
- `Procfile` (optional, Railway auto-detects Node.js apps)
- `railway.json` (created automatically)

### Environment-Specific Projects

**Recommended Approach:**
- Create separate Railway projects for staging and production
- Use consistent naming: `skycrop-staging`, `skycrop-production`

**Single Project with Environments:**
- Use Railway environments feature
- Deploy to different environments within one project

---

## 4. Environment Variables Setup

### Core Required Variables

```bash
# Set environment
railway variables:set NODE_ENV=production

# Server configuration
railway variables:set PORT=3000

# Security
railway variables:set JWT_SECRET=your-super-secure-jwt-secret-change-this

# External APIs
railway variables:set OPENWEATHER_API_KEY=your-openweather-api-key
railway variables:set ML_SERVICE_URL=https://your-ml-service.railway.app
```

### Database and Redis (Auto-configured)

Railway automatically sets these when you add database services:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

### Optional Services Configuration

#### Email Notifications (SendGrid)
```bash
railway variables:set EMAIL_PROVIDER=sendgrid
railway variables:set SENDGRID_API_KEY=your-sendgrid-api-key
railway variables:set EMAIL_FROM=no-reply@skycrop.app
```

#### Push Notifications (Firebase)
```bash
railway variables:set PUSH_PROVIDER=fcm
railway variables:set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"skycrop-prod",...}'
```

#### Error Monitoring (Sentry)
```bash
railway variables:set SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
railway variables:set SENTRY_ENVIRONMENT=production
```

### Environment-Specific Variables

**Staging Environment:**
```bash
railway variables:set NODE_ENV=staging
railway variables:set CORS_ORIGIN=https://staging.skycrop.app
railway variables:set LOG_LEVEL=debug
```

**Production Environment:**
```bash
railway variables:set NODE_ENV=production
railway variables:set CORS_ORIGIN=https://skycrop.app,https://www.skycrop.app
railway variables:set LOG_LEVEL=warn
```

### Rate Limiting and Security

```bash
# Rate limiting
railway variables:set RATE_LIMIT_WINDOW_MS=900000
railway variables:set RATE_LIMIT_MAX_REQUESTS=100

# CORS
railway variables:set CORS_ORIGIN=https://your-frontend-domain.com
```

### Caching Configuration

```bash
# Cache TTL settings
railway variables:set WEATHER_CACHE_TTL_SEC=3600
railway variables:set HEALTH_CACHE_TTL_SEC=600
railway variables:set ML_PREDICT_CACHE_TTL_SECONDS=86400
```

### Environment Variables Reference Table

| Variable | Required | Staging | Production | Description |
|----------|----------|---------|------------|-------------|
| `NODE_ENV` | Yes | `staging` | `production` | Environment mode |
| `PORT` | Yes | `3000` | `3000` | Server port |
| `DATABASE_URL` | Yes | Auto-set | Auto-set | PostgreSQL URL |
| `REDIS_URL` | Yes | Auto-set | Auto-set | Redis URL |
| `JWT_SECRET` | Yes | Secure | Secure | JWT signing key |
| `OPENWEATHER_API_KEY` | Yes | Test key | Prod key | Weather API key |
| `ML_SERVICE_URL` | Yes | Staging ML | Prod ML | ML service URL |
| `EMAIL_PROVIDER` | No | `console` | `sendgrid` | Email service |
| `SENTRY_DSN` | No | Optional | Required | Error tracking |
| `CORS_ORIGIN` | No | `*` | Specific | Allowed origins |

---

## 5. Database and Redis Configuration

### PostgreSQL Setup

Railway provides PostgreSQL with PostGIS support. The database is automatically configured when you add the PostgreSQL service.

#### Enable PostGIS Extension

```bash
# Connect to Railway database
railway run psql $DATABASE_URL

# Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Exit psql
\q
```

#### Database Migrations

Run migrations using the provided script:

```bash
# Run database migrations
cd backend
./scripts/run-migration-railway.sh

# Or run directly
railway run node src/scripts/migrate.js
```

#### Field Metrics Trigger Setup

The `compute_field_metrics` trigger is crucial for field creation. Run this SQL in your Railway database:

```sql
-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION compute_field_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize to SRID 4326 and MultiPolygon, force 2D
  NEW.boundary := ST_Multi(ST_Force2D(ST_SetSRID(NEW.boundary, 4326)));

  -- Calculate center point from boundary centroid
  NEW.center := ST_SetSRID(ST_Centroid(NEW.boundary), 4326);

  -- Calculate area in square meters using geography
  NEW.area_sqm := ST_Area(NEW.boundary::geography);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_fields_compute ON fields;
CREATE TRIGGER trg_fields_compute
BEFORE INSERT OR UPDATE OF boundary ON fields
FOR EACH ROW
EXECUTE FUNCTION compute_field_metrics();
```

#### Verify Trigger Setup

```sql
-- Check if trigger exists
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'trg_fields_compute';
```

### Redis Configuration

Redis is automatically configured when you add the Redis service. Railway provides:
- Connection URL via `REDIS_URL` environment variable
- Automatic backups
- High availability

#### Redis Health Check

```bash
# Test Redis connection
railway run redis-cli -u $REDIS_URL ping
```

**Expected Output:**
```
PONG
```

---

## 6. Deployment Commands and Monitoring

### Staging Deployment

Use the staging deployment script:

```bash
cd backend
./scripts/deploy-staging.sh
```

**What the script does:**
1. ✅ Checks Railway CLI installation
2. ✅ Verifies authentication
3. ✅ Links to Railway project
4. ✅ Sets environment variables
5. ✅ Deploys backend service
6. ✅ Waits for deployment completion
7. ✅ Runs database migrations
8. ✅ Performs health checks
9. ✅ Deploys ML service (if configured)
10. ✅ Provides deployment summary

### Production Deployment

For production deployments, use careful, monitored approach:

```bash
# 1. Run pre-deployment checks
cd backend
./scripts/pre-deployment-checklist.sh

# 2. Validate environment
./scripts/validate-environment.sh

# 3. Deploy to production
railway up --service backend --detach

# 4. Wait for deployment
sleep 30

# 5. Run migrations
railway run --service backend npm run migrate

# 6. Monitor deployment
./scripts/monitor-deployment.sh production 300
```

### Blue-Green Deployment (Advanced)

For zero-downtime deployments:

```bash
# Deploy new version alongside current
railway scale backend 2

# Test new deployment
# ... run smoke tests ...

# Switch traffic to new deployment
railway scale backend 1

# Clean up old deployment
railway scale backend 1
```

### Canary Deployment (Advanced)

```bash
# Deploy canary version
railway up --service backend-canary --detach

# Route 10% traffic to canary
# (Configure in Railway dashboard)

# Monitor canary performance
./scripts/monitor-deployment.sh production 300

# Full rollout or rollback based on results
```

### Monitoring Commands

#### Real-time Logs
```bash
# View live logs
railway logs --follow --service backend

# View last 100 lines
railway logs --tail 100 --service backend

# Filter logs
railway logs | grep ERROR
```

#### Deployment Status
```bash
# Check deployment status
railway status --service backend

# Get deployment URL
railway domain --service backend

# List deployments
railway deployments
```

#### Health Monitoring
```bash
# Run health check script
cd backend
./scripts/health-check.js

# Monitor deployment for 5 minutes
./scripts/monitor-deployment.sh production 300
```

### Automated Monitoring Setup

Configure alerts in Railway dashboard:
- CPU usage > 80%
- Memory usage > 85%
- Response time > 1000ms
- Error rate > 5%

---

## 7. Post-Deployment Verification Steps

### Health Checks

#### Application Health
```bash
# Get deployment URL
DEPLOYMENT_URL=$(railway domain --service backend)

# Check health endpoint
curl -s https://$DEPLOYMENT_URL/health | jq
```

**Expected Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2024-12-07T05:28:00Z",
  "version": "1.0.0"
}
```

#### Database Health
```bash
# Test database connection
railway run --service backend npm run db:check
```

#### Redis Health
```bash
# Test Redis connection
railway run --service backend npm run redis:check
```

### Smoke Tests

Run comprehensive smoke tests:

```bash
cd backend

# Run API smoke tests
./scripts/smoke-tests.sh

# Or run manually
# 1. Health check
curl https://$DEPLOYMENT_URL/health

# 2. Authentication test
TOKEN=$(curl -X POST https://$DEPLOYMENT_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | jq -r '.token')

# 3. Protected endpoint test
curl https://$DEPLOYMENT_URL/api/v1/fields \
  -H "Authorization: Bearer $TOKEN"
```

### API Endpoint Verification

Test key endpoints:

```bash
# Health Monitoring
curl "https://$DEPLOYMENT_URL/api/v1/fields/{fieldId}/health/history?period=30d" \
  -H "Authorization: Bearer $TOKEN"

# Recommendations
curl "https://$DEPLOYMENT_URL/api/v1/fields/{fieldId}/recommendations" \
  -H "Authorization: Bearer $TOKEN"

# Yield Predictions
curl "https://$DEPLOYMENT_URL/api/v1/fields/{fieldId}/yield/predictions" \
  -H "Authorization: Bearer $TOKEN"

# Weather Data
curl "https://$DEPLOYMENT_URL/api/v1/weather/current?lat=6.9271&lon=79.8612" \
  -H "Authorization: Bearer $TOKEN"
```

### Performance Verification

```bash
# Load testing (optional)
npm install -g artillery

# Run load test
artillery quick --count 50 --num 10 https://$DEPLOYMENT_URL/health
```

### External Service Integration

Verify integrations:

```bash
# OpenWeatherMap API
curl "https://api.openweathermap.org/data/2.5/weather?q=Colombo&appid=$OPENWEATHER_API_KEY"

# ML Service (if deployed)
curl https://$ML_SERVICE_URL/health
```

### Notification Queue Status

```bash
# Check queue stats
curl "https://$DEPLOYMENT_URL/api/v1/notifications/queue/stats" \
  -H "Authorization: Bearer $TOKEN"
```

### Data Integrity Checks

```bash
# Run data integrity verification
cd backend
./scripts/data-integrity-check.js
```

---

## 8. Troubleshooting Common Issues

### Application Won't Start

**Symptoms:**
- Deployment fails
- Health checks return 500 errors
- Logs show startup errors

**Solutions:**

1. **Check Environment Variables**
   ```bash
   railway variables:list
   ```
   Ensure all required variables are set.

2. **Review Logs**
   ```bash
   railway logs --tail 100 --service backend
   ```

3. **Common Issues:**
   - Missing `DATABASE_URL` or `REDIS_URL`
   - Invalid `JWT_SECRET`
   - Database connection failures
   - Port conflicts

### Database Connection Issues

**Symptoms:**
- "Connection refused" errors
- Migration failures
- Field creation fails

**Solutions:**

1. **Verify Database Service**
   ```bash
   railway services
   ```

2. **Test Database Connection**
   ```bash
   railway run psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Check PostGIS Extension**
   ```sql
   SELECT PostGIS_version();
   ```

4. **Re-run Migrations**
   ```bash
   railway run node src/scripts/migrate.js
   ```

### Field Creation Failures

**Symptoms:**
- `notNull Violation: Field.area_sqm cannot be null`

**Solution:**
Re-setup the field metrics trigger (see Section 5).

### Redis Connection Issues

**Symptoms:**
- Caching not working
- Session errors
- Queue failures

**Solutions:**

1. **Test Redis Connection**
   ```bash
   railway run redis-cli -u $REDIS_URL ping
   ```

2. **Check Redis Service**
   ```bash
   railway services
   ```

### High Memory/CPU Usage

**Symptoms:**
- Application crashes
- Slow response times
- Railway alerts

**Solutions:**

1. **Scale Resources**
   ```bash
   railway scale backend 2
   ```

2. **Check Memory Leaks**
   ```bash
   railway logs | grep "heap"
   ```

3. **Optimize Queries**
   - Check database query performance
   - Implement proper indexing

### External API Failures

**Symptoms:**
- Weather data not loading
- ML predictions failing

**Solutions:**

1. **Verify API Keys**
   ```bash
   railway variables:get OPENWEATHER_API_KEY
   ```

2. **Test External APIs**
   ```bash
   curl "https://api.openweathermap.org/data/2.5/weather?q=Colombo&appid=$OPENWEATHER_API_KEY"
   ```

3. **Check Rate Limits**
   - Monitor API usage
   - Implement caching

### Rollback Procedures

If deployment fails:

```bash
# List recent deployments
railway deployments

# Rollback to previous version
railway rollback <previous-deployment-id>

# Or use rollback script
cd backend
./scripts/rollback.sh production "Failed deployment fix"
```

### Performance Issues

**Slow Response Times:**

1. **Enable Caching**
   - Verify Redis is working
   - Check cache TTL settings

2. **Database Optimization**
   ```sql
   -- Check slow queries
   SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
   ```

3. **Scale Application**
   ```bash
   railway scale backend 3
   ```

### SSL/Certificate Issues

Railway provides automatic SSL certificates. If HTTPS issues occur:

1. **Wait for Certificate Propagation**
   - SSL certificates can take up to 24 hours

2. **Check Domain Configuration**
   ```bash
   railway domain
   ```

3. **Force HTTPS Redirect**
   - Configure in Railway dashboard

### Log Analysis

**Useful Commands:**

```bash
# Search for errors
railway logs | grep -i error

# Search for specific endpoint
railway logs | grep "/api/v1/fields"

# Monitor real-time
railway logs --follow | grep -v "health"
```

### Getting Help

1. **Railway Support**
   - Dashboard: https://railway.app/dashboard
   - Docs: https://docs.railway.app/
   - Discord: https://railway.app/discord

2. **Check Existing Issues**
   - Review `backend/database/QUICK_RAILWAY_FIX.md`
   - Check `backend/docs/DEPLOYMENT_GUIDE.md`

3. **Team Support**
   - Slack: #backend-support
   - Email: dev-team@skycrop.com

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run `./scripts/pre-deployment-checklist.sh`
- [ ] Validate environment variables
- [ ] Test external API keys
- [ ] Ensure database migrations are ready
- [ ] Backup current production data

### During Deployment
- [ ] Monitor deployment logs
- [ ] Wait for health checks to pass
- [ ] Run database migrations
- [ ] Verify service URLs

### Post-Deployment
- [ ] Run smoke tests
- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Set up alerts and monitoring
- [ ] Update documentation

### Rollback Plan
- [ ] Identify rollback trigger conditions
- [ ] Test rollback procedure
- [ ] Document rollback steps
- [ ] Have previous deployment ID ready

---

## Best Practices

### Security
- Use strong, unique `JWT_SECRET`
- Rotate API keys regularly
- Enable Sentry error tracking
- Configure CORS properly
- Use HTTPS only

### Performance
- Enable Redis caching
- Monitor memory usage
- Scale based on load
- Optimize database queries
- Use CDN for static assets

### Monitoring
- Set up Railway alerts
- Configure Sentry notifications
- Monitor health endpoints
- Log important events
- Track performance metrics

### Deployment
- Test in staging first
- Use blue-green deployments for production
- Have rollback plan ready
- Document all changes
- Communicate with team

---

**Deployment Guide Complete! 🚀**

For additional support, refer to:
- `backend/docs/DEPLOYMENT_GUIDE.md`
- `backend/scripts/` directory
- Railway documentation: https://docs.railway.app/