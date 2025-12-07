# SkyCrop Logging Architecture

## Overview
Comprehensive logging strategy for SkyCrop deployment with structured logging, centralized aggregation, and automated retention policies.

## 1. Logging Architecture

### Current Implementation
- **Framework**: Winston logger with structured JSON output
- **Transports**: Console (development), File (production)
- **Format**: JSON with timestamps, service metadata, and error stacks
- **Levels**: error, warn, info, debug (configurable via LOG_LEVEL)

### Enhanced Architecture
```
Application Logs → Winston Logger → Multiple Transports
                                      ├── Console (development)
                                      ├── File Rotation (local)
                                      └── Cloud Aggregation (production)
                                          ├── ELK Stack (Elasticsearch, Logstash, Kibana)
                                          └── CloudWatch Logs (AWS)
```

## 2. Log Categories and Levels

### Log Levels
- **ERROR**: System errors, exceptions, failed operations
- **WARN**: Warning conditions, deprecated features, potential issues
- **INFO**: General operational messages, API calls, user actions
- **DEBUG**: Detailed debugging information (development only)

### Log Categories
- **API**: HTTP requests, responses, authentication
- **Database**: Queries, connections, migrations
- **External**: Third-party API calls, ML service interactions
- **Business**: Field analysis, recommendations, notifications
- **Security**: Authentication, authorization, suspicious activities
- **Performance**: Response times, database query performance
- **System**: Health checks, deployments, system events

## 3. Structured Logging Format

### Standard Log Entry Structure
```json
{
  "timestamp": "2025-12-06T01:58:19.163Z",
  "level": "info",
  "service": "skycrop-backend",
  "component": "api",
  "requestId": "req-12345-abcde",
  "userId": "user-67890",
  "fieldId": "field-11111",
  "operation": "health_analysis",
  "duration": 245,
  "status": "success",
  "message": "Health analysis completed",
  "metadata": {
    "endpoint": "/api/v1/fields/{fieldId}/health/history",
    "method": "GET",
    "userAgent": "SkyCrop-Mobile/1.0",
    "ip": "192.168.1.100"
  },
  "error": null
}
```

### Error Log Structure
```json
{
  "timestamp": "2025-12-06T01:58:19.163Z",
  "level": "error",
  "service": "skycrop-backend",
  "component": "database",
  "requestId": "req-12345-abcde",
  "userId": "user-67890",
  "operation": "health_query",
  "duration": 1250,
  "status": "error",
  "message": "Database connection timeout",
  "metadata": {
    "query": "SELECT * FROM health_records WHERE field_id = ?",
    "connectionPool": "80%",
    "timeout": "30s"
  },
  "error": {
    "name": "SequelizeConnectionError",
    "message": "Connection timed out",
    "stack": "...",
    "code": "ETIMEDOUT"
  }
}
```

## 4. Log Aggregation and Storage

### Local File Storage
- **Error Logs**: `logs/error.log` (5MB max, 5 files rotation)
- **Combined Logs**: `logs/combined.log` (5MB max, 5 files rotation)
- **Access Logs**: `logs/access.log` (separate for HTTP requests)

### Cloud Aggregation Options

#### Option 1: ELK Stack (Recommended for Railway)
```
Winston → Logstash → Elasticsearch → Kibana
```
- **Logstash**: Parse and enrich logs
- **Elasticsearch**: Store and search logs
- **Kibana**: Visualize and analyze logs

#### Option 2: AWS CloudWatch
```
Winston → CloudWatch Agent → CloudWatch Logs → CloudWatch Insights
```
- **CloudWatch Logs**: Centralized log storage
- **CloudWatch Insights**: Query and analyze logs
- **CloudWatch Alarms**: Alert on log patterns

#### Option 3: Railway Native + External Service
```
Railway Logs → External Aggregator (Papertrail, LogDNA, etc.)
```

## 5. Log Retention Policies

### Retention Tiers
| Log Type | Hot Storage | Warm Storage | Cold Storage | Archive |
|----------|-------------|--------------|--------------|---------|
| Error Logs | 7 days | 30 days | 90 days | 1 year |
| Access Logs | 30 days | 90 days | 1 year | 3 years |
| Debug Logs | 1 day | 7 days | 30 days | 90 days |
| Audit Logs | 1 year | 3 years | 7 years | Permanent |

### Automated Retention Rules
- **Compression**: Gzip compression for logs older than 7 days
- **Archiving**: Move to cheaper storage after retention periods
- **Deletion**: Automatic deletion after maximum retention
- **Backup**: Critical logs backed up before deletion

## 6. Log Analysis and Monitoring

### Real-time Monitoring
- **Error Rate Tracking**: Monitor error log volume spikes
- **Performance Monitoring**: Track slow operations (>1s)
- **Security Monitoring**: Alert on suspicious patterns
- **Business Monitoring**: Track API usage and user behavior

