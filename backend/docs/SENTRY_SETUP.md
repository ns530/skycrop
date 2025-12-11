# Sentry Error Tracking Setup Guide

## Overview

Sentry is integrated into the SkyCrop backend for real-time error tracking, performance monitoring, and alerting. This guide explains the setup, configuration, and usage.

---

## Installation

### 1. Install Sentry Packages

```bash
cd backend
npm install @sentry/node @sentry/profiling-node --save
```

**Packages:**

- `@sentry/node` - Core Sentry SDK for Node.js
- `@sentry/profiling-node` - Performance profiling integration

---

## Configuration

### 2. Get Sentry DSN

1. **Create Sentry Account:**
   - Go to [sentry.io](https://sentry.io)
   - Sign up or log in

2. **Create Project:**
   - Click "Create Project"
   - Select "Node.js" as platform
   - Name it "SkyCrop-Backend"
   - Copy the DSN (Data Source Name)

3. **Add DSN to Environment:**

```bash
# .env (development)
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890123
NODE_ENV=development

# .env.production (production)
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890123
NODE_ENV=production
```

### 3. Sentry Configuration (Already Integrated)

The Sentry integration is already added to `backend/src/app.js`:

```javascript
// Initialize Sentry (must be first!)
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [new Sentry.Integrations.Http({ tracing: true }), new ProfilingIntegration()],
  beforeSend(event, hint) {
    // Filter out 404 errors
    if (event.exception && hint.originalException) {
      const error = hint.originalException;
      if (error.statusCode === 404 || error.status === 404) {
        return null; // Don't send to Sentry
      }
    }
    return event;
  },
});

// Add request handler (must be first middleware)
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... your routes ...

// Add error handler (must be before custom error handler)
app.use(
  Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      if (error.statusCode === 404) return false;
      return true;
    },
  })
);
```

---

## Testing Sentry Integration

### Debug Endpoints (Development/Staging Only)

We've added debug routes for testing Sentry:

#### 1. Test Basic Error Tracking

```bash
curl http://localhost:3000/debug/sentry
```

**Expected:**

- Error thrown and caught by Sentry
- Visible in Sentry dashboard within 1-2 minutes

#### 2. Test Message Capture

```bash
curl http://localhost:3000/debug/sentry-message
```

**Expected:**

- Message logged to Sentry
- Returns 200 OK

#### 3. Test Exception with Context

```bash
curl http://localhost:3000/debug/sentry-exception
```

**Expected:**

- Exception captured with tags and extra data
- Returns 503 Service Unavailable

#### 4. Test Async Error Handling

```bash
curl http://localhost:3000/debug/async-error
```

**Expected:**

- Async error caught and sent to Sentry

#### 5. Test Unhandled Rejection

```bash
curl http://localhost:3000/debug/unhandled-rejection
```

**Expected:**

- Unhandled promise rejection captured

---

## Sentry Dashboard

### Accessing Your Project

1. Go to [sentry.io](https://sentry.io)
2. Navigate to your "SkyCrop-Backend" project
3. Check "Issues" tab for errors

### What You'll See

#### Issue Details:

- **Error Message:** Clear description of what went wrong
- **Stack Trace:** Full call stack for debugging
- **Breadcrumbs:** User actions leading to error
- **Context:**
  - User ID
  - Request URL
  - Request method
  - Environment (dev/staging/production)
  - Release version

#### Performance Monitoring:

- **Transaction Traces:** API endpoint response times
- **Database Queries:** Slow query detection
- **External API Calls:** Third-party service latency

---

## Custom Error Tracking

### Manually Capture Errors

```javascript
const Sentry = require('@sentry/node');

try {
  // Your code
  await someAsyncOperation();
} catch (error) {
  // Capture with context
  Sentry.captureException(error, {
    tags: {
      component: 'recommendation-engine',
      severity: 'high',
    },
    extra: {
      userId: req.user.userId,
      fieldId: req.params.fieldId,
      timestamp: new Date().toISOString(),
    },
  });

  throw error; // Re-throw for normal error handling
}
```

### Capture Messages

```javascript
Sentry.captureMessage('Important event occurred', 'info');

// With severity levels
Sentry.captureMessage('Warning: High API usage', 'warning');
Sentry.captureMessage('Critical: Database connection lost', 'error');
```

### Add User Context

```javascript
// In auth middleware
Sentry.setUser({
  id: req.user.userId,
  email: req.user.email,
  username: `${req.user.firstName} ${req.user.lastName}`,
});
```

### Add Tags

```javascript
Sentry.setTag('api_version', 'v1');
Sentry.setTag('feature', 'yield-prediction');
```

---

## Alerting Configuration

### 1. Alert Rules (Sentry Dashboard)

**Navigate to:** Project Settings > Alerts

**Create Alert Rules:**

#### Critical Error Alert

```yaml
Name: Critical Errors in Production
Condition:
  - Environment is production
  - Error level is error or fatal
Action:
  - Send email to: dev-team@skycrop.com
  - Send Slack notification to: #alerts
Frequency: Immediately
```

#### High Error Rate Alert

```yaml
Name: High Error Rate
Condition:
  - Error count > 50 in 5 minutes
  - Environment is production
Action:
  - Send email to: dev-team@skycrop.com
  - Send PagerDuty alert
Frequency: Every 5 minutes (max)
```

#### Performance Degradation Alert

```yaml
Name: API Performance Degradation
Condition:
  - Transaction duration p95 > 2 seconds
  - In last 10 minutes
Action:
  - Send Slack notification to: #performance
Frequency: Every 10 minutes
```

### 2. Email Notifications

**Configure in:** User Settings > Notifications

- ✅ Issue Alerts (new issues)
- ✅ Weekly Reports
- ✅ Deploy Notifications
- ❌ Resolved Issues (optional)

### 3. Slack Integration

1. Go to Project Settings > Integrations
2. Click "Slack"
3. Authorize Sentry app in your Slack workspace
4. Configure channels:
   - `#alerts` - Critical errors
   - `#sentry` - All errors
   - `#performance` - Performance issues

---

## Best Practices

### 1. Filter Noise

**Don't Send to Sentry:**

- 404 Not Found errors (already filtered)
- Validation errors (400 Bad Request)
- Authentication failures (401/403)
- Rate limit errors (429)

**Implementation:**

```javascript
beforeSend(event, hint) {
  const error = hint.originalException;
  if (error.statusCode < 500) {
    return null; // Don't send client errors
  }
  return event;
}
```

### 2. Add Context

Always add relevant context:

```javascript
Sentry.captureException(error, {
  tags: {
    component: 'health-monitoring',
    api_endpoint: '/api/v1/health/history',
  },
  extra: {
    userId: req.user.userId,
    fieldId: req.params.fieldId,
    queryParams: req.query,
  },
});
```

### 3. Group Similar Errors

Use `fingerprint` to group related errors:

```javascript
Sentry.captureException(error, {
  fingerprint: ['database-connection-error', 'postgresql'],
});
```

### 4. Monitor Performance

Track custom transactions:

```javascript
const transaction = Sentry.startTransaction({
  op: 'yield-prediction',
  name: 'Generate Yield Prediction',
});

try {
  // Your code
  const result = await yieldService.predictYield(userId, fieldId);
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('error');
  throw error;
} finally {
  transaction.finish();
}
```

---

## Environment Variables

### Required Variables

```bash
# Sentry Configuration
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890123
NODE_ENV=production  # or development, staging

# Optional: Release Tracking
SENTRY_RELEASE=skycrop-backend@1.0.0
SENTRY_ENVIRONMENT=production
```

### Railway Configuration

Add to Railway project settings:

```bash
railway variables:set SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890123
railway variables:set NODE_ENV=production
railway variables:set SENTRY_RELEASE=skycrop-backend@1.0.0
```

---

## Release Tracking

### 1. Create Releases in Sentry

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Configure auth token
export SENTRY_AUTH_TOKEN=your-auth-token
export SENTRY_ORG=your-org-slug
export SENTRY_PROJECT=skycrop-backend

# Create release
sentry-cli releases new "skycrop-backend@1.0.0"
sentry-cli releases set-commits "skycrop-backend@1.0.0" --auto
sentry-cli releases finalize "skycrop-backend@1.0.0"
```

### 2. Deploy Notifications

```bash
# Mark release as deployed
sentry-cli releases deploys "skycrop-backend@1.0.0" new -e production
```

---

## Troubleshooting

### Sentry Not Receiving Errors

**Check:**

1. ✅ `SENTRY_DSN` is set correctly
2. ✅ `NODE_ENV` is not `test`
3. ✅ Error is not filtered by `beforeSend`
4. ✅ Sentry is initialized before routes
5. ✅ Error handler is registered after routes

**Test:**

```bash
curl http://localhost:3000/debug/sentry
```

### Errors Not Appearing in Dashboard

**Possible Causes:**

- Sentry dashboard may take 1-2 minutes to update
- Error was filtered out (check `beforeSend` logic)
- DSN is incorrect
- Network firewall blocking Sentry

### Too Many Alerts

**Solution:**

1. Increase alert thresholds
2. Add more aggressive filtering
3. Use alert frequency limits (e.g., max once per 10 minutes)

---

## Cost Optimization

### Sampling Rates

For production, reduce sampling to save on Sentry quota:

```javascript
Sentry.init({
  // ... other config
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.1, // 10% of transactions profiled
});
```

### Error Filtering

Filter out common, non-critical errors:

```javascript
beforeSend(event, hint) {
  const error = hint.originalException;

  // Don't send client errors
  if (error.statusCode < 500) return null;

  // Don't send specific error codes
  if (error.code === 'VALIDATION_ERROR') return null;
  if (error.code === 'RATE_LIMIT_EXCEEDED') return null;

  return event;
}
```

---

## Production Checklist

Before deploying to production:

- [ ] Sentry DSN configured in Railway
- [ ] `NODE_ENV=production` set
- [ ] Sampling rates configured (0.1 for production)
- [ ] Alert rules created (critical errors, high error rate)
- [ ] Team members added to Sentry project
- [ ] Slack integration configured
- [ ] Email notifications enabled
- [ ] Debug routes disabled in production
- [ ] Error filtering tested
- [ ] Release tracking configured

---

## Summary

**Sentry Integration Status:** ✅ Complete

**What's Configured:**

- ✅ Error tracking for all APIs
- ✅ Performance monitoring
- ✅ Request/response context
- ✅ Debug endpoints for testing
- ✅ Error filtering (404s excluded)
- ✅ User context tracking
- ✅ Environment-specific sampling

**Next Steps:**

1. Set up Sentry account
2. Add DSN to environment variables
3. Test using debug endpoints
4. Configure alert rules
5. Add team members
6. Set up Slack/email notifications

**Sentry Dashboard:** https://sentry.io/organizations/[your-org]/projects/skycrop-backend/
