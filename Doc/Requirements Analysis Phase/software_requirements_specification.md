# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## SkyCrop: Satellite-Based Paddy Field Management & Monitoring System

---

## DOCUMENT CONTROL

| **Item** | **Details** |
|----------|-------------|
| **Document Title** | Software Requirements Specification (SRS) |
| **Project Name** | SkyCrop - Intelligent Paddy Field Monitoring System |
| **Document Code** | SKYCROP-SRS-2025-001 |
| **Version** | 1.0 |
| **Date** | October 28, 2025 |
| **Prepared By** | Business Analyst |
| **Reviewed By** | Technical Lead, QA Lead |
| **Approved By** | Project Sponsor, Product Manager |
| **Status** | Approved |
| **Confidentiality** | Internal - For Development Team |
| **Compliance** | IEEE 830-1998 Standard |

---

## EXECUTIVE SUMMARY

This Software Requirements Specification (SRS) document provides a complete and precise description of the software requirements for the SkyCrop satellite-based paddy field monitoring system. It serves as the foundation for system design, development, testing, and validation.

### Purpose

This SRS defines:
- **Functional requirements** - What the system must do
- **Non-functional requirements** - How the system must perform
- **External interface requirements** - How the system interacts with users and external systems
- **System features** - Detailed capabilities and behaviors
- **Data requirements** - Information the system must store and process

### Intended Audience

- **Development Team:** Developers, ML engineers, frontend/backend engineers
- **QA Team:** Test engineers, quality assurance analysts
- **Project Management:** Project manager, scrum master
- **Stakeholders:** Product owner, business analyst, project sponsor

### Document Scope

This SRS covers the complete SkyCrop system including:
- Web application (React.js)
- Mobile application (React Native - Android & iOS)
- Backend API (Node.js/Express)
- AI/ML models (Python - TensorFlow/PyTorch)
- Database systems (PostgreSQL, MongoDB)
- External integrations (Sentinel Hub, Weather API, OAuth)

---

