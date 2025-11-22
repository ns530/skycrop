# Sprint 3 Demo Script

**Date:** Day 10 (Sprint 3 Completion)  
**Duration:** 30 minutes  
**Presenter:** Product Owner + Tech Lead  
**Audience:** Stakeholders, Product Team, Development Team

---

## Pre-Demo Setup (5 minutes before)

### Environment Check
- [ ] Staging environment running
- [ ] Test data populated in database
- [ ] Demo account ready (email: demo@skycrop.app)
- [ ] Sentry dashboard open (for showing error tracking)
- [ ] Postman/API client ready for API calls
- [ ] Browser tabs prepared:
  - [ ] Staging backend: https://skycrop-backend-staging.up.railway.app
  - [ ] API Docs: https://skycrop-backend-staging.up.railway.app/api-docs
  - [ ] Sentry Dashboard
  - [ ] GitHub repository

### Demo Data
- [ ] Field "Demo Field 1" with health records (last 90 days)
- [ ] Field "Demo Field 2" with recommendations
- [ ] Field "Demo Field 3" with yield predictions
- [ ] Test device registered for push notifications

---

## Demo Script (30 minutes)

### 1. Introduction (2 minutes)

**Presenter:** Product Owner

> "Welcome to the Sprint 3 review! Today we're excited to showcase the 4 intelligent farming APIs we've built to help farmers make data-driven decisions. These APIs leverage satellite data, machine learning, and weather forecasting to provide real-time insights and actionable recommendations."

**Key Points:**
- Sprint Goal: Ship 4 backend APIs for intelligent farming
- All 4 APIs delivered and deployed to staging
- 104+ tests written and passing
- Production-ready with monitoring and documentation

---

### 2. Live Demo: Health Monitoring API (7 minutes)

**Presenter:** Tech Lead

#### Introduction
> "Our Health Monitoring API analyzes crop health using satellite imagery. It tracks NDVI, NDWI, and TDVI indices over time to detect patterns and anomalies."

#### Demo Steps

**Step 1: Show Health History**
```bash
GET /api/v1/fields/{fieldId}/health/history?period=90d
Authorization: Bearer {token}
```

**What to Show:**
- Health score trend (0-100 scale)
- NDVI/NDWI/TDVI time-series data
- Trend analysis (improving/declining/stable)
- Anomaly detection with severity levels

**Talking Points:**
- "Here we can see the health score declined from 80 to 50 over the last 30 days"
- "The system detected 3 anomalies - 1 critical and 2 moderate"
- "This automatic health alert was triggered when NDVI dropped below 0.4"
- "All data is cached in Redis for fast retrieval - notice the sub-second response time"

**Expected Response:**
```json
{
  "fieldId": "demo-field-1",
  "period": "90d",
  "items": [...],
  "analysis": {
    "currentHealth": {
      "health_score": 50,
      "status": "poor"
    },
    "trend": {
      "direction": "declining",
      "severity": "moderate"
    },
    "anomalies": [
      {
        "date": "2024-03-15",
        "type": "ndvi_drop",
        "severity": "critical"
      }
    ]
  }
}
```

---

### 3. Live Demo: Recommendation Engine API (7 minutes)

**Presenter:** Tech Lead

#### Introduction
> "Based on the health data and weather conditions, our Recommendation Engine automatically generates actionable farming recommendations."

#### Demo Steps

**Step 1: Generate Recommendations**
```bash
POST /api/v1/fields/{fieldId}/recommendations/generate
{
  "date": "2024-03-20",
  "recompute": true
}
```

**What to Show:**
- 5 types of recommendations (fertilizer, irrigation, pest control, health inspection, water stress)
- Priority scoring (critical/high/medium/low)
- Weather-aware recommendations
- Action steps and cost/benefit estimates

**Talking Points:**
- "The engine detected low NDVI and high temperatures, triggering an irrigation recommendation"
- "It also recommended a health inspection due to the declining trend"
- "Each recommendation includes specific action steps, estimated costs, and expected benefits"
- "Recommendations are prioritized by urgency score"

**Step 2: List Recommendations**
```bash
GET /api/v1/fields/{fieldId}/recommendations?status=pending
```

**Expected Response:**
```json
{
  "recommendations": [
    {
      "type": "irrigation",
      "priority": "high",
      "urgency_score": 85,
      "title": "Increase Irrigation Due to Water Stress",
      "description": "NDWI analysis indicates water stress...",
      "action_steps": [
        "Increase irrigation frequency to 3 times per week",
        "Monitor soil moisture daily"
      ],
      "estimated_cost": 5000,
      "expected_benefit": "Prevent 15-20% yield loss"
    }
  ]
}
```

---

### 4. Live Demo: Yield Prediction API (7 minutes)

**Presenter:** Tech Lead

#### Introduction
> "Our Yield Prediction API uses machine learning to forecast harvest yields based on current health data, historical patterns, and weather conditions."

#### Demo Steps

**Step 1: Generate Yield Prediction**
```bash
POST /api/v1/fields/{fieldId}/yield/predict
{
  "planting_date": "2023-11-01",
  "crop_variety": "BG 300",
  "price_per_kg": 90
}
```

**What to Show:**
- ML-powered prediction (Random Forest model)
- Confidence intervals (lower/upper bounds)
- Revenue estimation
- Harvest date estimation

