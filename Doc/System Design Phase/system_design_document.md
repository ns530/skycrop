
# SYSTEM DESIGN DOCUMENT (SDD)

## SkyCrop: Satellite-Based Paddy Field Management & Monitoring System

---

## DOCUMENT CONTROL

| **Item** | **Details** |
|----------|-------------|
| **Document Title** | System Design Document (SDD) |
| **Project Name** | SkyCrop - Intelligent Paddy Field Monitoring System |
| **Document Code** | SKYCROP-SDD-2025-001 |
| **Version** | 1.0 |
| **Date** | October 29, 2025 |
| **Prepared By** | System Architect |
| **Reviewed By** | Technical Lead, ML Engineer |
| **Approved By** | Project Sponsor, Product Manager |
| **Status** | Approved |
| **Confidentiality** | Internal - For Development Team |

---

## EXECUTIVE SUMMARY

### System Overview

SkyCrop is a cloud-native, AI-powered agricultural intelligence platform that transforms satellite imagery into actionable farming insights for Sri Lankan paddy farmers. The system leverages Sentinel-2 satellite data, deep learning models, and precision agriculture algorithms to provide real-time crop health monitoring, predictive analytics, and decision support.

### Architecture Approach

The system follows a **hybrid architecture** combining:
- **Microservices-inspired modular design** for backend services (loosely coupled, independently deployable)
- **Monolithic deployment** for MVP (simplified operations, cost-effective for small scale)
- **Event-driven patterns** for asynchronous processing (satellite image processing, ML inference)
- **API-first design** for frontend-backend separation and future extensibility

### Key Design Decisions

1. **Technology Stack:** Node.js/Express (backend), React.js/React Native (frontend), Python (AI/ML), PostgreSQL+MongoDB (polyglot persistence)
2. **Architecture Style:** Modular monolith with clear service boundaries (easy migration to microservices in Phase 2)
3. **AI/ML Strategy:** Pre-trained models with fine-tuning (U-Net for boundaries, Random Forest for yield)
4. **Data Strategy:** Polyglot persistence (PostgreSQL for spatial data, MongoDB for flexible documents, Redis for caching)
5. **Deployment Strategy:** Cloud-native on AWS/Railway with containerization (Docker) and CI/CD automation
6. **Scalability Strategy:** Horizontal scaling with load balancing, caching layers, and database optimization

### Architecture Quality Attributes

| **Quality Attribute** | **Target** | **Design Strategy** |
|----------------------|------------|---------------------|
| **Performance** | API <3s (p95), AI <60s | Caching (Redis), CDN, async processing, optimized queries |
| **Scalability** | 1,000+ concurrent users | Horizontal scaling, load balancing, connection pooling |
| **Availability** | 99% uptime | Health monitoring, auto-restart, graceful degradation |
| **Security** | OWASP Top 10 compliant | OAuth 2.0, JWT, TLS 1.3, input validation, rate limiting |
| **Maintainability** | 80%+ test coverage | Modular design, clean code, comprehensive documentation |
| **Usability** | <3 taps to insights | Mobile-first UI, progressive disclosure, visual feedback |

---