## TABLE OF CONTENTS

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features](#3-system-features)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Data Requirements](#7-data-requirements)
8. [System Models](#8-system-models)
9. [Appendices](#9-appendices)

---

## 1. INTRODUCTION

### 1.1 Purpose

This Software Requirements Specification (SRS) document specifies the complete software requirements for SkyCrop, a satellite-based agricultural monitoring platform. It describes the functional and non-functional requirements, external interfaces, and system constraints that guide the design, development, and testing of the system.

### 1.2 Scope

**Product Name:** SkyCrop - Intelligent Paddy Field Monitoring System

**Product Description:**
SkyCrop is a cloud-based, AI-powered platform that provides paddy farmers with:
- Automated field boundary detection using satellite imagery
- Real-time crop health monitoring (NDVI, NDWI, TDVI indices)
- Precision agriculture recommendations (water, fertilizer)
- Yield prediction using machine learning
- Disaster damage assessment
- Weather forecasting and agricultural knowledge

**Benefits:**
- **For Farmers:** 15-25% yield increase, 20-30% cost savings, data-driven decisions
- **For Agriculture Sector:** Enhanced food security, environmental sustainability, digital transformation
- **For Stakeholders:** Academic innovation, technology showcase, scalable solution

**Goals:**
- Onboard 100 farmers in Year 1
- Achieve 85%+ AI model accuracy
- Maintain 99%+ system uptime
- Deliver 80%+ user satisfaction

### 1.3 Definitions, Acronyms, and Abbreviations

| **Term** | **Definition** |
|----------|----------------|
| **API** | Application Programming Interface |
| **CRUD** | Create, Read, Update, Delete |
| **GPS** | Global Positioning System |
| **IoU** | Intersection over Union (boundary detection accuracy metric) |
| **JWT** | JSON Web Token (authentication mechanism) |
| **MAPE** | Mean Absolute Percentage Error (prediction accuracy metric) |
| **ML** | Machine Learning |
| **NDVI** | Normalized Difference Vegetation Index (vegetation health: (NIR-Red)/(NIR+Red)) |
| **NDWI** | Normalized Difference Water Index (water content: (NIR-SWIR)/(NIR+SWIR)) |
| **NFR** | Non-Functional Requirement |
| **NIR** | Near-Infrared (Sentinel-2 Band 8, 842nm) |
| **OAuth** | Open Authorization (authentication protocol) |
| **REST** | Representational State Transfer (API architecture) |
| **SWIR** | Short-Wave Infrared (Sentinel-2 Band 11, 1610nm) |
| **TDVI** | Transformed Difference Vegetation Index |
| **TLS** | Transport Layer Security (encryption protocol) |
| **UAT** | User Acceptance Testing |
| **UI** | User Interface |
| **UX** | User Experience |

### 1.4 References

**Related Documents:**
1. Project Charter (SKYCROP-2025-001)
2. Business Case (SKYCROP-BC-2025-001)
3. Feasibility Study (SKYCROP-FS-2025-001)
4. Project Plan (SKYCROP-PP-2025-001)
5. Product Requirements Document (SKYCROP-PRD-2025-001)

**Technical Standards:**
1. IEEE 830-1998: IEEE Recommended Practice for Software Requirements Specifications
2. ISO/IEC 25010: Software Quality Model
3. WCAG 2.1: Web Content Accessibility Guidelines
4. OWASP Top 10: Web Application Security Risks
5. RFC 7519: JSON Web Token (JWT)
6. RFC 6749: OAuth 2.0 Authorization Framework

**External APIs:**
1. Sentinel Hub API Documentation: https://docs.sentinel-hub.com/
2. OpenWeatherMap API Documentation: https://openweathermap.org/api
3. Google OAuth 2.0 Documentation: https://developers.google.com/identity/protocols/oauth2
4. Firebase Cloud Messaging Documentation: https://firebase.google.com/docs/cloud-messaging

### 1.5 Overview

This SRS is organized into the following sections:

- **Section 2:** Overall system description, product perspective, user characteristics, constraints
- **Section 3:** Detailed system features with use cases
- **Section 4:** External interface requirements (user, hardware, software, communications)
- **Section 5:** Detailed functional requirements organized by subsystem
- **Section 6:** Non-functional requirements (performance, security, usability, etc.)
- **Section 7:** Data requirements (database schema, data flows, data dictionary)
- **Section 8:** System models (use case diagrams, sequence diagrams, state diagrams)
- **Section 9:** Appendices (assumptions, dependencies, traceability matrix)

---

## 2. OVERALL DESCRIPTION

### 2.1 Product Perspective

SkyCrop is a new, self-contained product that integrates with existing external services:

**System Context Diagram:**

```
┌─────────────────────────────────────────────────────────────┐
│                    External Systems                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Sentinel    │  │ OpenWeather  │  │   Google     │      │
│  │  Hub API     │  │   Map API    │  │   OAuth      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     SkyCrop System                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Backend API Layer                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │   Auth     │  │  Satellite │  │   Weather  │     │  │
│  │  │  Service   │  │  Service   │  │  Service   │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │   Field    │  │    AI/ML   │  │   User     │     │  │
│  │  │  Service   │  │  Service   │  │  Service   │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Data Layer                               │  │
│  │  ┌────────────┐              ┌────────────┐          │  │
│  │  │ PostgreSQL │              │  MongoDB   │          │  │
│  │  │  (Spatial) │              │  (NoSQL)   │          │  │
│  │  └────────────┘              └────────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Web App    │  │  Mobile App  │  │    Admin     │
│  (React.js)  │  │(React Native)│  │  Dashboard   │
└──────────────┘  └──────────────┘  └──────────────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────────────────────────────────────────┐
│              End Users                            │
│  Farmers, Extension Officers, Administrators     │
└──────────────────────────────────────────────────┘
```

**System Interfaces:**
- **User Interfaces:** Web browser, mobile app (Android/iOS)
- **Hardware Interfaces:** Smartphone GPS, camera (future: photo upload)
- **Software Interfaces:** Sentinel Hub API, OpenWeatherMap API, Google OAuth, Firebase
- **Communication Interfaces:** HTTPS (REST API), WebSocket (real-time updates - Phase 2)

### 2.2 Product Functions

**High-Level Functions:**

1. **User Management**
   - User registration and authentication
   - Profile management
   - Session management

2. **Field Management**
   - Interactive map-based field selection
   - AI-powered boundary detection
   - Field area calculation
   - Multi-field support

3. **Crop Monitoring**
   - Satellite image retrieval and processing
   - Vegetation indices calculation (NDVI, NDWI, TDVI)
   - Health status classification
   - Historical trend tracking

4. **Decision Support**
   - Water recommendations based on NDWI
   - Fertilizer recommendations based on NDVI
   - Alert generation for critical conditions
   - Weather-integrated recommendations

5. **Predictive Analytics**
   - Yield prediction using ML models
   - Revenue estimation
   - Harvest date forecasting

6. **Disaster Management**
   - Before/after image comparison
   - Damage quantification
   - Financial loss estimation
   - Insurance report generation

7. **Weather Services**
   - 7-day forecast display
   - Extreme weather alerts
   - Historical weather data

8. **Content Management**
   - Agricultural news and articles
   - Best practices knowledge base
   - Market price information
   - Government scheme updates

9. **Administration**
   - User account management
   - Content publishing
   - System monitoring
   - Analytics dashboard

### 2.3 User Characteristics

**User Category 1: Paddy Farmers (Primary Users)**

| **Characteristic** | **Description** |
|-------------------|-----------------|
| **Education Level** | Primary (35%), Secondary (50%), Tertiary (15%) |
| **Age Range** | 25-60 years (median: 45) |
| **Technical Expertise** | Low to Moderate (can use WhatsApp, basic apps) |
| **Language** | Sinhala (70%), Tamil (25%), English (5%) |
| **Device** | Budget Android smartphones (65%), iOS (5%), No smartphone (30%) |
| **Internet** | 3G/4G mobile data (78%), WiFi (45%), No internet (22%) |
| **Farming Experience** | 10-30 years (experienced farmers) |
| **Farm Size** | 0.5-5 hectares (small to medium scale) |

**User Category 2: Extension Officers (Secondary Users)**

| **Characteristic** | **Description** |
|-------------------|-----------------|
| **Education Level** | BSc Agriculture or equivalent |
| **Age Range** | 28-50 years |
| **Technical Expertise** | High (comfortable with computers, smartphones, web apps) |
| **Language** | Fluent in Sinhala, Tamil, and English |
| **Device** | Laptop, smartphone (mid to high-end) |
| **Internet** | Office WiFi, 4G mobile data |
| **Role** | Support 500-1,000 farmers each |

**User Category 3: System Administrators (Tertiary Users)**

| **Characteristic** | **Description** |
|-------------------|-----------------|
| **Education Level** | BSc Computer Science or related field |
| **Age Range** | 25-40 years |
| **Technical Expertise** | Expert (web development, databases, system administration) |
| **Language** | English (primary), Sinhala/Tamil (conversational) |
| **Device** | Laptop, desktop computer |
| **Internet** | High-speed broadband |
| **Role** | Manage platform, support users, publish content |

### 2.4 Constraints

**Technical Constraints:**
- **CON-001:** Satellite image resolution limited to 10m (Sentinel-2) or 30m (Landsat-8)
- **CON-002:** Satellite revisit time is 5 days minimum (cannot provide daily updates)
- **CON-003:** Cloud cover >20% makes satellite images unusable
- **CON-004:** AI processing requires 30-60 seconds (user must wait)
- **CON-005:** Mobile app must work on devices with 2GB RAM minimum
- **CON-006:** System must work on 3G networks (1 Mbps minimum)

**Budget Constraints:**
- **CON-007:** Total Year 1 budget: Rs. 365,000 (~$1,200 USD)
- **CON-008:** Must use free-tier services (Sentinel Hub 3,000 req/month, OpenWeatherMap 60 calls/min)
- **CON-009:** Cannot afford paid marketing (organic growth only)

**Timeline Constraints:**
- **CON-010:** Development must be completed in 16 weeks (October 28, 2025 - February 28, 2026)
- **CON-011:** MVP must be launched by Week 16 (university deadline)

**Resource Constraints:**
- **CON-012:** Development team: 1-2 developers (limited capacity)
- **CON-013:** Part-time support only in Year 1 (2 hours/day)

**Regulatory Constraints:**
- **CON-014:** Must comply with GDPR and Sri Lanka Data Protection Act (expected 2026)
- **CON-015:** Must obtain university ethics approval for user research
- **CON-016:** Cannot provide medical or legal advice (liability)

**User Constraints:**
- **CON-017:** 45% of farmers have no English proficiency (Sinhala/Tamil required in Phase 2)
- **CON-018:** 35% of farmers do not have smartphones (excluded from Phase 1)
- **CON-019:** 22% of farmers have no internet access (offline mode required in Phase 2)

### 2.5 Assumptions and Dependencies

**Assumptions:**
- **ASM-001:** Sentinel Hub will approve academic account and provide free tier access
- **ASM-002:** Sentinel-2 satellite will continue providing free imagery
- **ASM-003:** OpenWeatherMap free tier will be sufficient for Year 1
- **ASM-004:** Farmers can identify approximate location of their fields on a map
- **ASM-005:** Historical yield data will be available for ML model training
- **ASM-006:** Dept. of Agriculture will sign partnership MoU by Month 2
- **ASM-007:** University will provide research grant (Rs. 200,000)

**Dependencies:**
- **DEP-001:** Sentinel Hub API availability and uptime (99.9% SLA)
- **DEP-002:** OpenWeatherMap API availability and accuracy
- **DEP-003:** Google OAuth service availability
- **DEP-004:** Cloud hosting provider reliability (AWS/Railway)
- **DEP-005:** Mobile app store approval (Google Play, Apple App Store)
- **DEP-006:** Extension officer cooperation for farmer recruitment
- **DEP-007:** Internet connectivity in target farming areas

---

## 3. SYSTEM FEATURES

### 3.1 Feature: User Authentication & Authorization

**Feature ID:** SF-001  
**Priority:** Critical (P0)  
**Risk:** Low

**Description:**
Secure user registration, login, and session management with support for multiple authentication methods (Google OAuth, email/password).

**Functional Requirements:**

**FR-001.1: User Registration with Google OAuth**
- **Input:** User clicks "Sign in with Google" button
- **Process:**
  1. System redirects to Google OAuth consent screen
  2. User grants permissions (openid, profile, email)
  3. Google returns authorization code
  4. System exchanges code for access token
  5. System retrieves user profile (name, email, photo)
  6. System creates user account in database
  7. System issues JWT session token (30-day expiry)
- **Output:** User logged in, redirected to dashboard
- **Preconditions:** User has Google account
- **Postconditions:** User account created, session active
- **Error Handling:**
  - If OAuth fails: Display error message, offer email/password signup
  - If network error: Retry with exponential backoff (3 attempts)

**FR-001.2: User Registration with Email/Password**
- **Input:** User enters email, password, confirms password
- **Process:**
  1. System validates email format (RFC 5322)
  2. System validates password strength:
     - Minimum 8 characters
     - At least 1 uppercase letter
     - At least 1 lowercase letter
     - At least 1 number
     - At least 1 special character (optional)
  3. System checks if email already exists
  4. System hashes password (bcrypt, 10 rounds)
  5. System creates user account
  6. System sends verification email
  7. System issues JWT session token
- **Output:** User account created, verification email sent
- **Preconditions:** Valid email address
- **Postconditions:** User account created (unverified), session active
- **Error Handling:**
  - If email exists: "Email already registered. Try logging in or reset password."
  - If password weak: "Password must be at least 8 characters with 1 uppercase and 1 number."
  - If email send fails: Log error, allow user to resend verification email

**FR-001.3: Email Verification**
- **Input:** User clicks verification link in email
- **Process:**
  1. System validates verification token (24-hour expiry)
  2. System marks email as verified in database
  3. System redirects to dashboard with success message
- **Output:** Email verified, user can access all features
- **Preconditions:** User registered with email/password
- **Postconditions:** Email verified flag set to true
- **Error Handling:**
  - If token expired: "Verification link expired. Click here to resend."
  - If token invalid: "Invalid verification link. Contact support."

**FR-001.4: User Login**
- **Input:** User enters email and password OR clicks "Sign in with Google"
- **Process:**
  1. System validates credentials
  2. System checks account status (active, suspended, deleted)
  3. System issues JWT session token (30-day expiry)
  4. System updates last login timestamp
  5. System redirects to dashboard
- **Output:** User logged in, session active
- **Preconditions:** User has registered account
- **Postconditions:** Session created, user authenticated
- **Error Handling:**
  - If credentials invalid: "Invalid email or password. Try again."
  - If account suspended: "Your account has been suspended. Contact support."
  - If 5 failed attempts: Lock account for 30 minutes, send security alert email

**FR-001.5: Password Reset**
- **Input:** User clicks "Forgot Password", enters email
- **Process:**
  1. System validates email exists in database
  2. System generates password reset token (24-hour expiry)
  3. System sends reset link to email
  4. User clicks link, enters new password
  5. System validates new password strength
  6. System hashes and updates password
  7. System invalidates all existing sessions (force re-login)
- **Output:** Password reset, user must log in again
- **Preconditions:** User has registered account with email
- **Postconditions:** Password updated, old sessions invalidated
- **Error Handling:**
  - If email not found: "If this email is registered, you'll receive a reset link." (security: don't reveal if email exists)
  - If token expired: "Reset link expired. Request a new one."

**FR-001.6: Session Management**
- **Input:** User interacts with system
- **Process:**
  1. System validates JWT token on every API request
  2. System checks token expiry (30 days)
  3. System refreshes token if <7 days remaining
  4. System logs user activity (last seen timestamp)
- **Output:** Session maintained or expired
- **Preconditions:** User logged in
- **Postconditions:** Session active or user logged out
- **Error Handling:**
  - If token expired: Redirect to login page with message "Session expired. Please log in again."
  - If token invalid: Force logout, redirect to login

**FR-001.7: User Logout**
- **Input:** User clicks "Logout" button
- **Process:**
  1. System invalidates JWT token (add to blacklist)
  2. System clears client-side session data
  3. System redirects to login page
- **Output:** User logged out
- **Preconditions:** User logged in
- **Postconditions:** Session terminated, token invalidated

**FR-001.8: Profile Management**
- **Input:** User updates profile information (name, phone, location, photo)
- **Process:**
  1. System validates input data
  2. System updates user record in database
  3. System displays success message
- **Output:** Profile updated
- **Preconditions:** User logged in
- **Postconditions:** User data updated in database
- **Error Handling:**
  - If phone number invalid: "Please enter a valid phone number (10 digits)."
  - If photo too large: "Photo must be <5 MB. Please compress and try again."

**FR-001.9: Account Deletion (GDPR Compliance)**
- **Input:** User clicks "Delete Account", confirms deletion
- **Process:**
  1. System displays warning: "This will permanently delete all your data. Are you sure?"
  2. User confirms deletion
  3. System soft-deletes user account (mark as deleted, retain for 30 days)
  4. System anonymizes personal data (name, email, phone)
  5. System retains field data (anonymized) for research purposes
  6. System sends confirmation email
- **Output:** Account deleted, user logged out
- **Preconditions:** User logged in
- **Postconditions:** User account soft-deleted, personal data anonymized
- **Error Handling:**
  - If deletion fails: "Unable to delete account. Contact support."

**Non-Functional Requirements:**
- **NFR-001.1:** Login shall complete within 2 seconds (95th percentile)
- **NFR-001.2:** Password shall be hashed using bcrypt with 10+ rounds
- **NFR-001.3:** JWT tokens shall use HS256 algorithm with 256-bit secret key
- **NFR-001.4:** System shall lock account after 5 failed login attempts
- **NFR-001.5:** System shall log all authentication events (login, logout, failed attempts)

---

### 3.2 Feature: Field Mapping & Boundary Detection

**Feature ID:** SF-002  
**Priority:** Critical (P0)  
**Risk:** Medium (AI accuracy dependency)

**Description:**
Interactive satellite map interface for field selection with AI-powered automatic boundary detection using U-Net deep learning model.

**Functional Requirements:**

**FR-002.1: Interactive Map Display**
- **Input:** User navigates to "Add Field" screen
- **Process:**
  1. System loads satellite base map (Google Maps or Sentinel-2)
  2. System centers map on user's GPS location (if permission granted)
  3. System displays zoom controls and GPS button
  4. System loads map tiles progressively (lazy loading)
- **Output:** Interactive satellite map displayed
- **Preconditions:** User logged in, location permission granted (optional)
- **Postconditions:** Map ready for field selection
- **Error Handling:**
  - If GPS unavailable: Center map on Sri Lanka (default)
  - If map tiles fail to load: Display error, retry button

**FR-002.2: Field Location Selection**
- **Input:** User taps on map to select field center point
- **Process:**
  1. System captures tap coordinates (latitude, longitude)
  2. System displays crosshair or marker at selected point
  3. System shows coordinates in decimal degrees (6 decimal places)
  4. System enables "Confirm Location" button
- **Output:** Field center point selected
- **Preconditions:** Map displayed
- **Postconditions:** Coordinates stored temporarily
- **Error Handling:**
  - If tap outside Sri Lanka: "Please select a location within Sri Lanka."
  - If tap on water body: Warning: "This appears to be water. Are you sure?"

**FR-002.3: AI Boundary Detection**
- **Input:** User confirms field location
- **Process:**
  1. System displays progress indicator: "Detecting field boundary... 0%"
  2. System retrieves Sentinel-2 image for selected location (512×512 pixels, 5km×5km area)
  3. System preprocesses image:
     - Cloud masking (reject if >20% cloud cover)
     - Normalization (scale pixel values 0-1)
     - Resize to model input size (256×256)
  4. System runs U-Net model inference:
     - Input: RGB + NIR bands
     - Output: Binary mask (field vs. non-field)
  5. System post-processes mask:
     - Apply morphological operations (close gaps, remove noise)
     - Extract contours (find boundary polygon)
     - Simplify polygon (Douglas-Peucker algorithm, tolerance 10m)
  6. System converts pixel coordinates to GPS coordinates
  7. System displays detected boundary as polygon overlay on map
  8. System calculates field area
  9. System updates progress: "Boundary detected! 100%"
- **Output:** Field boundary polygon displayed, area calculated
- **Preconditions:** Field location selected, Sentinel Hub API accessible
- **Postconditions:** Boundary stored temporarily, ready for user confirmation
- **Error Handling:**
  - If cloud cover >20%: "Satellite image too cloudy. Try selecting a different date or location."
  - If no field detected: "Could not detect field boundary. Please draw manually."
  - If API timeout: "Processing taking longer than expected. Please try again."
  - If model error: "Boundary detection failed. Please draw manually or contact support."

**FR-002.4: Boundary Visualization**
- **Input:** AI-detected boundary
- **Process:**
  1. System renders polygon on map with:
     - Green outline (3px width)
     - Semi-transparent green fill (30% opacity)
     - Vertices marked with draggable handles
  2. System displays boundary statistics:
     - Number of vertices
     - Perimeter (meters)
     - Area (hectares)
  3. System enables "Confirm Boundary" and "Adjust Manually" buttons
- **Output:** Boundary visualized on map
- **Preconditions:** Boundary detected
- **Postconditions:** Boundary ready for confirmation or adjustment

**FR-002.5: Manual Boundary Adjustment**
- **Input:** User drags boundary vertex to new position
- **Process:**
  1. System updates vertex coordinates in real-time
  2. System redraws polygon
  3. System recalculates area
  4. System displays updated area
  5. System stores adjustment in undo stack (max 10 actions)
- **Output:** Boundary adjusted, area updated
- **Preconditions:** Boundary displayed
- **Postconditions:** Boundary modified, area recalculated
- **Error Handling:**
  - If polygon becomes invalid (self-intersecting): Revert to previous state, show warning

**FR-002.6: Add/Delete Vertices**
- **Input:** User taps on boundary line (add) or long-presses vertex (delete)
- **Process:**
  1. **Add:** System inserts new vertex at tap location, redraws polygon
  2. **Delete:** System removes vertex (minimum 3 vertices required), redraws polygon
  3. System recalculates area
  4. System updates undo stack
- **Output:** Vertex added/deleted, polygon updated
- **Preconditions:** Boundary displayed
- **Postconditions:** Polygon modified
- **Error Handling:**
  - If <3 vertices: "Boundary must have at least 3 points."

**FR-002.7: Field Area Calculation**
- **Input:** Boundary polygon (GPS coordinates)
- **Process:**
  1. System converts GPS coordinates to projected coordinates (UTM Zone 44N for Sri Lanka)
  2. System calculates polygon area using Shoelace formula
  3. System converts area to hectares (1 hectare = 10,000 m²)
  4. System rounds to 2 decimal places
  5. System validates area (0.1 ha minimum, 50 ha maximum for paddy fields)
- **Output:** Field area in hectares
- **Preconditions:** Valid boundary polygon
- **Postconditions:** Area calculated and stored
- **Error Handling:**
  - If area <0.1 ha: "Field too small. Minimum 0.1 hectares."
  - If area >50 ha: "Field very large. Please verify boundary is correct."

**FR-002.8: Field Confirmation & Saving**
- **Input:** User clicks "Confirm Boundary" button
- **Process:**
  1. System prompts for field name (default: "Field 1", "Field 2", etc.)
  2. User enters field name (max 50 characters)
  3. System validates field name (no duplicates for same user)
  4. System saves field to database:
     - User ID (foreign key)
     - Field name
     - Boundary polygon (GeoJSON format)
     - Area (hectares)
     - Center point (GPS coordinates)
     - Creation timestamp
  5. System displays success message: "Field saved successfully!"
  6. System redirects to field dashboard
- **Output:** Field saved, user redirected to dashboard
- **Preconditions:** Boundary confirmed
- **Postconditions:** Field stored in database, visible on dashboard
- **Error Handling:**
  - If duplicate name: "You already have a field named '[name]'. Please choose a different name."
  - If save fails: "Unable to save field. Please try again."

**FR-002.9: Multi-Field Support**
- **Input:** User adds multiple fields
- **Process:**
  1. System allows up to 5 fields per user (Phase 1 limit)
  2. System displays all fields on dashboard
  3. System allows user to switch between fields
  4. System calculates aggregate statistics (total area, average health)
- **Output:** Multiple fields managed
- **Preconditions:** User logged in
- **Postconditions:** Multiple fields stored and accessible
- **Error Handling:**
  - If user tries to add 6th field: "You've reached the maximum of 5 fields. Upgrade to Premium for unlimited fields (Phase 2)."

**Non-Functional Requirements:**
- **NFR-002.1:** Map shall load within 5 seconds on 3G connection
- **NFR-002.2:** AI boundary detection shall complete within 60 seconds
- **NFR-002.3:** Boundary detection accuracy shall be ≥85% IoU on validation dataset
- **NFR-002.4:** Area calculation accuracy shall be ±5% of ground truth
- **NFR-002.5:** Map interactions (zoom, pan) shall be smooth (60 FPS)

---

### 3.3 Feature: Crop Health Monitoring

**Feature ID:** SF-003  
**Priority:** Critical (P0)  
**Risk:** Low

**Description:**
Calculate and display vegetation indices (NDVI, NDWI, TDVI) from satellite imagery to assess crop health and provide visual feedback.

**Functional Requirements:**

**FR-003.1: Satellite Image Retrieval**
- **Input:** Field boundary polygon, date range
- **Process:**
  1. System queries Sentinel Hub API for available images:
     - Bounding box: Field boundary + 100m buffer
     - Date range: Last 30 days
     - Cloud cover: <20%
     - Bands: B02 (Blue), B03 (Green), B04 (Red), B08 (NIR), B11 (SWIR)
  2. System selects most recent cloud-free image
  3. System downloads image (GeoTIFF format, 10m resolution)
  4. System caches image for 30 days (reduce API calls)
- **Output:** Satellite image retrieved and cached
- **Preconditions:** Field boundary exists, Sentinel Hub API accessible
- **Postconditions:** Image stored in cache, ready for processing
- **Error Handling:**
  - If no cloud-free images: "No clear satellite images available in last 30 days. Try again in 5 days."
  - If API rate limit exceeded: "Daily image limit reached. Please try again tomorrow."
  - If API error: Retry with exponential backoff (3 attempts), then display error

**FR-003.2: NDVI Calculation**
- **Input:** Satellite image (Red and NIR bands)
- **Process:**
  1. System extracts Red (B04) and NIR (B08) bands
  2. System applies NDVI formula: NDVI = (NIR - Red) / (NIR + Red + ε)
     - ε = 1e-10 (prevent division by zero)
  3. System clips NDVI values to range [-1, 1]
  4. System masks non-field areas (use boundary polygon)
  5. System calculates statistics:
     - Mean NDVI (average across field)
     - Min/Max NDVI
     - Standard deviation
     - Histogram (distribution)
- **Output:** NDVI raster (2D array) and statistics
- **Preconditions:** Satellite image retrieved
- **Postconditions:** NDVI calculated and stored
- **Error Handling:**
  - If calculation fails: Log error, use cached NDVI from previous date

**FR-003.3: NDWI Calculation**
- **Input:** Satellite image (NIR and SWIR bands)
- **Process:**
  1. System extracts NIR (B08) and SWIR (B11) bands
  2. System applies NDWI formula: NDWI = (NIR - SWIR) / (NIR + SWIR + ε)
  3. System clips NDWI values to range [-1, 1]
  4. System masks non-field areas
  5. System calculates statistics (mean, min, max, std dev)
- **Output:** NDWI raster and statistics
- **Preconditions:** Satellite image retrieved
- **Postconditions:** NDWI calculated and stored

**FR-003.4: TDVI Calculation**
- **Input:** NDVI values
- **Process:**
  1. System applies TDVI transformation: TDVI = sqrt(NDVI + 0.5)
  2. System calculates statistics
- **Output:** TDVI raster and statistics
- **Preconditions:** NDVI calculated
- **Postconditions:** TDVI calculated and stored

**FR-003.5: Health Status Classification**
- **Input:** Mean NDVI value
- **Process:**
  1. System classifies health status:
     - Excellent: NDVI ≥0.8 (dark green, score 90-100)
     - Good: NDVI 0.7-0.8 (green, score 70-89)
     - Fair: NDVI 0.5-0.7 (yellow, score 50-69)
     - Poor: NDVI <0.5 (red, score 0-49)
  2. System calculates overall health score: score = NDVI × 100
  3. System determines trend (compare to previous measurement):
     - Improving: NDVI increased >5%
     - Stable: NDVI changed ±5%
     - Declining: NDVI decreased >5%
- **Output:** Health status, score, trend
- **Preconditions:** NDVI calculated
- **Postconditions:** Health status stored in database

**FR-003.6: Color-Coded Field Visualization**
- **Input:** NDVI raster
- **Process:**
  1. System applies color map:
     - NDVI 0.8-1.0: Dark green (#059669)
     - NDVI 0.7-0.8: Green (#10B981)
     - NDVI 0.5-0.7: Yellow (#F59E0B)
     - NDVI 0.3-0.5: Orange (#F97316)
     - NDVI <0.3: Red (#EF4444)
  2. System overlays colored raster on map
  3. System overlays field boundary (white outline)
  4. System adds legend (color scale with NDVI values)
  5. System enables zoom and pan
- **Output:** Color-coded field map displayed
- **Preconditions:** NDVI calculated
- **Postconditions:** Visual health map displayed to user

**FR-003.7: Health Data Storage**
- **Input:** Calculated indices and health status
- **Process:**
  1. System stores health record in database:
     - Field ID (foreign key)
     - Measurement date
     - NDVI (mean, min, max, std dev)
     - NDWI (mean, min, max, std dev)
     - TDVI (mean, min, max, std dev)
     - Health status (Excellent/Good/Fair/Poor)
     - Health score (0-100)
     - Trend (Improving/Stable/Declining)
     - Satellite image ID (reference)
  2. System retains last 6 months of health data
  3. System archives older data (compress, move to cold storage)
- **Output:** Health data persisted
- **Preconditions:** Indices calculated
- **Postconditions:** Health record stored, accessible for historical analysis

**FR-003.8: Health Update Frequency**
- **Input:** Sentinel-2 revisit schedule (5 days)
- **Process:**
  1. System checks for new satellite images every 24 hours (automated job)
  2. System processes new images if available and cloud-free
  3. System updates health data
  4. System sends push notification if significant change (NDVI change >10%)
- **Output:** Health data updated automatically
- **Preconditions:** Field exists in database
- **Postconditions:** Latest health data available

**Non-Functional Requirements:**
- **NFR-003.1:** Satellite image retrieval shall complete within 10 seconds
- **NFR-003.2:** NDVI calculation shall complete within 5 seconds for 512×512 image
- **NFR-003.3:** Health map shall render within 3 seconds
- **NFR-003.4:** NDVI correlation with ground truth shall be ≥0.90
- **NFR-003.5:** System shall cache satellite images for 30 days to reduce API calls

---

### 3.4 Feature: Precision Agriculture Recommendations

**Feature ID:** SF-004  
**Priority:** Critical (P0)  
**Risk:** Low

**Description:**
Generate actionable water and fertilizer recommendations based on vegetation indices and weather forecasts.

**Functional Requirements:**

**FR-004.1: Water Recommendation Engine**
- **Input:** NDWI value, weather forecast, field history
- **Process:**
  1. System analyzes NDWI:
     - NDWI >0.3: Adequate water
     - NDWI 0.1-0.3: Moderate water stress
     - NDWI <0.1: Severe water stress
  2. System checks weather forecast (next 48 hours):
     - If rain >20mm expected: Delay irrigation
     - If no rain: Proceed with recommendation
  3. System checks irrigation history:
     - If irrigated <3 days ago: Skip recommendation
     - If irrigated >7 days ago: Urgent recommendation
  4. System generates recommendation:
     - **No stress:** "No irrigation needed. Your crop has adequate water."
     - **Moderate stress:** "Irrigate in 2-3 days. Water stress detected in [zones]."
     - **Severe stress:** "Irrigate immediately! Severe water stress in [zones]."
  5. System estimates water savings: "Following this advice will save ~500 liters vs. schedule-based irrigation."
- **Output:** Water recommendation with timing, zones, and savings estimate
- **Preconditions:** NDWI calculated, weather forecast available
- **Postconditions:** Recommendation stored, displayed to user
- **Error Handling:**
  - If NDWI unavailable: Use previous measurement with disclaimer
  - If weather forecast unavailable: Generate recommendation without weather consideration

**FR-004.2: Fertilizer Recommendation Engine**
- **Input:** NDVI value, growth stage, fertilizer history
- **Process:**
  1. System analyzes NDVI:
     - NDVI >0.75: Healthy, no fertilizer needed
     - NDVI 0.6-0.75: Moderate vigor, targeted fertilizer
     - NDVI <0.6: Low vigor, fertilizer + pest check
  2. System determines growth stage (days since planting):
     - Vegetative (0-60 days): Nitrogen-rich fertilizer
     - Reproductive (60-90 days): Balanced NPK
     - Maturity (90+ days): No fertilizer
  3. System checks fertilizer history:
     - If applied <14 days ago: Skip recommendation
     - If applied >30 days ago: Urgent recommendation
  4. System generates recommendation:
     - **Healthy:** "No fertilizer needed. Your crop is healthy."
     - **Moderate:** "Apply 30 kg/ha urea to yellow zones (low NDVI areas)."
     - **Low vigor:** "Apply 50 kg/ha urea + check for pests/diseases in red zones."
  5. System recommends timing: "Apply 2 days before rain for better absorption."
  6. System estimates cost savings: "Targeted application saves Rs. 3,000 vs. uniform application."
- **Output:** Fertilizer recommendation with type, quantity, zones, timing, savings
- **Preconditions:** NDVI calculated, growth stage known
- **Postconditions:** Recommendation stored, displayed to user

**FR-004.3: Alert Generation**
- **Input:** Health data, thresholds
- **Process:**
  1. System checks for critical conditions:
     - **Severe water stress:** NDWI <0.05
     - **Rapid NDVI decline:** NDVI drop >15% in 7 days
     - **Extreme weather:** Rain >50mm or Temperature >35°C
     - **Pest outbreak (suspected):** NDVI drop >20% in localized area
  2. System generates alert with:
     - Alert type (Water Stress, NDVI Decline, Weather, Pest)
     - Severity (Critical, High, Medium)
     - Description (what's wrong)
     - Recommendation (what to do)
     - Timing (when to act)
  3. System sends push notification (mobile app)
  4. System displays alert on dashboard (red banner)
  5. System logs alert in database
- **Output:** Alert generated and delivered
- **Preconditions:** Health data available
- **Postconditions:** Alert stored, user notified

**FR-004.4: Recommendation History**
- **Input:** User views recommendation history
- **Process:**
  1. System retrieves last 10 recommendations for field
  2. System displays recommendations with:
     - Date
     - Type (Water, Fertilizer, Alert)
     - Recommendation text
     - Status (Pending, Done, Ignored)
     - User action (if any)
  3. System allows user to mark recommendation as "Done" or "Ignored"
- **Output:** Recommendation history displayed
- **Preconditions:** Field has recommendations
- **Postconditions:** User can track recommendation compliance

**Non-Functional Requirements:**
- **NFR-004.1:** Recommendations shall be generated within 5 seconds
- **NFR-004.2:** Recommendations shall be updated every 5-7 days (Sentinel-2 revisit)
- **NFR-004.3:** Water recommendations shall achieve 20-30% savings (validated via user surveys)
- **NFR-004.4:** Fertilizer recommendations shall achieve 15-20% cost savings
- **NFR-004.5:** Alerts shall be delivered within 5 minutes of detection

---

### 3.5 Feature: Yield Prediction

**Feature ID:** SF-005  
**Priority:** Critical (P0)  
**Risk:** Medium (ML model accuracy)

**Description:**
Predict expected harvest quantity using Random Forest regression model trained on NDVI time series, weather data, and historical yields.

**Functional Requirements:**

**FR-005.1: Yield Prediction Model**
- **Input:** 
  - NDVI time series (last 60 days, 5-day intervals = 12 data points)
  - Weather data (temperature, rainfall, last 30 days)
  - Field area (hectares)
  - Growth stage (days since planting)
  - Historical yields (if available)
- **Process:**
  1. System preprocesses features:
     - Normalize NDVI values (0-1 scale)
     - Calculate NDVI statistics (mean, max, trend)
     - Aggregate weather data (total rainfall, average temperature)
     - Encode growth stage (one-hot encoding)
  2. System runs Random Forest model:
     - Model: 100 decision trees, max depth 10
     - Features: 25 (NDVI stats, weather, area, stage)
     - Output: Predicted yield (kg/hectare)
  3. System calculates confidence interval:
     - Use model's prediction variance
     - 95% confidence interval (±10-15% of prediction)
  4. System calculates total yield: Yield per hectare × Field area
  5. System calculates expected revenue: Total yield × Market price (Rs. 30/kg default)
- **Output:** Predicted yield (kg/ha), total yield (kg), confidence interval, revenue
- **Preconditions:** NDVI time series available (minimum 4 data points), model trained
- **Postconditions:** Yield prediction stored in database
- **Error Handling:**
  - If insufficient data: "Not enough data for accurate prediction. Check back in 2 weeks."
  - If model error: Use fallback (average yield for region × field area)

**FR-005.2: Yield Prediction Display**
- **Input:** Yield prediction data
- **Process:**
  1. System displays prediction on field dashboard:
     - **Primary:** "Estimated Yield: 4,200 kg/hectare"
     - **Secondary:** "Total: 8,400 kg (2 hectares)"
     - **Confidence:** "Range: 3,800 - 4,600 kg/ha (95% confidence)"
     - **Revenue:** "Expected Revenue: Rs. 252,000 (at Rs. 30/kg)"
     - **Harvest Date:** "Estimated Harvest: ~45 days (January 15, 2026)"
  2. System displays visual indicator:
     - Progress bar showing yield vs. optimal (4,500 kg/ha benchmark)
     - Color-coded: Green (above benchmark), Yellow (at benchmark), Red (below)
  3. System shows comparison to previous season (if data available)
- **Output:** Yield prediction displayed in user-friendly format
- **Preconditions:** Yield predicted
- **Postconditions:** User informed of expected harvest

**FR-005.3: Yield Prediction Updates**
- **Input:** New NDVI data (every 5-7 days)
- **Process:**
  1. System recalculates yield prediction with updated NDVI
  2. System compares new prediction to previous prediction
  3. System detects significant changes (>10% difference)
  4. System sends notification if yield trending down: "Yield forecast decreased by 12%. Check field health."
  5. System updates prediction on dashboard
- **Output:** Updated yield prediction
- **Preconditions:** New NDVI data available
- **Postconditions:** Latest prediction displayed

**FR-005.4: Actual Yield Tracking**
- **Input:** User enters actual harvest quantity after harvest
- **Process:**
  1. System prompts user: "Harvest complete? Enter actual yield."
  2. User enters yield (kg/hectare or total kg)
  3. System calculates prediction accuracy: MAPE = |Actual - Predicted| / Actual × 100%
  4. System stores actual yield in database
  5. System displays accuracy: "Our prediction was 92% accurate!"
  6. System uses actual yield to retrain model (improve future predictions)
- **Output:** Actual yield stored, accuracy calculated
- **Preconditions:** Harvest completed
- **Postconditions:** Actual yield stored, model improvement data collected

**Non-Functional Requirements:**
- **NFR-005.1:** Yield prediction shall complete within 10 seconds
- **NFR-005.2:** Yield prediction accuracy shall be ≥85% (MAPE <15%)
- **NFR-005.3:** Yield prediction shall update every 10 days during growing season
- **NFR-005.4:** Model shall be retrained monthly with new actual yield data

---

### 3.6 Feature: Weather Forecasting

**Feature ID:** SF-006  
**Priority:** Critical (P0)  
**Risk:** Low

**Description:**
Display 7-day weather forecast for field location with extreme weather alerts.

**Functional Requirements:**

**FR-006.1: Weather Data Retrieval**
- **Input:** Field GPS coordinates
- **Process:**
  1. System queries OpenWeatherMap API:
     - Endpoint: `/data/2.5/forecast/daily`
     - Parameters: lat, lon, cnt=7, units=metric
  2. System retrieves 7-day forecast:
     - Daily temperature (min, max)
     - Weather conditions (clear, clouds, rain, etc.)
     - Rainfall probability (%)
     - Rainfall amount (mm)
     - Humidity (%)
     - Wind speed (km/h)
  3. System caches forecast for 6 hours (reduce API calls)
- **Output:** 7-day weather forecast
- **Preconditions:** Field GPS coordinates available, OpenWeatherMap API accessible
- **Postconditions:** Forecast cached and ready for display
- **Error Handling:**
  - If API error: Use cached forecast with disclaimer "Last updated: [timestamp]"
  - If no cached data: Display generic message "Weather forecast unavailable. Try again later."

**FR-006.2: Weather Forecast Display**
- **Input:** Weather forecast data
- **Process:**
  1. System displays current weather:
     - Large weather icon (sun, cloud, rain, storm)
     - Current temperature (large font)
     - Conditions text (e.g., "Partly Cloudy")
     - Humidity, wind speed (small font)
  2. System displays 7-day forecast:
     - Horizontal scrollable cards (one per day)
     - Day name (Today, Tomorrow, Wed, Thu, etc.)
     - Weather icon
     - High/low temperature
     - Rainfall probability (%)
  3. System highlights extreme weather days (red border)
- **Output:** Weather forecast displayed
- **Preconditions:** Forecast retrieved
- **Postconditions:** User informed of weather conditions

**FR-006.3: Weather Alerts**
- **Input:** Weather forecast data
- **Process:**
  1. System checks for extreme weather conditions:
     - Heavy rain: >50mm in 24 hours
     - Extreme heat: Temperature >35°C
     - Strong winds: Wind speed >40 km/h
     - Drought: No rain for 14+ consecutive days
  2. System generates alert:
     - Alert type (Heavy Rain, Extreme Heat, etc.)
     - Timing (when it will occur)
     - Impact (what it means for crops)
     - Recommendation (what to do)
  3. System sends push notification
  4. System displays alert on weather screen (yellow/red banner)
- **Output:** Weather alert generated and delivered
- **Preconditions:** Forecast retrieved
- **Postconditions:** User alerted to extreme weather

**FR-006.4: Weather-Integrated Recommendations**
- **Input:** Weather forecast, crop recommendations
- **Process:**
  1. System integrates weather into recommendations:
     - If rain expected in 48 hours: "Delay fertilizer application until after rain."
     - If heavy rain expected: "Ensure drainage channels are clear."
     - If drought: "Irrigate immediately. No rain expected for 10 days."
  2. System adjusts recommendation timing based on weather
  3. System displays integrated recommendation
- **Output:** Weather-aware recommendations
- **Preconditions:** Weather forecast and crop recommendations available
- **Postconditions:** Optimized recommendations displayed

**Non-Functional Requirements:**
- **NFR-006.1:** Weather forecast shall update every 6 hours
- **NFR-006.2:** Weather forecast accuracy shall be ≥80% (validated against actual weather)
- **NFR-006.3:** Weather alerts shall be delivered within 5 minutes of detection
- **NFR-006.4:** Weather screen shall load within 3 seconds

---

### 3.7 Feature: Disaster Assessment

**Feature ID:** SF-007  
**Priority:** High (P1)  
**Risk:** Medium

**Description:**
Compare satellite images before and after disaster events to quantify crop damage and generate insurance reports.

**Functional Requirements:**

**FR-007.1: Disaster Event Selection**
- **Input:** User selects disaster type and dates
- **Process:**
  1. System displays disaster types:
     - Flood
     - Drought
     - Storm/Cyclone
     - Other
  2. System displays calendar with satellite image availability:
     - Green: Cloud-free image available
     - Yellow: Partial cloud cover (<20%)
     - Red: No usable image (>20% cloud)
  3. User selects "Before" date (1-2 weeks before disaster)
  4. User selects "After" date (3-7 days after disaster)
  5. System validates date selection (before < after, max 60 days apart)
- **Output:** Disaster event configured
- **Preconditions:** Field exists, disaster occurred
- **Postconditions:** Dates selected, ready for analysis

**FR-007.2: Damage Analysis**
- **Input:** Before/after dates
- **Process:**
  1. System retrieves satellite images for both dates
  2. System calculates NDVI for both images
  3. System computes NDVI difference: ΔNDVI = NDVI_after - NDVI_before
  4. System classifies damage severity:
     - Severe damage: ΔNDVI < -0.3 (NDVI dropped >30%)
     - Moderate damage: ΔNDVI -0.2 to -0.3 (NDVI dropped 20-30%)
     - Minor damage: ΔNDVI -0.1 to -0.2 (NDVI dropped 10-20%)
     - No damage: ΔNDVI > -0.1
  5. System calculates damaged area:
     - Severe: X hectares (Y% of field)
     - Moderate: X hectares (Y% of field)
     - Total damaged: X hectares (Y% of field)
  6. System generates damage map (color-coded: green=no damage, yellow=moderate, red=severe)
- **Output:** Damage analysis results
- **Preconditions:** Before/after images retrieved
- **Postconditions:** Damage quantified

**FR-007.3: Financial Loss Estimation**
- **Input:** Damage analysis results, expected yield
- **Process:**
  1. System estimates yield loss:
     - Severe damage: 80% yield loss in affected area
     - Moderate damage: 50% yield loss in affected area
     - Minor damage: 20% yield loss in affected area
  2. System calculates total yield loss (kg):
     - Loss = (Severe area × 0.8 + Moderate area × 0.5 + Minor area × 0.2) × Expected yield per hectare
  3. System calculates financial loss:
     - Loss (Rs.) = Yield loss (kg) × Market price (Rs. 30/kg default)
  4. System displays breakdown:
     - Severe damage: X kg, Rs. Y
     - Moderate damage: X kg, Rs. Y
     - Total loss: X kg, Rs. Y
- **Output:** Financial loss estimate
- **Preconditions:** Damage analysis complete
- **Postconditions:** Loss quantified in kg and Rs.

**FR-007.4: Insurance Report Generation**
- **Input:** Damage analysis and financial loss data
- **Process:**
  1. System generates PDF report with:
     - **Header:** SkyCrop logo, report title, date
     - **Field Information:**
       - Field name, location (GPS coordinates)
       - Field area (hectares)
       - Owner name
     - **Disaster Information:**
       - Disaster type, date
       - Before/after dates selected
     - **Satellite Images:**
       - Before image (with NDVI overlay)
       - After image (with NDVI overlay)
       - Side-by-side comparison
     - **Damage Analysis:**
       - Damage map (color-coded)
       - Damaged area (hectares, percentage)
       - Severity breakdown (severe, moderate, minor)
     - **Financial Loss:**
       - Yield loss (kg)
       - Financial loss (Rs.)
       - Calculation methodology
     - **Certification:**
       - "This report is generated by SkyCrop using Sentinel-2 satellite imagery and AI analysis."
       - Disclaimer: "This is an estimate based on satellite data. Actual damage may vary."
       - Report ID, generation timestamp
       - SkyCrop certification stamp
  2. System saves PDF to user account
  3. System enables sharing via WhatsApp, email
- **Output:** PDF insurance report
- **Preconditions:** Damage analysis complete
- **Postconditions:** Report generated, stored, shareable

**Non-Functional Requirements:**
- **NFR-007.1:** Damage analysis shall complete within 90 seconds
- **NFR-007.2:** Damage detection accuracy shall be ≥80%
- **NFR-007.3:** PDF report shall be generated within 10 seconds
- **NFR-007.4:** Report shall be <5 MB (shareable via WhatsApp)

---

### 3.8 Feature: Mobile Application

**Feature ID:** SF-008  
**Priority:** Critical (P0)  
**Risk:** Medium

**Description:**
Cross-platform mobile application (Android & iOS) with feature parity to web app and mobile-specific features (push notifications, offline mode).

**Functional Requirements:**

**FR-008.1: Mobile App Platform Support**
- **Input:** User downloads app from Google Play or Apple App Store
- **Process:**
  1. System provides React Native app for:
     - Android 8.0+ (API level 26+)
     - iOS 13.0+
  2. System supports screen sizes: 4.5" to 6.5"
  3. System supports screen orientations: Portrait (primary), Landscape (optional)
  4. System adapts UI to platform conventions:
     - Android: Material Design
     - iOS: Human Interface Guidelines
- **Output:** App installed on user device
- **Preconditions:** User has compatible device
- **Postconditions:** App ready to use

**FR-008.2: Push Notifications**
- **Input:** System event (health alert, weather warning, recommendation)
- **Process:**
  1. System sends notification via Firebase Cloud Messaging:
     - Title (e.g., "Water Stress Detected")
     - Body (e.g., "Your field needs irrigation in 2 days")
     - Icon (SkyCrop logo)
     - Action (deep link to field details)
  2. System displays notification on device lock screen and notification tray
  3. User taps notification → App opens to relevant screen
  4. System tracks notification delivery and open rate
- **Output:** Push notification delivered
- **Preconditions:** User granted notification permission, app installed
- **Postconditions:** User notified, engagement tracked

**FR-008.3: Offline Mode (Cached Data)**
- **Input:** User opens app without internet connection
- **Process:**
  1. System checks network connectivity
  2. If offline:
     - System loads cached data (last 30 days)
     - System displays banner: "Offline mode. Showing cached data from [date]."
     - System disables features requiring internet (new field, refresh data)
     - System enables read-only features (view health, recommendations, weather)
  3. When online:
     - System syncs data automatically
     - System updates cached data
     - System removes offline banner
- **Output:** App usable offline with cached data
- **Preconditions:** User previously used app online (data cached)
- **Postconditions:** User can view historical data offline

**FR-008.4: Mobile-Specific UI**
- **Input:** User interacts with mobile app
- **Process:**
  1. System provides mobile-optimized UI:
     - Bottom navigation (4-5 tabs)
     - Large touch targets (min 44×44 pixels)
     - Swipe gestures (navigate between screens)
     - Pull-to-refresh (update data)
     - Floating action button (add field)
  2. System supports one-handed operation where possible
  3. System minimizes text input (use dropdowns, toggles, maps)
- **Output:** Mobile-friendly user experience
- **Preconditions:** App installed
- **Postconditions:** User can navigate app efficiently

**Non-Functional Requirements:**
- **NFR-008.1:** Mobile app shall work on devices with 2GB+ RAM
- **NFR-008.2:** Mobile app size shall be <50 MB
- **NFR-008.3:** Mobile app crash rate shall be <2%
- **NFR-008.4:** Mobile app shall load within 3 seconds on 4G connection
- **NFR-008.5:** Push notifications shall be delivered within 5 minutes

---

### 3.9 Feature: Admin Dashboard

**Feature ID:** SF-009  
**Priority:** High (P1)  
**Risk:** Low

**Description:**
Administrative interface for content management, user management, and system monitoring.

**Functional Requirements:**

**FR-009.1: Content Management System (CMS)**
- **Input:** Admin creates/edits news article
- **Process:**
  1. System provides rich text editor:
     - Text formatting (bold, italic, headings)
     - Image upload (max 2 MB)
     - Link insertion
     - Preview mode
  2. Admin enters article details:
     - Title (max 100 characters)
     - Category (News, Best Practices, Market Prices, Government Schemes)
     - Summary (max 200 characters)
     - Content (rich text)
     - Featured image
     - Publication date (schedule or publish immediately)
  3. System validates inputs
  4. System saves article to database
  5. System publishes article (visible to users)
- **Output:** Article published
- **Preconditions:** Admin logged in
- **Postconditions:** Article visible to users

**FR-009.2: User Management**
- **Input:** Admin views user list
- **Process:**
  1. System displays user table:
     - User ID, Name, Email, Phone
     - Signup date, Last login
     - Fields count, Status (Active, Suspended, Deleted)
  2. System provides filters:
     - Status (Active, Suspended, Deleted)
     - Signup date range
     - Last login date range
  3. System provides search (by name, email, phone)
  4. System provides actions:
     - View user details
     - Suspend account (with reason)
     - Delete account (with confirmation)
     - Export user data (CSV)
- **Output:** User list displayed, actions available
- **Preconditions:** Admin logged in
- **Postconditions:** Admin can manage users

**FR-009.3: Analytics Dashboard**
- **Input:** Admin views analytics
- **Process:**
  1. System displays key metrics:
     - Total users, Active users (DAU, WAU, MAU)
     - Total fields mapped
     - Feature usage (% users using each feature)
     - User engagement (session duration, frequency)
     - System health (uptime, error rate, API usage)
  2. System displays charts:
     - User growth over time (line chart)
     - Feature adoption (bar chart)
     - Geographic distribution (map)
     - Health status distribution (pie chart)
  3. System allows date range selection
  4. System allows export to CSV/PDF
- **Output:** Analytics displayed
- **Preconditions:** Admin logged in, analytics data available
- **Postconditions:** Admin informed of system performance

**FR-009.4: System Monitoring**
- **Input:** System health metrics
- **Process:**
  1. System displays real-time metrics:
     - API uptime (%)
     - API response times (p50, p95, p99)
     - Error rate (errors per 1000 requests)
     - Satellite API usage (requests used / limit)
     - Database size (GB)
     - Active sessions
  2. System displays recent errors (last 100)
  3. System sends alerts to admin for critical issues:
     - Uptime <99%
     - Error rate >1%
     - API rate limit approaching (>80% used)
  4. System provides logs (searchable, filterable)
- **Output:** System health displayed, alerts sent
- **Preconditions:** Admin logged in
- **Postconditions:** Admin aware of system status

**Non-Functional Requirements:**
- **NFR-009.1:** Admin dashboard shall load within 5 seconds
- **NFR-009.2:** Admin shall be able to publish article in <5 minutes
- **NFR-009.3:** Analytics shall update in real-time (max 5-minute delay)
- **NFR-009.4:** System shall send admin alerts within 5 minutes of critical issue

---

## 4. EXTERNAL INTERFACE REQUIREMENTS

### 4.1 User Interfaces

**UI-001: Web Application Interface**

**Platform:** Desktop and tablet browsers  
**Technology:** React.js 18, Tailwind CSS, Leaflet.js  
**Supported Browsers:** Chrome 100+, Firefox 100+, Safari 15+, Edge 100+

**Screen Resolutions:**
- Desktop: 1920×1080 (primary), 1366×768 (minimum)
- Tablet: 1024×768 (landscape), 768×1024 (portrait)

**UI Components:**
- **Navigation:** Top navigation bar with logo, menu, profile icon
- **Layout:** Responsive grid (12-column system)
- **Cards:** Rounded corners (8px), shadow (subtle), padding (16px)
- **Buttons:** Primary (green), Secondary (gray), Danger (red)
- **Forms:** Input fields with labels, validation messages, help text
- **Maps:** Full-screen or embedded (min 400×400 pixels)
- **Charts:** Line charts, bar charts, pie charts (Recharts library)

**Accessibility:**
- WCAG 2.1 Level AA compliance (Phase 2)
- Keyboard navigation support
- Screen reader support (ARIA labels)
- High contrast mode (optional)

---

**UI-002: Mobile Application Interface**

**Platform:** Android 8.0+ and iOS 13.0+  
**Technology:** React Native 0.72, React Navigation, React Native Maps  
**Screen Sizes:** 4.5" to 6.5" (320×568 to 414×896 pixels)

**UI Components:**
- **Navigation:** Bottom tab bar (4-5 tabs), stack navigation for screens
- **Layout:** Single-column, full-width cards
- **Touch Targets:** Minimum 44×44 pixels (iOS), 48×48 pixels (Android)
- **Gestures:** Tap, long-press, swipe, pinch-to-zoom
- **Animations:** Smooth transitions (60 FPS), loading spinners, progress indicators

**Platform-Specific:**
- **Android:** Material Design 3, floating action button, snackbar notifications
- **iOS:** SF Symbols, tab bar, alert dialogs

**Accessibility:**
- Large text support (up to 200% scaling)
- VoiceOver (iOS) and TalkBack (Android) support (Phase 2)
- Haptic feedback for important actions

---

**UI-003: Admin Dashboard Interface**

**Platform:** Desktop browsers  
**Technology:** React.js 18, Tailwind CSS, Recharts  
**Supported Browsers:** Chrome 100+, Firefox 100+, Edge 100+

**Screen Resolutions:** 1920×1080 (primary), 1366×768 (minimum)

**UI Components:**
- **Sidebar:** Left sidebar with navigation menu (collapsible)
- **Main Content:** Data tables, charts, forms
- **Tables:** Sortable columns, pagination, search, filters
- **Forms:** Rich text editor (TinyMCE or Quill), image upload, date pickers
- **Charts:** Real-time updating charts (analytics)

---

### 4.2 Hardware Interfaces

**HW-001: Smartphone GPS**
- **Interface:** Device GPS sensor (Android Location API, iOS Core Location)
- **Purpose:** Determine user location for map centering
- **Data:** Latitude, longitude, accuracy (meters)
- **Frequency:** On-demand (when user opens map)
- **Accuracy:** ±10 meters (typical GPS accuracy)

**HW-002: Smartphone Camera (Phase 2)**
- **Interface:** Device camera (Android Camera2 API, iOS AVFoundation)
- **Purpose:** Capture field photos for pest/disease detection
- **Data:** JPEG images (max 5 MB)
- **Frequency:** On-demand (when user takes photo)
- **Resolution:** Minimum 1920×1080 pixels

**HW-003: Smartphone Storage**
- **Interface:** Device file system
- **Purpose:** Cache satellite images, health data, offline mode
- **Data:** Images (WebP format), JSON data
- **Storage:** Maximum 500 MB (user-configurable)
- **Frequency:** Continuous (as data is downloaded)

---

### 4.3 Software Interfaces

**SW-001: Sentinel Hub API**

**Interface Type:** RESTful API (HTTPS)  
**Version:** Sentinel Hub API v3  
**Purpose:** Retrieve Sentinel-2 satellite imagery

**Endpoints:**
- `POST /api/v1/process` - Request satellite imagery
- `GET /api/v1/catalog/search` - Search available images

**Request Format (Process API):**
```json
{
  "input": {
    "bounds": {
      "bbox": [81.01, 7.93, 81.02, 7.94],
      "properties": { "crs": "http://www.opengis.net/def/crs/EPSG/0/4326" }
    },
    "data": [{
      "type": "sentinel-2-l2a",
      "dataFilter": {
        "timeRange": { "from": "2025-10-01T00:00:00Z", "to": "2025-10-28T23:59:59Z" },
        "maxCloudCoverage": 20
      }
    }]
  },
  "output": {
    "width": 512,
    "height": 512,
    "responses": [{
      "identifier": "default",
      "format": { "type": "image/tiff" }
    }]
  },
  "evalscript": "..."
}
```

**Response Format:**
- GeoTIFF image (multispectral bands)
- Metadata (acquisition date, cloud cover, resolution)

**Authentication:** OAuth 2.0 (client credentials)  
**Rate Limit:** 3,000 requests/month (academic tier)  
**Error Codes:**
- 400: Bad request (invalid parameters)
- 401: Unauthorized (invalid credentials)
- 429: Rate limit exceeded
- 500: Server error

**Data Flow:**
1. SkyCrop backend → Sentinel Hub API (HTTPS POST)
2. Sentinel Hub → SkyCrop backend (GeoTIFF image)
3. SkyCrop backend → Database (store image reference)
4. SkyCrop backend → Frontend (processed NDVI data)

---

**SW-002: OpenWeatherMap API**

**Interface Type:** RESTful API (HTTPS)  
**Version:** OpenWeatherMap API v2.5  
**Purpose:** Retrieve weather forecasts and historical data

**Endpoints:**
- `GET /data/2.5/forecast/daily` - 7-day forecast
- `GET /data/2.5/weather` - Current weather
- `GET /data/2.5/onecall/timemachine` - Historical weather

**Request Format (7-Day Forecast):**
```
GET https://api.openweathermap.org/data/2.5/forecast/daily?lat=7.94&lon=81.01&cnt=7&units=metric&appid={API_KEY}
```

**Response Format:**
```json
{
  "city": { "name": "Polonnaruwa", "country": "LK" },
  "list": [
    {
      "dt": 1698537600,
      "temp": { "min": 24, "max": 32 },
      "weather": [{ "main": "Rain", "description": "light rain", "icon": "10d" }],
      "humidity": 75,
      "wind_speed": 12,
      "pop": 0.6,
      "rain": 5.2
    }
  ]
}
```

**Authentication:** API key (query parameter)  
**Rate Limit:** 60 calls/minute, 1,000,000 calls/month (free tier)  
**Error Codes:**
- 401: Invalid API key
- 404: Location not found
- 429: Rate limit exceeded

**Data Flow:**
1. SkyCrop backend → OpenWeatherMap API (HTTPS GET)
2. OpenWeatherMap → SkyCrop backend (JSON response)
3. SkyCrop backend → Cache (Redis, 6-hour TTL)
4. SkyCrop backend → Frontend (weather data)

---

**SW-003: Google OAuth 2.0**

**Interface Type:** OAuth 2.0 Authorization Framework  
**Version:** OAuth 2.0 (RFC 6749)  
**Purpose:** User authentication via Google accounts

**OAuth Flow:** Authorization Code Grant

**Endpoints:**
- Authorization: `https://accounts.google.com/o/oauth2/v2/auth`
- Token: `https://oauth2.googleapis.com/token`
- User Info: `https://www.googleapis.com/oauth2/v1/userinfo`

**Scopes:**
- `openid` - User ID
- `profile` - Name, photo
- `email` - Email address

**Request Format (Authorization):**
```
GET https://accounts.google.com/o/oauth2/v2/auth?
  client_id={CLIENT_ID}&
  redirect_uri={REDIRECT_URI}&
  response_type=code&
  scope=openid%20profile%20email&
  state={RANDOM_STATE}
```

**Response Format (Token Exchange):**
```json
{
  "access_token": "ya29.a0AfH6SMB...",
  "expires_in": 3599,
  "token_type": "Bearer",
  "scope": "openid profile email",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE..."
}
```

**Data Flow:**
1. User → Google OAuth (authorization request)
2. Google → SkyCrop (authorization code)
3. SkyCrop → Google (token exchange)
4. Google → SkyCrop (access token, ID token)
5. SkyCrop → Google (user info request)
6. Google → SkyCrop (user profile)
7. SkyCrop → Database (create/update user)

---

**SW-004: Firebase Cloud Messaging (FCM)**

**Interface Type:** RESTful API (HTTPS)  
**Version:** FCM HTTP v1 API  
**Purpose:** Send push notifications to mobile app users

**Endpoints:**
- `POST /v1/projects/{project_id}/messages:send` - Send notification

**Request Format:**
```json
{
  "message": {
    "token": "{DEVICE_TOKEN}",
    "notification": {
      "title": "Water Stress Detected",
      "body": "Your field needs irrigation in 2 days"
    },
    "data": {
      "field_id": "123",
      "action": "view_field"
    },
    "android": {
      "priority": "high",
      "notification": { "icon": "ic_notification", "color": "#10B981" }
    },
    "apns": {
      "payload": { "aps": { "sound": "default", "badge": 1 } }
    }
  }
}
```

**Response Format:**
```json
{
  "name": "projects/skycrop/messages/0:1698537600123456%abc123"
}
```

**Authentication:** OAuth 2.0 (service account)  
**Rate Limit:** Unlimited (free tier)

**Data Flow:**
1. SkyCrop backend → FCM API (notification request)
2. FCM → User device (push notification)
3. User taps notification → App opens (deep link)

---

### 4.4 Communication Interfaces

**COM-001: HTTPS (REST API)**

**Protocol:** HTTPS (TLS 1.3)  
**Port:** 443  
**Purpose:** Secure communication between frontend and backend

**API Base URL:** `https://api.skycrop.com/v1`

**Request Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
Accept: application/json
User-Agent: SkyCrop-Mobile/1.0.0 (Android 12)
```

**Response Headers:**
```
Content-Type: application/json
Cache-Control: no-cache, no-store, must-revalidate
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1698537600
```

**Status Codes:**
- 200: Success
- 201: Created
- 400: Bad request (invalid input)
- 401: Unauthorized (invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 429: Rate limit exceeded
- 500: Internal server error
- 503: Service unavailable

**Error Response Format:**
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Field name is required",
    "details": { "field": "name", "constraint": "required" }
  }
}
```

---

**COM-002: WebSocket (Phase 2 - Real-Time Updates)**

**Protocol:** WebSocket (WSS)  
**Port:** 443  
**Purpose:** Real-time updates for health data, notifications

**Connection URL:** `wss://api.skycrop.com/v1/ws`

**Message Format:**
```json
{
  "type": "health_update",
  "field_id": "123",
  "data": {
    "ndvi": 0.75,
    "health_status": "Good",
    "timestamp": "2025-10-28T12:00:00Z"
  }
}
```

**Events:**
- `health_update` - New health data available
- `recommendation_update` - New recommendation generated
- `weather_alert` - Extreme weather detected
- `notification` - General notification

---

## 5. FUNCTIONAL REQUIREMENTS

### 5.1 User Management Subsystem

**Subsystem ID:** SS-001  
**Purpose:** Manage user accounts, authentication, and authorization

**Detailed Requirements:**

**FR-SS001-001: User Registration Validation**
- System shall validate email format using RFC 5322 regex
- System shall check email uniqueness (case-insensitive)
- System shall validate password strength:
  - Minimum 8 characters
  - Maximum 128 characters
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
  - At least 1 digit (0-9)
  - Optional: 1 special character (!@#$%^&*)
- System shall reject common passwords (check against list of 10,000 common passwords)
- System shall reject passwords containing user's name or email

**FR-SS001-002: Password Hashing**
- System shall hash passwords using bcrypt algorithm
- System shall use salt rounds: 10 (balance security and performance)
- System shall never store plaintext passwords
- System shall never log passwords (even hashed)

**FR-SS001-003: JWT Token Generation**
- System shall generate JWT tokens with:
  - Header: `{ "alg": "HS256", "typ": "JWT" }`
  - Payload: `{ "user_id": "123", "email": "user@example.com", "role": "farmer", "iat": 1698537600, "exp": 1701129600 }`
  - Signature: HMAC-SHA256(header + payload, secret_key)
- System shall use 256-bit secret key (stored in environment variable)
- System shall set token expiry to 30 days (2,592,000 seconds)
- System shall include user role in token (farmer, admin)

**FR-SS001-004: Session Management**
- System shall validate JWT token on every API request
- System shall check token expiry before processing request
- System shall refresh token if <7 days remaining (issue new token)
- System shall maintain token blacklist for logged-out users (Redis, 30-day TTL)
- System shall log user activity (last seen timestamp) on every request

**FR-SS001-005: Account Security**
- System shall lock account after 5 consecutive failed login attempts
- System shall unlock account after 30 minutes OR via email verification link
- System shall send security alert email on account lock
- System shall log all authentication events:
  - Successful login (timestamp, IP address, device)
  - Failed login (timestamp, IP address, reason)
  - Password reset (timestamp, IP address)
  - Account deletion (timestamp, reason)

**FR-SS001-006: Role-Based Access Control (RBAC)**
- System shall support user roles:
  - **Farmer:** Access own fields, view recommendations, manage profile
  - **Admin:** Access all users, manage content, view analytics, system monitoring
- System shall enforce role-based permissions on API endpoints
- System shall return 403 Forbidden if user lacks permission
- System shall log unauthorized access attempts

---

### 5.2 Field Management Subsystem

**Subsystem ID:** SS-002  
**Purpose:** Manage field boundaries, area calculation, and field metadata

**Detailed Requirements:**

**FR-SS002-001: Field Boundary Storage**
- System shall store field boundaries in GeoJSON format:
  ```json
  {
    "type": "Polygon",
    "coordinates": [
      [
        [81.01, 7.93],
        [81.02, 7.93],
        [81.02, 7.94],
        [81.01, 7.94],
        [81.01, 7.93]
      ]
    ]
  }
  ```
- System shall validate GeoJSON structure (valid polygon, closed ring)
- System shall store boundary in PostgreSQL with PostGIS extension (spatial indexing)
- System shall support spatial queries (find fields within bounding box, intersecting polygons)

**FR-SS002-002: Field Metadata**
- System shall store field metadata:
  - Field ID (UUID, primary key)
  - User ID (foreign key)
  - Field name (varchar 50, unique per user)
  - Boundary (geometry, polygon)
  - Area (decimal, hectares)
  - Center point (geometry, point)
  - Creation date (timestamp)
  - Last updated (timestamp)
  - Status (active, archived, deleted)
- System shall index fields by user_id and status (fast retrieval)

**FR-SS002-003: Field Validation**
- System shall validate field boundaries:
  - Minimum 3 vertices
  - Maximum 100 vertices (simplify if more)
  - No self-intersecting polygons
  - Area between 0.1 and 50 hectares
  - Within Sri Lanka bounding box (5.9°N-9.9°N, 79.5°E-82.0°E)
- System shall reject invalid fields with descriptive error message

**FR-SS002-004: Field Archival**
- System shall allow users to archive fields (soft delete)
- System shall retain archived fields for 1 year
- System shall exclude archived fields from dashboard (unless user requests)
- System shall allow users to restore archived fields

---

### 5.3 Satellite Image Processing Subsystem

**Subsystem ID:** SS-003  
**Purpose:** Retrieve, process, and analyze satellite imagery

**Detailed Requirements:**

**FR-SS003-001: Image Acquisition**
- System shall query Sentinel Hub API for images matching criteria:
  - Bounding box: Field boundary + 100m buffer
  - Date range: Last 30 days (default) or user-specified
  - Cloud cover: <20%
  - Satellite: Sentinel-2 L2A (atmospherically corrected)
- System shall select most recent cloud-free image
- System shall download bands: B02, B03, B04, B08, B11 (Blue, Green, Red, NIR, SWIR)
- System shall store image metadata (acquisition date, cloud cover, resolution)

**FR-SS003-002: Cloud Masking**
- System shall detect clouds using Scene Classification Layer (SCL):
  - SCL values 8, 9, 10 = clouds, cloud shadows, cirrus
- System shall calculate cloud cover percentage
- System shall reject images with >20% cloud cover
- System shall mask cloudy pixels (set to NaN) in vegetation index calculations

**FR-SS003-003: Image Preprocessing**
- System shall normalize pixel values to 0-1 range (divide by 10,000 for Sentinel-2)
- System shall apply atmospheric correction (if using L1C data)
- System shall resample to consistent resolution (10m)
- System shall crop to field boundary (reduce processing time)

**FR-SS003-004: Vegetation Index Calculation**
- System shall calculate NDVI: `(NIR - Red) / (NIR + Red + 1e-10)`
- System shall calculate NDWI: `(NIR - SWIR) / (NIR + SWIR + 1e-10)`
- System shall calculate TDVI: `sqrt(NDVI + 0.5)`
- System shall clip values to valid range (NDVI/NDWI: -1 to 1, TDVI: 0 to 1.22)
- System shall calculate statistics (mean, min, max, std dev, percentiles)

**FR-SS003-005: Image Caching**
- System shall cache satellite images for 30 days:
  - Storage: AWS S3 or local file system
  - Format: GeoTIFF (compressed, LZW)
  - Naming: `{field_id}_{date}_{band}.tif`
- System shall check cache before requesting new image from API
- System shall delete cached images older than 30 days (automated cleanup job)

**FR-SS003-006: Image Quality Control**
- System shall validate image quality:
  - No missing data (NaN pixels <5%)
  - Correct spatial extent (covers field boundary)
  - Correct bands (all 5 bands present)
  - Correct resolution (10m)
- System shall reject low-quality images
- System shall log image quality metrics

---

### 5.4 AI/ML Subsystem

**Subsystem ID:** SS-004  
**Purpose:** AI-powered boundary detection and yield prediction

**Detailed Requirements:**

**FR-SS004-001: U-Net Boundary Detection Model**
- System shall use U-Net architecture:
  - Encoder: 4 downsampling blocks (conv + max pool)
  - Decoder: 4 upsampling blocks (conv + upsample)
  - Skip connections between encoder and decoder
  - Output: Binary mask (field vs. non-field)
- System shall use pre-trained ImageNet weights for encoder (transfer learning)
- System shall fine-tune on DeepGlobe agriculture dataset (2,000 labeled images)
- System shall achieve ≥85% IoU on validation set (100 fields)

**FR-SS004-002: Model Training**
- System shall train model with:
  - Optimizer: Adam (learning rate 0.001)
  - Loss function: Binary cross-entropy + Dice loss
  - Batch size: 16
  - Epochs: 50 (early stopping if validation loss plateaus)
  - Data augmentation: Rotation (±15°), flip (horizontal/vertical), brightness (±20%)
- System shall validate model on held-out test set (20% of data)
- System shall save best model checkpoint (highest validation IoU)

**FR-SS004-003: Model Inference**
- System shall preprocess input image:
  - Resize to 256×256 pixels
  - Normalize pixel values (0-1 range)
  - Convert to RGB + NIR (4 channels)
- System shall run model inference (forward pass)
- System shall post-process output:
  - Apply threshold (0.5) to binary mask
  - Morphological closing (fill gaps)
  - Morphological opening (remove noise)
  - Extract largest contour (assume it's the field)
  - Simplify polygon (Douglas-Peucker, tolerance 10m)
- System shall convert pixel coordinates to GPS coordinates

**FR-SS004-004: Random Forest Yield Prediction Model**
- System shall use Random Forest regressor:
  - Number of trees: 100
  - Max depth: 10
  - Min samples split: 5
  - Features: 25 (NDVI stats, weather, area, growth stage)
- System shall train on historical yield data (minimum 500 samples)
- System shall achieve ≥85% accuracy (MAPE <15%)
- System shall provide prediction confidence interval (95%)

**FR-SS004-005: Model Versioning**
- System shall version models (semantic versioning: v1.0.0, v1.1.0, etc.)
- System shall store model metadata:
  - Model name, version
  - Training date
  - Training dataset size
  - Validation metrics (IoU, MAPE)
  - Hyperparameters
- System shall support model rollback (revert to previous version if new model performs worse)

**FR-SS004-006: Model Monitoring**
- System shall track model performance in production:
  - Boundary detection: User acceptance rate (% of boundaries confirmed without adjustment)
  - Yield prediction: Actual vs. predicted (MAPE)
- System shall alert if model performance degrades (IoU <80%, MAPE >20%)
- System shall retrain model monthly with new data

---

### 5.5 Recommendation Engine Subsystem

**Subsystem ID:** SS-005  
**Purpose:** Generate actionable water and fertilizer recommendations

**Detailed Requirements:**

**FR-SS005-001: Water Recommendation Rules**
- System shall apply rule-based logic:
  ```
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
  ```
- System shall identify zones needing irrigation (NDWI <0.2)
- System shall estimate water requirement (liters per hectare)
- System shall estimate water savings vs. schedule-based irrigation

**FR-SS005-002: Fertilizer Recommendation Rules**
- System shall apply rule-based logic:
  ```
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
  ```
- System shall identify zones needing fertilizer (NDVI <0.7)
- System shall recommend fertilizer type (urea, NPK, organic)
- System shall recommend application timing (based on weather)
- System shall estimate cost savings vs. uniform application

**FR-SS005-003: Alert Generation Rules**
- System shall generate alerts for:
  - **Severe water stress:** NDWI <0.05
  - **Rapid NDVI decline:** NDVI drop >15% in 7 days (possible pest outbreak)
  - **Extreme weather:** Rain >50mm or Temperature >35°C
  - **Harvest readiness:** NDVI declining + 90+ days since planting
- System shall prioritize alerts (Critical, High, Medium)
- System shall send push notifications for Critical and High alerts
- System shall display alerts on dashboard

**FR-SS005-004: Recommendation Personalization**
- System shall consider field history:
  - Previous recommendations and user actions
  - Irrigation frequency
  - Fertilizer application history
  - Yield performance
- System shall adapt recommendations based on user behavior:
  - If user consistently ignores recommendations: Reduce notification frequency
  - If user follows recommendations: Provide more detailed advice
- System shall learn from user feedback (thumbs up/down on recommendations)

---

### 5.6 Weather Subsystem

**Subsystem ID:** SS-006  
**Purpose:** Retrieve, process, and display weather forecasts

**Detailed Requirements:**

**FR-SS006-001: Weather Data Retrieval**
- System shall query OpenWeatherMap API every 6 hours
- System shall retrieve:
  - 7-day daily forecast
  - Current weather conditions
  - Historical weather (last 30 days)
- System shall cache weather data (Redis, 6-hour TTL)
- System shall use field GPS coordinates for location-specific forecasts

**FR-SS006-002: Weather Data Processing**
- System shall process weather data:
  - Convert temperature to Celsius (if needed)
  - Convert rainfall to millimeters
  - Calculate daily rainfall total
  - Detect extreme weather conditions
- System shall store processed data in database

**FR-SS006-003: Weather Alert Detection**
- System shall detect extreme weather:
  - Heavy rain: >50mm in 24 hours
  - Extreme heat: Temperature >35°C
  - Strong winds: Wind speed >40 km/h
  - Drought: No rain for 14+ consecutive days
- System shall generate alerts with severity (Critical, High, Medium)
- System shall send push notifications for Critical alerts
- System shall integrate alerts with crop recommendations

---

### 5.7 Analytics Subsystem

**Subsystem ID:** SS-007  
**Purpose:** Track user behavior, system performance, and business metrics

**Detailed Requirements:**

**FR-SS007-001: User Analytics**
- System shall track user events:
  - Signup, login, logout
  - Field creation, field view
  - Feature usage (health view, recommendations, yield prediction)
  - Session duration, session frequency
  - Referrals (invite links)
- System shall store events in MongoDB (time-series collection)
- System shall aggregate events for analytics dashboard

**FR-SS007-002: System Analytics**
- System shall track system metrics:
  - API requests (count, response time, error rate)
  - Database queries (count, execution time)
  - Satellite API usage (requests, quota remaining)
  - Cache hit rate
  - Error logs
- System shall store metrics in time-series database (InfluxDB or MongoDB)
- System shall display metrics on admin dashboard

**FR-SS007-003: Business Analytics**
- System shall calculate business metrics:
  - User acquisition (signups per day/week/month)
  - User retention (% active after 7/30/90 days)
  - Feature adoption (% users using each feature)
  - Conversion rate (free to premium, Phase 2)
  - Churn rate (% users who stop using app)
- System shall display metrics on admin dashboard
- System shall export metrics to CSV for external analysis

---

## 6. NON-FUNCTIONAL REQUIREMENTS

### 6.1 Performance Requirements

**NFR-PERF-001: Response Time**
- Web app initial load: <5 seconds (3G connection, Lighthouse score >70)
- API endpoint response: <2 seconds (95th percentile)
- Map interactions (zoom, pan): 60 FPS (smooth)
- AI boundary detection: <60 seconds
- Vegetation indices calculation: <30 seconds
- Database queries: <500 milliseconds (95th percentile)

**NFR-PERF-002: Throughput**
- System shall support 1,000 concurrent users
- System shall handle 10,000 API requests per day
- System shall process 100 boundary detection requests per day
- System shall handle 50 simultaneous satellite image requests

**NFR-PERF-003: Scalability**
- System shall scale horizontally (add more backend instances)
- System shall use load balancer (distribute traffic across instances)
- System shall use database connection pooling (max 100 connections per instance)
- System shall support 10x user growth without major architecture changes

**NFR-PERF-004: Resource Efficiency**
- Backend instance: <2 GB RAM, <50% CPU (average)
- Database: <100 GB storage (Year 1)
- Satellite image cache: <50 GB (30-day retention)
- Mobile app: <50 MB storage, <100 MB RAM

---

### 6.2 Security Requirements

**NFR-SEC-001: Authentication Security**
- System shall use OAuth 2.0 for Google authentication
- System shall use JWT (HS256) for session management
- System shall hash passwords with bcrypt (10 rounds)
- System shall enforce password strength (min 8 chars, 1 uppercase, 1 number)
- System shall lock accounts after 5 failed login attempts
- System shall expire sessions after 30 days of inactivity

**NFR-SEC-002: Data Encryption**
- System shall encrypt data in transit (TLS 1.3, HTTPS only)
- System shall encrypt sensitive data at rest (AES-256):
  - User passwords (bcrypt hashed)
  - API keys and secrets (environment variables, encrypted)
  - Payment information (Phase 2, PCI-DSS compliant)
- System shall use secure random number generator for tokens (crypto.randomBytes)

**NFR-SEC-003: Input Validation**
- System shall validate all user inputs (client-side and server-side)
- System shall sanitize inputs to prevent:
  - SQL injection (use parameterized queries)
  - XSS (Cross-Site Scripting) (escape HTML, use Content Security Policy)
  - CSRF (Cross-Site Request Forgery) (use CSRF tokens)
  - Command injection (validate file paths, shell commands)
- System shall use whitelist validation (allow known-good inputs, reject everything else)

**NFR-SEC-004: API Security**
- System shall implement rate limiting:
  - 1,000 requests per hour per user (prevent abuse)
  - 100 requests per minute per IP (prevent DDoS)
- System shall use API keys for external integrations (Sentinel Hub, Weather)
- System shall rotate API keys quarterly
- System shall log all API requests (timestamp, user, endpoint, IP address)

**NFR-SEC-005: Security Auditing**
- System shall undergo security audit before launch (OWASP Top 10 checklist)
- System shall implement security headers:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Content-Security-Policy: default-src 'self'`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
- System shall log security events (failed logins, unauthorized access, suspicious activity)
- System shall send security alerts to admins

---

### 6.3 Reliability Requirements

**NFR-REL-001: Availability**
- System shall maintain 99% uptime (measured monthly)
- System shall have <8 hours downtime per month (planned + unplanned)
- System shall schedule planned maintenance during low-usage hours (2-4 AM Sri Lanka time)
- System shall notify users 24 hours before planned maintenance

**NFR-REL-002: Fault Tolerance**
- System shall gracefully handle external API failures:
  - Sentinel Hub: Use cached images, display last available data
  - Weather API: Use cached forecast, display disclaimer
  - Google OAuth: Fall back to email/password login
- System shall retry failed API requests (exponential backoff, max 3 attempts)
- System shall log all errors with stack traces (Sentry or similar)

**NFR-REL-003: Data Integrity**
- System shall use database transactions (ACID compliance)
- System shall validate data before writing to database
- System shall use foreign key constraints (referential integrity)
- System shall detect and prevent duplicate records

**NFR-REL-004: Backup & Recovery**
- System shall perform daily automated backups:
  - Database: Full backup (PostgreSQL pg_dump, MongoDB mongodump)
  - User-uploaded files: Incremental backup (AWS S3 versioning)
- System shall retain backups for 30 days
- System shall test backup restoration monthly
- System shall support point-in-time recovery (restore to any day in last 30 days)

---

### 6.4 Usability Requirements

**NFR-USE-001: Ease of Use**
- New users shall complete onboarding (signup + first field) within 15 minutes
- Users shall achieve 80%+ task success rate on core workflows (UAT)
- Users shall rate ease of use ≥4.0/5.0 (usability survey)
- System shall require ≤3 taps to access key features

**NFR-USE-002: Learnability**
- Users shall understand core features within 30 minutes of first use
- System shall provide interactive tutorial for first-time users (5 steps, 3 minutes)
- System shall provide contextual help (tooltips, hints, "?" icons)
- System shall provide video tutorials (2-3 minutes each, hosted on YouTube)

**NFR-USE-003: Error Handling**
- System shall display user-friendly error messages (avoid technical jargon)
- System shall provide actionable guidance (what to do next)
- System shall log errors for debugging (but don't expose to users)
- System shall recover gracefully from errors (don't crash app)

**NFR-USE-004: Feedback**
- System shall provide immediate feedback for user actions:
  - Button press: Visual feedback (color change, ripple effect)
  - Form submission: Loading spinner, success/error message
  - Long operations: Progress indicator (percentage, estimated time)
- System shall confirm destructive actions (delete field, delete account)

---

### 6.5 Maintainability Requirements

**NFR-MAIN-001: Code Quality**
- Code shall maintain ≥80% test coverage (unit + integration tests)
- Code shall pass linting checks (ESLint for JavaScript, Pylint for Python)
- Code shall follow style guides:
  - JavaScript: Airbnb JavaScript Style Guide
  - Python: PEP 8
  - React: React Best Practices
- Code shall have cyclomatic complexity <10 per function

**NFR-MAIN-002: Documentation**
- System shall have comprehensive API documentation (Swagger/OpenAPI 3.0)
- System shall have architecture documentation (diagrams, design decisions)
- System shall have deployment guide (step-by-step instructions)
- System shall have user documentation (guides, FAQs, videos)
- Code shall have inline comments for complex logic (JSDoc for JavaScript, docstrings for Python)

**NFR-MAIN-003: Modularity**
- System shall use modular architecture (separation of concerns)
- System shall have clear API contracts between modules
- System shall support independent deployment of modules (microservices or monolith with clear boundaries)
- System shall use dependency injection (testability, flexibility)

**NFR-MAIN-004: Monitoring & Logging**
- System shall log all API requests (timestamp, endpoint, user, response time, status code)
- System shall log all errors with stack traces
- System shall use structured logging (JSON format)
- System shall implement application performance monitoring (APM):
  - New Relic, Datadog, or open-source alternative (Prometheus + Grafana)
- System shall send alerts for critical errors (email, Slack)

---

### 6.6 Portability Requirements

**NFR-PORT-001: Platform Independence**
- Backend shall run on Linux, macOS, Windows (Node.js cross-platform)
- Backend shall use environment variables for configuration (no hardcoded values)
- Backend shall use Docker containers (consistent deployment across environments)

**NFR-PORT-002: Database Portability**
- System shall use standard SQL (PostgreSQL dialect)
- System shall use ORM (Sequelize or TypeORM) for database abstraction
- System shall support database migration (version-controlled schema changes)

**NFR-PORT-003: Cloud Portability**
- System shall avoid vendor lock-in (use standard APIs, not proprietary services)
- System shall support deployment on multiple cloud providers:
  - AWS (primary)
  - Railway (development/staging)
  - Heroku (alternative)
- System shall use Infrastructure as Code (Terraform or CloudFormation)

---

### 6.7 Compliance Requirements

**NFR-COMP-001: Data Protection**
- System shall comply with GDPR (General Data Protection Regulation)
- System shall comply with Sri Lanka Data Protection Act (expected 2026)
- System shall obtain user consent for data collection (explicit opt-in)
- System shall allow users to export their data (JSON format)
- System shall allow users to delete their accounts and data (right to erasure)
- System shall anonymize personal data after account deletion

**NFR-COMP-002: Accessibility**
- Web app shall meet WCAG 2.1 Level AA standards (Phase 2)
- Mobile app shall support screen readers (VoiceOver, TalkBack) (Phase 2)
- System shall support text scaling (up to 200%)
- System shall use high contrast colors (4.5:1 ratio for normal text, 3:1 for large text)

**NFR-COMP-003: Satellite Data Usage**
- System shall comply with Copernicus Sentinel data terms of use
- System shall include attribution: "Contains modified Copernicus Sentinel data [year]"
- System shall comply with USGS Landsat data terms (public domain)

---

## 7. DATA REQUIREMENTS

### 7.1 Logical Data Model

**Entity-Relationship Diagram (Conceptual):**

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    User     │1      * │    Field    │1      * │   Health    │
│             │─────────│             │─────────│   Record    │
│ - user_id   │         │ - field_id  │         │ - record_id │
│ - email     │         │ - user_id   │         │ - field_id  │
│ - name      │         │ - name      │         │ - date      │
│ - password  │         │ - boundary  │         │ - ndvi      │
│ - role      │         │ - area      │         │ - ndwi      │
└─────────────┘         │ - center    │         │ - tdvi      │
                        └─────────────┘         │ - status    │
                              │                 └─────────────┘
                              │1
                              │
                              │*
                        ┌─────────────┐
                        │Recommendation│
                        │             │
                        │ - rec_id    │
                        │ - field_id  │
                        │ - type      │
                        │ - text      │
                        │ - status    │
                        └─────────────┘
```

### 7.2 Data Dictionary

**Table: users**

| **Column** | **Type** | **Constraints** | **Description** |
|------------|----------|-----------------|-----------------|
| user_id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NULL | Bcrypt hashed password (NULL if OAuth) |
| name | VARCHAR(100) | NOT NULL | User full name |
| phone | VARCHAR(20) | NULL | Phone number (optional) |
| role | ENUM('farmer', 'admin') | NOT NULL, DEFAULT 'farmer' | User role |
| auth_provider | ENUM('google', 'email') | NOT NULL | Authentication method |
| email_verified | BOOLEAN | NOT NULL, DEFAULT FALSE | Email verification status |
| profile_photo_url | VARCHAR(500) | NULL | Profile photo URL |
| location | VARCHAR(100) | NULL | User location (district, village) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| last_login | TIMESTAMP | NULL | Last login timestamp |
| status | ENUM('active', 'suspended', 'deleted') | NOT NULL, DEFAULT 'active' | Account status |

**Indexes:**
- PRIMARY KEY (user_id)
- UNIQUE INDEX (email)
- INDEX (status, created_at)
- INDEX (last_login)

---

**Table: fields**

| **Column** | **Type** | **Constraints** | **Description** |
|------------|----------|-----------------|-----------------|
| field_id | UUID | PRIMARY KEY | Unique field identifier |
| user_id | UUID | FOREIGN KEY (users.user_id), NOT NULL | Field owner |
| name | VARCHAR(50) | NOT NULL | Field name |
| boundary | GEOMETRY(Polygon, 4326) | NOT NULL | Field boundary (GeoJSON polygon) |
| area | DECIMAL(10, 2) | NOT NULL | Field area in hectares |
| center | GEOMETRY(Point, 4326) | NOT NULL | Field center point (GPS) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Field creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| status | ENUM('active', 'archived', 'deleted') | NOT NULL, DEFAULT 'active' | Field status |

**Indexes:**
- PRIMARY KEY (field_id)
- INDEX (user_id, status)
- SPATIAL INDEX (boundary) - PostGIS
- SPATIAL INDEX (center) - PostGIS

**Constraints:**
- UNIQUE (user_id, name) - No duplicate field names per user
- CHECK (area >= 0.1 AND area <= 50) - Valid area range
- CHECK (ST_IsValid(boundary)) - Valid polygon geometry

---

**Table: health_records**

| **Column** | **Type** | **Constraints** | **Description** |
|------------|----------|-----------------|-----------------|
| record_id | UUID | PRIMARY KEY | Unique record identifier |
| field_id | UUID | FOREIGN KEY (fields.field_id), NOT NULL | Associated field |
| measurement_date | DATE | NOT NULL | Satellite image acquisition date |
| ndvi_mean | DECIMAL(5, 4) | NOT NULL | Mean NDVI (-1 to 1) |
| ndvi_min | DECIMAL(5, 4) | NOT NULL | Minimum NDVI |
| ndvi_max | DECIMAL(5, 4) | NOT NULL | Maximum NDVI |
| ndvi_std | DECIMAL(5, 4) | NOT NULL | NDVI standard deviation |
| ndwi_mean | DECIMAL(5, 4) | NOT NULL | Mean NDWI (-1 to 1) |
| ndwi_min | DECIMAL(5, 4) | NOT NULL | Minimum NDWI |
| ndwi_max | DECIMAL(5, 4) | NOT NULL | Maximum NDWI |
| ndwi_std | DECIMAL(5, 4) | NOT NULL | NDWI standard deviation |
| tdvi_mean | DECIMAL(5, 4) | NOT NULL | Mean TDVI (0 to 1.22) |
| health_status | ENUM('excellent', 'good', 'fair', 'poor') | NOT NULL | Health classification |
| health_score | INTEGER | NOT NULL | Health score (0-100) |
| trend | ENUM('improving', 'stable', 'declining') | NOT NULL | Health trend |
| satellite_image_id | VARCHAR(100) | NOT NULL | Sentinel Hub image ID |
| cloud_cover | DECIMAL(5, 2) | NOT NULL | Cloud cover percentage |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- PRIMARY KEY (record_id)
- INDEX (field_id, measurement_date DESC) - Fast retrieval of latest health data
- UNIQUE (field_id, measurement_date) - One record per field per date

**Constraints:**
- CHECK (ndvi_mean >= -1 AND ndvi_mean <= 1)
- CHECK (ndwi_mean >= -1 AND ndwi_mean <= 1)
- CHECK (health_score >= 0 AND health_score <= 100)
- CHECK (cloud_cover >= 0 AND cloud_cover <= 100)

---

**Table: recommendations**

| **Column** | **Type** | **Constraints** | **Description** |
|------------|----------|-----------------|-----------------|
| recommendation_id | UUID | PRIMARY KEY | Unique recommendation identifier |
| field_id | UUID | FOREIGN KEY (fields.field_id), NOT NULL | Associated field |
| type | ENUM('water', 'fertilizer', 'alert', 'general') | NOT NULL | Recommendation type |
| severity | ENUM('critical', 'high', 'medium', 'low') | NOT NULL | Severity level |
| title | VARCHAR(100) | NOT NULL | Recommendation title |
| description | TEXT | NOT NULL | Detailed recommendation text |
| action | TEXT | NULL | Specific action to take |
| zones | JSON | NULL | Affected zones (GeoJSON) |
| estimated_savings | DECIMAL(10, 2) | NULL | Estimated cost savings (Rs.) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Recommendation creation timestamp |
| expires_at | TIMESTAMP | NULL | Recommendation expiry (if time-sensitive) |
| status | ENUM('pending', 'done', 'ignored', 'expired') | NOT NULL, DEFAULT 'pending' | Recommendation status |
| user_action_at | TIMESTAMP | NULL | When user marked as done/ignored |

**Indexes:**
- PRIMARY KEY (recommendation_id)
- INDEX (field_id, created_at DESC)
- INDEX (status, expires_at)

---

**Table: yield_predictions**

| **Column** | **Type** | **Constraints** | **Description** |
|------------|----------|-----------------|-----------------|
| prediction_id | UUID | PRIMARY KEY | Unique prediction identifier |
| field_id | UUID | FOREIGN KEY (fields.field_id), NOT NULL | Associated field |
| prediction_date | DATE | NOT NULL | Date prediction was made |
| predicted_yield_per_ha | DECIMAL(10, 2) | NOT NULL | Predicted yield (kg/hectare) |
| predicted_total_yield | DECIMAL(10, 2) | NOT NULL | Total predicted yield (kg) |
| confidence_lower | DECIMAL(10, 2) | NOT NULL | Lower bound (95% CI) |
| confidence_upper | DECIMAL(10, 2) | NOT NULL | Upper bound (95% CI) |
| expected_revenue | DECIMAL(12, 2) | NOT NULL | Expected revenue (Rs.) |
| harvest_date_estimate | DATE | NULL | Estimated harvest date |
| model_version | VARCHAR(20) | NOT NULL | ML model version used |
| features_used | JSON | NOT NULL | Features used for prediction |
| actual_yield | DECIMAL(10, 2) | NULL | Actual yield (user-reported) |
| accuracy_mape | DECIMAL(5, 2) | NULL | Prediction accuracy (MAPE %) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Prediction creation timestamp |

**Indexes:**
- PRIMARY KEY (prediction_id)
- INDEX (field_id, prediction_date DESC)
- INDEX (harvest_date_estimate)

---

**Table: disaster_assessments**

| **Column** | **Type** | **Constraints** | **Description** |
|------------|----------|-----------------|-----------------|
| assessment_id | UUID | PRIMARY KEY | Unique assessment identifier |
| field_id | UUID | FOREIGN KEY (fields.field_id), NOT NULL | Associated field |
| disaster_type | ENUM('flood', 'drought', 'storm', 'other') | NOT NULL | Disaster type |
| before_date | DATE | NOT NULL | Before disaster date |
| after_date | DATE | NOT NULL | After disaster date |
| damaged_area_severe | DECIMAL(10, 2) | NOT NULL | Severe damage area (hectares) |
| damaged_area_moderate | DECIMAL(10, 2) | NOT NULL | Moderate damage area (hectares) |
| damaged_area_minor | DECIMAL(10, 2) | NOT NULL | Minor damage area (hectares) |
| total_damaged_area | DECIMAL(10, 2) | NOT NULL | Total damaged area (hectares) |
| damage_percentage | DECIMAL(5, 2) | NOT NULL | Damage percentage (0-100) |
| yield_loss_kg | DECIMAL(10, 2) | NOT NULL | Estimated yield loss (kg) |
| financial_loss | DECIMAL(12, 2) | NOT NULL | Estimated financial loss (Rs.) |
| report_pdf_url | VARCHAR(500) | NULL | PDF report URL (S3) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Assessment creation timestamp |

**Indexes:**
- PRIMARY KEY (assessment_id)
- INDEX (field_id, created_at DESC)
- INDEX (disaster_type, after_date)

---

**Table: weather_forecasts**

| **Column** | **Type** | **Constraints** | **Description** |
|------------|----------|-----------------|-----------------|
| forecast_id | UUID | PRIMARY KEY | Unique forecast identifier |
| field_id | UUID | FOREIGN KEY (fields.field_id), NOT NULL | Associated field |
| forecast_date | DATE | NOT NULL | Date of forecast |
| temperature_min | DECIMAL(5, 2) | NOT NULL | Minimum temperature (°C) |
| temperature_max | DECIMAL(5, 2) | NOT NULL | Maximum temperature (°C) |
| weather_condition | VARCHAR(50) | NOT NULL | Weather condition (clear, rain, etc.) |
| rainfall_probability | INTEGER | NOT NULL | Rainfall probability (0-100%) |
| rainfall_amount | DECIMAL(6, 2) | NOT NULL | Rainfall amount (mm) |
| humidity | INTEGER | NOT NULL | Humidity (0-100%) |
| wind_speed | DECIMAL(5, 2) | NOT NULL | Wind speed (km/h) |
| is_extreme | BOOLEAN | NOT NULL, DEFAULT FALSE | Extreme weather flag |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Forecast retrieval timestamp |

**Indexes:**
- PRIMARY KEY (forecast_id)
- INDEX (field_id, forecast_date)
- UNIQUE (field_id, forecast_date) - One forecast per field per date

---

**Table: news_articles (MongoDB)**

**Collection:** `news_articles`  
**Database:** MongoDB (flexible schema for content)

**Document Structure:**
```json
{
  "_id": "ObjectId",
  "title": "New Fertilizer Subsidy Announced",
  "slug": "new-fertilizer-subsidy-announced",
  "category": "government_schemes",
  "summary": "Government announces 30% subsidy on organic fertilizers...",
  "content": "<p>Full article content with HTML formatting...</p>",
  "featured_image": "https://cdn.skycrop.com/news/fertilizer-subsidy.jpg",
  "author": {
    "name": "Admin Name",
    "user_id": "UUID"
  },
  "tags": ["fertilizer", "subsidy", "government"],
  "status": "published",
  "published_at": "2025-10-28T10:00:00Z",
  "created_at": "2025-10-27T15:30:00Z",
  "updated_at": "2025-10-28T09:45:00Z",
  "views": 245,
  "shares": 18
}
```

**Indexes:**
- `_id` (default)
- `slug` (unique)
- `category, published_at` (compound, for filtering)
- `status, published_at` (compound, for admin queries)

---

**Table: analytics_events (MongoDB)**

**Collection:** `analytics_events`  
**Database:** MongoDB (time-series data)

**Document Structure:**
```json
{
  "_id": "ObjectId",
  "event_type": "field_view",
  "user_id": "UUID",
  "field_id": "UUID",
  "timestamp": "2025-10-28T12:34:56Z",
  "session_id": "session_abc123",
  "device": {
    "type": "mobile",
    "os": "Android",
    "os_version": "12",
    "app_version": "1.0.0"
  },
  "metadata": {
    "screen": "field_details",
    "duration": 45,
    "actions": ["view_health", "view_recommendations"]
  }
}
```

**Indexes:**
- `_id` (default)
- `user_id, timestamp` (compound, for user analytics)
- `event_type, timestamp` (compound, for event analytics)
- `timestamp` (TTL index, expire after 90 days)

---

### 7.3 Data Flows

**Data Flow 1: Field Boundary Detection**

```
User (Mobile App)
  │
  │ 1. Tap field location (lat, lon)
  ▼
Frontend (React Native)
  │
  │ 2. POST /api/fields/detect-boundary
  │    { "latitude": 7.94, "longitude": 81.01 }
  ▼
Backend API (Node.js)
  │
  │ 3. Request satellite image
  ▼
Sentinel Hub API
  │
  │ 4. Return GeoTIFF image (512×512, 5 bands)
  ▼
Backend API
  │
  │ 5. Preprocess image (normalize, resize)
  ▼
AI/ML Service (Python)
  │
  │ 6. Run U-Net model inference
  ▼
Backend API
  │
  │ 7. Post-process (extract contour, simplify polygon)
  │ 8. Calculate area
  │ 9. Store in database
  ▼
Database (PostgreSQL)
  │
  │ 10. Return boundary GeoJSON
  ▼
Backend API
  │
  │ 11. Response: { "boundary": {...}, "area": 2.1 }
  ▼
Frontend (React Native)
  │
  │ 12. Display boundary on map
  ▼
User (Mobile App)
```

---

**Data Flow 2: Health Monitoring Update**

```
Scheduled Job (Cron, Daily 2 AM)
  │
  │ 1. Query fields needing update (last update >5 days ago)
  ▼
Backend API
  │
  │ 2. For each field:
  │    - Request satellite image (Sentinel Hub)
  │    - Calculate NDVI, NDWI, TDVI
  │    - Classify health status
  │    - Generate recommendations
  │    - Store in database
  ▼
Database (PostgreSQL)
  │
  │ 3. Health records inserted
  ▼
Backend API
  │
  │ 4. Check for alerts (NDVI drop >15%, NDWI <0.05)
  ▼
Firebase Cloud Messaging
  │
  │ 5. Send push notifications to users
  ▼
User (Mobile App)
  │
  │ 6. Receive notification, open app
  ▼
Frontend (React Native)
  │
  │ 7. GET /api/fields/{field_id}/health
  ▼
Backend API
  │
  │ 8. Return latest health data
  ▼
Frontend
  │
  │ 9. Display color-coded health map
  ▼
User (Mobile App)
```

---

### 7.4 Data Retention Policy

**User Data:**
- Active users: Retained indefinitely
- Deleted users: Personal data anonymized immediately, account soft-deleted for 30 days, then hard-deleted

**Field Data:**
- Active fields: Retained indefinitely
- Archived fields: Retained for 1 year, then deleted
- Deleted fields: Soft-deleted for 30 days, then hard-deleted

**Health Records:**
- Recent data (last 6 months): Retained in primary database (PostgreSQL)
- Historical data (6+ months old): Archived to cold storage (AWS S3 Glacier), retained for 3 years
- Aggregated data: Retained indefinitely (anonymized, for research)

**Satellite Images:**
- Cached images: Retained for 30 days, then deleted
- Referenced images: Metadata retained, images deleted after 30 days

**Analytics Events:**
- Raw events: Retained for 90 days (MongoDB TTL index)
- Aggregated analytics: Retained for 3 years

**Logs:**
- Application logs: Retained for 30 days
- Error logs: Retained for 90 days
- Security logs: Retained for 1 year

---

## 8. SYSTEM MODELS

### 8.1 Use Case Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SkyCrop System                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 User Management                       │  │
│  │  • Sign Up (Google / Email)                          │  │
│  │  • Log In                                            │  │
│  │  • Reset Password                                    │  │
│  │  • Manage Profile                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ uses                              │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Field Management                         │  │
│  │  • Add Field (Map Selection)                         │  │
│  │  • AI Detect Boundary                                │  │
│  │  • Adjust Boundary Manually                          │  │
│  │  • View Field Details                                │  │
│  │  • Delete Field                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ triggers                          │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Crop Health Monitoring                     │  │
│  │  • View Health Map (NDVI/NDWI/TDVI)                  │  │
│  │  • View Health Status                                │  │
│  │  • View Historical Trends                            │  │
│  │  • Receive Health Alerts                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ generates                         │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Precision Recommendations                    │  │
│  │  • View Water Recommendations                        │  │
│  │  • View Fertilizer Recommendations                   │  │
│  │  • Mark Recommendation as Done                       │  │
│  │  • View Recommendation History                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ uses                              │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Yield Prediction                         │  │
│  │  • View Yield Forecast                               │  │
│  │  • View Revenue Estimate                             │  │
│  │  • Enter Actual Yield                                │  │
│  │  • Compare Predicted vs Actual                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ parallel                          │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Weather Forecasting                        │  │
│  │  • View 7-Day Forecast                               │  │
│  │  • View Current Weather                              │  │
│  │  • Receive Weather Alerts                            │  │
│  │  • View Historical Weather                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ optional                          │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Disaster Assessment (P1)                    │  │
│  │  • Select Disaster Event                             │  │
│  │  • Analyze Damage                                    │  │
│  │  • View Financial Loss                               │  │
│  │  • Generate Insurance Report                         │  │
│  │  • Share Report                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Actors:
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Farmer  │         │Extension │         │  Admin   │
│ (Primary)│         │ Officer  │         │(Tertiary)│
└──────────┘         └──────────┘         └──────────┘
```

---

### 8.2 Sequence Diagram: Field Boundary Detection

```
User          Frontend        Backend API      Sentinel Hub     AI Service      Database
 │                │               │                 │               │              │
 │ 1. Tap map     │               │                 │               │              │
 │───────────────>│               │                 │               │              │
 │                │ 2. POST       │                 │               │              │
 │                │  /detect-     │                 │               │              │
 │                │  boundary     │                 │               │              │
 │                │──────────────>│                 │               │              │
 │                │               │ 3. Request      │               │              │
 │                │               │  satellite      │               │              │
 │                │               │  image          │               │              │
 │                │               │────────────────>│               │              │
 │                │               │                 │               │              │
 │                │               │ 4. Return       │               │              │
 │                │               │  GeoTIFF        │               │              │
 │                │               │<────────────────│               │              │
 │                │               │                 │               │              │
 │                │               │ 5. Preprocess   │               │              │
 │                │               │  image          │               │              │
 │                │               │─────────────────────────────────>│              │
 │                │               │                 │               │              │
 │                │               │                 │ 6. Run U-Net  │              │
 │                │               │                 │  inference    │              │
 │                │               │                 │               │              │
 │                │               │ 7. Return       │               │              │
 │                │               │  boundary mask  │               │              │
 │                │               │<─────────────────────────────────│              │
 │                │               │                 │               │              │
 │                │               │ 8. Extract      │               │              │
 │                │               │  polygon,       │               │              │
 │                │               │  calculate area │               │              │
 │                │               │                 │               │              │
 │                │               │ 9. Store field  │               │              │
 │                │               │────────────────────────────────────────────────>│
 │                │               │                 │               │              │
 │                │               │ 10. Confirm     │               │              │
 │                │               │<────────────────────────────────────────────────│
 │                │               │                 │               │              │
 │                │ 11. Response  │                 │               │              │
 │                │  { boundary,  │                 │               │              │
 │                │    area }     │                 │               │              │
 │                │<──────────────│                 │               │              │
 │                │               │                 │               │              │
 │ 12. Display    │               │                 │               │              │
 │  boundary      │               │                 │               │              │
 │<───────────────│               │                 │               │              │
 │                │               │                 │               │              │
```

---

### 8.3 State Diagram: Field Status

```
                    ┌─────────────┐
                    │   Created   │
                    │  (Initial)  │
                    └──────┬──────┘
                           │
                           │ Boundary detected
                           ▼
                    ┌─────────────┐
                    │   Active    │◄──────┐
                    │ (Monitoring)│       │
                    └──────┬──────┘       │
                           │              │
                ┌──────────┼──────────┐   │
                │          │          │   │
     User       │          │          │   │ User
     archives   │          │          │   │ restores
                │          │          │   │
                ▼          │          ▼   │
         ┌─────────────┐  │   ┌─────────────┐
         │  Archived   │  │   │   Deleted   │
         │  (Inactive) │  │   │ (Soft-Del)  │
         └──────┬──────┘  │   └──────┬──────┘
                │         │          │
                │         │          │ After 30 days
                │         │          │
                │         │          ▼
                │         │   ┌─────────────┐
                │         │   │ Permanently │
                │         │   │   Deleted   │
                │         │   └─────────────┘
                │         │
                │         │ User deletes
                │         │
                └─────────┴──────────┘
```

---

### 8.4 Activity Diagram: Yield Prediction Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                 Yield Prediction Workflow                    │
└─────────────────────────────────────────────────────────────┘

    [Start]
       │
       ▼
  ┌─────────────────┐
  │ User views      │
  │ field dashboard │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ System checks   │
  │ if prediction   │
  │ available       │
  └────────┬────────┘
           │
      ┌────┴────┐
      │         │
  Yes │         │ No
      │         │
      ▼         ▼
┌──────────┐  ┌──────────────────┐
│ Display  │  │ Check if enough  │
│ existing │  │ data for         │
│prediction│  │ prediction       │
└──────────┘  └────────┬─────────┘
                       │
                  ┌────┴────┐
                  │         │
              Yes │         │ No
                  │         │
                  ▼         ▼
         ┌────────────┐  ┌──────────────┐
         │ Retrieve   │  │ Display      │
         │ NDVI time  │  │ "Not enough  │
         │ series     │  │ data" message│
         └─────┬──────┘  └──────────────┘
               │
               ▼
         ┌────────────┐
         │ Retrieve   │
         │ weather    │
         │ data       │
         └─────┬──────┘
               │
               ▼
         ┌────────────┐
         │ Run Random │
         │ Forest     │
         │ model      │
         └─────┬──────┘
               │
               ▼
         ┌────────────┐
         │ Calculate  │
         │ confidence │
         │ interval   │
         └─────┬──────┘
               │
               ▼
         ┌────────────┐
         │ Calculate  │
         │ revenue    │
         │ estimate   │
         └─────┬──────┘
               │
               ▼
         ┌────────────┐
         │ Store      │
         │ prediction │
         │ in database│
         └─────┬──────┘
               │
               ▼
         ┌────────────┐
         │ Display    │
         │ prediction │
         │ to user    │
         └─────┬──────┘
               │
               ▼
            [End]
```

---

## 9. APPENDICES

### Appendix A: Requirement Traceability Matrix (RTM) - Sample

| **Req ID** | **Requirement** | **Source** | **Design Ref** | **Test Case** | **Status** |
|------------|-----------------|------------|----------------|---------------|------------|
| FR-001.1 | User registration with Google OAuth | PRD F-001 | AUTH-001 | TC-001 | Approved |
| FR-002.3 | AI boundary detection | PRD F-003 | AI-001 | TC-015 | Approved |
| FR-003.2 | NDVI calculation | PRD F-005 | PROC-001 | TC-025 | Approved |
| FR-004.1 | Water recommendations | PRD F-007 | REC-001 | TC-035 | Approved |
| FR-005.1 | Yield prediction | PRD F-009 | ML-001 | TC-045 | Approved |

**Full RTM:** See separate document (Requirement Traceability Matrix)

---

### Appendix B: Data Validation Rules

**Email Validation:**
- Regex: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
- Max length: 255 characters
- Case-insensitive uniqueness check

**Password Validation:**
- Min length: 8 characters
- Max length: 128 characters
- Must contain: 1 uppercase, 1 lowercase, 1 digit
- Optional: 1 special character
- Not in common password list (10,000 passwords)
- Not containing user's name or email

**Phone Number Validation:**
- Regex: `^(\+94|0)?[0-9]{9}$` (Sri Lankan format)
- Example: +94771234567, 0771234567

**Field Name Validation:**
- Min length: 1 character
- Max length: 50 characters
- Allowed characters: Letters, numbers, spaces, hyphens, underscores
- No duplicate names per user

**GPS Coordinates Validation:**
- Latitude: 5.9 to 9.9 (Sri Lanka bounding box)
- Longitude: 79.5 to 82.0 (Sri Lanka bounding box)
- Precision: 6 decimal places (~0.1 meter accuracy)

**Field Area Validation:**
- Minimum: 0.1 hectares (1,000 m²)
- Maximum: 50 hectares (500,000 m²)
- Precision: 2 decimal places

---

### Appendix C: Error Codes & Messages

**Authentication Errors:**
- `AUTH_001`: "Invalid email or password. Please try again."
- `AUTH_002`: "Email already registered. Try logging in or reset your password."
- `AUTH_003`: "Account locked due to multiple failed login attempts. Try again in 30 minutes or reset your password."
- `AUTH_004`: "Session expired. Please log in again."
- `AUTH_005`: "Invalid or expired verification link. Request a new one."

**Field Management Errors:**
- `FIELD_001`: "Field name is required."
- `FIELD_002`: "You already have a field named '[name]'. Please choose a different name."
- `FIELD_003`: "Field boundary is invalid. Please adjust and try again."
- `FIELD_004`: "Field area must be between 0.1 and 50 hectares."
- `FIELD_005`: "You've reached the maximum of 5 fields. Upgrade to Premium for unlimited fields."

**Satellite Image Errors:**
- `SAT_001`: "No clear satellite images available in the last 30 days. Try again in 5 days."
- `SAT_002`: "Satellite image too cloudy (>20% cloud cover). Try selecting a different date."
- `SAT_003`: "Daily satellite image limit reached. Please try again tomorrow."
- `SAT_004`: "Unable to retrieve satellite image. Please try again later."

**AI Model Errors:**
- `AI_001`: "Boundary detection failed. Please draw boundary manually."
- `AI_002`: "Could not detect field boundary. Try selecting a clearer location."
- `AI_003`: "Processing taking longer than expected. Please wait or try again."

**Weather Errors:**
- `WEATHER_001`: "Weather forecast unavailable. Please try again later."
- `WEATHER_002`: "Unable to retrieve weather data for your location."

**General Errors:**
- `GEN_001`: "Network error. Please check your internet connection and try again."
- `GEN_002`: "Something went wrong. Please try again or contact support."
- `GEN_003`: "Service temporarily unavailable. Please try again in a few minutes."

---

### Appendix D: API Rate Limits

**Internal API (SkyCrop Backend):**
- **Per User:** 1,000 requests per hour
- **Per IP:** 100 requests per minute
- **Burst:** 10 requests per second (short bursts allowed)

**External APIs:**
- **Sentinel Hub:** 3,000 requests per month (academic tier)
- **OpenWeatherMap:** 60 calls per minute, 1,000,000 per month (free tier)
- **Google OAuth:** No explicit limit (reasonable use)
- **Firebase:** Unlimited (free tier)

**Rate Limit Response:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds.",
    "retry_after": 60
  }
}
```

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1698541200
Retry-After: 60
```

---

### Appendix E: System Constraints Summary

**Technical Constraints:**
1. Satellite resolution: 10m (Sentinel-2), 30m (Landsat)
2. Satellite revisit: 5 days (Sentinel-2), 16 days (Landsat)
3. Cloud cover: >20% makes images unusable
4. AI processing: 30-60 seconds (user wait time)
5. Mobile devices: Android 8+, iOS 13+, 2GB RAM minimum
6. Network: 3G minimum (1 Mbps)

**Budget Constraints:**
1. Year 1 budget: Rs. 365,000 (~$1,200 USD)
2. Free-tier services only (Sentinel Hub, Weather API, hosting)
3. No paid marketing budget

**Timeline Constraints:**
1. Development: 16 weeks (October 28, 2025 - February 28, 2026)
2. MVP launch: Week 16 (university deadline)
3. No schedule slack (any delay impacts graduation)

**Resource Constraints:**
1. Team size: 1-2 developers
2. ML/GIS expertise: Moderate (learning curve)
3. Support: Part-time only (2 hours/day, Year 1)

**Regulatory Constraints:**
1. GDPR compliance required
2. Sri Lanka Data Protection Act compliance (expected 2026)
3. University ethics approval required
4. Disclaimers required (yield predictions are estimates)

**User Constraints:**
1. 45% have no English proficiency (Sinhala/Tamil required Phase 2)
2. 35% have no smartphones (excluded Phase 1)
3. 22% have no internet (offline mode required Phase 2)
4. 28% skeptical of technology (trust barrier)

---

### Appendix F: Acceptance Test Criteria

**System-Level Acceptance:**
- ✅ All P0 features implemented and functional
- ✅ AI boundary detection accuracy ≥85% (IoU on validation set)
- ✅ Yield prediction accuracy ≥85% (MAPE <15%)
- ✅ Vegetation indices correlation ≥90% with ground truth
- ✅ System uptime ≥99% (measured over 1 month)
- ✅ API response time <3 seconds (95th percentile)
- ✅ Mobile app crash rate <2%
- ✅ Code coverage ≥80%
- ✅ Zero P1 (critical) bugs at launch
- ✅ Security audit passed (OWASP Top 10)

**User Acceptance:**
- ✅ 50+ farmers onboarded and trained
- ✅ 80%+ user retention after 1 month
- ✅ User satisfaction ≥4.0/5.0 (NPS ≥40)
- ✅ Task success rate ≥80% (UAT)
- ✅ Feature adoption ≥70% (users using core features)

**Business Acceptance:**
- ✅ Demonstrated yield improvement ≥10% (early indicators)
- ✅ Water savings ≥15% (user-reported)
- ✅ Partnership MoU signed with Dept. of Agriculture
- ✅ University approves project for graduation

---

### Appendix G: Change Log

| **Version** | **Date** | **Author** | **Changes** |
|-------------|----------|------------|-------------|
| 0.1 | Oct 28, 2025 | Business Analyst | Initial draft (Sections 1-3) |
| 0.5 | Oct 28, 2025 | Business Analyst | Added Sections 4-6 (Interfaces, Functional, Non-Functional) |
| 0.9 | Oct 28, 2025 | Business Analyst | Added Sections 7-8 (Data, Models) |
| 1.0 | Oct 28, 2025 | Business Analyst | Final version (Appendices, review edits) |

---

## DOCUMENT APPROVAL

**Software Requirements Specification Sign-Off:**

By signing below, the undersigned acknowledge that they have reviewed the Software Requirements Specification and agree that it accurately represents the software requirements for the SkyCrop system.

| **Name** | **Role** | **Signature** | **Date** |
|----------|----------|---------------|----------|
| [Your Name] | Business Analyst | _________________ | __________ |
| [Tech Lead] | Technical Lead | _________________ | __________ |
| [QA Lead] | QA Lead | _________________ | __________ |
| [PM Name] | Product Manager | _________________ | __________ |
| [Supervisor] | Project Sponsor | _________________ | __________ |

**Approval Decision:** ☐ APPROVED - Proceed to Design Phase ☐ CONDITIONAL APPROVAL ☐ REJECTED

**Comments:**

---

---

---

**END OF SOFTWARE REQUIREMENTS SPECIFICATION**

---

**Next Steps:**
1. ✅ Obtain SRS approval from all stakeholders
2. ✅ Create Use Case Diagrams and User Stories
3. ✅ Create Requirement Traceability Matrix (RTM)
4. ✅ Proceed to System Design Phase (architecture, database schema, API specs)
5. ✅ Begin technical implementation (Week 3)

**For Questions or Clarifications:**
Contact Business Analyst: [Your Email] | [Your Phone]

**Document Location:** `Doc/Requirements Analysis Phase/software_requirements_specification.md`

---

*This document is confidential and intended for the development team and project stakeholders only.*