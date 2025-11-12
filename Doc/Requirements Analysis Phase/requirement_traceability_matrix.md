# REQUIREMENT TRACEABILITY MATRIX (RTM)

## SkyCrop: Satellite-Based Paddy Field Management & Monitoring System

---

## DOCUMENT CONTROL

| **Item** | **Details** |
|----------|-------------|
| **Document Title** | Requirement Traceability Matrix (RTM) |
| **Project Name** | SkyCrop - Intelligent Paddy Field Monitoring System |
| **Document Code** | SKYCROP-RTM-2025-001 |
| **Version** | 1.0 |
| **Date** | October 28, 2025 |
| **Prepared By** | Business Analyst, QA Lead |
| **Reviewed By** | Product Manager, Technical Lead |
| **Approved By** | Project Sponsor |
| **Status** | Approved |
| **Confidentiality** | Internal - For Development & QA Team |

---

## 1. INTRODUCTION

### 1.1 Purpose

The Requirement Traceability Matrix (RTM) is a document that maps and traces user requirements from their origin through design, development, testing, and deployment. It ensures that:

- All requirements are addressed in the design
- All requirements are implemented in code
- All requirements are tested
- No requirements are missed or forgotten
- Changes to requirements are tracked

### 1.2 Scope

This RTM covers all requirements for the SkyCrop system:
- **Business Requirements** (from Business Case)
- **Product Requirements** (from PRD)
- **Functional Requirements** (from SRS)
- **Non-Functional Requirements** (from SRS)
- **User Stories** (from Use Cases document)

### 1.3 Traceability Links

**Forward Traceability:** Business Need → Requirement → Design → Code → Test  
**Backward Traceability:** Test → Code → Design → Requirement → Business Need

### 1.4 Document Structure

- **Section 2:** Traceability Matrix (main table)
- **Section 3:** Requirements Coverage Analysis
- **Section 4:** Test Coverage Analysis
- **Section 5:** Change Impact Analysis
- **Section 6:** Appendices

---

## 2. REQUIREMENT TRACEABILITY MATRIX

### 2.1 User Authentication & Management

| **Req ID** | **Requirement** | **Source** | **Priority** | **User Story** | **Design Ref** | **Code Module** | **Test Case** | **Status** | **Owner** |
|------------|-----------------|------------|--------------|----------------|----------------|-----------------|---------------|------------|-----------|
| **FR-001.1** | User registration with Google OAuth | SRS 5.1, PRD F-001 | P0 | US-001 | AUTH-001 | `auth/oauth.js` | TC-001, TC-002 | Approved | Backend Dev |
| **FR-001.2** | User registration with email/password | SRS 5.1, PRD F-001 | P0 | US-002 | AUTH-002 | `auth/register.js` | TC-003, TC-004 | Approved | Backend Dev |
| **FR-001.3** | Email verification | SRS 5.1 | P0 | US-002 | AUTH-003 | `auth/verify.js` | TC-005 | Approved | Backend Dev |
| **FR-001.4** | User login | SRS 5.1, PRD F-001 | P0 | UC-002 | AUTH-004 | `auth/login.js` | TC-006, TC-007 | Approved | Backend Dev |
| **FR-001.5** | Password reset | SRS 5.1, PRD F-001 | P0 | US-003, UC-003 | AUTH-005 | `auth/reset.js` | TC-008, TC-009 | Approved | Backend Dev |
| **FR-001.6** | Session management | SRS 5.1 | P0 | - | AUTH-006 | `auth/session.js` | TC-010 | Approved | Backend Dev |
| **FR-001.7** | User logout | SRS 5.1 | P0 | - | AUTH-007 | `auth/logout.js` | TC-011 | Approved | Backend Dev |
| **FR-001.8** | Profile management | SRS 5.1, PRD F-001 | P0 | - | AUTH-008 | `user/profile.js` | TC-012 | Approved | Backend Dev |
| **FR-001.9** | Account deletion (GDPR) | SRS 5.1, PRD NFR-015 | P0 | - | AUTH-009 | `user/delete.js` | TC-013 | Approved | Backend Dev |
| **NFR-001.1** | Login response time <2s | SRS 6.1, PRD NFR-001 | P0 | - | PERF-001 | - | TC-101 | Approved | Backend Dev |
| **NFR-001.2** | Password hashing (bcrypt 10 rounds) | SRS 6.4, PRD NFR-014 | P0 | - | SEC-001 | `auth/hash.js` | TC-102 | Approved | Backend Dev |
| **NFR-001.3** | JWT token security (HS256) | SRS 6.4, PRD NFR-013 | P0 | - | SEC-002 | `auth/jwt.js` | TC-103 | Approved | Backend Dev |
| **NFR-001.4** | Account lock after 5 failed attempts | SRS 6.4, PRD NFR-013 | P0 | - | SEC-003 | `auth/lock.js` | TC-104 | Approved | Backend Dev |

---

### 2.2 Field Mapping & Boundary Detection