### Log Queries and Dashboards
```sql
-- Common Kibana/Log Insights queries
-- Error rate by endpoint
error_level:ERROR AND component:api | stats count() by endpoint

-- Slow API responses
component:api AND duration > 1000 | sort duration desc

-- Failed authentication attempts
component:security AND operation:login AND status:failed | stats count() by ip
```

### Alert Rules Based on Logs
- Alert when error rate > 5% in 5-minute window
- Alert when API response time > 2000ms for 10 consecutive requests
- Alert when database connection errors > 10 in 1 hour
- Alert when suspicious login patterns detected

## 7. Security and Compliance Logging

### Security Event Logging
- **Authentication Events**: Login, logout, password changes
- **Authorization Events**: Permission checks, access denials
- **Data Access Events**: Field data access, export operations
- **Admin Actions**: User management, configuration changes

### Compliance Requirements
- **GDPR**: Data access logging, consent tracking
- **SOX**: Financial data access (if applicable)
- **Industry Standards**: ISO 27001 security logging

### Audit Trail
```json
{
  "timestamp": "2025-12-06T01:58:19.163Z",
  "level": "info",
  "service": "skycrop-backend",
  "component": "audit",
  "userId": "user-67890",
  "operation": "data_access",
  "resource": "field-11111",
  "action": "read",
  "ip": "192.168.1.100",
  "userAgent": "SkyCrop-Web/2.1",
  "metadata": {
    "consentGiven": true,
    "purpose": "field_monitoring",
    "dataElements": ["health_score", "ndvi_mean"]
  }
}
```

## 8. Implementation Plan

### Phase 1: Enhanced Local Logging (Week 1)
- [ ] Add request ID correlation across all logs
- [ ] Implement structured logging helpers
- [ ] Add access logging middleware
- [ ] Create log rotation and cleanup scripts

### Phase 2: Cloud Aggregation (Week 2-3)
- [ ] Set up ELK stack or CloudWatch integration
- [ ] Configure log shipping from Railway
- [ ] Create initial dashboards and alerts
- [ ] Test log aggregation pipeline

### Phase 3: Advanced Analytics (Week 4)
- [ ] Implement log-based alerting rules
- [ ] Create comprehensive dashboards
- [ ] Set up automated log analysis
- [ ] Implement audit logging

## 9. Performance Considerations

### Logging Performance
- **Async Logging**: Non-blocking log writes
- **Buffering**: Batch log writes to reduce I/O
- **Sampling**: Sample debug logs in production
- **Compression**: Compress logs before shipping

### Resource Usage
- **Disk Space**: Monitor log file sizes
- **Network**: Optimize log shipping bandwidth
- **CPU**: Minimize logging overhead (<1% CPU usage)

## 10. Cost Optimization

### Storage Costs
- **Local Storage**: Minimal (Railway included)
- **Cloud Storage**: $0.03/GB/month (CloudWatch)
- **ELK Stack**: $50-200/month depending on scale

### Optimization Strategies
- Use log sampling for high-volume debug logs
- Compress logs before storage
- Set appropriate retention periods
- Use cost allocation tags for cloud resources

## 11. Monitoring Logging Itself

### Log System Health
- Monitor log shipping success rate
- Alert on log aggregation failures
- Track log storage usage
- Monitor query performance

### Failure Scenarios
- **Log Shipping Failure**: Fallback to local storage
- **Storage Full**: Automatic cleanup and alerting
- **Query Timeouts**: Optimize queries and indexes

## 12. Development Guidelines

### Logging Best Practices
- Use appropriate log levels (avoid debug in production)
- Include correlation IDs for request tracing
- Log structured data, not formatted strings
- Include relevant context (userId, fieldId, etc.)
- Use consistent field names across services

### Code Examples
```javascript
// Good: Structured logging
logger.info('Health analysis completed', {
  requestId,
  userId,
  fieldId,
  operation: 'health_analysis',
  duration: Date.now() - startTime,
  status: 'success',
  metadata: { endpoint, method }
});

// Bad: String formatting
logger.info(`Health analysis for field ${fieldId} took ${duration}ms`);
```

## 13. Testing and Validation

### Log Testing
- Unit tests for logging helpers
- Integration tests for log aggregation
- Load testing with logging enabled
- Validate log formats and required fields

### Compliance Testing
- Audit log completeness
- Security event logging verification
- Data retention policy validation

## 14. Success Metrics

### Logging Effectiveness
- 100% critical error capture
- <5 minute mean time to detection
- >99.9% log delivery success rate
- <1% performance impact from logging

### Operational Impact
- Reduced incident resolution time through better observability
- Improved security through comprehensive audit trails
- Better compliance posture through proper retention
- Enhanced development velocity through log insights