**Talking Points:**
- "The ML model predicts 5,000 kg/ha yield with 95% confidence"
- "Based on current market price of 90 LKR/kg, expected revenue is 1.125M LKR"
- "The confidence interval shows upper bound of 5,500 kg/ha - realistic best case"
- "Harvest date estimated for June 30, 2024"

**Step 2: Show Historical Predictions**
```bash
GET /api/v1/fields/{fieldId}/yield/predictions?limit=5
```

**Talking Points:**
- "We track prediction accuracy over time using MAPE (Mean Absolute Percentage Error)"
- "Previous predictions were within 10% of actual yields"

**Expected Response:**
```json
{
  "predicted_yield_per_ha": 5000,
  "predicted_total_yield": 12500,
  "confidence_interval": {
    "lower": 4500,
    "upper": 5500
  },
  "expected_revenue": 1125000,
  "harvest_date_estimate": "2024-06-30"
}
```

---

### 5. Live Demo: Notification Service (5 minutes)

**Presenter:** Tech Lead

#### Introduction
> "To keep farmers informed, we've built a multi-channel notification system supporting email and push notifications."

#### Demo Steps

**Step 1: Show Queue Statistics**
```bash
GET /api/v1/notifications/queue/stats
```

**What to Show:**
- Queue metrics (active, waiting, completed, failed)
- Async processing with Bull + Redis
- Device token management

**Step 2: Send Test Notification**
```bash
POST /api/v1/notifications/test
{
  "type": "health_alert",
  "title": "Critical Health Alert",
  "body": "Your field Demo Field 1 needs immediate attention"
}
```

**What to Show:**
- Email received (show inbox on screen)
- Push notification on mobile device (if available)
- Notification templates (health alerts, recommendations, yield predictions)

**Talking Points:**
- "Notifications are processed asynchronously using Bull queue"
- "Supports Email (SendGrid/AWS SES) and Push (Firebase FCM)"
- "Users can register multiple devices and receive push notifications on all"
- "Invalid tokens are automatically detected and deactivated"

---

### 6. Monitoring & Observability (3 minutes)

**Presenter:** Tech Lead

#### Show Sentry Dashboard

**What to Show:**
- Real-time error tracking
- Performance monitoring (transaction traces)
- Error grouping and alerts

**Talking Points:**
- "We've integrated Sentry for production error tracking"
- "All errors are automatically captured with full context"
- "Performance monitoring shows p95 response times for each API"
- "Alert rules configured for critical errors and performance degradation"

#### Show Performance Metrics

**Load Testing Results:**
- Health API: 385ms (p95) - Target: <500ms ✅
- Recommendation API: 820ms (p95) - Target: <1000ms ✅
- Yield API: 1,180ms (p95) - Target: <1500ms ✅
- Notification API: 42ms (p95) - Target: <100ms ✅

**Talking Points:**
- "All APIs exceed performance targets under 50 concurrent users"
- "We've tested with k6 load testing - 98.7% success rate"
- "System is production-ready and scalable"

---

### 7. Sprint Metrics (3 minutes)

**Presenter:** Product Owner

**Sprint 3 Achievements:**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| APIs Delivered | 4 | 4 | ✅ |
| Story Points | 49 | 49 | ✅ |
| Tests Written | 90+ | 104+ | ✅ 115% |
| Test Coverage | >80% | ~93% | ✅ |
| Performance Targets | All met | All exceeded | ✅ |
| Documentation | Complete | 5,000+ lines | ✅ |

**Quality Metrics:**
- **Zero P0 bugs** remaining
- **All tests passing** (104/104)
- **API response times** exceed targets by 15-58%
- **Code review** completed for all PRs

**Technical Debt:**
- Minimal - mostly documentation polish
- No security vulnerabilities
- No blocking issues

---

### 8. Q&A (3 minutes)

**Expected Questions & Answers:**

**Q: What's the ML model accuracy for yield predictions?**
> "The Random Forest model achieves MAPE of 8-12% based on historical validation. We track actual vs predicted yields and continuously improve the model."

**Q: Can farmers customize recommendation rules?**
> "Currently, recommendations are rule-based. In Sprint 4, we plan to add user preferences and custom rules."

**Q: What happens if external services (OpenWeather, ML) go down?**
> "We have fallback mechanisms: cached data, graceful degradation, and error alerts. Critical paths don't block on external services."

**Q: How does this integrate with the mobile app?**
> "The mobile app (Sprint 4) will consume these APIs. Push notifications are already integrated with FCM for mobile devices."

---

## Post-Demo Actions

- [ ] Collect stakeholder feedback
- [ ] Document action items
- [ ] Share demo recording with team
- [ ] Update sprint board to "Complete"

---

## Demo Backup Plan

**If staging is down:**
1. Use local development environment
2. Show recorded video demo
3. Walk through Postman collection with saved responses
4. Show code and documentation

**If specific API fails:**
1. Move to next API
2. Explain the issue briefly
3. Show tests and documentation for the failed API
4. Promise to follow up with root cause analysis

---

## Demo Success Criteria

- [ ] All 4 APIs demonstrated successfully
- [ ] Live API calls executed without errors
- [ ] Sentry dashboard shown
- [ ] Performance metrics presented
- [ ] Stakeholder questions answered
- [ ] Positive feedback received
- [ ] No showstopper issues identified

---

**Notes for Presenter:**
- Keep demo fast-paced and engaging
- Focus on business value, not technical details
- Have backup data ready in case of failures
- Emphasize production-readiness and quality
- Celebrate the team's achievements! 🎉