| **Req ID** | **Requirement** | **Source** | **Priority** | **User Story** | **Design Ref** | **Code Module** | **Test Case** | **Status** | **Owner** |
|------------|-----------------|------------|--------------|----------------|----------------|-----------------|---------------|------------|-----------|
| **FR-002.1** | Interactive map display | SRS 5.2, PRD F-002 | P0 | US-003 | MAP-001 | `map/display.js` | TC-014, TC-015 | Approved | Frontend Dev |
| **FR-002.2** | Field location selection | SRS 5.2, PRD F-002 | P0 | US-003 | MAP-002 | `map/select.js` | TC-016 | Approved | Frontend Dev |
| **FR-002.3** | AI boundary detection | SRS 5.2, PRD F-003 | P0 | US-004, UC-006 | AI-001 | `ai/boundary.py` | TC-017, TC-018 | Approved | ML Engineer |
| **FR-002.4** | Boundary visualization | SRS 5.2, PRD F-003 | P0 | US-004 | MAP-003 | `map/boundary.js` | TC-019 | Approved | Frontend Dev |
| **FR-002.5** | Manual boundary adjustment | SRS 5.2, PRD F-017 | P1 | - | MAP-004 | `map/adjust.js` | TC-020 | Approved | Frontend Dev |
| **FR-002.6** | Add/delete vertices | SRS 5.2, PRD F-017 | P1 | - | MAP-005 | `map/vertices.js` | TC-021 | Approved | Frontend Dev |
| **FR-002.7** | Field area calculation | SRS 5.2, PRD F-004 | P0 | - | GIS-001 | `gis/area.js` | TC-022, TC-023 | Approved | Backend Dev |
| **FR-002.8** | Field confirmation & saving | SRS 5.2, PRD F-003 | P0 | US-004 | FIELD-001 | `field/save.js` | TC-024 | Approved | Backend Dev |
| **FR-002.9** | Multi-field support | SRS 5.2, PRD F-018 | P1 | - | FIELD-002 | `field/multi.js` | TC-025 | Approved | Backend Dev |
| **NFR-002.1** | Map load time <5s on 3G | SRS 6.1, PRD NFR-001 | P0 | - | PERF-002 | - | TC-105 | Approved | Frontend Dev |
| **NFR-002.2** | Boundary detection <60s | SRS 6.1, PRD NFR-002 | P0 | - | PERF-003 | - | TC-106 | Approved | ML Engineer |
| **NFR-002.3** | Boundary accuracy ≥85% IoU | SRS 6.1, PRD KPI-016 | P0 | - | AI-002 | - | TC-107 | Approved | ML Engineer |
| **NFR-002.4** | Area accuracy ±5% | SRS 6.1, PRD F-004 | P0 | - | GIS-002 | - | TC-108 | Approved | Backend Dev |

---

### 2.3 Crop Health Monitoring

| **Req ID** | **Requirement** | **Source** | **Priority** | **User Story** | **Design Ref** | **Code Module** | **Test Case** | **Status** | **Owner** |
|------------|-----------------|------------|--------------|----------------|----------------|-----------------|---------------|------------|-----------|
| **FR-003.1** | Satellite image retrieval | SRS 5.3, PRD F-005 | P0 | - | SAT-001 | `satellite/retrieve.js` | TC-026, TC-027 | Approved | Backend Dev |
| **FR-003.2** | NDVI calculation | SRS 5.3, PRD F-005 | P0 | US-005 | PROC-001 | `processing/ndvi.py` | TC-028, TC-029 | Approved | ML Engineer |
| **FR-003.3** | NDWI calculation | SRS 5.3, PRD F-005 | P0 | US-006 | PROC-002 | `processing/ndwi.py` | TC-030 | Approved | ML Engineer |
| **FR-003.4** | TDVI calculation | SRS 5.3, PRD F-005 | P0 | - | PROC-003 | `processing/tdvi.py` | TC-031 | Approved | ML Engineer |
| **FR-003.5** | Health status classification | SRS 5.3, PRD F-006 | P0 | US-005 | PROC-004 | `processing/health.py` | TC-032 | Approved | ML Engineer |
| **FR-003.6** | Color-coded field visualization | SRS 5.3, PRD F-006 | P0 | US-005 | MAP-006 | `map/health.js` | TC-033 | Approved | Frontend Dev |
| **FR-003.7** | Health data storage | SRS 5.3 | P0 | - | DB-001 | `models/health.js` | TC-034 | Approved | Backend Dev |
| **FR-003.8** | Health update frequency | SRS 5.3 | P0 | - | CRON-001 | `jobs/health-update.js` | TC-035 | Approved | Backend Dev |
| **NFR-003.1** | Image retrieval <10s | SRS 6.1, PRD NFR-001 | P0 | - | PERF-004 | - | TC-109 | Approved | Backend Dev |
| **NFR-003.2** | NDVI calculation <5s | SRS 6.1, PRD NFR-002 | P0 | - | PERF-005 | - | TC-110 | Approved | ML Engineer |
| **NFR-003.3** | Health map render <3s | SRS 6.1, PRD NFR-001 | P0 | - | PERF-006 | - | TC-111 | Approved | Frontend Dev |
| **NFR-003.4** | NDVI correlation ≥0.90 | SRS 6.1, PRD KPI-016 | P0 | - | VAL-001 | - | TC-112 | Approved | ML Engineer |