## TABLE OF CONTENTS

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Architecture Patterns & Principles](#2-architecture-patterns--principles)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [AI/ML Architecture](#5-aiml-architecture)
6. [Data Architecture](#6-data-architecture)
7. [Integration Architecture](#7-integration-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Scalability & Performance Design](#9-scalability--performance-design)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Design Decisions & Rationale](#11-design-decisions--rationale)

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                 │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │   Web App        │  │   Mobile App     │  │  Admin Dashboard │         │
│  │   (React.js)     │  │ (React Native)   │  │   (React.js)     │         │
│  │                  │  │                  │  │                  │         │
│  │ • Responsive UI  │  │ • Android/iOS    │  │ • CMS            │         │
│  │ • Leaflet Maps   │  │ • Push Notif.    │  │ • Analytics      │         │
│  │ • Redux State    │  │ • Offline Mode   │  │ • Monitoring     │         │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘         │
│           │                     │                      │                    │
└───────────┼─────────────────────┼──────────────────────┼────────────────────┘
            │                     │                      │
            │                     ▼                      │
            │          ┌──────────────────┐             │
            │          │  Firebase FCM    │             │
            │          │ (Push Notif.)    │             │
            │          └──────────────────┘             │
            │                                            │
            └────────────────────┬───────────────────────┘
                                 │ HTTPS/REST
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY LAYER                                 │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    Express.js API Gateway                           │    │
│  │                                                                     │    │
│  │  • Authentication Middleware (JWT validation)                      │    │
│  │  • Rate Limiting (1000 req/hr per user)                           │    │
│  │  • Request Validation (Joi schemas)                               │    │
│  │  • Error Handling (centralized)                                   │    │
│  │  • Logging (Winston + Morgan)                                     │    │
│  │  • CORS (Cross-Origin Resource Sharing)                           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                  │                                           │
└──────────────────────────────────┼───────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                                   │
│                         (Business Logic Services)                            │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Auth       │  │   Field      │  │  Satellite   │  │   Weather    │  │
│  │  Service     │  │  Service     │  │   Service    │  │   Service    │  │
│  │              │  │              │  │              │  │              │  │
│  │ • OAuth      │  │ • CRUD       │  │ • Retrieval  │  │ • Forecast   │  │
│  │ • JWT        │  │ • Boundary   │  │ • Caching    │  │ • Alerts     │  │
│  │ • Session    │  │ • Area Calc  │  │ • Processing │  │ • History    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Health     │  │Recommendation│  │     AI/ML    │  │   Content    │  │
│  │  Service     │  │   Service    │  │   Service    │  │   Service    │  │
│  │              │  │              │  │              │  │              │  │
│  │ • NDVI/NDWI  │  │ • Water      │  │ • Boundary   │  │ • News       │  │
│  │ • Status     │  │ • Fertilizer │  │ • Yield Pred │  │ • CMS        │  │
│  │ • Trends     │  │ • Alerts     │  │ • Disaster   │  │ • Search     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                              │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA ACCESS LAYER                                  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    Repository Pattern (DAO)                         │    │
│  │                                                                     │    │
│  │  • UserRepository      • FieldRepository    • HealthRepository    │    │
│  │  • WeatherRepository   • NewsRepository     • AnalyticsRepository │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                  │                                           │
└──────────────────────────────────┼───────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PERSISTENCE LAYER                                   │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │   PostgreSQL     │  │    MongoDB       │  │      Redis       │         │
│  │   (Primary DB)   │  │  (Document DB)   │  │     (Cache)      │         │
│  │                  │  │                  │  │                  │         │
│  │ • Users          │  │ • News Articles  │  │ • Sessions       │         │
│  │ • Fields         │  │ • Analytics      │  │ • Weather Data   │         │
│  │ • Health Records │  │ • Logs           │  │ • Satellite Img  │         │
│  │ • Predictions    │  │ • Events         │  │ • API Responses  │         │
│  │ • PostGIS        │  │ • Time-Series    │  │ • Rate Limits    │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES LAYER                               │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Sentinel Hub │  │OpenWeatherMap│  │ Google OAuth │  │   Firebase   │  │
│  │     API      │  │     API      │  │     2.0      │  │     FCM      │  │
│  │              │  │              │  │              │  │              │  │
│  │ • Satellite  │  │ • 7-Day      │  │ • User Auth  │  │ • Push       │  │
│  │   Imagery    │  │   Forecast   │  │ • Profile    │  │   Notif.     │  │
│  │ • 10m Res    │  │ • Alerts     │  │ • SSO        │  │ • Deep Link  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 System Components Overview

**Presentation Layer:**
- **Web Application:** React.js 18 with responsive design for desktop/tablet access
- **Mobile Application:** React Native for cross-platform Android/iOS support
- **Admin Dashboard:** React.js admin interface for content and user management

**API Gateway Layer:**
- **Express.js Gateway:** Single entry point for all client requests
- **Middleware Stack:** Authentication, validation, rate limiting, logging, error handling

**Application Layer (Business Logic):**
- **Auth Service:** User authentication, authorization, session management
- **Field Service:** Field CRUD operations, boundary management, area calculation
- **Satellite Service:** Image retrieval, caching, preprocessing
- **Health Service:** Vegetation indices calculation, health status classification
- **Recommendation Service:** Water/fertilizer recommendations, alert generation
- **AI/ML Service:** Boundary detection (U-Net), yield prediction (Random Forest)
- **Weather Service:** Forecast retrieval, alert detection, integration with recommendations
- **Content Service:** News management, search, analytics

**Data Access Layer:**
- **Repository Pattern:** Abstract database operations, enable testing, support multiple databases

**Persistence Layer:**
- **PostgreSQL:** Relational data with PostGIS for spatial operations
- **MongoDB:** Flexible documents (news, analytics, logs)
- **Redis:** In-memory caching for performance optimization

**External Services:**
- **Sentinel Hub:** Satellite imagery provider (Sentinel-2, 10m resolution)
- **OpenWeatherMap:** Weather forecasts and historical data
- **Google OAuth:** User authentication and SSO
- **Firebase FCM:** Push notifications for mobile apps

### 1.3 Component Interaction Patterns

**Synchronous Interactions (Request-Response):**
- Frontend ↔ API Gateway ↔ Services (REST API, HTTPS)
- Services ↔ Repositories ↔ Databases (SQL/NoSQL queries)
- Backend ↔ External APIs (Sentinel Hub, Weather, OAuth)

**Asynchronous Interactions (Event-Driven):**
- Scheduled Jobs → Services (cron-based health updates, weather refreshes)
- Services → Message Queue → AI/ML Service (boundary detection, yield prediction)
- Services → Firebase FCM → Mobile Devices (push notifications)

**Data Flow Patterns:**
- **Read-Heavy:** Health monitoring, weather forecasts (caching critical)
- **Write-Heavy:** Analytics events, logs (batch processing, time-series optimization)
- **Compute-Heavy:** AI boundary detection, ML yield prediction (async processing, GPU acceleration)

### 1.4 Technology Stack Overview

| **Layer** | **Technology** | **Version** | **Rationale** |
|-----------|---------------|-------------|---------------|
| **Frontend (Web)** | React.js | 18.x | Component-based, large ecosystem, excellent performance |
| **Frontend (Mobile)** | React Native | 0.72.x | Cross-platform (Android/iOS), code reuse with web, native performance |
| **Backend API** | Node.js + Express | 20.x LTS + 4.x | JavaScript full-stack, async I/O, large ecosystem, easy deployment |
| **AI/ML** | Python + TensorFlow/PyTorch | 3.11 + 2.x | Industry standard for ML, rich libraries, pre-trained models |
| **Database (Relational)** | PostgreSQL + PostGIS | 15.x | ACID compliance, spatial data support, open-source, mature |
| **Database (Document)** | MongoDB | 7.x | Flexible schema, time-series, horizontal scaling, JSON-native |
| **Cache** | Redis | 7.x | In-memory speed, pub/sub, session storage, rate limiting |
| **Storage** | AWS S3 | - | Scalable object storage, CDN integration, cost-effective |
| **Authentication** | Google OAuth 2.0 + JWT | - | Secure, user-friendly, no password management burden |
| **Push Notifications** | Firebase Cloud Messaging | - | Free, reliable, cross-platform, rich features |
| **Satellite Data** | Sentinel Hub API | v3 | Free academic tier, 10m resolution, 5-day revisit, multispectral |
| **Weather Data** | OpenWeatherMap API | v2.5 | Free tier (1M calls/month), accurate, comprehensive |
| **Containerization** | Docker | 24.x | Consistent environments, easy deployment, scalability |
| **Orchestration** | Docker Compose (MVP) | 2.x | Simple multi-container management, local development |
| **CI/CD** | GitHub Actions | - | Free for public repos, integrated with GitHub, flexible workflows |
| **Hosting** | Railway (MVP) / AWS (Scale) | - | Railway: Free tier, easy deployment; AWS: Scalable, enterprise-grade |
| **Monitoring** | Prometheus + Grafana | - | Open-source, powerful metrics, customizable dashboards |

---

## 2. ARCHITECTURE PATTERNS & PRINCIPLES

### 2.1 Architectural Style

**Hybrid Architecture: Modular Monolith → Microservices Evolution**

**Phase 1 (MVP - Months 1-4): Modular Monolith**
```
┌─────────────────────────────────────────────────────────┐
│              Single Deployable Unit                      │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │   Auth     │  │   Field    │  │  Satellite │       │
│  │  Module    │  │  Module    │  │   Module   │       │
│  └────────────┘  └────────────┘  └────────────┘       │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │   Health   │  │    Rec.    │  │   Weather  │       │
│  │  Module    │  │  Module    │  │   Module   │       │
│  └────────────┘  └────────────┘  └────────────┘       │
│                                                          │
│         Shared: Database, Cache, Config                 │
└─────────────────────────────────────────────────────────┘
```

**Rationale:**
- ✅ **Simplicity:** Single codebase, easier to develop and debug
- ✅ **Cost-Effective:** Single deployment, minimal infrastructure
- ✅ **Fast Development:** No distributed system complexity
- ✅ **Team Size:** Optimal for 1-2 developers
- ✅ **Clear Boundaries:** Modules designed for future extraction

**Phase 2+ (Scale - Year 2): Microservices**
```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   Auth   │  │  Field   │  │  Health  │  │   AI/ML  │
│ Service  │  │ Service  │  │ Service  │  │ Service  │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │
     └─────────────┴─────────────┴─────────────┘
                   │
            ┌──────┴──────┐
            │   API       │
            │  Gateway    │
            └─────────────┘
```

**Migration Path:**
1. Extract AI/ML service first (compute-intensive, independent)
2. Extract Satellite service (external API dependency)
3. Extract other services as needed (based on scaling requirements)

### 2.2 Design Patterns

**Creational Patterns:**

**1. Factory Pattern (Service Creation)**
```javascript
// Service Factory for dependency injection
class ServiceFactory {
  static createFieldService(db, cache, aiService) {
    return new FieldService(
      new FieldRepository(db),
      cache,
      aiService
    );
  }
}
```
**Use Case:** Create services with dependencies, enable testing with mocks

**2. Singleton Pattern (Database Connections)**
```javascript
// Database connection singleton
class DatabaseConnection {
  static instance = null;
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new PostgresClient(config);
    }
    return this.instance;
  }
}
```
**Use Case:** Single database connection pool, prevent connection leaks

**Structural Patterns:**

**3. Repository Pattern (Data Access)**
```javascript
// Abstract data access from business logic
class FieldRepository {
  async findById(fieldId) { /* SQL query */ }
  async findByUserId(userId) { /* SQL query */ }
  async create(fieldData) { /* INSERT */ }
  async update(fieldId, data) { /* UPDATE */ }
  async delete(fieldId) { /* DELETE */ }
}
```
**Use Case:** Decouple business logic from database, enable testing, support multiple databases

**4. Adapter Pattern (External APIs)**
```javascript
// Adapt external API to internal interface
class SentinelHubAdapter {
  async getImage(bbox, date) {
    const response = await sentinelHubAPI.process(/* params */);
    return this.transformToInternalFormat(response);
  }
}
```
**Use Case:** Isolate external API changes, enable API switching (Sentinel Hub → Google Earth Engine)

**5. Facade Pattern (Complex Subsystems)**
```javascript
// Simplify complex AI/ML operations
class BoundaryDetectionFacade {
  async detectBoundary(location) {
    const image = await this.satelliteService.getImage(location);
    const preprocessed = await this.preprocessor.process(image);
    const mask = await this.unetModel.predict(preprocessed);
    const polygon = await this.postprocessor.extractPolygon(mask);
    return polygon;
  }
}
```
**Use Case:** Hide complexity of multi-step AI pipeline, provide simple interface

**Behavioral Patterns:**

**6. Strategy Pattern (Recommendation Algorithms)**
```javascript
// Pluggable recommendation strategies
class WaterRecommendationStrategy {
  recommend(ndwi, weather) {
    if (ndwi > 0.3) return "No irrigation needed";
    if (ndwi < 0.1) return "Irrigate immediately";
    return "Irrigate in 2-3 days";
  }
}

class RecommendationEngine {
  constructor(strategy) {
    this.strategy = strategy;
  }
  
  getRecommendation(data) {
    return this.strategy.recommend(data);
  }
}
```
**Use Case:** Swap recommendation algorithms, A/B testing, personalization

**7. Observer Pattern (Event Notifications)**
```javascript
// Notify subscribers of health updates
class HealthMonitor {
  observers = [];
  
  subscribe(observer) {
    this.observers.push(observer);
  }
  
  notifyHealthUpdate(fieldId, healthData) {
    this.observers.forEach(obs => obs.update(fieldId, healthData));
  }
}

// Observers: PushNotificationService, EmailService, AnalyticsService
```
**Use Case:** Decouple health monitoring from notification delivery, extensible

**8. Chain of Responsibility (Middleware)**
```javascript
// Request processing pipeline
app.use(authMiddleware);      // 1. Authenticate
app.use(validationMiddleware); // 2. Validate
app.use(rateLimitMiddleware);  // 3. Rate limit
app.use(loggingMiddleware);    // 4. Log
app.use(errorMiddleware);      // 5. Handle errors
```
**Use Case:** Modular request processing, easy to add/remove middleware

### 2.3 SOLID Principles Application

**Single Responsibility Principle (SRP):**
- Each service has one responsibility (Auth, Field, Health, etc.)
- Each repository manages one entity (UserRepository, FieldRepository)
- Each controller handles one resource (UserController, FieldController)

**Example:**
```javascript
// ✅ Good: Single responsibility
class FieldService {
  async createField(userId, boundary) { /* Only field creation logic */ }
}

class HealthService {
  async calculateNDVI(fieldId) { /* Only health calculation logic */ }
}

// ❌ Bad: Multiple responsibilities
class FieldService {
  async createField() { /* Field creation */ }
  async calculateNDVI() { /* Health calculation - should be separate */ }
  async sendNotification() { /* Notification - should be separate */ }
}
```

**Open/Closed Principle (OCP):**
- Services open for extension (add new recommendation strategies) but closed for modification
- Use interfaces/abstract classes for extensibility

**Example:**
```javascript
// Base recommendation strategy (open for extension)
class RecommendationStrategy {
  recommend(data) {
    throw new Error("Must implement recommend()");
  }
}

// Extend without modifying base
class WaterRecommendationStrategy extends RecommendationStrategy {
  recommend(ndwi, weather) { /* Water-specific logic */ }
}

class FertilizerRecommendationStrategy extends RecommendationStrategy {
  recommend(ndvi, growthStage) { /* Fertilizer-specific logic */ }
}
```

**Liskov Substitution Principle (LSP):**
- Derived classes can replace base classes without breaking functionality
- All repositories implement common interface (CRUD operations)

**Example:**
```javascript
// Base repository interface
class BaseRepository {
  async findById(id) { /* ... */ }
  async create(data) { /* ... */ }
  async update(id, data) { /* ... */ }
  async delete(id) { /* ... */ }
}

// Substitutable implementations
class PostgresFieldRepository extends BaseRepository { /* ... */ }
class MongoFieldRepository extends BaseRepository { /* ... */ }
```

**Interface Segregation Principle (ISP):**
- Clients depend only on interfaces they use
- Separate interfaces for different user roles (Farmer, Admin)

**Example:**
```javascript
// ✅ Good: Segregated interfaces
interface FarmerAPI {
  getFields();
  getHealthData();
  getRecommendations();
}

interface AdminAPI {
  getAllUsers();
  publishArticle();
  viewAnalytics();
}

// ❌ Bad: Fat interface
interface API {
  getFields();
  getAllUsers();      // Farmers don't need this
  publishArticle();   // Farmers don't need this
}
```

**Dependency Inversion Principle (DIP):**
- High-level modules depend on abstractions, not concrete implementations
- Use dependency injection for testability

**Example:**
```javascript
// ✅ Good: Depend on abstraction
class FieldService {
  constructor(fieldRepository, aiService) {  // Inject dependencies
    this.fieldRepository = fieldRepository;
    this.aiService = aiService;
  }
}

// ❌ Bad: Depend on concrete implementation
class FieldService {
  constructor() {
    this.fieldRepository = new PostgresFieldRepository();  // Hard-coded
    this.aiService = new UNetService();                    // Hard-coded
  }
}
```

### 2.4 Separation of Concerns

**Layered Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer (UI/UX)                             │
│  • React components, state management, routing          │
│  • Concerns: User interaction, display logic            │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────┐
│  API Layer (Controllers)                                │
│  • Request handling, response formatting                │
│  • Concerns: HTTP protocol, validation, serialization   │
└────────────────────┬────────────────────────────────────┘
                     │ Function calls
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Business Logic Layer (Services)                        │
│  • Domain logic, business rules, workflows              │
│  • Concerns: Application logic, orchestration           │
└────────────────────┬────────────────────────────────────┘
                     │ Repository interface
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Data Access Layer (Repositories)                       │
│  • Database queries, ORM, caching                       │
│  • Concerns: Data persistence, retrieval                │
└────────────────────┬────────────────────────────────────┘
                     │ SQL/NoSQL
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Persistence Layer (Databases)                          │
│  • PostgreSQL, MongoDB, Redis                           │
│  • Concerns: Data storage, indexing, transactions       │
└─────────────────────────────────────────────────────────┘
```

**Cross-Cutting Concerns:**
- **Logging:** Winston (structured logging, multiple transports)
- **Error Handling:** Centralized error middleware, custom error classes
- **Security:** Authentication middleware, input validation, rate limiting
- **Monitoring:** Prometheus metrics, health checks, alerting

---

## 3. FRONTEND ARCHITECTURE

### 3.1 Web Application Architecture (React.js)

**Technology Stack:**
- **Framework:** React.js 18.2 (functional components, hooks)
- **State Management:** Redux Toolkit 1.9 (global state) + React Query 4.x (server state)
- **Routing:** React Router 6.x (client-side routing, lazy loading)
- **UI Framework:** Tailwind CSS 3.x (utility-first, responsive)
- **Maps:** Leaflet.js 1.9 + React-Leaflet (open-source, lightweight)
- **Charts:** Recharts 2.x (React-native charts, responsive)
- **Forms:** React Hook Form 7.x (performance, validation)
- **HTTP Client:** Axios 1.x (interceptors, request/response transformation)

**Architecture Diagram:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Web Application                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  Routing Layer                          │    │
│  │              (React Router 6.x)                         │    │
│  │                                                         │    │
│  │  /login          → LoginPage                           │    │
│  │  /signup         → SignupPage                          │    │
│  │  /dashboard      → Dashboard (Protected)               │    │
│  │  /fields/:id     → FieldDetails (Protected)            │    │
│  │  /fields/new     → AddField (Protected)                │    │
│  │  /weather        → Weather (Protected)                 │    │
│  │  /news           → News (Protected)                    │    │
│  │  /admin/*        → AdminDashboard (Admin Only)         │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              State Management Layer                     │    │
│  │                                                         │    │
│  │  ┌──────────────────┐  ┌──────────────────┐          │    │
│  │  │  Redux Store     │  │  React Query     │          │    │
│  │  │  (Global State)  │  │ (Server State)   │          │    │
│  │  │                  │  │                  │          │    │
│  │  │ • auth           │  │ • fields         │          │    │
│  │  │ • user           │  │ • health         │          │    │
│  │  │ • ui             │  │ • weather        │          │    │
│  │  │ • notifications  │  │ • news           │          │    │
│  │  └──────────────────┘  └──────────────────┘          │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Component Layer                            │    │
│  │                                                         │    │
│  │  Pages (Route Components):                             │    │
│  │  • Dashboard.jsx                                       │    │
│  │  • FieldDetails.jsx                                    │    │
│  │  • AddField.jsx                                        │    │
│  │                                                         │    │
│  │  Feature Components:                                   │    │
│  │  • FieldMap.jsx (Leaflet map)                         │    │
│  │  • HealthVisualization.jsx (color-coded map)          │    │
│  │  • RecommendationCard.jsx                             │    │
│  │  • YieldForecast.jsx                                  │    │
│  │  • WeatherWidget.jsx                                  │    │
│  │                                                         │    │
│  │  Shared Components:                                    │    │
│  │  • Button, Input, Card, Modal, Spinner, Alert         │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Service Layer (API Client)                 │    │
│  │                                                         │    │
│  │  • authService.js    (login, signup, logout)          │    │
│  │  • fieldService.js   (CRUD, boundary detection)       │    │
│  │  • healthService.js  (get health data, trends)        │    │
│  │  • weatherService.js (get forecast, alerts)           │    │
│  │  • newsService.js    (get articles, search)           │    │
│  │                                                         │    │
│  │  Axios Interceptors:                                   │    │
│  │  • Request: Add JWT token, set headers                │    │
│  │  • Response: Handle errors, refresh token             │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTPS/REST
                            ▼
                    Backend API Gateway
```

**Component Hierarchy:**

```
App
├── Router
│   ├── PublicRoutes
│   │   ├── LoginPage
│   │   ├── SignupPage
│   │   └── LandingPage
│   │
│   └── ProtectedRoutes (require authentication)
│       ├── Dashboard
│       │   ├── FieldList
│       │   │   └── FieldCard (×N)
│       │   ├── OverallHealthScore
│       │   └── QuickActions
│       │
│       ├── FieldDetails
│       │   ├── FieldMap (Leaflet)
│       │   ├── HealthVisualization
│       │   │   ├── HealthMap (color-coded)
│       │   │   ├── HealthScore
│       │   │   └── HealthTrend
│       │   ├── RecommendationSection
│       │   │   ├── WaterRecommendation
│       │   │   ├── FertilizerRecommendation
│       │   │   └── AlertBanner
│       │   ├── YieldForecast
│       │   └── HistoricalTrends (Chart)
│       │
│       ├── AddField
│       │   ├── MapSelector (Leaflet)
│       │   ├── BoundaryDetection
│       │   │   ├── ProgressIndicator
│       │   │   └── BoundaryOverlay
│       │   └── FieldNameForm
│       │
│       ├── Weather
│       │   ├── CurrentWeather
│       │   ├── ForecastCards (×7)
│       │   └── WeatherAlerts
│       │
│       ├── News
│       │   ├── CategoryTabs
│       │   ├── ArticleList
│       │   │   └── ArticleCard (×N)
│       │   └── SearchBar
│       │
│       └── Profile
│           ├── ProfileInfo
│           ├── FieldsSummary
│           └── Settings
```

**State Management Strategy:**

**Redux Store (Global Application State):**
```javascript
{
  auth: {
    user: { id, email, name, role },
    token: "jwt_token",
    isAuthenticated: true
  },
  ui: {
    sidebarOpen: false,
    theme: "light",
    language: "en"
  },
  notifications: [
    { id, type, message, read: false }
  ]
}
```

**React Query (Server State - Cached):**
```javascript
// Automatic caching, refetching, background updates
const { data: fields } = useQuery('fields', fetchFields, {
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 30 * 60 * 1000  // 30 minutes
});

const { data: health } = useQuery(['health', fieldId], () => fetchHealth(fieldId), {
  refetchInterval: 5 * 60 * 1000  // Refetch every 5 minutes
});
```

**Component State (Local UI State):**
```javascript
// Use useState for component-specific state
const [isMapExpanded, setIsMapExpanded] = useState(false);
const [selectedIndex, setSelectedIndex] = useState('ndvi');
```

**Routing Strategy:**

**Code Splitting (Lazy Loading):**
```javascript
// Lazy load routes for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FieldDetails = lazy(() => import('./pages/FieldDetails'));
const AddField = lazy(() => import('./pages/AddField'));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/fields/:id" element={<FieldDetails />} />
    <Route path="/fields/new" element={<AddField />} />
  </Routes>
</Suspense>
```

**Protected Routes:**
```javascript
// Require authentication for certain routes
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/fields/*" element={<FieldRoutes />} />
</Route>

// Admin-only routes
<Route element={<AdminRoute />}>
  <Route path="/admin/*" element={<AdminDashboard />} />
</Route>
```

### 3.2 Mobile Application Architecture (React Native)

**Technology Stack:**
- **Framework:** React Native 0.72 (cross-platform)
- **Navigation:** React Navigation 6.x (stack, tab, drawer)
- **State Management:** Redux Toolkit + React Query (same as web)
- **Maps:** React Native Maps (native map components)
- **Push Notifications:** React Native Firebase 18.x
- **Offline Storage:** AsyncStorage + WatermelonDB (SQLite-based)
- **HTTP Client:** Axios (same as web, code reuse)

**Architecture Diagram:**

```
┌─────────────────────────────────────────────────────────────────┐
│              React Native Mobile Application                     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Navigation Layer                           │    │
│  │          (React Navigation 6.x)                         │    │
│  │                                                         │    │
│  │  Bottom Tab Navigator:                                 │    │
│  │  ├── Home (Stack Navigator)                           │    │
│  │  │   ├── Dashboard                                    │    │
│  │  │   └── FieldDetails                                 │    │
│  │  ├── Weather                                          │    │
│  │  ├── News                                             │    │
│  │  └── Profile                                          │    │
│  │                                                         │    │
│  │  Modal Stack:                                          │    │
│  │  ├── AddField (Map Selection)                         │    │
│  │  ├── BoundaryAdjustment                               │    │
│  │  └── DisasterAssessment                               │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           State Management Layer                        │    │
│  │                                                         │    │
│  │  Redux Store (same structure as web)                  │    │
│  │  React Query (server state caching)                   │    │
│  │  AsyncStorage (persistent local storage)              │    │
│  │  WatermelonDB (offline-first database)                │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Component Layer                            │    │
│  │                                                         │    │
│  │  Screens:                                              │    │
│  │  • DashboardScreen.tsx                                │    │
│  │  • FieldDetailsScreen.tsx                             │    │
│  │  • AddFieldScreen.tsx                                 │    │
│  │  • WeatherScreen.tsx                                  │    │
│  │  • NewsScreen.tsx                                     │    │
│  │                                                         │    │
│  │  Components:                                           │    │
│  │  • FieldMap (React Native Maps)                       │    │
│  │  • HealthVisualization                                │    │
│  │  • RecommendationCard                                 │    │
│  │  • WeatherWidget                                      │    │
│  │                                                         │    │
│  │  Shared:                                               │    │
│  │  • Button, Input, Card, Modal (platform-specific)     │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           Native Modules Layer                          │    │
│  │                                                         │    │
│  │  • GPS Location (react-native-geolocation)            │    │
│  │  • Push Notifications (react-native-firebase)         │    │
│  │  • Camera (react-native-camera) [Phase 2]             │    │
│  │  • File System (react-native-fs)                      │    │
│  │  • Share (react-native-share)                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
                  Backend API + Firebase
```

**Offline-First Strategy:**

**Data Synchronization:**
```javascript
// WatermelonDB schema for offline storage
const fieldSchema = {
  name: 'fields',
  columns: [
    { name: 'field_id', type: 'string', isIndexed: true },
    { name: 'name', type: 'string' },
    { name: 'boundary', type: 'string' },  // GeoJSON
    { name: 'area', type: 'number' },
    { name: 'synced', type: 'boolean' },
    { name: 'updated_at', type: 'number' }
  ]
};

// Sync strategy
class SyncManager {
  async syncFields() {
    // 1. Upload local changes to server
    const unsyncedFields = await db.fields.query(Q.where('synced', false));
    await Promise.all(unsyncedFields.map(field => api.updateField(field)));
    
    // 2. Download server changes
    const serverFields = await api.getFields();
    await db.write(async () => {
      serverFields.forEach(field => db.fields.create(field));
    });
    
    // 3. Mark as synced
    await db.write(async () => {
      unsyncedFields.forEach(field => field.update({ synced: true }));
    });
  }
}
```

**Offline Capabilities:**
- ✅ View cached health data (last 30 days)
- ✅ View cached weather forecast (last update)
- ✅ View cached news articles (last 50 articles)
- ✅ View field boundaries and maps (cached tiles)
- ❌ Cannot add new fields (requires satellite API)
- ❌ Cannot refresh health data (requires satellite API)

**Platform-Specific Adaptations:**

**Android (Material Design):**
```javascript
// Android-specific components
<FloatingActionButton onPress={addField} />
<Snackbar message="Field saved" />
<MaterialBottomTabs />
```

**iOS (Human Interface Guidelines):**
```javascript
// iOS-specific components
<TabBar style="iOS" />
<Alert title="Success" message="Field saved" />
<NavigationBar translucent />
```

### 3.3 Component Design Patterns

**Container/Presentational Pattern:**

```javascript
// Container (Smart Component) - handles logic, state
const FieldDetailsContainer = () => {
  const { fieldId } = useParams();
  const { data: field, isLoading } = useQuery(['field', fieldId], () => fetchField(fieldId));
  const { data: health } = useQuery(['health', fieldId], () => fetchHealth(fieldId));
  
  if (isLoading) return <LoadingSpinner />;
  
  return <FieldDetailsView field={field} health={health} />;
};

// Presentational (Dumb Component) - only displays data
const FieldDetailsView = ({ field, health }) => (
  <div>
    <FieldMap boundary={field.boundary} health={health.ndvi} />
    <HealthScore score={health.score} status={health.status} />
    <RecommendationList recommendations={health.recommendations} />
  </div>
);
```

**Compound Component Pattern:**

```javascript
// Flexible, composable components
<FieldCard>
  <FieldCard.Image src={field.thumbnail} />
  <FieldCard.Title>{field.name}</FieldCard.Title>
  <FieldCard.HealthBadge status={field.health_status} />
  <FieldCard.Actions>
    <Button onClick={viewDetails}>View</Button>
    <Button onClick={editField}>Edit</Button>
  </FieldCard.Actions>
</FieldCard>
```

**Render Props Pattern (for reusable logic):**

```javascript
// Reusable data fetching logic
<DataFetcher url="/api/fields">
  {({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <Error message={error} />;
    return <FieldList fields={data} />;
  }}
</DataFetcher>
```

### 3.4 Performance Optimization

**Code Splitting:**
```javascript
// Split by route (lazy loading)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FieldDetails = lazy(() => import('./pages/FieldDetails'));

// Split by feature (dynamic imports)
const loadMapLibrary = () => import('leaflet');
```

**Memoization:**
```javascript
// Prevent unnecessary re-renders
const FieldCard = memo(({ field }) => {
  return <Card>{field.name}</Card>;
}, (prevProps, nextProps) => prevProps.field.id === nextProps.field.id);

// Memoize expensive calculations
const healthScore = useMemo(() => calculateHealthScore(ndvi), [ndvi]);
```

**Virtual Scrolling:**
```javascript
// Render only visible items (large lists)
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={fields.length}
  itemSize={100}
>
  {({ index, style }) => (
    <FieldCard field={fields[index]} style={style} />
  )}
</FixedSizeList>
```

**Image Optimization:**
```javascript
// Lazy load images, use WebP format
<img 
  src={field.thumbnail} 
  loading="lazy" 
  srcSet={`${field.thumbnail}.webp 1x, ${field.thumbnail}@2x.webp 2x`}
  alt={field.name}
/>
```

---

## 4. BACKEND ARCHITECTURE

### 4.1 API Architecture (RESTful Design)

**API Design Principles:**
- **Resource-Oriented:** URLs represent resources (nouns, not verbs)
- **HTTP Methods:** GET (read), POST (create), PUT (update), DELETE (delete)
- **Stateless:** Each request contains all necessary information (JWT token)
- **Versioned:** `/api/v1/` prefix for future compatibility
- **Consistent:** Standard response format, error codes, naming conventions

**API Endpoint Structure:**

```
Base URL: https://api.skycrop.com/v1

Authentication:
POST   /auth/signup              - Register new user
POST   /auth/login               - Login user
POST   /auth/logout              - Logout user
POST   /auth/refresh             - Refresh JWT token
POST   /auth/forgot-password     - Request password reset
POST   /auth/reset-password      - Reset password
GET    /auth/verify-email/:token - Verify email

Users:
GET    /users/me                 - Get current user profile
PUT    /users/me                 - Update user profile
DELETE /users/me                 - Delete user account
GET    /users/me/fields          - Get user's fields

Fields:
GET    /fields                   - List user's fields
POST   /fields                   - Create new field
GET    /fields/:id               - Get field details
PUT    /fields/:id               - Update field
DELETE /fields/:id               - Delete field
POST   /fields/detect-boundary   - AI boundary detection
PUT    /fields/:id/boundary      - Update boundary manually

Health:
GET    /fields/:id/health        - Get latest health data
GET    /fields/:id/health/history - Get health history (6 months)
GET    /fields/:id/health/trends - Get health trends (charts)
POST   /fields/:id/health/refresh - Force health data refresh

Recommendations:
GET    /fields/:id/recommendations - Get current recommendations
GET    /fields/:id/recommendations/history - Get recommendation history
PUT    /recommendations/:id/status - Mark recommendation as done/ignored

Yield:
GET    /fields/:id/yield          - Get yield prediction
POST   /fields/:id/yield/actual   - Submit actual yield
GET    /fields/:id/yield/history  - Get yield history

Weather:
GET    /weather/forecast          - Get 7-day forecast (by field location)
GET    /weather/current           - Get current weather
GET    /weather/history           - Get historical weather (30 days)
GET    /weather/alerts            - Get weather alerts

Disaster:
POST   /disaster/assess           - Assess disaster damage
GET    /disaster/assessments      - List user's assessments
GET    /disaster/assessments/:id  - Get assessment details
GET    /disaster/assessments/:id/report - Download PDF report

News:
GET    /news                      - List news articles (paginated)
GET    /news/:id                  - Get article details
GET    /news/search               - Search articles
GET    /news/categories           - List categories

Admin:
GET    /admin/users               - List all users
PUT    /admin/users/:id/suspend   - Suspend user
DELETE /admin/users/:id           - Delete user
POST   /admin/news                - Create news article
PUT    /admin/news/:id            - Update news article
DELETE /admin/news/:id            - Delete news article
GET    /admin/analytics           - Get analytics dashboard
GET    /admin/system/health       - Get system health metrics
```

**Request/Response Format:**

**Standard Success Response:**
```json
{
  "success": true,
  "data": {
    "field_id": "uuid-123",
    "name": "Main Field",
    "area": 2.1,
    "boundary": { "type": "Polygon", "coordinates": [...] }
  },
  "meta": {
    "timestamp": "2025-10-29T12:00:00Z",
    "request_id": "req-abc123"
  }
}
```

**Standard Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "FIELD_NOT_FOUND",
    "message": "Field with ID 'uuid-123' not found",
    "details": {
      "field_id": "uuid-123",
      "user_id": "uuid-456"
    }
  },
  "meta": {
    "timestamp": "2025-10-29T12:00:00Z",
    "request_id": "req-abc123"
  }
}
```

**Pagination Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "title": "Article 1" },
    { "id": 2, "title": "Article 2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

### 4.2 Service Layer Organization

**Service Architecture:**

```
backend/
├── src/
│   ├── api/                    # API Layer (Controllers)
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── field.controller.js
│   │   │   ├── health.controller.js
│   │   │   ├── recommendation.controller.js
│   │   │   ├── weather.controller.js
│   │   │   ├── disaster.controller.js
│   │   │   ├── news.controller.js
│   │   │   └── admin.controller.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── field.routes.js
│   │   │   ├── health.routes.js
│   │   │   └── ...
│   │   │
│   │   └── middleware/
│   │       ├── auth.middleware.js      # JWT validation
│   │       ├── validation.middleware.js # Request validation
│   │       ├── rateLimit.middleware.js # Rate limiting
│   │       ├── error.middleware.js     # Error handling
│   │       └── logging.middleware.js   # Request logging
│   │
│   ├── services/               # Business Logic Layer
│   │   ├── auth.service.js
│   │   ├── field.service.js
│   │   ├── satellite.service.js
│   │   ├── health.service.js
│   │   ├── recommendation.service.js
│   │   ├── weather.service.js
│   │   ├── disaster.service.js
│   │   ├── news.service.js
│   │   └── analytics.service.js
│   │
│   ├── repositories/           # Data Access Layer
│   │   ├── user.repository.js
│   │   ├── field.repository.js
│   │   ├── health.repository.js
│   │   ├── weather.repository.js
│   │   ├── news.repository.js
│   │   └── base.repository.js  # Abstract base class
│   │
│   ├── models/                 # Database Models (ORM)
│   │   ├── user.model.js       # Sequelize models (PostgreSQL)
│   │   ├── field.model.js
│   │   ├── health.model.js
│   │   ├── news.model.js       # Mongoose models (MongoDB)
│   │   └── analytics.model.js
│   │
│   ├── integrations/           # External API Clients
│   │   ├── sentinelHub.client.js
│   │   ├── openWeather.client.js
│   │   ├── googleOAuth.client.js
│   │   ├── firebase.client.js
│   │   └── adapters/           # Adapter pattern
│   │       ├── sentinelHub.adapter.js
│   │       └── weather.adapter.js
│   │
│   ├── ai/                     # AI/ML Integration
│   │   ├── boundaryDetection.client.js  # Call Python ML service
│   │   ├── yieldPrediction.client.js
│   │   └── disasterAnalysis.client.js
│   │
│   ├── utils/                  # Utilities
│   │   ├── gis.utils.js        # GIS calculations (area, distance)
│   │   ├── validation.utils.js # Input validation helpers
│   │   ├── crypto.utils.js     # Encryption, hashing
│   │   ├── date.utils.js       # Date formatting, timezone
│   │   └── logger.js           # Winston logger configuration
│   │
│   ├── config/                 # Configuration
│   │   ├── database.config.js  # DB connection settings
│   │   ├── redis.config.js     # Redis connection
│   │   ├── api.config.js       # External API keys
│   │   └── app.config.js       # App settings
│   │
│   ├── jobs/                   # Scheduled Jobs (Cron)
│   │   ├── healthUpdate.job.js      # Daily health monitoring
│   │   ├── weatherUpdate.job.js     # 6-hour weather refresh
│   │   ├── yieldUpdate.job.js       # 10-day yield prediction
│   │   └── cacheCleanup.job.js      # 30-day cache cleanup
│   │
│   └── app.js                  # Express app initialization
│
├── tests/                      # Test Suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── package.json
```

**Service Layer Example:**

```javascript
// field.service.js - Business logic for field management
class FieldService {
  constructor(fieldRepository, aiService, satelliteService, cacheService) {
    this.fieldRepository = fieldRepository;
    this.aiService = aiService;
    this.satelliteService = satelliteService;
    this.cacheService = cacheService;
  }
  
  async createField(userId, location, name) {
    // 1. Validate inputs
    this.validateLocation(location);
    this.validateFieldName(name);
    
    // 2. Check user field limit (5 fields max in Phase 1)
    const userFields = await this.fieldRepository.findByUserId(userId);
    if (userFields.length >= 5) {
      throw new BusinessError('MAX_FIELDS_REACHED', 'You have reached the maximum of 5 fields');
    }
    
    // 3. Detect boundary using AI
    const boundary = await this.aiService.detectBoundary(location);
    
    // 4. Calculate area
    const area = this.calculateArea(boundary);
    
    // 5. Save field to database
    const field = await this.fieldRepository.create({
      user_id: userId,
      name,
      boundary,
      area,
      center: location,
      status: 'active'
    });
    
    // 6. Initiate first health monitoring (async)
    this.initiateHealthMonitoring(field.field_id);
    
    // 7. Return field
    return field;
  }
  
  validateLocation(location) {
    // Sri Lanka bounding box: 5.9°N-9.9°N, 79.5°E-82.0°E
    if (location.lat < 5.9 || location.lat > 9.9) {
      throw new ValidationError('INVALID_LOCATION', 'Location must be within Sri Lanka');
    }
    if (location.lon < 79.5 || location.lon > 82.0) {
      throw new ValidationError('INVALID_LOCATION', 'Location must be within Sri Lanka');
    }
  }
  
  calculateArea(boundary) {
    // Use Shoelace formula for polygon area
    return GISUtils.calculatePolygonArea(boundary);
  }
  
  async initiateHealthMonitoring(fieldId) {
    // Queue async job for health monitoring
    await this.jobQueue.add('health-monitoring', { fieldId });
  }
}
```

### 4.3 Business Logic Layer

**Service Responsibilities:**

**Auth Service:**
- User registration (OAuth, email/password)
- Login/logout
- JWT token generation and validation
- Password hashing and verification
- Session management
- Account security (lock after failed attempts)

**Field Service:**
- Field CRUD operations
- Boundary validation and storage
- Area calculation (GIS operations)
- Multi-field management
- Field archival and deletion

**Satellite Service:**
- Sentinel Hub API integration
- Image retrieval and caching
- Cloud masking
- Image preprocessing
- Cache management (30-day retention)

**Health Service:**
- Vegetation indices calculation (NDVI, NDWI, TDVI)
- Health status classification
- Trend analysis
- Historical data management
- Scheduled health updates

**Recommendation Service:**
- Water recommendation generation (NDWI-based)
- Fertilizer recommendation generation (NDVI-based)
- Alert detection (critical conditions)
- Weather integration
- Recommendation history tracking

**AI/ML Service:**
- Boundary detection (U-Net model)
- Yield prediction (Random Forest model)
- Disaster damage analysis
- Model versioning and monitoring

**Weather Service:**
- OpenWeatherMap API integration
- Forecast retrieval and caching
- Weather alert detection
- Historical weather data

**Content Service:**
- News article management (CRUD)
- Search and filtering
- Category management
- Analytics tracking (views, shares)

**Analytics Service:**
- User event tracking
- System metrics collection
- Business metrics calculation
- Dashboard data aggregation

### 4.4 Data Access Layer

**Repository Pattern Implementation:**

```javascript
// base.repository.js - Abstract base repository
class BaseRepository {
  constructor(model) {
    this.model = model;
  }
  
  async findById(id) {
    return await this.model.findByPk(id);
  }
  
  async findAll(where = {}, options = {}) {
    return await this.model.findAll({ where, ...options });
  }
  
  async create(data) {
    return await this.model.create(data);
  }
  
  async update(id, data) {
    const record = await this.findById(id);
    if (!record) throw new NotFoundError('Record not found');
    return await record.update(data);
  }
  
  async delete(id) {
    const record = await this.findById(id);
    if (!record) throw new NotFoundError('Record not found');
    return await record.destroy();
  }
}

// field.repository.js - Field-specific repository
class FieldRepository extends BaseRepository {
  constructor() {
    super(FieldModel);  // Sequelize model
  }
  
  async findByUserId(userId) {
    return await this.model.findAll({
      where: { user_id: userId, status: 'active' },
      order: [['created_at', 'DESC']]
    });
  }
  
  async findWithinBoundingBox(bbox) {
    // PostGIS spatial query
    return await this.model.findAll({
      where: sequelize.where(
        sequelize.fn('ST_Intersects', 
          sequelize.col('boundary'), 
          sequelize.fn('ST_MakeEnvelope', bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat, 4326)
        ),
        true
      )
    });
  }
  
  async calculateTotalArea(userId) {
    // Aggregate query
    const result = await this.model.sum('area', {
      where: { user_id: userId, status: 'active' }
    });
    return result || 0;
  }
}
```

**Database Transaction Management:**

```javascript
// Use transactions for data consistency
async createFieldWithHealthMonitoring(userId, fieldData) {
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Create field
    const field = await FieldModel.create(fieldData, { transaction });
    
    // 2. Create initial health record
    const health = await HealthModel.create({
      field_id: field.field_id,
      status: 'pending'
    }, { transaction });
    
    // 3. Commit transaction
    await transaction.commit();
    
    return { field, health };
  } catch (error) {
    // Rollback on error
    await transaction.rollback();
    throw error;
  }
}
```

### 4.5 Middleware and Utilities

**Authentication Middleware:**

```javascript
// auth.middleware.js
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // 2. Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Check token blacklist (logged out users)
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token invalidated' });
    }
    
    // 4. Attach user to request
    req.user = {
      userId: decoded.user_id,
      email: decoded.email,
      role: decoded.role
    };
    
    // 5. Update last seen
    await redis.set(`user:${decoded.user_id}:last_seen`, Date.now());
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Rate Limiting Middleware:**

