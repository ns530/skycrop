# PROJECT PLAN

## SkyCrop: Satellite-Based Paddy Field Management & Monitoring System

---

## DOCUMENT CONTROL

| **Item**            | **Details**                                         |
| ------------------- | --------------------------------------------------- |
| **Document Title**  | Detailed Project Plan                               |
| **Project Name**    | SkyCrop - Intelligent Paddy Field Monitoring System |
| **Document Code**   | SKYCROP-PP-2025-001                                 |
| **Version**         | 1.0                                                 |
| **Date**            | October 28, 2025                                    |
| **Prepared By**     | [Your Name] - Project Manager                       |
| **Reviewed By**     | [BA Name] - Business Analyst                        |
| **Approved By**     | [Client Name] - Project Sponsor                     |
| **Status**          | Approved                                            |
| **Planning Period** | October 28, 2025 - February 28, 2026 (16 weeks)     |

---

## EXECUTIVE SUMMARY

### Project Overview

**SkyCrop** is a 16-week academic project to develop an AI-powered, satellite-based agricultural monitoring platform for Sri Lankan paddy farmers. The system will provide automated field boundary detection, crop health monitoring (NDVI, NDWI, TDVI), yield prediction, disaster assessment, and precision agriculture recommendations through web and mobile applications.

### Key Project Metrics

| **Metric**           | **Target**                                                 |
| -------------------- | ---------------------------------------------------------- |
| **Duration**         | 16 weeks (112 days)                                        |
| **Total Effort**     | 640 hours (40 hrs/week average)                            |
| **Budget**           | Rs. 364,500 (Development + Year 1 operational)             |
| **Team Size**        | 1-2 developers + 2 advisors                                |
| **End Users**        | 100 farmers (Year 1 pilot)                                 |
| **Success Criteria** | 80%+ user satisfaction, 85%+ AI accuracy, on-time delivery |

### Project Timeline Summary

```
Oct 28 ────── Nov ────── Dec ────── Jan ────── Feb 28
   │            │          │          │          │
   M1        M2         M3         M4-M5      M6-M7
Kickoff   Design    AI Models   Apps    Launch
```

**Phase Distribution:**

- Planning & Design: 25% (Weeks 1-4)
- Development: 50% (Weeks 5-13)
- Testing & Deployment: 25% (Weeks 14-16)

### Critical Path

**Longest Dependency Chain (No Slack):**

```
Requirements → Design → Satellite API → AI Training →
Frontend Integration → Mobile App → Testing → Deployment
```

**Critical Success Factors:**

1. ✅ Sentinel Hub API access secured by Week 1
2. ✅ AI model accuracy ≥85% by Week 8
3. ✅ 50+ farmers recruited for pilot by Month 2
4. ✅ Zero P1 (critical) bugs at launch

---

## TABLE OF CONTENTS