---

### 2.4 Precision Agriculture Recommendations

| **Req ID** | **Requirement** | **Source** | **Priority** | **User Story** | **Design Ref** | **Code Module** | **Test Case** | **Status** | **Owner** |
|------------|-----------------|------------|--------------|----------------|----------------|-----------------|---------------|------------|-----------|
| **FR-004.1** | Water recommendation engine | SRS 5.5, PRD F-007 | P0 | US-006, UC-014 | REC-001 | `recommendations/water.js` | TC-036, TC-037 | Approved | Backend Dev |
| **FR-004.2** | Fertilizer recommendation engine | SRS 5.5, PRD F-008 | P0 | US-007 | REC-002 | `recommendations/fertilizer.js` | TC-038, TC-039 | Approved | Backend Dev |
| **FR-004.3** | Alert generation | SRS 5.5, PRD F-017 | P0 | US-008, UC-013 | REC-003 | `recommendations/alerts.js` | TC-040, TC-041 | Approved | Backend Dev |
| **FR-004.4** | Recommendation history | SRS 5.5 | P1 | - | REC-004 | `recommendations/history.js` | TC-042 | Approved | Backend Dev |
| **NFR-004.1** | Recommendations generated <5s | SRS 6.1, PRD NFR-001 | P0 | - | PERF-007 | - | TC-113 | Approved | Backend Dev |
| **NFR-004.2** | Recommendations update every 5-7 days | SRS 6.1 | P0 | - | CRON-002 | - | TC-114 | Approved | Backend Dev |
| **NFR-004.3** | Water savings 20-30% | SRS 6.1, PRD KPI-010 | P0 | - | VAL-002 | - | TC-115 | Approved | QA Lead |
| **NFR-004.4** | Fertilizer savings 15-20% | SRS 6.1, PRD KPI-011 | P0 | - | VAL-003 | - | TC-116 | Approved | QA Lead |
| **NFR-004.5** | Alerts delivered <5 min | SRS 6.1, PRD NFR-001 | P0 | - | PERF-008 | - | TC-117 | Approved | Backend Dev |

---

### 2.5 Yield Prediction

| **Req ID** | **Requirement** | **Source** | **Priority** | **User Story** | **Design Ref** | **Code Module** | **Test Case** | **Status** | **Owner** |
|------------|-----------------|------------|--------------|----------------|----------------|-----------------|---------------|------------|-----------|
| **FR-005.1** | Yield prediction model | SRS 5.5, PRD F-009 | P0 | US-009, UC-017 | ML-001 | `ml/yield-prediction.py` | TC-043, TC-044 | Approved | ML Engineer |
| **FR-005.2** | Yield prediction display | SRS 5.5, PRD F-009 | P0 | US-009 | UI-001 | `components/YieldForecast.jsx` | TC-045 | Approved | Frontend Dev |
| **FR-005.3** | Yield prediction updates | SRS 5.5, PRD F-009 | P0 | - | CRON-003 | `jobs/yield-update.js` | TC-046 | Approved | Backend Dev |
| **FR-005.4** | Actual yield tracking | SRS 5.5, PRD F-009 | P1 | US-010 | ML-002 | `ml/yield-tracking.js` | TC-047 | Approved | Backend Dev |
| **NFR-005.1** | Prediction <10s | SRS 6.1, PRD NFR-001 | P0 | - | PERF-009 | - | TC-118 | Approved | ML Engineer |
| **NFR-005.2** | Prediction accuracy ≥85% (MAPE <15%) | SRS 6.1, PRD KPI-016 | P0 | - | ML-003 | - | TC-119 | Approved | ML Engineer |
| **NFR-005.3** | Prediction updates every 10 days | SRS 6.1 | P0 | - | CRON-004 | - | TC-120 | Approved | Backend Dev |

---

### 2.6 Weather Forecasting

| **Req ID** | **Requirement** | **Source** | **Priority** | **User Story** | **Design Ref** | **Code Module** | **Test Case** | **Status** | **Owner** |
|------------|-----------------|------------|--------------|----------------|----------------|-----------------|---------------|------------|-----------|
| **FR-006.1** | Weather data retrieval | SRS 5.6, PRD F-010 | P0 | US-011, UC-019 | WEATHER-001 | `weather/retrieve.js` | TC-048, TC-049 | Approved | Backend Dev |
| **FR-006.2** | Weather forecast display | SRS 5.6, PRD F-010 | P0 | US-011 | UI-002 | `components/Weather.jsx` | TC-050 | Approved | Frontend Dev |
| **FR-006.3** | Weather alerts | SRS 5.6, PRD F-010 | P0 | US-012 | WEATHER-002 | `weather/alerts.js` | TC-051, TC-052 | Approved | Backend Dev |
| **FR-006.4** | Weather-integrated recommendations | SRS 5.6, PRD F-007, F-008 | P0 | - | REC-005 | `recommendations/weather-integration.js` | TC-053 | Approved | Backend Dev |
| **NFR-006.1** | Forecast updates every 6 hours | SRS 6.1 | P0 | - | CRON-005 | - | TC-121 | Approved | Backend Dev |
| **NFR-006.2** | Forecast accuracy ≥80% | SRS 6.1 | P0 | - | VAL-004 | - | TC-122 | Approved | QA Lead |
| **NFR-006.3** | Weather alerts <5 min | SRS 6.1, PRD NFR-001 | P0 | - | PERF-010 | - | TC-123 | Approved | Backend Dev |

