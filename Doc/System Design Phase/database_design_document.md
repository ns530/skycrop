
# DATABASE DESIGN DOCUMENT

## SkyCrop: Satellite-Based Paddy Field Management & Monitoring System

---

## DOCUMENT CONTROL

| **Item** | **Details** |
|----------|-------------|
| **Document Title** | Database Design Document |
| **Project Name** | SkyCrop - Intelligent Paddy Field Monitoring System |
| **Document Code** | SKYCROP-DBD-2025-001 |
| **Version** | 1.0 |
| **Date** | October 29, 2025 |
| **Prepared By** | System Architect, Database Administrator |
| **Reviewed By** | Technical Lead, Backend Developer |
| **Approved By** | Project Sponsor, Product Manager |
| **Status** | Approved |
| **Confidentiality** | Internal - For Development Team |

---

## EXECUTIVE SUMMARY

### Purpose

This Database Design Document provides comprehensive specifications for the SkyCrop database architecture, including entity-relationship diagrams, table schemas, indexes, constraints, and SQL DDL scripts. It serves as the definitive guide for database implementation and maintenance.

### Database Strategy

**Polyglot Persistence Approach:**
- **PostgreSQL + PostGIS:** Primary database for relational data with spatial support (users, fields, health records, predictions)
- **MongoDB:** Document database for flexible schema data (news articles, analytics events, logs)
- **Redis:** In-memory cache for sessions, API responses, and rate limiting

### Key Design Principles

1. **Data Integrity:** ACID compliance, foreign key constraints, check constraints
2. **Performance:** Strategic indexing, query optimization, partitioning
3. **Scalability:** Horizontal scaling support, sharding strategy
4. **Security:** Encryption at rest, access control, audit logging
5. **Maintainability:** Clear naming conventions, comprehensive documentation

---

## TABLE OF CONTENTS

