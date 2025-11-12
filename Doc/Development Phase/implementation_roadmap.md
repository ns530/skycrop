
# DEVELOPMENT PHASE IMPLEMENTATION ROADMAP

## SkyCrop: Satellite-Based Paddy Field Management & Monitoring System

---

## DOCUMENT CONTROL

| **Item** | **Details** |
|----------|-------------|
| **Document Title** | Development Phase Implementation Roadmap |
| **Project Name** | SkyCrop - Intelligent Paddy Field Monitoring System |
| **Document Code** | SKYCROP-DEV-2025-001 |
| **Version** | 1.0 |
| **Date** | November 5, 2025 |
| **Phase** | Development (Implementation) Phase - Weeks 5-16 |
| **Prepared By** | BMad Master Orchestrator |
| **Status** | In Progress |

---

## EXECUTIVE SUMMARY

### Current Status

**Completed Phases:**
- ✅ Phase 1: Planning & Initiation (Weeks 1-2)
- ✅ Phase 2: Requirements Analysis (Weeks 2-3)
- ✅ Phase 3: System Design (Weeks 3-4)

**Current Phase:**
- 🚀 Phase 4: Development (Implementation) - Starting Week 5

### Implementation Overview

Based on comprehensive analysis of all design documentation, this roadmap provides a detailed, sprint-by-sprint implementation plan for the SkyCrop system over the next 12 weeks (Weeks 5-16).

**Architecture Style:** Modular Monolith (Phase 1 MVP)
- Single deployable Node.js application
- Clear module boundaries for future microservices migration
- Python AI/ML service as separate microservice
- Polyglot persistence (PostgreSQL + MongoDB + Redis)

**Development Approach:** Agile Scrum
- 2-week sprints (6 sprints total)
- Sprint planning, daily standups, sprint reviews, retrospectives
- Continuous integration/deployment
- Test-driven development (TDD) where applicable

---

## TABLE OF CONTENTS