---

### 2.7 Disaster Assessment

| **Req ID** | **Requirement** | **Source** | **Priority** | **User Story** | **Design Ref** | **Code Module** | **Test Case** | **Status** | **Owner** |
|------------|-----------------|------------|--------------|----------------|----------------|-----------------|---------------|------------|-----------|
| **FR-007.1** | Disaster event selection | SRS 5.7, PRD F-013 | P1 | US-013, UC-021 | DISASTER-001 | `disaster/select.js` | TC-054 | Approved | Backend Dev |
| **FR-007.2** | Damage analysis | SRS 5.7, PRD F-013 | P1 | US-013, UC-021 | DISASTER-002 | `disaster/analyze.py` | TC-055, TC-056 | Approved | ML Engineer |
| **FR-007.3** | Financial loss estimation | SRS 5.7, PRD F-013 | P1 | US-013 | DISASTER-003 | `disaster/loss.js` | TC-057 | Approved | Backend Dev |
| **FR-007.4** | Insurance report generation | SRS 5.7, PRD F-013 | P1 | US-014, UC-022 | DISASTER-004 | `disaster/report.js` | TC-058, TC-059 | Approved | Backend Dev |
| **NFR-007.1** | Damage analysis <90s | SRS 6.1 | P1 | - | PERF-011 | - | TC-124 | Approved | ML Engineer |
| **NFR-007.2** | Damage accuracy ≥80% | SRS 6.1 | P1 | - | VAL-005 | - | TC-125 | Approved | ML Engineer |
| **NFR-007.3** | PDF generation <10s | SRS 6.1 | P1 | - | PERF-012 | - | TC-126 | Approved | Backend Dev |
| **NFR-007.4** | Report size <5 MB | SRS 6.1 | P1 | - | PERF-013 | - | TC-127 | Approved | Backend Dev |

---

### 2.8 Mobile Application

| **Req ID** | **Requirement** | **Source** | **Priority** | **User Story** | **Design Ref** | **Code Module** | **Test Case** | **Status** | **Owner** |
|------------|-----------------|------------|--------------|----------------|----------------|-----------------|---------------|------------|-----------|
| **FR-008.1** | Mobile platform support | SRS 5.8, PRD F-011 | P0 | - | MOBILE-001 | `mobile/` (React Native) | TC-060, TC-061 | Approved | Mobile Dev |
| **FR-008.2** | Push notifications | SRS 5.8, PRD F-011 | P0 | US-008, US-012 | MOBILE-002 | `mobile/notifications.js` | TC-062, TC-063 | Approved | Mobile Dev |
| **FR-008.3** | Offline mode (cached data) | SRS 5.8, PRD F-011 | P0 | - | MOBILE-003 | `mobile/offline.js` | TC-064 | Approved | Mobile Dev |
| **FR-008.4** | Mobile-specific UI | SRS 5.8, PRD UI-002 | P0 | - | MOBILE-004 | `mobile/components/` | TC-065 | Approved | Mobile Dev |
| **NFR-008.1** | Works on 2GB+ RAM devices | SRS 6.6, PRD NFR-022 | P0 | - | MOBILE-005 | - | TC-128 | Approved | Mobile Dev |
| **NFR-008.2** | App size <50 MB | SRS 6.6, PRD NFR-011 | P0 | - | MOBILE-006 | - | TC-129 | Approved | Mobile Dev |
| **NFR-008.3** | Crash rate <2% | SRS 6.6, PRD NFR-006 | P0 | - | MOBILE-007 | - | TC-130 | Approved | Mobile Dev |
| **NFR-008.4** | Load time <3s on 4G | SRS 6.1, PRD NFR-001 | P0 | - | PERF-014 | - | TC-131 | Approved | Mobile Dev |
| **NFR-008.5** | Push notification delivery >90% | SRS 6.1 | P0 | - | MOBILE-008 | - | TC-132 | Approved | Mobile Dev |

---

### 2.9 Admin Dashboard

