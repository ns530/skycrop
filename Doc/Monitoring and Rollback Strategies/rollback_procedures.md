# SkyCrop Rollback Procedures

## Overview
Comprehensive rollback procedures for SkyCrop deployment covering different failure scenarios with automated and manual rollback options.

## 1. Rollback Strategy Overview

### Deployment Types
- **Railway Deployments**: Primary production environment
- **Blue-Green Deployments**: Zero-downtime deployments with instant rollback
- **Canary Deployments**: Gradual rollout with automated rollback on failures
- **Database Migrations**: Schema changes with safe rollback mechanisms

### Rollback Types
- **Automated Rollback**: Triggered by monitoring alerts or deployment failures
- **Manual Rollback**: Initiated by engineers for planned rollbacks
- **Emergency Rollback**: Immediate rollback for critical system failures
- **Partial Rollback**: Rollback specific components or features

## 2. Failure Scenarios and Rollback Procedures

### Scenario 1: Application Deployment Failure

#### Detection
- Health check failures (>95% failure rate)
- Error rate spikes (>10% in 5 minutes)
- P95 response time >2000ms sustained

#### Automated Rollback Procedure
```bash
# Triggered automatically by monitoring system
./backend/scripts/rollback.sh production deployment_failure
```

#### Manual Rollback Procedure
1. **Assess Impact**: Check error logs and user reports
2. **Confirm Rollback**: Verify previous deployment is stable
3. **Execute Rollback**:
   ```bash
   cd backend
   ./scripts/rollback.sh production manual_rollback
   ```
4. **Verify Rollback**: Run smoke tests and monitor metrics
5. **Communicate**: Notify stakeholders of rollback

#### Timeline
- Detection: <2 minutes (monitoring alerts)
- Decision: <5 minutes (engineer assessment)
- Execution: <10 minutes (Railway rollback)
- Verification: <15 minutes (smoke tests)

### Scenario 2: Database Migration Failure

#### Detection
- Migration script errors in logs
- Database connection failures
- Data inconsistency alerts

#### Rollback Procedure
1. **Stop Application**: Prevent new requests during rollback
   ```bash
   railway scale 0  # Scale to zero instances
   ```

2. **Database Rollback**:
   ```bash
   # Connect to database
   railway run psql $DATABASE_URL

   # Run down migration (if available)
   \i backend/database/migrations/down_migration.sql

   # Or restore from backup
   railway backup restore <backup-id>
   ```

3. **Restart Application**:
   ```bash
   railway scale 1  # Scale back to 1 instance
   ```

4. **Verify Data Integrity**:
   ```bash
   # Run data validation scripts
   npm run db:validate
   ```

#### Prevention Measures
- Always create down migrations
- Test migrations on staging first
- Create database backups before migrations
- Use transaction-wrapped migrations

### Scenario 3: External Service Failure

#### Detection
- OpenWeather API timeouts/failures
- ML service unavailability
- Firebase FCM delivery failures
- SendGrid email failures

#### Rollback Procedure
1. **Assess Service Impact**:
   - Check service status pages
   - Monitor error patterns
   - Evaluate business impact

2. **Implement Circuit Breaker**:
   ```javascript
   // Graceful degradation in code
   if (externalServiceUnavailable) {
     return cachedResponse || defaultResponse;
   }
   ```

3. **Rollback to Previous Version** (if needed):
   ```bash
   ./scripts/rollback.sh production external_service_failure
   ```

4. **Monitor Recovery**:
   - Watch service restoration
   - Gradually restore full functionality
   - Monitor error rates during recovery

### Scenario 4: Performance Degradation

#### Detection
- P95 latency >1000ms sustained
- Error rate >5% sustained
- Database connection pool >95% utilization
- Memory/CPU usage >90%

#### Rollback Procedure
1. **Scale Resources First**:
   ```bash
   railway scale 3  # Increase instances
   ```

2. **If Scaling Insufficient, Rollback**:
   ```bash
   ./scripts/rollback.sh production performance_degradation
   ```