1. [Sprint Overview](#1-sprint-overview)
2. [Infrastructure Setup (Sprint 1)](#2-infrastructure-setup-sprint-1)
3. [Core Backend Development (Sprint 2-3)](#3-core-backend-development-sprint-2-3)
4. [AI/ML Development (Sprint 2-3)](#4-aiml-development-sprint-2-3)
5. [Frontend Development (Sprint 4-5)](#5-frontend-development-sprint-4-5)
6. [Mobile Development (Sprint 5-6)](#6-mobile-development-sprint-5-6)
7. [Integration & Testing (Sprint 6)](#7-integration--testing-sprint-6)
8. [Deployment Strategy](#8-deployment-strategy)
9. [Quality Assurance Plan](#9-quality-assurance-plan)
10. [Risk Management](#10-risk-management)

---

## 1. SPRINT OVERVIEW

### Sprint Schedule (Weeks 5-16)

| **Sprint** | **Weeks** | **Duration** | **Focus** | **Deliverables** |
|------------|-----------|--------------|-----------|-----------------|
| **Sprint 1** | 5-6 | 2 weeks | Infrastructure & Auth | Dev environment, databases, authentication |
| **Sprint 2** | 7-8 | 2 weeks | Backend Core & AI Models | Field management, satellite service, U-Net training |
| **Sprint 3** | 9-10 | 2 weeks | Backend Features & ML | Health monitoring, recommendations, yield prediction |
| **Sprint 4** | 11-12 | 2 weeks | Web Frontend | React.js app, dashboard, field details, maps |
| **Sprint 5** | 13-14 | 2 weeks | Mobile App | React Native app, push notifications, offline mode |
| **Sprint 6** | 15-16 | 2 weeks | Integration & Launch | Testing, bug fixes, deployment, farmer onboarding |

### Sprint Velocity Planning

**Estimated Velocity:** 40 story points per sprint (1 developer, 40 hours/week)

**Sprint Capacity Distribution:**
- Development: 60% (24 story points)
- Testing: 20% (8 story points)
- Documentation: 10% (4 story points)
- Meetings & Admin: 10% (4 story points)

---

## 2. INFRASTRUCTURE SETUP (SPRINT 1)

### Week 5-6: Foundation & Authentication

**Sprint Goal:** Establish development infrastructure and implement user authentication

---

#### 2.1 Development Environment Setup

**Task DEV-001: Initialize Project Repository**

**Complexity:** 8 story points
**Owner:** Full Stack Developer
**Duration:** 1 day

**Implementation Steps:**

1. **Create Monorepo Structure:**
```bash
SkyCrop/
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       ├── frontend-ci.yml
│       ├── ml-service-ci.yml
│       └── deploy.yml
├── backend/
│   ├── src/
│   │   ├── api/           # Controllers & routes
│   │   ├── services/      # Business logic
│   │   ├── repositories/  # Data access
│   │   ├── models/        # Database models
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Utility functions
│   │   ├── config/        # Configuration
│   │   ├── jobs/          # Scheduled jobs
│   │   └── app.js         # Express app
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── package.json
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store
│   │   ├── services/      # API clients
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utilities
│   │   └── App.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── mobile/
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── store/
│   │   ├── services/
│   │   └── App.tsx
│   ├── android/
│   ├── ios/
│   └── package.json
├── ml-service/
│   ├── app.py             # Flask API
│   ├── models/
│   │   ├── unet.py
│   │   └── yield_prediction.py
│   ├── services/
│   │   ├── boundary_detection.py
│   │   ├── yield_prediction.py
│   │   └── disaster_analysis.py
│   ├── utils/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── docs/
├── docker-compose.yml
├── .env.example
└── README.md
```

2. **Initialize Git Repository:**
```bash
git init
git add .
git commit -m "Initial project structure"
git remote add origin https://github.com/yourusername/skycrop.git
git push -u origin main
```

3. **Create Development Branches:**
```bash
git checkout -b develop
git checkout -b feature/authentication
git checkout -b feature/field-management
git checkout -b feature/ai-models
```

**Acceptance Criteria:**
- ✅ Repository structure created
- ✅ Git initialized and pushed to GitHub
- ✅ Branch protection rules configured (main, develop)
- ✅ README with setup instructions

---

**Task DEV-002: Database Setup**

**Complexity:** 5 story points
**Owner:** Backend Developer
**Duration:** 1 day

**Implementation Steps:**

1. **Install and Configure PostgreSQL + PostGIS:**
```bash
# Docker Compose for local development
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: skycrop_dev
      POSTGRES_USER: skycrop_user
      POSTGRES_PASSWORD: skycrop_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/init.sql:/docker-entrypoint-initdb.d/init.sql
  
  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin
      MONGO_INITDB_DATABASE: skycrop_dev
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  mongo_data:
  redis_data:
```

2. **Create Database Schema (PostgreSQL):**
```sql
-- backend/database/schema.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin')),
    auth_provider VARCHAR(20) NOT NULL CHECK (auth_provider IN ('google', 'email')),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    profile_photo_url VARCHAR(500),
    location VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'))
);

CREATE INDEX idx_users_email ON users(email) WHERE status = 'active';
CREATE INDEX idx_users_status_created ON users(status, created_at);

-- Fields table
CREATE TABLE fields (
    field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    area DECIMAL(10, 2) NOT NULL,
    center GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    
    UNIQUE (user_id, name),
    CHECK (area >= 0.1 AND area <= 50),
    CHECK (ST_IsValid(boundary))
);

CREATE INDEX idx_fields_user ON fields(user_id, status);
CREATE INDEX idx_fields_spatial_boundary ON fields USING GIST(boundary);

-- Health records table
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
    health_status VARCHAR(20) NOT NULL CHECK (health_status IN ('excellent', 'good', 'fair', 'poor')),
    health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    trend VARCHAR(20) NOT NULL CHECK (trend IN ('improving', 'stable', 'declining')),
    satellite_image_id VARCHAR(100) NOT NULL,
    cloud_cover DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE (field_id, measurement_date)
);

CREATE INDEX idx_health_field_date ON health_records(field_id, measurement_date DESC);

-- Additional tables: recommendations, yield_predictions, disaster_assessments, weather_forecasts
-- (See Database Design Document for complete schema)
```

3. **Configure Database Connection:**
```javascript
// backend/src/config/database.config.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'skycrop_dev',
  process.env.DB_USER || 'skycrop_user',
  process.env.DB_PASSWORD || 'skycrop_pass',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 20,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
```

**Acceptance Criteria:**
- ✅ Docker Compose successfully starts all databases
- ✅ PostgreSQL schema created with PostGIS extension
- ✅ MongoDB database created
- ✅ Redis cache accessible
- ✅ Database connection tested from backend

---

**Task DEV-003: Authentication Module Implementation**

**Complexity:** 13 story points
**Owner:** Backend Developer
**Duration:** 3 days
**User Stories:** US-001, US-002

**Implementation Steps:**

1. **Install Dependencies:**
```bash
cd backend
npm install express bcrypt jsonwebtoken joi passport passport-google-oauth20 \
  nodemailer uuid sequelize pg pg-hstore redis
```

2. **Implement User Model:**
```javascript
// backend/src/models/user.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
    validate: { isEmail: true }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('farmer', 'admin'),
    allowNull: false,
    defaultValue: 'farmer'
  },
  auth_provider: {
    type: DataTypes.ENUM('google', 'email'),
    allowNull: false
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'deleted'),
    defaultValue: 'active'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;
```

3. **Implement Auth Service:**
```javascript
// backend/src/services/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ValidationError, UnauthorizedError } = require('../errors/custom-errors');

class AuthService {
  constructor(userRepository, emailService, redisClient) {
    this.userRepository = userRepository;
    this.emailService = emailService;
    this.redis = redisClient;
  }

  async signup(email, password, name) {
    // 1. Validate inputs
    if (!this._isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }
    
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    
    // 2. Check if user exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }
    
    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 4. Create user
    const user = await this.userRepository.create({
      email,
      password_hash: passwordHash,
      name,
      role: 'farmer',
      auth_provider: 'email',
      email_verified: false,
      status: 'active'
    });
    
    // 5. Generate email verification token
    const verificationToken = crypto.randomUUID();
    await this.redis.setex(
      `email-verify:${verificationToken}`,
      86400,
      user.user_id
    );
    
    // 6. Send verification email
    await this.emailService.sendVerificationEmail(email, verificationToken);
    
    // 7. Generate JWT
    const token = this._generateJWT(user);
    
    return {
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    };
  }

  async login(email, password) {
    // 1. Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // 2. Check account lock
    const lockKey = `account-lock:${user.user_id}`;
    const isLocked = await this.redis.get(lockKey);
    if (isLocked) {
      throw new UnauthorizedError('Account locked. Try again in 30 minutes.');
    }
    
    // 3. Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      await this._handleFailedLogin(user.user_id);
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // 4. Reset failed attempts
    await this.redis.del(`failed-attempts:${user.user_id}`);
    
    // 5. Update last login
    await this.userRepository.update(user.user_id, {
      last_login: new Date()
    });
    
    // 6. Generate JWT
    const token = this._generateJWT(user);
    
    return {
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    };
  }

  _generateJWT(user) {
    return jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  async _handleFailedLogin(userId) {
    const key = `failed-attempts:${userId}`;
    const attempts = await this.redis.incr(key);
    await this.redis.expire(key, 1800); // 30 minutes
    
    if (attempts >= 5) {
      await this.redis.setex(`account-lock:${userId}`, 1800, 'locked');
    }
  }

  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

module.exports = AuthService;
```

4. **Implement Auth Controller:**
```javascript
// backend/src/api/controllers/auth.controller.js
class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async signup(req, res, next) {
    try {
      const { email, password, name } = req.body;
      const result = await this.authService.signup(email, password, name);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
```

5. **Implement Auth Middleware:**
```javascript
// backend/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../errors/custom-errors');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check blacklist
    const isBlacklisted = await req.redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token invalidated');
    }
    
    req.user = {
      userId: decoded.user_id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(error);
  }
};

module.exports = authMiddleware;
```

**Testing:**
- Unit tests: `auth.service.test.js` (signup, login, password hashing)
- Integration tests: `auth.api.test.js` (API endpoints)
- Manual testing: Postman collection

**Acceptance Criteria:**
- ✅ User can signup with email/password (<2 minutes)
- ✅ User can signup with Google OAuth (<1 minute)
- ✅ User can login successfully
- ✅ Password hashed with bcrypt (10 rounds)
- ✅ JWT token generated (30-day expiry)
- ✅ Account locked after 5 failed attempts
- ✅ 80%+ test coverage

---

**Task DEV-004: Google OAuth Integration**

**Complexity:** 5 story points
**Owner:** Backend Developer
**Duration:** 1 day

**Implementation Steps:**

1. **Install Passport.js:**
```bash
npm install passport passport-google-oauth20
```

2. **Configure Google OAuth Strategy:**
```javascript
// backend/src/config/passport.config.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.model');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/v1/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findOne({ where: { email: profile.emails[0].value } });
      
      if (!user) {
        // Create new user
        user = await User.create({
          email: profile.emails[0].value,
          name: profile.displayName,
          auth_provider: 'google',
          email_verified: true,
          profile_photo_url: profile.photos[0].value,
          status: 'active'
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

module.exports = passport;
```

3. **Implement OAuth Routes:**
```javascript
// backend/src/api/routes/auth.routes.js
const express = require('express');
const passport = require('../../config/passport.config');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Initiate Google OAuth
router.get('/google',
  passport.authenticate('google', { 
    scope: ['openid', 'profile', 'email'],
    session: false
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/login?error=oauth_failed'
  }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign(
      {
        user_id: req.user.user_id,
        email: req.user.email,
        role: req.user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

module.exports = router;
```

**Acceptance Criteria:**
- ✅ Google OAuth flow completes successfully
- ✅ User account created from Google profile
- ✅ JWT token issued after OAuth
- ✅ Tested with multiple Google accounts

---

#### 2.2 Development Tools Configuration

**Task DEV-005: Configure Development Tools**

**Complexity:** 3 story points
**Duration:** 0.5 day

**Configuration Files:**

1. **ESLint Configuration:**
```javascript
// backend/.eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended'
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'consistent-return': 'off'
  }
};
```

2. **Prettier Configuration:**
```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

3. **Jest Configuration:**
```javascript
// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ]
};
```

**Acceptance Criteria:**
- ✅ ESLint rules enforced on commit (Husky pre-commit hook)
- ✅ Prettier formats code automatically
- ✅ Jest test framework configured
- ✅ Coverage thresholds set (80%)

---

**Task DEV-006: CI/CD Pipeline Setup**

**Complexity:** 5 story points
**Duration:** 1 day

**GitHub Actions Workflow:**

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
  pull_request:
    branches: [main, develop]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgis/postgis:15-3.3
        env:
          POSTGRES_DB: skycrop_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run linter
        run: |
          cd backend
          npm run lint
      
      - name: Run tests
        run: |
          cd backend
          npm run test:coverage
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: skycrop_test
          DB_USER: test_user
          DB_PASSWORD: test_pass
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-key
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

**Acceptance Criteria:**
- ✅ CI pipeline runs on every push/PR
- ✅ Tests run automatically
- ✅ Linting enforced
- ✅ Deployment to Railway on main branch merge
- ✅ Coverage reports to Codecov

---

### Sprint 1 Deliverables

**Completed by End of Week 6:**
- ✅ Development environment configured (Docker Compose)
- ✅ PostgreSQL + PostGIS database setup
- ✅ MongoDB database setup
- ✅ Redis cache setup
- ✅ User authentication implemented (email/password + Google OAuth)
- ✅ JWT session management
- ✅ CI/CD pipeline configured
- ✅ 80%+ test coverage for auth module
- ✅ API documentation started (Swagger/OpenAPI)

**Sprint 1 Demo:**
- User can signup, login, logout
- Password reset email sent
- JWT tokens validated
- Account locks after 5 failed attempts

---

## 3. CORE BACKEND DEVELOPMENT (SPRINT 2-3)

### Sprint 2 (Weeks 7-8): Field Management & Satellite