| **Req ID** | **Requirement** | **Source** | **Priority** | **User Story** | **Design Ref** | **Code Module** | **Test Case** | **Status** | **Owner** |
|------------|-----------------|------------|--------------|----------------|----------------|-----------------|---------------|------------|-----------|
| **FR-009.1** | Content Management System | SRS 5.9, PRD F-015 | P1 | US-015, UC-026 | ADMIN-001 | `admin/cms.js` | TC-066, TC-067 | Approved | Backend Dev |
| **FR-009.2** | User management | SRS 5.9, PRD F-015 | P1 | - | ADMIN-002 | `admin/users.js` | TC-068 | Approved | Backend Dev |
| **FR-009.3** | Analytics dashboard | SRS 5.9, PRD F-015 | P1 | US-016 | ADMIN-003 | `admin/analytics.js` | TC-069, TC-070 | Approved | Backend Dev |
| **FR-009.4** | System monitoring | SRS 5.9, PRD F-015 | P1 | - | ADMIN-004 | `admin/monitoring.js` | TC-071 | Approved | Backend Dev |
| **NFR-009.1** | Admin dashboard load <5s | SRS 6.1 | P1 | - | PERF-015 | - | TC-133 | Approved | Frontend Dev |
| **NFR-009.2** | Publish article <5 min | SRS 6.1 | P1 | - | PERF-016 | - | TC-134 | Approved | Backend Dev |
| **NFR-009.3** | Analytics real-time (5 min delay) | SRS 6.1 | P1 | - | PERF-017 | - | TC-135 | Approved | Backend Dev |

---

### 2.10 External Integrations

| **Req ID** | **Requirement** | **Source** | **Priority** | **User Story** | **Design Ref** | **Code Module** | **Test Case** | **Status** | **Owner** |
|------------|-----------------|------------|--------------|----------------|----------------|-----------------|---------------|------------|-----------|
| **IR-001** | Sentinel Hub API v3 integration | SRS 8.1, PRD IR-001 | P0 | - | INT-001 | `integrations/sentinel-hub.js` | TC-072, TC-073 | Approved | Backend Dev |
| **IR-002** | Academic account (3000 req/month) | SRS 8.1, PRD IR-002 | P0 | - | INT-002 | - | TC-074 | Approved | Backend Dev |
| **IR-003** | Multispectral bands request | SRS 8.1, PRD IR-003 | P0 | - | INT-003 | - | TC-075 | Approved | Backend Dev |
| **IR-006** | Image caching (30 days) | SRS 8.1, PRD IR-006 | P0 | - | CACHE-001 | `cache/images.js` | TC-076 | Approved | Backend Dev |
| **IR-007** | API rate limit handling | SRS 8.1, PRD IR-007 | P0 | - | INT-004 | `integrations/rate-limit.js` | TC-077 | Approved | Backend Dev |
| **IR-009** | OpenWeatherMap API v2.5 | SRS 8.2, PRD IR-009 | P0 | - | INT-005 | `integrations/weather.js` | TC-078, TC-079 | Approved | Backend Dev |
| **IR-014** | Weather caching (6 hours) | SRS 8.2, PRD IR-014 | P0 | - | CACHE-002 | `cache/weather.js` | TC-080 | Approved | Backend Dev |
| **IR-016** | Google OAuth 2.0 | SRS 8.3, PRD IR-016 | P0 | US-001 | INT-006 | `integrations/google-oauth.js` | TC-081, TC-082 | Approved | Backend Dev |
| **IR-021** | Firebase Cloud Messaging | SRS 8.4, PRD IR-021 | P0 | US-008, US-012 | INT-007 | `integrations/firebase.js` | TC-083, TC-084 | Approved | Backend Dev |

---

## 3. REQUIREMENTS COVERAGE ANALYSIS

### 3.1 Requirements Summary

| **Category** | **Total** | **P0 (Must)** | **P1 (Should)** | **P2 (Could)** | **Approved** | **In Progress** | **Not Started** |
|--------------|-----------|---------------|-----------------|----------------|--------------|-----------------|-----------------|
| **Functional Requirements** | 34 | 24 | 8 | 2 | 34 | 0 | 0 |
| **Non-Functional Requirements** | 23 | 18 | 5 | 0 | 23 | 0 | 0 |
| **Integration Requirements** | 12 | 10 | 2 | 0 | 12 | 0 | 0 |
| **User Stories** | 16 | 12 | 4 | 0 | 16 | 0 | 0 |
| **Use Cases** | 28 | 18 | 8 | 2 | 28 | 0 | 0 |
| **TOTAL** | **113** | **82** | **27** | **4** | **113** | **0** | **0** |

**Coverage:** 100% of requirements approved and ready for implementation

---

### 3.2 Requirements by Feature

| **Feature** | **Functional Req** | **Non-Functional Req** | **User Stories** | **Use Cases** | **Total** | **Coverage** |
|-------------|-------------------|------------------------|------------------|---------------|-----------|--------------|
| User Authentication | 9 | 4 | 3 | 4 | 20 | 100% |
| Field Mapping | 9 | 4 | 2 | 5 | 20 | 100% |
| Crop Health Monitoring | 8 | 4 | 2 | 4 | 18 | 100% |
| Recommendations | 4 | 5 | 3 | 3 | 15 | 100% |
| Yield Prediction | 4 | 3 | 2 | 2 | 11 | 100% |
| Weather Forecasting | 4 | 3 | 2 | 2 | 11 | 100% |
| Disaster Assessment | 4 | 4 | 2 | 2 | 12 | 100% |
| Mobile Application | 4 | 5 | 0 | 0 | 9 | 100% |
| Admin Dashboard | 4 | 3 | 2 | 4 | 13 | 100% |
| External Integrations | 12 | 0 | 0 | 0 | 12 | 100% |

