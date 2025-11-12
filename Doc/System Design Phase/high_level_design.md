
# HIGH-LEVEL DESIGN (HLD)

## SkyCrop: Satellite-Based Paddy Field Management & Monitoring System

---

## DOCUMENT CONTROL

| **Item** | **Details** |
|----------|-------------|
| **Document Title** | High-Level Design (HLD) |
| **Project Name** | SkyCrop - Intelligent Paddy Field Monitoring System |
| **Document Code** | SKYCROP-HLD-2025-001 |
| **Version** | 1.0 |
| **Date** | October 29, 2025 |
| **Prepared By** | System Architect |
| **Reviewed By** | Technical Lead, Senior Developer |
| **Approved By** | Project Sponsor, Product Manager |
| **Status** | Approved |
| **Confidentiality** | Internal - For Development Team |

---

## EXECUTIVE SUMMARY

### Purpose

This High-Level Design (HLD) document provides a detailed description of the SkyCrop system's modules, components, and their interactions. It serves as a blueprint for developers to understand the system structure before diving into low-level implementation details.

### Scope

This HLD covers:
- **Module Descriptions:** Detailed description of each system module and its responsibilities
- **Component Diagrams:** Visual representation of components and their relationships
- **Data Flow Diagrams:** How data moves through the system
- **Interface Specifications:** APIs and contracts between modules
- **Sequence Diagrams:** Detailed interaction flows for key use cases
- **Deployment View:** How components are deployed and distributed

### Key Design Principles