```javascript
// rateLimit.middleware.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:'
  }),
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 1000,                  // 1000 requests per hour per user
  keyGenerator: (req) => req.user?.userId || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retry_after: 3600
      }
    });
  }
});
```

**Validation Middleware:**

```javascript
// validation.middleware.js
const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,  // Return all errors
      stripUnknown: true  // Remove unknown fields
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: errors
        }
      });
    }
    
    req.validatedBody = value;
    next();
  };
};

// Usage
const createFieldSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  location: Joi.object({
    lat: Joi.number().min(5.9).max(9.9).required(),
    lon: Joi.number().min(79.5).max(82.0).required()
  }).required()
});

router.post('/fields', validateRequest(createFieldSchema), fieldController.create);
```

**Error Handling Middleware:**

```javascript
// error.middleware.js
class AppError extends Error {
  constructor(code, message, statusCode = 500, details = {}) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super('NOT_FOUND', message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super('UNAUTHORIZED', message, 401);
  }
}

// Centralized error handler
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    code: err.code,
    user: req.user?.userId,
    endpoint: req.path,
    method: req.method
  });
  
  // Send error response
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Something went wrong',
      details: err.details || {}
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: req.id
    }
  });
};
```

---

## 5. AI/ML ARCHITECTURE

### 5.1 ML Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ML Pipeline Architecture                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              1. Data Collection                         │    │
│  │                                                         │    │
│  │  • Sentinel-2 satellite imagery (Sentinel Hub API)    │    │
│  │  • Historical yield data (Dept. of Agriculture)       │    │
│  │  • Weather data (OpenWeatherMap API)                  │    │
│  │  • Ground truth labels (manual annotation)            │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              2. Data Preprocessing                      │    │
│  │                                                         │    │
│  │  • Cloud masking (remove cloudy pixels)               │    │
│  │  • Normalization (scale to 0-1)                       │    │
│  │  • Augmentation (rotation, flip, brightness)          │    │
│  │  • Feature engineering (NDVI time series, stats)      │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              3. Model Training                          │    │
│  │                                                         │    │
│  │  U-Net (Boundary Detection):                          │    │
│  │  • Architecture: Encoder-Decoder with skip connections│    │
│  │  • Loss: Binary Cross-Entropy + Dice Loss             │    │
│  │  • Optimizer: Adam (lr=0.001)                         │    │
│  │  • Epochs: 50 (early stopping)                        │    │
│  │  • Validation: 85%+ IoU                               │    │
│  │                                                         │    │
│  │  Random Forest (Yield Prediction):                    │    │
│  │  • Trees: 100, Max Depth: 10                          │    │
│  │  • Features: 25 (NDVI stats, weather, area)          │    │
│  │  • Validation: MAPE <15%                              │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              4. Model Evaluation                        │    │
│  │                                                         │    │
│  │  • Validation metrics (IoU, MAPE, F1-score)           │    │
│  │  • Test set evaluation (held-out 20%)                 │    │
│  │  • Cross-validation (5-fold)                          │    │
│  │  • Error analysis (failure cases)                     │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              5. Model Deployment                        │    │
│  │                                                         │    │
│  │  • Model serialization (SavedModel, pickle)           │    │
│  │  • Model versioning (v1.0.0, v1.1.0)                  │    │
│  │  • Model serving (Flask API or TensorFlow Serving)    │    │
│  │  • A/B testing (compare model versions)               │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              6. Model Monitoring                        │    │
│  │                                                         │    │
│  │  • Inference latency (<60s for boundary detection)    │    │
│  │  • Prediction accuracy (compare to actual yields)     │    │
│  │  • Model drift detection (performance degradation)    │    │
│  │  • Retraining triggers (monthly or accuracy <80%)     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Model Training Architecture

**U-Net Boundary Detection Model:**

**Architecture:**
```
Input: 256×256×4 (RGB + NIR)
    ↓
Encoder (Downsampling):
    Conv2D(64) → ReLU → Conv2D(64) → ReLU → MaxPool2D  [128×128×64]
    Conv2D(128) → ReLU → Conv2D(128) → ReLU → MaxPool2D [64×64×128]
    Conv2D(256) → ReLU → Conv2D(256) → ReLU → MaxPool2D [32×32×256]
    Conv2D(512) → ReLU → Conv2D(512) → ReLU → MaxPool2D [16×16×512]
    ↓
Bottleneck:
    Conv2D(1024) → ReLU → Conv2D(1024) → ReLU           [16×16×1024]
    ↓
Decoder (Upsampling):
    UpConv2D(512) → Concat(Encoder3) → Conv2D(512) → ReLU [32×32×512]
    UpConv2D(256) → Concat(Encoder2) → Conv2D(256) → ReLU [64×64×256]
    UpConv2D(128) → Concat(Encoder1) → Conv2D(128) → ReLU [128×128×128]
    UpConv2D(64) → Concat(Encoder0) → Conv2D(64) → ReLU   [256×256×64]
    ↓
Output:
    Conv2D(1) → Sigmoid                                    [256×256×1]
    (Binary mask: 0=non-field, 1=field)
```

**Training Configuration:**
```python
# training_config.py
TRAINING_CONFIG = {
    'model': 'unet',
    'input_size': (256, 256, 4),  # RGB + NIR
    'batch_size': 16,
    'epochs': 50,
    'learning_rate': 0.001,
    'optimizer': 'adam',
    'loss': 'binary_crossentropy + dice_loss',
    'metrics': ['iou', 'f1_score', 'precision', 'recall'],
    'early_stopping': {
        'monitor': 'val_iou',
        'patience': 10,
        'min_delta': 0.001
    },
    'data_augmentation': {
        'rotation_range': 15,
        'horizontal_flip': True,
        'vertical_flip': True,
        'brightness_range': [0.8, 1.2]
    },
    'validation_split': 0.2,
    'test_split': 0.1
}
```