---

### 3.3 Requirements by Source

| **Source Document** | **Requirements Traced** | **Coverage** |
|---------------------|------------------------|--------------|
| Business Case | 15 business requirements | 100% |
| Project Charter | 20 project objectives | 100% |
| Feasibility Study | 12 technical constraints | 100% |
| Product Requirements Document (PRD) | 34 product features | 100% |
| Software Requirements Specification (SRS) | 57 detailed requirements | 100% |
| Use Cases & User Stories | 44 use cases and stories | 100% |

**Total Requirements Traced:** 113  
**Total Coverage:** 100%

---

## 4. TEST COVERAGE ANALYSIS

### 4.1 Test Cases Summary

| **Test Type** | **Total Test Cases** | **P0 (Critical)** | **P1 (High)** | **P2 (Medium)** | **Status** |
|---------------|---------------------|-------------------|---------------|-----------------|------------|
| **Unit Tests** | 150+ | 80 | 50 | 20+ | Planned |
| **Integration Tests** | 50+ | 30 | 15 | 5+ | Planned |
| **System Tests** | 30 | 20 | 8 | 2 | Planned |
| **UAT Scenarios** | 5 | 5 | 0 | 0 | Planned |
| **Performance Tests** | 20 | 15 | 5 | 0 | Planned |
| **Security Tests** | 15 | 10 | 5 | 0 | Planned |
| **TOTAL** | **270+** | **160** | **83** | **27+** | **Planned** |

---

### 4.2 Test Coverage by Requirement

**Functional Requirements:**
- Total: 34 functional requirements
- Covered by tests: 34 (100%)
- Average tests per requirement: 3.2

**Non-Functional Requirements:**
- Total: 23 non-functional requirements
- Covered by tests: 23 (100%)
- Average tests per requirement: 2.1

**User Stories:**
- Total: 16 user stories
- Covered by UAT scenarios: 16 (100%)
- Average UAT steps per story: 4.5

---

### 4.3 Critical Test Cases (P0)

| **Test ID** | **Test Name** | **Requirement** | **Type** | **Priority** | **Owner** |
|-------------|---------------|-----------------|----------|--------------|-----------|
| **TC-001** | Sign up with Google OAuth - Success | FR-001.1 | Integration | P0 | QA Lead |
| **TC-002** | Sign up with Google OAuth - Failure | FR-001.1 | Integration | P0 | QA Lead |
| **TC-006** | Login with email/password - Success | FR-001.4 | Integration | P0 | QA Lead |
| **TC-007** | Login with email/password - Invalid credentials | FR-001.4 | Integration | P0 | QA Lead |
| **TC-017** | AI boundary detection - Success (≥85% IoU) | FR-002.3 | System | P0 | QA Lead |
| **TC-018** | AI boundary detection - No field detected | FR-002.3 | System | P0 | QA Lead |
| **TC-028** | NDVI calculation - Accuracy validation | FR-003.2 | System | P0 | QA Lead |
| **TC-036** | Water recommendation - Moderate stress | FR-004.1 | System | P0 | QA Lead |
| **TC-043** | Yield prediction - Accuracy ≥85% | FR-005.1 | System | P0 | QA Lead |
| **TC-101** | Login response time <2s (p95) | NFR-001.1 | Performance | P0 | QA Lead |
| **TC-105** | Map load time <5s on 3G | NFR-002.1 | Performance | P0 | QA Lead |
| **TC-107** | Boundary detection accuracy ≥85% IoU | NFR-002.3 | Performance | P0 | QA Lead |
| **TC-119** | Yield prediction MAPE <15% | NFR-005.2 | Performance | P0 | QA Lead |

---

## 5. CHANGE IMPACT ANALYSIS

### 5.1 Change Tracking

**Change Request Process:**
1. Stakeholder submits change request (CR form)
2. BA/PM analyzes impact on requirements
3. Update RTM with affected requirements
4. Identify impacted design, code, tests
5. Estimate effort and timeline impact
6. Change Control Board approves/rejects
7. If approved: Update all linked artifacts

---

### 5.2 Sample Change Impact Analysis

**Change Request:** CR-001 - Add Sinhala Language Support

**Impact Analysis:**

| **Affected Req** | **Current State** | **Change Required** | **Effort** | **Risk** |
|------------------|-------------------|---------------------|------------|----------|
| FR-001.2 | Email/password signup (English) | Add Sinhala UI strings | 4 hours | Low |
| FR-003.6 | Health map (English labels) | Translate labels to Sinhala | 2 hours | Low |
| FR-004.1 | Water recommendations (English) | Translate recommendations | 8 hours | Medium |
| FR-009.1 | CMS (English content) | Support Sinhala content | 12 hours | Medium |
| NFR-008 | Localization (English only) | Add Sinhala locale | 16 hours | Medium |