3. **Root Cause Analysis**:
   - Review performance logs
   - Check database query performance
   - Analyze resource usage patterns

### Scenario 5: Security Incident

#### Detection
- Unusual authentication patterns
- Data access anomalies
- Suspicious API usage
- Security monitoring alerts

#### Rollback Procedure
1. **Immediate Actions**:
   - Block suspicious IPs
   - Disable compromised accounts
   - Alert security team

2. **Code Rollback** (if vulnerability exploited):
   ```bash
   ./scripts/rollback.sh production security_incident
   ```

3. **Database Actions**:
   - Audit data access logs
   - Restore from clean backup if needed
   - Update security configurations

4. **Post-Incident Review**:
   - Forensics analysis
   - Security patch deployment
   - Update incident response procedures

### Scenario 6: Data Corruption

#### Detection
- Data validation failures
- Inconsistent field health data
- ML prediction anomalies
- User-reported data issues

#### Rollback Procedure
1. **Isolate Affected Data**:
   ```sql
   -- Create backup of affected data
   CREATE TABLE corrupted_fields_backup AS
   SELECT * FROM fields WHERE last_modified > 'incident_timestamp';
   ```

2. **Database Rollback**:
   ```bash
   # Restore from backup
   railway backup restore <pre-incident-backup>
   ```

3. **Data Validation**:
   ```bash
   # Run data integrity checks
   npm run data:validate
   ```

4. **Gradual Service Restoration**:
   - Start with read-only mode
   - Enable write operations gradually
   - Monitor data consistency

## 3. Rollback Automation Scripts

### Enhanced Rollback Script Features

#### rollback.sh Enhancements
```bash
#!/bin/bash

# Usage: ./rollback.sh <environment> <reason> [options]

ENVIRONMENT=$1
REASON=$2
OPTIONS=$3

case $REASON in
  "deployment_failure")
    # Automated rollback with minimal checks
    rollback_automated
    ;;
  "manual_rollback")
    # Interactive rollback with confirmation
    rollback_manual
    ;;
  "emergency")
    # Immediate rollback without confirmation
    rollback_emergency
    ;;
  "performance")
    # Rollback with performance monitoring
    rollback_performance
    ;;
  *)
    echo "Unknown rollback reason"
    exit 1
    ;;
esac
```

#### Rollback Verification Script
```bash
#!/bin/bash
# verify_rollback.sh

# Health checks after rollback
check_health_endpoints
check_database_connectivity
check_external_services
run_smoke_tests

# Performance validation
check_response_times
check_error_rates
check_resource_usage

# Data integrity
validate_data_consistency
check_migration_status
```

## 4. Blue-Green Deployment Rollback

### Architecture
```
Production Traffic → Load Balancer → Blue Environment (Active)
                                      ↓
                           Green Environment (Standby)
```

### Rollback Procedure
1. **Switch Traffic**:
   ```bash
   # Switch load balancer to green environment
   ./scripts/blue-green-switch.sh green
   ```

2. **Verify Green Environment**:
   ```bash
   ./scripts/verify-deployment.sh green
   ```

3. **Update Blue Environment** (async):
   ```bash
   # Deploy fix to blue environment
   ./scripts/deploy-blue.sh
   ```

4. **Switch Back When Ready**:
   ```bash
   ./scripts/blue-green-switch.sh blue
   ```

### Benefits
- Zero-downtime rollbacks
- Instant traffic switching
- Parallel testing of fixes
- Reduced risk during rollbacks

## 5. Canary Deployment Rollback

### Architecture
```
Traffic: 95% → Stable Version
          5% → New Version
```

### Rollback Procedure
1. **Monitor Canary Metrics**:
   - Error rates in canary group
   - Performance comparison
   - User feedback

2. **Gradual Rollback**:
   ```bash
   # Reduce canary traffic
   ./scripts/canary-traffic.sh 2%  # Reduce to 2%
   ./scripts/canary-traffic.sh 0%  # Complete rollback
   ```