**Training Script:**
```python
# train_boundary_detection.py
import tensorflow as tf
from models.unet import UNet
from data.dataset import BoundaryDataset

# 1. Load dataset
dataset = BoundaryDataset(
    data_dir='data/deepglobe',
    image_size=(256, 256),
    augmentation=True
)
train_ds, val_ds, test_ds = dataset.split(train=0.7, val=0.2, test=0.1)

# 2. Create model
model = UNet(input_shape=(256, 256, 4), num_classes=1)
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss=combined_loss,  # BCE + Dice
    metrics=[iou_metric, f1_score]
)

# 3. Train model
history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=50,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(monitor='val_iou', patience=10),
        tf.keras.callbacks.ModelCheckpoint('models/unet_best.h5', save_best_only=True),
        tf.keras.callbacks.TensorBoard(log_dir='logs/')
    ]
)

# 4. Evaluate on test set
test_iou = model.evaluate(test_ds)
print(f"Test IoU: {test_iou:.4f}")

# 5. Save model
model.save('models/unet_v1.0.0')
```

**Random Forest Yield Prediction Model:**

**Feature Engineering:**
```python
# features.py
def extract_features(field_data):
    """Extract features for yield prediction"""
    features = {}
    
    # NDVI time series features (last 60 days)
    ndvi_series = field_data['ndvi_history']
    features['ndvi_mean'] = np.mean(ndvi_series)
    features['ndvi_max'] = np.max(ndvi_series)
    features['ndvi_min'] = np.min(ndvi_series)
    features['ndvi_std'] = np.std(ndvi_series)
    features['ndvi_trend'] = calculate_trend(ndvi_series)  # Linear regression slope
    features['ndvi_peak_day'] = np.argmax(ndvi_series)
    
    # Weather features (last 30 days)
    weather = field_data['weather_history']
    features['total_rainfall'] = np.sum(weather['rainfall'])
    features['avg_temperature'] = np.mean(weather['temperature'])
    features['max_temperature'] = np.max(weather['temperature'])
    features['avg_humidity'] = np.mean(weather['humidity'])
    
    # Field features
    features['field_area'] = field_data['area']
    features['days_since_planting'] = field_data['growth_stage']
    
    # Location features (district encoding)
    features['district'] = encode_district(field_data['location'])
    
    return features
```

**Training Script:**
```python
# train_yield_prediction.py
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score
import joblib

# 1. Load historical yield data
data = load_yield_dataset('data/historical_yields.csv')  # 500+ samples

# 2. Extract features
X = np.array([extract_features(sample) for sample in data])
y = np.array([sample['actual_yield'] for sample in data])

# 3. Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Train Random Forest
model = RandomForestRegressor(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# 5. Cross-validation
cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='neg_mean_absolute_percentage_error')
print(f"CV MAPE: {-cv_scores.mean():.2f}%")

# 6. Evaluate on test set
y_pred = model.predict(X_test)
mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
print(f"Test MAPE: {mape:.2f}%")

# 7. Save model
joblib.dump(model, 'models/yield_rf_v1.0.0.pkl')
```

### 5.3 Model Serving Architecture

**Option 1: Flask API (Chosen for MVP)**

```python
# ml_service/app.py
from flask import Flask, request, jsonify
import tensorflow as tf
import joblib
import numpy as np

app = Flask(__name__)

# Load models at startup
unet_model = tf.keras.models.load_model('models/unet_v1.0.0')
yield_model = joblib.load('models/yield_rf_v1.0.0.pkl')

@app.route('/api/ml/detect-boundary', methods=['POST'])
def detect_boundary():
    """Detect field boundary from satellite image"""
    try:
        # 1. Parse request
        data = request.json
        image = np.array(data['image'])  # 256×256×4
        
        # 2. Preprocess
        image = preprocess_image(image)
        
        # 3. Run inference
        mask = unet_model.predict(np.expand_dims(image, axis=0))[0]
        
        # 4. Post-process
        polygon = extract_polygon(mask)
        
        # 5. Return result
        return jsonify({
            'success': True,
            'boundary': polygon.tolist(),
            'confidence': float(np.max(mask))
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ml/predict-yield', methods=['POST'])
def predict_yield():
    """Predict crop yield"""
    try:
        # 1. Parse request
        data = request.json
        features = extract_features(data)
        
        # 2. Run inference
        prediction = yield_model.predict([features])[0]
        
        # 3. Calculate confidence interval
        predictions = [tree.predict([features])[0] for tree in yield_model.estimators_]
        confidence_lower = np.percentile(predictions, 2.5)
        confidence_upper = np.percentile(predictions, 97.5)
        
        # 4. Return result
        return jsonify({
            'success': True,
            'predicted_yield': float(prediction),
            'confidence_interval': {
                'lower': float(confidence_lower),
                'upper': float(confidence_upper)
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**Rationale for Flask API:**
- ✅ Simple to implement and deploy
- ✅ Python ecosystem (TensorFlow, scikit-learn)
- ✅ Easy to scale (multiple instances behind load balancer)
- ✅ Low latency (<60s for boundary detection)
- ✅ Cost-effective (single container)

**Alternative: TensorFlow Serving (Phase 2+)**
- ⚡ Higher performance (C++ backend)
- ⚡ Built-in model versioning
- ⚡ gRPC support (faster than HTTP)
- ❌ More complex setup
- ❌ Overkill for MVP scale

### 5.4 Feature Engineering Pipeline

**NDVI Time Series Features:**

```python
# feature_engineering.py
def create_ndvi_features(ndvi_history):
    """Create features from NDVI time series"""
    features = {}
    
    # Statistical features
    features['ndvi_mean'] = np.mean(ndvi_history)
    features['ndvi_median'] = np.median(ndvi_history)
    features['ndvi_std'] = np.std(ndvi_history)
    features['ndvi_min'] = np.min(ndvi_history)
    features['ndvi_max'] = np.max(ndvi_history)
    features['ndvi_range'] = features['ndvi_max'] - features['ndvi_min']
    
    # Trend features
    features['ndvi_trend'] = calculate_linear_trend(ndvi_history)
    features['ndvi_acceleration'] = calculate_acceleration(ndvi_history)
    
    # Peak features
    features['ndvi_peak_value'] = np.max(ndvi_history)
    features['ndvi_peak_day'] = np.argmax(ndvi_history)
    features['days_since_peak'] = len(ndvi_history) - features['ndvi_peak_day']
    
    # Growth stage features
    features['vegetative_ndvi'] = np.mean(ndvi_history[:20])  # First 20 days
    features['reproductive_ndvi'] = np.mean(ndvi_history[20:40])  # Days 20-40
    features['maturity_ndvi'] = np.mean(ndvi_history[40:])  # Days 40+
    
    return features
```

**Weather Features:**

```python
def create_weather_features(weather_history):
    """Create features from weather data"""
    features = {}
    
    # Rainfall features
    features['total_rainfall'] = np.sum(weather_history['rainfall'])
    features['avg_rainfall'] = np.mean(weather_history['rainfall'])
    features['max_rainfall_day'] = np.max(weather_history['rainfall'])
    features['rainy_days'] = np.sum(weather_history['rainfall'] > 1)  # Days with >1mm rain
    features['drought_days'] = calculate_max_consecutive_dry_days(weather_history['rainfall'])
    
    # Temperature features
    features['avg_temperature'] = np.mean(weather_history['temperature'])
    features['max_temperature'] = np.max(weather_history['temperature'])
    features['min_temperature'] = np.min(weather_history['temperature'])
    features['temperature_range'] = features['max_temperature'] - features['min_temperature']
    features['extreme_heat_days'] = np.sum(weather_history['temperature'] > 35)
    
    # Humidity features
    features['avg_humidity'] = np.mean(weather_history['humidity'])
    
    return features
```

### 5.5 Model Versioning and Deployment

**Model Registry:**

```python
# model_registry.py
class ModelRegistry:
    """Manage model versions and metadata"""
    
    def __init__(self, storage_path='models/'):
        self.storage_path = storage_path
        self.metadata_db = {}  # In production: use database
    
    def register_model(self, model_name, version, model, metrics):
        """Register new model version"""
        model_path = f"{self.storage_path}/{model_name}_v{version}"
        
        # Save model
        if model_name == 'unet':
            model.save(f"{model_path}.h5")
        elif model_name == 'yield_rf':
            joblib.dump(model, f"{model_path}.pkl")
        
        # Save metadata
        self.metadata_db[f"{model_name}_v{version}"] = {
            'model_name': model_name,
            'version': version,
            'trained_at': datetime.now().isoformat(),
            'metrics': metrics,
            'status': 'registered'
        }
    
    def get_latest_model(self, model_name):
        """Get latest version of model"""
        versions = [k for k in self.metadata_db.keys() if k.startswith(model_name)]
        latest = max(versions, key=lambda v: parse_version(v))
        return self.load_model(latest)
    
    def load_model(self, model_key):
        """Load model from storage"""
        metadata = self.metadata_db[model_key]
        model_path = f"{self.storage_path}/{model_key}"
        
        if metadata['model_name'] == 'unet':
            return tf.keras.models.load_model(f"{model_path}.h5")
        elif metadata['model_name'] == 'yield_rf':
            return joblib.load(f"{model_path}.pkl")
```

**Model Monitoring:**

```python
# model_monitoring.py
class ModelMonitor:
    """Monitor model performance in production"""
    
    def __init__(self, model_name):
        self.model_name = model_name
        self.metrics_db = []  # In production: use time-series database
    
    def log_prediction(self, input_data, prediction, actual=None):
        """Log prediction for monitoring"""
        self.metrics_db.append({
            'timestamp': datetime.now(),
            'model': self.model_name,
            'prediction': prediction,
            'actual': actual,
            'latency': input_data.get('latency'),
            'confidence': input_data.get('confidence')
        })
    
    def calculate_metrics(self, time_window='7d'):
        """Calculate performance metrics"""
        recent = self.get_recent_predictions(time_window)
        
        # Accuracy (if actuals available)
        if any(p['actual'] for p in recent):
            predictions = [p['prediction'] for p in recent if p['actual']]
            actuals = [p['actual'] for p in recent if p['actual']]
            mape = np.mean(np.abs((actuals - predictions) / actuals)) * 100
        else:
            mape = None
        
        # Latency
        latencies = [p['latency'] for p in recent if p['latency']]
        avg_latency = np.mean(latencies)
        p95_latency = np.percentile(latencies, 95)
        
        return {
            'mape': mape,
            'avg_latency': avg_latency,
            'p95_latency': p95_latency,
            'prediction_count': len(recent)
        }
    
    def detect_drift(self):
        """Detect model performance degradation"""
        current_metrics = self.calculate_metrics('7d')
        baseline_metrics = self.get_baseline_metrics()
        
        # Alert if MAPE increased >5% or latency increased >20%
        if current_metrics['mape'] and baseline_metrics['mape']:
            if current_metrics['mape'] > baseline_metrics['mape'] * 1.05:
                self.send_alert('Model accuracy degraded', current_metrics)
        
        if current_metrics['p95_latency'] > baseline_metrics['p95_latency'] * 1.2:
            self.send_alert('Model latency increased', current_metrics)
```

---

## 6. DATA ARCHITECTURE

### 6.1 Database Selection Rationale

**Polyglot Persistence Strategy:**

| **Database** | **Use Case** | **Rationale** |
|--------------|-------------|---------------|
| **PostgreSQL + PostGIS** | Users, Fields, Health Records, Predictions | • ACID compliance (data integrity)<br>• Spatial data support (PostGIS)<br>• Complex queries (JOINs, aggregations)<br>• Mature, reliable, open-source |
| **MongoDB** | News Articles, Analytics Events, Logs | • Flexible schema (evolving content)<br>• Time-series optimization<br>• Horizontal scaling (sharding)<br>• JSON-native (easy integration) |
| **Redis** | Sessions, Cache, Rate Limiting | • In-memory speed (sub-millisecond)<br>• TTL support (auto-expiry)<br>• Pub/Sub (real-time updates)<br>• Simple data structures |

### 6.2 Data Modeling Approach

**PostgreSQL Schema (Relational Data):**

```sql
-- users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),  -- NULL for OAuth users
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'farmer',  -- 'farmer' or 'admin'
    auth_provider VARCHAR(20) NOT NULL,  -- 'google' or 'email'
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    profile_photo_url VARCHAR(500),
    location VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active', 'suspended', 'deleted'
    
    CHECK (role IN ('farmer', 'admin')),
    CHECK (auth_provider IN ('google', 'email')),
    CHECK (status IN ('active', 'suspended', 'deleted'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status, created_at);
CREATE INDEX idx_users_last_login ON users(last_login);

-- fields table (with PostGIS spatial types)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE fields (
    field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    boundary GEOMETRY(Polygon, 4326) NOT NULL,  -- GeoJSON polygon, WGS84
    area DECIMAL(10, 2) NOT NULL,  -- Hectares
    center GEOMETRY(Point, 4326) NOT NULL,  -- Field center point
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active', 'archived', 'deleted'
    
    UNIQUE (user_id, name),  -- No duplicate field names per user
    CHECK (area >= 0.1 AND area <= 50),
    CHECK (ST_IsValid(boundary)),  -- Valid polygon geometry
    CHECK (status IN ('active', 'archived', 'deleted'))
);

CREATE INDEX idx_fields_user ON fields(user_id, status);
CREATE INDEX idx_fields_spatial_boundary ON fields USING GIST(boundary);
CREATE INDEX idx_fields_spatial_center ON fields USING GIST(center);

-- health_records table
CREATE TABLE health_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL,
    ndvi_mean DECIMAL(5, 4) NOT NULL,
    ndvi_min DECIMAL(5, 4) NOT NULL,
    ndvi_max DECIMAL(5, 4) NOT NULL,
    ndvi_std DECIMAL(5, 4) NOT NULL,
    ndwi_mean DECIMAL(5, 4) NOT NULL,
    ndwi_min DECIMAL(5, 4) NOT NULL,
    ndwi_max DECIMAL(5, 4) NOT NULL,
    ndwi_std DECIMAL(5, 4) NOT NULL,
    tdvi_mean DECIMAL(5, 4) NOT NULL,
    health_status VARCHAR(20) NOT NULL,  -- 'excellent', 'good', 'fair', 'poor'
    health_score INTEGER NOT NULL,  -- 0-100
    trend VARCHAR(20) NOT NULL,  -- 'improving', 'stable', 'declining'
    satellite_image_id VARCHAR(100) NOT NULL,
    cloud_cover DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE (field_id, measurement_date),  -- One record per field per date
    CHECK (ndvi_mean >= -1 AND ndvi_mean <= 1),
    CHECK (ndwi_mean >= -1 AND ndwi_mean <= 1),
    CHECK (health_score >= 0 AND health_score <= 100),
    CHECK (cloud_cover >= 0 AND cloud_cover <= 100),
    CHECK (health_status IN ('excellent', 'good', 'fair', 'poor')),
    CHECK (trend IN ('improving', 'stable', 'declining'))
);

CREATE INDEX idx_health_field_date ON health_records(field_id, measurement_date DESC);
CREATE INDEX idx_health_status ON health_records(health_status);

-- recommendations table
CREATE TABLE recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,  -- 'water', 'fertilizer', 'alert', 'general'
    severity VARCHAR(20) NOT NULL,  -- 'critical', 'high', 'medium', 'low'
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    action TEXT,
    zones JSONB,  -- GeoJSON of affected zones
    estimated_savings DECIMAL(10, 2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'pending', 'done', 'ignored', 'expired'
    user_action_at TIMESTAMP,
    
    CHECK (type IN ('water', 'fertilizer', 'alert', 'general')),
    CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    CHECK (status IN ('pending', 'done', 'ignored', 'expired'))
);

CREATE INDEX idx_recommendations_field ON recommendations(field_id, created_at DESC);
CREATE INDEX idx_recommendations_status ON recommendations(status, expires_at);

-- yield_predictions table
CREATE TABLE yield_predictions (
    prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
    prediction_date DATE NOT NULL,
    predicted_yield_per_ha DECIMAL(10, 2) NOT NULL,
    predicted_total_yield DECIMAL(10, 2) NOT NULL,
    confidence_lower DECIMAL(10, 2) NOT NULL,
    confidence_upper DECIMAL(10, 2) NOT NULL,
    expected_revenue DECIMAL(12, 2) NOT NULL,
    harvest_date_estimate DATE,
    model_version VARCHAR(20) NOT NULL,
    features_used JSONB NOT NULL,
    actual_yield DECIMAL(10, 2),  -- User-reported after harvest
    accuracy_mape DECIMAL(5, 2),  -- Calculated after actual yield entered
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CHECK (predicted_yield_per_ha > 0),
    CHECK (confidence_lower <= predicted_yield_per_ha),
    CHECK (confidence_upper >= predicted_yield_per_ha)
);

CREATE INDEX idx_yield_field_date ON yield_predictions(field_id, prediction_date DESC);
CREATE INDEX idx_yield_harvest_date ON yield_predictions(harvest_date_estimate);

-- disaster_assessments table
CREATE TABLE disaster_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
    disaster_type VARCHAR(20) NOT NULL,  -- 'flood', 'drought', 'storm', 'other'
    before_date DATE NOT NULL,
    after_date DATE NOT NULL,
    damaged_area_severe DECIMAL(10, 2) NOT NULL,
    damaged_area_moderate DECIMAL(10, 2) NOT NULL,
    damaged_area_minor DECIMAL(10, 2) NOT NULL,
    total_damaged_area DECIMAL(10, 2) NOT NULL,
    damage_percentage DECIMAL(5, 2) NOT NULL,
    yield_loss_kg DECIMAL(10, 2) NOT NULL,
    financial_loss DECIMAL(12, 2) NOT NULL,
    report_pdf_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CHECK (disaster_type IN ('flood', 'drought', 'storm', 'other')),
    CHECK (before_date < after_date),
    CHECK (damage_percentage >= 0 AND damage_percentage <= 100)
);