**Total Impact:**
- Requirements affected: 5
- Design documents affected: 3
- Code modules affected: 15
- Test cases affected: 20
- Total effort: 42 hours (~1 week)
- Timeline impact: +1 week
- Budget impact: Rs. 0 (in-house development)

**Decision:** Defer to Phase 2 (Month 9-12) - Not critical for MVP

---

### 5.3 Requirement Change Log

| **CR ID** | **Date** | **Requirement** | **Change Type** | **Impact** | **Status** | **Decision** |
|-----------|----------|-----------------|---------------|------------|------------|--------------|
| CR-001 | Nov 15, 2025 | NFR-008 (Localization) | Add Sinhala support | +1 week | Reviewed | Deferred to Phase 2 |
| CR-002 | Dec 5, 2025 | FR-002.3 (Boundary Detection) | Use Google Earth Engine instead of Sentinel Hub | No impact (backup plan) | Reviewed | Rejected (not needed) |
| CR-003 | Jan 10, 2026 | FR-008.2 (Push Notifications) | Add notification scheduling | +3 days | Reviewed | Approved |

---

## 6. APPENDICES

### Appendix A: Traceability Matrix Legend

**Column Definitions:**

- **Req ID:** Unique requirement identifier (FR-XXX, NFR-XXX, IR-XXX)
- **Requirement:** Brief description of the requirement
- **Source:** Originating document (Business Case, PRD, SRS, etc.)
- **Priority:** P0 (Must Have), P1 (Should Have), P2 (Nice to Have)
- **User Story:** Agile user story ID (US-XXX)
- **Design Ref:** Design document reference (AUTH-XXX, MAP-XXX, etc.)
- **Code Module:** Source code file or module
- **Test Case:** Test case ID (TC-XXX)
- **Status:** Approved, In Progress, Not Started, Deferred, Rejected
- **Owner:** Person responsible for implementation

**Status Definitions:**

- **Approved:** Requirement reviewed and approved by stakeholders
- **In Progress:** Requirement being implemented
- **Not Started:** Requirement approved but not yet started
- **Deferred:** Requirement postponed to future phase
- **Rejected:** Requirement rejected (not needed)

---

### Appendix B: Test Case Mapping

**Test Case Naming Convention:**
- **TC-001 to TC-099:** Functional tests (unit, integration, system)
- **TC-100 to TC-199:** Non-functional tests (performance, security, usability)
- **TC-200 to TC-299:** User acceptance tests (UAT)

**Test Case Template:**

```
Test Case ID: TC-001
Test Name: Sign up with Google OAuth - Success
Requirement: FR-001.1
Priority: P0 (Critical)
Type: Integration Test

Preconditions:
- User has Google account
- Internet connection available
- Google OAuth configured

Test Steps:
1. Navigate to signup page
2. Click "Sign up with Google" button
3. Select Google account on OAuth screen
4. Grant permissions (openid, profile, email)
5. Wait for redirect back to SkyCrop

Expected Result:
- User account created in database
- User logged in with active session (JWT token)
- User redirected to dashboard
- Welcome message displayed

Actual Result: [To be filled during testing]
Status: Pass / Fail
Tested By: [QA Engineer Name]
Test Date: [Date]
```

---

### Appendix C: Requirements Coverage Report

**Coverage by Priority:**

| **Priority** | **Total Req** | **Designed** | **Implemented** | **Tested** | **Coverage %** |
|--------------|---------------|--------------|-----------------|------------|----------------|
| **P0 (Must Have)** | 82 | 82 | 0 (Planned) | 0 (Planned) | 100% (Design) |
| **P1 (Should Have)** | 27 | 27 | 0 (Planned) | 0 (Planned) | 100% (Design) |
| **P2 (Nice to Have)** | 4 | 4 | 0 (Deferred) | 0 (Deferred) | 100% (Design) |
| **TOTAL** | **113** | **113** | **0** | **0** | **100%** |

**Note:** Implementation and testing will occur during development phase (Weeks 3-16)

---

**Coverage by Phase:**

| **Phase** | **Requirements** | **Design** | **Implementation** | **Testing** | **Status** |
|-----------|------------------|------------|-------------------|-------------|------------|
| **Phase 1: Planning** | 113 | 0 | 0 | 0 | ✅ Complete |
| **Phase 2: Design** | 113 | 113 (Planned) | 0 | 0 | 🟡 Next |
| **Phase 3: Development** | 113 | 113 | 113 (Planned) | 0 | ⚪ Future |
| **Phase 4: Testing** | 113 | 113 | 113 | 113 (Planned) | ⚪ Future |
| **Phase 5: Deployment** | 113 | 113 | 113 | 113 | ⚪ Future |

---

### Appendix D: Orphan Requirements Check

**Orphan Requirements:** Requirements not linked to design, code, or tests

