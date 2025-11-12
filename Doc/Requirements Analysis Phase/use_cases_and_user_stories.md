# USE CASES & USER STORIES

## SkyCrop: Satellite-Based Paddy Field Management & Monitoring System

---

## DOCUMENT CONTROL

| **Item** | **Details** |
|----------|-------------|
| **Document Title** | Use Cases & User Stories |
| **Project Name** | SkyCrop - Intelligent Paddy Field Monitoring System |
| **Document Code** | SKYCROP-UC-2025-001 |
| **Version** | 1.0 |
| **Date** | October 28, 2025 |
| **Prepared By** | Business Analyst |
| **Reviewed By** | Product Manager, UX Lead |
| **Approved By** | Project Sponsor |
| **Status** | Approved |
| **Confidentiality** | Internal - For Development Team |

---

## TABLE OF CONTENTS

1. [Introduction](#1-introduction)
2. [Use Case Diagram](#2-use-case-diagram)
3. [Detailed Use Cases](#3-detailed-use-cases)
4. [User Stories](#4-user-stories)
5. [Acceptance Criteria](#5-acceptance-criteria)
6. [Appendices](#6-appendices)

---

## 1. INTRODUCTION

### 1.1 Purpose

This document provides detailed use cases and user stories for the SkyCrop system. It describes how different actors interact with the system to achieve their goals, serving as a bridge between requirements and design.

### 1.2 Scope

This document covers:
- **Use Case Diagrams:** Visual representation of system functionality
- **Detailed Use Cases:** Step-by-step descriptions of user-system interactions
- **User Stories:** Agile-format requirements from user perspective
- **Acceptance Criteria:** Testable conditions for story completion

### 1.3 Actors

**Primary Actors:**
- **Farmer:** Paddy farmer who uses SkyCrop to monitor fields and get recommendations
- **Extension Officer:** Agricultural officer who supports farmers using SkyCrop
- **Admin:** System administrator who manages content and users

**Secondary Actors:**
- **Sentinel Hub API:** External system providing satellite imagery
- **Weather API:** External system providing weather forecasts
- **Google OAuth:** External system providing authentication
- **Firebase:** External system providing push notifications

---

## 2. USE CASE DIAGRAM

### 2.1 High-Level Use Case Diagram

```
                    SkyCrop System
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          User Management                            │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ UC-001: Register Account                 │      │    │
│  │  │ UC-002: Login to System                  │      │    │
│  │  │ UC-003: Reset Password                   │      │    │
│  │  │ UC-004: Manage Profile                   │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Field Management                           │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ UC-005: Add New Field                    │      │    │
│  │  │ UC-006: Detect Field Boundary (AI)       │      │    │
│  │  │ UC-007: Adjust Boundary Manually         │      │    │
│  │  │ UC-008: View Field Details               │      │    │
│  │  │ UC-009: Delete Field                     │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Crop Health Monitoring                     │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ UC-010: View Crop Health Map             │      │    │
│  │  │ UC-011: View Health Status               │      │    │
│  │  │ UC-012: View Historical Trends           │      │    │
│  │  │ UC-013: Receive Health Alerts            │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Recommendations                            │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ UC-014: View Water Recommendations       │      │    │
│  │  │ UC-015: View Fertilizer Recommendations  │      │    │
│  │  │ UC-016: Mark Recommendation as Done      │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Yield Prediction                           │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ UC-017: View Yield Forecast              │      │    │
│  │  │ UC-018: Enter Actual Yield               │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Weather Services                           │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ UC-019: View Weather Forecast            │      │    │
│  │  │ UC-020: Receive Weather Alerts           │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Disaster Assessment                        │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ UC-021: Assess Disaster Damage           │      │    │
│  │  │ UC-022: Generate Insurance Report        │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Content & Knowledge                        │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ UC-023: View News Articles               │      │    │
│  │  │ UC-024: Search Knowledge Base            │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Administration                             │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ UC-025: Manage Users                     │      │    │
│  │  │ UC-026: Publish News Article             │      │    │
│  │  │ UC-027: View Analytics Dashboard         │      │    │
│  │  │ UC-028: Monitor System Health            │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Actors:
  ┌──────────┐         ┌──────────┐         ┌──────────┐
  │  Farmer  │         │Extension │         │  Admin   │
  │(Primary) │         │ Officer  │         │(Tertiary)│
  └──────────┘         └──────────┘         └──────────┘
```

---

## 3. DETAILED USE CASES

### 3.1 User Management Use Cases

---

#### UC-001: Register Account

**Use Case ID:** UC-001  
**Use Case Name:** Register Account  
**Actor:** Farmer (Primary)  
**Priority:** Critical (P0)  
**Preconditions:** 
- User has smartphone or computer
- User has internet connection
- User has Google account OR valid email address

**Postconditions:**
- User account created in database
- User logged in with active session
- User redirected to dashboard

**Main Success Scenario:**

1. User opens SkyCrop app/website
2. User clicks "Sign Up" button
3. System displays signup options: "Sign up with Google" OR "Sign up with Email"
4. **Path A: Google OAuth**
   - 4a. User clicks "Sign up with Google"
   - 4b. System redirects to Google OAuth consent screen
   - 4c. User selects Google account
   - 4d. User grants permissions (openid, profile, email)
   - 4e. Google redirects back to SkyCrop with authorization code
   - 4f. System exchanges code for access token
   - 4g. System retrieves user profile (name, email, photo)
   - 4h. System creates user account in database
   - 4i. System issues JWT session token (30-day expiry)
   - 4j. System redirects to dashboard
5. **Path B: Email/Password**
   - 5a. User enters email address
   - 5b. User enters password (min 8 chars, 1 uppercase, 1 number)
   - 5c. User confirms password
   - 5d. System validates email format
   - 5e. System validates password strength
   - 5f. System checks email uniqueness
   - 5g. System hashes password (bcrypt, 10 rounds)
   - 5h. System creates user account (email_verified = false)
   - 5i. System sends verification email
   - 5j. System issues JWT session token
   - 5k. System redirects to dashboard with banner: "Please verify your email"
6. System displays welcome message and interactive tutorial
7. Use case ends

**Alternative Flows:**

**A1: Email Already Registered (Step 5f)**
- 5f1. System detects email already exists
- 5f2. System displays error: "Email already registered. Try logging in or reset password."
- 5f3. System provides links to login and password reset
- 5f4. Use case ends

**A2: Weak Password (Step 5e)**
- 5e1. System detects password doesn't meet strength requirements
- 5e2. System displays error: "Password must be at least 8 characters with 1 uppercase and 1 number."
- 5e3. System highlights password requirements
- 5e4. User enters stronger password
- 5e5. Resume at step 5f

**A3: Google OAuth Fails (Step 4e)**
- 4e1. Google OAuth returns error (user denied permissions, network error)
- 4e2. System displays error: "Google sign-in failed. Please try again or use email/password."
- 4e3. System offers email/password signup option
- 4e4. Resume at step 5a OR use case ends

**Exception Flows:**

**E1: Network Error**
- System displays: "Network error. Please check your internet connection and try again."
- System provides "Retry" button
- Use case ends

**E2: Server Error**
- System displays: "Something went wrong. Please try again later."
- System logs error for debugging
- Use case ends

**Business Rules:**
- BR-001: Email must be unique (case-insensitive)
- BR-002: Password must meet strength requirements (8+ chars, 1 uppercase, 1 number)
- BR-003: Email verification required for email/password signups (but not blocking)
- BR-004: Google OAuth users are automatically verified

**Special Requirements:**
- SR-001: Signup shall complete within 2 minutes (email/password) or 1 minute (Google OAuth)
- SR-002: System shall support concurrent signups (100+ users simultaneously)
- SR-003: Verification email shall be sent within 5 minutes

**Frequency of Use:** 100 signups in Year 1 (1-2 per day average)

**Open Issues:**
- Should we require phone number during signup? (Decision: Optional, can add later)
- Should we implement CAPTCHA to prevent bots? (Decision: Not in MVP, add if spam becomes issue)

---

#### UC-002: Login to System

**Use Case ID:** UC-002  
**Use Case Name:** Login to System  
**Actor:** Farmer (Primary), Extension Officer (Secondary), Admin (Tertiary)  
**Priority:** Critical (P0)  
**Preconditions:**
- User has registered account
- User has internet connection

**Postconditions:**
- User authenticated and logged in
- Session created (JWT token issued)
- User redirected to dashboard

**Main Success Scenario:**

1. User opens SkyCrop app/website
2. User clicks "Log In" button
3. System displays login options: "Log in with Google" OR "Log in with Email"
4. **Path A: Google OAuth**
   - 4a. User clicks "Log in with Google"
   - 4b. System redirects to Google OAuth
   - 4c. User selects Google account (or already logged in)
   - 4d. Google redirects back with authorization code
   - 4e. System validates authorization code
   - 4f. System retrieves user ID from Google
   - 4g. System looks up user in database
   - 4h. System issues JWT session token
   - 4i. System updates last_login timestamp
   - 4j. System redirects to dashboard
5. **Path B: Email/Password**
   - 5a. User enters email address
   - 5b. User enters password
   - 5c. User optionally checks "Remember Me" (30-day session)
   - 5d. User clicks "Log In" button
   - 5e. System validates email format
   - 5f. System retrieves user from database by email
   - 5g. System compares password hash (bcrypt)
   - 5h. System checks account status (active, suspended, deleted)
   - 5i. System issues JWT session token (30-day expiry if "Remember Me", 7-day otherwise)
   - 5j. System updates last_login timestamp
   - 5k. System redirects to dashboard
6. System displays dashboard with user's fields
7. Use case ends

**Alternative Flows:**

**A1: Invalid Credentials (Step 5g)**
- 5g1. System detects password doesn't match
- 5g2. System increments failed_login_attempts counter
- 5g3. System displays error: "Invalid email or password. Try again."
- 5g4. If failed_login_attempts < 5: Resume at step 5a
- 5g5. If failed_login_attempts >= 5: Go to A2 (Account Locked)

**A2: Account Locked (Step 5g5)**
- 5g5a. System locks account (status = 'locked')
- 5g5b. System sends security alert email to user
- 5g5c. System displays error: "Account locked due to multiple failed login attempts. Try again in 30 minutes or reset your password."
- 5g5d. System provides link to password reset
- 5g5e. Use case ends

**A3: Account Suspended (Step 5h)**
- 5h1. System detects account status = 'suspended'
- 5h2. System displays error: "Your account has been suspended. Contact support for assistance."
- 5h3. System provides support contact information
- 5h4. Use case ends

**A4: Account Deleted (Step 5h)**
- 5h1. System detects account status = 'deleted'
- 5h2. System displays error: "This account no longer exists. Please sign up again."
- 5h3. System provides link to signup
- 5h4. Use case ends

**Exception Flows:**

**E1: Network Error**
- System displays: "Network error. Please check your internet connection."
- System provides "Retry" button
- Use case ends

**E2: Google OAuth Unavailable**
- System displays: "Google sign-in temporarily unavailable. Please use email/password or try again later."
- System offers email/password login
- Resume at step 5a OR use case ends

**Business Rules:**
- BR-005: Account locked after 5 failed login attempts
- BR-006: Account auto-unlocks after 30 minutes
- BR-007: Session expires after 30 days (or 7 days if "Remember Me" not checked)
- BR-008: Suspended accounts cannot log in (admin action required)

**Special Requirements:**
- SR-004: Login shall complete within 2 seconds (95th percentile)
- SR-005: System shall support 1,000 concurrent logins
- SR-006: Failed login attempts shall be logged for security monitoring

**Frequency of Use:** 200-300 logins per day (Year 1, 100 users, 2-3 logins/user/day)

---

#### UC-003: Reset Password

**Use Case ID:** UC-003  
**Use Case Name:** Reset Password  
**Actor:** Farmer (Primary)  
**Priority:** High (P0)  
**Preconditions:**
- User has registered account with email/password
- User has access to registered email

**Postconditions:**
- Password updated in database
- All existing sessions invalidated
- User must log in again with new password

**Main Success Scenario:**

1. User clicks "Forgot Password?" link on login page
2. System displays password reset form
3. User enters registered email address
4. User clicks "Send Reset Link" button
5. System validates email format
6. System checks if email exists in database
7. System generates password reset token (UUID, 24-hour expiry)
8. System stores token in database (hashed)
9. System sends email with reset link: `https://skycrop.com/reset-password?token={TOKEN}`
10. System displays message: "If this email is registered, you'll receive a reset link within 5 minutes."
11. User checks email
12. User clicks reset link
13. System validates token (exists, not expired, not used)
14. System displays new password form
15. User enters new password
16. User confirms new password
17. System validates password strength
18. System hashes new password (bcrypt, 10 rounds)
19. System updates password in database
20. System marks reset token as used
21. System invalidates all existing sessions (force re-login)
22. System sends confirmation email: "Your password has been changed"
23. System displays success message: "Password reset successful. Please log in."
24. System redirects to login page
25. Use case ends

**Alternative Flows:**

**A1: Email Not Found (Step 6)**
- 6a. System detects email doesn't exist in database
- 6b. System still displays: "If this email is registered, you'll receive a reset link." (security: don't reveal if email exists)
- 6c. System does NOT send email
- 6d. Use case ends

**A2: Token Expired (Step 13)**
- 13a. System detects token expired (>24 hours old)
- 13b. System displays error: "Reset link expired. Please request a new one."
- 13c. System provides link to request new reset
- 13d. Resume at step 1 OR use case ends

**A3: Token Already Used (Step 13)**
- 13a. System detects token already used
- 13b. System displays error: "This reset link has already been used. Request a new one if needed."
- 13c. Use case ends

**A4: Weak New Password (Step 17)**
- 17a. System detects password doesn't meet strength requirements
- 17b. System displays error: "Password must be at least 8 characters with 1 uppercase and 1 number."
- 17c. User enters stronger password
- 17d. Resume at step 18

**Exception Flows:**

**E1: Email Send Failure (Step 9)**
- 9a. Email service fails to send
- 9b. System logs error
- 9c. System retries email send (3 attempts with exponential backoff)
- 9d. If all retries fail: Display error "Unable to send reset email. Please try again later or contact support."
- 9e. Use case ends

**Business Rules:**
- BR-009: Reset tokens expire after 24 hours
- BR-010: Reset tokens can only be used once
- BR-011: Password reset invalidates all existing sessions (security)
- BR-012: System doesn't reveal if email exists (prevent email enumeration)

**Special Requirements:**
- SR-007: Reset email shall be sent within 5 minutes
- SR-008: Reset link shall be valid for 24 hours
- SR-009: System shall log all password reset attempts (security audit)

**Frequency of Use:** 5-10 password resets per month (Year 1)

---

### 3.2 Field Management Use Cases

---

#### UC-005: Add New Field

**Use Case ID:** UC-005  
**Use Case Name:** Add New Field  
**Actor:** Farmer (Primary)  
**Priority:** Critical (P0)  
**Preconditions:**
- User logged in
- User has <5 fields (Phase 1 limit)
- User has internet connection

**Postconditions:**
- Field created in database
- Field visible on dashboard
- Field ready for health monitoring

**Main Success Scenario:**

1. User clicks "Add New Field" button on dashboard
2. System displays interactive satellite map centered on user's location (GPS)
3. System displays instructions: "Tap the center of your field"
4. User zooms and pans map to locate field
5. User taps on map to select field center point
6. System displays crosshair at selected location
7. System shows GPS coordinates (latitude, longitude)
8. User clicks "Confirm Location" button
9. System displays progress indicator: "Detecting field boundary... 0%"
10. System calls UC-006 (Detect Field Boundary)
11. System displays detected boundary as green polygon overlay
12. System calculates and displays field area: "2.1 hectares"
13. System prompts for field name: "Name your field"
14. User enters field name (e.g., "Main Field")
15. User clicks "Save Field" button
16. System validates field name (no duplicates, max 50 chars)
17. System saves field to database:
    - user_id, name, boundary (GeoJSON), area, center, created_at
18. System displays success message: "Field saved successfully!"
19. System redirects to field dashboard
20. System initiates first health monitoring (retrieve satellite image, calculate NDVI)
21. Use case ends

**Alternative Flows:**

**A1: User Wants to Adjust Boundary (Step 12)**
- 12a. User clicks "Adjust Boundary" button
- 12b. System calls UC-007 (Adjust Boundary Manually)
- 12c. User adjusts boundary vertices
- 12d. System recalculates area
- 12e. Resume at step 13

**A2: Duplicate Field Name (Step 16)**
- 16a. System detects user already has field with same name
- 16b. System displays error: "You already have a field named '[name]'. Please choose a different name."
- 16c. User enters different name
- 16d. Resume at step 15

**A3: Maximum Fields Reached (Step 1)**
- 1a. System detects user has 5 fields (Phase 1 limit)
- 1b. System displays message: "You've reached the maximum of 5 fields. Delete a field or upgrade to Premium (Phase 2)."
- 1c. Use case ends

**A4: No GPS Permission (Step 2)**
- 2a. System detects GPS permission not granted
- 2b. System centers map on Sri Lanka (default)
- 2c. System displays message: "Enable location for easier field selection"
- 2d. Resume at step 3

**Exception Flows:**

**E1: Boundary Detection Fails (Step 10)**
- 10a. AI model fails to detect boundary (no field found, error)
- 10b. System displays error: "Could not detect field boundary. Please draw manually."
- 10c. System provides manual drawing tool (polygon drawing mode)
- 10d. User draws boundary manually (tap to add vertices)
- 10e. Resume at step 12

**E2: Satellite Image Unavailable (Step 10)**
- 10a. No cloud-free satellite images available (last 30 days)
- 10b. System displays error: "No clear satellite images available. Try again in 5 days or draw boundary manually."
- 10c. System offers manual drawing option
- 10d. Resume at E1 step 10c OR use case ends

**E3: Network Error During Save (Step 17)**
- 17a. Network connection lost during save
- 17b. System displays error: "Unable to save field. Please check your connection and try again."
- 17c. System retains field data in local storage (don't lose user's work)
- 17d. System provides "Retry" button
- 17e. Resume at step 17 OR use case ends

**Business Rules:**
- BR-013: Maximum 5 fields per user (Phase 1)
- BR-014: Field names must be unique per user
- BR-015: Field area must be 0.1-50 hectares
- BR-016: Field must be within Sri Lanka bounding box

**Special Requirements:**
- SR-010: Map shall load within 5 seconds on 3G
- SR-011: Boundary detection shall complete within 60 seconds
- SR-012: Field save shall complete within 2 seconds

**Frequency of Use:** 100 fields added in Year 1 (1 per user average)

---

#### UC-006: Detect Field Boundary (AI)

**Use Case ID:** UC-006  
**Use Case Name:** Detect Field Boundary using AI  
**Actor:** System (Automated), Farmer (Initiator)  
**Priority:** Critical (P0)  
**Preconditions:**
- Field center point selected
- Sentinel Hub API accessible
- U-Net model trained and deployed

**Postconditions:**
- Field boundary detected and returned as GeoJSON polygon
- Field area calculated
- Boundary ready for user confirmation or adjustment

**Main Success Scenario:**

1. System receives field center coordinates (lat, lon)
2. System calculates bounding box (5km × 5km around center)
3. System queries Sentinel Hub API for satellite image:
   - Bounding box: [lon-0.025, lat-0.025, lon+0.025, lat+0.025]
   - Date range: Last 30 days
   - Cloud cover: <20%
   - Bands: B02, B03, B04, B08 (Blue, Green, Red, NIR)
   - Resolution: 10m
   - Size: 512×512 pixels
4. System receives GeoTIFF image from Sentinel Hub
5. System checks cloud cover percentage
6. If cloud cover <20%: Continue
7. System preprocesses image:
   - Extract RGB and NIR bands
   - Normalize pixel values (divide by 10,000)
   - Resize to 256×256 (model input size)
   - Stack bands (4 channels: R, G, B, NIR)
8. System calls AI/ML service (Python microservice or function)
9. AI service loads U-Net model from disk
10. AI service runs model inference (forward pass)
11. AI service receives binary mask (256×256, values 0-1)
12. AI service post-processes mask:
    - Apply threshold (0.5) to convert to binary (0 or 1)
    - Morphological closing (kernel 5×5, fill gaps)
    - Morphological opening (kernel 3×3, remove noise)
    - Find contours (detect boundaries)
    - Select largest contour (assume it's the field)
    - Simplify polygon (Douglas-Peucker, tolerance 10m)
13. AI service converts pixel coordinates to GPS coordinates
14. AI service returns boundary polygon (GeoJSON format)
15. System receives boundary from AI service
16. System validates boundary:
    - Minimum 3 vertices
    - Maximum 100 vertices
    - No self-intersecting polygon
    - Area 0.1-50 hectares
17. System calculates field area (Shoelace formula, convert to hectares)
18. System returns boundary and area to frontend
19. Use case ends

**Alternative Flows:**

**A1: Cloud Cover Too High (Step 5)**
- 5a. System detects cloud cover >20%
- 5b. System searches for older image (up to 60 days ago)
- 5c. If cloud-free image found: Resume at step 6
- 5d. If no cloud-free image: Return error "No clear satellite images available"
- 5e. Use case ends (error)

**A2: No Field Detected (Step 12)**
- 12a. AI service finds no contours OR all contours too small
- 12b. AI service returns error: "No field detected"
- 12c. System logs error with image metadata
- 12d. System returns error to frontend
- 12e. Use case ends (error)

**A3: Invalid Boundary (Step 16)**
- 16a. System detects boundary is invalid (self-intersecting, <3 vertices, area out of range)
- 16b. System logs error with boundary data
- 16c. System returns error: "Detected boundary is invalid"
- 16d. Use case ends (error)

**Exception Flows:**

**E1: Sentinel Hub API Error (Step 3)**
- 3a. API returns error (rate limit, server error, authentication failure)
- 3b. System logs error
- 3c. System retries request (exponential backoff, max 3 attempts)
- 3d. If all retries fail: Return error "Unable to retrieve satellite image"
- 3e. Use case ends (error)

**E2: AI Service Timeout (Step 10)**
- 10a. AI service doesn't respond within 60 seconds
- 10b. System logs timeout error
- 10c. System returns error: "Boundary detection timed out"
- 10d. Use case ends (error)

**E3: AI Service Error (Step 11)**
- 11a. AI service crashes or returns error
- 11b. System logs error with stack trace
- 11c. System returns error: "Boundary detection failed"
- 11d. Use case ends (error)

**Business Rules:**
- BR-017: Boundary detection uses most recent cloud-free image (last 30 days)
- BR-018: Cloud cover threshold: 20% (images with >20% cloud rejected)
- BR-019: Boundary detection timeout: 60 seconds
- BR-020: Boundary must have 3-100 vertices

**Special Requirements:**
- SR-013: Boundary detection shall complete within 60 seconds (95th percentile)
- SR-014: Boundary detection accuracy shall be ≥85% IoU on validation set
- SR-015: System shall cache satellite images for 30 days (reduce API calls)

**Frequency of Use:** 100 boundary detections in Year 1 (1 per field)

---

### 3.3 Crop Health Monitoring Use Cases

---

#### UC-010: View Crop Health Map

**Use Case ID:** UC-010  
**Use Case Name:** View Crop Health Map  
**Actor:** Farmer (Primary)  
**Priority:** Critical (P0)  
**Preconditions:**
- User logged in
- User has at least 1 field
- Health data available for field (satellite image processed)

**Postconditions:**
- User views color-coded health map
- User understands field health status
- User can identify areas needing attention

**Main Success Scenario:**

1. User opens SkyCrop app
2. User navigates to dashboard
3. System displays list of user's fields with health status badges
4. User taps on field card (e.g., "Main Field")
5. System retrieves latest health data from database:
   - NDVI, NDWI, TDVI values
   - Health status (Excellent/Good/Fair/Poor)
   - Health score (0-100)
   - Trend (Improving/Stable/Declining)
   - Last updated timestamp
6. System displays field details screen with:
   - **Section 1: Health Map**
     - Color-coded field map (NDVI overlay)
     - Field boundary (white outline)
     - Legend (color scale: green=healthy, yellow=stress, red=critical)
     - Zoom controls
     - Toggle buttons: NDVI / NDWI / TDVI
   - **Section 2: Health Status**
     - Overall health score (large, color-coded: 78/100)
     - Health status badge (Good)
     - Trend indicator (↑ Improving)
     - Last updated: "2 days ago"
7. User views health map, identifies yellow zone in northwest corner
8. User zooms into yellow zone for closer inspection
9. User switches to NDWI view (toggle button)
10. System displays NDWI map (shows water stress in same area)
11. User understands: Yellow zone has water stress (low NDWI)
12. User scrolls down to view recommendations
13. Use case ends

**Alternative Flows:**

**A1: No Health Data Available (Step 5)**
- 5a. System detects no health records for field
- 5b. System displays message: "Health data not yet available. We're processing your first satellite image. Check back in 5 minutes."
- 5c. System provides "Refresh" button
- 5d. System initiates health monitoring (retrieve satellite image, calculate indices)
- 5e. Use case ends

**A2: Health Data Outdated (Step 5)**
- 5a. System detects last health update >7 days ago
- 5b. System displays banner: "Health data is 8 days old. Refreshing..."
- 5c. System initiates background update (retrieve new satellite image)
- 5d. System displays cached health data (with "Last updated: 8 days ago" disclaimer)
- 5e. Resume at step 6

**A3: User Wants Full-Screen Map (Step 8)**
- 8a. User taps on health map
- 8b. System displays full-screen map view
- 8c. User can zoom, pan, switch indices
- 8d. User taps "X" to exit full-screen
- 8e. Resume at step 12

**Exception Flows:**

**E1: Network Error (Step 5)**
- 5a. Network connection lost
- 5b. System displays cached health data (if available)
- 5c. System displays banner: "Offline mode. Showing cached data from [date]."
- 5d. Resume at step 6 OR use case ends

**E2: Database Error (Step 5)**
- 5a. Database query fails
- 5b. System logs error
- 5c. System retries query (3 attempts)
- 5d. If all retries fail: Display error "Unable to load health data. Please try again."
- 5e. Use case ends

**Business Rules:**
- BR-021: Health data updates every 5-7 days (Sentinel-2 revisit)
- BR-022: Cached health data valid for 30 days (offline mode)
- BR-023: Health map uses color scale: Green (NDVI >0.7), Yellow (0.5-0.7), Red (<0.5)

**Special Requirements:**
- SR-016: Health map shall render within 3 seconds
- SR-017: Map interactions shall be smooth (60 FPS)
- SR-018: Health data shall be cached for offline viewing

**Frequency of Use:** 200-300 views per day (Year 1, 100 users, 2-3 views/user/day)

---

#### UC-013: Receive Health Alerts

**Use Case ID:** UC-013  
**Use Case Name:** Receive Health Alerts  
**Actor:** System (Automated), Farmer (Recipient)  
**Priority:** High (P0)  
**Preconditions:**
- User has field with health monitoring enabled
- User granted push notification permission (mobile app)
- Critical health condition detected

**Postconditions:**
- User notified of critical condition
- User can take immediate action
- Alert logged in database

**Main Success Scenario:**

1. System runs scheduled health monitoring job (daily, 2 AM)
2. System retrieves new satellite image for field
3. System calculates NDVI, NDWI, TDVI
4. System compares to previous measurement
5. System detects critical condition:
   - **Severe water stress:** NDWI <0.05
   - **Rapid NDVI decline:** NDVI dropped >15% in 7 days
   - **Extreme weather:** Rain >50mm or Temperature >35°C expected
6. System generates alert:
   - Alert type: "Water Stress" / "NDVI Decline" / "Weather Warning"
   - Severity: Critical / High / Medium
   - Title: "Severe Water Stress Detected"
   - Description: "Your field has severe water stress (NDWI: 0.03). Immediate irrigation recommended."
   - Action: "Irrigate immediately"
   - Zones: [GeoJSON of affected areas]
7. System stores alert in database
8. System sends push notification via Firebase:
   - Title: "🚨 Severe Water Stress"
   - Body: "Your Main Field needs immediate irrigation"
   - Data: { field_id, alert_id, action: "view_field" }
9. Firebase delivers notification to user's device
10. User's phone displays notification (lock screen, notification tray)
11. User taps notification
12. Mobile app opens to field details screen
13. System displays alert banner (red background):
    - "🚨 Severe Water Stress Detected"
    - "Irrigate immediately. Your crop is under severe water stress."
    - "View Details" button
14. User taps "View Details"
15. System displays full alert with:
    - Health map showing red zones (severe stress areas)
    - NDWI value: 0.03 (critical)
    - Recommendation: "Irrigate immediately, focusing on red zones"
    - Estimated impact: "Delaying irrigation may reduce yield by 10-15%"
16. User reads alert and decides to irrigate
17. User taps "Mark as Done" button
18. System updates alert status to "done"
19. System records user action (timestamp, action taken)
20. Use case ends

**Alternative Flows:**

**A1: User Ignores Alert (Step 11)**
- 11a. User dismisses notification without opening app
- 11b. System keeps alert in "pending" status
- 11c. System sends reminder notification after 24 hours (if still critical)
- 11d. Use case ends

**A2: Multiple Alerts (Step 6)**
- 6a. System detects multiple critical conditions (water stress + weather warning)
- 6b. System generates separate alert for each condition
- 6c. System prioritizes alerts (Critical > High > Medium)
- 6d. System sends highest priority alert first
- 6e. System batches lower priority alerts (send together to avoid notification spam)
- 6f. Resume at step 7

**A3: User Has Notifications Disabled (Step 9)**
- 9a. Firebase returns error: Notifications disabled
- 9b. System stores alert in database (visible on dashboard)
- 9c. System does NOT send push notification
- 9d. User sees alert next time they open app
- 9e. Use case ends

**Exception Flows:**

**E1: Firebase Error (Step 8)**
- 8a. Firebase API returns error
- 8b. System logs error
- 8c. System retries notification send (3 attempts)
- 8d. If all retries fail: Store alert in database only (user sees on next app open)
- 8e. Use case ends

**Business Rules:**
- BR-024: Alerts generated for critical conditions only (avoid notification fatigue)
- BR-025: Maximum 3 alerts per day per field (prevent spam)
- BR-026: Alerts expire after 7 days (if not addressed)
- BR-027: Reminder sent after 24 hours if alert still pending

**Special Requirements:**
- SR-019: Alerts shall be delivered within 5 minutes of detection
- SR-020: Push notifications shall have >90% delivery rate
- SR-021: Alert detection shall run daily (automated job)

**Frequency of Use:** 20-30 alerts per month (Year 1, 100 users, 0.2-0.3 alerts/user/month)

---

### 3.4 Recommendation Use Cases

---

#### UC-014: View Water Recommendations

**Use Case ID:** UC-014  
**Use Case Name:** View Water Recommendations  
**Actor:** Farmer (Primary)  
**Priority:** Critical (P0)  
**Preconditions:**
- User logged in
- User has field with health data
- NDWI calculated

**Postconditions:**
- User views water recommendation
- User understands when and where to irrigate
- User can take action

**Main Success Scenario:**

1. User opens field details screen
2. System retrieves latest NDWI data
3. System retrieves 7-day weather forecast
4. System analyzes NDWI:
   - Mean NDWI: 0.18 (moderate water stress)
   - Zones with NDWI <0.2: Northwest corner (0.3 hectares)
5. System checks weather forecast:
   - Next 48 hours: No rain expected
   - Day 3: 60% chance of rain (15mm)
6. System generates water recommendation:
   - **Status:** "Moderate Water Stress"
   - **Action:** "Irrigate in 2 days"
   - **Zones:** "Focus on northwest corner (yellow zone)"
   - **Timing:** "Irrigate before Day 3 rain for optimal absorption"
   - **Quantity:** "Estimated 2,000 liters needed for stressed area"
   - **Savings:** "Targeted irrigation saves ~500 liters vs. full-field irrigation"
7. System displays recommendation card:
   - Icon: 💧 (water droplet)
   - Title: "Irrigate in 2 Days"
   - Description: "Moderate water stress detected in northwest corner"
   - Map: Highlighted yellow zone
   - Action button: "Mark as Done"
8. User reads recommendation
9. User taps on map to see affected zone
10. System highlights northwest corner (yellow overlay)
11. User understands which area needs water
12. User plans to irrigate in 2 days
13. User taps "Mark as Done" button
14. System updates recommendation status to "done"
15. System records user action (timestamp)
16. System displays confirmation: "Great! We'll check your field again in 5 days."
17. Use case ends

**Alternative Flows:**

**A1: No Irrigation Needed (Step 4)**
- 4a. System detects NDWI >0.3 (adequate water)
- 4b. System generates recommendation: "No irrigation needed. Your crop has adequate water."
- 4c. System displays green checkmark icon
- 4d. Resume at step 7

**A2: Severe Water Stress (Step 4)**
- 4a. System detects NDWI <0.1 (severe stress)
- 4b. System generates urgent recommendation: "Irrigate immediately! Severe water stress detected."
- 4c. System sends push notification (critical alert)
- 4d. System displays red warning banner
- 4e. Resume at step 7

**A3: Rain Expected Soon (Step 5)**
- 5a. System detects rain >20mm expected within 48 hours
- 5b. System adjusts recommendation: "No irrigation needed. Rain expected in 2 days (25mm)."
- 5c. System displays rain icon and forecast
- 5d. Resume at step 7

**A4: User Ignores Recommendation (Step 13)**
- 13a. User taps "Remind Me Later" button
- 13b. System keeps recommendation in "pending" status
- 13c. System sends reminder notification after 24 hours
- 13d. Use case ends

**Exception Flows:**

**E1: NDWI Data Unavailable (Step 2)**
- 2a. No NDWI data available (satellite image not processed yet)
- 2b. System displays message: "Water recommendation not yet available. Check back in 1 hour."
- 2c. Use case ends

**E2: Weather Forecast Unavailable (Step 3)**
- 3a. Weather API error or no cached forecast
- 3b. System generates recommendation without weather consideration
- 3c. System displays disclaimer: "Weather forecast unavailable. Recommendation based on crop health only."
- 3d. Resume at step 6

**Business Rules:**
- BR-028: Water recommendations based on NDWI thresholds (>0.3, 0.1-0.3, <0.1)
- BR-029: Recommendations consider weather forecast (delay if rain expected)
- BR-030: Recommendations update every 5-7 days (Sentinel-2 revisit)
- BR-031: Recommendations expire after 7 days

**Special Requirements:**
- SR-022: Recommendations shall be generated within 5 seconds
- SR-023: Recommendations shall achieve 20-30% water savings (validated via user surveys)
- SR-024: Recommendations shall be actionable (clear what to do, when, where)

**Frequency of Use:** 200-300 views per day (Year 1, 100 users, 2-3 views/user/day)

---

### 3.5 Yield Prediction Use Cases

---

#### UC-017: View Yield Forecast

**Use Case ID:** UC-017  
**Use Case Name:** View Yield Forecast  
**Actor:** Farmer (Primary)  
**Priority:** Critical (P0)  
**Preconditions:**
- User logged in
- User has field with health monitoring
- Sufficient NDVI data available (minimum 4 measurements over 20+ days)

**Postconditions:**
- User views yield prediction
- User understands expected harvest quantity and revenue
- User can plan sales and finances

**Main Success Scenario:**

1. User opens field details screen
2. User scrolls to "Yield Forecast" section
3. System checks if yield prediction available:
   - Minimum 4 NDVI measurements (20+ days of data)
   - Growth stage known (days since planting)
4. System retrieves prediction data from database (if exists and <10 days old)
5. If no recent prediction: System generates new prediction:
   - 5a. System retrieves NDVI time series (last 60 days)
   - 5b. System retrieves weather data (last 30 days)
   - 5c. System retrieves field metadata (area, location)
   - 5d. System calls ML service (Random Forest model)
   - 5e. ML service preprocesses features (normalize, aggregate)
   - 5f. ML service runs model inference
   - 5g. ML service calculates confidence interval (95%)
   - 5h. ML service returns prediction
   - 5i. System stores prediction in database
6. System displays yield forecast:
   - **Primary:** "Estimated Yield: 4,200 kg/hectare"
   - **Total:** "Total: 8,400 kg (2 hectares)"
   - **Confidence:** "Range: 3,800 - 4,600 kg/ha (95% confidence)"
   - **Revenue:** "Expected Revenue: Rs. 252,000 (at Rs. 30/kg)"
   - **Harvest Date:** "Estimated Harvest: ~45 days (January 15, 2026)"
   - **Progress Bar:** Visual indicator (current yield vs. optimal 4,500 kg/ha)
7. System displays comparison to previous season (if data available):
   - "Last season: 3,800 kg/ha"
   - "This season: 4,200 kg/ha (+11%)"
8. User views prediction and plans accordingly
9. User taps "Share" button (optional)
10. System generates shareable summary (text or image)
11. User shares via WhatsApp with buyer/family
12. Use case ends

**Alternative Flows:**

**A1: Insufficient Data for Prediction (Step 3)**
- 3a. System detects <4 NDVI measurements
- 3b. System displays message: "Not enough data for accurate yield prediction. Check back in 2 weeks."
- 3c. System shows progress: "Data collected: 2 of 4 measurements needed"
- 3d. Use case ends

**A2: Yield Trending Below Expectations (Step 6)**
- 6a. System detects predicted yield <80% of optimal (4,500 kg/ha)
- 6b. System displays warning banner: "⚠️ Yield below expectations. Check health recommendations."
- 6c. System highlights potential issues (low NDVI, water stress, etc.)
- 6d. Resume at step 7

**A3: User Wants to Customize Market Price (Step 6)**
- 6a. User taps "Edit Price" button
- 6b. System displays input field with current price (Rs. 30/kg)
- 6c. User enters custom price (e.g., Rs. 35/kg for contract sale)
- 6d. System recalculates revenue: Rs. 294,000
- 6e. System saves custom price to user preferences
- 6f. Resume at step 7

**Exception Flows:**

**E1: ML Service Error (Step 5f)**
- 5f1. ML service fails to generate prediction
- 5f2. System logs error
- 5f3. System uses fallback: Average yield for region × field area
- 5f4. System displays prediction with disclaimer: "Estimate based on regional average (ML model unavailable)"
- 5f5. Resume at step 6

**E2: Network Error (Step 5)**
- 5a. Network connection lost during prediction generation
- 5b. System displays cached prediction (if available)
- 5c. System displays disclaimer: "Showing cached prediction from [date]"
- 5d. Resume at step 6 OR use case ends

**Business Rules:**
- BR-032: Yield prediction requires minimum 4 NDVI measurements (20+ days)
- BR-033: Yield prediction updates every 10 days during growing season
- BR-034: Yield prediction accuracy target: ≥85% (MAPE <15%)
- BR-035: Confidence interval: 95% (±10-15% of prediction)

**Special Requirements:**
- SR-025: Yield prediction shall complete within 10 seconds
- SR-026: Yield prediction accuracy shall be ≥85% (validated against actual harvest)
- SR-027: Yield prediction shall update every 10 days

**Frequency of Use:** 100-150 views per week (Year 1, 100 users, 1-1.5 views/user/week)

---

### 3.6 Weather Use Cases

---

#### UC-019: View Weather Forecast

**Use Case ID:** UC-019  
**Use Case Name:** View Weather Forecast  
**Actor:** Farmer (Primary)  
**Priority:** Critical (P0)  
**Preconditions:**
- User logged in
- User has at least 1 field (for location-specific forecast)
- Weather API accessible

**Postconditions:**
- User views 7-day weather forecast
- User can plan farm operations accordingly

**Main Success Scenario:**

1. User opens SkyCrop app
2. User taps "Weather" tab (bottom navigation)
3. System retrieves field GPS coordinates (use first field if multiple)
4. System checks cache for weather forecast (6-hour TTL)
5. If cache miss: System queries OpenWeatherMap API:
   - Endpoint: `/data/2.5/forecast/daily`
   - Parameters: lat, lon, cnt=7, units=metric
6. System receives 7-day forecast (JSON)
7. System caches forecast (Redis, 6-hour expiry)
8. System displays weather screen:
   - **Section 1: Current Weather**
     - Large weather icon (sun, cloud, rain, storm)
     - Current temperature: "32°C"
     - Conditions: "Partly Cloudy"
     - Humidity: "75%", Wind: "12 km/h"
   - **Section 2: 7-Day Forecast**
     - Horizontal scrollable cards:
       - Day 1 (Today): ☀️ 32°C / 24°C, 10% rain
       - Day 2 (Tomorrow): ⛅ 30°C / 23°C, 20% rain
       - Day 3 (Wed): 🌧️ 28°C / 22°C, 80% rain, 25mm
       - Day 4-7: Similar format
   - **Section 3: Weather Alerts** (if any)
     - Alert card: "⚠️ Heavy Rain Expected"
     - "Day 3: 25mm rain expected. Delay fertilizer application."
9. User views forecast and plans farm operations
10. User taps on Day 3 card (heavy rain day)
11. System displays detailed hourly forecast for Day 3
12. User sees rain expected 2-4 PM
13. User plans to avoid field work during rain
14. Use case ends

**Alternative Flows:**

**A1: Extreme Weather Detected (Step 8)**
- 8a. System detects extreme weather (rain >50mm, temp >35°C)
- 8b. System displays prominent alert banner (red background)
- 8c. System sends push notification: "⚠️ Heavy Rain Alert: 60mm expected on Day 4"
- 8d. Resume at step 9

**A2: No Weather Alerts (Step 8)**
- 8a. No extreme weather detected
- 8b. System displays: "No weather alerts. Conditions are normal."
- 8c. Resume at step 9

**A3: User Wants Historical Weather (Step 9)**
- 9a. User taps "Historical" tab
- 9b. System displays last 30 days of weather:
     - Daily temperature (line chart)
     - Daily rainfall (bar chart)
     - Total rainfall: 120mm
- 9c. User views historical data
- 9d. Resume at step 14 OR use case ends

**Exception Flows:**

**E1: Weather API Error (Step 5)**
- 5a. OpenWeatherMap API returns error
- 5b. System logs error
- 5c. System retries API call (3 attempts with exponential backoff)
- 5d. If all retries fail: Display cached forecast (if available)
- 5e. System displays disclaimer: "Weather forecast unavailable. Showing cached data from [timestamp]."
- 5f. Resume at step 8 OR use case ends

**E2: No Cached Forecast (Step 4)**
- 4a. Cache miss and API error
- 4b. System displays error: "Weather forecast unavailable. Please try again later."
- 4c. Use case ends

**Business Rules:**
- BR-036: Weather forecast updates every 6 hours
- BR-037: Weather forecast cached for 6 hours (reduce API calls)
- BR-038: Extreme weather threshold: Rain >50mm, Temp >35°C, Wind >40 km/h
- BR-039: Weather alerts sent as push notifications (critical only)

**Special Requirements:**
- SR-028: Weather forecast shall load within 3 seconds
- SR-029: Weather forecast accuracy shall be ≥80% (validated against actual weather)
- SR-030: Weather alerts shall be delivered within 5 minutes

**Frequency of Use:** 150-200 views per day (Year 1, 100 users, 1.5-2 views/user/day)

---

### 3.7 Disaster Assessment Use Cases

---

#### UC-021: Assess Disaster Damage

**Use Case ID:** UC-021  
**Use Case Name:** Assess Disaster Damage  
**Actor:** Farmer (Primary)  
**Priority:** High (P1)  
**Preconditions:**
- User logged in
- User has field
- Disaster event occurred (flood, drought, storm)
- Satellite images available before and after disaster

**Postconditions:**
- Damage quantified (area, percentage, severity)
- Financial loss estimated
- Insurance report generated
- User can file insurance claim

**Main Success Scenario:**

1. User experiences disaster event (e.g., flood on October 15, 2025)
2. User waits 3-5 days for flood waters to recede
3. User opens SkyCrop app
4. User navigates to field details
5. User taps "Disaster Assessment" button
6. System displays disaster assessment wizard:
   - Step 1: Select disaster type
   - Step 2: Select before/after dates
   - Step 3: Analyze damage
   - Step 4: Generate report
7. User selects disaster type: "Flood"
8. System displays calendar with satellite image availability:
   - Green dots: Cloud-free images available
   - Yellow dots: Partial cloud cover
   - Red dots: No usable images
9. User selects "Before" date: October 10 (5 days before flood)
10. User selects "After" date: October 20 (5 days after flood)
11. System validates date selection (before < after, max 60 days apart)
12. User clicks "Analyze Damage" button
13. System displays progress: "Comparing satellite images... 0%"
14. System retrieves before image from Sentinel Hub (or cache)
15. System retrieves after image from Sentinel Hub (or cache)
16. System calculates NDVI for both images
17. System computes NDVI difference: ΔNDVI = NDVI_after - NDVI_before
18. System classifies damage severity:
    - Severe: ΔNDVI < -0.3 (NDVI dropped >30%)
    - Moderate: ΔNDVI -0.2 to -0.3 (NDVI dropped 20-30%)
    - Minor: ΔNDVI -0.1 to -0.2 (NDVI dropped 10-20%)
    - No damage: ΔNDVI > -0.1
19. System calculates damaged area:
    - Severe: 0.3 hectares (15% of field)
    - Moderate: 0.5 hectares (25% of field)
    - Minor: 0.2 hectares (10% of field)
    - Total damaged: 1.0 hectares (50% of field)
20. System estimates yield loss:
    - Severe: 0.3 ha × 4,000 kg/ha × 80% loss = 960 kg
    - Moderate: 0.5 ha × 4,000 kg/ha × 50% loss = 1,000 kg
    - Minor: 0.2 ha × 4,000 kg/ha × 20% loss = 160 kg
    - Total yield loss: 2,120 kg
21. System calculates financial loss:
    - 2,120 kg × Rs. 30/kg = Rs. 63,600
22. System displays damage assessment results:
    - **Visual:** Side-by-side maps (before: green, after: red/yellow)
    - **Damaged Area:** 1.0 hectares (50% of field)
    - **Severity Breakdown:**
      - Severe: 0.3 ha (15%)
      - Moderate: 0.5 ha (25%)
      - Minor: 0.2 ha (10%)
    - **Yield Loss:** 2,120 kg (53% of expected harvest)
    - **Financial Loss:** Rs. 63,600
23. User reviews damage assessment
24. User clicks "Generate Report" button
25. System calls UC-022 (Generate Insurance Report)
26. Use case ends

**Alternative Flows:**

**A1: No Damage Detected (Step 18)**
- 18a. System detects ΔNDVI > -0.1 (no significant NDVI drop)
- 18b. System displays message: "No significant crop damage detected. Your field appears healthy."
- 18c. System shows before/after comparison (both green)
- 18d. Use case ends

**A2: Partial Cloud Cover (Step 14-15)**
- 14a. Before or after image has 10-20% cloud cover
- 14b. System applies cloud masking (exclude cloudy pixels)
- 14c. System displays disclaimer: "Analysis excludes cloudy areas (X% of field)"
- 14d. Resume at step 16

**A3: User Wants Different Dates (Step 10-11)**
- 10a. User realizes selected dates are wrong
- 10b. User clicks "Back" button
- 10c. System returns to date selection
- 10d. Resume at step 9

**Exception Flows:**

**E1: No Satellite Images Available (Step 14-15)**
- 14a. No cloud-free images available for selected dates
- 14b. System displays error: "No clear satellite images available for selected dates. Try different dates or wait for new images."
- 14c. System suggests alternative dates (nearest cloud-free images)
- 14d. Resume at step 9 OR use case ends

**E2: Satellite API Error (Step 14-15)**
- 14a. Sentinel Hub API returns error
- 14b. System logs error
- 14c. System retries (3 attempts)
- 14d. If all retries fail: Display error "Unable to retrieve satellite images. Please try again later."
- 14e. Use case ends

**Business Rules:**
- BR-040: Damage assessment requires before/after images (max 60 days apart)
- BR-041: Damage severity based on NDVI drop thresholds (>30%, 20-30%, 10-20%)
- BR-042: Yield loss estimates: Severe 80%, Moderate 50%, Minor 20%
- BR-043: Financial loss based on market price (Rs. 30/kg default, user-customizable)

**Special Requirements:**
- SR-031: Damage analysis shall complete within 90 seconds
- SR-032: Damage detection accuracy shall be ≥80%
- SR-033: System shall support multiple disaster types (flood, drought, storm)

**Frequency of Use:** 10-20 assessments per year (Year 1, 100 users, 0.1-0.2 disasters/user/year)

---

#### UC-022: Generate Insurance Report

**Use Case ID:** UC-022  
**Use Case Name:** Generate Insurance Report  
**Actor:** Farmer (Primary)  
**Priority:** High (P1)  
**Preconditions:**
- Damage assessment completed (UC-021)
- Damage detected (>10% of field)

**Postconditions:**
- PDF report generated
- Report stored in user account
- Report shareable via WhatsApp/email

**Main Success Scenario:**

1. User clicks "Generate Report" button (from UC-021 step 24)
2. System displays report generation progress: "Generating PDF report... 0%"
3. System compiles report data:
   - Field information (name, location, area, owner)
   - Disaster information (type, dates)
   - Satellite images (before, after, damage map)
   - Damage statistics (area, percentage, severity)
   - Financial loss calculation
4. System generates PDF using template:
   - **Page 1: Cover**
     - SkyCrop logo
     - Report title: "Crop Damage Assessment Report"
     - Field name, owner name
     - Report date, report ID
   - **Page 2: Field Information**
     - Field location (GPS coordinates, map)
     - Field area (hectares)
     - Crop type: Paddy
     - Owner details
   - **Page 3: Disaster Information**
     - Disaster type: Flood
     - Disaster date: October 15, 2025
     - Before image date: October 10, 2025
     - After image date: October 20, 2025
   - **Page 4: Satellite Images**
     - Before image (with NDVI overlay, green)
     - After image (with NDVI overlay, red/yellow)
     - Side-by-side comparison
   - **Page 5: Damage Analysis**
     - Damage map (color-coded: green=no damage, yellow=moderate, red=severe)
     - Damaged area: 1.0 hectares (50%)
     - Severity breakdown table
   - **Page 6: Financial Loss**
     - Yield loss calculation (kg)
     - Financial loss calculation (Rs.)
     - Methodology explanation
   - **Page 7: Certification**
     - "This report is generated by SkyCrop using Sentinel-2 satellite imagery and AI analysis."
     - Disclaimer: "This is an estimate based on satellite data. Actual damage may vary. Ground verification recommended."
     - Report ID, generation timestamp
     - SkyCrop certification stamp (digital signature)
5. System saves PDF to AWS S3 (or local storage)
6. System stores report metadata in database:
   - assessment_id, field_id, report_pdf_url, created_at
7. System displays success message: "Report generated successfully!"
8. System displays report preview (embedded PDF viewer)
9. System provides action buttons:
   - "Download" (save to device)
   - "Share via WhatsApp"
   - "Share via Email"
   - "Print" (web only)
10. User clicks "Share via WhatsApp"
11. System opens WhatsApp share dialog with:
    - Message: "Crop Damage Assessment Report for [Field Name]"
    - Attachment: PDF file (or link if file >16 MB)
12. User selects insurance agent contact
13. User sends message
14. WhatsApp delivers message with PDF
15. Use case ends

**Alternative Flows:**

**A1: User Downloads Report (Step 10)**
- 10a. User clicks "Download" button
- 10b. System downloads PDF to device (Downloads folder)
- 10c. System displays success: "Report downloaded to Downloads folder"
- 10d. Use case ends

**A2: User Shares via Email (Step 10)**
- 10a. User clicks "Share via Email"
- 10b. System opens email client with:
     - To: [blank]
     - Subject: "Crop Damage Assessment Report - [Field Name]"
     - Body: "Please find attached the damage assessment report for my paddy field."
     - Attachment: PDF file
- 10c. User enters recipient email (insurance agent)
- 10d. User sends email
- 10e. Use case ends

**A3: User Wants to Regenerate Report (Step 8)**
- 8a. User clicks "Regenerate Report" button
- 8b. System confirms: "This will create a new report. Continue?"
- 8c. User confirms
- 8d. Resume at step 2

**Exception Flows:**

**E1: PDF Generation Fails (Step 4)**
- 4a. PDF library throws error
- 4b. System logs error with stack trace
- 4c. System retries PDF generation (3 attempts)
- 4d. If all retries fail: Display error "Unable to generate report. Please try again or contact support."
- 4e. Use case ends

**E2: File Upload Fails (Step 5)**
- 5a. AWS S3 upload fails (network error, permission error)
- 5b. System logs error
- 5c. System retries upload (3 attempts)
- 5d. If all retries fail: Save PDF locally, display warning "Report saved locally. Upload failed."
- 5e. Resume at step 7

**E3: WhatsApp Share Fails (Step 14)**
- 14a. WhatsApp not installed OR file too large (>16 MB)
- 14b. System displays error: "Unable to share via WhatsApp. Try email or download."
- 14c. System offers alternative sharing options
- 14d. Resume at step 10

**Business Rules:**
- BR-044: Report generated as PDF (portable, printable)
- BR-045: Report includes disclaimer (estimates, not guarantees)
- BR-046: Report includes SkyCrop certification (digital signature)
- BR-047: Report stored for 1 year (user can re-download)

**Special Requirements:**
- SR-034: PDF report shall be generated within 10 seconds
- SR-035: PDF report shall be <5 MB (shareable via WhatsApp)
- SR-036: Report shall include before/after satellite images
- SR-037: Report shall be professionally formatted (suitable for insurance submission)

**Frequency of Use:** 10-20 reports per year (Year 1, 100 users, 0.1-0.2 disasters/user/year)

---

### 3.8 Administration Use Cases

---

#### UC-026: Publish News Article

**Use Case ID:** UC-026  
**Use Case Name:** Publish News Article  
**Actor:** Admin (Primary)  
**Priority:** High (P1)  
**Preconditions:**
- Admin logged in
- Admin has content creation permissions

**Postconditions:**
- Article published and visible to users
- Article indexed for search
- Users notified (optional)

**Main Success Scenario:**

1. Admin opens admin dashboard
2. Admin clicks "Content" menu → "News Articles"
3. System displays article list (published, draft, scheduled)
4. Admin clicks "Create New Article" button
5. System displays article editor form:
   - Title (text input, max 100 chars)
   - Category (dropdown: News, Best Practices, Market Prices, Government Schemes)
   - Summary (textarea, max 200 chars)
   - Content (rich text editor: TinyMCE or Quill)
   - Featured Image (file upload, max 2 MB)
   - Tags (multi-select: fertilizer, irrigation, subsidy, etc.)
   - Publication Date (date picker: Publish Now or Schedule)
   - Notify Users (checkbox: Send push notification)
6. Admin enters article details:
   - Title: "New Fertilizer Subsidy Announced"
   - Category: Government Schemes
   - Summary: "Government announces 30% subsidy on organic fertilizers for paddy farmers..."
   - Content: [Full article with formatting, images, links]
   - Featured Image: fertilizer-subsidy.jpg (uploaded)
   - Tags: fertilizer, subsidy, government
   - Publication: Publish Now
   - Notify Users: Yes
7. Admin clicks "Preview" button
8. System displays article preview (how it will appear to users)
9. Admin reviews preview
10. Admin clicks "Publish" button
11. System validates article:
    - Title not empty
    - Summary not empty
    - Content not empty
    - Featured image uploaded
    - Category selected
12. System saves article to MongoDB:
    - _id, title, slug, category, summary, content, featured_image, author, tags, status='published', published_at, created_at
13. System generates article slug (URL-friendly): "new-fertilizer-subsidy-announced"
14. System indexes article for search (full-text search on title, summary, content)
15. If "Notify Users" checked:
    - 15a. System sends push notification to all users:
      - Title: "📰 New Article: New Fertilizer Subsidy Announced"
      - Body: "Government announces 30% subsidy on organic fertilizers..."
      - Action: Open article
    - 15b. System logs notification sent
16. System displays success message: "Article published successfully!"
17. System redirects to article list
18. Article now visible to users in news feed
19. Use case ends

**Alternative Flows:**

**A1: Admin Saves as Draft (Step 10)**
- 10a. Admin clicks "Save as Draft" button
- 10b. System saves article with status='draft'
- 10c. Article NOT visible to users
- 10d. Admin can edit later
- 10e. Use case ends

**A2: Admin Schedules Publication (Step 6)**
- 6a. Admin selects "Schedule" for publication date
- 6b. Admin picks future date/time (e.g., October 30, 2025, 10:00 AM)
- 6c. System saves article with status='scheduled', published_at=[future date]
- 6d. System creates scheduled job (cron) to publish at specified time
- 6e. At scheduled time: System updates status='published', sends notifications
- 6f. Use case ends

**A3: Validation Fails (Step 11)**
- 11a. System detects missing required fields (title, summary, content)
- 11b. System displays error: "Please fill in all required fields: [list]"
- 11c. System highlights missing fields (red border)
- 11d. Resume at step 6

**A4: Admin Edits Existing Article (Step 4)**
- 4a. Admin clicks "Edit" button on existing article
- 4b. System loads article data into editor form
- 4c. Admin makes changes
- 4d. Resume at step 10

**Exception Flows:**

**E1: Image Upload Fails (Step 6)**
- 6a. Image upload to S3 fails (network error, permission error)
- 6b. System logs error
- 6c. System retries upload (3 attempts)
- 6d. If all retries fail: Display error "Image upload failed. Please try again."
- 6e. Resume at step 6

**E2: Database Save Fails (Step 12)**
- 12a. MongoDB insert fails
- 12b. System logs error
- 12c. System retries save (3 attempts)
- 12d. If all retries fail: Display error "Unable to publish article. Please try again."
- 12e. Use case ends

**E3: Push Notification Fails (Step 15a)**
- 15a1. Firebase API returns error
- 15a2. System logs error
- 15a3. System retries notification (3 attempts)
- 15a4. If all retries fail: Article still published, but users not notified
- 15a5. System displays warning: "Article published, but notification failed. Users will see it in news feed."
- 15a6. Resume at step 16

**Business Rules:**
- BR-048: Only admins can publish articles
- BR-049: Article slug must be unique (auto-generated from title)
- BR-050: Featured image required (max 2 MB, JPEG/PNG)
- BR-051: Push notifications optional (avoid notification fatigue)

**Special Requirements:**
- SR-038: Admin shall be able to publish article in <5 minutes
- SR-039: Rich text editor shall support formatting, images, links
- SR-040: Article preview shall match actual display (WYSIWYG)
- SR-041: Scheduled articles shall publish within 1 minute of scheduled time

**Frequency of Use:** 10-20 articles per month (Year 1, 2-4 articles/week)

---

## 4. USER STORIES

### 4.1 Epic: User Onboarding

**Epic ID:** E-001  
**Epic Name:** User Onboarding  
**Description:** As a farmer, I want to easily sign up and set up my first field so I can start monitoring my crop health.

---

#### Story: US-001 - Sign Up with Google

**User Story:**
> As a farmer, I want to sign up with my Google account so I can start using SkyCrop quickly without creating a new password.

**Acceptance Criteria:**
- ✅ Given I am on the signup page
- ✅ When I click "Sign up with Google"
- ✅ Then I am redirected to Google OAuth consent screen
- ✅ And I can select my Google account
- ✅ And I grant permissions (openid, profile, email)
- ✅ And I am redirected back to SkyCrop
- ✅ And my account is created automatically
- ✅ And I am logged in with an active session
- ✅ And I am redirected to the dashboard
- ✅ And the entire process takes <1 minute

**Priority:** Must Have (P0)  
**Story Points:** 5  
**Sprint:** Sprint 1 (Week 3-4)  
**Dependencies:** Google OAuth integration

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written (≥80% coverage)
- [ ] Integration tests written
- [ ] Tested on Android and iOS
- [ ] Tested with multiple Google accounts
- [ ] Error handling implemented (OAuth failure, network error)
- [ ] Logged in production-ready state

---

#### Story: US-002 - Sign Up with Email

**User Story:**
> As a farmer, I want to sign up with my email and password so I can use SkyCrop even if I don't have a Google account.

**Acceptance Criteria:**
- ✅ Given I am on the signup page
- ✅ When I enter my email and password
- ✅ Then the system validates my email format
- ✅ And the system validates my password strength (min 8 chars, 1 uppercase, 1 number)
- ✅ And the system checks if my email is already registered
- ✅ And if valid, my account is created
- ✅ And I receive a verification email within 5 minutes
- ✅ And I am logged in with an active session
- ✅ And I see a banner: "Please verify your email"
- ✅ And the entire process takes <2 minutes

**Priority:** Must Have (P0)  
**Story Points:** 3  
**Sprint:** Sprint 1 (Week 3-4)  
**Dependencies:** Email service integration

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written (≥80% coverage)
- [ ] Integration tests written
- [ ] Password hashing implemented (bcrypt, 10 rounds)
- [ ] Email verification implemented
- [ ] Error handling implemented (duplicate email, weak password)
- [ ] Tested on web and mobile

---

#### Story: US-003 - Map My First Field

**User Story:**
> As a farmer, I want to easily select my field on a map so the system can start monitoring my crop health.

**Acceptance Criteria:**
- ✅ Given I am logged in
- ✅ When I click "Add New Field"
- ✅ Then I see a satellite map centered on my location (GPS)
- ✅ And I can zoom and pan the map to find my field
- ✅ And I can tap on the map to select my field center
- ✅ And I see a crosshair at the selected location
- ✅ And I see GPS coordinates displayed
- ✅ And I can click "Confirm Location" to proceed
- ✅ And the map loads within 5 seconds on 3G
- ✅ And the map is smooth and responsive (60 FPS)

**Priority:** Must Have (P0)  
**Story Points:** 8  
**Sprint:** Sprint 2 (Week 5-6)  
**Dependencies:** Map library integration (Leaflet.js or Google Maps)

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Tested on 3G network (performance)
- [ ] Tested on low-end devices (Android 8, 2GB RAM)
- [ ] GPS permission handling implemented
- [ ] Error handling implemented (GPS unavailable, map load failure)

---

#### Story: US-004 - AI Detects My Field Boundary

**User Story:**
> As a farmer, I want the system to automatically detect my field boundary so I don't have to draw it manually.

**Acceptance Criteria:**
- ✅ Given I have selected my field location
- ✅ When I click "Confirm Location"
- ✅ Then the system retrieves a satellite image
- ✅ And the system runs AI boundary detection
- ✅ And I see a progress indicator (percentage, estimated time)
- ✅ And the boundary is detected within 60 seconds
- ✅ And the boundary is displayed as a green polygon on the map
- ✅ And the field area is calculated and displayed (hectares)
- ✅ And the boundary accuracy is ≥85% (IoU metric)
- ✅ And I can confirm or adjust the boundary

**Priority:** Must Have (P0)  
**Story Points:** 13  
**Sprint:** Sprint 3 (Week 7-8)  
**Dependencies:** U-Net model trained, Sentinel Hub API integrated

**Definition of Done:**
- [ ] U-Net model trained (≥85% IoU on validation set)
- [ ] Model deployed to production
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Tested with 20+ real fields (accuracy validation)
- [ ] Error handling implemented (no field detected, API error, timeout)
- [ ] Performance optimized (<60 seconds)

---

### 4.2 Epic: Crop Health Monitoring

**Epic ID:** E-002  
**Epic Name:** Crop Health Monitoring  
**Description:** As a farmer, I want to monitor my crop health in real-time so I can take timely action to improve yields.

---

#### Story: US-005 - View My Field Health

**User Story:**
> As a farmer, I want to see a color-coded map of my field health so I can quickly identify areas that need attention.

**Acceptance Criteria:**
- ✅ Given I have a field with health data
- ✅ When I open the field details screen
- ✅ Then I see a color-coded health map (green=healthy, yellow=stress, red=critical)
- ✅ And I see my overall health score (0-100)
- ✅ And I see my health status (Excellent/Good/Fair/Poor)
- ✅ And I see the health trend (Improving/Stable/Declining)
- ✅ And I see when the data was last updated
- ✅ And I can zoom into the map to see details
- ✅ And I can toggle between NDVI, NDWI, TDVI views
- ✅ And the map loads within 3 seconds

**Priority:** Must Have (P0)  
**Story Points:** 8  
**Sprint:** Sprint 4 (Week 9-10)  
**Dependencies:** NDVI calculation, map rendering

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Tested with real satellite data
- [ ] Color scheme validated (user-friendly, colorblind-safe)
- [ ] Performance optimized (<3 seconds load time)
- [ ] Tested on mobile and web

---

#### Story: US-006 - Get Water Recommendations

**User Story:**
> As a farmer, I want to know when to irrigate my field so I can save water and avoid over-watering.

**Acceptance Criteria:**
- ✅ Given I have a field with NDWI data
- ✅ When I view the field details
- ✅ Then I see a water recommendation card
- ✅ And the recommendation tells me when to irrigate (e.g., "Irrigate in 2 days")
- ✅ And the recommendation tells me which zones need water (e.g., "Northwest corner")
- ✅ And the recommendation considers weather forecast (delay if rain expected)
- ✅ And I see estimated water savings (e.g., "Save 500 liters")
- ✅ And I can mark the recommendation as "Done"
- ✅ And the recommendation is clear and actionable (no technical jargon)

**Priority:** Must Have (P0)  
**Story Points:** 5  
**Sprint:** Sprint 4 (Week 9-10)  
**Dependencies:** NDWI calculation, weather forecast integration

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] Recommendation logic validated (rule-based system)
- [ ] Tested with various NDWI values (adequate, moderate, severe stress)
- [ ] Tested with weather integration (rain expected, no rain)
- [ ] User testing (10 farmers) - 80%+ comprehension
- [ ] Water savings validated (user surveys)

---

#### Story: US-007 - Get Fertilizer Recommendations

**User Story:**
> As a farmer, I want to know when and where to apply fertilizer so I can reduce costs and improve crop health.

**Acceptance Criteria:**
- ✅ Given I have a field with NDVI data
- ✅ When I view the field details
- ✅ Then I see a fertilizer recommendation card
- ✅ And the recommendation tells me if fertilizer is needed
- ✅ And if needed, it tells me how much to apply (e.g., "30 kg/ha urea")
- ✅ And it tells me which zones need fertilizer (e.g., "Yellow zones")
- ✅ And it tells me when to apply (e.g., "2 days before rain")
- ✅ And I see estimated cost savings (e.g., "Save Rs. 3,000")
- ✅ And I can mark the recommendation as "Done"

**Priority:** Must Have (P0)  
**Story Points:** 5  
**Sprint:** Sprint 4 (Week 9-10)  
**Dependencies:** NDVI calculation, weather forecast integration

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] Recommendation logic validated
- [ ] Tested with various NDVI values
- [ ] Tested with weather integration
- [ ] User testing (10 farmers) - 80%+ comprehension
- [ ] Cost savings validated (user surveys)

---

#### Story: US-008 - Receive Health Alerts

**User Story:**
> As a farmer, I want to be alerted when my crop has a critical issue so I can take immediate action.

**Acceptance Criteria:**
- ✅ Given I have a field with health monitoring
- ✅ When a critical condition is detected (severe water stress, NDVI drop >15%)
- ✅ Then I receive a push notification on my phone
- ✅ And the notification title is clear (e.g., "🚨 Severe Water Stress")
- ✅ And the notification body is actionable (e.g., "Irrigate immediately")
- ✅ And when I tap the notification, the app opens to my field details
- ✅ And I see a red alert banner with details
- ✅ And I can mark the alert as "Done" or "Ignore"
- ✅ And the alert is delivered within 5 minutes of detection

**Priority:** Must Have (P0)  
**Story Points:** 5  
**Sprint:** Sprint 5 (Week 11-12)  
**Dependencies:** Push notification integration (Firebase), alert detection logic

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] Integration tests written (Firebase)
- [ ] Alert detection logic validated
- [ ] Tested on Android and iOS
- [ ] Notification delivery rate >90%
- [ ] User testing (10 farmers) - alerts received and understood

---

### 4.3 Epic: Yield Prediction

**Epic ID:** E-003  
**Epic Name:** Yield Prediction  
**Description:** As a farmer, I want to know how much I'll harvest so I can plan sales and finances.

---

#### Story: US-009 - View Yield Forecast

**User Story:**
> As a farmer, I want to see a prediction of my harvest quantity so I can plan my sales and negotiate better prices.

**Acceptance Criteria:**
- ✅ Given I have a field with sufficient health data (4+ NDVI measurements)
- ✅ When I view the field details
- ✅ Then I see a yield forecast section
- ✅ And I see the predicted yield (kg/hectare and total kg)
- ✅ And I see a confidence interval (e.g., 4,000-4,500 kg/ha)
- ✅ And I see the expected revenue (Rs.)
- ✅ And I see the estimated harvest date (days remaining)
- ✅ And I see a progress bar (current yield vs. optimal)
- ✅ And the prediction accuracy is ≥85% (MAPE <15%)
- ✅ And the prediction updates every 10 days

**Priority:** Must Have (P0)  
**Story Points:** 13  
**Sprint:** Sprint 3 (Week 7-8)  
**Dependencies:** Random Forest model trained, NDVI time series available

**Definition of Done:**
- [ ] Random Forest model trained (≥85% accuracy on validation set)
- [ ] Model deployed to production
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Tested with real NDVI data
- [ ] Accuracy validated (compare predictions to actual harvests)
- [ ] User testing (10 farmers) - 80%+ find prediction useful

---

#### Story: US-010 - Enter Actual Yield

**User Story:**
> As a farmer, I want to enter my actual harvest quantity so the system can improve its predictions and show me how accurate it was.

**Acceptance Criteria:**
- ✅ Given I have harvested my crop
- ✅ When I open the field details
- ✅ Then I see a prompt: "Harvest complete? Enter actual yield."
- ✅ And I can enter my actual yield (kg/hectare or total kg)
- ✅ And the system calculates prediction accuracy (e.g., "Our prediction was 92% accurate!")
- ✅ And the system stores my actual yield
- ✅ And the system uses my data to improve future predictions
- ✅ And I can view my yield history (current and previous seasons)

**Priority:** Should Have (P1)  
**Story Points:** 3  
**Sprint:** Sprint 5 (Week 11-12)  
**Dependencies:** Yield prediction feature (US-009)

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] Actual yield stored in database
- [ ] Accuracy calculation implemented (MAPE)
- [ ] Model retraining pipeline implemented (use actual yields)
- [ ] User testing (5 farmers) - easy to enter actual yield

---

### 4.4 Epic: Weather Intelligence

**Epic ID:** E-004  
**Epic Name:** Weather Intelligence  
**Description:** As a farmer, I want to see weather forecasts so I can plan my farm operations.

---

#### Story: US-011 - View 7-Day Weather Forecast

**User Story:**
> As a farmer, I want to see a 7-day weather forecast for my field location so I can plan irrigation, fertilizer application, and harvesting.

**Acceptance Criteria:**
- ✅ Given I am logged in
- ✅ When I tap the "Weather" tab
- ✅ Then I see the current weather (temperature, conditions, humidity, wind)
- ✅ And I see a 7-day forecast (daily cards with icons, high/low temp, rainfall)
- ✅ And the forecast is specific to my field location (10km resolution)
- ✅ And I can tap on a day to see hourly forecast
- ✅ And the forecast updates every 6 hours
- ✅ And the forecast loads within 3 seconds

**Priority:** Must Have (P0)  
**Story Points:** 5  
**Sprint:** Sprint 4 (Week 9-10)  
**Dependencies:** OpenWeatherMap API integration

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] Integration tests written (OpenWeatherMap API)
- [ ] Weather data cached (6-hour TTL)
- [ ] Tested on mobile and web
- [ ] Forecast accuracy validated (≥80% vs. actual weather)
- [ ] User testing (10 farmers) - 90%+ find forecast useful

---

#### Story: US-012 - Receive Weather Alerts

**User Story:**
> As a farmer, I want to be alerted about extreme weather (heavy rain, extreme heat) so I can protect my crop.

**Acceptance Criteria:**
- ✅ Given I have a field
- ✅ When extreme weather is forecasted (rain >50mm, temp >35°C, wind >40 km/h)
- ✅ Then I receive a push notification
- ✅ And the notification is timely (24-48 hours before event)
- ✅ And the notification includes impact and recommendation (e.g., "Heavy rain in 2 days. Delay fertilizer.")
- ✅ And I can tap the notification to see full forecast
- ✅ And I see the alert on the weather screen (red/yellow banner)

**Priority:** Must Have (P0)  
**Story Points:** 3  
**Sprint:** Sprint 5 (Week 11-12)  
**Dependencies:** Weather forecast (US-011), push notifications (Firebase)

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] Alert detection logic validated
- [ ] Tested with various weather scenarios
- [ ] Push notifications tested (Android, iOS)
- [ ] User testing (10 farmers) - alerts received and understood

---

### 4.5 Epic: Disaster Management

**Epic ID:** E-005  
**Epic Name:** Disaster Management  
**Description:** As a farmer, I want to assess crop damage after disasters so I can file insurance claims quickly.

---

#### Story: US-013 - Assess Flood Damage

**User Story:**
> As a farmer, I want to assess crop damage after a flood so I can quantify my losses and file an insurance claim.

**Acceptance Criteria:**
- ✅ Given my field was affected by a flood
- ✅ When I open the "Disaster Assessment" feature
- ✅ And I select disaster type: "Flood"
- ✅ And I select before/after dates
- ✅ Then the system compares satellite images
- ✅ And the system calculates damaged area (hectares, percentage)
- ✅ And the system classifies damage severity (severe, moderate, minor)
- ✅ And the system estimates yield loss (kg)
- ✅ And the system estimates financial loss (Rs.)
- ✅ And the analysis completes within 90 seconds
- ✅ And the damage detection accuracy is ≥80%

**Priority:** Should Have (P1)  
**Story Points:** 8  
**Sprint:** Sprint 6 (Week 13-14)  
**Dependencies:** NDVI calculation, satellite image comparison

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Damage detection algorithm validated (≥80% accuracy)
- [ ] Tested with real disaster events (historical data)
- [ ] User testing (5 farmers) - damage assessment matches ground truth

---

#### Story: US-014 - Generate Insurance Report

**User Story:**
> As a farmer, I want to generate a PDF report with satellite evidence so I can submit it to my insurance company.

**Acceptance Criteria:**
- ✅ Given I have completed a damage assessment
- ✅ When I click "Generate Report"
- ✅ Then the system creates a PDF report
- ✅ And the report includes before/after satellite images
- ✅ And the report includes damage statistics (area, percentage, severity)
- ✅ And the report includes financial loss calculation
- ✅ And the report includes SkyCrop certification
- ✅ And the report is <5 MB (shareable via WhatsApp)
- ✅ And I can share the report via WhatsApp or email
- ✅ And the report is generated within 10 seconds

**Priority:** Should Have (P1)  
**Story Points:** 5  
**Sprint:** Sprint 6 (Week 13-14)  
**Dependencies:** Damage assessment (US-013), PDF generation library

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] PDF template designed (professional, suitable for insurance)
- [ ] PDF generation tested (various damage scenarios)
- [ ] File size optimized (<5 MB)
- [ ] Sharing tested (WhatsApp, email)
- [ ] User testing (5 farmers) - report accepted by insurance companies

---

### 4.6 Epic: Administration

**Epic ID:** E-006  
**Epic Name:** Administration  
**Description:** As an admin, I want to manage users, publish content, and monitor system health.

---

#### Story: US-015 - Publish News Article

**User Story:**
> As an admin, I want to publish agricultural news articles so farmers stay informed about important updates.

**Acceptance Criteria:**
- ✅ Given I am logged in as admin
- ✅ When I navigate to "Content" → "News Articles"
- ✅ Then I can create a new article
- ✅ And I can enter title, category, summary, content (rich text)
- ✅ And I can upload a featured image (max 2 MB)
- ✅ And I can add tags
- ✅ And I can preview the article before publishing
- ✅ And I can publish immediately or schedule for later
- ✅ And I can optionally send push notification to users
- ✅ And the article is published within 5 minutes

**Priority:** Should Have (P1)  
**Story Points:** 8  
**Sprint:** Sprint 5 (Week 11-12)  
**Dependencies:** MongoDB, rich text editor, push notifications

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Rich text editor integrated (TinyMCE or Quill)
- [ ] Image upload implemented (S3)
- [ ] Article preview implemented
- [ ] Scheduled publishing implemented (cron job)
- [ ] Push notification integration tested
- [ ] Admin testing (can publish article in <5 minutes)

---

#### Story: US-016 - View User Analytics

**User Story:**
> As an admin, I want to view user analytics so I can understand how farmers are using SkyCrop and identify areas for improvement.

**Acceptance Criteria:**
- ✅ Given I am logged in as admin
- ✅ When I navigate to "Analytics" dashboard
- ✅ Then I see key metrics:
  - Total users, Active users (DAU, WAU, MAU)
  - Total fields mapped
  - Feature usage (% users using each feature)
  - User engagement (session duration, frequency)
- ✅ And I see charts (user growth, feature adoption, geographic distribution)
- ✅ And I can select date range for analytics
- ✅ And I can export data to CSV
- ✅ And the dashboard loads within 5 seconds

**Priority:** Should Have (P1)  
**Story Points:** 8  
**Sprint:** Sprint 6 (Week 13-14)  
**Dependencies:** Analytics data collection (MongoDB), charting library

**Definition of Done:**
- [ ] Code implemented and peer-reviewed
- [ ] Unit tests written
- [ ] Analytics data collection implemented (track events)
- [ ] Charts implemented (Recharts or Chart.js)
- [ ] Date range filtering implemented
- [ ] CSV export implemented
- [ ] Admin testing (dashboard loads <5 seconds, data accurate)

---

## 5. ACCEPTANCE CRITERIA

### 5.1 Feature-Level Acceptance Criteria

**Feature: User Authentication**
- ✅ User can sign up with Google OAuth in <1 minute
- ✅ User can sign up with email/password in <2 minutes
- ✅ Password reset link sent within 5 minutes
- ✅ Session persists for 30 days (remember me)
- ✅ Account locked after 5 failed login attempts
- ✅ All authentication events logged (security audit)

**Feature: Field Boundary Detection**
- ✅ AI detects boundary within 60 seconds
- ✅ Boundary detection accuracy ≥85% (IoU on validation set)
- ✅ User can manually adjust boundary (drag vertices)
- ✅ Area calculation accuracy ±5% of ground truth
- ✅ User can add up to 5 fields (Phase 1)

**Feature: Crop Health Monitoring**
- ✅ NDVI, NDWI, TDVI calculated from satellite imagery
- ✅ Health map displayed with color-coding (green/yellow/red)
- ✅ Health status classified (Excellent/Good/Fair/Poor)
- ✅ Health data updates every 5-7 days (Sentinel-2 revisit)
- ✅ NDVI correlation ≥90% with ground truth

**Feature: Recommendations**
- ✅ Water recommendations based on NDWI and weather
- ✅ Fertilizer recommendations based on NDVI and growth stage
- ✅ Recommendations clear and actionable (no jargon)
- ✅ Recommendations achieve 20-30% water savings (user-reported)
- ✅ Recommendations achieve 15-20% fertilizer cost savings (user-reported)

**Feature: Yield Prediction**
- ✅ Yield predicted using Random Forest model
- ✅ Prediction accuracy ≥85% (MAPE <15%)
- ✅ Confidence interval displayed (95%)
- ✅ Prediction updates every 10 days
- ✅ User can enter actual yield for accuracy tracking

**Feature: Weather Forecast**
- ✅ 7-day forecast displayed (temperature, rainfall, humidity)
- ✅ Forecast updates every 6 hours
- ✅ Extreme weather alerts sent as push notifications
- ✅ Forecast accuracy ≥80% (validated against actual weather)

**Feature: Disaster Assessment**
- ✅ Before/after satellite images compared
- ✅ Damaged area calculated (hectares, percentage)
- ✅ Financial loss estimated (Rs.)
- ✅ PDF report generated (<5 MB, <10 seconds)
- ✅ Damage detection accuracy ≥80%

**Feature: Mobile App**
- ✅ Cross-platform (Android 8+, iOS 13+)
- ✅ Feature parity with web app (core features)
- ✅ Push notifications working
- ✅ Offline mode (cached data, 30 days)
- ✅ App size <50 MB
- ✅ Crash rate <2%

**Feature: Admin Dashboard**
- ✅ Admin can publish news articles in <5 minutes
- ✅ Admin can view user analytics (real-time)
- ✅ Admin can manage users (suspend, delete)
- ✅ Admin can monitor system health (uptime, errors, API usage)

---

### 5.2 System-Level Acceptance Criteria

**Performance:**
- ✅ System uptime ≥99% (measured monthly)
- ✅ API response time <3 seconds (95th percentile)
- ✅ Web app load time <5 seconds on 3G
- ✅ Mobile app load time <3 seconds on 4G
- ✅ Map interactions smooth (60 FPS)

**Security:**
- ✅ All data encrypted in transit (TLS 1.3)
- ✅ Passwords hashed (bcrypt, 10 rounds)
- ✅ JWT tokens secure (HS256, 256-bit key)
- ✅ Security audit passed (OWASP Top 10)
- ✅ No P1 (critical) security vulnerabilities

**Usability:**
- ✅ User satisfaction ≥4.0/5.0 (NPS ≥40)
- ✅ Task success rate ≥80% (UAT)
- ✅ Onboarding completion rate ≥80%
- ✅ Feature adoption ≥70% (users using core features)

**Reliability:**
- ✅ Zero data loss incidents
- ✅ Daily backups successful (100% success rate)
- ✅ Disaster recovery tested (restore from backup <1 hour)

**Compatibility:**
- ✅ Web app works on Chrome, Firefox, Safari, Edge (latest 2 versions)
- ✅ Mobile app works on Android 8+ and iOS 13+
- ✅ System works on 3G networks (1 Mbps minimum)

**Quality:**
- ✅ Code coverage ≥80% (unit + integration tests)
- ✅ Zero linting errors (ESLint, Pylint)
- ✅ Code complexity <10 per function (cyclomatic complexity)
- ✅ All code peer-reviewed before merge

---

### 5.3 User Acceptance Test (UAT) Scenarios

**UAT-001: Farmer Onboarding**
- **Scenario:** New farmer signs up and maps first field
- **Steps:**
  1. Sign up with Google OAuth
  2. Complete interactive tutorial
  3. Add first field (tap map, AI detects boundary)
  4. View field health map
  5. Read water recommendation
- **Success Criteria:** 80% of test users complete all steps within 15 minutes

**UAT-002: Daily Field Check**
- **Scenario:** Farmer checks field health and recommendations
- **Steps:**
  1. Open app
  2. View field health map
  3. Read recommendations (water, fertilizer)
  4. Check weather forecast
  5. Mark recommendation as "Done"
- **Success Criteria:** 90% of test users complete all steps within 5 minutes

**UAT-003: Disaster Assessment**
- **Scenario:** Farmer assesses flood damage and generates report
- **Steps:**
  1. Open "Disaster Assessment"
  2. Select disaster type: Flood
  3. Select before/after dates
  4. View damage analysis
  5. Generate PDF report
  6. Share report via WhatsApp
- **Success Criteria:** 70% of test users complete all steps within 20 minutes

**UAT-004: Yield Prediction**
- **Scenario:** Farmer views yield forecast and plans sales
- **Steps:**
  1. Open field details
  2. View yield forecast
  3. Understand predicted yield and revenue
  4. Share forecast with buyer via WhatsApp
- **Success Criteria:** 80% of test users understand prediction and find it useful

**UAT-005: Admin Content Publishing**
- **Scenario:** Admin publishes news article
- **Steps:**
  1. Login to admin dashboard
  2. Create new article
  3. Enter title, content, image
  4. Preview article
  5. Publish article
  6. Verify article visible to users
- **Success Criteria:** Admin can publish article in <5 minutes

---

## 6. APPENDICES

### Appendix A: Use Case Priority Matrix

| **Use Case** | **Priority** | **User Value** | **Business Value** | **Technical Risk** | **Sprint** |
|--------------|--------------|----------------|-------------------|-------------------|-----------|
| UC-001: Register Account | P0 | High | High | Low | Sprint 1 |
| UC-002: Login | P0 | High | High | Low | Sprint 1 |
| UC-003: Reset Password | P0 | Medium | Medium | Low | Sprint 1 |
| UC-005: Add New Field | P0 | High | High | Medium | Sprint 2 |
| UC-006: Detect Boundary (AI) | P0 | High | High | High | Sprint 3 |
| UC-010: View Health Map | P0 | High | High | Low | Sprint 4 |
| UC-013: Receive Alerts | P0 | High | High | Medium | Sprint 5 |
| UC-014: Water Recommendations | P0 | High | High | Low | Sprint 4 |
| UC-017: Yield Forecast | P0 | High | High | High | Sprint 3 |
| UC-019: Weather Forecast | P0 | High | Medium | Low | Sprint 4 |
| UC-021: Disaster Assessment | P1 | Medium | High | Medium | Sprint 6 |
| UC-022: Insurance Report | P1 | Medium | High | Low | Sprint 6 |
| UC-026: Publish News | P1 | Low | Medium | Low | Sprint 5 |

---

### Appendix B: User Story Mapping

**Release 1 (MVP - Week 16):**

```
User Activities:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  Onboarding  │   Monitor    │  Get Advice  │   Predict    │
│              │   Health     │              │   Yield      │
└──────────────┴──────────────┴──────────────┴──────────────┘

User Tasks:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Sign Up      │ View Health  │ View Water   │ View Yield   │
│ Add Field    │ View Map     │ View Fert.   │ Enter Actual │
│ Tutorial     │ View Trends  │ Get Alerts   │ Share        │
└──────────────┴──────────────┴──────────────┴──────────────┘

User Stories (Priority):
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ P0 (Must)    │ P0 (Must)    │ P0 (Must)    │ P0 (Must)    │
│ US-001       │ US-005       │ US-006       │ US-009       │
│ US-002       │ US-008       │ US-007       │              │
│ US-003       │              │ US-011       │              │
│ US-004       │              │ US-012       │              │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ P1 (Should)  │ P1 (Should)  │ P1 (Should)  │ P1 (Should)  │
│              │              │              │ US-010       │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ P2 (Could)   │ P2 (Could)   │ P2 (Could)   │ P2 (Could)   │
│ Sinhala UI   │ Offline Mode │ SMS Alerts   │ Multi-Season │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Release 2 (Phase 2 - Month 6):**
- Disaster Assessment (US-013, US-014)
- Historical Trends (enhanced)
- Admin Dashboard (US-015, US-016)
- Sinhala Language Support

---

### Appendix C: Story Point Estimation Guide

**Story Points:** Fibonacci sequence (1, 2, 3, 5, 8, 13, 21)

**1 Point:** Trivial (1-2 hours)
- Example: Add "Forgot Password" link to login page

**2 Points:** Simple (2-4 hours)
- Example: Display user profile information

**3 Points:** Small (4-8 hours)
- Example: Implement password reset email

**5 Points:** Medium (1-2 days)
- Example: Implement weather forecast display

**8 Points:** Large (2-3 days)
- Example: Implement interactive map with field selection

**13 Points:** Very Large (3-5 days)
- Example: Train and deploy AI boundary detection model

**21 Points:** Epic (5+ days, should be split)
- Example: Complete mobile app (split into smaller stories)

---

### Appendix D: Definition of Done (DoD) Checklist

**For Every User Story:**
- [ ] Code implemented according to acceptance criteria
- [ ] Code peer-reviewed (1+ approver)
- [ ] Unit tests written (≥80% coverage for new code)
- [ ] Integration tests written (if applicable)
- [ ] Code passes linting checks (ESLint, Pylint)
- [ ] Code follows style guide (Airbnb JS, PEP 8 Python)
- [ ] Documentation updated (API docs, README, inline comments)
- [ ] Tested on target platforms (web: Chrome/Firefox/Safari, mobile: Android/iOS)
- [ ] Tested on target devices (low-end Android, iPhone)
- [ ] Tested on target networks (3G, 4G)
- [ ] Accessibility checked (keyboard navigation, screen reader - Phase 2)
- [ ] Performance validated (meets NFR targets)
- [ ] Security reviewed (no vulnerabilities)
- [ ] Merged to main branch
- [ ] Deployed to staging environment
- [ ] Product Owner approved (demo + acceptance)

**For Sprint:**
- [ ] All user stories meet Definition of Done
- [ ] Sprint goal achieved
- [ ] No P1 (critical) bugs remaining
- [ ] Sprint demo conducted (stakeholder approval)
- [ ] Sprint retrospective completed (lessons learned)
- [ ] Next sprint planned (backlog groomed)

**For Release (MVP):**
- [ ] All P0 features complete and tested
- [ ] System-level acceptance criteria met (performance, security, usability)
- [ ] User acceptance testing (UAT) passed (10 farmers, 80%+ success rate)
- [ ] Security audit passed (OWASP Top 10)
- [ ] Documentation complete (user guide, API docs, deployment guide)
- [ ] Deployed to production
- [ ] 50+ farmers onboarded
- [ ] Stakeholder sign-off (Project Sponsor, Product Manager)

---

### Appendix E: User Story Template

**User Story Format:**
```
As a [user role],
I want to [action/feature],
So that [benefit/value].
```

**Example:**
```
As a farmer,
I want to see a color-coded map of my field health,
So that I can quickly identify areas that need attention.
```

**Acceptance Criteria Format:**
```
Given [precondition/context],
When [action/trigger],
Then [expected outcome],
And [additional outcome],
And [additional outcome].
```

**Example:**
```
Given I have a field with health data,
When I open the field details screen,
Then I see a color-coded health map,
And I see my overall health score (0-100),
And I see my health status (Excellent/Good/Fair/Poor),
And the map loads within 3 seconds.
```

---

### Appendix F: Glossary

| **Term** | **Definition** |
|----------|----------------|
| **Actor** | Person or system that interacts with the system (Farmer, Admin, API) |
| **Use Case** | Description of how an actor uses the system to achieve a goal |
| **User Story** | Agile-format requirement from user perspective (As a... I want... So that...) |
| **Acceptance Criteria** | Testable conditions that must be met for a story to be considered complete |
| **Story Points** | Relative estimate of effort required to complete a user story (Fibonacci: 1, 2, 3, 5, 8, 13) |
| **Epic** | Large user story that can be broken down into smaller stories |
| **Sprint** | 2-week development iteration (Agile/Scrum) |
| **Definition of Done** | Checklist of criteria that must be met for a story/sprint/release to be complete |

---

## DOCUMENT APPROVAL

**Use Cases & User Stories Sign-Off:**

By signing below, the undersigned acknowledge that they have reviewed the Use Cases and User Stories and agree that they accurately represent the system functionality and user requirements.

| **Name** | **Role** | **Signature** | **Date** |
|----------|----------|---------------|----------|
| [Your Name] | Business Analyst | _________________ | __________ |
| [PM Name] | Product Manager | _________________ | __________ |
| [UX Name] | UX Lead | _________________ | __________ |
| [Dev Lead] | Technical Lead | _________________ | __________ |
| [Supervisor] | Project Sponsor | _________________ | __________ |

**Approval Decision:** ☐ APPROVED - Proceed to Design ☐ CONDITIONAL APPROVAL ☐ REJECTED

---

**END OF USE CASES & USER STORIES**

---

**Next Steps:**
1. ✅ Obtain approval from all stakeholders
2. ✅ Create Requirement Traceability Matrix (RTM)
3. ✅ Proceed to System Design Phase
4. ✅ Begin Sprint Planning (prioritize user stories)

**For Questions:**
Contact Business Analyst: [Your Email]

**Document Location:** `Doc/Requirements Analysis Phase/use_cases_and_user_stories.md`

---

*This document is confidential and intended for the development team and project stakeholders only.*