1. **Modularity:** Clear separation of concerns, loosely coupled modules
2. **Scalability:** Horizontal scaling capability, stateless design
3. **Maintainability:** Clean code, comprehensive documentation, testability
4. **Performance:** Caching, async processing, optimized queries
5. **Security:** Defense in depth, least privilege, secure by default

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Module Descriptions](#2-module-descriptions)
3. [Component Diagrams](#3-component-diagrams)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Interface Specifications](#5-interface-specifications)
6. [Sequence Diagrams](#6-sequence-diagrams)
7. [Deployment View](#7-deployment-view)
8. [Appendices](#8-appendices)

---

## 1. SYSTEM OVERVIEW

### 1.1 System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          External Environment                                │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Farmers    │  │  Extension   │  │    Admins    │  │  Insurance   │  │
│  │   (1,800K)   │  │  Officers    │  │              │  │  Companies   │  │
│  │              │  │   (1,800)    │  │              │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │                  │           │
│         └─────────────────┴──────────────────┴──────────────────┘           │
│                                    │                                         │
└────────────────────────────────────┼─────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SkyCrop System                                    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    Presentation Layer                               │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │   Web App    │  │  Mobile App  │  │    Admin     │            │    │
│  │  │  (React.js)  │  │(React Native)│  │  Dashboard   │            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    Application Layer                                │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│    │
│  │  │   Auth   │ │  Field   │ │ Satellite│ │  Health  │ │   Rec.   ││    │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module  ││    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │    │
│  │  │  AI/ML   │ │ Weather  │ │ Disaster │ │ Content  │             │    │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │             │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    Data Layer                                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │ PostgreSQL   │  │   MongoDB    │  │    Redis     │            │    │
│  │  │  + PostGIS   │  │              │  │    Cache     │            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        External Services                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Sentinel Hub │  │OpenWeatherMap│  │ Google OAuth │  │   Firebase   │  │
│  │     API      │  │     API      │  │     2.0      │  │     FCM      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 System Layers

**Layer 1: Presentation Layer**
- **Purpose:** User interface and user experience
- **Components:** Web app, mobile app, admin dashboard
- **Technology:** React.js, React Native, Tailwind CSS
- **Responsibilities:** Display data, capture user input, client-side validation

**Layer 2: API Gateway Layer**
- **Purpose:** Single entry point for all client requests
- **Components:** Express.js API gateway, middleware stack
- **Technology:** Node.js, Express.js
- **Responsibilities:** Routing, authentication, validation, rate limiting, logging

**Layer 3: Application Layer**
- **Purpose:** Business logic and orchestration
- **Components:** 8 core modules (Auth, Field, Satellite, Health, Recommendation, AI/ML, Weather, Content)
- **Technology:** Node.js (services), Python (AI/ML)
- **Responsibilities:** Implement business rules, orchestrate workflows, coordinate between layers

**Layer 4: Data Access Layer**
- **Purpose:** Abstract database operations
- **Components:** Repositories (DAO pattern)
- **Technology:** Sequelize (PostgreSQL ORM), Mongoose (MongoDB ODM)
- **Responsibilities:** CRUD operations, query optimization, transaction management

**Layer 5: Persistence Layer**
- **Purpose:** Data storage and retrieval
- **Components:** PostgreSQL, MongoDB, Redis
- **Technology:** PostgreSQL 15 + PostGIS, MongoDB 7, Redis 7
- **Responsibilities:** Store data, ensure consistency, provide fast access

**Layer 6: External Services Layer**
- **Purpose:** Integration with third-party services
- **Components:** Sentinel Hub, OpenWeatherMap, Google OAuth, Firebase
- **Technology:** RESTful APIs, OAuth 2.0
- **Responsibilities:** Provide satellite imagery, weather data, authentication, push notifications

---

## 2. MODULE DESCRIPTIONS

### 2.1 Authentication Module

**Module ID:** MOD-001  
**Module Name:** Authentication & Authorization Module  
**Priority:** Critical (P0)

**Purpose:**
Manage user authentication, authorization, and session management with support for multiple authentication providers (Google OAuth, email/password).

**Responsibilities:**
1. User registration (Google OAuth, email/password)
2. User login and logout
3. JWT token generation and validation
4. Password hashing and verification (bcrypt)
5. Session management (30-day expiry)
6. Password reset functionality
7. Email verification
8. Account security (lock after 5 failed attempts)
9. Role-based access control (RBAC)

**Sub-Components:**

```
Authentication Module
├── OAuth Handler
│   ├── GoogleOAuthClient
│   ├── OAuthCallbackHandler
│   └── TokenExchangeService
│
├── Credential Handler
│   ├── PasswordHasher (bcrypt)
│   ├── PasswordValidator
│   └── EmailVerificationService
│
├── Session Manager
│   ├── JWTTokenGenerator
│   ├── JWTTokenValidator
│   ├── TokenBlacklistService (Redis)
│   └── SessionRefreshService
│
├── Security Manager
│   ├── FailedLoginTracker
│   ├── AccountLockService
│   └── SecurityAuditLogger
│
└── User Profile Manager
    ├── ProfileCRUD
    ├── ProfilePhotoUploader
    └── AccountDeletionService (GDPR)
```

**Interfaces:**

**Input Interfaces:**
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/verify-email/:token` - Verify email

**Output Interfaces:**
- JWT token (30-day expiry)
- User profile data
- Authentication status (success/failure)

**Dependencies:**
- **Internal:** User Repository, Email Service, Redis Cache
- **External:** Google OAuth API

**Data Stores:**
- **PostgreSQL:** `users` table (user accounts, credentials)
- **Redis:** Session tokens, token blacklist, failed login attempts

**Performance Requirements:**
- Login: <2 seconds (p95)
- Token validation: <100 milliseconds
- Password hashing: <500 milliseconds (bcrypt 10 rounds)

**Security Requirements:**
- Password hashing: bcrypt with 10+ rounds
- JWT signing: HS256 with 256-bit secret
- Account lock: After 5 failed attempts
- Session expiry: 30 days (configurable)

---

### 2.2 Field Management Module

**Module ID:** MOD-002  
**Module Name:** Field Management Module  
**Priority:** Critical (P0)

**Purpose:**
Manage paddy field data including boundaries, area calculation, and field metadata.

**Responsibilities:**
1. Field CRUD operations (Create, Read, Update, Delete)
2. Field boundary storage and validation (GeoJSON)
3. Field area calculation (GIS operations)
4. Multi-field management (up to 5 fields per user in Phase 1)
5. Field archival and restoration
6. Spatial queries (find fields within bounding box)

**Sub-Components:**

```
Field Management Module
├── Field CRUD Service
│   ├── CreateFieldService
│   ├── GetFieldService
│   ├── UpdateFieldService
│   ├── DeleteFieldService
│   └── ArchiveFieldService
│
├── Boundary Manager
│   ├── BoundaryValidator (GeoJSON validation)
│   ├── BoundarySimplifier (Douglas-Peucker algorithm)
│   ├── BoundaryAdjuster (manual vertex editing)
│   └── BoundaryRenderer (map overlay)
│
├── GIS Calculator
│   ├── AreaCalculator (Shoelace formula)
│   ├── CentroidCalculator
│   ├── PerimeterCalculator
│   └── CoordinateTransformer (WGS84 ↔ UTM)
│
└── Field Validator
    ├── LocationValidator (Sri Lanka bounding box)
    ├── AreaValidator (0.1-50 hectares)
    ├── NameValidator (unique per user)
    └── LimitValidator (max 5 fields per user)
```

**Interfaces:**

**Input Interfaces:**
- `GET /api/v1/fields` - List user's fields
- `POST /api/v1/fields` - Create new field
- `GET /api/v1/fields/:id` - Get field details
- `PUT /api/v1/fields/:id` - Update field
- `DELETE /api/v1/fields/:id` - Delete field
- `PUT /api/v1/fields/:id/boundary` - Update boundary

**Output Interfaces:**
- Field data (GeoJSON boundary, area, metadata)
- Validation errors
- Success/failure status

**Dependencies:**
- **Internal:** AI/ML Module (boundary detection), User Module (ownership validation)
- **External:** None

**Data Stores:**
- **PostgreSQL:** `fields` table with PostGIS spatial types

**Performance Requirements:**
- Field creation: <5 seconds (including AI boundary detection)
- Field retrieval: <500 milliseconds
- Area calculation: <100 milliseconds
- Spatial queries: <1 second

**Data Validation:**
- Boundary: Valid GeoJSON polygon, 3-100 vertices, no self-intersection
- Area: 0.1-50 hectares
- Location: Within Sri Lanka (5.9°N-9.9°N, 79.5°E-82.0°E)
- Name: 1-50 characters, unique per user

---

### 2.3 Satellite Image Processing Module

**Module ID:** MOD-003  
**Module Name:** Satellite Image Processing Module  
**Priority:** Critical (P0)

**Purpose:**
Retrieve, cache, and preprocess satellite imagery from Sentinel Hub API for crop health analysis.

**Responsibilities:**
1. Satellite image retrieval from Sentinel Hub API
2. Image caching (30-day retention)
3. Cloud masking (reject images with >20% cloud cover)
4. Image preprocessing (normalization, cropping)
5. Band extraction (Red, NIR, SWIR for vegetation indices)
6. Image quality control

**Sub-Components:**

```
Satellite Image Processing Module
├── Image Retrieval Service
│   ├── SentinelHubClient (API integration)
│   ├── ImageRequestBuilder (construct API requests)
│   ├── ImageDownloader (download GeoTIFF)
│   └── ImageMetadataExtractor
│
├── Image Cache Manager
│   ├── CacheKeyGenerator (field_id + date)
│   ├── CacheLookupService (check Redis/S3)
│   ├── CacheStorageService (store to Redis/S3)
│   └── CacheCleanupService (30-day retention)
│
├── Image Preprocessor
│   ├── CloudMaskingService (detect and mask clouds)
│   ├── NormalizationService (scale to 0-1)
│   ├── BandExtractor (extract specific bands)
│   ├── ImageCropper (crop to field boundary)
│   └── ImageResizer (resize for ML models)
│
└── Quality Control
    ├── CloudCoverageCalculator
    ├── DataCompletenessChecker
    ├── SpatialExtentValidator
    └── ImageQualityScorer
```

**Interfaces:**

**Input Interfaces:**
- `getImage(fieldId, dateRange, bands)` - Retrieve satellite image
- `getCachedImage(fieldId, date)` - Get cached image
- `preprocessImage(image, options)` - Preprocess image

**Output Interfaces:**
- GeoTIFF image (multispectral bands)
- Image metadata (acquisition date, cloud cover, resolution)
- Preprocessed image (normalized, cropped)

**Dependencies:**
- **Internal:** Field Module (boundary for cropping)
- **External:** Sentinel Hub API

**Data Stores:**
- **Redis:** Image metadata cache (30-day TTL)
- **AWS S3:** Satellite images (30-day retention)

**Performance Requirements:**
- Image retrieval: <10 seconds
- Cache lookup: <100 milliseconds
- Preprocessing: <5 seconds

**Error Handling:**
- API rate limit exceeded: Use cached image, notify user
- Cloud cover >20%: Search for older image (up to 60 days)
- API timeout: Retry with exponential backoff (3 attempts)

---

### 2.4 Crop Health Monitoring Module

**Module ID:** MOD-004  
**Module Name:** Crop Health Monitoring Module  
**Priority:** Critical (P0)

**Purpose:**
Calculate vegetation indices (NDVI, NDWI, TDVI) from satellite imagery and classify crop health status.

**Responsibilities:**
1. Vegetation indices calculation (NDVI, NDWI, TDVI)
2. Health status classification (Excellent/Good/Fair/Poor)
3. Health score calculation (0-100 scale)
4. Trend analysis (Improving/Stable/Declining)
5. Historical health tracking (6 months)
6. Scheduled health updates (every 5-7 days)

**Sub-Components:**

```
Crop Health Monitoring Module
├── Vegetation Index Calculator
│   ├── NDVICalculator: (NIR - Red) / (NIR + Red)
│   ├── NDWICalculator: (NIR - SWIR) / (NIR + SWIR)
│   ├── TDVICalculator: sqrt(NDVI + 0.5)
│   └── StatisticsCalculator (mean, min, max, std dev)
│
├── Health Classifier
│   ├── StatusClassifier (Excellent/Good/Fair/Poor)
│   ├── ScoreCalculator (0-100 scale)
│   ├── TrendAnalyzer (compare to previous measurement)
│   └── ZoneIdentifier (identify stressed zones)
│
├── Health Data Manager
│   ├── HealthRecordCreator
│   ├── HealthRecordRetriever
│   ├── HistoricalDataAggregator
│   └── TrendChartGenerator
│
└── Scheduled Update Service
    ├── HealthUpdateScheduler (cron job, daily 2 AM)
    ├── FieldUpdateQueue (prioritize fields)
    ├── BatchProcessor (process multiple fields)
    └── UpdateNotifier (notify users of updates)
```

**Interfaces:**

**Input Interfaces:**
- `calculateHealth(fieldId, satelliteImage)` - Calculate health indices
- `getLatestHealth(fieldId)` - Get latest health data
- `getHealthHistory(fieldId, dateRange)` - Get historical health data
- `refreshHealth(fieldId)` - Force health data refresh

**Output Interfaces:**
- Health data (NDVI, NDWI, TDVI, status, score, trend)
- Color-coded health map (raster overlay)
- Historical trend data (time series)

**Dependencies:**
- **Internal:** Satellite Module (image retrieval), Field Module (boundary)
- **External:** None

**Data Stores:**
- **PostgreSQL:** `health_records` table
- **Redis:** Latest health data cache (1-hour TTL)

**Performance Requirements:**
- NDVI calculation: <5 seconds (512×512 image)
- Health classification: <1 second
- Historical data retrieval: <500 milliseconds

**Algorithms:**

**NDVI Calculation:**
```
Input: Red band (B04), NIR band (B08)
Process:
  1. NDVI = (NIR - Red) / (NIR + Red + ε)  where ε = 1e-10
  2. Clip values to range [-1, 1]
  3. Mask non-field pixels (use boundary polygon)
  4. Calculate statistics (mean, min, max, std dev)
Output: NDVI raster + statistics
```

**Health Classification:**
```
Input: Mean NDVI value
Process:
  IF NDVI >= 0.8 THEN status = "Excellent", score = 90-100
  ELSE IF NDVI >= 0.7 THEN status = "Good", score = 70-89
  ELSE IF NDVI >= 0.5 THEN status = "Fair", score = 50-69
  ELSE status = "Poor", score = 0-49
Output: Health status, health score
```

---

### 2.5 Recommendation Engine Module

**Module ID:** MOD-005  
**Module Name:** Recommendation Engine Module  
**Priority:** Critical (P0)

**Purpose:**
Generate actionable water and fertilizer recommendations based on crop health indices and weather forecasts.

**Responsibilities:**
1. Water recommendation generation (NDWI-based)
2. Fertilizer recommendation generation (NDVI-based)
3. Alert generation (critical conditions)
4. Weather integration (adjust timing based on forecast)
5. Recommendation history tracking
6. Recommendation status management (pending/done/ignored)

**Sub-Components:**

```
Recommendation Engine Module
├── Water Recommendation Service
│   ├── NDWIAnalyzer (analyze water stress)
│   ├── IrrigationScheduler (determine timing)
│   ├── ZoneIdentifier (identify stressed zones)
│   ├── WaterQuantityEstimator
│   └── SavingsCalculator (estimate water savings)
│
├── Fertilizer Recommendation Service
│   ├── NDVIAnalyzer (analyze vegetation health)
│   ├── GrowthStageDetector (vegetative/reproductive/maturity)
│   ├── FertilizerTypeSelector (urea, NPK, organic)
│   ├── ApplicationRateCalculator (kg/hectare)
│   └── CostSavingsCalculator
│
├── Alert Generator
│   ├── CriticalConditionDetector
│   │   ├── SevereWaterStressDetector (NDWI <0.05)
│   │   ├── RapidNDVIDeclineDetector (>15% drop in 7 days)
│   │   ├── ExtremeWeatherDetector (rain >50mm, temp >35°C)
│   │   └── PestOutbreakDetector (localized NDVI drop)
│   ├── AlertPrioritizer (Critical/High/Medium)
│   ├── AlertFormatter
│   └── AlertDeliveryService (push notifications)
│
├── Weather Integrator
│   ├── ForecastRetriever
│   ├── RainPredictionAnalyzer
│   ├── TimingOptimizer (adjust recommendations based on weather)
│   └── WeatherAlertGenerator
│
└── Recommendation Manager
    ├── RecommendationCreator
    ├── RecommendationRetriever
    ├── RecommendationStatusUpdater
    └── RecommendationHistoryTracker
```

**Interfaces:**

**Input Interfaces:**
- `generateWaterRecommendation(fieldId, ndwi, weather)` - Generate water recommendation
- `generateFertilizerRecommendation(fieldId, ndvi, growthStage)` - Generate fertilizer recommendation
- `detectAlerts(fieldId, healthData)` - Detect critical conditions
- `getRecommendations(fieldId)` - Get current recommendations
- `updateRecommendationStatus(recommendationId, status)` - Mark as done/ignored

**Output Interfaces:**
- Recommendation data (type, description, action, zones, savings)
- Alert data (severity, title, description, timing)
- Recommendation history

**Dependencies:**
- **Internal:** Health Module (NDVI, NDWI), Weather Module (forecast)
- **External:** Firebase FCM (push notifications)

**Data Stores:**
- **PostgreSQL:** `recommendations` table

**Performance Requirements:**
- Recommendation generation: <5 seconds
- Alert detection: <2 seconds
- Recommendation retrieval: <500 milliseconds

**Business Rules:**

**Water Recommendation Logic:**
```
Input: NDWI, Weather Forecast
Process:
  IF NDWI > 0.3 THEN
    recommendation = "No irrigation needed"
  ELSE IF NDWI >= 0.1 AND NDWI <= 0.3 THEN
    IF rain_forecast_48h > 20mm THEN
      recommendation = "No irrigation needed (rain expected)"
    ELSE
      recommendation = "Irrigate in 2-3 days"
    END IF
  ELSE IF NDWI < 0.1 THEN
    recommendation = "Irrigate immediately (severe water stress)"
  END IF
  
  Identify zones: WHERE NDWI < 0.2
  Estimate savings: (Full field area - Stressed area) × Water per hectare
Output: Recommendation with timing, zones, savings
```

**Fertilizer Recommendation Logic:**
```
Input: NDVI, Growth Stage
Process:
  IF NDVI > 0.75 THEN
    recommendation = "No fertilizer needed"
  ELSE IF NDVI >= 0.6 AND NDVI <= 0.75 THEN
    IF growth_stage == "vegetative" THEN
      recommendation = "Apply 30 kg/ha urea to low-vigor zones"
    ELSE IF growth_stage == "reproductive" THEN
      recommendation = "Apply 20 kg/ha NPK (balanced)"
    END IF
  ELSE IF NDVI < 0.6 THEN
    recommendation = "Apply 50 kg/ha urea + check for pests"
  END IF
  
  Identify zones: WHERE NDVI < 0.7
  Estimate savings: (Full field fertilizer - Targeted fertilizer) × Cost per kg
Output: Recommendation with type, quantity, zones, timing, savings
```

---

### 2.6 AI/ML Module

**Module ID:** MOD-006  
**Module Name:** AI/ML Module  
**Priority:** Critical (P0)

**Purpose:**
Provide AI-powered boundary detection and yield prediction using deep learning and machine learning models.

**Responsibilities:**
1. Field boundary detection (U-Net model, 85%+ IoU)
2. Yield prediction (Random Forest model, 85%+ accuracy)
3. Disaster damage analysis (NDVI comparison)
4. Model training and retraining
5. Model versioning and deployment
6. Model performance monitoring

**Sub-Components:**

```
AI/ML Module
├── Boundary Detection Service
│   ├── UNetModel (TensorFlow/Keras)
│   ├── ImagePreprocessor (resize, normalize)
│   ├── MaskPostprocessor (threshold, morphology, contour extraction)
│   ├── PolygonSimplifier (Douglas-Peucker)
│   └── CoordinateConverter (pixel → GPS)
│
├── Yield Prediction Service
│   ├── RandomForestModel (scikit-learn)
│   ├── FeatureExtractor (NDVI stats, weather, area)
│   ├── FeatureNormalizer
│   ├── PredictionGenerator
│   └── ConfidenceIntervalCalculator (95% CI)
│
├── Disaster Analysis Service
│   ├── ImageComparator (before/after NDVI)
│   ├── DamageClassifier (severe/moderate/minor)
│   ├── DamagedAreaCalculator
│   └── YieldLossEstimator
│
├── Model Training Pipeline
│   ├── DatasetLoader (DeepGlobe, historical yields)
│   ├── DataAugmenter (rotation, flip, brightness)
│   ├── ModelTrainer (train U-Net, Random Forest)
│   ├── ModelEvaluator (IoU, MAPE, cross-validation)
│   └── ModelSaver (serialize and version)
│
├── Model Serving
│   ├── ModelLoader (load from disk)
│   ├── ModelVersionManager (v1.0.0, v1.1.0, etc.)
│   ├── InferenceEngine (run predictions)
│   └── ABTestingService (compare model versions)
│
└── Model Monitoring
    ├── PerformanceTracker (accuracy, latency)
    ├── DriftDetector (performance degradation)
    ├── RetrainingTrigger (monthly or accuracy <80%)
    └── ModelMetricsLogger
```

**Interfaces:**

**Input Interfaces:**
- `POST /api/ml/detect-boundary` - Detect field boundary
- `POST /api/ml/predict-yield` - Predict crop yield
- `POST /api/ml/analyze-disaster` - Analyze disaster damage

**Output Interfaces:**
- Boundary polygon (GeoJSON)
- Yield prediction (kg/ha, confidence interval)
- Damage assessment (area, severity, loss)

**Dependencies:**
- **Internal:** Satellite Module (images), Health Module (NDVI time series)
- **External:** None (self-contained Python service)

**Data Stores:**
- **File System:** Trained models (.h5, .pkl files)
- **PostgreSQL:** Model metadata, performance metrics

**Performance Requirements:**
- Boundary detection: <60 seconds
- Yield prediction: <10 seconds
- Model loading: <5 seconds (at startup)

**Model Specifications:**

**U-Net Boundary Detection:**
- Input: 256×256×4 (RGB + NIR)
- Output: 256×256×1 (binary mask)
- Parameters: ~20M
- Accuracy: ≥85% IoU
- Inference time: 30-60 seconds (CPU)

**Random Forest Yield Prediction:**
- Input: 25 features (NDVI stats, weather, area, growth stage)
- Output: Predicted yield (kg/ha)
- Trees: 100
- Accuracy: ≥85% (MAPE <15%)
- Inference time: <1 second

---

### 2.7 Weather Service Module

**Module ID:** MOD-007  
**Module Name:** Weather Service Module  
**Priority:** Critical (P0)

**Purpose:**
Retrieve, cache, and display weather forecasts with extreme weather alerting.

**Responsibilities:**
1. Weather forecast retrieval (7-day forecast)
2. Current weather conditions
3. Historical weather data (30 days)
4. Extreme weather detection and alerting
5. Weather data caching (6-hour refresh)
6. Integration with recommendation engine

**Sub-Components:**

```
Weather Service Module
├── Forecast Retrieval Service
│   ├── OpenWeatherMapClient (API integration)
│   ├── ForecastRequestBuilder
│   ├── ForecastParser (JSON → internal format)
│   └── ForecastCacheManager (Redis, 6-hour TTL)
│
├── Weather Data Processor
│   ├── TemperatureConverter (Kelvin → Celsius)
│   ├── RainfallAggregator (daily totals)
│   ├── WeatherConditionMapper (codes → descriptions)
│   └── WeatherIconSelector
│
├── Extreme Weather Detector
│   ├── HeavyRainDetector (>50mm in 24 hours)
│   ├── ExtremeHeatDetector (>35°C)
│   ├── StrongWindDetector (>40 km/h)
│   ├── DroughtDetector (no rain for 14+ days)
│   └── AlertSeverityClassifier
│
├── Weather Alert Service
│   ├── AlertGenerator
│   ├── AlertFormatter
│   ├── AlertDeliveryService (push notifications)
│   └── AlertHistoryTracker
│
└── Historical Weather Service
    ├── HistoricalDataRetriever
    ├── WeatherTrendAnalyzer
    ├── RainfallPatternDetector
    └── TemperatureTrendCalculator
```

**Interfaces:**

**Input Interfaces:**
- `GET /api/v1/weather/forecast?lat={lat}&lon={lon}` - Get 7-day forecast
- `GET /api/v1/weather/current?lat={lat}&lon={lon}` - Get current weather
- `GET /api/v1/weather/history?lat={lat}&lon={lon}&days={days}` - Get historical weather
- `GET /api/v1/weather/alerts?field_id={id}` - Get weather alerts

**Output Interfaces:**
- Weather forecast (7-day, daily)
- Current weather conditions
- Weather alerts (extreme weather)
- Historical weather data

**Dependencies:**
- **Internal:** Field Module (GPS coordinates)
- **External:** OpenWeatherMap API

**Data Stores:**
- **Redis:** Weather forecast cache (6-hour TTL)
- **PostgreSQL:** `weather_forecasts` table (historical data)

**Performance Requirements:**
- Forecast retrieval: <3 seconds
- Cache lookup: <100 milliseconds
- Alert detection: <2 seconds

**API Integration:**

**OpenWeatherMap API Call:**
```javascript
// weather.service.js
class WeatherService {
  async getForecast(latitude, longitude) {
    // 1. Check cache
    const cacheKey = `weather:${latitude}:${longitude}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    // 2. Call API
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast/daily', {
      params: {
        lat: latitude,
        lon: longitude,
        cnt: 7,              // 7 days
        units: 'metric',     // Celsius
        appid: process.env.WEATHER_API_KEY
      }
    });
    
    // 3. Parse response
    const forecast = response.data.list.map(day => ({
      date: new Date(day.dt * 1000),
      temp_min: day.temp.min,
      temp_max: day.temp.max,
      weather: day.weather[0].main,
      description: day.weather[0].description,
      icon: day.weather[0].icon,
      rainfall_prob: day.pop * 100,  // Probability of precipitation
      rainfall_amount: day.rain || 0,
      humidity: day.humidity,
      wind_speed: day.speed
    }));
    
    // 4. Cache for 6 hours
    await redis.setex(cacheKey, 21600, JSON.stringify(forecast));
    
    return forecast;
  }
  
  detectExtremeWeather(forecast) {
    const alerts = [];
    
    forecast.forEach(day => {
      // Heavy rain
      if (day.rainfall_amount > 50) {
        alerts.push({
          type: 'heavy_rain',
          severity: 'critical',
          date: day.date,
          description: `Heavy rain expected: ${day.rainfall_amount}mm`,
          recommendation: 'Delay fertilizer application. Ensure drainage channels clear.'
        });
      }
      
      // Extreme heat
      if (day.temp_max > 35) {
        alerts.push({
          type: 'extreme_heat',
          severity: 'high',
          date: day.date,
          description: `Extreme heat expected: ${day.temp_max}°C`,
          recommendation: 'Ensure adequate irrigation. Monitor for heat stress.'
        });
      }
      
      // Strong winds
      if (day.wind_speed > 40) {
        alerts.push({
          type: 'strong_winds',
          severity: 'medium',
          date: day.date,
          description: `Strong winds expected: ${day.wind_speed} km/h`,
          recommendation: 'Secure loose items. Check for lodging after wind event.'
        });
      }
    });
    
    return alerts;
  }
}
```

---

### 2.8 Content Management Module

**Module ID:** MOD-008  
**Module Name:** Content Management Module  
**Priority:** High (P1)

**Purpose:**
Manage agricultural news, articles, and knowledge base content.

**Responsibilities:**
1. News article CRUD operations
2. Content categorization (News, Best Practices, Market Prices, Government Schemes)
3. Full-text search
4. Content publishing workflow (draft/published/scheduled)
5. View and share tracking
6. Content recommendation (personalized)

**Sub-Components:**

```
Content Management Module
├── Article Management Service
│   ├── ArticleCreator (rich text editor integration)
│   ├── ArticleUpdater
│   ├── ArticleDeleter
│   ├── ArticlePublisher (draft → published)
│   └── ArticleScheduler (scheduled publishing)
│
├── Content Search Service
│   ├── FullTextSearchEngine (MongoDB text index)
│   ├── CategoryFilter
│   ├── TagFilter
│   └── SearchRanker (relevance scoring)
│
├── Media Manager
│   ├── ImageUploader (S3)
│   ├── ImageOptimizer (resize, compress, WebP)
│   ├── ImageCDNIntegrator (CloudFront)
│   └── MediaLibrary
│
├── Content Analytics
│   ├── ViewTracker
│   ├── ShareTracker
│   ├── EngagementCalculator
│   └── PopularContentIdentifier
│
└── Content Recommendation Engine
    ├── UserInterestProfiler
    ├── ContentSimilarityCalculator
    ├── PersonalizedRecommender
    └── TrendingContentIdentifier
```

**Interfaces:**

**Input Interfaces:**
- `POST /api/v1/admin/news` - Create article
- `PUT /api/v1/admin/news/:id` - Update article
- `DELETE /api/v1/admin/news/:id` - Delete article
- `GET /api/v1/news` - List articles (paginated)
- `GET /api/v1/news/:id` - Get article details
- `GET /api/v1/news/search?q={query}` - Search articles

**Output Interfaces:**
- Article data (title, content, images, metadata)
- Search results (ranked by relevance)
- Analytics data (views, shares, engagement)

**Dependencies:**
- **Internal:** User Module (author information)
- **External:** AWS S3 (image storage), CloudFront (CDN)

**Data Stores:**
- **MongoDB:** `news_articles` collection
- **Redis:** Article list cache (30-minute TTL)

**Performance Requirements:**
- Article creation: <5 seconds
- Article retrieval: <500 milliseconds
- Search: <2 seconds
- Image upload: <10 seconds

---

## 3. COMPONENT DIAGRAMS

### 3.1 Backend Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Backend Application                                 │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      API Gateway Layer                              │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐     │    │
│  │  │              Express.js Application                       │     │    │
│  │  │                                                           │     │    │
│  │  │  Middleware Stack:                                       │     │    │
│  │  │  ┌─────────────────────────────────────────────────┐    │     │    │
│  │  │  │ 1. CORS Middleware                               │    │     │    │
│  │  │  │ 2. Helmet (Security Headers)                     │    │     │    │
│  │  │  │ 3. Compression (Gzip)                            │    │     │    │
│  │  │  │ 4. Body Parser (JSON, URL-encoded)               │    │     │    │
│  │  │  │ 5. Morgan (HTTP Request Logging)                 │    │     │    │
│  │  │  │ 6. Authentication Middleware (JWT validation)    │    │     │    │
│  │  │  │ 7. Rate Limiting Middleware                      │    │     │    │
│  │  │  │ 8. Validation Middleware (Joi schemas)           │    │     │    │
│  │  │  │ 9. Error Handling Middleware                     │    │     │    │
│  │  │  └─────────────────────────────────────────────────┘    │     │    │
│  │  │                                                           │     │    │
│  │  │  Route Handlers:                                         │     │    │
│  │  │  • /api/v1/auth/*        → AuthController             │     │    │
│  │  │  • /api/v1/users/*       → UserController             │     │    │
│  │  │  • /api/v1/fields/*      → FieldController            │     │    │
│  │  │  • /api/v1/health/*      → HealthController           │     │    │
│  │  │  • /api/v1/recommendations/* → RecommendationController│     │    │
│  │  │  • /api/v1/weather/*     → WeatherController          │     │    │
│  │  │  • /api/v1/disaster/*    → DisasterController         │     │    │
│  │  │  • /api/v1/news/*        → NewsController             │     │    │
│  │  │  • /api/v1/admin/*       → AdminController            │     │    │
│  │  └───────────────────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      Service Layer                                  │    │
│  │                                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │ AuthService  │  │ FieldService │  │SatelliteServ.│            │    │
│  │  │              │  │              │  │              │            │    │
│  │  │ • signup()   │  │ • create()   │  │ • getImage() │            │    │
│  │  │ • login()    │  │ • update()   │  │ • cache()    │            │    │
│  │  │ • logout()   │  │ • delete()   │  │ • preprocess()│            │    │
│  │  │ • resetPwd() │  │ • getById()  │  │              │            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  │                                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │HealthService │  │  RecService  │  │WeatherService│            │    │
│  │  │              │  │              │  │              │            │    │
│  │  │ • calcNDVI() │  │ • genWater() │  │ • getForecast│            │    │
│  │  │ • calcNDWI() │  │ • genFert()  │  │ • getAlerts()│            │    │
│  │  │ • classify() │  │ • genAlerts()│  │ • getCurrent()│            │    │
│  │  │ • getTrends()│  │              │  │              │            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  │                                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐                              │    │
│  │  │DisasterServ. │  │ ContentServ. │                              │    │
│  │  │              │  │              │                              │    │
│  │  │ • assess()   │  │ • create()   │                              │    │
│  │  │ • genReport()│  │ • search()   │                              │    │
│  │  │              │  │ • publish()  │                              │    │
│  │  └──────────────┘  └──────────────┘                              │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                   Repository Layer (DAO)                            │    │
│  │                                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │  UserRepo    │  │  FieldRepo   │  │  HealthRepo  │            │    │
│  │  │              │  │              │  │              │            │    │
│  │  │ • findById() │  │ • findById() │  │ • findById() │            │    │
│  │  │ • findByEmail│  │ • findByUser()│  │ • findByField│            │    │
│  │  │ • create()   │  │ • create()   │  │ • create()   │            │    │
│  │  │ • update()   │  │ • update()   │  │ • getHistory()│            │    │
│  │  │ • delete()   │  │ • delete()   │  │              │            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  │                                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │WeatherRepo   │  │  NewsRepo    │  │AnalyticsRepo │            │    │
│  │  │              │  │              │  │              │            │    │
│  │  │ • findByField│  │ • findAll()  │  │ • logEvent() │            │    │
│  │  │ • create()   │  │ • search()   │  │ • aggregate()│            │    │
│  │  │              │  │ • create()   │  │              │            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      Database Layer                                 │    │
│  │                                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │ PostgreSQL   │  │   MongoDB    │  │    Redis     │            │    │
│  │  │  + PostGIS   │  │              │  │              │            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Frontend Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        React Web Application                                 │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      App Component                                  │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐     │    │
│  │  │              Redux Store (Global State)                   │     │    │
│  │  │                                                           │     │    │
│  │  │  Slices:                                                 │     │    │
│  │  │  • authSlice      (user, token, isAuthenticated)        │     │    │
│  │  │  • uiSlice        (sidebar, theme, language)            │     │    │
│  │  │  • notificationSlice (alerts, messages)                 │     │    │
│  │  └──────────────────────────────────────────────────────────┘     │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐     │    │
│  │  │            React Query (Server State Cache)              │     │    │
│  │  │                                                           │     │    │
│  │  │  Queries:                                                │     │    │
│  │  │  • useFields()        (fetch user's fields)             │     │    │
│  │  │  • useFieldHealth()   (fetch health data)               │     │    │
│  │  │  • useWeather()       (fetch weather forecast)          │     │    │
│  │  │  • useNews()          (fetch news articles)             │     │    │
│  │  │                                                           │     │    │
│  │  │  Mutations:                                              │     │    │
│  │  │  • useCreateField()   (create new field)                │     │    │
│  │  │  • useUpdateField()   (update field)                    │     │    │
│  │  │  • useDeleteField()   (delete field)                    │     │    │
│  │  └──────────────────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      Router (React Router 6)                        │    │
│  │                                                                     │    │
│  │  Public Routes:                                                    │    │
│  │  • /                  → LandingPage                               │    │
│  │  • /login             → LoginPage                                 │    │
│  │  • /signup            → SignupPage                                │    │
│  │                                                                     │    │
│  │  Protected Routes (require authentication):                        │    │
│  │  • /dashboard         → Dashboard                                 │    │
│  │  • /fields/:id        → FieldDetails                              │    │
│  │  • /fields/new        → AddField                                  │    │
│  │  • /weather           → Weather                                   │    │
│  │  • /news              → News                                      │    │
│  │  • /profile           → Profile                                   │    │
│  │                                                                     │    │
│  │  Admin Routes (require admin role):                               │    │
│  │  • /admin/dashboard   → AdminDashboard                            │    │
│  │  • /admin/users       → UserManagement                            │    │
│  │  • /admin/news        → ContentManagement                         │    │
│  │  • /admin/analytics   → Analytics                                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      Page Components                                │    │
│  │                                                                     │    │
│  │  Dashboard:                                                        │    │
│  │  ├── FieldList (displays all fields)                              │    │
│  │  ├── OverallHealthScore (aggregate health)                        │    │
│  │  ├── QuickActions (add field, refresh)                            │    │
│  │  └── RecentActivity (last 7 days)                                 │    │
│  │                                                                     │    │
│  │  FieldDetails:                                                     │    │
│  │  ├── FieldMap (Leaflet map with boundary)                         │    │
│  │  ├── HealthVisualization (color-coded NDVI map)                   │    │
│  │  ├── HealthMetrics (score, status, trend)                         │    │
│  │  ├── RecommendationSection (water, fertilizer, alerts)            │    │
│  │  ├── YieldForecast (prediction, revenue)                          │    │
│  │  └── HistoricalTrends (NDVI chart)                                │    │
│  │                                                                     │    │
│  │  AddField:                                                         │    │
│  │  ├── MapSelector (interactive map)                                │    │
│  │  ├── BoundaryDetection (AI processing)                            │    │
│  │  ├── BoundaryAdjustment (manual editing)                          │    │
│  │  └── FieldNameForm (name input)                                   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                   Feature Components                                │    │
│  │                                                                     │    │
│  │  Maps:                                                             │    │
│  │  • FieldMap.jsx          (Leaflet map with field boundary)        │    │
│  │  • HealthMap.jsx         (Color-coded NDVI overlay)               │    │
│  │  • MapControls.jsx       (Zoom, pan, layer toggle)                │    │
│  │                                                                     │    │
│  │  Health:                                                           │    │
│  │  • HealthScore.jsx       (0-100 score display)                    │    │
│  │  • HealthBadge.jsx       (Excellent/Good/Fair/Poor)               │    │
│  │  • HealthTrend.jsx       (Improving/Stable/Declining)             │    │
│  │  • HealthChart.jsx       (NDVI time series chart)                 │    │
│  │                                                                     │    │
│  │  Recommendations:                                                  │    │
│  │  • RecommendationCard.jsx (water, fertilizer, alert)              │    │
│  │  • ActionButton.jsx       (mark as done)                          │    │
│  │  • SavingsEstimate.jsx    (cost/water savings)                    │    │
│  │                                                                     │    │
│  │  Weather:                                                          │    │
│  │  • CurrentWeather.jsx     (current conditions)                    │    │
│  │  • ForecastCard.jsx       (daily forecast)                        │    │
│  │  • WeatherAlert.jsx       (extreme weather warning)               │    │
│  │                                                                     │    │
│  │  Yield:                                                            │    │
│  │  • YieldForecast.jsx      (prediction display)                    │    │
│  │  • RevenueEstimate.jsx    (revenue calculation)                   │    │
│  │  • ConfidenceInterval.jsx (prediction range)                      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                   Shared Components                                 │    │
│  │                                                                     │    │
│  │  UI Components:                                                    │    │
│  │  • Button.jsx, Input.jsx, Select.jsx, Textarea.jsx                │    │
│  │  • Card.jsx, Modal.jsx, Alert.jsx, Toast.jsx                      │    │
│  │  • Spinner.jsx, ProgressBar.jsx, Skeleton.jsx                     │    │
│  │  • Table.jsx, Pagination.jsx, Tabs.jsx                            │    │
│  │                                                                     │    │
│  │  Layout Components:                                                │    │
│  │  • Header.jsx, Footer.jsx, Sidebar.jsx                            │    │
│  │  • Container.jsx, Grid.jsx, Flex.jsx                              │    │
│  │  • ProtectedRoute.jsx, AdminRoute.jsx                             │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                   API Client Layer                                  │    │
│  │                                                                     │    │
│  │  Services (Axios-based):                                           │    │
│  │  • authService.js        (login, signup, logout)                  │    │
│  │  • fieldService.js       (CRUD, boundary detection)               │    │
│  │  • healthService.js      (get health, trends)                     │    │
│  │  • weatherService.js     (get forecast, alerts)                   │    │
│  │  • newsService.js        (get articles, search)                   │    │
│  │                                                                     │    │
│  │  Axios Interceptors:                                               │    │
│  │  • Request: Add JWT token, set headers                            │    │
│  │  • Response: Handle errors, refresh token, retry                  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 AI/ML Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI/ML Service (Python)                              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      Flask API Server                               │    │
│  │                                                                     │    │
│  │  Endpoints:                                                        │    │
│  │  • POST /api/ml/detect-boundary                                   │    │
│  │  • POST /api/ml/predict-yield                                     │    │
│  │  • POST /api/ml/analyze-disaster                                  │    │
│  │  • GET  /api/ml/health                                            │    │
│  │  • GET  /api/ml/models                                            │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                   ML Service Layer                                  │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐     │    │
│  │  │         Boundary Detection Service                        │     │    │
│  │  │                                                           │     │    │
│  │  │  Components:                                             │     │    │
│  │  │  ├── ImagePreprocessor                                   │     │    │
│  │  │  │   ├── Resizer (256×256)                              │     │    │
│  │  │  │   ├── Normalizer (scale to 0-1)                      │     │    │
│  │  │  │   └── ChannelStacker (RGB + NIR)                     │     │    │
│  │  │  │                                                        │     │    │
│  │  │  ├── UNetModel                                           │     │    │
│  │  │  │   ├── Encoder (4 downsampling blocks)                │     │    │
│  │  │  │   ├── Bottleneck (1024 filters)                      │     │    │
│  │  │  │   ├── Decoder (4 upsampling blocks)                  │     │    │
│  │  │  │   └── Output (sigmoid activation)                    │     │    │
│  │  │  │                                                        │     │    │
│  │  │  └── MaskPostprocessor                                   │     │    │
│  │  │      ├── Thresholder (0.5 cutoff)                       │     │    │
│  │  │      ├── MorphologyOperator (close, open)               │     │    │
│  │  │      ├── ContourExtractor (find boundaries)             │     │    │
│  │  │      ├── PolygonSimplifier (Douglas-Peucker)            │     │    │
│  │  │      └── CoordinateConverter (pixel → GPS)              │     │    │
│  │  └──────────────────────────────────────────────────────────┘     │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐     │    │
│  │  │         Yield Prediction Service                          │     │    │
│  │  │                                                           │     │    │
│  │  │  Components:                                             │     │    │
│  │  │  ├── FeatureExtractor                                    │     │    │
│  │  │  │   ├── NDVIFeatureExtractor (stats, trend)            │     │    │
│  │  │  │   ├── WeatherFeatureExtractor (rainfall, temp)       │     │    │
│  │  │  │   ├── FieldFeatureExtractor (area, location)         │     │    │
│  │  │  │   └── GrowthStageEncoder                             │     │    │
│  │  │  │                                                        │     │    │
│  │  │  ├── RandomForestModel                                   │     │    │
│  │  │  │   ├── 100 Decision Trees                             │     │    │
│  │  │  │   ├── Max Depth: 10                                  │     │    │
│  │  │  │   └── 25 Features                                    │     │    │
│  │  │  │                                                        │     │    │
│  │  │  └── PredictionPostprocessor                             │     │    │
│  │  │      ├── ConfidenceIntervalCalculator (95% CI)          │     │    │
│  │  │      ├── RevenueEstimator                               │     │    │
│  │  │      └── HarvestDateEstimator                           │     │    │
│  │  └──────────────────────────────────────────────────────────┘     │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐     │    │
│  │  │         Disaster Analysis Service                         │     │    │
│  │  │                                                           │     │    │
│  │  │  Components:                                             │     │    │
│  │  │  ├── ImageComparator (before/after NDVI)                │     │    │
│  │  │  ├── DamageClassifier (severe/moderate/minor)           │     │    │
│  │  │  ├── DamagedAreaCalculator                              │     │    │
│  │  │  └── FinancialLossEstimator                             │     │    │
│  │  └──────────────────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                   Model Management Layer                            │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐     │    │
│  │  │              Model Registry                               │     │    │
│  │  │                                                           │     │    │
│  │  │  Models:                                                 │     │    │
│  │  │  • unet_v1.0.0.h5        (boundary detection)           │     │    │
│  │  │  • yield_rf_v1.0.0.pkl   (yield prediction)             │     │    │
│  │  │                                                           │     │    │
│  │  │  Metadata:                                               │     │    │
│  │  │  • Model version, training date                          │     │    │
│  │  │  • Validation metrics (IoU, MAPE)                        │     │    │
│  │  │  • Hyperparameters                                       │     │    │
│  │  └──────────────────────────────────────────────────────────┘     │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐     │    │
│  │  │              Model Monitoring                             │     │    │
│  │  │                                                           │     │    │
│  │  │  Metrics:                                                │     │    │
│  │  │  • Inference latency (p50, p95, p99)                     │     │    │
│  │  │  • Prediction accuracy (MAPE)                            │     │    │
│  │  │  • Model drift (performance degradation)                 │     │    │
│  │  │  • Error rate                                            │     │    │
│  │  └──────────────────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. DATA FLOW DIAGRAMS

### 4.1 DFD Level 0 (Context Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Context Diagram (DFD Level 0)                       │
│                                                                              │
│                                                                              │
│  ┌──────────────┐                                        ┌──────────────┐  │
│  │   Farmers    │                                        │  Extension   │  │
│  │              │                                        │  Officers    │  │
│  └──────┬───────┘                                        └──────┬───────┘  │
│         │                                                       │           │
│         │ Field location,                                      │ Farmer    │
│         │ User credentials                                     │ support   │
│         │                                                       │           │
│         ▼                                                       ▼           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │                         SkyCrop System                               │  │
│  │                                                                      │  │
│  │  • Authenticate users                                               │  │
│  │  • Detect field boundaries (AI)                                     │  │
│  │  • Monitor crop health (NDVI, NDWI, TDVI)                          │  │
│  │  • Generate recommendations (water, fertilizer)                     │  │
│  │  • Predict yield (ML)                                               │  │
│  │  • Assess disaster damage                                           │  │
│  │  • Provide weather forecasts                                        │  │
│  │  • Manage content (news, knowledge)                                 │  │
│  │                                                                      │  │
│  └──────┬───────────────────────────────────────────────────┬──────────┘  │
│         │                                                    │              │
│         │ Health data,                                       │ Analytics,   │
│         │ Recommendations,                                   │ Reports      │
│         │ Yield predictions,                                 │              │
│         │ Weather forecasts                                  │              │
│         │                                                    │              │
│         ▼                                                    ▼              │
│  ┌──────────────┐                                        ┌──────────────┐  │
│  │   Farmers    │                                        │    Admins    │  │
│  │  (Mobile/Web)│                                        │  (Dashboard) │  │
│  └──────────────┘                                        └──────────────┘  │
│                                                                              │
│                                                                              │
│  External Data Sources:                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │ Sentinel Hub │  │OpenWeatherMap│  │ Google OAuth │                     │
│  │     API      │  │     API      │  │     2.0      │                     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                     │
│         │                 │                  │                              │
│         │ Satellite       │ Weather          │ User                         │
│         │ imagery         │ forecasts        │ authentication               │
│         │                 │                  │                              │
│         └─────────────────┴──────────────────┘                              │
│                           │                                                  │
│                           ▼                                                  │
│                    SkyCrop System                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 DFD Level 1 (System Processes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DFD Level 1 (Main Processes)                           │
│                                                                              │
│                                                                              │
│  Farmer                                                                      │
│    │                                                                          │
│    │ Credentials                                                             │
│    ▼                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Process 1.0: Authenticate User                               │           │
│  │                                                               │           │
│  │  • Validate credentials (OAuth or email/password)            │           │
│  │  • Generate JWT token                                        │           │
│  │  • Create session                                            │           │
│  └────────────────────┬─────────────────────────────────────────┘           │
│                       │ User data, JWT token                                 │
│                       ▼                                                       │
│                   [D1: Users DB]                                             │
│                       │                                                       │
│                       │ User ID                                              │
│                       ▼                                                       │
│  Farmer                                                                      │
│    │                                                                          │
│    │ Field location                                                          │
│    ▼                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Process 2.0: Manage Fields                                  │           │
│  │                                                               │           │
│  │  • Detect field boundary (AI)                                │           │
│  │  • Calculate field area                                      │           │
│  │  • Store field data                                          │           │
│  └────────────────────┬─────────────────────────────────────────┘           │
│                       │ Field data                                           │
│                       ▼                                                       │
│                   [D2: Fields DB]                                            │
│                       │                                                       │
│                       │ Field ID                                             │
│                       ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Process 3.0: Monitor Crop Health                            │           │
│  │                                                               │           │
│  │  • Retrieve satellite image                                  │           │
│  │  • Calculate NDVI, NDWI, TDVI                               │           │
│  │  • Classify health status                                    │           │
│  │  • Store health data                                         │           │
│  └────────────────────┬─────────────────────────────────────────┘           │
│                       │ Health data                                          │
│                       ▼                                                       │
│                   [D3: Health Records DB]                                    │
│                       │                                                       │
│                       │ NDVI, NDWI                                          │
│                       ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Process 4.0: Generate Recommendations                       │           │
│  │                                                               │           │
│  │  • Analyze health indices                                    │           │
│  │  • Integrate weather forecast                                │           │
│  │  • Generate water/fertilizer recommendations                 │           │
│  │  • Detect critical conditions (alerts)                       │           │
│  └────────────────────┬─────────────────────────────────────────┘           │
│                       │ Recommendations, Alerts                              │
│                       ▼                                                       │
│                   [D4: Recommendations DB]                                   │
│                       │                                                       │
│                       │ Recommendations                                      │
│                       ▼                                                       │
│  Farmer (Mobile App)                                                         │
│    │                                                                          │
│    │ Push notification                                                       │
│    ▼                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Process 5.0: Deliver Notifications                          │           │
│  │                                                               │           │
│  │  • Send push notifications (Firebase FCM)                    │           │
│  │  • Track delivery status                                     │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                              │
│                                                                              │
│  External Systems:                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │ Sentinel Hub │  │OpenWeatherMap│  │   Firebase   │                     │
│  │     API      │  │     API      │  │     FCM      │                     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                     │
│         │                 │                  │                              │
│         │ Satellite       │ Weather          │ Push                         │
│         │ imagery         │ forecasts        │ notifications                │
│         │                 │                  │                              │
│         └─────────────────┴──────────────────┘                              │
│                           │                                                  │
│                           ▼                                                  │
│                    SkyCrop System                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 DFD Level 2 (Field Boundary Detection Process)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              DFD Level 2: Field Boundary Detection Process                   │
│                                                                              │
│  Farmer                                                                      │
│    │                                                                          │
│    │ Field center coordinates (lat, lon)                                    │
│    ▼                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Process 2.1: Validate Location                              │           │
│  │                                                               │           │
│  │  • Check if within Sri Lanka bounding box                    │           │
│  │  • Check if on land (not water)                              │           │
│  └────────────────────┬─────────────────────────────────────────┘           │
│                       │ Validated coordinates                                │
│                       ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Process 2
.2: Retrieve Satellite Image                    │           │
│  │                                                               │           │
│  │  • Query Sentinel Hub API                                    │           │
│  │  • Check cache first (30-day TTL)                            │           │
│  │  • Download GeoTIFF (512×512, RGB+NIR)                      │           │
│  └────────────────────┬─────────────────────────────────────────┘           │
│                       │ Satellite image                                      │
│                       ▼                                                       │
│                   [D5: Image Cache]                                          │
│                       │                                                       │
│                       │ Image data                                           │
│                       ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Process 2.3: Preprocess Image                               │           │
│  │                                                               │           │
│  │  • Apply cloud masking (reject if >20% cloud)                │           │
│  │  • Normalize pixel values (0-1 range)                        │           │
│  │  • Resize to 256×256 (model input size)                      │           │
│  └────────────────────┬─────────────────────────────────────────┘           │
│                       │ Preprocessed image                                   │
│                       ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Process 2.4: Run AI Boundary Detection                      │           │
│  │                                                               │           │
│  │  • Load U-Net model                                           │           │
│  │  • Run inference (forward pass)                              │           │
│  │  • Generate binary mask (field vs non-field)                 │           │
│  └────────────────────┬─────────────────────────────────────────┘           │
│                       │ Binary mask                                          │
│                       ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Process 2.5: Extract Polygon                                │           │
│  │                                                               │           │
│  │  • Apply threshold (0.5)                                      │           │
│  │  • Morphological operations (close, open)                    │           │
│  │  • Find contours                                              │           │
│  │  • Select largest contour                                     │           │
│  │  • Simplify polygon (Douglas-Peucker)                        │           │
│  │  • Convert pixel → GPS coordinates                            │           │
│  └────────────────────┬─────────────────────────────────────────┘           │
│                       │ Boundary polygon (GeoJSON)                           │
│                       ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Process 2.6: Calculate Area                                 │           │
│  │                                                               │           │
│  │  • Convert to UTM projection                                  │           │
│  │  • Apply Shoelace formula                                     │           │
│  │  • Convert to hectares                                        │           │
│  │  • Validate area (0.1-50 ha)                                 │           │
│  └────────────────────┬─────────────────────────────────────────┘           │
│                       │ Boundary + Area                                      │
│                       ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Process 2.7: Store Field                                    │           │
│  │                                                               │           │
│  │  • Validate field name (unique per user)                      │           │
│  │  • Check user field limit (max 5)                             │           │
│  │  • INSERT INTO fields table                                   │           │
│  │  • Return field data                                          │           │
│  └────────────────────┬─────────────────────────────────────────┘           │
│                       │ Field data                                           │
│                       ▼                                                       │
│                   [D2: Fields DB]                                            │
│                       │                                                       │
│                       │ Field created                                        │
│                       ▼                                                       │
│                     Farmer                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. INTERFACE SPECIFICATIONS

### 5.1 REST API Endpoints

**Authentication Endpoints:**

```
POST /api/v1/auth/signup
Request:
{
  "email": "farmer@example.com",
  "password": "SecurePass123",
  "name": "Sunil Perera"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "user": {
      "user_id": "uuid-123",
      "email": "farmer@example.com",
      "name": "Sunil Perera",
      "role": "farmer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2025-11-28T12:00:00Z"
  }
}
```

**Field Management Endpoints:**

```
POST /api/v1/fields/detect-boundary
Request:
{
  "location": {
    "lat": 7.94,
    "lon": 81.01
  }
}

Response (200 OK):
{
  "success": true,
  "data": {
    "boundary": {
      "type": "Polygon",
      "coordinates": [[[81.01, 7.93], [81.02, 7.93], ...]]
    },
    "area": 2.1,
    "confidence": 0.92,
    "processing_time": 45.2
  }
}
```

**Health Monitoring Endpoints:**

```
GET /api/v1/fields/{field_id}/health

Response (200 OK):
{
  "success": true,
  "data": {
    "record_id": "uuid-789",
    "field_id": "uuid-456",
    "measurement_date": "2025-10-28",
    "ndvi": {
      "mean": 0.75,
      "min": 0.45,
      "max": 0.88,
      "std": 0.12
    },
    "ndwi": {
      "mean": 0.18,
      "min": 0.05,
      "max": 0.32,
      "std": 0.08
    },
    "health_status": "good",
    "health_score": 78,
    "trend": "improving",
    "last_updated": "2 days ago"
  }
}
```

### 5.2 Internal Service Interfaces

**Field Service → AI/ML Service:**

```javascript
// Internal API call (service-to-service)
const boundaryResult = await aiService.detectBoundary({
  image: preprocessedImage,
  location: { lat: 7.94, lon: 81.01 }
});

// Response
{
  boundary: { type: 'Polygon', coordinates: [...] },
  confidence: 0.92,
  processing_time: 45.2
}
```

**Health Service → Satellite Service:**

```javascript
// Internal API call
const satelliteImage = await satelliteService.getImage({
  fieldId: 'uuid-456',
  dateRange: { from: '2025-10-01', to: '2025-10-28' },
  bands: ['B04', 'B08', 'B11']  // Red, NIR, SWIR
});

// Response
{
  image: GeoTIFFBuffer,
  metadata: {
    acquisition_date: '2025-10-26',
    cloud_cover: 5.2,
    resolution: 10  // meters
  }
}
```

---

## 6. SEQUENCE DIAGRAMS

### 6.1 Complete User Onboarding Flow

```
User    WebApp   APIGateway  AuthSvc  GoogleOAuth  FieldSvc  SatelliteSvc  AI/ML  Database
 │        │          │          │          │          │           │          │       │
 │ Sign Up│          │          │          │          │           │          │       │
 │───────>│          │          │          │          │           │          │       │
 │        │ POST     │          │          │          │           │          │       │
 │        │ /signup  │          │          │          │           │          │       │
 │        │─────────>│          │          │          │           │          │       │
 │        │          │ OAuth    │          │          │           │          │       │
 │        │          │ redirect │          │          │           │          │       │
 │        │          │─────────────────────>│          │           │          │       │
 │        │          │          │          │ Auth     │           │          │       │
 │        │          │          │          │ code     │           │          │       │
 │        │          │<─────────────────────│          │           │          │       │
 │        │          │ Create   │          │          │           │          │       │
 │        │          │ user     │          │          │           │          │       │
 │        │          │─────────>│          │          │           │          │       │
 │        │          │          │ INSERT   │          │           │          │       │
 │        │          │          │ user     │          │           │          │       │
 │        │          │          │─────────────────────────────────────────────────>│
 │        │          │          │ User     │          │           │          │       │
 │        │          │          │ created  │          │           │          │       │
 │        │          │          │<─────────────────────────────────────────────────│
 │        │          │ JWT      │          │          │           │          │       │
 │        │          │ token    │          │          │           │          │       │
 │        │          │<─────────│          │          │           │          │       │
 │        │ Response │          │          │          │           │          │       │
 │        │ {token}  │          │          │          │           │          │       │
 │        │<─────────│          │          │          │           │          │       │
 │        │          │          │          │          │           │          │       │
 │ Add    │          │          │          │          │           │          │       │
 │ Field  │          │          │          │          │           │          │       │
 │───────>│          │          │          │          │           │          │       │
 │        │ POST     │          │          │          │           │          │       │
 │        │ /fields  │          │          │          │           │          │       │
 │        │─────────>│          │          │          │           │          │       │
 │        │          │ Create   │          │          │           │          │       │
 │        │          │ field    │          │          │           │          │       │
 │        │          │──────────────────────────────>│           │          │       │
 │        │          │          │          │          │ Get image │          │       │
 │        │          │          │          │          │──────────>│          │       │
 │        │          │          │          │          │ Image     │          │       │
 │        │          │          │          │          │<──────────│          │       │
 │        │          │          │          │          │ Detect    │          │       │
 │        │          │          │          │          │ boundary  │          │       │
 │        │          │          │          │          │──────────────────────>│       │
 │        │          │          │          │          │ Boundary  │          │       │
 │        │          │          │          │          │<──────────────────────│       │
 │        │          │          │          │          │ Store     │          │       │
 │        │          │          │          │          │ field     │          │       │
 │        │          │          │          │          │─────────────────────────────>│
 │        │          │          │          │          │ Field     │          │       │
 │        │          │          │          │          │ created   │          │       │
 │        │          │          │          │          │<─────────────────────────────│
 │        │          │ Response │          │          │           │          │       │
 │        │          │ {field}  │          │          │           │          │       │
 │        │          │<──────────────────────────────│           │          │       │
 │        │ Display  │          │          │          │           │          │       │
 │        │ field    │          │          │          │           │          │       │
 │<───────│          │          │          │          │           │          │       │
 │        │          │          │          │          │           │          │       │
```

---

## 7. DEPLOYMENT VIEW

### 7.1 Physical Deployment Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Production Environment                              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      Railway Platform                               │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐     │    │
│  │  │  Container 1: API Server (Node.js)                        │     │    │
│  │  │  • Image: node:20-alpine                                  │     │    │
│  │  │  • Port: 3000                                             │     │    │
│  │  │  • Memory: 512 MB                                         │     │    │
│  │  │  • CPU: 0.5 vCPU                                          │     │    │
│  │  │  • Replicas: 2 (high availability)                        │     │    │
│  │  └──────────────────────────────────────────────────────────┘     │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐     │    │
│  │  │  Container 2: ML Service (Python)                         │     │    │
│  │  │  • Image: python:3.11-slim                                │     │    │
│  │  │  • Port: 5000                                             │     │    │
│  │  │  • Memory: 1 GB (model loading)                           │     │    │
│  │  │  • CPU: 1 vCPU                                            │     │    │
│  │  │  • Replicas: 1                                            │     │    │
│  │  └──────────────────────────────────────────────────────────┘     │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐     │    │
│  │  │  Database 1: PostgreSQL 15                                │     │    │
│  │  │  • Storage: 10 GB                                         │     │    │
│  │  │  • Backups: Daily (30-day retention)                      │     │    │
│  │  │  • Extensions: PostGIS                                    │     │    │
│  │  └──────────────────────────────────────────────────────────┘     │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐     │    │
│  │  │  Database 2: Redis 7                                      │     │    │
│  │  │  • Memory: 512 MB                                         │     │    │
│  │  │  • Persistence: RDB snapshots                             │     │    │
│  │  └──────────────────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      MongoDB Atlas (External)                       │    │
│  │  • Cluster: M0 (free tier)                                         │    │
│  │  • Storage: 512 MB                                                 │    │
│  │  • Backups: Daily                                                  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      AWS S3 (External)                              │    │
│  │  • Bucket: skycrop-static (static assets)                         │    │
│  │  • Bucket: skycrop-satellite (satellite images)                   │    │
│  │  • Bucket: skycrop-reports (PDF reports)                          │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Network Topology

```
Internet
   │
   │ HTTPS (443)
   ▼
┌─────────────────────┐
│  Railway Load       │
│  Balancer           │
│  (Automatic)        │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐  ┌─────────┐
│ API     │  │ API     │
│ Server  │  │ Server  │
│ Instance│  │ Instance│
│    1    │  │    2    │
└────┬────┘  └────┬────┘
     │            │
     └──────┬─────┘
            │
    ┌───────┼───────┐
    │       │       │
    ▼       ▼       ▼
┌────────┐ ┌────┐ ┌────┐
│Postgres│ │Redis│ │Mongo│
│  SQL   │ │    │ │ DB  │
└────────┘ └────┘ └────┘
```

---

## 8. APPENDICES

### Appendix A: Module Dependency Matrix

| **Module** | **Auth** | **Field** | **Satellite** | **Health** | **Rec** | **AI/ML** | **Weather** | **Content** |
|------------|----------|-----------|---------------|------------|---------|-----------|-------------|-------------|
| **Auth** | - | ✓ | - | - | - | - | - | - |
| **Field** | ✓ | - | - | - | - | ✓ | - | - |
| **Satellite** | - | ✓ | - | - | - | - | - | - |
| **Health** | - | ✓ | ✓ | - | - | - | - | - |
| **Rec** | - | ✓ | - | ✓ | - | - | ✓ | - |
| **AI/ML** | - | - | ✓ | ✓ | - | - | - | - |
| **Weather** | - | ✓ | - | - | - | - | - | - |
| **Content** | ✓ | - | - | - | - | - | - | - |

✓ = Depends on

### Appendix B: Performance Budget

| **Operation** | **Target** | **Current** | **Status** |
|---------------|------------|-------------|------------|
| API Response (p95) | <3s | TBD | 🟡 To measure |
| Page Load (3G) | <5s | TBD | 🟡 To measure |
| Boundary Detection | <60s | TBD | 🟡 To measure |
| NDVI Calculation | <5s | TBD | 🟡 To measure |
| Database Query | <500ms | TBD | 🟡 To measure |

### Appendix C: Technology Versions

**Backend:**
- Node.js: 20.x LTS
- Express.js: 4.18.x
- Sequelize: 6.35.x
- Mongoose: 8.0.x
- Redis: 4.6.x

**Frontend:**
- React.js: 18.2.x
- React Native: 0.72.x
- Redux Toolkit: 1.9.x
- React Query: 5.x

**AI/ML:**
- Python: 3.11
- TensorFlow: 2.14.x
- scikit-learn: 1.3.x
- Flask: 3.0.x

---

## DOCUMENT APPROVAL

| **Name** | **Role** | **Signature** | **Date** |
|----------|----------|---------------|----------|
| [Your Name] | System Architect | 