**Analysis Result:** ✅ **No orphan requirements found**

All 113 requirements are traced to:
- Design documents (100%)
- Code modules (100% planned)
- Test cases (100% planned)

---

### Appendix E: Bi-Directional Traceability

**Forward Traceability (Business Need → Test):**

```
Business Need: Increase farmer income by 15-25%
  ↓
Product Requirement: F-007 (Water Recommendations)
  ↓
Functional Requirement: FR-004.1 (Water Recommendation Engine)
  ↓
User Story: US-006 (Get Water Recommendations)
  ↓
Use Case: UC-014 (View Water Recommendations)
  ↓
Design: REC-001 (Recommendation Service Design)
  ↓
Code: recommendations/water.js
  ↓
Test: TC-036 (Water Recommendation - Moderate Stress)
  ↓
Validation: NFR-004.3 (20-30% water savings achieved)
```

**Backward Traceability (Test → Business Need):**

```
Test: TC-036 (Water Recommendation - Moderate Stress)
  ↑
Code: recommendations/water.js
  ↑
Design: REC-001 (Recommendation Service Design)
  ↑
Use Case: UC-014 (View Water Recommendations)
  ↑
User Story: US-006 (Get Water Recommendations)
  ↑
Functional Requirement: FR-004.1 (Water Recommendation Engine)
  ↑
Product Requirement: F-007 (Water Recommendations)
  ↑
Business Need: Increase farmer income by 15-25%
```

---

### Appendix F: Requirements Verification Matrix

| **Verification Method** | **Requirements** | **Percentage** |
|------------------------|------------------|----------------|
| **Inspection** (Code Review) | 34 | 30% |
| **Analysis** (Static Analysis, Linting) | 23 | 20% |
| **Testing** (Unit, Integration, System) | 113 | 100% |
| **Demonstration** (UAT, Stakeholder Demo) | 16 | 14% |

**Note:** All requirements will be tested (100%), but not all require demonstration to stakeholders

---

### Appendix G: Requirements Validation Checklist

**For Each Requirement:**
- [ ] Requirement is clear and unambiguous
- [ ] Requirement is testable (has measurable acceptance criteria)
- [ ] Requirement is feasible (technically and financially)
- [ ] Requirement is necessary (supports business goal)
- [ ] Requirement is prioritized (P0, P1, or P2)
- [ ] Requirement is traced to source (business need, user story)
- [ ] Requirement is traced to design (architecture, database, API)
- [ ] Requirement is traced to code (module, file)
- [ ] Requirement is traced to test (test case ID)
- [ ] Requirement is approved by stakeholders

**Validation Result:** ✅ All 113 requirements pass validation checklist

---

### Appendix H: RTM Maintenance Plan

**Update Frequency:**
- **Weekly:** During development (Weeks 3-16)
- **Bi-weekly:** During testing (Weeks 14-15)
- **Monthly:** Post-launch (maintenance phase)

**Update Triggers:**
- New requirement added (change request approved)
- Requirement modified (change request approved)
- Requirement deleted (change request approved)
- Design document updated
- Code module completed
- Test case executed

**Responsibilities:**
- **Business Analyst:** Maintain requirements, user stories, use cases
- **QA Lead:** Maintain test cases, test results
- **Technical Lead:** Maintain design references, code modules
- **Project Manager:** Review and approve RTM updates

**RTM Review Meetings:**
- **Frequency:** Bi-weekly (end of each sprint)
- **Attendees:** BA, QA Lead, Tech Lead, PM
- **Agenda:** Review RTM, identify gaps, update status, plan next sprint

---

## DOCUMENT APPROVAL

**Requirement Traceability Matrix Sign-Off:**

By signing below, the undersigned acknowledge that they have reviewed the Requirement Traceability Matrix and agree that all requirements are properly traced and ready for implementation.

| **Name** | **Role** | **Signature** | **Date** |
|----------|----------|---------------|----------|
| [Your Name] | Business Analyst | _________________ | __________ |
| [QA Name] | QA Lead | _________________ | __________ |
| [Tech Lead] | Technical Lead | _________________ | __________ |
| [PM Name] | Product Manager | _________________ | __________ |
| [Supervisor] | Project Sponsor | _________________ | __________ |

**Approval Decision:** ☐ APPROVED - Proceed to Design Phase ☐ CONDITIONAL APPROVAL ☐ REJECTED

---

**END OF REQUIREMENT TRACEABILITY MATRIX**

---

**Next Steps:**
1. ✅ Obtain RTM approval from all stakeholders
2. ✅ **Requirements Analysis Phase Complete**
3. ✅ Proceed to **System Design Phase**:
   - System Architecture Document
   - Database Schema Design
   - API Specifications
   - UI/UX Mockups
4. ✅ Begin Sprint Planning (Week 3)

**For Questions:**
Contact Business Analyst: [Your Email]

**Document Location:** `Doc/Requirements Analysis Phase/requirement_traceability_matrix.md`

---

*This document is confidential and intended for the development team and project stakeholders only.*