1. [Project Scope Management](#1-project-scope-management)
2. [Work Breakdown Structure (WBS)](#2-work-breakdown-structure-wbs)
3. [Schedule Management](#3-schedule-management)
4. [Resource Management](#4-resource-management)
5. [Budget & Cost Management](#5-budget--cost-management)
6. [Quality Management](#6-quality-management)
7. [Risk Management](#7-risk-management)
8. [Communication Management](#8-communication-management)
9. [Stakeholder Management](#9-stakeholder-management)
10. [Procurement Management](#10-procurement-management)
11. [Integration Management](#11-integration-management)
12. [Appendices](#12-appendices)

---

## 1. PROJECT SCOPE MANAGEMENT

### 1.1 Scope Statement

**In-Scope (What Will Be Delivered):**

**Core Features:**

- ✅ User authentication (Google OAuth, Email/Password, Password Reset)
- ✅ Interactive satellite map interface with field selection
- ✅ AI-powered automatic paddy field boundary detection (U-Net model, 85%+ accuracy)
- ✅ Automated field area calculation (hectares)
- ✅ Vegetation indices calculation (NDVI, NDWI, TDVI)
- ✅ Crop health assessment with color-coded visualizations
- ✅ Water and fertilizer recommendations
- ✅ Yield prediction using machine learning (Random Forest, 85%+ accuracy)
- ✅ Disaster damage assessment (before/after comparison)
- ✅ Financial loss estimation for damaged fields
- ✅ 7-day weather forecast integration
- ✅ News & events content management system (admin)
- ✅ Responsive web application (React.js + Tailwind CSS)
- ✅ Cross-platform mobile application (React Native - Android & iOS)
- ✅ Admin dashboard for system management

**Technical Deliverables:**

- ✅ Backend REST API (Node.js/Express)
- ✅ Database schema (PostgreSQL + MongoDB)
- ✅ AI/ML models (boundary detection, yield prediction)
- ✅ Cloud infrastructure (AWS/Railway deployment)
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ API documentation (Swagger/OpenAPI)
- ✅ User documentation (guides, video tutorials)
- ✅ Technical documentation (architecture, deployment guide)

**Geographic Coverage:**

- ✅ Sri Lanka (all paddy-growing regions)
- ✅ Satellite coverage: Sentinel-2 (10m resolution, 5-day revisit)

**User Roles:**

- ✅ Farmer (view fields, monitor health, get recommendations)
- ✅ Admin (manage content, view analytics, user management)

### 1.2 Out-of-Scope (Not in Phase 1)

**Deferred to Future Phases:**

- ❌ IoT sensor integration (soil moisture, temperature)
- ❌ Drone imagery processing
- ❌ Automated irrigation system control
- ❌ Marketplace for buying/selling paddy
- ❌ Financial loan/insurance integration (except data export)
- ❌ Pest and disease image recognition
- ❌ Multi-crop support (currently paddy only)
- ❌ Offline mobile app functionality (only cached data)
- ❌ SMS/WhatsApp notification system
- ❌ Multi-language support (English only in Phase 1; Sinhala/Tamil in Phase 2)
- ❌ Advanced analytics (historical trends beyond 6 months)
- ❌ Multi-field management (farmers limited to 5 fields max in Phase 1)

### 1.3 Acceptance Criteria

**System-Level Criteria:**

| **Criterion**                  | **Target**                   | **Measurement Method**                  |
| ------------------------------ | ---------------------------- | --------------------------------------- |
| AI boundary detection accuracy | ≥85% (IoU metric)            | Validation on test dataset (100 fields) |
| Yield prediction accuracy      | ≥85% (MAPE <15%)             | Comparison with actual harvest data     |
| Vegetation indices accuracy    | ≥90% correlation             | Ground-truth measurements (10 fields)   |
| System uptime                  | ≥99%                         | Uptime monitoring (UptimeRobot)         |
| API response time              | <3 seconds (95th percentile) | Load testing (Apache JMeter)            |
| Mobile app crash rate          | <2%                          | Firebase Crashlytics                    |
| Web app load time              | <5 seconds (3G connection)   | Lighthouse performance score >70        |
| User satisfaction              | ≥4.0/5.0 (NPS >40)           | Post-usage survey (n≥50)                |
| Feature adoption               | ≥70% use core features       | Analytics (Google Analytics, Mixpanel)  |

**Functional Acceptance Criteria:**

1. **User Authentication:**

   - User can sign up with Google OAuth in <1 minute
   - User can sign up with email/password in <2 minutes
   - Password reset link sent within 5 minutes
   - Session persists for 30 days (remember me)

2. **Field Boundary Detection:**

   - User taps location on map
   - AI detects boundary within 60 seconds
   - Boundary displayed as polygon overlay
   - User can manually adjust boundary points (drag)
   - Area calculated and displayed in hectares (±5% accuracy)

3. **Crop Health Monitoring:**

   - NDVI, NDWI, TDVI calculated and displayed
   - Color-coded field map (green/yellow/red zones)
   - Health status displayed (Excellent/Good/Fair/Poor)
   - Historical trend graph (last 6 months)
   - Data updates every 5-7 days (Sentinel-2 revisit)

4. **Recommendations:**

   - Water recommendation (irrigate/skip irrigation, timing)
   - Fertilizer recommendation (type, quantity, location)
   - Displayed in simple language (avoid jargon)
   - Recommendations update with each health assessment

5. **Yield Prediction:**

   - Predicted yield displayed in kg/hectare and total kg
   - Confidence interval shown (e.g., 4000-4500 kg/ha)
   - Prediction updates every 10 days throughout season
   - Alert if yield trending below expectations

6. **Disaster Assessment:**

   - User selects date range (before/after disaster)
   - System compares satellite images
   - Damage percentage calculated
   - Financial loss estimated (kg × market price)
   - Report generated (PDF export)

7. **Weather Forecast:**

   - 7-day forecast displayed (temperature, rainfall, humidity)
   - Field-specific location data
   - Alerts for extreme weather (heavy rain, drought)

8. **Mobile App:**
   - Feature parity with web app (core features)
   - Push notifications (health alerts, weather warnings)
   - Works on Android 8+ and iOS 13+
   - App size <50 MB

### 1.4 Scope Change Control Process

**Change Request Procedure:**

1. **Initiation:** Stakeholder submits change request (form in Appendix A)
2. **Impact Analysis:** PM assesses impact on scope, timeline, cost, resources (48-hour turnaround)
3. **Review:** Change Control Board (PM, BA, Sponsor) reviews (weekly meetings)
4. **Decision:** Approve / Reject / Defer
5. **Implementation:** If approved, update project plan and communicate to team
6. **Documentation:** Log change in change register (Appendix B)

**Change Control Board (CCB):**

- Chair: Project Manager
- Members: Business Analyst, Project Sponsor, Technical Lead
- Meetings: Weekly (Fridays, 30 minutes)

**Approval Authority:**

| **Change Type**                      | **Approval Required** | **Timeline Impact** |
| ------------------------------------ | --------------------- | ------------------- |
| Minor (cosmetic UI changes)          | PM only               | None                |
| Moderate (feature modification)      | PM + BA               | <1 week             |
| Major (new feature, scope expansion) | CCB (unanimous)       | >1 week             |

**Scope Creep Prevention:**

- ✅ MVP mindset: "Is this essential for launch?"
- ✅ Defer non-critical features to Phase 2
- ✅ Weekly scope review in team meetings
- ✅ Stakeholder education on change impact

---

## 2. WORK BREAKDOWN STRUCTURE (WBS)

### 2.1 WBS Overview

**Level 0:** SkyCrop Project  
**Level 1:** 8 Major Phases  
**Level 2:** 32 Deliverables  
**Level 3:** 156 Work Packages (tasks)

### 2.2 WBS Hierarchy

```
1.0 SkyCrop Project
│
├── 1.1 Project Management (Ongoing)
│   ├── 1.1.1 Project Planning
│   ├── 1.1.2 Progress Tracking
│   ├── 1.1.3 Stakeholder Meetings
│   └── 1.1.4 Risk Management
│
├── 1.2 Phase 1: Planning & Initiation (Weeks 1-2)
│   ├── 1.2.1 Project Charter
│   ├── 1.2.2 Business Case
│   ├── 1.2.3 Feasibility Study
│   ├── 1.2.4 Requirements Gathering
│   └── 1.2.5 Project Plan (This Document)
│
├── 1.3 Phase 2: System Design (Weeks 3-4)
│   ├── 1.3.1 System Architecture Design
│   ├── 1.3.2 Database Schema Design
│   ├── 1.3.3 API Specifications
│   ├── 1.3.4 UI/UX Mockups
│   └── 1.3.5 Technology Stack Finalization
│
├── 1.4 Phase 3: Infrastructure Setup (Weeks 3-5)
│   ├── 1.4.1 Development Environment Setup
│   ├── 1.4.2 Backend API Framework
│   ├── 1.4.3 Database Setup
│   ├── 1.4.4 Satellite API Integration
│   ├── 1.4.5 Authentication System
│   └── 1.4.6 CI/CD Pipeline
│
├── 1.5 Phase 4: AI/ML Development (Weeks 5-8)
│   ├── 1.5.1 Dataset Acquisition
│   ├── 1.5.2 U-Net Boundary Detection Model
│   ├── 1.5.3 Model Training & Optimization
│   ├── 1.5.4 Vegetation Indices Calculator
│   ├── 1.5.5 Yield Prediction Model
│   ├── 1.5.6 Disaster Detection Algorithm
│   └── 1.5.7 Model Evaluation & Validation
│
├── 1.6 Phase 5: Frontend Development (Weeks 9-11)
│   ├── 1.6.1 React App Setup
│   ├── 1.6.2 Authentication UI
│   ├── 1.6.3 Map Interface
│   ├── 1.6.4 Field Selection & Boundary Display
│   ├── 1.6.5 Dashboard (Health Metrics)
│   ├── 1.6.6 Recommendations Display
│   ├── 1.6.7 Weather Forecast Page
│   └── 1.6.8 Admin Panel
│
├── 1.7 Phase 6: Mobile App Development (Weeks 12-13)
│   ├── 1.7.1 React Native Setup
│   ├── 1.7.2 Authentication Screens
│   ├── 1.7.3 Map View
│   ├── 1.7.4 Dashboard Screens
│   ├── 1.7.5 Push Notifications
│   └── 1.7.6 Mobile Testing
│
├── 1.8 Phase 7: Integration & Testing (Weeks 14-15)
│   ├── 1.8.1 API Integration Testing
│   ├── 1.8.2 Unit Testing
│   ├── 1.8.3 User Acceptance Testing
│   ├── 1.8.4 Performance Testing
│   ├── 1.8.5 Security Audit
│   └── 1.8.6 Bug Fixing
│
└── 1.9 Phase 8: Deployment & Documentation (Week 16)
    ├── 1.9.1 Production Deployment
    ├── 1.9.2 App Store Submission
    ├── 1.9.3 User Documentation
    ├── 1.9.4 Technical Documentation
    └── 1.9.5 Final Presentation
```

### 2.3 Detailed WBS with Effort Estimates

#### Phase 1: Planning & Initiation (Weeks 1-2, 80 hours)

| **WBS Code**      | **Task**               | **Effort (hrs)** | **Owner** | **Dependencies**  |
| ----------------- | ---------------------- | ---------------- | --------- | ----------------- |
| 1.2.1             | Project Charter        | 16               | PM        | None              |
| 1.2.2             | Business Case          | 20               | PM + BA   | 1.2.1             |
| 1.2.3             | Feasibility Study      | 20               | PM + BA   | 1.2.2             |
| 1.2.4             | Requirements Gathering | 12               | BA        | Farmer interviews |
| 1.2.5             | Project Plan           | 12               | PM        | 1.2.1-1.2.4       |
| **Phase 1 Total** |                        | **80**           |           |                   |

#### Phase 2: System Design (Weeks 3-4, 80 hours)

| **WBS Code**      | **Task**                      | **Effort (hrs)** | **Owner**    | **Dependencies** |
| ----------------- | ----------------------------- | ---------------- | ------------ | ---------------- |
| 1.3.1             | System Architecture Design    | 20               | Tech Lead    | 1.2.4            |
| 1.3.2             | Database Schema Design        | 12               | Backend Dev  | 1.3.1            |
| 1.3.3             | API Specifications            | 12               | Backend Dev  | 1.3.1            |
| 1.3.4             | UI/UX Mockups (Figma)         | 20               | Frontend Dev | 1.2.4            |
| 1.3.5             | Technology Stack Finalization | 8                | Tech Lead    | 1.3.1            |
| 1.3.6             | Design Review & Approval      | 8                | PM + Sponsor | 1.3.1-1.3.5      |
| **Phase 2 Total** |                               | **80**           |              |                  |

#### Phase 3: Infrastructure Setup (Weeks 3-5, 60 hours)

| **WBS Code**      | **Task**                              | **Effort (hrs)** | **Owner**   | **Dependencies** |
| ----------------- | ------------------------------------- | ---------------- | ----------- | ---------------- |
| 1.4.1             | Dev Environment Setup                 | 8                | Tech Lead   | 1.3.5            |
| 1.4.2             | Backend API Framework                 | 16               | Backend Dev | 1.4.1            |
| 1.4.3             | Database Setup (PostgreSQL + MongoDB) | 8                | Backend Dev | 1.4.2            |
| 1.4.4             | Sentinel Hub API Integration          | 12               | Backend Dev | API credentials  |
| 1.4.5             | Authentication System (OAuth + JWT)   | 12               | Backend Dev | 1.4.2            |
| 1.4.6             | CI/CD Pipeline (GitHub Actions)       | 4                | DevOps      | Git repo         |
| **Phase 3 Total** |                                       | **60**           |             |                  |

#### Phase 4: AI/ML Development (Weeks 5-8, 120 hours)

| **WBS Code**      | **Task**                               | **Effort (hrs)** | **Owner**   | **Dependencies** |
| ----------------- | -------------------------------------- | ---------------- | ----------- | ---------------- |
| 1.5.1             | Dataset Acquisition (DeepGlobe)        | 6                | ML Engineer | None             |
| 1.5.2             | U-Net Model Development                | 40               | ML Engineer | 1.5.1            |
| 1.5.3             | Model Training & Optimization          | 24               | ML Engineer | 1.5.2            |
| 1.5.4             | Vegetation Indices Calculator          | 12               | ML Engineer | 1.4.4            |
| 1.5.5             | Yield Prediction Model (Random Forest) | 20               | ML Engineer | Historical data  |
| 1.5.6             | Disaster Detection Algorithm           | 12               | ML Engineer | 1.4.4            |
| 1.5.7             | Model Evaluation & Validation          | 6                | ML Engineer | 1.5.2-1.5.6      |
| **Phase 4 Total** |                                        | **120**          |             |                  |

#### Phase 5: Frontend Development (Weeks 9-11, 120 hours)

| **WBS Code**      | **Task**                           | **Effort (hrs)** | **Owner**    | **Dependencies** |
| ----------------- | ---------------------------------- | ---------------- | ------------ | ---------------- |
| 1.6.1             | React App Setup & Routing          | 8                | Frontend Dev | 1.3.4            |
| 1.6.2             | Authentication UI (Login/Signup)   | 12               | Frontend Dev | 1.4.5            |
| 1.6.3             | Map Interface (Leaflet.js)         | 24               | Frontend Dev | 1.4.4            |
| 1.6.4             | Field Selection & Boundary Display | 24               | Frontend Dev | 1.5.2, 1.6.3     |
| 1.6.5             | Dashboard (Health Metrics)         | 20               | Frontend Dev | Backend API      |
| 1.6.6             | Recommendations Display            | 12               | Frontend Dev | 1.5.4            |
| 1.6.7             | Weather Forecast Page              | 8                | Frontend Dev | Weather API      |
| 1.6.8             | Admin Panel (CMS)                  | 12               | Frontend Dev | Backend API      |
| **Phase 5 Total** |                                    | **120**          |              |                  |

#### Phase 6: Mobile App Development (Weeks 12-13, 80 hours)

| **WBS Code**      | **Task**                       | **Effort (hrs)** | **Owner**  | **Dependencies** |
| ----------------- | ------------------------------ | ---------------- | ---------- | ---------------- |
| 1.7.1             | React Native Setup             | 8                | Mobile Dev | None             |
| 1.7.2             | Authentication Screens         | 16               | Mobile Dev | 1.6.2            |
| 1.7.3             | Map View                       | 24               | Mobile Dev | 1.6.3            |
| 1.7.4             | Dashboard Screens              | 16               | Mobile Dev | 1.6.5            |
| 1.7.5             | Push Notifications (Firebase)  | 8                | Mobile Dev | Firebase setup   |
| 1.7.6             | Mobile Testing (Android + iOS) | 8                | Mobile Dev | 1.7.1-1.7.5      |
| **Phase 6 Total** |                                | **80**           |            |                  |

#### Phase 7: Integration & Testing (Weeks 14-15, 80 hours)

| **WBS Code**      | **Task**                             | **Effort (hrs)** | **Owner** | **Dependencies** |
| ----------------- | ------------------------------------ | ---------------- | --------- | ---------------- |
| 1.8.1             | API Integration Testing              | 16               | QA Lead   | All APIs         |
| 1.8.2             | Unit Testing (80% coverage)          | 24               | QA Lead   | Code complete    |
| 1.8.3             | User Acceptance Testing (10 farmers) | 16               | QA + BA   | Beta app         |
| 1.8.4             | Performance Testing (JMeter)         | 8                | QA Lead   | Infrastructure   |
| 1.8.5             | Security Audit (OWASP)               | 8                | Security  | Code complete    |
| 1.8.6             | Bug Fixing (2 sprints)               | 8                | Dev Team  | 1.8.1-1.8.5      |
| **Phase 7 Total** |                                      | **80**           |           |                  |

#### Phase 8: Deployment & Documentation (Week 16, 40 hours)

| **WBS Code**      | **Task**                                 | **Effort (hrs)** | **Owner**   | **Dependencies** |
| ----------------- | ---------------------------------------- | ---------------- | ----------- | ---------------- |
| 1.9.1             | Production Deployment (AWS/Railway)      | 8                | DevOps      | Testing complete |
| 1.9.2             | App Store Submission (Google Play + iOS) | 8                | Mobile Dev  | Mobile app       |
| 1.9.3             | User Documentation (Guides, Videos)      | 12               | Tech Writer | App complete     |
| 1.9.4             | Technical Documentation (API, Arch)      | 8                | Tech Lead   | Code complete    |
| 1.9.5             | Final Presentation Prep                  | 4                | PM          | All deliverables |
| **Phase 8 Total** |                                          | **40**           |             |                  |

### 2.4 WBS Dictionary Sample

**WBS Code:** 1.5.2  
**Task Name:** U-Net Boundary Detection Model  
**Description:** Develop and train a U-Net convolutional neural network for semantic segmentation of paddy field boundaries from Sentinel-2 satellite imagery.  
**Owner:** ML Engineer  
**Effort:** 40 hours  
**Duration:** 5 days  
**Start Date:** Week 5, Day 1  
**End Date:** Week 5, Day 5  
**Dependencies:** 1.5.1 (Dataset Acquisition)  
**Deliverables:**

- Trained U-Net model (.h5 file)
- Model architecture diagram
- Training logs (accuracy, loss curves)
- Validation report (IoU ≥0.85)

**Acceptance Criteria:**

- Model achieves ≥85% IoU on validation set (100 fields)
- Inference time <60 seconds per field on CPU
- Model size <200 MB
- Code documented and pushed to GitHub

**Resources Required:**

- Python 3.9+, TensorFlow 2.13
- DeepGlobe agriculture dataset (2,000 labeled images)
- GPU instance (AWS p3.2xlarge or local GPU)
- 40 hours ML Engineer time

**Assumptions:**

- DeepGlobe dataset available for academic use
- Pre-trained ImageNet weights used for transfer learning
- Validation dataset representative of Sri Lankan paddy fields

**Risks:**

- Model accuracy <85% (Mitigation: Use pre-trained models, augment data)
- Training time exceeds 5 days (Mitigation: Use cloud GPUs, optimize hyperparameters)

---

## 3. SCHEDULE MANAGEMENT

### 3.1 Project Timeline (Gantt Chart)

**Start Date:** October 28, 2025 (Monday)  
**End Date:** February 28, 2026 (Saturday)  
**Duration:** 16 weeks (112 days)  
**Working Days:** 112 days (7 days/week, academic project)

### 3.2 Gantt Chart Visualization

```
Week │ 1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16
─────┼────────────────────────────────────────────────────
Plan │██████
Dsn  │      ██████
Setup│      ████████
AI/ML│            ██████████████
Front│                        ████████████
Mobl │                                    ████████
Test │                                            ████████
Deploy│                                                  ██
─────┴────────────────────────────────────────────────────
     M1    M2        M3            M4-M5      M6  M7
```

**Legend:**

- █ = Active work period
- M1-M7 = Milestones (see section 3.4)

### 3.3 Detailed Schedule (Phase-by-Phase)

#### Phase 1: Planning & Initiation

| **Week**   | **Dates**      | **Tasks**                                              | **Deliverables**           | **Milestone**   |
| ---------- | -------------- | ------------------------------------------------------ | -------------------------- | --------------- |
| **Week 1** | Oct 28 - Nov 3 | Project Charter, Business Case, Requirements gathering | Charter approved           |                 |
| **Week 2** | Nov 4 - Nov 10 | Feasibility Study, Project Plan, Stakeholder meetings  | All planning docs complete | **M1: Kickoff** |

#### Phase 2: System Design

| **Week**   | **Dates**       | **Tasks**                                             | **Deliverables**     | **Milestone**           |
| ---------- | --------------- | ----------------------------------------------------- | -------------------- | ----------------------- |
| **Week 3** | Nov 11 - Nov 17 | Architecture design, DB schema, API specs (Part 1)    | Architecture diagram |                         |
| **Week 4** | Nov 18 - Nov 24 | UI/UX mockups, Tech stack finalization, Design review | Design docs approved | **M2: Design Complete** |

#### Phase 3: Infrastructure Setup (Parallel with Design)

| **Week**   | **Dates**       | **Tasks**                                 | **Deliverables**                   | **Milestone**              |
| ---------- | --------------- | ----------------------------------------- | ---------------------------------- | -------------------------- |
| **Week 3** | Nov 11 - Nov 17 | Dev environment, Backend API framework    | API skeleton                       |                            |
| **Week 4** | Nov 18 - Nov 24 | Database setup, Satellite API integration | Satellite image retrieval working  |                            |
| **Week 5** | Nov 25 - Dec 1  | Authentication, CI/CD pipeline            | Auth working, automated deployment | **M2.5: Foundation Ready** |

#### Phase 4: AI/ML Development (Critical Path)

| **Week**   | **Dates**       | **Tasks**                                              | **Deliverables**            | **Milestone**           |
| ---------- | --------------- | ------------------------------------------------------ | --------------------------- | ----------------------- |
| **Week 5** | Nov 25 - Dec 1  | Dataset acquisition, U-Net development                 | Model architecture          |                         |
| **Week 6** | Dec 2 - Dec 8   | Model training (boundary detection)                    | Training logs, checkpoints  |                         |
| **Week 7** | Dec 9 - Dec 15  | Model optimization, Vegetation indices calculator      | Optimized model             |                         |
| **Week 8** | Dec 16 - Dec 22 | Yield prediction model, Disaster detection, Validation | All models validated (≥85%) | **M3: AI Models Ready** |

#### Phase 5: Frontend Development

| **Week**    | **Dates**       | **Tasks**                                        | **Deliverables**        | **Milestone**            |
| ----------- | --------------- | ------------------------------------------------ | ----------------------- | ------------------------ |
| **Week 9**  | Dec 23 - Dec 29 | React setup, Auth UI, Map interface (Part 1)     | Login/signup working    |                          |
| **Week 10** | Dec 30 - Jan 5  | Map interface (Part 2), Field selection          | Field boundary display  |                          |
| **Week 11** | Jan 6 - Jan 12  | Dashboard, Recommendations, Weather, Admin panel | Full web app functional | **M4: Web App Complete** |

#### Phase 6: Mobile App Development

| **Week**    | **Dates**       | **Tasks**                                      | **Deliverables**                | **Milestone**           |
| ----------- | --------------- | ---------------------------------------------- | ------------------------------- | ----------------------- |
| **Week 12** | Jan 13 - Jan 19 | React Native setup, Auth screens, Map view     | Mobile app skeleton             |                         |
| **Week 13** | Jan 20 - Jan 26 | Dashboard screens, Push notifications, Testing | Mobile app beta (Android + iOS) | **M5: Mobile App Beta** |

#### Phase 7: Integration & Testing

| **Week**    | **Dates**      | **Tasks**                                                         | **Deliverables**        | **Milestone**            |
| ----------- | -------------- | ----------------------------------------------------------------- | ----------------------- | ------------------------ |
| **Week 14** | Jan 27 - Feb 2 | API integration testing, Unit testing (80% coverage)              | Test reports            |                          |
| **Week 15** | Feb 3 - Feb 9  | UAT (10 farmers), Performance testing, Security audit, Bug fixing | UAT feedback, bug fixes | **M6: Testing Complete** |

#### Phase 8: Deployment & Documentation

| **Week**    | **Dates**       | **Tasks**                                              | **Deliverables**  | **Milestone**          |
| ----------- | --------------- | ------------------------------------------------------ | ----------------- | ---------------------- |
| **Week 16** | Feb 10 - Feb 16 | Production deployment, App store submission            | Live system       |                        |
| **Week 16** | Feb 17 - Feb 23 | User documentation, Technical docs, Final presentation | All documentation |                        |
| **Week 16** | Feb 24 - Feb 28 | Farmer onboarding (50 farmers), Project handover       | 50+ active users  | **M7: Project Launch** |

### 3.4 Milestones & Gates

| **Milestone**              | **Date**     | **Deliverable**                 | **Success Criteria**           | **Go/No-Go Decision**  |
| -------------------------- | ------------ | ------------------------------- | ------------------------------ | ---------------------- |
| **M1: Project Kickoff**    | Nov 10, 2025 | Project Charter approved        | Sponsor signature              | Proceed to design      |
| **M2: Design Complete**    | Nov 24, 2025 | Architecture + Mockups          | Technical review passed        | Proceed to development |
| **M2.5: Foundation Ready** | Dec 1, 2025  | Backend + Satellite API working | Successful image retrieval     | Proceed to AI training |
| **M3: AI Models Ready**    | Dec 22, 2025 | Trained models (≥85% accuracy)  | Validation metrics met         | Proceed to frontend    |
| **M4: Web App Complete**   | Jan 12, 2026 | Functional website              | 10 farmers tested successfully | Proceed to mobile      |
| **M5: Mobile App Beta**    | Jan 26, 2026 | Beta iOS + Android app          | App store ready                | Proceed to testing     |
| **M6: Testing Complete**   | Feb 9, 2026  | QA complete, bugs fixed         | <5 P1 bugs remaining           | Proceed to deployment  |
| **M7: Project Launch**     | Feb 28, 2026 | Production deployment           | 50+ farmers onboarded          | Project complete       |

**Gate Criteria (Go/No-Go):**

**After M2 (Design):**

- ✅ GO if architecture peer-reviewed and approved
- 🔴 NO-GO if major design flaws identified → Re-design (1-week delay)

**After M3 (AI Models):**

- ✅ GO if accuracy ≥85% on validation set
- 🟡 CONDITIONAL GO if accuracy 80-85% → Implement manual verification fallback
- 🔴 NO-GO if accuracy <80% → Allocate 2-week buffer for retraining

**After M6 (Testing):**

- ✅ GO if <5 P1 (critical) bugs
- 🟡 CONDITIONAL GO if 5-10 P1 bugs → 1-week extension for bug fixes
- 🔴 NO-GO if >10 P1 bugs → 2-week extension, reduce scope

### 3.5 Critical Path Analysis

**Critical Path (Longest Dependency Chain):**

```
Project Start (Day 0)
  → Requirements Complete (Day 14)
  → Architecture Design (Day 28)
  → Satellite API Integration (Day 35)
  → AI Model Training (Day 56) *** CRITICAL NODE ***
  → Frontend Map Integration (Day 77)
  → Mobile App Development (Day 91)
  → UAT & Bug Fixing (Day 105)
  → Deployment (Day 112)
Project End
```

**Critical Path Duration:** 112 days (entire project duration)  
**Float/Slack:** 0 days (any delay on critical path delays project)

**Most Critical Tasks (On Critical Path):**

1. 🔴 **AI Model Training (Weeks 6-7):** 30 hours - Highest risk, technical complexity
2. 🔴 **Frontend Map Integration (Weeks 9-10):** 24 hours - Complex UI interactions
3. 🔴 **UAT & Bug Fixing (Week 15):** 16 hours - Dependent on farmer availability

**Mitigation for Critical Path Risks:**

- ✅ AI Training: Start early (Week 5), use pre-trained models, allocate 2-week buffer
- ✅ Map Integration: Prototype in Week 3 (during design phase)
- ✅ UAT: Recruit farmers by Week 10, schedule sessions in advance

### 3.6 Fast-Tracking & Crashing Opportunities

**Fast-Tracking (Parallel Work):**

- ✅ Infrastructure setup (Weeks 3-5) parallel to Design (Weeks 3-4)
- ✅ Frontend development (Weeks 9-11) overlap with AI model refinement
- ✅ Documentation (Week 16) concurrent with deployment

**Crashing (Add Resources to Compress Schedule):**

- 🟡 Hire freelancer for mobile app development (Weeks 12-13) → Save 1 week
- 🟡 Use UI component library (shadcn/ui) → Save 2-3 days in frontend
- 🟡 Parallel testing (automated + manual) → Save 1-2 days

**Time Saved Potential:** 1-2 weeks (if needed to recover from delays)

### 3.7 Schedule Baseline & Change Control

**Baseline Schedule:** Approved on October 28, 2025  
**Variance Threshold:** ±3 days per phase (±2% total project)

**Schedule Monitoring:**

- **Daily:** Update task status in project tracker (Trello/Jira)
- **Weekly:** Calculate Earned Value (EV) and Schedule Variance (SV)
- **Bi-Weekly:** Review Gantt chart, adjust resources if needed

**Schedule Change Approval:**

- <3 days delay: PM approval
- 3-7 days delay: PM + Sponsor approval
- > 7 days delay: CCB (Change Control Board) approval + scope reduction

**Schedule Performance Index (SPI) Target:** ≥0.95 (project on time or max 5% late)

---

## 4. RESOURCE MANAGEMENT

### 4.1 Team Structure

```
                    Project Sponsor
                    (University Supervisor)
                            │
                    ┌───────┴───────┐
                    │               │
            Project Manager    Business Analyst
            (You - Lead Dev)   (Partner/Advisor)
                    │
        ┌───────────┼───────────┐
        │           │           │
    Backend Dev  ML Engineer  Frontend Dev
    (You/Partner) (You/Partner) (You/Partner)
        │           │           │
        └───────────┴───────────┘
                    │
            ┌───────┴───────┐
        DevOps          QA Lead
     (You/Partner)   (You/Partner)
```

### 4.2 Roles & Responsibilities (RACI Matrix)

| **Activity**        | **PM** | **BA** | **Backend** | **ML**  | **Frontend** | **Mobile** | **QA** | **Sponsor** |
| ------------------- | ------ | ------ | ----------- | ------- | ------------ | ---------- | ------ | ----------- |
| Project Charter     | **R**  | **C**  | I           | I       | I            | I          | I      | **A**       |
| Requirements        | **A**  | **R**  | **C**       | C       | C            | C          | I      | I           |
| Architecture Design | **A**  | C      | **R**       | **C**   | **C**        | C          | I      | I           |
| Backend API         | C      | I      | **R/A**     | I       | C            | C          | I      | I           |
| AI Models           | C      | I      | C           | **R/A** | I            | I          | C      | I           |
| Frontend UI         | C      | C      | C           | I       | **R/A**      | I          | C      | I           |
| Mobile App          | C      | I      | C           | I       | C            | **R/A**    | C      | I           |
| Testing             | **A**  | C      | C           | C       | C            | C          | **R**  | I           |
| Deployment          | **A**  | I      | **R**       | I       | C            | C          | C      | I           |
| Documentation       | **A**  | **R**  | C           | C       | C            | C          | C      | I           |

**Legend:**

- **R** = Responsible (does the work)
- **A** = Accountable (final approval)
- **C** = Consulted (provides input)
- **I** = Informed (kept updated)

### 4.3 Resource Allocation

#### Human Resources

| **Role**           | **Name**    | **Allocation**   | **Weeks Active** | **Total Hours** | **Hourly Rate**    | **Cost**  |
| ------------------ | ----------- | ---------------- | ---------------- | --------------- | ------------------ | --------- |
| Project Manager    | [Your Name] | 25% (10 hrs/wk)  | 1-16 (16 weeks)  | 160             | Rs. 0 (student)    | Rs. 0     |
| Backend Developer  | [Your Name] | 50% (20 hrs/wk)  | 3-16 (14 weeks)  | 280             | Rs. 0 (student)    | Rs. 0     |
| ML Engineer        | [Your Name] | 75% (30 hrs/wk)  | 5-8 (4 weeks)    | 120             | Rs. 0 (student)    | Rs. 0     |
| Frontend Developer | [Partner]   | 100% (40 hrs/wk) | 9-11 (3 weeks)   | 120             | Rs. 0 (student)    | Rs. 0     |
| Mobile Developer   | [Partner]   | 100% (40 hrs/wk) | 12-13 (2 weeks)  | 80              | Rs. 0 (student)    | Rs. 0     |
| QA Lead            | [Your Name] | 50% (20 hrs/wk)  | 14-15 (2 weeks)  | 40              | Rs. 0 (student)    | Rs. 0     |
| Business Analyst   | [Advisor]   | 10% (4 hrs/wk)   | 1-16 (16 weeks)  | 64              | Rs. 0 (volunteer)  | Rs. 0     |
| Technical Advisor  | [Professor] | 5% (2 hrs/wk)    | 1-16 (16 weeks)  | 32              | Rs. 0 (university) | Rs. 0     |
| **TOTAL**          |             |                  |                  | **876 hrs**     |                    | **Rs. 0** |

**Note:** Total hours exceed 640 due to overlapping roles (PM = Backend Dev = ML Engineer = QA)

#### Physical Resources

| **Resource**                 | **Quantity** | **Duration** | **Cost**    | **Purpose**       |
| ---------------------------- | ------------ | ------------ | ----------- | ----------------- |
| Laptop (Development)         | 1-2          | 16 weeks     | Rs. 0 (own) | Coding, testing   |
| GPU (Cloud - AWS p3.2xlarge) | 1            | 40 hours     | Rs. 20,000  | AI model training |
| Smartphone (Android)         | 1            | 16 weeks     | Rs. 0 (own) | Mobile testing    |
| Smartphone (iOS)             | 1 (borrowed) | 2 weeks      | Rs. 0       | iOS testing       |
| Internet                     | Unlimited    | 16 weeks     | Rs. 8,000   | Development, APIs |

#### Software/Tools

| **Tool**          | **Purpose**        | **License**        | **Cost**         | **Duration** |
| ----------------- | ------------------ | ------------------ | ---------------- | ------------ |
| VS Code           | Code editor        | Free (MIT)         | Rs. 0            | 16 weeks     |
| GitHub            | Version control    | Free (public repo) | Rs. 0            | 16 weeks     |
| Figma             | UI/UX design       | Free (student)     | Rs. 0            | Weeks 3-4    |
| Postman           | API testing        | Free               | Rs. 0            | Weeks 5-16   |
| AWS/Railway       | Cloud hosting      | Free tier + paid   | Rs. 96,000/year  | Year 1       |
| Sentinel Hub      | Satellite API      | Academic (free)    | Rs. 0            | 16 weeks     |
| Firebase          | Push notifications | Free tier          | Rs. 0            | Weeks 12-16  |
| Google Play Store | App distribution   | One-time           | Rs. 7,500 ($25)  | Week 16      |
| Apple App Store   | App distribution   | Annual             | Rs. 29,700 ($99) | Week 16      |

### 4.4 Resource Leveling

**Challenge:** ML Engineer role requires 75% allocation (30 hrs/week) during Weeks 5-8, but same person is PM (10 hrs/week) = 40 hrs/week.

**Leveling Strategy:**

- Reduce PM duties during Weeks 5-8 (delegate stakeholder meetings to BA)
- Automate progress tracking (GitHub project board)
- Focus 100% on AI model training during critical phase

**Resource Histogram:**

```
Hours/Week
40 │                     ████████
35 │                 ████████████
30 │             ████████████████████
25 │         ████████████████████████
20 │     ████████████████████████████████
15 │ ████████████████████████████████████████
10 │ ████████████████████████████████████████
 5 │ ████████████████████████████████████████
 0 └─────────────────────────────────────────
    W1 W2 W3 W4 W5 W6 W7 W8 W9 W10W11W12W13W14W15W16
```

**Peak Workload:** Weeks 5-8 (40 hrs/week) - AI model training  
**Average Workload:** 40 hrs/week (full-time academic project)

### 4.5 Training & Skill Development Plan

| **Skill Gap**        | **Required By** | **Training Method**      | **Duration**           | **Cost**  |
| -------------------- | --------------- | ------------------------ | ---------------------- | --------- |
| React Native         | Week 12         | Udemy course + docs      | 20 hours (Weeks 10-11) | Rs. 3,000 |
| TensorFlow/Keras     | Week 5          | Official tutorials       | 15 hours (Weeks 3-4)   | Rs. 0     |
| GIS (GDAL, Rasterio) | Week 5          | Documentation + examples | 10 hours (Week 4)      | Rs. 0     |
| AWS Deployment       | Week 16         | AWS tutorials, practice  | 8 hours (Week 15)      | Rs. 0     |
| U-Net Architecture   | Week 5          | Research papers, GitHub  | 6 hours (Week 4)       | Rs. 0     |

**Total Training Investment:** 59 hours (~10% of project time) + Rs. 3,000

**Training Schedule:**

- **Weeks 1-2:** General planning, no intensive training
- **Weeks 3-4:** TensorFlow, GIS, U-Net (parallel to design phase)
- **Weeks 10-11:** React Native (before mobile development)
- **Week 15:** AWS deployment (before production launch)

---

## 5. BUDGET & COST MANAGEMENT

### 5.1 Budget Summary

| **Category**          | **Year 1 (Development)** | **Year 1 (Operational)** | **Total Year 1** |
| --------------------- | ------------------------ | ------------------------ | ---------------- |
| **Development Costs** | Rs. 46,200               | -                        | Rs. 46,200       |
| **Operational Costs** | -                        | Rs. 277,000              | Rs. 277,000      |
| **Training**          | Rs. 3,000                | -                        | Rs. 3,000        |
| **Contingency (10%)** | Rs. 4,920                | Rs. 27,700               | Rs. 32,620       |
| **TOTAL**             | **Rs. 54,120**           | **Rs. 304,700**          | **Rs. 358,820**  |

**Rounded Total Budget:** Rs. 365,000

### 5.2 Detailed Cost Breakdown

#### Development Costs (One-Time, Weeks 1-16)

| **Item**                | **Description** | **Quantity** | **Unit Cost**  | **Total**         | **Timing** |
| ----------------------- | --------------- | ------------ | -------------- | ----------------- | ---------- |
| **Domain & Hosting**    |
| Domain name             | skycrop.com     | 1            | Rs. 4,000/year | Rs. 4,000         | Week 3     |
| SSL certificate         | Let's Encrypt   | 1            | Rs. 0 (free)   | Rs. 0             | Week 3     |
| **App Distribution**    |
| Google Play Developer   | One-time fee    | 1            | Rs. 7,500      | Rs. 7,500         | Week 16    |
| Apple Developer Program | Annual fee      | 1            | Rs. 29,700     | Rs. 29,700        | Week 16    |
| **Training**            |
| React Native course     | Udemy           | 1            | Rs. 3,000      | Rs. 3,000         | Week 10    |
| **Hardware**            |
| GPU Training (AWS)      | p3.2xlarge      | 40 hours     | Rs. 300/hr     | Rs. 0 (free tier) | Weeks 6-7  |
| **Contingency**         | 10% buffer      | -            | -              | Rs. 4,920         | As needed  |
| **SUBTOTAL**            |                 |              |                | **Rs. 54,120**    |            |

#### Operational Costs (Year 1, Post-Launch)

| **Category**                  | **Monthly**       | **Annual**      | **Notes**                     |
| ----------------------------- | ----------------- | --------------- | ----------------------------- |
| **Cloud Infrastructure**      |
| AWS EC2 (t3.medium)           | Rs. 8,000         | Rs. 96,000      | Backend hosting               |
| AWS S3 (Storage)              | Rs. 2,000         | Rs. 24,000      | Satellite images (~5GB/month) |
| AWS RDS (PostgreSQL)          | Rs. 3,000         | Rs. 36,000      | Database hosting              |
| MongoDB Atlas                 | Rs. 0 (free tier) | Rs. 0           | Document storage              |
| AWS CloudFront (CDN)          | Rs. 1,500         | Rs. 18,000      | Image delivery                |
| **APIs & Services**           |
| Sentinel Hub                  | Rs. 0 (academic)  | Rs. 0           | Satellite imagery             |
| OpenWeatherMap                | Rs. 0 (free tier) | Rs. 0           | Weather forecasts             |
| Firebase                      | Rs. 0 (free tier) | Rs. 0           | Push notifications            |
| **Monitoring & Tools**        |
| Sentry (Error tracking)       | Rs. 0 (free tier) | Rs. 0           | Bug monitoring                |
| UptimeRobot                   | Rs. 0 (free)      | Rs. 0           | Uptime monitoring             |
| Google Analytics              | Rs. 0 (free)      | Rs. 0           | User analytics                |
| **Support**                   |
| WhatsApp helpline (part-time) | Rs. 5,000         | Rs. 60,000      | 2 hours/day                   |
| **Marketing**                 |
| Social media ads              | Rs. 3,000         | Rs. 36,000      | Facebook/WhatsApp             |
| **Backup & Security**         |
| Automated backups             | Rs. 1,000         | Rs. 12,000      | Daily backups                 |
| **Domain Renewal**            | Rs. 417           | Rs. 5,000       | Annual                        |
| **Contingency (10%)**         | Rs. 2,308         | Rs. 27,700      | Buffer                        |
| **SUBTOTAL**                  | **Rs. 25,392**    | **Rs. 304,700** |                               |

**Total Year 1 Budget:** Rs. 54,120 (dev) + Rs. 304,700 (ops) = **Rs. 358,820**

### 5.3 Budget Allocation by Phase

| **Phase**               | **Budget**     | **% of Total** | **Key Expenses**                    |
| ----------------------- | -------------- | -------------- | ----------------------------------- |
| Phase 1: Planning       | Rs. 0          | 0%             | (Labor only)                        |
| Phase 2: Design         | Rs. 0          | 0%             | (Labor only)                        |
| Phase 3: Infrastructure | Rs. 4,000      | 7%             | Domain, SSL setup                   |
| Phase 4: AI/ML          | Rs. 12,000     | 22%            | GPU training (if needed), datasets  |
| Phase 5: Frontend       | Rs. 0          | 0%             | (Labor only)                        |
| Phase 6: Mobile         | Rs. 40,200     | 74%            | App store fees, React Native course |
| Phase 7: Testing        | Rs. 0          | 0%             | (Labor only)                        |
| Phase 8: Deployment     | Rs. 0          | 0%             | (Included in infrastructure)        |
| Contingency             | Rs. 4,920      | 9%             | Unexpected costs                    |
| **Development Total**   | **Rs. 54,120** | **100%**       |                                     |

### 5.4 Funding Sources

| **Source**                    | **Amount**      | **Status** | **Conditions**            | **Timing** |
| ----------------------------- | --------------- | ---------- | ------------------------- | ---------- |
| **University Research Grant** | Rs. 200,000     | Applied    | Project approval required | Month 1    |
| **Startup Competition Prize** | Rs. 100,000     | Eligible   | Submit proposal by Nov 15 | Month 2    |
| **Personal Savings**          | Rs. 65,000      | Committed  | No conditions             | Month 1    |
| **TOTAL FUNDING**             | **Rs. 365,000** |            |                           |            |

**Funding Risk:** Medium  
**Mitigation:** If university grant rejected, reduce operational costs (use free-tier hosting only, delay marketing)

### 5.5 Cost Management Plan

**Cost Monitoring:**

- **Weekly:** Track actual vs. budgeted expenses in spreadsheet
- **Monthly:** Calculate Cost Performance Index (CPI) = EV / AC
- **Threshold:** CPI ≥ 0.95 (within 5% of budget)

**Cost Variance Reporting:**
| **Variance** | **Action** |
|-------------|-----------|
| < 5% over budget | PM approval, reallocate from contingency |
| 5-10% over budget | PM + Sponsor approval, reduce scope or extend funding |
| > 10% over budget | CCB approval, major scope reduction required |

**Cost Optimization Strategies:**

1. ✅ Use free tiers aggressively (AWS, Firebase, APIs)
2. ✅ Reserved instances for predictable workloads (save 30-40%)
3. ✅ Optimize queries to reduce database costs
4. ✅ Image compression to reduce storage costs
5. ✅ Spot instances for AI training (save 70%)

**Earned Value Management (EVM):**

- **Planned Value (PV):** Rs. 54,120 over 16 weeks = Rs. 3,383/week
- **Earned Value (EV):** Actual work completed (measured weekly)
- **Actual Cost (AC):** Actual expenses incurred
- **CPI Target:** ≥ 0.95 (on budget or 5% under)
- **SPI Target:** ≥ 0.95 (on schedule or 5% ahead)

---

## 6. QUALITY MANAGEMENT

### 6.1 Quality Policy

**SkyCrop Quality Statement:** "We deliver accurate, reliable, and user-friendly agricultural technology that meets or exceeds farmer needs and academic standards."

**Quality Objectives:**

1. **Accuracy:** AI models ≥85% accuracy, vegetation indices ≥90% correlation with ground truth
2. **Reliability:** System uptime ≥99%, API response time <3 seconds
3. **Usability:** User satisfaction ≥4.0/5.0, task success rate ≥80%
4. **Maintainability:** Code coverage ≥80%, documentation complete
5. **Security:** No P1 security vulnerabilities at launch

### 6.2 Quality Standards

**Applicable Standards:**

- **ISO/IEC 25010:** Software Quality Model (functionality, usability, reliability)
- **WCAG 2.1 Level AA:** Web accessibility guidelines
- **OWASP Top 10:** Security best practices
- **IEEE 829:** Software Test Documentation
- **Agile Best Practices:** Scrum, TDD (Test-Driven Development)

### 6.3 Quality Metrics

| **Category**                 | **Metric**          | **Target**               | **Measurement Method** | **Frequency** |
| ---------------------------- | ------------------- | ------------------------ | ---------------------- | ------------- |
| **Code Quality**             |
| Code coverage                | ≥80%                | Jest, PyTest             | Every commit           |
| Linting errors               | 0                   | ESLint, Pylint           | Every commit           |
| Code complexity (cyclomatic) | <10 per function    | SonarQube                | Weekly                 |
| **Functional Quality**       |
| Feature completion           | 100% of MVP         | Manual checklist         | Weekly                 |
| Defect density               | <5 defects per KLOC | Bug tracker              | Weekly                 |
| Test pass rate               | ≥95%                | Test results             | Daily                  |
| **Performance Quality**      |
| API response time (p95)      | <3 seconds          | New Relic, JMeter        | Daily                  |
| Page load time (3G)          | <5 seconds          | Lighthouse               | Weekly                 |
| Mobile app crash rate        | <2%                 | Firebase Crashlytics     | Daily                  |
| **User Experience**          |
| Task success rate            | ≥80%                | UAT observations         | Week 15                |
| User satisfaction (NPS)      | ≥4.0/5.0            | Survey                   | Week 15                |
| Feature adoption             | ≥70%                | Google Analytics         | Month 2                |
| **Accuracy**                 |
| AI boundary detection (IoU)  | ≥0.85               | Validation dataset       | Week 8                 |
| Yield prediction (MAPE)      | <15%                | Actual harvest data      | Month 6                |
| NDVI correlation             | ≥0.90               | Ground truth (10 fields) | Week 10                |

### 6.4 Quality Assurance Activities

#### Phase-by-Phase QA

| **Phase**               | **QA Activities**                                                         | **Deliverables**               | **Owner** |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------ | --------- |
| **Planning (W1-2)**     | Requirements review, Acceptance criteria definition                       | Requirements doc approved      | BA        |
| **Design (W3-4)**       | Architecture review, Design walkthrough                                   | Design review report           | Tech Lead |
| **Development (W5-13)** | Code reviews (every PR), Unit testing (80% coverage), Integration testing | Test reports, Code review logs | Dev Team  |
| **Testing (W14-15)**    | System testing, UAT, Performance testing, Security audit                  | QA sign-off report             | QA Lead   |
| **Deployment (W16)**    | Smoke testing, Deployment verification                                    | Deployment checklist           | DevOps    |

#### Code Review Process

**Mandatory for All Code:**

1. Developer creates Pull Request (PR) on GitHub
2. Automated checks run (linting, tests, coverage)
3. Peer review (1 approver required)
4. Review checklist:
   - ✅ Code follows style guide (Airbnb JavaScript, PEP 8 Python)
   - ✅ Unit tests included (coverage ≥80%)
   - ✅ No hardcoded credentials or secrets
   - ✅ Functions documented (JSDoc, docstrings)
   - ✅ Performance optimized (no N+1 queries)
5. Approval → Merge to main branch
6. CI/CD pipeline deploys to staging

**Review Turnaround Time:** <24 hours

### 6.5 Testing Strategy

#### Testing Levels

| **Test Level**          | **Scope**                       | **Coverage**     | **Tools**                  | **When**          |
| ----------------------- | ------------------------------- | ---------------- | -------------------------- | ----------------- |
| **Unit Testing**        | Individual functions/components | ≥80%             | Jest (JS), PyTest (Python) | Every commit      |
| **Integration Testing** | API endpoints, DB connections   | 100% of APIs     | Supertest, Postman         | After each sprint |
| **System Testing**      | End-to-end workflows            | All user stories | Manual + Selenium          | Week 14           |
| **UAT**                 | Real farmer scenarios           | Core features    | Manual (10 farmers)        | Week 15           |
| **Performance Testing** | Load, stress, scalability       | API endpoints    | Apache JMeter, Lighthouse  | Week 15           |
| **Security Testing**    | Vulnerabilities, auth           | OWASP Top 10     | OWASP ZAP, manual          | Week 15           |

#### Test Cases (Sample)

**Test Case ID:** TC-001  
**Feature:** User Authentication  
**Scenario:** User signs up with Google OAuth  
**Preconditions:** User has Google account  
**Steps:**

1. Navigate to signup page
2. Click "Sign up with Google"
3. Select Google account
4. Grant permissions
   **Expected Result:** User redirected to dashboard, session created  
   **Actual Result:** (To be filled during testing)  
   **Status:** Pass / Fail  
   **Priority:** P1 (Critical)

**Test Case ID:** TC-015  
**Feature:** AI Boundary Detection  
**Scenario:** User taps field location, boundary auto-detected  
**Preconditions:** User logged in, on map page  
**Steps:**

1. Tap field center on map
2. Wait for AI processing (max 60s)
   **Expected Result:** Polygon boundary displayed, area calculated (±5% of actual)  
   **Actual Result:** (To be filled)  
   **Status:** Pass / Fail  
   **Priority:** P1 (Critical)

**Total Test Cases:** 120 (estimated)  
**P1 (Critical):** 40, **P2 (High):** 50, **P3 (Medium):** 30

### 6.6 Quality Control Procedures

**Defect Management:**

| **Severity**      | **Definition**                           | **Response Time** | **Resolution Time** |
| ----------------- | ---------------------------------------- | ----------------- | ------------------- |
| **P1 (Critical)** | System crash, data loss, security breach | <4 hours          | <24 hours           |
| **P2 (High)**     | Major feature broken, workaround exists  | <24 hours         | <72 hours           |
| **P3 (Medium)**   | Minor bug, cosmetic issue                | <72 hours         | <1 week             |
| **P4 (Low)**      | Enhancement, nice-to-have                | <1 week           | Backlog             |

**Defect Workflow:**

1. **Reported:** User/tester logs bug in GitHub Issues
2. **Triaged:** QA Lead assigns severity, priority, owner
3. **In Progress:** Developer fixes bug, writes test case
4. **Code Review:** Peer reviews fix
5. **Testing:** QA verifies fix in staging
6. **Closed:** Deployed to production, bug closed

**Bug Fix Verification:** Every bug fix must include a regression test to prevent reoccurrence.

### 6.7 Continuous Improvement

**Retrospectives:**

- **Frequency:** Bi-weekly (end of each 2-week sprint)
- **Duration:** 1 hour
- **Format:** What went well? What didn't? Action items?
- **Output:** Improvement backlog (process changes, tooling upgrades)

**Quality Audits:**

- **Week 8:** Mid-project quality audit (code review, test coverage check)
- **Week 15:** Pre-launch quality gate (security audit, performance review)
- **Month 3:** Post-launch review (user feedback, bug analysis)

**Lessons Learned:**

- Document in project wiki (GitHub)
- Share with university for future projects
- Publish as blog post or conference paper

---

## 7. RISK MANAGEMENT

### 7.1 Risk Management Approach

**Risk Management Process:**

1. **Identify:** Brainstorm risks (weekly team meetings)
2. **Assess:** Calculate probability × impact score
3. **Plan:** Develop mitigation and contingency plans
4. **Monitor:** Track risk indicators (weekly dashboard)
5. **Control:** Execute mitigation, escalate if needed

**Risk Appetite:** MODERATE-HIGH (academic project, innovation-focused)

### 7.2 Risk Register

| **ID** | **Risk**                         | **Category** | **Prob** | **Impact**   | **Score** | **Mitigation**                           | **Contingency**              | **Owner**    | **Status** |
| ------ | -------------------------------- | ------------ | -------- | ------------ | --------- | ---------------------------------------- | ---------------------------- | ------------ | ---------- | -------------- |
| R-01   | AI model accuracy <85%           | Technical    | 30%      | High (4)     | 🟡 1.2    | Use pre-trained models, 2-week buffer    | Manual verification fallback | ML Engineer  | Open       |
| R-02   | Satellite API rate limits        | Technical    | 30%      | Medium (3)   | 🟡 0.9    | Caching, request optimization            | Google Earth Engine backup   | Backend Dev  | Open       |
| R-03   | Timeline delays                  | Schedule     | 40%      | Medium (3)   | 🟡 1.2    | Agile sprints, MVP focus                 | Reduce scope, extend 2 weeks | PM           | Open       |
| R-04   | Low farmer adoption              | Market       | 40%      | High (4)     | 🔴 1.6    | Free pilot, training, partnerships       | Pivot to B2B model           | PM           | Open       |
| R-05   | Cloud costs exceed budget        | Financial    | 35%      | Medium (3)   | 🟡 1.05   | Optimize queries, reserved instances     | Downgrade hosting tier       | DevOps       | Open       | # PROJECT PLAN |
| R-06   | Data privacy breach              | Legal        | 10%      | Critical (5) | 🔴 0.5    | Encryption, security audits              | Insurance, legal support     | Security     | Open       |
| R-07   | Poor internet in rural areas     | Operational  | 60%      | Medium (3)   | 🟡 1.8    | Offline mode, low-bandwidth optimization | SMS fallback                 | Frontend Dev | Open       |
| R-08   | Team member unavailability       | Resource     | 15%      | High (4)     | 🟡 0.6    | Cross-training, documentation            | Hire freelancer              | PM           | Open       |
| R-09   | Farmer trust issues              | Social       | 50%      | High (4)     | 🔴 2.0    | Demonstrations, testimonials             | Money-back guarantee         | PM           | Open       |
| R-10   | University ethics approval delay | Legal        | 20%      | Medium (3)   | 🟡 0.6    | Early application (Week 1)               | Proceed as "user research"   | PM           | Open       |

**Risk Score = Probability × Impact (1-5 scale)**  
**Color Code:** 🔴 High (≥1.5), 🟡 Medium (0.5-1.49), 🟢 Low (<0.5)

### 7.3 Risk Response Strategies

**High-Priority Risks (Score ≥1.5):**

**R-04: Low Farmer Adoption (Score: 1.6)**

- **Strategy:** MITIGATE
- **Actions:**
  1. Partner with Dept. of Agriculture (Week 2) - credibility boost
  2. Recruit 5 "champion farmers" as advocates (Month 2)
  3. Conduct 3 demonstration field days (Months 2-3)
  4. Free tier permanently (no cost barrier)
  5. Intensive 3-hour training for each cohort
  6. WhatsApp support group (farmers help each other)
- **KPI:** 80% of pilot farmers active after 3 months
- **Trigger:** If <50% active after Month 2 → Pivot to B2B (sell to agribusinesses)

**R-09: Farmer Trust Issues (Score: 2.0)**

- **Strategy:** MITIGATE
- **Actions:**
  1. University branding on all materials (academic credibility)
  2. Side-by-side accuracy demos (satellite vs. ground truth)
  3. Video testimonials from early adopters (Week 10+)
  4. Extension officer endorsements (leverage trusted intermediaries)
  5. Transparency about limitations (set realistic expectations)
  6. "How it works" explainer video (2 minutes, simple language)
- **KPI:** <20% drop-off rate after first month
- **Trigger:** If >30% drop-off → Offer 100% money-back guarantee (Year 2)

**R-07: Poor Internet Connectivity (Score: 1.8)**

- **Strategy:** MITIGATE
- **Actions:**
  1. Optimize all images (WebP format, lazy loading)
  2. Progressive Web App (PWA) for offline caching (30 days data)
  3. Backend data compression (gzip)
  4. Test on 2G/3G networks throughout development
  5. Reduce API payload size (send only necessary data)
- **KPI:** App usable on 3G with <10-second load times
- **Trigger:** If >40% users report slow loading → Develop SMS alert system

### 7.4 Risk Monitoring Plan

**Weekly Risk Review (Fridays, 15 minutes):**

- Review risk dashboard (Excel/Notion)
- Update risk status (probability, impact, score)
- Check trigger indicators
- Escalate high-priority risks to sponsor

**Risk Dashboard (Sample):**

```
Week 5 Risk Status:
─────────────────────────────────────────
R-01 (AI Accuracy): 🟢 ON TRACK
  - Model training started, early results promising
  - Mitigation: Using pre-trained ImageNet weights

R-04 (Adoption):    🟡 WATCH
  - 12 farmers recruited (target: 20 by Week 6)
  - Action: Accelerate outreach via extension officers

R-07 (Internet):   🟢 ON TRACK
  - PWA implemented, offline mode tested
  - 3G load time: 8 seconds (target: <10s)

R-09 (Trust):      🟡 WATCH
  - 2 farmers expressed skepticism about technology
  - Action: Schedule demo session for Week 7
─────────────────────────────────────────
Overall Risk Health: 🟢 HEALTHY
```

**Risk Escalation:**

- 🟢 Low risk: PM monitors, no escalation
- 🟡 Medium risk: PM + Team discuss in weekly meeting
- 🔴 High risk: PM escalates to Sponsor immediately

### 7.5 Issue Management

**Issue vs. Risk:**

- **Risk:** Potential future problem (might happen)
- **Issue:** Current problem (already happened)

**Issue Log (Sample):**

| **ID** | **Issue**                             | **Raised** | **Impact** | **Owner**   | **Status** | **Resolution**                         |
| ------ | ------------------------------------- | ---------- | ---------- | ----------- | ---------- | -------------------------------------- |
| I-001  | Sentinel Hub API key approval delayed | Week 2     | High       | Backend Dev | Closed     | Applied earlier, approved Week 3       |
| I-002  | React Native build fails on iOS       | Week 12    | Medium     | Mobile Dev  | Open       | Investigating Xcode version mismatch   |
| I-003  | 3 farmers dropped out of pilot        | Week 8     | Low        | PM          | Closed     | Recruited 4 replacements from waitlist |

**Issue Resolution Workflow:**

1. **Log:** Record issue in tracker (GitHub Issues/Jira)
2. **Assess:** Determine impact, urgency
3. **Assign:** Allocate owner, set deadline
4. **Resolve:** Implement solution
5. **Close:** Verify resolution, document lessons learned

---

## 8. COMMUNICATION MANAGEMENT

### 8.1 Communication Objectives

1. Keep stakeholders informed of project progress
2. Facilitate collaboration among team members
3. Manage expectations and address concerns
4. Document decisions and changes
5. Build trust and transparency

### 8.2 Stakeholder Communication Matrix

| **Stakeholder**                  | **Information Needs**              | **Communication Method**      | **Frequency**         | **Owner** |
| -------------------------------- | ---------------------------------- | ----------------------------- | --------------------- | --------- |
| **Project Sponsor (Supervisor)** | Progress, risks, milestones        | Email status report + Meeting | Bi-weekly (Tuesdays)  | PM        |
| **Business Analyst**             | Requirements, user feedback        | Slack + Weekly sync           | Weekly (Fridays)      | PM        |
| **Development Team**             | Tasks, blockers, decisions         | Daily standup (Slack)         | Daily (9 AM)          | PM        |
| **Technical Advisor**            | Design reviews, AI guidance        | Video call                    | Bi-weekly (as needed) | PM        |
| **Farmers (Pilot Users)**        | Feature updates, training          | WhatsApp group                | Monthly               | BA        |
| **Dept. of Agriculture**         | Partnership progress, data sharing | Email + Quarterly meeting     | Quarterly             | PM        |
| **University (General)**         | Project showcase, publications     | Email updates                 | Monthly               | PM        |

### 8.3 Communication Channels & Tools

| **Tool**              | **Purpose**                           | **Users**        | **Usage Guidelines**                          |
| --------------------- | ------------------------------------- | ---------------- | --------------------------------------------- |
| **Slack**             | Team chat, quick questions            | Dev team, PM, BA | Response time: <2 hours during work hours     |
| **Email**             | Formal communications, status reports | All stakeholders | Professional tone, clear subject lines        |
| **Zoom/Google Meet**  | Meetings, design reviews              | All              | Record important meetings, share notes        |
| **WhatsApp**          | Farmer support, pilot group           | Farmers, PM, BA  | Informal, local language OK, response <24 hrs |
| **GitHub**            | Code, issues, documentation           | Dev team         | All code reviews, issues tracked here         |
| **Notion/Confluence** | Project wiki, documentation           | All              | Single source of truth for project info       |
| **Google Drive**      | Shared documents, reports             | All              | Organized folder structure, version control   |
| **Trello/Jira**       | Task tracking, sprint planning        | Dev team, PM     | Update task status daily                      |

### 8.4 Meetings Schedule

#### Standing Meetings

| **Meeting**                   | **Purpose**                | **Attendees**    | **Frequency** | **Duration** | **Day/Time**                 |
| ----------------------------- | -------------------------- | ---------------- | ------------- | ------------ | ---------------------------- |
| **Daily Standup**             | Sync on progress, blockers | Dev team, PM     | Daily         | 15 min       | 9:00 AM (Slack async)        |
| **Weekly Team Sync**          | Sprint planning, review    | Dev team, PM, BA | Weekly        | 1 hour       | Fridays 2:00 PM              |
| **Bi-weekly Sponsor Meeting** | Status update, decisions   | PM, Sponsor      | Bi-weekly     | 30 min       | Tuesdays 10:00 AM            |
| **Sprint Retrospective**      | Process improvement        | Dev team, PM     | Bi-weekly     | 1 hour       | Fridays 3:00 PM (after sync) |
| **Risk Review**               | Risk monitoring            | PM, Team leads   | Weekly        | 15 min       | Fridays 1:45 PM              |

**Meeting Norms:**

- ✅ Agenda sent 24 hours in advance
- ✅ Starts/ends on time (no more than 5 min late)
- ✅ Notes documented and shared within 24 hours
- ✅ Action items assigned with owners and deadlines
- ✅ Video on for face-to-face meetings (builds rapport)

#### Ad-Hoc Meetings

- **Design Reviews:** As needed (Weeks 3-4, Week 9)
- **UAT Sessions:** Week 15 (scheduled with farmers)
- **Crisis Meetings:** Immediate (if P1 issue or high risk materializes)

### 8.5 Status Reporting

#### Weekly Status Report (Email to Sponsor)

**Template:**

```
Subject: SkyCrop Weekly Status Report - Week [X]

Date: [Date]
Prepared by: [Your Name]
Period: [Start Date] - [End Date]

─────────────────────────────────────────
1. EXECUTIVE SUMMARY
Overall Status: 🟢 ON TRACK / 🟡 AT RISK / 🔴 OFF TRACK
Highlights: [2-3 key accomplishments this week]
Concerns: [1-2 issues or risks requiring attention]

─────────────────────────────────────────
2. ACCOMPLISHMENTS THIS WEEK
✅ [Task 1 completed]
✅ [Task 2 completed]
✅ [Task 3 completed]

─────────────────────────────────────────
3. PLANNED FOR NEXT WEEK
□ [Task 1 planned]
□ [Task 2 planned]
□ [Task 3 planned]

─────────────────────────────────────────
4. MILESTONES
- [Milestone 1]: ON TRACK for [Date]
- [Milestone 2]: AT RISK, mitigation: [Action]

─────────────────────────────────────────
5. METRICS
- Schedule Performance Index (SPI): [Value]
- Cost Performance Index (CPI): [Value]
- Code Coverage: [%]
- Farmers Recruited: [X / 50]

─────────────────────────────────────────
6. RISKS & ISSUES
Top 3 Risks:
1. [Risk ID]: [Description] - Status: [Mitigation in place]

Open Issues:
1. [Issue ID]: [Description] - Owner: [Name], ETA: [Date]

─────────────────────────────────────────
7. DECISIONS NEEDED
□ [Decision 1]: [Context], Need by: [Date]

─────────────────────────────────────────
8. SUPPORT NEEDED
[Any help needed from sponsor/stakeholders]

Next Report: [Next Week Date]
```

#### Monthly Progress Report (Detailed)

- **Audience:** Sponsor, University, Dept. of Agriculture
- **Length:** 3-5 pages
- **Contents:**
  - Executive summary (1 page)
  - Detailed progress by phase (1-2 pages)
  - Financial status (budget vs. actual)
  - Risk register update
  - Farmer feedback (qualitative)
  - Photos/screenshots of progress
  - Next month plan

### 8.6 Change Communication

**Change Request Communication Process:**

1. **Submission:** Requester fills change request form (Appendix A)
2. **Acknowledgment:** PM acknowledges receipt within 24 hours
3. **Assessment:** PM completes impact analysis (48 hours)
4. **Review:** CCB reviews in weekly meeting
5. **Decision:** PM communicates decision to requester (email + meeting if major)
6. **Implementation:** If approved, PM broadcasts change to all stakeholders (Slack + email)
7. **Documentation:** Change logged in change register, project plan updated

**Change Broadcast Template:**

```
Subject: [APPROVED] Change Request: [Title]

Team,

A change request has been approved:

Change: [Brief description]
Reason: [Why this change is needed]
Impact:
  - Scope: [Added/Removed features]
  - Schedule: [+/- X days]
  - Budget: [+/- Rs. X]
Effective: [Date]

Updated project plan attached.

Questions? Reply to this email or ping me on Slack.

Thanks,
[Your Name]
```

### 8.7 Crisis Communication Plan

**Crisis Definition:** Event that threatens project success (data breach, major delay, team member leaves, sponsor withdraws support)

**Crisis Communication Protocol:**

1. **Assess:** PM evaluates severity (15 minutes)
2. **Notify:**
   - Immediate: Sponsor (phone call)
   - Within 1 hour: Team (Slack)
   - Within 4 hours: Affected stakeholders (email)
3. **Convene:** Emergency meeting within 24 hours
4. **Action Plan:** Develop response plan (24-48 hours)
5. **Updates:** Daily updates until crisis resolved
6. **Post-Mortem:** Lessons learned session after resolution

**Crisis Communication Principles:**

- ✅ Be transparent (don't hide bad news)
- ✅ Focus on facts (avoid speculation)
- ✅ Present solutions (not just problems)
- ✅ Update frequently (silence breeds anxiety)

---

## 9. STAKEHOLDER MANAGEMENT

### 9.1 Stakeholder Register

| **Stakeholder**                  | **Role**       | **Interest** | **Influence** | **Support Level**    | **Strategy**                        |
| -------------------------------- | -------------- | ------------ | ------------- | -------------------- | ----------------------------------- |
| **Project Sponsor (Supervisor)** | Approver       | High         | High          | Supportive           | Manage Closely (weekly updates)     |
| **University Administration**    | Funder         | Medium       | High          | Neutral              | Keep Satisfied (monthly reports)    |
| **Dept. of Agriculture**         | Partner        | High         | Medium        | Supportive           | Manage Closely (quarterly meetings) |
| **Pilot Farmers**                | End Users      | High         | Low           | Neutral → Supportive | Keep Informed (monthly updates)     |
| **Development Team**             | Implementers   | High         | Medium        | Supportive           | Manage Closely (daily standups)     |
| **Technical Advisor**            | Advisor        | Medium       | Low           | Supportive           | Monitor (bi-weekly consults)        |
| **Extension Officers**           | Intermediaries | Medium       | Medium        | Neutral              | Keep Informed (training sessions)   |
| **Business Analyst**             | Requirements   | High         | Medium        | Supportive           | Manage Closely (weekly syncs)       |

**Support Level Legend:**

- Champion: Actively promotes project
- Supportive: Positive, willing to help
- Neutral: Aware, not engaged
- Resistant: Skeptical, may hinder
- Opponent: Actively opposes

### 9.2 Stakeholder Engagement Plan

#### High Power, High Interest (Manage Closely)

**Project Sponsor:**

- **Engagement Goal:** Maintain active support, ensure alignment
- **Tactics:**
  - Bi-weekly face-to-face meetings (30 min)
  - Involve in key decisions (milestone reviews)
  - Seek feedback on deliverables
  - Invite to demo sessions
- **Success Metric:** Sponsor satisfaction score ≥4.5/5.0

**Dept. of Agriculture:**

- **Engagement Goal:** Secure partnership MoU, farmer access
- **Tactics:**
  - Quarterly steering committee meetings
  - Co-branding on all materials
  - Data sharing agreements
  - Joint press releases (if successful)
- **Success Metric:** MoU signed by Month 2, 20+ farmer referrals

#### High Power, Low Interest (Keep Satisfied)

**University Administration:**

- **Engagement Goal:** Maintain funding, showcase success
- **Tactics:**
  - Monthly email updates (brief, highlights only)
  - Invitation to final presentation
  - Publication acknowledgments
  - Potential for university PR (news article)
- **Success Metric:** Continued funding approval

#### Low Power, High Interest (Keep Informed)

**Pilot Farmers:**

- **Engagement Goal:** High adoption, positive feedback
- **Tactics:**
  - Monthly WhatsApp updates (new features, tips)
  - Farmer field days (hands-on demos)
  - WhatsApp support group (peer learning)
  - Incentives (free access Year 1, certificates)
- **Success Metric:** 80% retention, 4.0/5.0 satisfaction

**Extension Officers:**

- **Engagement Goal:** Advocate for SkyCrop, train farmers
- **Tactics:**
  - 1-day training workshop (become "SkyCrop Ambassadors")
  - Recognition certificates
  - Dashboard for their farmers (aggregate analytics)
  - Monthly newsletter with tips
- **Success Metric:** 10+ officers trained, 5+ actively promoting

### 9.3 Stakeholder Influence & Power Grid

```
         High Influence
              │
   University │  Sponsor
     Admin    │  Dept. Agri
              │
──────────────┼──────────────
              │
   Extension  │  Farmers
   Officers   │  Dev Team
              │
         Low Influence
```

### 9.4 Expectation Management

**Common Stakeholder Expectations (and How to Manage):**

| **Stakeholder**          | **Expectation**                   | **Reality**                                | **Management Strategy**                                                    |
| ------------------------ | --------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| **Farmers**              | Perfect yield predictions         | 85% accuracy (±10-15%)                     | Set realistic expectations upfront, emphasize "estimates" not "guarantees" |
| **Sponsor**              | On-time, on-budget delivery       | Risks exist (AI training, farmer adoption) | Transparent risk communication, early warning of issues                    |
| **Dept. of Agriculture** | National-scale system immediately | Pilot first (100 farmers), then scale      | Phase roadmap, emphasize learning from pilot                               |
| **Dev Team**             | Reasonable workload               | 40 hrs/week (intense)                      | Respect work-life balance, no weekend work unless critical                 |

**Expectation Setting Techniques:**

1. ✅ **Underpromise, Overdeliver:** Set conservative targets, exceed them
2. ✅ **Regular Communication:** No surprises (bad news early)
3. ✅ **Demo Frequently:** Show working features (builds confidence)
4. ✅ **Document Assumptions:** Write down what's agreed (avoid misunderstandings)

---

## 10. PROCUREMENT MANAGEMENT

### 10.1 Procurement Strategy

**Build vs. Buy Decision:**

| **Component**     | **Decision**                        | **Rationale**                       |
| ----------------- | ----------------------------------- | ----------------------------------- |
| Backend API       | **BUILD**                           | Core IP, custom to our needs        |
| AI Models         | **BUILD** (fine-tune pre-trained)   | Specific to Sri Lankan paddy fields |
| Frontend UI       | **BUILD** (use component libraries) | Custom UX required                  |
| Mobile App        | **BUILD**                           | Core product                        |
| Satellite Imagery | **BUY** (Sentinel Hub API)          | Commodity service, free tier        |
| Weather Data      | **BUY** (OpenWeatherMap)            | Commodity service, free tier        |
| Authentication    | **BUY** (Firebase/OAuth)            | Standard service, secure            |
| Cloud Hosting     | **BUY** (AWS/Railway)               | Scalable infrastructure             |
| UI Components     | **USE** (Open Source - shadcn/ui)   | Saves development time              |

**Procurement Principle:** Buy commodity services, build differentiating features.

### 10.2 Vendor/Service Provider Selection

#### Satellite Imagery Provider

| **Criteria**        | **Weight** | **Sentinel Hub**    | **Google Earth Engine** | **Planet Labs**        |
| ------------------- | ---------- | ------------------- | ----------------------- | ---------------------- |
| **Cost**            | 30%        | 10 (free academic)  | 9 (free research)       | 2 (expensive)          |
| **Data Quality**    | 25%        | 9 (Sentinel-2, 10m) | 10 (multiple sources)   | 10 (3m resolution)     |
| **API Ease of Use** | 20%        | 9 (excellent docs)  | 7 (complex)             | 8 (good docs)          |
| **Reliability**     | 15%        | 10 (99.9% uptime)   | 9 (Google SLA)          | 9 (commercial SLA)     |
| **Support**         | 10%        | 7 (email only)      | 6 (forum)               | 10 (dedicated support) |
| **TOTAL SCORE**     | 100%       | **9.0**             | **8.3**                 | **6.7**                |

**Selected:** Sentinel Hub (Backup: Google Earth Engine)

#### Cloud Hosting Provider

| **Criteria**           | **Weight** | **AWS**              | **Railway**             | **Heroku**    | **DigitalOcean** |
| ---------------------- | ---------- | -------------------- | ----------------------- | ------------- | ---------------- |
| **Cost**               | 35%        | 8 (free tier 12 mo)  | 9 (generous free)       | 7 ($7/mo min) | 8 ($5/mo min)    |
| **Scalability**        | 25%        | 10 (industry leader) | 8 (good)                | 7 (limited)   | 8 (good)         |
| **Ease of Deployment** | 20%        | 6 (complex)          | 10 (GitHub auto-deploy) | 9 (simple)    | 7 (moderate)     |
| **Reliability**        | 15%        | 10 (99.99% SLA)      | 8 (no SLA guarantee)    | 9 (99.95%)    | 9 (99.99%)       |
| **Documentation**      | 5%         | 10 (excellent)       | 8 (good)                | 9 (excellent) | 8 (good)         |
| **TOTAL SCORE**        | 100%       | **8.5**              | **8.85**                | **7.7**       | **7.9**          |

**Selected:** Railway (Primary) with AWS migration path for scaling

### 10.3 Contracts & Agreements

#### Service Level Agreements (SLAs)

**Sentinel Hub API:**

- **Uptime:** 99.9% (measured monthly)
- **Support:** Email support, 24-hour response time
- **Rate Limit:** 3,000 requests/month (academic tier)
- **Terms:** Free for academic research, attribution required

**Railway Hosting:**

- **Uptime:** Best effort (no formal SLA on free tier)
- **Support:** Community forum, Discord
- **Resource Limits:** 500 MB RAM, 1 GB disk (free tier)
- **Terms:** Free tier for 30 days, then $5-20/month

#### Memorandum of Understanding (MoU) - Dept. of Agriculture

**Parties:** SkyCrop Project (University) & Dept. of Agriculture, Sri Lanka  
**Duration:** 12 months (renewable)  
**Objectives:**

- Pilot SkyCrop platform with 50-100 farmers
- Provide farmer contacts and training venues
- Co-branding and joint communication
- Data sharing (anonymized, aggregate only)

**Responsibilities:**

| **SkyCrop**                   | **Dept. of Agriculture**       |
| ----------------------------- | ------------------------------ |
| Develop and maintain platform | Provide farmer database access |
| Train extension officers      | Promote SkyCrop to farmers     |
| Provide free access (Year 1)  | Facilitate training venues     |
| Share anonymized analytics    | Provide domain expertise       |

**Deliverables:**

- SkyCrop: Functional platform by Feb 2026, 50+ farmers onboarded
- Dept. Agri: 20+ farmer referrals, 10+ extension officers trained

**Confidentiality:** Both parties protect sensitive data (farmer info, system design)

**Termination:** Either party can terminate with 30-day notice

**Status:** Draft prepared, under legal review (expected signature: Month 2)

### 10.4 Procurement Schedule

| **Procurement**      | **Initiation** | **Vendor Selection** | **Contract Signed** | **Delivery**                 | **Owner**   |
| -------------------- | -------------- | -------------------- | ------------------- | ---------------------------- | ----------- |
| Sentinel Hub API     | Week 1         | Week 1               | Week 2              | Week 3 (access granted)      | Backend Dev |
| Domain (skycrop.com) | Week 1         | Week 1               | Week 3              | Week 3 (DNS active)          | PM          |
| Railway Hosting      | Week 3         | Week 3               | Week 3              | Week 3 (account setup)       | DevOps      |
| Google Play Dev      | Week 1         | N/A                  | Week 16             | Week 16 (account active)     | Mobile Dev  |
| Apple Dev Program    | Week 1         | N/A                  | Week 16             | Week 16 (account active)     | Mobile Dev  |
| Dept. Agri MoU       | Week 2         | N/A                  | Month 2             | Month 2 (partnership active) | PM          |
| React Native Course  | Week 9         | Week 9               | Week 9              | Week 10 (completed)          | Mobile Dev  |

### 10.5 Procurement Risks

| **Risk**                                  | **Impact** | **Mitigation**                                                     |
| ----------------------------------------- | ---------- | ------------------------------------------------------------------ |
| Sentinel Hub rejects academic application | High       | Apply early, prepare fallback (Google Earth Engine)                |
| Railway free tier insufficient            | Medium     | Monitor usage, budget for paid tier ($20/mo)                       |
| Dept. Agri delays MoU signing             | Medium     | Start pilot without formal MoU (verbal agreement), formalize later |
| Apple Dev Program approval delayed        | Low        | Apply 2 weeks before app submission, use TestFlight for testing    |

---

## 11. INTEGRATION MANAGEMENT

### 11.1 Integration Approach

**Integration Philosophy:** Continuous integration (CI) and continuous deployment (CD) to catch issues early.

**Integration Points:**

```
┌──────────────┐
│   Frontend   │ ←──── HTTP/REST ────→ ┌──────────────┐
│ (React Web)  │                       │  Backend API │
└──────────────┘                       │  (Node.js)   │
       ↓                               └──────────────┘
┌──────────────┐                              ↓
│  Mobile App  │                       ┌──────────────┐
│(React Native)│                       │   Database   │
└──────────────┘                       │  PostgreSQL  │
                                       │  + MongoDB   │
                                       └──────────────┘
                                              ↓
                                       ┌──────────────┐
                                       │ External APIs│
                                       │ - Sentinel   │
                                       │ - Weather    │
                                       │ - Auth       │
                                       └──────────────┘
```

### 11.2 Integration Testing Strategy

**Integration Test Levels:**

1. **Component Integration (Weeks 5-13):**

   - Test API endpoint + database connection
   - Test frontend component + backend API
   - Run after each feature completion

2. **System Integration (Week 14):**

   - Test complete user workflows end-to-end
   - Example: User signup → Field selection → Health display
   - Run in staging environment

3. **External Integration (Week 14-15):**
   - Test Sentinel Hub API + backend processing
   - Test Weather API + frontend display
   - Test Google OAuth + session management
   - Run with live external services

**Integration Test Cases (Sample):**

**ITC-001: Satellite Image Retrieval**

- **Flow:** User taps map → Backend calls Sentinel Hub → Image returned → Frontend displays
- **Success Criteria:** Image displayed within 5 seconds, NDVI calculated correctly
- **Priority:** P1 (Critical)

**ITC-005: End-to-End Field Setup**

- **Flow:** User signs up → Taps field → AI detects boundary → Area calculated → Health displayed
- **Success Criteria:** All steps complete without errors, data persists in database
- **Priority:** P1 (Critical)

### 11.3 Configuration Management

**Version Control Strategy:**

- **Repository:** GitHub (private repo during development, public post-launch)
- **Branching Model:** Git Flow
  - `main`: Production-ready code (always deployable)
  - `develop`: Integration branch (latest features)
  - `feature/*`: Individual feature branches
  - `hotfix/*`: Emergency bug fixes

**Branching Workflow:**

1. Developer creates `feature/boundary-detection` branch from `develop`
2. Implements feature, writes tests, commits regularly
3. Creates Pull Request (PR) to `develop`
4. CI runs tests automatically
5. Peer review + approval
6. Merge to `develop`
7. Weekly: Merge `develop` → `main` (release)

**Release Versioning:** Semantic Versioning (MAJOR.MINOR.PATCH)

- Example: v1.0.0 (launch), v1.1.0 (new feature), v1.0.1 (bug fix)

**Configuration Files:**

- `.env`: Environment variables (API keys, DB credentials) - NOT committed to Git
- `config.js`: Application configuration (feature flags, settings) - Committed to Git
- `package.json`: Dependencies (locked versions)

### 11.4 Change Integration Process

**Code Change Workflow:**

1. **Local Development:** Developer writes code, runs unit tests locally
2. **Commit:** Commits to feature branch with descriptive message
   - Format: `[FEATURE] Add boundary detection model training script`
3. **Push:** Pushes to GitHub
4. **CI Pipeline:** GitHub Actions runs:
   - Linting (ESLint, Pylint)
   - Unit tests (Jest, PyTest)
   - Code coverage check (≥80%)
   - Build verification
5. **Code Review:** Peer reviews PR (checklist: style, tests, performance, security)
6. **Merge:** If approved and CI passes → Merge to `develop`
7. **CD Pipeline:** Automatically deploys to staging environment
8. **Manual Testing:** QA tests on staging
9. **Release:** Weekly merge `develop` → `main`, deploy to production

**CI/CD Pipeline (GitHub Actions):**

```yaml
name: SkyCrop CI/CD

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run linter
        run: npm run lint
      - name: Run tests
        run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway
        run: railway up
```

### 11.5 Dependency Management

**External Dependencies:**

| **Dependency**   | **Version** | **Purpose**        | **Update Strategy**                   |
| ---------------- | ----------- | ------------------ | ------------------------------------- |
| React            | 18.2.0      | Frontend framework | Pin major version, update minor/patch |
| Node.js          | 18.x LTS    | Backend runtime    | Use LTS, update yearly                |
| TensorFlow       | 2.13.x      | ML framework       | Pin minor version, update cautiously  |
| PostgreSQL       | 15.x        | Database           | Pin major version, update yearly      |
| Sentinel Hub SDK | Latest      | Satellite API      | Update monthly (bug fixes)            |

**Dependency Update Policy:**

- **Security patches:** Apply immediately (within 48 hours)
- **Minor updates:** Apply monthly (if no breaking changes)
- **Major updates:** Defer to Phase 2 (post-launch)

**Dependency Scanning:** GitHub Dependabot enabled (automatic security alerts)

### 11.6 Knowledge Management

**Project Documentation Repository:**

```
/docs
├── /planning
│   ├── project-charter.md
│   ├── business-case.md
│   ├── feasibility-study.md
│   └── project-plan.md (this document)
├── /design
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-specifications.md
│   └── ui-mockups/ (Figma files exported)
├── /development
│   ├── setup-guide.md
│   ├── coding-standards.md
│   ├── ai-model-training.md
│   └── deployment-guide.md
├── /testing
│   ├── test-plan.md
│   ├── test-cases.xlsx
│   └── uat-report.md
├── /user
│   ├── user-guide.md
│   ├── faq.md
│   └── video-tutorials/ (links)
└── /handover
    ├── final-report.md
    ├── lessons-learned.md
    └── future-roadmap.md
```

**Documentation Standards:**

- ✅ Markdown format (easy to version control, readable on GitHub)
- ✅ Clear headings and table of contents
- ✅ Screenshots and diagrams where helpful
- ✅ Updated within 24 hours of changes
- ✅ Peer-reviewed before finalizing

**Knowledge Transfer Plan:**

- **Week 15:** Document all critical system knowledge
- **Week 16:** Walkthrough session with sponsor (1 hour)
- **Post-Launch:** "SkyCrop Handbook" (comprehensive guide for future maintainers)

---

## 12. APPENDICES

### Appendix A: Change Request Form

**CHANGE REQUEST FORM**

| **Field**                   | **Details**                           |
| --------------------------- | ------------------------------------- |
| **CR ID**                   | [Auto-generated: CR-001]              |
| **Date Submitted**          | [Date]                                |
| **Submitted By**            | [Name, Role]                          |
| **Priority**                | ☐ Critical ☐ High ☐ Medium ☐ Low      |
| **Type**                    | ☐ Scope ☐ Schedule ☐ Budget ☐ Quality |
| **Current State**           | [Describe what exists now]            |
| **Proposed Change**         | [Describe what you want to change]    |
| **Justification**           | [Why is this change needed?]          |
| **Impact if NOT Approved**  | [What happens if we don't do this?]   |
| **Estimated Impact**        |                                       |
| - Scope                     | ☐ Increase ☐ Decrease ☐ No change     |
| - Schedule                  | [+/- X days]                          |
| - Budget                    | [+/- Rs. X]                           |
| - Resources                 | [Additional resources needed?]        |
| **Alternatives Considered** | [Other options?]                      |
| **Stakeholders Affected**   | [Who is impacted?]                    |

**APPROVAL SECTION (PM to complete):**

| **Field**                     | **Details**                      |
| ----------------------------- | -------------------------------- |
| **Impact Analysis Completed** | ☐ Yes (Date: **\_\_**)           |
| **CCB Review Date**           | [Date]                           |
| **Decision**                  | ☐ Approved ☐ Rejected ☐ Deferred |
| **Decision Rationale**        | [Why?]                           |
| **Implementation Plan**       | [If approved, how and when?]     |
| **Approved By**               | [PM / Sponsor signature]         |
| **Date Approved**             | [Date]                           |

---

### Appendix B: Project Change Log

| **CR ID** | **Date** | **Description**                                 | **Requester** | **Impact**              | **Status**            | **Decision Date** |
| --------- | -------- | ----------------------------------------------- | ------------- | ----------------------- | --------------------- | ----------------- |
| CR-001    | Nov 15   | Add Sinhala language support                    | Farmer        | +2 weeks schedule       | Deferred to Phase 2   | Nov 18            |
| CR-002    | Dec 5    | Use Google Earth Engine instead of Sentinel Hub | Tech Team     | No impact (backup plan) | Rejected (not needed) | Dec 7             |
| CR-003    | Jan 10   | Add push notifications to mobile app            | BA            | +3 days schedule        | Approved              | Jan 12            |

---

### Appendix C: Lessons Learned Log (Updated Throughout Project)

| **Date** | **Category** | **Lesson**                                                | **Impact**       | **Action for Future**                           |
| -------- | ------------ | --------------------------------------------------------- | ---------------- | ----------------------------------------------- |
| Nov 20   | Technical    | Sentinel Hub API approval took 5 days (expected 2)        | Minor delay      | Apply for credentials 1 week earlier            |
| Dec 10   | Process      | Code reviews taking 2+ days (blocking progress)           | Moderate delay   | Set 24-hour review SLA, add 2nd reviewer        |
| Jan 15   | Stakeholder  | Farmers prefer WhatsApp over email (100% response vs 40%) | Positive insight | Use WhatsApp for all farmer communication       |
| Feb 5    | Testing      | UAT revealed 8 usability issues (expected 3)              | Schedule impact  | Conduct informal user testing earlier (Week 12) |

---

### Appendix D: Project Glossary

| **Term**       | **Definition**                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------- |
| **NDVI**       | Normalized Difference Vegetation Index - measures vegetation health (0-1 scale, higher = healthier) |
| **NDWI**       | Normalized Difference Water Index - measures water content in plants                                |
| **TDVI**       | Transformed Difference Vegetation Index - alternative vegetation health metric                      |
| **U-Net**      | Convolutional neural network architecture for image segmentation                                    |
| **IoU**        | Intersection over Union - metric for boundary detection accuracy (0-1 scale, higher = better)       |
| **MAPE**       | Mean Absolute Percentage Error - metric for prediction accuracy (lower = better)                    |
| **Sentinel-2** | European satellite providing free 10m resolution multispectral imagery, 5-day revisit               |
| **EVM**        | Earned Value Management - project performance measurement technique                                 |
| **SPI**        | Schedule Performance Index - ratio of earned value to planned value (>1 = ahead)                    |
| **CPI**        | Cost Performance Index - ratio of earned value to actual cost (>1 = under budget)                   |
| **MVP**        | Minimum Viable Product - simplest version with core features only                                   |
| **CCB**        | Change Control Board - group that approves/rejects project changes                                  |

---

### Appendix E: Project Team Contact List

| **Name**            | **Role**                         | **Email** | **Phone** | **Availability**  | **Primary Responsibility**   |
| ------------------- | -------------------------------- | --------- | --------- | ----------------- | ---------------------------- |
| [Your Name]         | Project Manager / Lead Developer | [email]   | [phone]   | Mon-Sat 9AM-6PM   | Overall project, Backend, ML |
| [Partner Name]      | Frontend/Mobile Developer        | [email]   | [phone]   | Mon-Fri 10AM-5PM  | Web app, Mobile app          |
| [Supervisor Name]   | Project Sponsor                  | [email]   | [phone]   | Tue/Thu 10AM-12PM | Approval, Guidance           |
| [BA Name]           | Business Analyst                 | [email]   | [phone]   | Mon-Fri 2PM-5PM   | Requirements, User research  |
| [Professor Name]    | Technical Advisor (ML)           | [email]   | [phone]   | By appointment    | AI/ML guidance               |
| [Agri Officer Name] | Dept. of Agriculture Contact     | [email]   | [phone]   | Mon-Fri 9AM-4PM   | Farmer liaison               |

---

### Appendix F: Project Calendar (Weeks 1-16)

**Color Code:**

- 🔵 Planning & Design
- 🟢 Development
- 🟡 Testing
- 🔴 Critical Path / Milestone

```
NOVEMBER 2025
─────────────────────────────────────────
Week 1 (Oct 28 - Nov 3):   🔵 Planning
Week 2 (Nov 4 - Nov 10):   🔵 Planning    [M1: Kickoff]
Week 3 (Nov 11 - Nov 17):  🔵 Design + Infrastructure
Week 4 (Nov 18 - Nov 24):  🔵 Design      [M2: Design Complete]
Week 5 (Nov 25 - Dec 1):   🟢 AI/ML Start [M2.5: Foundation]

DECEMBER 2025
─────────────────────────────────────────
Week 6 (Dec 2 - Dec 8):    🔴 AI/ML Training (Critical)
Week 7 (Dec 9 - Dec 15):   🔴 AI/ML Training (Critical)
Week 8 (Dec 16 - Dec 22):  🟢 AI/ML       [M3: AI Models Ready]
Week 9 (Dec 23 - Dec 29):  🟢 Frontend    [Holiday week - reduced hours]

JANUARY 2026
─────────────────────────────────────────
Week 10 (Dec 30 - Jan 5):  🟢 Frontend    [New Year - reduced hours]
Week 11 (Jan 6 - Jan 12):  🟢 Frontend    [M4: Web App Complete]
Week 12 (Jan 13 - Jan 19): 🟢 Mobile App
Week 13 (Jan 20 - Jan 26): 🟢 Mobile App  [M5: Mobile App Beta]

FEBRUARY 2026
─────────────────────────────────────────
Week 14 (Jan 27 - Feb 2):  🟡 Testing
Week 15 (Feb 3 - Feb 9):   🟡 Testing     [M6: Testing Complete]
Week 16 (Feb 10 - Feb 16): 🔴 Deployment
Week 16 (Feb 17 - Feb 23): 🔴 Documentation
Week 16 (Feb 24 - Feb 28): 🔴 Launch      [M7: Project Complete]
```

**Public Holidays (Sri Lanka):**

- Dec 25, 2025: Christmas Day (reduced work)
- Jan 1, 2026: New Year's Day (no work)
- Feb 4, 2026: Independence Day (no work)

**Adjustments:** Add 1 extra day to Weeks 9, 10, 14 to compensate for holidays.

---

### Appendix G: Acronyms & Abbreviations

| **Acronym** | **Full Form**                           |
| ----------- | --------------------------------------- |
| **AI**      | Artificial Intelligence                 |
| **API**     | Application Programming Interface       |
| **AWS**     | Amazon Web Services                     |
| **BA**      | Business Analyst                        |
| **CCB**     | Change Control Board                    |
| **CD**      | Continuous Deployment                   |
| **CI**      | Continuous Integration                  |
| **CPI**     | Cost Performance Index                  |
| **CRUD**    | Create, Read, Update, Delete            |
| **CSS**     | Cascading Style Sheets                  |
| **EVM**     | Earned Value Management                 |
| **GIS**     | Geographic Information System           |
| **IoU**     | Intersection over Union                 |
| **JWT**     | JSON Web Token                          |
| **KPI**     | Key Performance Indicator               |
| **MAPE**    | Mean Absolute Percentage Error          |
| **ML**      | Machine Learning                        |
| **MoU**     | Memorandum of Understanding             |
| **MVP**     | Minimum Viable Product                  |
| **NDVI**    | Normalized Difference Vegetation Index  |
| **NDWI**    | Normalized Difference Water Index       |
| **NPS**     | Net Promoter Score                      |
| **OWASP**   | Open Web Application Security Project   |
| **PM**      | Project Manager                         |
| **PWA**     | Progressive Web App                     |
| **QA**      | Quality Assurance                       |
| **REST**    | Representational State Transfer         |
| **ROI**     | Return on Investment                    |
| **SLA**     | Service Level Agreement                 |
| **SPI**     | Schedule Performance Index              |
| **SQL**     | Structured Query Language               |
| **TDD**     | Test-Driven Development                 |
| **TDVI**    | Transformed Difference Vegetation Index |
| **UAT**     | User Acceptance Testing                 |
| **UI**      | User Interface                          |
| **UX**      | User Experience                         |
| **WBS**     | Work Breakdown Structure                |

---

### Appendix H: Risk Response Cards (Quick Reference)

**R-01: AI Model Accuracy <85%**

- **Owner:** ML Engineer
- **Monitor:** Weekly validation metrics
- **Trigger:** If accuracy <80% after Week 7
- **Response:**
  1. Use pre-trained ImageNet weights (transfer learning)
  2. Data augmentation (rotate, flip, brightness)
  3. Hyperparameter tuning (learning rate, batch size)
  4. If still <85%, implement manual verification fallback
- **Escalate to:** PM if mitigation fails

**R-04: Low Farmer Adoption**

- **Owner:** PM + BA
- **Monitor:** Weekly signup rate, engagement metrics
- **Trigger:** If <20 farmers recruited by Week 10
- **Response:**
  1. Extension officer outreach (leverage existing relationships)
  2. Incentives (certificates, recognition)
  3. Demonstration field days (show success stories)
  4. WhatsApp viral marketing (farmers share with peers)
- **Escalate to:** Sponsor if <30 farmers by Month 3

**R-09: Farmer Trust Issues**

- **Owner:** PM + BA
- **Monitor:** User feedback, drop-off rate
- **Trigger:** If >20% farmers drop out after first month
- **Response:**
  1. Side-by-side accuracy demonstrations (satellite vs. ground truth)
  2. Video testimonials from early adopters
  3. University branding (credibility boost)
  4. Extension officer endorsements
  5. Transparency about limitations (set realistic expectations)
- **Escalate to:** Sponsor if trust issues persist beyond Month 2

---

### Appendix I: Project Success Criteria (Final Checklist)

**Technical Success:**

- ☐ AI boundary detection achieves ≥85% IoU on validation set
- ☐ Yield prediction MAPE <15% (validated with actual harvest data)
- ☐ Vegetation indices correlation ≥90% with ground truth
- ☐ System uptime ≥99% (measured over 1 month)
- ☐ API response time <3 seconds (95th percentile)
- ☐ Mobile app crash rate <2%
- ☐ Code coverage ≥80%
- ☐ Zero P1 (critical) bugs at launch

**Delivery Success:**

- ☐ Project completed within 16 weeks (±1 week acceptable)
- ☐ Budget within Rs. 365,000 (±10% acceptable)
- ☐ All MVP features delivered (as per scope statement)
- ☐ Web app deployed to production
- ☐ Mobile app submitted to app stores (Google Play + Apple)
- ☐ Documentation complete (user + technical)

**User Success:**

- ☐ 50+ farmers onboarded and trained
- ☐ 80%+ user retention after 1 month
- ☐ User satisfaction ≥4.0/5.0 (NPS ≥40)
- ☐ Feature adoption ≥70% (farmers using core features)
- ☐ Task success rate ≥80% (users can complete key workflows)

**Stakeholder Success:**

- ☐ Sponsor satisfaction ≥4.5/5.0
- ☐ Partnership MoU signed with Dept. of Agriculture
- ☐ 10+ extension officers trained
- ☐ University approves project for graduation
- ☐ No unresolved conflicts or complaints

**Business Success:**

- ☐ Demonstrated yield improvement ≥10% (measured via surveys)
- ☐ Water savings ≥15% (farmer-reported)
- ☐ Positive media coverage (1+ news article or blog post)
- ☐ Academic publication submitted (conference paper)
- ☐ Potential for future funding identified (grants, investors)

**Overall Project Success:** Achieve ≥80% of above criteria (29 out of 36)

---

## PROJECT APPROVAL & SIGN-OFF

**Project Plan Approval:**

By signing below, the undersigned acknowledge that they have reviewed the Project Plan and agree to the scope, schedule, budget, and approach outlined herein.

| **Name**          | **Role**                         | **Signature**      | **Date**     |
| ----------------- | -------------------------------- | ------------------ | ------------ |
| [Your Name]       | Project Manager / Lead Developer | ********\_******** | ****\_\_**** |
| [BA Name]         | Business Analyst                 | ********\_******** | ****\_\_**** |
| [Supervisor Name] | Project Sponsor                  | ********\_******** | ****\_\_**** |

**Approval Decision:** ☐ APPROVED - Proceed with Execution ☐ CONDITIONAL APPROVAL ☐ REJECTED

**Conditions (if conditional approval):**

---

---

**Comments:**

---

---

---

---

## DOCUMENT HISTORY

| **Version** | **Date**     | **Author**  | **Changes**                           |
| ----------- | ------------ | ----------- | ------------------------------------- |
| 0.1         | Oct 28, 2025 | [Your Name] | Initial draft (WBS, schedule outline) |
| 0.5         | Oct 29, 2025 | [Your Name] | Added budget, quality, risk sections  |
| 0.9         | Oct 30, 2025 | [Your Name] | Complete draft, pending review        |
| 1.0         | Oct 30, 2025 | [Your Name] | Final version (post-review edits)     |

---

**END OF PROJECT PLAN**

---

**Next Steps:**

1. ✅ Obtain project plan approval (all signatures)
2. ✅ Set up project management tools (Trello/Jira, Slack, GitHub)
3. ✅ Apply for Sentinel Hub academic account
4. ✅ Initiate Dept. of Agriculture MoU discussion
5. ✅ Begin Phase 2: System Design (Week 3)

**For Questions or Updates:**
Contact Project Manager: [Your Email] | [Your Phone]

**Project Repository:** https://github.com/[your-username]/skycrop (private during development)

**Project Wiki:** https://skycrop.notion.site (team access only)

---