CREATE INDEX idx_disaster_field ON disaster_assessments(field_id, created_at DESC);

-- weather_forecasts table
CREATE TABLE weather_forecasts (
    forecast_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    temperature_min DECIMAL(5, 2) NOT NULL,
    temperature_max DECIMAL(5, 2) NOT NULL,
    weather_condition VARCHAR(50) NOT NULL,
    rainfall_probability INTEGER NOT NULL,  -- 0-100%
    rainfall_amount DECIMAL(6, 2) NOT NULL,  -- mm
    humidity INTEGER NOT NULL,  -- 0-100%
    wind_speed DECIMAL(5, 2) NOT NULL,  -- km/h
    is_extreme BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE (field_id, forecast_date),
    CHECK (rainfall_probability >= 0 AND rainfall_probability <= 100),
    CHECK (humidity >= 0 AND humidity <= 100)
);

CREATE INDEX idx_weather_field_date ON weather_forecasts(field_id, forecast_date);
```

**MongoDB Schema (Document Data):**

```javascript
// news_articles collection
{
  _id: ObjectId("..."),
  title: "New Fertilizer Subsidy Announced",
  slug: "new-fertilizer-subsidy-announced",  // URL-friendly
  category: "government_schemes",  // 'news', 'best_practices', 'market_prices', 'government_schemes'
  summary: "Government announces 30% subsidy on organic fertilizers...",
  content: "<p>Full article content with HTML formatting...</p>",
  featured_image: "https://cdn.skycrop.com/news/fertilizer-subsidy.jpg",
  author: {
    name: "Admin Name",
    user_id: "uuid-123"
  },
  tags: ["fertilizer", "subsidy", "government"],
  status: "published",  // 'draft', 'published', 'scheduled'
  published_at: ISODate("2025-10-28T10:00:00Z"),
  created_at: ISODate("2025-10-27T15:30:00Z"),
  updated_at: ISODate("2025-10-28T09:45:00Z"),
  views: 245,
  shares: 18
}

// Indexes
db.news_articles.createIndex({ slug: 1 }, { unique: true });
db.news_articles.createIndex({ category: 1, published_at: -1 });
db.news_articles.createIndex({ status: 1, published_at: -1 });
db.news_articles.createIndex({ tags: 1 });
db.news_articles.createIndex({ "$**": "text" });  // Full-text search

// analytics_events collection (time-series)
{
  _id: ObjectId("..."),
  event_type: "field_view",  // 'signup', 'login', 'field_create', 'field_view', etc.
  user_id: "uuid-123",
  field_id: "uuid-456",
  timestamp: ISODate("2025-10-29T12:34:56Z"),
  session_id: "session_abc123",
  device: {
    type: "mobile",  // 'web', 'mobile'
    os: "Android",
    os_version: "12",
    app_version: "1.0.0"
  },
  metadata: {
    screen: "field_details",
    duration: 45,  // seconds
    actions: ["view_health", "view_recommendations"]
  }
}

// Indexes
db.analytics_events.createIndex({ user_id: 1, timestamp: -1 });
db.analytics_events.createIndex({ event_type: 1, timestamp: -1 });
db.analytics_events.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });  // TTL: 90 days
```

### 6.3 Caching Strategy

**Redis Cache Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                    Redis Cache Layers                    │
│                                                          │
│  Layer 1: Session Storage (TTL: 30 days)                │
│  ├── session:{token} → { user_id, email, role }        │
│  ├── blacklist:{token} → 1 (logged out tokens)         │
│  └── user:{user_id}:last_seen → timestamp              │
│                                                          │
│  Layer 2: API Response Cache (TTL: varies)              │
│  ├── weather:{field_id} → forecast (TTL: 6 hours)      │
│  ├── health:{field_id} → health data (TTL: 1 hour)     │
│  ├── news:list:{page} → articles (TTL: 30 minutes)     │
│  └── field:{field_id} → field data (TTL: 1 hour)       │
│                                                          │
│  Layer 3: Satellite Image Cache (TTL: 30 days)         │
│  ├── satellite:{field_id}:{date} → image_url           │
│  └── satellite:metadata:{image_id} → { date, cloud }   │
│                                                          │
│  Layer 4: Rate Limiting (TTL: 1 hour)                   │
│  ├── rate-limit:{user_id} → request_count              │
│  └── rate-limit:{ip} → request_count                   │
│                                                          │
│  Layer 5: Temporary Data (TTL: varies)                  │
│  ├── boundary-detection:{job_id} → progress (TTL: 5m)  │
│  ├── password-reset:{token} → user_id (TTL: 24h)       │
│  └── email-verify:{token} → user_id (TTL: 24h)         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Cache Invalidation Strategy:**

```javascript
// cache.service.js
class CacheService {
  constructor(redisClient) {
    this.redis = redisClient;
  }
  
  // Cache-aside pattern (lazy loading)
  async get(key, fetchFunction, ttl = 3600) {
    // 1. Try to get from cache
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 2. Cache miss - fetch from source
    const data = await fetchFunction();
    
    // 3. Store in cache
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }
  
  // Invalidate cache on data update
  async invalidate(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  // Example: Invalidate field cache when field updated
  async invalidateFieldCache(fieldId) {
    await this.invalidate(`field:${fieldId}*`);
    await this.invalidate(`health:${fieldId}*`);
  }
}

// Usage in service
class FieldService {
  async getField(fieldId) {
    return await cacheService.get(
      `field:${fieldId}`,
      () => fieldRepository.findById(fieldId),
      3600  // 1 hour TTL
    );
  }
  
  async updateField(fieldId, data) {
    const field = await fieldRepository.update(fieldId, data);
    await cacheService.invalidateFieldCache(fieldId);  // Invalidate cache
    return field;
  }
}
```

### 6.4 Data Flow Diagrams

**Data Flow 1: Health Monitoring Update (Scheduled Job)**

```
┌─────────────────────────────────────────────────────────────────┐
│  Cron Job (Daily 2 AM)                                          │
│  ├── Query fields needing update (last_update > 5 days)        │
│  └── For each field:                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Satellite Service                                              │
│  ├── Check cache: satellite:{field_id}:{date}                  │
│  ├── If miss: Request from Sentinel Hub API                    │
│  ├── Download GeoTIFF (B02, B03, B04, B08, B11)                │
│  ├── Apply cloud masking (reject if >20% cloud)                │
│  └── Cache image (Redis, 30-day TTL)                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Health Service                                                 │
│  ├── Extract field pixels (mask with boundary polygon)         │
│  ├── Calculate NDVI: (NIR - Red) / (NIR + Red)                │
│  ├── Calculate NDWI: (NIR - SWIR) / (NIR + SWIR)              │
│  ├── Calculate TDVI: sqrt(NDVI + 0.5)                         │
│  ├── Calculate statistics (mean, min, max, std)                │
│  ├── Classify health status (excellent/good/fair/poor)         │
│  ├── Determine trend (compare to previous measurement)         │
│  └── Store in PostgreSQL (health_records table)                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Recommendation Service                                         │
│  ├── Analyze NDWI → Generate water recommendation              │
│  ├── Analyze NDVI → Generate fertilizer recommendation         │
│  ├── Check for critical conditions → Generate alerts           │
│  ├── Integrate weather forecast → Adjust timing                │
│  └── Store recommendations (PostgreSQL)                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Notification Service                                           │
│  ├── Check if critical alert (NDWI <0.05, NDVI drop >15%)     │
│  ├── If critical: Send push notification (Firebase FCM)        │
│  ├── Log notification delivery                                 │
│  └── Update user's notification inbox                          │
└─────────────────────────────────────────────────────────────────┘
```

**Data Flow 2: User Request (Field Health View)**

```
User (Mobile App)
    │
    │ GET /api/v1/fields/uuid-123/health
    ▼
API Gateway (Express)
    │
    │ 1. Auth Middleware (validate JWT)
    │ 2. Rate Limit Middleware (check limit)
    │ 3. Logging Middleware (log request)
    ▼
Health Controller
    │
    │ healthController.getHealth(req, res)
    ▼
Health Service
    │
    │ 1. Check cache: health:uuid-123
    │ 2. If hit: Return cached data
    │ 3. If miss: Query database
    ▼
Health Repository
    │
    │ SELECT * FROM health_records
    │ WHERE field_id = 'uuid-123'
    │ ORDER BY measurement_date DESC
    │ LIMIT 1
    ▼
PostgreSQL Database
    │
    │ Return latest health record
    ▼
Health Service
    │
    │ 1. Transform data (add computed fields)
    │ 2. Cache result (Redis, 1-hour TTL)
    │ 3. Return to controller
    ▼
Health Controller
    │
    │ Format response (JSON)
    ▼
API Gateway
    │
    │ Response Middleware (add headers, log)
    ▼
User (Mobile App)
    │
    │ Display health map
```

### 6.5 Data Retention and Archival

**Retention Policy:**

| **Data Type** | **Hot Storage** | **Warm Storage** | **Cold Storage** | **Deletion** |
|---------------|-----------------|------------------|------------------|--------------|
| **User Data** | Active users (PostgreSQL) | - | - | 30 days after account deletion |
| **Field Data** | Active fields (PostgreSQL) | Archived fields (PostgreSQL) | - | 1 year after archival |
| **Health Records** | Last 6 months (PostgreSQL) | 6-12 months (PostgreSQL) | 1-3 years (S3 Glacier) | After 3 years |
| **Satellite Images** | Last 30 days (Redis) | - | - | After 30 days |
| **Weather Data** | Last 6 hours (Redis) | Last 30 days (PostgreSQL) | - | After 30 days |
| **Analytics Events** | Last 90 days (MongoDB) | - | Aggregated (MongoDB) | Raw events after 90 days |
| **Logs** | Last 30 days (MongoDB) | - | - | After 30 days |

**Archival Strategy:**

```javascript
// archival.job.js - Scheduled job for data archival
class ArchivalJob {
  async archiveHealthRecords() {
    // 1. Query health records older than 6 months
    const oldRecords = await HealthModel.findAll({
      where: {
        measurement_date: {
          [Op.lt]: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)  // 6 months
        }
      }
    });
    
    // 2. Export to CSV
    const csv = this.convertToCSV(oldRecords);
    
    // 3. Compress (gzip)
    const compressed = gzip(csv);
    
    // 4. Upload to S3 Glacier
    await s3.upload({
      Bucket: 'skycrop-archive',
      Key: `health-records/${new Date().toISOString()}.csv.gz`,
      Body: compressed,
      StorageClass: 'GLACIER'
    });
    
    // 5. Delete from PostgreSQL (keep metadata only)
    await HealthModel.destroy({
      where: { record_id: { [Op.in]: oldRecords.map(r => r.record_id) } }
    });
    
    logger.info(`Archived ${oldRecords.length} health records to S3 Glacier`);
  }
}
```

---

## 7. INTEGRATION ARCHITECTURE

### 7.1 External API Integrations

**Integration Pattern: Adapter + Circuit Breaker**

```javascript
// integrations/sentinelHub.adapter.js
class SentinelHubAdapter {
  constructor(apiClient, circuitBreaker, cache) {
    this.client = apiClient;
    this.circuitBreaker = circuitBreaker;
    this.cache = cache;
  }
  
  async getImage(bbox, dateRange, bands) {
    // 1. Check cache first
    const cacheKey = `satellite:${bbox}:${dateRange}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    // 2. Call API with circuit breaker
    const image = await this.circuitBreaker
  
  static sanitizeGeoJSON(geojson) {
    // Validate GeoJSON structure
    if (geojson.type !== 'Polygon') {
      throw new ValidationError('Invalid GeoJSON type. Expected Polygon.');
    }
    
    // Validate coordinates
    const coords = geojson.coordinates[0];
    if (coords.length < 4) {
      throw new ValidationError('Polygon must have at least 3 vertices (4 coordinates including closing point)');
    }
    
    // Validate coordinate ranges (Sri Lanka bounding box)
    coords.forEach(([lon, lat]) => {
      if (lat < 5.9 || lat > 9.9 || lon < 79.5 || lon > 82.0) {
        throw new ValidationError('Coordinates must be within Sri Lanka');
      }
    });
    
    return geojson;
  }
}

// Parameterized queries (prevent SQL injection)
const getUserByEmail = async (email) => {
  // ✅ Good: Parameterized query
  return await db.query('SELECT * FROM users WHERE email = $1', [email]);
  
  // ❌ Bad: String concatenation (SQL injection risk)
  // return await db.query(`SELECT * FROM users WHERE email = '${email}'`);
};
```

**CSRF Protection:**

```javascript
// csrf.middleware.js
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: true,  // HTTPS only
    sameSite: 'strict'
  }
});

// Apply to POST/PUT/DELETE routes
app.use('/api/v1/', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});

// Send CSRF token to frontend
app.get('/api/v1/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

**XSS Protection:**

```javascript
// Content Security Policy (CSP)
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],  // Avoid 'unsafe-inline' in production
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.skycrop.com"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"]
  }
}));

// Sanitize user input (prevent XSS)
const sanitizeHtml = require('sanitize-html');

const sanitizeUserContent = (html) => {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: {
      'a': ['href', 'target']
    },
    allowedSchemes: ['http', 'https']
  });
};
```

### 8.4 Security Best Practices

**Secrets Management:**

```javascript
// config/secrets.js
// ✅ Good: Use environment variables
const config = {
  jwtSecret: process.env.JWT_SECRET,
  dbPassword: process.env.DB_PASSWORD,
  sentinelHubApiKey: process.env.SENTINEL_HUB_API_KEY,
  weatherApiKey: process.env.WEATHER_API_KEY
};

// ❌ Bad: Hardcoded secrets
// const config = {
//   jwtSecret: 'my-secret-key-123',  // NEVER do this!
// };