1. [Database Architecture Overview](#1-database-architecture-overview)
2. [PostgreSQL Database Design](#2-postgresql-database-design)
3. [MongoDB Database Design](#3-mongodb-database-design)
4. [Redis Cache Design](#4-redis-cache-design)
5. [Entity-Relationship Diagrams](#5-entity-relationship-diagrams)
6. [Table Schemas & DDL Scripts](#6-table-schemas--ddl-scripts)
7. [Indexes & Performance Optimization](#7-indexes--performance-optimization)
8. [Data Relationships & Constraints](#8-data-relationships--constraints)
9. [Database Operations & Queries](#9-database-operations--queries)
10. [Data Migration & Versioning](#10-data-migration--versioning)
11. [Backup & Recovery Strategy](#11-backup--recovery-strategy)
12. [Appendices](#12-appendices)

---

## 1. DATABASE ARCHITECTURE OVERVIEW

### 1.1 Database Distribution

```
┌─────────────────────────────────────────────────────────────────┐
│                    Database Architecture                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              PostgreSQL + PostGIS                       │    │
│  │              (Primary Relational Database)              │    │
│  │                                                         │    │
│  │  Tables:                                                │    │
│  │  • users                (User accounts)                │    │
│  │  • fields               (Paddy fields with boundaries) │    │
│  │  • health_records       (NDVI, NDWI, TDVI data)       │    │
│  │  • recommendations      (Water, fertilizer advice)     │    │
│  │  • yield_predictions    (ML predictions)               │    │
│  │  • disaster_assessments (Damage reports)               │    │
│  │  • weather_forecasts    (Weather data)                 │    │
│  │  • security_logs        (Audit trail)                  │    │
│  │                                                         │    │
│  │  Extensions:                                            │    │
│  │  • PostGIS              (Spatial data support)         │    │
│  │  • uuid-ossp            (UUID generation)              │    │
│  │  • pg_trgm              (Full-text search)             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    MongoDB                              │    │
│  │              (Document Database)                        │    │
│  │                                                         │    │
│  │  Collections:                                           │    │
│  │  • news_articles        (Agricultural news)            │    │
│  │  • analytics_events     (User behavior tracking)       │    │
│  │  • application_logs     (System logs)                  │    │
│  │  • error_logs           (Error tracking)               │    │
│  │                                                         │    │
│  │  Features:                                              │    │
│  │  • Flexible schema      (Evolving content)             │    │
│  │  • Time-series          (Analytics optimization)       │    │
│  │  • Full-text search     (Article search)               │    │
│  │  • TTL indexes          (Auto-expiry)                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                      Redis                              │    │
│  │              (In-Memory Cache)                          │    │
│  │                                                         │    │
│  │  Data Structures:                                       │    │
│  │  • Strings              (Sessions, tokens)             │    │
│  │  • Hashes               (User data, field data)        │    │
│  │  • Sets                 (Rate limiting)                │    │
│  │  • Sorted Sets          (Leaderboards - Phase 2)       │    │
│  │  • Lists                (Job queues - Phase 2)         │    │
│  │                                                         │    │
│  │  Use Cases:                                             │    │
│  │  • Session storage      (JWT tokens, 30-day TTL)       │    │
│  │  • API response cache   (1-6 hour TTL)                 │    │
│  │  • Rate limiting        (1-hour TTL)                   │    │
│  │  • Satellite image cache (30-day TTL)                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Database Selection Rationale

| **Database** | **Use Case** | **Why Chosen** | **Alternatives Rejected** |
|--------------|-------------|----------------|---------------------------|
| **PostgreSQL + PostGIS** | Users, fields, health records, predictions | • ACID compliance (data integrity)<br>• PostGIS (spatial queries)<br>• Complex JOINs<br>• Mature, reliable | MySQL (weaker spatial support)<br>MongoDB (no ACID for critical data) |
| **MongoDB** | News articles, analytics, logs | • Flexible schema<br>• Time-series optimization<br>• Horizontal scaling<br>• JSON-native | PostgreSQL JSONB (less flexible)<br>Cassandra (overkill for scale) |
| **Redis** | Sessions, cache, rate limiting | • In-memory speed<br>• TTL support<br>• Pub/Sub<br>• Simple data structures | Memcached (no persistence)<br>In-memory JS (not shared) |

### 1.3 Data Volume Estimates

**Year 1 (100 users):**
- Users: 100 rows (~10 KB)
- Fields: 100 rows (~50 KB with geometries)
- Health Records: 3,000 rows (100 fields × 30 measurements) (~300 KB)
- Recommendations: 6,000 rows (100 fields × 60 recommendations) (~600 KB)
- Yield Predictions: 600 rows (100 fields × 6 predictions) (~60 KB)
- Weather Forecasts: 700 rows (100 fields × 7 days) (~70 KB)
- News Articles: 100 documents (~1 MB)
- Analytics Events: 300,000 documents (100 users × 100 events/day × 30 days) (~30 MB)
- **Total PostgreSQL:** ~5 MB
- **Total MongoDB:** ~31 MB
- **Total Redis:** ~100 MB (cache)

**Year 3 (5,000 users):**
- **Total PostgreSQL:** ~250 MB
- **Total MongoDB:** ~1.5 GB
- **Total Redis:** ~500 MB

---

## 2. POSTGRESQL DATABASE DESIGN

### 2.1 Complete Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database Schema                                │
│                                                                              │
│  ┌──────────────────┐                                                       │
│  │      users       │                                                       │
│  ├──────────────────┤                                                       │
│  │ PK user_id       │ UUID                                                  │
│  │ UQ email         │ VARCHAR(255)                                          │
│  │    password_hash │ VARCHAR(255)                                          │
│  │    name          │ VARCHAR(100)                                          │
│  │    phone         │ VARCHAR(20)                                           │
│  │    role          │ ENUM('farmer','admin')                                │
│  │    auth_provider │ ENUM('google','email')                                │
│  │    email_verified│ BOOLEAN                                               │
│  │    profile_photo │ VARCHAR(500)                                          │
│  │    location      │ VARCHAR(100)                                          │
│  │    created_at    │ TIMESTAMP                                             │
│  │    updated_at    │ TIMESTAMP                                             │
│  │    last_login    │ TIMESTAMP                                             │
│  │    status        │ ENUM('active','suspended','deleted')                  │
│  └────────┬─────────┘                                                       │
│           │ 1                                                                │
│           │                                                                  │
│           │ *                                                                │
│  ┌────────┴─────────┐                                                       │
│  │     fields       │                                                       │
│  ├──────────────────┤                                                       │
│  │ PK field_id      │ UUID                                                  │
│  │ FK user_id       │ UUID → users.user_id                                  │
│  │ UQ name          │ VARCHAR(50) (unique per user)                         │
│  │    boundary      │ GEOMETRY(Polygon, 4326)                               │
│  │    area          │ DECIMAL(10,2)                                         │
│  │    center        │ GEOMETRY(Point, 4326)                                 │
│  │    created_at    │ TIMESTAMP                                             │
│  │    updated_at    │ TIMESTAMP                                             │
│  │    status        │ ENUM('active','archived','deleted')                   │
│  └────────┬─────────┘                                                       │
│           │ 1                                                                │
│           │                                                                  │
│           │ *                                                                │
│  ┌────────┴──────────────┐                                                  │
│  │   health_records      │                                                  │
│  ├───────────────────────┤                                                  │
│  │ PK record_id          │ UUID                                             │
│  │ FK field_id           │ UUID → fields.field_id                           │
│  │ UQ measurement_date   │ DATE (unique per field)                          │
│  │    ndvi_mean          │ DECIMAL(5,4)                                     │
│  │    ndvi_min           │ DECIMAL(5,4)                                     │
│  │    ndvi_max           │ DECIMAL(5,4)                                     │
│  │    ndvi_std           │ DECIMAL(5,4)                                     │
│  │    ndwi_mean          │ DECIMAL(5,4)                                     │
│  │    ndwi_min           │ DECIMAL(5,4)                                     │
│  │    ndwi_max           │ DECIMAL(5,4)                                     │
│  │    ndwi_std           │ DECIMAL(5,4)                                     │
│  │    tdvi_mean          │ DECIMAL(5,4)                                     │
│  │    health_status      │ ENUM('excellent','good','fair','poor')           │
│  │    health_score       │ INTEGER (0-100)                                  │
│  │    trend              │ ENUM('improving','stable','declining')           │
│  │    satellite_image_id │ VARCHAR(100)                                     │
│  │    cloud_cover        │ DECIMAL(5,2)                                     │
│  │    created_at         │ TIMESTAMP                                        │
│  └───────────────────────┘                                                  │
│           │ 1                                                                │
│           │                                                                  │
│  ┌────────┴──────────────┐                                                  │
│  │   recommendations     │                                                  │
│  ├───────────────────────┤                                                  │
│  │ PK recommendation_id  │ UUID                                             │
│  │ FK field_id           │ UUID → fields.field_id                           │
│  │    type               │ ENUM('water','fertilizer','alert','general')     │
│  │    severity           │ ENUM('critical','high','medium','low')           │
│  │    title              │ VARCHAR(100)                                     │
│  │    description        │ TEXT                                             │
│  │    action             │ TEXT                                             │
│  │    zones              │ JSONB                                            │
│  │    estimated_savings  │ DECIMAL(10,2)                                    │
│  │    created_at         │ TIMESTAMP                                        │
│  │    expires_at         │ TIMESTAMP                                        │
│  │    status             │ ENUM('pending','done','ignored','expired')       │
│  │    user_action_at     │ TIMESTAMP                                        │
│  └───────────────────────┘                                                  │
│           │ 1                                                                │
│           │                                                                  │
│  ┌────────┴──────────────┐                                                  │
│  │  yield_predictions    │                                                  │
│  ├───────────────────────┤                                                  │
│  │ PK prediction_id      │ UUID                                             │
│  │ FK field_id           │ UUID → fields.field_id                           │
│  │    prediction_date    │ DATE                                             │
│  │    predicted_yield_ha │ DECIMAL(10,2)                                    │
│  │    predicted_total    │ DECIMAL(10,2)                                    │
│  │    confidence_lower   │ DECIMAL(10,2)                                    │
│  │    confidence_upper   │ DECIMAL(10,2)                                    │
│  │    expected_revenue   │ DECIMAL(12,2)                                    │
│  │    harvest_date_est   │ DATE                                             │
│  │    model_version      │ VARCHAR(20)                                      │
│  │    features_used      │ JSONB                                            │
│  │    actual_yield       │ DECIMAL(10,2)                                    │
│  │    accuracy_mape      │ DECIMAL(5,2)                                     │
│  │    created_at         │ TIMESTAMP                                        │
│  └───────────────────────┘                                                  │
│           │ 1                                                                │
│           │                                                                  │
│  ┌────────┴──────────────┐                                                  │
│  │ disaster_assessments  │                                                  │
│  ├───────────────────────┤                                                  │
│  │ PK assessment_id      │ UUID                                             │
│  │ FK field_id           │ UUID → fields.field_id                           │
│  │    disaster_type      │ ENUM('flood','drought','storm','other')          │
│  │    before_date        │ DATE                                             │
│  │    after_date         │ DATE                                             │
│  │    damaged_area_severe│ DECIMAL(10,2)                                    │
│  │    damaged_area_mod   │ DECIMAL(10,2)                                    │
│  │    damaged_area_minor │ DECIMAL(10,2)                                    │
│  │    total_damaged_area │ DECIMAL(10,2)                                    │
│  │    damage_percentage  │ DECIMAL(5,2)                                     │
│  │    yield_loss_kg      │ DECIMAL(10,2)                                    │
│  │    financial_loss     │ DECIMAL(12,2)                                    │
│  │    report_pdf_url     │ VARCHAR(500)                                     │
│  │    created_at         │ TIMESTAMP                                        │
│  └───────────────────────┘                                                  │
│           │ 1                                                                │
│           │                                                                  │
│  ┌────────┴──────────────┐                                                  │
│  │  weather_forecasts    │                                                  │
│  ├───────────────────────┤                                                  │
│  │ PK forecast_id        │ UUID                                             │
│  │ FK field_id           │ UUID → fields.field_id                           │
│  │ UQ forecast_date      │ DATE (unique per field)                          │
│  │    temperature_min    │ DECIMAL(5,2)                                     │
│  │    temperature_max    │ DECIMAL(5,2)                                     │
│  │    weather_condition  │ VARCHAR(50)                                      │
│  │    rainfall_prob      │ INTEGER (0-100)                                  │
│  │    rainfall_amount    │ DECIMAL(6,2)                                     │
│  │    humidity           │ INTEGER (0-100)                                  │
│  │    wind_speed         │ DECIMAL(5,2)                                     │
│  │    is_extreme         │ BOOLEAN                                          │
│  │    created_at         │ TIMESTAMP                                        │
│  └───────────────────────┘                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Database Sizing

**PostgreSQL Storage Estimates:**

| **Table** | **Rows (Year 1)** | **Avg Row Size** | **Total Size** | **Indexes** | **Total** |
|-----------|-------------------|------------------|----------------|-------------|-----------|
| users | 100 | 500 bytes | 50 KB | 20 KB | 70 KB |
| fields | 100 | 2 KB (with geometry) | 200 KB | 100 KB | 300 KB |
| health_records | 3,000 | 300 bytes | 900 KB | 400 KB | 1.3 MB |
| recommendations | 6,000 | 500 bytes | 3 MB | 1 MB | 4 MB |
| yield_predictions | 600 | 400 bytes | 240 KB | 100 KB | 340 KB |
| disaster_assessments | 20 | 400 bytes | 8 KB | 4 KB | 12 KB |
| weather_forecasts | 700 | 200 bytes | 140 KB | 70 KB | 210 KB |
| security_logs | 10,000 | 300 bytes | 3 MB | 1 MB | 4 MB |
| **TOTAL** | **20,520** | | **7.5 MB** | **2.7 MB** | **~10 MB** |

**Growth Projection:**
- Year 2 (1,000 users): ~100 MB
- Year 3 (5,000 users): ~500 MB
- Year 5 (50,000 users): ~5 GB

---

## 2. POSTGRESQL DATABASE DESIGN

### 2.1 Database Configuration

```sql
-- Database creation
CREATE DATABASE skycrop_production
  WITH 
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0;

-- Connect to database
\c skycrop_production

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "postgis";        -- Spatial data support
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Full-text search (trigram)
CREATE EXTENSION IF NOT EXISTS "btree_gist";     -- GiST indexes for btree types

-- Set timezone
SET timezone = 'Asia/Colombo';  -- Sri Lanka timezone (UTC+5:30)
```

### 2.2 Schema Organization

```sql
-- Create schemas for logical separation
CREATE SCHEMA IF NOT EXISTS public;      -- Default schema (tables)
CREATE SCHEMA IF NOT EXISTS audit;       -- Audit logs
CREATE SCHEMA IF NOT EXISTS analytics;   -- Analytics views
CREATE SCHEMA IF NOT EXISTS archive;     -- Archived data (Phase 2)

-- Set search path
SET search_path TO public, postgis;
```

---

## 3. MONGODB DATABASE DESIGN

### 3.1 Database Configuration

```javascript
// MongoDB connection
const mongoConfig = {
  uri: process.env.MONGO_URI,
  dbName: 'skycrop_production',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority'
  }
};
```

### 3.2 Collections Overview

| **Collection** | **Purpose** | **Document Size** | **Estimated Docs (Year 1)** | **Indexes** |
|----------------|-------------|-------------------|----------------------------|-------------|
| news_articles | Agricultural news and knowledge | ~10 KB | 100 | 5 |
| analytics_events | User behavior tracking | ~500 bytes | 300,000 | 4 |
| application_logs | System logs | ~1 KB | 50,000 | 2 |
| error_logs | Error tracking | ~2 KB | 1,000 | 3 |

---

## 4. REDIS CACHE DESIGN

### 4.1 Cache Key Naming Convention

```
Pattern: {namespace}:{entity}:{id}:{attribute}

Examples:
- session:token:abc123                    (Session data)
- user:uuid-123:profile                   (User profile cache)
- field:uuid-456:health                   (Field health data)
- weather:uuid-456:forecast               (Weather forecast)
- satellite:uuid-456:2025-10-28           (Satellite image metadata)
- rate-limit:user:uuid-123                (Rate limiting counter)
- rate-limit:ip:192.168.1.1               (IP-based rate limiting)
- blacklist:token:xyz789                  (Logged out tokens)
- email-verify:token:abc123               (Email verification tokens)
- password-reset:token:def456             (Password reset tokens)
```

### 4.2 Cache TTL Strategy

| **Cache Type** | **TTL** | **Rationale** |
|----------------|---------|---------------|
| Session tokens | 30 days | Match JWT expiry |
| Token blacklist | 30 days | Match JWT expiry |
| User profile | 1 hour | In
frequently updated |
| Field data | 1 hour | Balance freshness and API load |
| Health data | 1 hour | Updates every 5-7 days |
| Weather forecast | 6 hours | Updates every 6 hours |
| Satellite images | 30 days | Expensive to retrieve |
| News articles | 30 minutes | Relatively static |
| API responses | 5 minutes | General caching |
| Rate limit counters | 1 hour | Reset hourly |
| Email verification | 24 hours | Security requirement |
| Password reset | 24 hours | Security requirement |

---

## 5. ENTITY-RELATIONSHIP DIAGRAMS

### 5.1 Conceptual ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Conceptual Data Model                                │
│                                                                              │
│                                                                              │
│                          ┌──────────────┐                                   │
│                          │     USER     │                                   │
│                          │              │                                   │
│                          │ • user_id    │                                   │
│                          │ • email      │                                   │
│                          │ • name       │                                   │
│                          │ • role       │                                   │
│                          └──────┬───────┘                                   │
│                                 │                                            │
│                                 │ owns                                       │
│                                 │ 1:N                                        │
│                                 │                                            │
│                          ┌──────┴───────┐                                   │
│                          │    FIELD     │                                   │
│                          │              │                                   │
│                          │ • field_id   │                                   │
│                          │ • name       │                                   │
│                          │ • boundary   │ (Spatial)                         │
│                          │ • area       │                                   │
│                          └──────┬───────┘                                   │
│                                 │                                            │
│                    ┌────────────┼────────────┐                             │
│                    │            │            │                             │
│                    │ has        │ has        │ has                         │
│                    │ 1:N        │ 1:N        │ 1:N                         │
│                    │            │            │                             │
│             ┌──────┴──────┐ ┌──┴──────┐ ┌──┴──────────┐                  │
│             │   HEALTH    │ │  RECOM-  │ │    YIELD    │                  │
│             │   RECORD    │ │ MENDATION│ │ PREDICTION  │                  │
│             │             │ │          │ │             │                  │
│             │ • record_id │ │ • rec_id │ │ • pred_id   │                  │
│             │ • ndvi      │ │ • type   │ │ • yield     │                  │
│             │ • ndwi      │ │ • action │ │ • confidence│                  │
│             │ • status    │ │ • status │ │ • revenue   │                  │
│             └─────────────┘ └──────────┘ └─────────────┘                  │
│                                 │                                            │
│                                 │ has                                        │
│                                 │ 1:N                                        │
│                                 │                                            │
│                          ┌──────┴──────────┐                                │
│                          │    DISASTER     │                                │
│                          │   ASSESSMENT    │                                │
│                          │                 │                                │
│                          │ • assessment_id │                                │
│                          │ • disaster_type │                                │
│                          │ • damage_%      │                                │
│                          │ • financial_loss│                                │
│                          └─────────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Logical ER Diagram (with Cardinality)

```
users (1) ──────< (N) fields (1) ──────< (N) health_records
                      │
                      ├──────< (N) recommendations
                      │
                      ├──────< (N) yield_predictions
                      │
                      ├──────< (N) disaster_assessments
                      │
                      └──────< (N) weather_forecasts

Legend:
──────< : One-to-Many relationship
(1)     : One
(N)     : Many
```

---

## 6. TABLE SCHEMAS & DDL SCRIPTS

### 6.1 Users Table

```sql
-- ============================================================================
-- Table: users
-- Purpose: Store user account information and authentication data
-- ============================================================================

CREATE TABLE users (
    -- Primary Key
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),  -- NULL for OAuth users
    auth_provider VARCHAR(20) NOT NULL CHECK (auth_provider IN ('google', 'email')),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Profile Information
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_photo_url VARCHAR(500),
    location VARCHAR(100),
    
    -- Authorization
    role VARCHAR(20) NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin')),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'))
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE status = 'active';
CREATE INDEX idx_users_status_created ON users(status, created_at);
CREATE INDEX idx_users_last_login ON users(last_login DESC);
CREATE INDEX idx_users_role ON users(role) WHERE role = 'admin';

-- Comments
COMMENT ON TABLE users IS 'User accounts and authentication data';
COMMENT ON COLUMN users.user_id IS 'Unique user identifier (UUID)';
COMMENT ON COLUMN users.email IS 'User email address (unique, case-insensitive)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (NULL for OAuth users)';
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: google or email';
COMMENT ON COLUMN users.role IS 'User role: farmer (default) or admin';
COMMENT ON COLUMN users.status IS 'Account status: active, suspended, or deleted';
```

### 6.2 Fields Table

```sql
-- ============================================================================
-- Table: fields
-- Purpose: Store paddy field boundaries and metadata
-- ============================================================================

CREATE TABLE fields (
    -- Primary Key
    field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Key
    user_id UUID NOT NULL REFERENCES users(user