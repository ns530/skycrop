# SkyCrop Backend Deployment Guide

## Overview
This guide covers deployment of the SkyCrop backend API to production environments, specifically Railway and AWS.

---

## Prerequisites

### 1. Required Accounts
- [ ] Railway account (https://railway.app)
- [ ] PostgreSQL database (Railway provides this)
- [ ] Redis instance (Railway provides this)
- [ ] OpenWeather API key (https://openweathermap.org/api)
- [ ] Sentry account (optional, https://sentry.io)

### 2. Optional Services
- [ ] SendGrid account (for email notifications)
- [ ] AWS SES (alternative for email)
- [ ] Firebase project (for push notifications)

---

## Railway Deployment

### Step 1: Install Railway CLI
```bash
# Windows
npm install -g @railway/cli

# macOS
brew install railway

# Or use npx (no installation needed)
npx @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```

### Step 3: Create New Project
```bash
# Option 1: Create from scratch
railway init

# Option 2: Link existing project
railway link
```

### Step 4: Add Services

#### PostgreSQL Database
```bash
railway add --database postgres
```

#### Redis Cache
```bash
railway add --database redis
```

### Step 5: Configure Environment Variables
```bash
# Core variables (required)
railway variables:set NODE_ENV=production
railway variables:set PORT=3000
railway variables:set JWT_SECRET=your-super-secret-jwt-key-change-this

# Database (automatically set by Railway when you add PostgreSQL)
# DATABASE_URL is automatically populated

# Redis (automatically set by Railway when you add Redis)
# REDIS_URL is automatically populated

# External Services
railway variables:set OPENWEATHER_API_KEY=your-openweather-api-key
railway variables:set ML_SERVICE_URL=https://your-ml-service.railway.app

# Notification Services (optional)
railway variables:set EMAIL_PROVIDER=sendgrid  # or aws-ses or console
railway variables:set SENDGRID_API_KEY=your-sendgrid-key  # if using SendGrid
railway variables:set PUSH_PROVIDER=fcm  # or console
railway variables:set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'  # if using FCM

# Monitoring (optional)
railway variables:set SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890123

# CORS Configuration
railway variables:set CORS_ORIGIN=https://your-frontend.app,https://www.your-frontend.app

# Rate Limiting
railway variables:set RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
railway variables:set RATE_LIMIT_MAX_REQUESTS=100

# Caching
railway variables:set WEATHER_CACHE_TTL_SEC=3600
railway variables:set HEALTH_CACHE_TTL_SEC=600
```

### Step 6: Deploy
```bash
cd backend
railway up
```

### Step 7: Run Database Migrations
```bash
# If you have migrations
railway run npm run migrate

# Or connect to database shell
railway run npm run db:seed
```

### Step 8: Check Logs
```bash
railway logs
```

### Step 9: Get Deployment URL
```bash
railway domain
```

---

## Environment Variables Reference

### Core Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Environment: `development`, `staging`, `production` |
| `PORT` | Yes | `3000` | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `REDIS_URL` | Yes | - | Redis connection string |
| `JWT_SECRET` | Yes | - | Secret for JWT token signing |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiration time |

### External Services

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENWEATHER_API_KEY` | Yes | - | OpenWeather API key for weather data |
| `ML_SERVICE_URL` | Yes | - | ML service base URL |

### Email Notifications

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_PROVIDER` | No | `console` | `sendgrid`, `aws-ses`, or `console` |
| `EMAIL_FROM` | No | `no-reply@skycrop.app` | From email address |
| `SENDGRID_API_KEY` | Conditional | - | Required if `EMAIL_PROVIDER=sendgrid` |
| `AWS_ACCESS_KEY_ID` | Conditional | - | Required if `EMAIL_PROVIDER=aws-ses` |
| `AWS_SECRET_ACCESS_KEY` | Conditional | - | Required if `EMAIL_PROVIDER=aws-ses` |
| `AWS_REGION` | Conditional | `us-east-1` | AWS region for SES |

### Push Notifications

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PUSH_PROVIDER` | No | `console` | `fcm` or `console` |
| `FIREBASE_SERVICE_ACCOUNT` | Conditional | - | Firebase service account JSON (required if `PUSH_PROVIDER=fcm`) |

### Bull Queue (Notifications)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `USE_NOTIFICATION_QUEUE` | No | `true` | Enable async notification queue |
| `USE_BULL_QUEUE` | No | `true` | Enable Bull queue for notifications |

### Caching

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WEATHER_CACHE_TTL_SEC` | No | `3600` | Weather data cache TTL (1 hour) |
| `HEALTH_CACHE_TTL_SEC` | No | `600` | Health data cache TTL (10 minutes) |
| `YIELD_CACHE_TTL_SEC` | No | `600` | Yield data cache TTL (10 minutes) |
| `ML_PREDICT_CACHE_TTL_SECONDS` | No | `86400` | ML prediction cache TTL (24 hours) |

### CORS

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins (comma-separated) |

### Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |
| `AUTH_RATE_LIMIT_WINDOW_MS` | No | `300000` | Auth rate limit window (5 minutes) |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | No | `5` | Max auth requests per window |

### Monitoring & Logging

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_DSN` | No | - | Sentry DSN for error tracking |
| `SENTRY_ENVIRONMENT` | No | `$NODE_ENV` | Sentry environment tag |
| `LOG_LEVEL` | No | `info` | Winston log level: `error`, `warn`, `info`, `debug` |

---

## Firebase Setup (Push Notifications)

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name: "SkyCrop"
4. Follow the wizard

### 2. Enable Cloud Messaging
1. In Firebase console, go to "Cloud Messaging"
2. Enable the API

### 3. Generate Service Account Key
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Minify the JSON (remove whitespace)
5. Set as environment variable:
```bash
railway variables:set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"skycrop-abc123",...}'
```

### 4. Get Server Key (Optional)
1. Go to Project Settings > Cloud Messaging
2. Copy the "Server key"
3. This is used for legacy HTTP API (not needed for Admin SDK)

---

## SendGrid Setup (Email Notifications)

### 1. Create SendGrid Account
1. Go to https://sendgrid.com/
2. Sign up for free (100 emails/day free tier)

### 2. Create API Key
1. Go to Settings > API Keys
2. Click "Create API Key"
3. Name: "SkyCrop Production"
4. Select "Full Access"
5. Copy the API key (shown only once!)

### 3. Configure in Railway
```bash
railway variables:set EMAIL_PROVIDER=sendgrid
railway variables:set SENDGRID_API_KEY=SG.abc123...
railway variables:set EMAIL_FROM=no-reply@skycrop.app
```

### 4. Verify Sender Identity
1. Go to Settings > Sender Authentication
2. Verify a Single Sender (for testing)
3. Or set up Domain Authentication (for production)

---

## AWS SES Setup (Alternative Email)

### 1. Enable AWS SES
1. Log in to AWS Console
2. Go to Amazon SES
3. Choose your region (e.g., us-east-1)

### 2. Verify Email Address
1. Go to "Verified identities"
2. Click "Create identity"
3. Choose "Email address"
4. Enter your sender email
5. Verify via email link

### 3. Create IAM User
1. Go to IAM > Users
2. Create user "skycrop-ses"
3. Attach policy: `AmazonSESFullAccess`
4. Create access key

### 4. Configure in Railway
```bash
railway variables:set EMAIL_PROVIDER=aws-ses
railway variables:set AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
railway variables:set AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
railway variables:set AWS_REGION=us-east-1
railway variables:set EMAIL_FROM=no-reply@skycrop.app
```

### 5. Move Out of Sandbox (Production)
- By default, SES is in sandbox mode (limited sending)
- Request production access: https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html

---

## Database Setup

### PostgreSQL Schema
```bash
# Connect to Railway database
railway run psql $DATABASE_URL

# Run schema creation
\i backend/src/config/schema.sql
```

### Required Extensions
```sql
-- PostGIS (for geospatial queries)
CREATE EXTENSION IF NOT EXISTS postgis;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Tables Created by Application
The application will auto-create tables on first run using Sequelize ORM:
- `users`
- `fields`
- `health_records`
- `recommendations`
- `yield_predictions`
- `actual_yields`
- `device_tokens`
- `weather_cache` (in Redis)

---

## Health Checks

### Application Health
```bash
curl https://your-backend.railway.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "uptime": 123456,
  "timestamp": "2024-11-21T10:00:00Z"
}
```

### Database Health
```bash
railway run npm run db:check
```

### Redis Health
```bash
railway run npm run redis:check
```

---

## Smoke Tests (Post-Deployment)

### 1. Health Check
```bash
curl https://your-backend.railway.app/health
```

### 2. Authentication
```bash
# Register user
curl -X POST https://your-backend.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'

# Login
curl -X POST https://your-backend.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 3. Protected Endpoint (use token from login)
```bash
TOKEN="your-jwt-token"

curl https://your-backend.railway.app/api/v1/fields \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Sprint 3 APIs
```bash
# Health Monitoring
curl "https://your-backend.railway.app/api/v1/fields/{fieldId}/health/history?period=30d" \
  -H "Authorization: Bearer $TOKEN"

# Recommendations
curl "https://your-backend.railway.app/api/v1/fields/{fieldId}/recommendations" \
  -H "Authorization: Bearer $TOKEN"

# Yield Predictions
curl "https://your-backend.railway.app/api/v1/fields/{fieldId}/yield/predictions" \
  -H "Authorization: Bearer $TOKEN"

# Notification Queue Stats
curl "https://your-backend.railway.app/api/v1/notifications/queue/stats" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Monitoring & Logging

### Railway Logs
```bash
# View real-time logs
railway logs --follow

# View last 100 lines
railway logs --tail 100

# Filter by level
railway logs | grep ERROR
```

### Sentry Error Tracking
1. Go to https://sentry.io
2. Navigate to your "SkyCrop-Backend" project
3. Check "Issues" for errors
4. Set up alerts (see SENTRY_SETUP.md)

### Performance Monitoring
- Railway provides built-in metrics:
  - CPU usage
  - Memory usage
  - Network traffic
  - Response times

---

## Scaling

### Auto-Scaling (Railway Pro)
```yaml
# railway.toml
[deploy]
replicas = 1
minReplicas = 1
maxReplicas = 10

[scaling]
cpuThreshold = 80  # Scale when CPU > 80%
memoryThreshold = 85  # Scale when Memory > 85%
```

### Manual Scaling
```bash
# Scale to 3 instances
railway scale 3

# Scale back to 1
railway scale 1
```

---

## Rollback

### Rollback to Previous Deployment
```bash
railway rollback
```

### Rollback to Specific Deployment
```bash
# List deployments
railway deployments

# Rollback to specific deployment
railway rollback <deployment-id>
```

---

## Troubleshooting

### Application Won't Start

**Check Logs:**
```bash
railway logs --tail 100
```

**Common Issues:**
1. **Missing environment variables**
   - Solution: Verify all required env vars are set
   
2. **Database connection failure**
   - Check: `DATABASE_URL` is correct
   - Check: Database service is running
   
3. **Redis connection failure**
   - Check: `REDIS_URL` is correct
   - Check: Redis service is running

### 500 Internal Server Error

**Check:**
1. Sentry for error details
2. Railway logs for stack traces
3. Database connection
4. External service availability (OpenWeather, ML service)

### Slow Performance

**Solutions:**
1. Enable Redis caching (already enabled)
2. Scale to multiple instances
3. Check database indexes (see PERFORMANCE_OPTIMIZATION.md)
4. Monitor external API latency
5. Use CDN for static assets

---

## Security Checklist

### Pre-Production
- [ ] Change `JWT_SECRET` to strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (Railway does this automatically)
- [ ] Configure CORS to specific origins (not `*`)
- [ ] Enable rate limiting (already configured)
- [ ] Set up Sentry for error tracking
- [ ] Enable database backups (Railway automatic)
- [ ] Review and restrict API keys (OpenWeather, SendGrid, Firebase)
- [ ] Disable debug routes in production (already done)

### Database Security
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS for database connections
- [ ] Restrict database access to Railway network only
- [ ] Regular backups (Railway automatic)

### API Security
- [ ] JWT tokens with expiration
- [ ] Password hashing (bcrypt)
- [ ] Input validation (Joi schemas)
- [ ] SQL injection prevention (Sequelize ORM)
- [ ] XSS protection (Helmet middleware)
- [ ] CSRF protection (for browser clients)

---

## Backup & Recovery

### Database Backups (Railway)
- Automatic daily backups (Railway Pro)
- Manual backup: `railway backup create`
- Restore: `railway backup restore <backup-id>`

### Manual Database Backup
```bash
# Export database
railway run pg_dump $DATABASE_URL > backup.sql

# Import database
railway run psql $DATABASE_URL < backup.sql
```

---

## CI/CD Integration

### GitHub Actions (Optional)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy to Railway
        run: railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## Production Checklist

### Before First Deploy
- [ ] All tests passing locally (`npm test`)
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] External services configured (OpenWeather, SendGrid, Firebase)
- [ ] Sentry project created
- [ ] CORS origins configured
- [ ] Rate limits configured

### Post-Deploy
- [ ] Run smoke tests
- [ ] Check health endpoint
- [ ] Verify logs (no errors)
- [ ] Test one API endpoint from each major feature
- [ ] Configure Sentry alerts
- [ ] Set up monitoring dashboard
- [ ] Document deployment in team wiki

---

## Support

**Documentation:**
- API Docs: `backend/src/api/openapi.yaml`
- Sentry Setup: `backend/docs/SENTRY_SETUP.md`
- Performance Optimization: `backend/docs/PERFORMANCE_OPTIMIZATION.md`

**Railway:**
- Dashboard: https://railway.app/dashboard
- Docs: https://docs.railway.app/
- Community: https://railway.app/discord

**Contact:**
- Email: dev-team@skycrop.com (replace with your team email)
- Slack: #backend-support

---

## Appendix: Sample .env File

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/skycrop_prod
REDIS_URL=redis://default:pass@host:6379

# JWT
JWT_SECRET=super-secret-change-this-in-production
JWT_EXPIRES_IN=7d

# External Services
OPENWEATHER_API_KEY=your-openweather-api-key
ML_SERVICE_URL=https://skycrop-ml.railway.app

# Email Notifications
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.abc123...
EMAIL_FROM=no-reply@skycrop.app

# Push Notifications
PUSH_PROVIDER=fcm
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Monitoring
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890123

# CORS
CORS_ORIGIN=https://skycrop.app,https://www.skycrop.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Caching
WEATHER_CACHE_TTL_SEC=3600
HEALTH_CACHE_TTL_SEC=600
```

---

**Deployment Guide Complete!** 🚀