// Use .env file (not committed to Git)
// .env
JWT_SECRET=randomly-generated-256-bit-key
DB_PASSWORD=secure-database-password
SENTINEL_HUB_API_KEY=your-api-key
```

**Security Headers:**

```javascript
// Security headers middleware
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
  
  next();
});
```

**Audit Logging:**

```javascript
// audit.service.js
class AuditService {
  async logSecurityEvent(event) {
    await db.query(`
      INSERT INTO security_logs (event_type, user_id, ip_address, user_agent, details, timestamp)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      event.type,      // 'login_success', 'login_failed', 'password_reset', 'account_locked'
      event.userId,
      event.ipAddress,
      event.userAgent,
      JSON.stringify(event.details)
    ]);
    
    // Alert on suspicious activity
    if (event.type === 'account_locked' || event.type === 'unauthorized_access') {
      await this.sendSecurityAlert(event);
    }
  }
}

// Usage
await auditService.logSecurityEvent({
  type: 'login_failed',
  userId: 'uuid-123',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  details: { reason: 'invalid_password', attempt: 3 }
});
```

---

## 9. SCALABILITY & PERFORMANCE DESIGN

### 9.1 Horizontal Scaling Strategy

**Scaling Architecture:**

```
                        ┌─────────────────┐
                        │  Load Balancer  │
                        │   (AWS ALB)     │
                        └────────┬────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │  API Server  │ │  API Server  │ │  API Server  │
        │  Instance 1  │ │  Instance 2  │ │  Instance N  │
        └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
               │                │                │
               └────────────────┼────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │  PostgreSQL  │ │   MongoDB    │ │    Redis     │
        │   (Primary)  │ │   (Primary)  │ │   (Cluster)  │
        │              │ │              │ │              │
        │  Read        │ │  Replica     │ │  Master +    │
        │  Replicas    │ │  Set         │ │  Replicas    │
        └──────────────┘ └──────────────┘ └──────────────┘
```

**Auto-Scaling Configuration:**

```yaml
# AWS Auto Scaling Group configuration
AutoScalingGroup:
  MinSize: 2              # Minimum 2 instances (high availability)
  MaxSize: 10             # Maximum 10 instances (cost control)
  DesiredCapacity: 2      # Start with 2 instances
  
  ScalingPolicies:
    - PolicyName: ScaleUpOnCPU
      MetricName: CPUUtilization
      Threshold: 70%        # Scale up if CPU > 70%
      ScalingAdjustment: +2 # Add 2 instances
      Cooldown: 300         # Wait 5 minutes before next scale
    
    - PolicyName: ScaleDownOnCPU
      MetricName: CPUUtilization
      Threshold: 30%        # Scale down if CPU < 30%
      ScalingAdjustment: -1 # Remove 1 instance
      Cooldown: 600         # Wait 10 minutes before next scale
    
    - PolicyName: ScaleUpOnRequests
      MetricName: RequestCount
      Threshold: 1000       # Scale up if >1000 req/min
      ScalingAdjustment: +1
      Cooldown: 300
```

**Load Balancing Strategy:**

```javascript
// Load balancer configuration
const loadBalancerConfig = {
  algorithm: 'round-robin',  // Distribute requests evenly
  healthCheck: {
    path: '/health',
    interval: 30,            // Check every 30 seconds
    timeout: 5,              // 5-second timeout
    unhealthyThreshold: 3,   // Mark unhealthy after 3 failures
    healthyThreshold: 2      // Mark healthy after 2 successes
  },
  stickySession: {
    enabled: false,          // Stateless API (no sticky sessions needed)
    cookieName: 'AWSALB'
  },
  connectionDraining: {
    enabled: true,
    timeout: 300             // 5 minutes to complete in-flight requests
  }
};
```

### 9.2 Caching Layers

**Multi-Level Caching Strategy:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Caching Architecture                          │
│                                                                  │
│  Level 1: Browser Cache (Client-Side)                          │
│  ├── Static assets (JS, CSS, images) - 1 year                  │
│  ├── API responses (Cache-Control headers) - 5 minutes         │
│  └── Service Worker (PWA) - Offline support [Phase 2]          │
│                                                                  │
│  Level 2: CDN Cache (Edge Locations)                           │
│  ├── Static assets (CloudFront) - 1 year                       │
│  ├── Satellite image tiles - 30 days                           │
│  └── News article images - 7 days                              │
│                                                                  │
│  Level 3: Application Cache (Redis)                            │
│  ├── API responses - 1 hour                                    │
│  ├── Weather forecasts - 6 hours                               │
│  ├── Satellite images - 30 days                                │
│  ├── Health data - 1 hour                                      │
│  └── News articles - 30 minutes                                │
│                                                                  │
│  Level 4: Database Query Cache (PostgreSQL)                    │
│  ├── Shared buffers - 25% of RAM                               │
│  ├── Effective cache size - 75% of RAM                         │
│  └── Query result cache - Automatic                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Cache-Control Headers:**

```javascript
// Set appropriate cache headers
app.use('/api/v1/fields', (req, res, next) => {
  // Cache field data for 1 hour
  res.setHeader('Cache-Control', 'private, max-age=3600');
  next();
});

app.use('/api/v1/health', (req, res, next) => {
  // Cache health data for 1 hour
  res.setHeader('Cache-Control', 'private, max-age=3600');
  next();
});

app.use('/api/v1/weather', (req, res, next) => {
  // Cache weather for 6 hours
  res.setHeader('Cache-Control', 'private, max-age=21600');
  next();
});

app.use('/static/', (req, res, next) => {
  // Cache static assets for 1 year
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
});
```

### 9.3 Database Optimization

**PostgreSQL Optimization:**

```sql
-- Indexing strategy
CREATE INDEX CONCURRENTLY idx_health_field_date ON health_records(field_id, measurement_date DESC);
CREATE INDEX CONCURRENTLY idx_fields_user_status ON fields(user_id, status) WHERE status = 'active';

-- Partial indexes (index only active records)
CREATE INDEX idx_active_fields ON fields(user_id) WHERE status = 'active';

-- Covering indexes (include frequently accessed columns)
CREATE INDEX idx_health_covering ON health_records(field_id, measurement_date DESC) 
  INCLUDE (ndvi_mean, health_status, health_score);

-- Connection pooling
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                    // Maximum 20 connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000  // Timeout if no connection available
});

-- Query optimization
-- ✅ Good: Use EXPLAIN ANALYZE to optimize queries
EXPLAIN ANALYZE
SELECT f.*, h.ndvi_mean, h.health_status
FROM fields f
LEFT JOIN LATERAL (
  SELECT ndvi_mean, health_status
  FROM health_records
  WHERE field_id = f.field_id
  ORDER BY measurement_date DESC
  LIMIT 1
) h ON true
WHERE f.user_id = 'uuid-123' AND f.status = 'active';

-- Materialized views for expensive queries
CREATE MATERIALIZED VIEW field_summary AS
SELECT 
  f.field_id,
  f.name,
  f.area,
  h.ndvi_mean,
  h.health_status,
  h.measurement_date
FROM fields f
LEFT JOIN LATERAL (
  SELECT ndvi_mean, health_status, measurement_date
  FROM health_records
  WHERE field_id = f.field_id
  ORDER BY measurement_date DESC
  LIMIT 1
) h ON true
WHERE f.status = 'active';

-- Refresh materialized view daily
REFRESH MATERIALIZED VIEW CONCURRENTLY field_summary;
```

**MongoDB Optimization:**

```javascript
// Aggregation pipeline optimization
db.analytics_events.aggregate([
  // 1. Match stage (use index)
  { $match: { 
    event_type: 'field_view',
    timestamp: { $gte: new Date('2025-10-01') }
  }},
  
  // 2. Group stage (calculate metrics)
  { $group: {
    _id: '$user_id',
    view_count: { $sum: 1 },
    avg_duration: { $avg: '$metadata.duration' }
  }},
  
  // 3. Sort stage
  { $sort: { view_count: -1 }},
  
  // 4. Limit stage
  { $limit: 100 }
], {
  allowDiskUse: true,  // Allow disk usage for large datasets
  hint: { event_type: 1, timestamp: -1 }  // Force index usage
});

// Sharding strategy (Phase 2+)
sh.enableSharding("skycrop");
sh.shardCollection("skycrop.analytics_events", { user_id: "hashed" });
```

### 9.4 CDN Strategy

**CloudFront CDN Configuration:**

```javascript
// CDN configuration for static assets
const cdnConfig = {
  origins: [
    {
      id: 'S3-skycrop-static',
      domainName: 'skycrop-static.s3.amazonaws.com',
      s3OriginConfig: {
        originAccessIdentity: 'origin-access-identity/cloudfront/...'
      }
    }
  ],
  defaultCacheBehavior: {
    targetOriginId: 'S3-skycrop-static',
    viewerProtocolPolicy: 'redirect-to-https',
    allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
    cachedMethods: ['GET', 'HEAD'],
    compress: true,  // Gzip compression
    minTTL: 0,
    defaultTTL: 86400,      // 1 day
    maxTTL: 31536000,       // 1 year
    forwardedValues: {
      queryString: false,
      cookies: { forward: 'none' }
    }
  },
  cacheBehaviors: [
    {
      pathPattern: '/static/js/*',
      minTTL: 31536000,     // 1 year (immutable)
      defaultTTL: 31536000
    },
    {
      pathPattern: '/static/images/*',
      minTTL: 2592000,      // 30 days
      defaultTTL: 2592000
    },
    {
      pathPattern: '/api/*',
      minTTL: 0,            // No caching for API
      defaultTTL: 0
    }
  ]
};
```

**Image Optimization:**

```javascript
// Image processing pipeline
const sharp = require('sharp');

async function optimizeImage(inputPath, outputPath) {
  await sharp(inputPath)
    .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })  // Convert to WebP (better compression)
    .toFile(outputPath);
}

// Responsive images (multiple sizes)
async function generateResponsiveImages(inputPath) {
  const sizes = [
    { width: 400, suffix: 'sm' },
    { width: 800, suffix: 'md' },
    { width: 1200, suffix: 'lg' }
  ];
  
  const outputs = await Promise.all(
    sizes.map(({ width, suffix }) =>
      sharp(inputPath)
        .resize(width)
        .webp({ quality: 80 })
        .toFile(`${inputPath}-${suffix}.webp`)
    )
  );
  
  return outputs;
}
```

---

## 10. DEPLOYMENT ARCHITECTURE

### 10.1 Cloud Infrastructure

**AWS Architecture (Production - Phase 2+):**

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  Route 53 (DNS)                         │    │
│  │  • skycrop.com → CloudFront                            │    │
│  │  • api.skycrop.com → Application Load Balancer         │    │
│  └────────────────────────┬───────────────────────────────┘    │
│                           │                                      │
│           ┌───────────────┼───────────────┐                    │
│           │               │               │                    │
│           ▼               ▼               ▼                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │ CloudFront   │ │     ALB      │ │   API GW     │          │
│  │    (CDN)     │ │(Load Balancer)│ │  (Optional)  │          │
│  └──────┬───────┘ └──────┬───────┘ └──────────────┘          │
│         │                │                                      │
│         │                ▼                                      │
│         │       ┌──────────────────┐                          │
│         │       │   ECS Cluster    │                          │
│         │       │  (Fargate/EC2)   │                          │
│         │       │                  │                          │
│         │       │  ┌────────────┐  │                          │
│         │       │  │ API Server │  │ (Auto-scaling)          │
│         │       │  │ Container  │  │                          │
│         │       │  └────────────┘  │                          │
│         │       │  ┌────────────┐  │                          │
│         │       │  │  ML Service│  │                          │
│         │       │  │ Container  │  │                          │
│         │       │  └────────────┘  │                          │
│         │       └────────┬─────────┘                          │
│         │                │                                      │
│         │                ▼                                      │
│         │       ┌──────────────────┐                          │
│         │       │   RDS (PostgreSQL)│                          │
│         │       │  • Multi-AZ      │                          │
│         │       │  • Read Replicas │                          │
│         │       └──────────────────┘                          │
│         │                                                       │
│         │       ┌──────────────────┐                          │
│         │       │ ElastiCache      │                          │
│         │       │   (Redis)        │                          │
│         │       │  • Cluster Mode  │                          │
│         │       └──────────────────┘                          │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │  S3 Buckets  │                                              │
│  │              │                                              │
│  │ • Static     │ (Web app, images)                           │
│  │ • Satellite  │ (Cached satellite images)                   │
│  │ • Reports    │ (PDF disaster reports)                      │
│  │ • Backups    │ (Database backups)                          │
│  └──────────────┘                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Railway Architecture (MVP - Phase 1):**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Railway Platform                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Railway Project                            │    │
│  │                                                         │    │
│  │  Service 1: API Server (Node.js)                      │    │
│  │  ├── Dockerfile: node:20-alpine                       │    │
│  │  ├── Port: 3000                                       │    │
│  │  ├── Environment: Production                          │    │
│  │  └── Auto-deploy: main branch                         │    │
│  │                                                         │    │
│  │  Service 2: ML Service (Python)                       │    │
│  │  ├── Dockerfile: python:3.11-slim                     │    │
│  │  ├── Port: 5000                                       │    │
│  │  ├── Environment: Production                          │    │
│  │  └── Auto-deploy: main branch                         │    │
│  │                                                         │    │
│  │  Service 3: PostgreSQL (Managed)                      │    │
│  │  ├── Version: 15                                      │    │
│  │  ├── Storage: 10 GB (free tier)                       │    │
│  │  └── Backups: Daily                                   │    │
│  │                                                         │    │
│  │  Service 4: Redis (Managed)                           │    │
│  │  ├── Version: 7                                       │    │
│  │  ├── Memory: 512 MB (free tier)                       │    │
│  │  └── Persistence: RDB snapshots                       │    │
│  │                                                         │    │
│  │  Service 5: MongoDB (MongoDB Atlas)                   │    │
│  │  ├── Cluster: M0 (free tier)                          │    │
│  │  ├── Storage: 512 MB                                  │    │
│  │  └── Backups: Daily                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Custom Domain: api.skycrop.com                                │
│  SSL: Automatic (Let's Encrypt)                                │
│  Monitoring: Built-in (CPU, memory, requests)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Rationale for Railway (MVP):**
- ✅ **Free Tier:** $5/month credit (sufficient for 100 users)
- ✅ **Easy Deployment:** Git push to deploy
- ✅ **Managed Services:** PostgreSQL, Redis included
- ✅ **Auto-Scaling:** Automatic (within limits)
- ✅ **SSL:** Free automatic SSL certificates
- ✅ **Monitoring:** Built-in metrics and logs
- ❌ **Limitations:** Limited to 512 MB RAM per service (acceptable for MVP)

### 10.2 CI/CD Pipeline Design

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # Job 1: Test Backend
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend
      
      - name: Run linter
        run: npm run lint
        working-directory: ./backend
      
      - name: Run unit tests
        run: npm run test:unit
        working-directory: ./backend
      
      - name: Run integration tests
        run: npm run test:integration
        working-directory: ./backend
      
      - name: Check code coverage
        run: npm run test:coverage
        working-directory: ./backend
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
  
  # Job 2: Test ML Service
  test-ml:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
        working-directory: ./ml-service
      
      - name: Run linter (Pylint)
        run: pylint **/*.py
        working-directory: ./ml-service
      
      - name: Run tests
        run: pytest --cov=. --cov-report=xml
        working-directory: ./ml-service
  
  # Job 3: Test Frontend
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
      
      - name: Run linter
        run: npm run lint
        working-directory: ./frontend
      
      - name: Run tests
        run: npm run test
        working-directory: ./frontend
      
      - name: Build production bundle
        run: npm run build
        working-directory: ./frontend
      
      - name: Check bundle size
        run: npm run analyze
        working-directory: ./frontend
  
  # Job 4: Security Scan
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Run OWASP dependency check
        run: npm audit --audit-level=moderate
  
  # Job 5: Deploy to Staging
  deploy-staging:
    needs: [test-backend, test-ml, test-frontend, security-scan]
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway (Staging)
        run: |
          npm install -g @railway/cli
          railway up --service api-server --environment staging
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  
  # Job 6: Deploy to Production
  deploy-production:
    needs: [test-backend, test-ml, test-frontend, security-scan]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway (Production)
        run: |
          npm install -g @railway/cli
          railway up --service api-server --environment production
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      
      - name: Run smoke tests
        run: npm run test:smoke
        env:
          API_URL: https://api.skycrop.com
      
      - name: Notify team (Slack)
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to production completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 10.3 Environment Strategy

**Environment Configuration:**

| **Environment** | **Purpose** | **Infrastructure** | **Data** | **Access** |
|-----------------|-------------|-------------------|----------|------------|
| **Development** | Local development | Docker Compose | Seed data | Developers |
| **Staging** | Pre-production testing | Railway (separate project) | Anonymized production data | Developers, QA |
| **Production** | Live system | Railway/AWS | Real user data | Admins only |

**Environment Variables:**

```bash
# .env.development
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skycrop_dev
REDIS_URL=redis://localhost:6379
SENTINEL_HUB_API_KEY=dev-api-key
LOG_LEVEL=debug

# .env.staging
NODE_ENV=staging
PORT=3000
API_URL=https://api-staging.skycrop.com
DB_HOST=staging-db.railway.app
DB_PORT=5432
DB_NAME=skycrop_staging
REDIS_URL=redis://staging-redis.railway.app:6379
SENTINEL_HUB_API_KEY=staging-api-key
LOG_LEVEL=info

# .env.production
NODE_ENV=production
PORT=3000
API_URL=https://api.skycrop.com
DB_HOST=production-db.railway.app
DB_PORT=5432
DB_NAME=skycrop_production
REDIS_URL=redis://production-redis.railway.app:6379
SENTINEL_HUB_API_KEY=production-api-key
LOG_LEVEL=warn
```

### 10.4 Monitoring and Logging

**Monitoring Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Application Metrics                        │    │
│  │              (Prometheus)                               │    │
│  │                                                         │    │
│  │  • HTTP request count (by endpoint, status code)      │    │
│  │  • HTTP request duration (p50, p95, p99)              │    │
│  │  • Active connections                                  │    │
│  │  • Error rate                                          │    │
│  │  • Business metrics (signups, fields created)         │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              System Metrics                             │    │
│  │              (Node Exporter)                            │    │
│  │                                                         │    │
│  │  • CPU usage (%)                                       │    │
│  │  • Memory usage (MB, %)                                │    │
│  │  • Disk I/O (read/write MB/s)                         │    │
│  │  • Network I/O (in/out MB/s)                          │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Database Metrics                           │    │
│  │              (PostgreSQL Exporter)                      │    │
│  │                                                         │    │
│  │  • Query execution time                                │    │
│  │  • Connection pool usage                               │    │
│  │  • Cache hit rate                                      │    │
│  │  • Slow queries (>1s)                                  │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Visualization                              │    │
│  │              (Grafana)                                  │    │
│  │                                                         │    │
│  │  Dashboards:                                           │    │
│  │  • System Overview (CPU, memory, requests)            │    │
│  │  • API Performance (latency, errors, throughput)      │    │
│  │  • Business Metrics (users, fields, engagement)       │    │
│  │  • ML Model Performance (accuracy, latency)           │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Alerting                                   │    │
│  │              (Prometheus Alertmanager)                  │    │
│  │                                                         │    │
│  │  Alerts:                                               │    │
│  │  • High error rate (>1%)                              │    │
│  │  • High latency (p95 >3s)                             │    │
│  │  • Low uptime (<99%)                                  │    │
│  │  • Database connection pool exhausted                 │    │
│  │  • Disk space low (<10%)                              │    │
│  │                                                         │    │
│  │  Notification Channels:                                │    │
│  │  • Email (critical alerts)                            │    │
│  │  • Slack (all alerts)                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Logging Strategy:**

```javascript
// logger.js - Winston configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'skycrop-api',
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console (development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File (all logs)
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760,  // 10 MB
      maxFiles: 5
    }),
    
    // File (errors only)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

// Structured logging
logger.info('User logged in', {
  user_id: 'uuid-123',
  email: 'farmer@example.com',
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...'
});

logger.error('Database query failed', {
  error: error.message,
  stack: error.stack,
  query: 'SELECT * FROM fields WHERE user_id = $1',
  params: ['uuid-123']
});
```

**Log Aggregation (Phase 2+):**

```
Application Servers
    │
    │ Ship logs via Filebeat/Fluentd
    ▼
Elasticsearch (Log Storage)
    │
    │ Index and search logs
    ▼
Kibana (Log Visualization)
    │
    │ Dashboards, alerts, search
    ▼
Admins (View logs, troubleshoot)
```

### 10.5 Backup and Disaster Recovery

**Backup Strategy:**

```javascript
// backup.job.js - Automated backup job
class BackupJob {
  async performDailyBackup() {
    const timestamp = new Date().toISOString();
    
    // 1. PostgreSQL backup
    await this.backupPostgreSQL(timestamp);
    
    // 2. MongoDB backup
    await this.backupMongoDB(timestamp);
    
    // 3. Redis snapshot (automatic RDB)
    // Redis handles this automatically
    
    // 4. Upload to S3
    await this.uploadToS3(timestamp);
    
    // 5. Verify backup integrity
    await this.verifyBackup(timestamp);
    
    // 6. Cleanup old backups (retain 30 days)
    await this.cleanupOldBackups();
    
    logger.info('Daily backup completed', { timestamp });
  }
  
  async backupPostgreSQL(timestamp) {
    const { exec } = require('child_process');
    const backupFile = `backups/postgres-${timestamp}.sql.gz`;
    
    // Use pg_dump with compression
    await exec(`
      pg_dump -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} | gzip > ${backupFile}
    `);
    
    return backupFile;
  }
  
  async backupMongoDB(timestamp) {
    const { exec } = require('child_process');
    const backupDir = `backups/mongodb-${timestamp}`;
    
    // Use mongodump
    await exec(`
      mongodump --uri="${MONGO_URI}" --out=${backupDir} --gzip
    `);
    
    return backupDir;
  }
  
  async uploadToS3(timestamp) {
    const s3 = new AWS.S3();
    
    // Upload PostgreSQL backup
    await s3.upload({
      Bucket: 'skycrop-backups',
      Key: `postgres/${timestamp}.sql.gz`,
      Body: fs.createReadStream(`backups/postgres-${timestamp}.sql.gz`),
      StorageClass: 'STANDARD_IA'  // Infrequent Access (cheaper)
    }).promise();
    
    // Upload MongoDB backup
    await s3.upload({
      Bucket: 'skycrop-backups',
      Key: `mongodb/${timestamp}.tar.gz`,
      Body: fs.createReadStream(`backups/mongodb-${timestamp}.tar.gz`),
      StorageClass: 'STANDARD_IA'
    }).promise();
  }
  
  async verifyBackup(timestamp) {
    // Verify backup file exists and is not corrupted
    const backupFile = `backups/postgres-${timestamp}.sql.gz`;
    const stats = fs.statSync(backupFile);
    
    if (stats.size < 1000) {  // Backup too small (likely failed)
      throw new Error('Backup verification failed: File too small');
    }
    
    logger.info('Backup verified', { timestamp, size: stats.size });
  }
  
  async cleanupOldBackups() {
    // Delete backups older than 30 days
    const s3 = new AWS.S3();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const objects = await s3.listObjectsV2({
      Bucket: 'skycrop-backups'
    }).promise();
    
    const oldObjects = objects.Contents.filter(obj => 
      new Date(obj.LastModified) < thirtyDaysAgo
    );
    
    await Promise.all(
      oldObjects.map(obj =>
        s3.deleteObject({
          Bucket: 'skycrop-backups',
          Key: obj.Key
        }).promise()
      )
    );
    
    logger.info('Cleaned up old backups', { deleted: oldObjects.length });
  }
}

// Schedule daily backup (2 AM)
cron.schedule('0 2 * * *', async () => {
  await new BackupJob().performDailyBackup();
});
```

**Disaster Recovery Plan:**

**Recovery Time Objective (RTO):** 4 hours  
**Recovery Point Objective (RPO):** 24 hours (daily backups)

**Recovery Procedure:**
1. **Detect Failure:** Monitoring alerts trigger (uptime <99%, database unavailable)
2. **Assess Impact:** Determine scope (single service, database, entire system)
3. **Initiate Recovery:**
   - If API server failure: Auto-restart (health check failure triggers restart)
   - If database failure: Restore from latest backup (S3)
   - If complete system failure: Redeploy from Git + restore databases
4. **Restore Data:**
   - Download latest backup from S3
   - Restore PostgreSQL: `psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup.sql`
   - Restore MongoDB: `mongorestore --uri="$MONGO_URI" --gzip backup/`
5. **Verify Recovery:**
   - Run smoke tests (critical endpoints)
   - Verify data integrity (row counts, sample queries)
   - Check application functionality (login, view fields, etc.)
6. **Resume Operations:**
   - Update DNS if needed (point to new servers)
   - Notify users (if downtime >1 hour)
   - Post-mortem analysis (root cause, prevention)

---

## 11. DESIGN DECISIONS & RATIONALE

### 11.1 Key Architectural Decisions

**Decision 1: Modular Monolith vs. Microservices**

**Decision:** Start with modular monolith, migrate to microservices in Phase 2+

**Rationale:**
- ✅ **Team Size:** 1-2 developers (monolith easier to manage)
- ✅ **Timeline:** 16 weeks (microservices add complexity)
- ✅ **Cost:** Single deployment (cheaper than multiple services)
- ✅ **Simplicity:** Easier debugging, testing, deployment
- ✅ **Future-Proof:** Clear module boundaries enable future extraction

**Trade-offs:**
- ➕ **Pros:** Faster development, simpler operations, lower cost
- ➖ **Cons:** Harder to scale individual components, single point of failure
- 🔄 **Mitigation:** Design modules with clear boundaries, use interfaces for future extraction

**Alternatives Considered:**
- **Pure Microservices:** Rejected (too complex for MVP, overkill for 100 users)
- **Serverless (AWS Lambda):** Rejected (cold start latency, harder to debug, vendor lock-in)

---

**Decision 2: PostgreSQL + MongoDB (Polyglot Persistence)**

**Decision:** Use PostgreSQL for relational data, MongoDB for flexible documents

**Rationale:**
- ✅ **PostgreSQL:** ACID compliance (critical for user/field data), PostGIS (spatial queries), mature and reliable
- ✅ **MongoDB:** Flexible schema (news articles evolve), time-series optimization (analytics), horizontal scaling
- ✅ **Best Tool for Job:** Each database optimized for its use case

**Trade-offs:**
- ➕ **Pros:** Optimal performance for each data type, flexibility
- ➖ **Cons:** Operational complexity (two databases to manage), no cross-database transactions
- 🔄 **Mitigation:** Use PostgreSQL as primary (critical data), MongoDB for non-critical (news, analytics)

**Alternatives Considered:**
- **PostgreSQL Only:** Rejected (JSONB not as flexible as MongoDB for evolving schemas)
- **MongoDB Only:** Rejected (no spatial data support, weaker ACID guarantees)
- **MySQL:** Rejected (PostGIS equivalent less mature, licensing concerns)

---

**Decision 3: Redis for Caching**

**Decision:** Use Redis for all caching needs (sessions, API responses, rate limiting)

**Rationale:**
- ✅ **Performance:** In-memory speed (sub-millisecond latency)
- ✅ **Features:** TTL (auto-expiry), pub/sub (real-time updates), atomic operations
- ✅ **Simplicity:** Single cache solution for all use cases
- ✅ **Cost:** Free tier sufficient for MVP (512 MB)

**Trade-offs:**
- ➕ **Pros:** Excellent performance, simple to use, well-documented
- ➖ **Cons:** Data loss if Redis crashes (not persistent by default)
- 🔄 **Mitigation:** Enable RDB snapshots (periodic persistence), use for non-critical data only

**Alternatives Considered:**
- **Memcached:** Rejected (no persistence, no TTL, simpler data structures)
- **In-Memory (Node.js):** Rejected (lost on restart, not shared across instances)

---

**Decision 4: React.js + React Native (Frontend)**

**Decision:** Use React.js for web, React Native for mobile (code reuse)

**Rationale:**
- ✅ **Code Reuse:** Share business logic, utilities, API clients (60-70% code reuse)
- ✅ **Developer Productivity:** Single language (JavaScript), similar patterns
- ✅ **Performance:** React Native compiles to native code (better than hybrid apps)
- ✅ **Ecosystem:** Large community, rich libraries, excellent tooling

**Trade-offs:**
- ➕ **Pros:** Fast development, code reuse, native performance
- ➖ **Cons:** React Native has learning curve, platform-specific bugs
- 🔄 **Mitigation:** Use Expo for easier development, test on real devices

**Alternatives Considered:**
- **Flutter:** Rejected (Dart language, team has JavaScript expertise)
- **Native (Swift/Kotlin):** Rejected (2x development effort, no code reuse)
- **Ionic/Cordova:** Rejected (poor performance, webview-based)

---

**Decision 5: Node.js + Express (Backend)**

**Decision:** Use Node.js with Express framework for backend API

**Rationale:**
- ✅ **Full-Stack JavaScript:** Same language as frontend (easier for small team)
- ✅ **Async I/O:** Non-blocking, handles concurrent requests efficiently
- ✅ **Ecosystem:** npm has 2M+ packages, mature libraries for all needs
- ✅ **Performance:** V8 engine, fast for I/O-bound operations
- ✅ **Deployment:** Easy to containerize, works on all platforms

**Trade-offs:**
- ➕ **Pros:** Fast development, large ecosystem, good performance
- ➖ **Cons:** Single-threaded (CPU-bound tasks block), callback hell (mitigated with async/await)
- 🔄 **Mitigation:** Offload CPU-intensive tasks to Python ML service, use worker threads if needed

**Alternatives Considered:**
- **Python (Django/Flask):** Rejected (slower for I/O, team has JavaScript expertise)
- **Go:** Rejected (learning curve, smaller ecosystem)
- **Java (Spring Boot):** Rejected (verbose, heavyweight, overkill for MVP)

---

**Decision 6: U-Net for Boundary Detection**

**Decision:** Use U-Net deep learning architecture for field boundary detection

**Rationale:**
- ✅ **Proven:** State-of-art for image segmentation (medical imaging, satellite imagery)
- ✅ **Accuracy:** Achieves 85%+ IoU on agricultural datasets (DeepGlobe)
- ✅ **Pre-trained:** Transfer learning from ImageNet (faster training)
- ✅ **Efficient:** Relatively small model (20M parameters), fast inference (<60s)

**Trade-offs:**
- ➕ **Pros:** High accuracy, proven architecture, pre-trained weights available
- ➖ **Cons:** Requires GPU for training (use Google Colab free tier), 30-60s inference time
- 🔄 **Mitigation:** Train on Google Colab (free GPU), optimize inference (TensorFlow Lite)

**Alternatives Considered:**
- **DeepLab v3+:** Rejected (more complex, similar accuracy)
- **Mask R-CNN:** Rejected (overkill for binary segmentation, slower)
- **Traditional CV (edge detection):** Rejected (lower accuracy, not robust to variations)

---

**Decision 7: Random Forest for Yield Prediction**

**Decision:** Use Random Forest regression for yield prediction

**Rationale:**
- ✅ **Accuracy:** Achieves 85%+ accuracy on agricultural datasets
- ✅ **Interpretability:** Feature importance (understand what drives yield)
- ✅ **Robustness:** Handles missing data, outliers, non-linear relationships
- ✅ **Fast Training:** Trains in minutes (vs. hours for deep learning)
- ✅ **Small Model:** <10 MB (easy to deploy, fast inference)

**Trade-offs:**
- ➕ **Pros:** High accuracy, interpretable, fast, robust
- ➖ **Cons:** Not as accurate as deep learning for very large datasets
- 🔄 **Mitigation:** Sufficient for MVP (500+ training samples), can upgrade to neural network in Phase 2

**Alternatives Considered:**
- **Linear Regression:** Rejected (too simple, lower accuracy)
- **Neural Network (LSTM):** Rejected (requires more data, harder to interpret, overkill for MVP)
- **XGBoost:** Considered (similar accuracy, slightly faster), but Random Forest chosen for simplicity

---

**Decision 8: Railway for MVP Hosting**

**Decision:** Deploy MVP on Railway, migrate to AWS in Phase 2+

**Rationale:**
- ✅ **Cost:** Free tier ($5/month credit) sufficient for 100 users
- ✅ **Simplicity:** Git push to deploy, no DevOps expertise needed
- ✅ **Managed Services:** PostgreSQL, Redis included (no setup)
- ✅ **Auto-Scaling:** Automatic (within limits)
- ✅ **SSL:** Free automatic certificates

**Trade-offs:**
- ➕ **Pros:** Zero cost, easy deployment, managed services
- ➖ **Cons:** Limited to 512 MB RAM per service, vendor lock-in
- 🔄 **Mitigation:** Design for portability (Docker, environment variables), migrate to AWS when scale requires

**Alternatives Considered:**
- **AWS (from start):** Rejected (complex setup, higher cost, overkill for MVP)
- **Heroku:** Rejected (more expensive than Railway, similar features)
- **DigitalOcean:** Rejected (requires more DevOps, not fully managed)
- **Vercel/Netlify:** Rejected (frontend-focused, not suitable for backend API)

---

**Decision 9: REST API (not GraphQL)**

**Decision:** Use RESTful API architecture

**Rationale:**
- ✅ **Simplicity:** Easier to implement, test, document
- ✅ **Caching:** HTTP caching works out-of-box (CDN, browser, Redis)
- ✅ **Tooling:** Excellent tooling (Postman, Swagger, curl)
- ✅ **Team Expertise:** Team familiar with REST

**Trade-offs:**
- ➕ **Pros:** Simple, cacheable, well-understood, excellent tooling
- ➖ **Cons:** Over-fetching (get more data than needed), multiple requests for related data
- 🔄 **Mitigation:** Design endpoints to return complete data (reduce round-trips), use query parameters for filtering

**Alternatives Considered:**
- **GraphQL:** Rejected (learning curve, caching complexity, overkill for simple CRUD)
- **gRPC:** Rejected (binary protocol, harder to debug, not browser-friendly)

---

**Decision 10: Sentinel Hub (not Google Earth Engine)**

**Decision:** Use Sentinel Hub API for satellite imagery

**Rationale:**
- ✅ **Free Tier:** Academic account (3,000 requests/month, sufficient for MVP)
- ✅ **API Quality:** RESTful API, excellent documentation, reliable
- ✅ **Performance:** Fast image retrieval (<10s), on-demand processing
- ✅ **Features:** Cloud masking, atmospheric correction, custom evalscripts

**Trade-offs:**
- ➕ **Pros:** Free, fast, reliable, excellent API
- ➖ **Cons:** Rate limit (3,000 req/month), academic account approval required
- 🔄 **Mitigation:** Aggressive caching (30 days), fallback to Google Earth Engine if needed

**Alternatives Considered:**
- **Google Earth Engine:** Considered (free, unlimited), but API more complex, slower
- **AWS Ground Station:** Rejected (expensive, overkill)
- **Direct Sentinel-2 Download:** Rejected (large files, slow, requires processing infrastructure)

---

### 11.2 Trade-offs Analysis

**Performance vs. Cost:**

| **Aspect** | **High Performance Option** | **Cost-Effective Option** | **Decision** |
|------------|----------------------------|---------------------------|--------------|
| **Hosting** | AWS EC2 (dedicated instances) | Railway (shared infrastructure) | Railway (MVP), AWS (Phase 2) |
| **Database** | AWS RDS (Multi-AZ, read replicas) | Railway PostgreSQL (single instance) | Railway (MVP), RDS (Phase 2) |
| **CDN** | CloudFront (global edge locations) | No CDN (direct from server) | CloudFront (static assets only) |
| **Caching** | Redis Cluster (high availability) | Redis single instance | Single instance (MVP), Cluster (Phase 2) |
| **ML Inference** | GPU instances (faster inference) | CPU instances (slower but cheaper) | CPU (MVP), GPU (Phase 2) |

**Decision:** Prioritize cost for MVP (100 users), invest in performance for scale (1,000+ users)

---

**Scalability vs. Simplicity:**

| **Aspect** | **Scalable Option** | **Simple Option** | **Decision** |
|------------|---------------------|-------------------|--------------|
| **Architecture** | Microservices | Modular monolith | Modular monolith (MVP) |
| **Database** | Sharded (horizontal scaling) | Single instance | Single instance (MVP) |
| **Message Queue** | RabbitMQ/Kafka (async processing) | Direct function calls | Direct calls (MVP), Queue (Phase 2) |
| **Load Balancing** | Multiple instances + ALB | Single instance | Single instance (MVP), ALB (Phase 2) |

**Decision:** Start simple, add complexity only when needed (YAGNI principle)

---

**Accuracy vs. Speed:**

| **Aspect** | **High Accuracy Option** | **Fast Option** | **Decision** |
|------------|-------------------------|-----------------|--------------|
| **Boundary Detection** | Ensemble models (multiple models) | Single U-Net model | Single U-Net (85% IoU sufficient) |
| **Yield Prediction** | Deep learning (LSTM) | Random Forest | Random Forest (85% accuracy sufficient) |
| **Satellite Resolution** | 3m (Planet Labs, paid) | 10m (Sentinel-2, free) | 10m (free, sufficient for paddy fields) |

**Decision:** Balance accuracy and speed based on user needs (85% accuracy acceptable, <60s processing critical)

---

### 11.3 Technology Selection Matrix

**Evaluation Criteria:**
1. **Cost:** Free tier availability, pricing at scale
2. **Performance:** Speed, latency, throughput
3. **Scalability:** Horizontal scaling, limits
4. **Reliability:** Uptime, SLA, community support
5. **Developer Experience:** Documentation, tooling, learning curve
6. **Team Expertise:** Existing knowledge, training required

**Backend Framework Comparison:**

| **Criteria** | **Node.js/Express** | **Python/Django** | **Go/Gin** | **Decision** |
|--------------|---------------------|-------------------|------------|--------------|
| **Cost** | ⭐⭐⭐⭐⭐ (free, low resource) | ⭐⭐⭐⭐ (free, moderate resource) | ⭐⭐⭐⭐⭐ (free, very low resource) | Node.js |
| **Performance** | ⭐⭐⭐⭐ (fast I/O) | ⭐⭐⭐ (slower I/O) | ⭐⭐⭐⭐⭐ (fastest) | Node.js |
| **Scalability** | ⭐⭐⭐⭐ (horizontal) | ⭐⭐⭐⭐ (horizontal) | ⭐⭐⭐⭐⭐ (excellent) | Node.js |
| **Reliability** | ⭐⭐⭐⭐ (mature) | ⭐⭐⭐⭐⭐ (very mature) | ⭐⭐⭐⭐ (mature) | Node.js |
| **Dev Experience** | ⭐⭐⭐⭐⭐ (excellent) | ⭐⭐⭐⭐ (good) | ⭐⭐⭐ (learning curve) | Node.js |
| **Team Expertise** | ⭐⭐⭐⭐⭐ (high) | ⭐⭐⭐ (moderate) | ⭐⭐ (low) | Node.js |
| **Ecosystem** | ⭐⭐⭐⭐⭐ (2M+ packages) | ⭐⭐⭐⭐ (large) | ⭐⭐⭐ (growing) | Node.js |

**Winner:** Node.js/Express (best balance for team, timeline, cost)

---

**Database Comparison:**

| **Criteria** | **PostgreSQL** | **MongoDB** | **MySQL** | **Decision** |
|--------------|----------------|-------------|-----------|--------------|
| **Spatial Data** | ⭐⭐⭐⭐⭐ (PostGIS) | ⭐⭐ (basic) | ⭐⭐⭐ (MySQL Spatial) | PostgreSQL |
| **ACID** | ⭐⭐⭐⭐⭐ (full) | ⭐⭐⭐⭐ (transactions) | ⭐⭐⭐⭐⭐ (full) | PostgreSQL |
| **Flexibility** | ⭐⭐⭐ (JSONB) | ⭐⭐⭐⭐⭐ (schemaless) | ⭐⭐ (rigid) | MongoDB |
| **Scalability** | ⭐⭐⭐⭐ (vertical) | ⭐⭐⭐⭐⭐ (horizontal) | ⭐⭐⭐⭐ (vertical) | Both |
| **Cost** | ⭐⭐⭐⭐⭐ (free) | ⭐⭐⭐⭐⭐ (free) | ⭐⭐⭐⭐⭐ (free) | Both |

**Winner:** PostgreSQL (primary) + MongoDB (secondary) - polyglot persistence

---

**ML Framework Comparison:**

| **Criteria** | **TensorFlow** | **PyTorch** | **scikit-learn** | **Decision** |
|--------------|----------------|-------------|------------------|--------------|
| **Deep Learning** | ⭐⭐⭐⭐⭐ (excellent) | ⭐⭐⭐⭐⭐ (excellent) | ⭐⭐ (basic) | TensorFlow/PyTorch |
| **Traditional ML** | ⭐⭐⭐ (good) | ⭐⭐⭐ (good) | ⭐⭐⭐⭐⭐ (excellent) | scikit-learn |
| **Production** | ⭐⭐⭐⭐⭐ (TF Serving) | ⭐⭐⭐⭐ (TorchServe) | ⭐⭐⭐⭐ (pickle) | TensorFlow |
| **Community** | ⭐⭐⭐⭐⭐ (largest) | ⭐⭐⭐⭐⭐ (growing) | ⭐⭐⭐⭐⭐ (mature) | All |
| **Learning Curve** | ⭐⭐⭐ (moderate) | ⭐⭐⭐⭐ (easier) | ⭐⭐⭐⭐⭐ (easiest) | Mixed |

**Winner:** TensorFlow (U-Net boundary detection) + scikit-learn (Random Forest yield prediction)

---

### 11.4 Design Constraints and Limitations

**Technical Constraints:**

1. **Satellite Resolution:** 10m (Sentinel-2) - cannot detect features <10m
   - **Impact:** Small fields (<0.1 ha) may not be accurately detected
   - **Mitigation:** Set minimum field size to 0.1 ha, provide manual drawing option

2. **Satellite Revisit:** 5 days (Sentinel-2) - cannot provide daily updates
   - **Impact:** Health data updates every 5-7 days (not real-time)
   - **Mitigation:** Set user expectations, show "Last updated: X days ago"

3. **Cloud Cover:** >20% makes images unusable
   - **Impact:** No health updates during monsoon season (frequent clouds)
   - **Mitigation:** Use historical data, provide disclaimer, wait for clear images

4. **AI Processing Time:** 30-60 seconds (user must wait)
   - **Impact:** User experience (waiting is frustrating)
   - **Mitigation:** Show progress indicator with tips, set expectations (<60s)

**Budget Constraints:**

1. **Free Tier Limits:**
   - Sentinel Hub: 3,000 requests/month (100 users × 30 requests = 3,000 ✅)
   - OpenWeatherMap: 1M calls/month (100 users × 100 calls/day × 30 days = 300K ✅)
   - Railway: $5/month credit (sufficient for 100 users ✅)

2. **No Paid Services:**
   - Cannot use paid satellite data (Planet Labs, Maxar)
   - Cannot use paid ML APIs (Google Cloud Vision, AWS Rekognition)
   - Cannot use paid monitoring (Datadog, New Relic)
   - **Mitigation:** Use open-source alternatives (Prometheus, Grafana)

**Timeline Constraints:**

1. **16-Week Development:**
   - Must prioritize P0 features only
   - No time for advanced features (pest detection, multi-crop support)
   - **Mitigation:** Clear MVP scope, defer P1/P2 features to Phase 2

**Resource Constraints:**

1. **1-2 Developers:**
   - Cannot build microservices (too complex)
   - Cannot build native mobile apps (2x effort)
   - **Mitigation:** Modular monolith, React Native (code reuse)

---

### 11.5 Future Architecture Evolution

**Phase 1 (MVP - Months 1-4): Modular Monolith**
```
Single Node.js app
├── All services in one codebase
├── Single PostgreSQL database
├── Single Redis instance
└── Deployed on Railway (1-2 instances)

Users: 100
Requests: 10,000/day
Cost: $0-5/month
```

**Phase 2 (Scale - Months 5-12): Optimized Monolith**
```
Node.js app (2-5 instances)
├── Load balancer (AWS ALB)
├── PostgreSQL (read replicas)
├── Redis cluster (high availability)
└── CDN (CloudFront)

Users: 500-1,000
Requests: 50,000/day
Cost: $50-100/month
```

**Phase 3 (National Scale - Year 2): Microservices**
```
Microservices architecture
├── API Gateway (Kong/AWS API Gateway)
├── Auth Service (separate)
├── Field Service (separate)
├── AI/ML Service (separate, GPU instances)
├── PostgreSQL (sharded)
├── MongoDB (replica set)
├── Redis cluster
├── Message queue (RabbitMQ/Kafka)
└── Kubernetes (EKS)

Users: 5,000+
Requests: 500,000/day
Cost: $500-1,000/month
```

**Migration Strategy:**

1. **Extract AI/ML Service First:**
   - Reason: Compute-intensive, independent, easy to scale separately
   - Timeline: Month 6-7
   - Benefit: Offload CPU load from main API, enable GPU instances

2. **Extract Satellite Service Second:**
   - Reason: External API dependency, caching-heavy, rate-limited
   - Timeline: Month 8-9
   - Benefit: Isolate external API failures, independent scaling

3. **Extract Other Services as Needed:**
   - Based on scaling bottlenecks
   - Timeline: Year 2+
   - Benefit: Scale only what needs scaling

---

## 12. APPENDICES

### Appendix A: API Specification (OpenAPI 3.0)

**Sample API Specification:**

```yaml
openapi: 3.0.0
info:
  title: SkyCrop API
  version: 1.0.0
  description: Satellite-based paddy field monitoring API

servers:
  - url: https://api.skycrop.com/v1
    description: Production server
  - url: https://api-staging.skycrop.com/v1
    description: Staging server

paths:
  /auth/signup:
    post:
      summary: Register new user
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                  example: farmer@example.com
                password:
                  type: string
                  minLength: 8
                  example: SecurePass123
                name:
                  type: string
                  example: Sunil Perera
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      user_id:
                        type: string
                        format: uuid
                      email:
                        type: string
                      token:
                        type: string
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /fields:
    get:
      summary: List user's fields
      tags: [Fields]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List of fields
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Field'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  
  schemas:
    Field:
      type: object
      properties:
        field_id:
          type: string
          format: uuid
        name:
          type: string
        area:
          type: number
          format: float
        boundary:
          type: object
          description: GeoJSON Polygon
        health_status:
          type: string
          enum: [excellent, good, fair, poor]
        created_at:
          type: string
          format: date-time
    
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
```

### Appendix B: Database Schema Diagram

**Entity-Relationship Diagram:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Schema                             │
│                                                                  │
│  ┌──────────────┐                                               │
│  │    users     │                                               │
│  ├──────────────┤                                               │
│  │ user_id (PK) │                                               │
│  │ email (UQ)   │                                               │
│  │ password_hash│                                               │
│  │ name         │                                               │
│  │ role         │                                               │
│  │ created_at   │                                               │
│  └──────┬───────┘                                               │
│         │ 1                                                     │
│         │                                                       │
│         │ *                                                     │
│  ┌──────┴───────┐                                               │
│  │   fields     │                                               │
│  ├──────────────┤                                               │
│  │ field_id (PK)│                                               │
│  │ user_id (FK) │                                               │
│  │ name         │                                               │
│  │ boundary     │ (GEOMETRY Polygon)                           │
│  │ area         │                                               │
│  │ center       │ (GEOMETRY Point)                             │
│  │ status       │                                               │
│  │ created_at   │                                               │
│  └──────┬───────┘                                               │
│         │ 1                                                     │
│         │                                                       │
│         │ *                                                     │
│  ┌──────┴────────────┐                                          │
│  │  health_records   │                                          │
│  ├───────────────────┤                                          │
│  │ record_id (PK)    │                                          │
│  │ field_id (FK)     │                                          │
│  │ measurement_date  │                                          │
│  │ ndvi_mean         │                                          │
│  │ ndwi_mean         │                                          │
│  │ health_status     │                                          │
│  │ health_score      │                                          │
│  │ trend             │                                          │
│  │ created_at        │                                          │
│  └───────────────────┘                                          │
│         │ 1                                                     │
│         │                                                       │
│  ┌──────┴────────────┐                                          │
│  │ recommendations   │                                          │
│  ├───────────────────┤                                          │
│  │ recommendation_id │                                          │
│  │ field_id (FK)     │                                          │
│  │ type              │                                          │
│  │ severity          │                                          │
│  │ description       │                                          │
│  │ status            │                                          │
│  │ created_at        │                                          │
│  └───────────────────┘                                          │
│         │ 1                                                     │
│         │                                                       │
│  ┌──────┴────────────┐                                          │
│  │ yield_predictions │                                          │
│  ├───────────────────┤                                          │
│  │ prediction_id (PK)│                                          │
│  │ field_id (FK)     │                                          │
│  │ prediction_date   │                                          │
│  │ predicted_yield   │                                          │
│  │ confidence_lower  │                                          │
│  │ confidence_upper  │                                          │
│  │ actual_yield      │                                          │
│  │ created_at        │                                          │
│  └───────────────────┘                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Appendix C: Deployment Checklist

**Pre-Deployment:**
- [ ] All P0 features implemented and tested
- [ ] Code coverage ≥80%
- [ ] Security audit passed (OWASP Top 10)
- [ ] Performance testing passed (load testing, stress testing)
- [ ] Database migrations tested (rollback plan ready)
- [ ] Environment variables configured (production)
- [ ] SSL certificates obtained (Let's Encrypt)
- [ ] Monitoring configured (Prometheus, Grafana)
- [ ] Backup strategy tested (restore from backup)
- [ ] Documentation complete (API docs, deployment guide, user guide)

**Deployment:**
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Deploy to production (blue-green deployment)
- [ ] Run smoke tests on production
- [ ] Monitor for errors (first 24 hours)
- [ ] Verify backups running
- [ ] Verify monitoring alerts working

**Post-Deployment:**
- [ ] Onboard first 10 farmers (pilot group)
- [ ] Collect user feedback
- [ ] Monitor system performance (uptime, latency, errors)
- [ ] Fix critical bugs (P0 bugs within 24 hours)
- [ ] Plan next sprint (P1 features)

### Appendix D: Technology Stack Versions

**Backend:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.35.0",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "mongoose": "^8.0.0",
    "redis": "^4.6.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "joi": "^17.11.0",
    "axios": "^1.6.0",
    "winston": "^3.11.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.0",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.54.0",
    "nodemon": "^3.0.1"
  }
}
```

**Frontend (Web):**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@reduxjs/toolkit": "^1.9.7",
    "react-redux": "^8.1.3",
    "@tanstack/react-query": "^5.8.0",
    "axios": "^1.6.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.10.0",
    "react-hook-form": "^7.48.0",
    "tailwindcss": "^3.3.5"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "eslint": "^8.54.0",
    "vitest": "^1.0.0"
  }
}
```

**Mobile (React Native):**
```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.7",
    "react-navigation": "^6.0.0",
    "@reduxjs/toolkit": "^1.9.7",
    "react-redux": "^8.1.3",
    "@tanstack/react-query": "^5.8.0",
    "axios": "^1.6.0",
    "react-native-maps": "^1.8.0",
    "@react-native-firebase/app": "^18.6.0",
    "@react-native-firebase/messaging": "^18.6.0",
    "@react-native-async-storage/async-storage": "^1.19.0",
    "@nozbe/watermelondb": "^0.27.0"
  },
  "devDependencies": {
    "@react-native-community/eslint-config": "^3.2.0",
    "jest": "^29.7.0"
  }
}
```

**ML Service (Python):**
```txt
# requirements.txt
tensorflow==2.14.0
torch==2.1.0
scikit-learn==1.3.2
numpy==1.26.0
pandas==2.1.3
opencv-python==4.8.1
rasterio==1.3.9
shapely==2.0.2
flask==3.0.0
gunicorn==21.2.0
```

### Appendix E: Glossary

| **Term** | **Definition** |
|----------|----------------|
| **API Gateway** | Single entry point for all client requests, handles routing, authentication, rate limiting |
| **Circuit Breaker** | Design pattern that prevents cascading failures by stopping requests to failing services |
| **DAO (Data Access Object)** | Pattern that abstracts database operations from business logic |
| **Horizontal Scaling** | Adding more servers to handle increased load (scale out) |
| **Vertical Scaling** | Adding more resources (CPU, RAM) to existing server (scale up) |
| **IoU (Intersection over Union)** | Metric for boundary detection accuracy (0-1, higher is better) |
| **JWT (JSON Web Token)** | Stateless authentication token containing user claims |
| **MAPE (Mean Absolute Percentage Error)** | Metric for prediction accuracy (lower is better) |
| **Modular Monolith** | Single deployable unit with clear module boundaries (easy to extract later) |
| **Polyglot Persistence** | Using multiple database types for different data needs |
| **Repository Pattern** | Abstraction layer between business logic and data access |
| **Service Layer** | Layer containing business logic, orchestrates operations across repositories |
| **TTL (Time To Live)** | Duration before cached data expires |

### Appendix F: Design Review Checklist

**Architecture Review:**
- [x] System architecture clearly defined
- [x] Component responsibilities well-defined
- [x] Component interactions documented
- [x] Technology stack justified
- [x] Design patterns appropriate
- [x] SOLID principles applied
- [x] Separation of concerns maintained

**Scalability Review:**
- [x] Horizontal scaling strategy defined
- [x] Caching strategy comprehensive
- [x] Database optimization planned
- [x] Load balancing configured
- [x] Auto-scaling policies defined

**Security Review:**
- [x] Authentication mechanism secure (OAuth 2.0, JWT)
- [x] Authorization implemented (RBAC)
- [x] Data encryption (in transit and at rest)
- [x] Input validation comprehensive
- [x] Rate limiting configured
- [x] Security headers implemented
- [x] Audit logging planned

**Performance Review:**
- [x] Performance targets defined (<3s API, <60s AI)
- [x] Caching strategy comprehensive
- [x] Database queries optimized
- [x] CDN strategy defined
- [x] Image optimization planned

**Reliability Review:**
- [x] Availability target defined (99% uptime)
- [x] Fault tolerance mechanisms (circuit breaker, retry, fallback)
- [x] Backup strategy defined (daily, 30-day retention)
- [x] Disaster recovery plan documented
- [x] Monitoring and alerting configured

**Maintainability Review:**
- [x] Code organization clear (layered architecture)
- [x] Design patterns documented
- [x] API specification complete (OpenAPI)
- [x] Database schema documented
- [x] Deployment process automated (CI/CD)

### Appendix G: References

**Architecture Patterns:**
1. Martin Fowler - Patterns of Enterprise Application Architecture
2. Microsoft - Cloud Design Patterns
3. AWS - Well-Architected Framework
4. Google - Site Reliability Engineering (SRE) Book

**Technology Documentation:**
1. React.js: https://react.dev/
2. React Native: https://reactnative.dev/
3. Node.js: https://nodejs.org/
4. Express.js: https://expressjs.com/
5. PostgreSQL: https://www.postgresql.org/
6. MongoDB: https://www.mongodb.com/
7. Redis: https://redis.io/
8. TensorFlow: https://www.tensorflow.org/
9. Sentinel Hub: https://docs.sentinel-hub.com/

**Best Practices:**
1. OWASP Top 10: https://owasp.org/www-project-top-ten/
2. WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
3. REST API Design: https://restfulapi.net/
4. Microservices Patterns: https://microservices.io/

---

## DOCUMENT APPROVAL

**System Design Document Sign-Off:**

By signing below, the undersigned acknowledge that they have reviewed the System Design Document and agree that it provides a comprehensive and implementable design for the SkyCrop system.

| **Name** | **Role** | **Signature** | **Date** |
|----------|----------|---------------|----------|
| [Your Name] | System Architect | _________________ | __________ |
| [Tech Lead] | Technical Lead | _________________ | __________ |
| [ML Engineer] | ML Engineer | _________________ | __________ |
| [PM Name] | Product Manager | _________________ | __________ |
| [Supervisor] | Project Sponsor | _________________ | __________ |

**Approval Decision:** ☐ APPROVED - Proceed to Implementation ☐ CONDITIONAL APPROVAL ☐ REJECTED

**Comments:**

---

## DOCUMENT HISTORY

| **Version** | **Date** | **Author** | **Changes** |
|-------------|----------|------------|-------------|
| 0.1 | Oct 29, 2025 | System Architect | Initial draft (Sections 1-4) |
| 0.5 | Oct 29, 2025 | System Architect | Added Sections 5-8 (AI/ML, Data, Integration, Security) |
| 0.9 | Oct 29, 2025 | System Architect | Added Sections 9-10 (Scalability, Deployment) |
| 1.0 | Oct 29, 2025 | System Architect | Final version (Design Decisions, Appendices) |

---

**END OF SYSTEM DESIGN DOCUMENT**

---

**Next Steps:**
1. ✅ Obtain SDD approval from all stakeholders
2. ✅ Create detailed database schema (DDL scripts)
3. ✅ Create API specification (complete OpenAPI 3.0 document)
4. ✅ Create UI/UX mockups (Figma wireframes)
5. ✅ Begin Sprint 1 (Week 3): Authentication & User Management
6. ✅ Set up development environment (Docker Compose)
7. ✅ Initialize Git repository and CI/CD pipeline

**For Questions or Clarifications:**
Contact System Architect: [Your Email] | [Your Phone]

**Document Location:** `Doc/System Design Phase/system_design_document.md`

---

*This document is confidential and intended for the development team and project stakeholders only.*