3. **Full Rollback if Needed**:
   ```bash
   ./scripts/canary-rollback.sh
   ```

### Automated Canary Rollback
```javascript
// Monitoring thresholds for automatic rollback
const thresholds = {
  errorRate: 0.10,    // 10% error rate
  latencyP95: 2000,   // 2s p95 latency
  duration: 300000,   // 5 minutes monitoring
};

if (canaryMetrics.exceedsThresholds(thresholds)) {
  triggerCanaryRollback();
}
```

## 6. Database Rollback Strategies

### Migration-Based Rollback
```sql
-- Up migration
ALTER TABLE fields ADD COLUMN new_feature VARCHAR(255);

-- Down migration
ALTER TABLE fields DROP COLUMN new_feature;
```

### Backup-Based Rollback
```bash
# Automated daily backups
railway backup create --schedule "0 2 * * *"

# Point-in-time recovery
railway backup restore --point-in-time "2025-12-06 01:00:00"
```

### Data Export/Import Rollback
```bash
# Export clean data
railway run pg_dump -t fields -t health_records > clean_data.sql

# Import after rollback
railway run psql < clean_data.sql
```

## 7. Rollback Testing and Validation

### Pre-Deployment Testing
- [ ] Test rollback scripts in staging
- [ ] Verify backup restoration
- [ ] Test data integrity after rollback
- [ ] Validate application functionality post-rollback

### Post-Rollback Validation
- [ ] Health check verification
- [ ] Smoke test execution
- [ ] Data consistency checks
- [ ] Performance monitoring
- [ ] User acceptance testing

### Rollback Drills
- **Monthly**: Full rollback simulation
- **Quarterly**: Disaster recovery testing
- **Annually**: Complete environment restoration

## 8. Communication and Documentation

### Rollback Notification Template
```
Subject: [ROLLBACK] SkyCrop {Environment} - {Reason}

Impact: {Brief description of impact}
Timeline: Rollback initiated at {timestamp}
Expected Resolution: {ETA for full recovery}
Status: {Current status - In Progress/Completed/Failed}

Next Steps:
- Monitoring system health
- Running validation tests
- Communicating with stakeholders

Contact: {On-call engineer} | {Emergency contact}
```

### Rollback Log Template
```json
{
  "rollbackId": "rb-20251206-001",
  "environment": "production",
  "reason": "deployment_failure",
  "initiatedBy": "monitoring_system",
  "startTime": "2025-12-06T01:58:19.163Z",
  "endTime": "2025-12-06T02:08:19.163Z",
  "previousDeployment": "deploy-abc123",
  "targetDeployment": "deploy-def456",
  "status": "completed",
  "validationResults": {
    "healthChecks": "passed",
    "smokeTests": "passed",
    "performance": "within_thresholds"
  },
  "impact": {
    "downtime": "8_minutes",
    "affectedUsers": "15%",
    "dataLoss": "none"
  }
}
```

## 9. Risk Mitigation

### Rollback Risks
- **Data Loss**: Always backup before rollback
- **Extended Downtime**: Test rollback procedures
- **Incomplete Rollback**: Verify all components rolled back
- **User Confusion**: Clear communication during rollback

### Mitigation Strategies
- **Automated Testing**: Comprehensive rollback testing
- **Gradual Rollbacks**: Canary-style rollbacks for safety
- **Backup Verification**: Test backup restoration regularly
- **Monitoring Continuity**: Monitor during and after rollback

## 10. Success Metrics

### Rollback Effectiveness
- **Mean Time to Rollback**: <15 minutes for automated rollbacks
- **Rollback Success Rate**: >95% successful rollbacks
- **Data Integrity**: 100% data consistency post-rollback
- **User Impact**: <30 minutes total downtime per incident

### Process Improvements
- **False Positive Rate**: <5% for automated rollbacks
- **Manual Intervention Rate**: <20% of rollbacks require manual steps
- **Recovery Time**: <1 hour from incident detection to full recovery
- **Stakeholder Satisfaction**: >4.5/5 rating for rollback communications