# LOW-LEVEL DESIGN (LLD)

## SkyCrop: Satellite-Based Paddy Field Management & Monitoring System

---

## DOCUMENT CONTROL

| **Item** | **Details** |
|----------|-------------|
| **Document Title** | Low-Level Design (LLD) |
| **Project Name** | SkyCrop - Intelligent Paddy Field Monitoring System |
| **Document Code** | SKYCROP-LLD-2025-001 |
| **Version** | 1.0 |
| **Date** | October 29, 2025 |
| **Prepared By** | Full Stack Developer |
| **Reviewed By** | System Architect, Technical Lead |
| **Approved By** | Project Sponsor, Product Manager |
| **Status** | Approved |
| **Confidentiality** | Internal - For Development Team |

---

## EXECUTIVE SUMMARY

### Purpose

This Low-Level Design (LLD) document provides implementation-ready specifications for the SkyCrop system. It includes detailed algorithms, pseudocode, class definitions, method signatures, database operations, and code examples that developers can directly translate into working code.

### Scope

This LLD covers:
- **Class Diagrams:** Detailed class structures with attributes and methods
- **Algorithms & Pseudocode:** Step-by-step implementation logic
- **Database Operations:** SQL queries, transactions, and optimizations
- **API Specifications:** Request/response validation schemas
- **Error Handling:** Exception handling for each operation
- **Code Examples:** Implementation samples in JavaScript/Python
- **Unit Test Specifications:** Test cases and mock data

### How to Use This Document

1. **For Developers:** Use class diagrams and pseudocode to implement features
2. **For Testers:** Use test specifications to create test cases
3. **For Reviewers:** Verify implementation matches design specifications
4. **For Maintainers:** Understand system internals for debugging and enhancements

---

## TABLE OF CONTENTS

1. [Authentication Module](#1-authentication-module)
2. [Field Management Module](#2-field-management-module)
3. [Satellite Processing Module](#3-satellite-processing-module)
4. [Health Monitoring Module](#4-health-monitoring-module)
5. [Recommendation Engine Module](#5-recommendation-engine-module)
6. [AI/ML Module](#6-aiml-module)
7. [Weather Service Module](#7-weather-service-module)
8. [Content Management Module](#8-content-management-module)
9. [Detailed Algorithms](#9-detailed-algorithms)
10. [Database Operations](#10-database-operations)
11. [API Implementation Details](#11-api-implementation-details)
12. [Frontend Component Logic](#12-frontend-component-logic)
13. [Security Implementation](#13-security-implementation)
14. [Performance Optimization](#14-performance-optimization)
15. [Testing Specifications](#15-testing-specifications)

---

## 1. AUTHENTICATION MODULE

### 1.1 Class Diagram

```javascript
/**
 * AuthService Class
 * Handles user authentication and authorization
 */
class AuthService {
  // Dependencies
  constructor(userRepository, jwtService, bcryptService, emailService, redisCache) {
    this.userRepository = userRepository;
    this.jwtService = jwtService;
    this.bcryptService = bcryptService;
    this.emailService = emailService;
    this.redisCache = redisCache;
  }

  // Public Methods
  async signup(email, password, name) { }
  async login(email, password) { }
  async logout(token) { }
  async refreshToken(oldToken) { }
  async forgotPassword(email) { }
  async resetPassword(token, newPassword) { }
  async verifyEmail(token) { }
  async googleOAuthCallback(code) { }

  // Private Methods
  async _hashPassword(password) { }
  async _verifyPassword(password, hash) { }
  async _generateJWT(userId, email, role) { }
  async _validateJWT(token) { }
  async _checkAccountLock(userId) { }
  async _incrementFailedAttempts(userId) { }
  async _resetFailedAttempts(userId) { }
}
```

### 1.2 Signup Algorithm

**Pseudocode:**
```
FUNCTION signup(email, password, name):
  // 1. Validate input
  IF NOT isValidEmail(email) THEN
    THROW ValidationError("Invalid email format")
  END IF
  
  IF password.length < 8 THEN
    THROW ValidationError("Password must be at least 8 characters")
  END IF
  
  // 2. Check if user exists
  existingUser = userRepository.findByEmail(email)
  IF existingUser EXISTS THEN
    THROW ConflictError("Email already registered")
  END IF
  
  // 3. Hash password
  passwordHash = bcrypt.hash(password, 10)  // 10 rounds
  
  // 4. Create user
  user = userRepository.create({
    email: email,
    password_hash: passwordHash,
    name: name,
    role: "farmer",
    auth_provider: "email",
    email_verified: FALSE,
    status: "active"
  })
  
  // 5. Generate email verification token
  verificationToken = generateRandomToken(32)
  redisCache.set("email-verify:" + verificationToken, user.user_id, 86400)  // 24 hours
  
  // 6. Send verification email
  emailService.sendVerificationEmail(email, verificationToken)
  
  // 7. Generate JWT token
  jwtToken = jwt.sign({
    user_id: user.user_id,
    email: user.email,
    role: user.role
  }, JWT_SECRET, { expiresIn: "30d" })
  
  // 8. Return user and token
  RETURN {
    user: { user_id, email, name, role },
    token: jwtToken,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  }
END FUNCTION
```

**Implementation:**
```javascript
// auth.service.js
class AuthService {
  async signup(email, password, name) {
    // 1. Validate input
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.redisCache.setex(
      `email-verify:${verificationToken}`,
      86400,  // 24 hours
      user.user_id
    );
    
    // 6. Send verification email
    await this.emailService.sendVerificationEmail(email, verificationToken);
    
    // 7. Generate JWT token
    const jwtToken = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // 8. Return user and token
    return {
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token: jwtToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }
}
```

### 1.3 Login Algorithm

**Pseudocode:**
```
FUNCTION login(email, password):
  // 1. Find user by email
  user = userRepository.findByEmail(email)
  IF user NOT EXISTS THEN
    THROW UnauthorizedError("Invalid credentials")
  END IF
  
  // 2. Check account lock
  lockKey = "account-lock:" + user.user_id
  isLocked = redisCache.get(lockKey)
  IF isLocked THEN
    THROW UnauthorizedError("Account locked. Try again in 30 minutes.")
  END IF
  
  // 3. Verify password
  isValidPassword = bcrypt.compare(password, user.password_hash)
  IF NOT isValidPassword THEN
    // Increment failed attempts
    failedKey = "failed-attempts:" + user.user_id
    attempts = redisCache.incr(failedKey)
    redisCache.expire(failedKey, 1800)  // 30 minutes
    
    IF attempts >= 5 THEN
      // Lock account
      redisCache.setex(lockKey, 1800, "locked")  // 30 minutes
      THROW UnauthorizedError("Account locked due to multiple failed attempts")
    END IF
    
    THROW UnauthorizedError("Invalid credentials")
  END IF
  
  // 4. Reset failed attempts
  redisCache.del("failed-attempts:" + user.user_id)
  
  // 5. Generate JWT token
  jwtToken = jwt.sign({
    user_id: user.user_id,
    email: user.email,
    role: user.role
  }, JWT_SECRET, { expiresIn: "30d" })
  
  // 6. Update last login
  userRepository.update(user.user_id, { last_login: NOW() })
  
  // 7. Log security event
  auditService.log({
    event_type: "login_success",
    user_id: user.user_id,
    ip_address: request.ip,
    user_agent: request.headers["user-agent"]
  })
  
  // 8. Return user and token
  RETURN {
    user: { user_id, email, name, role },
    token: jwtToken
  }
END FUNCTION
```

### 1.4 Password Hashing

**Algorithm: bcrypt with 10 rounds**

```javascript
// crypto.utils.js
class CryptoUtils {
  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  static async hashPassword(password) {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} - True if password matches
   */
  static async verifyPassword(password, hash) {
    const isValid = await bcrypt.compare(password, hash);
    return isValid;
  }
}
```

### 1.5 JWT Token Generation

**Algorithm:**
```javascript
// jwt.service.js
class JWTService {
  /**
   * Generate JWT token
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {string} role - User role
   * @returns {string} - JWT token
   */
  generateToken(userId, email, role) {
    const payload = {
      user_id: userId,
      email: email,
      role: role,
      iat: Math.floor(Date.now() / 1000),  // Issued at
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)  // Expires in 30 days
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: 'HS256'
    });
    
    return token;
  }

  /**
   * Validate JWT token
   * @param {string} token - JWT token
   * @returns {Object} - Decoded payload
   * @throws {Error} - If token is invalid or expired
   */
  validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256']
      });
      
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      } else {
        throw error;
      }
    }
  }
}
```

### 1.6 Database Operations

**SQL Queries:**

```sql
-- Create user
INSERT INTO users (
  user_id,
  email,
  password_hash,
  name,
  role,
  auth_provider,
  email_verified,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  $1,  -- email
  $2,  -- password_hash
  $3,  -- name
  'farmer',
  'email',
  FALSE,
  'active',
  NOW(),
  NOW()
) RETURNING user_id, email, name, role;

-- Find user by email
SELECT 
  user_id,
  email,
  password_hash,
  name,
  role,
  auth_provider,
  email_verified,
  status,
  last_login
FROM users
WHERE email = $1 AND status = 'active';

-- Update last login
UPDATE users
SET last_login = NOW(), updated_at = NOW()
WHERE user_id = $1;

-- Lock account (via Redis, not SQL)
-- Redis: SET account-lock:{user_id} "locked" EX 1800
```

---

## 2. FIELD MANAGEMENT MODULE

### 2.1 Class Diagram

```javascript
/**
 * FieldService Class
 * Manages field CRUD operations and boundary processing
 */
class FieldService {
  constructor(fieldRepository, aiService, satelliteService, cacheService) {
    this.fieldRepository = fieldRepository;
    this.aiService = aiService;
    this.satelliteService = satelliteService;
    this.cacheService = cacheService;
  }

  // Public Methods
  async createField(userId, location, name) { }
  async getField(fieldId, userId) { }
  async updateField(fieldId, userId, updates) { }
  async deleteField(fieldId, userId) { }
  async listFields(userId) { }
  async updateBoundary(fieldId, userId, boundary) { }

  // Private Methods
  async _validateLocation(location) { }
  async _validateBoundary(boundary) { }
  async _calculateArea(boundary) { }
  async _checkFieldLimit(userId) { }
  async _simplifyBoundary(boundary, tolerance) { }
}
```

### 2.2 Create Field Algorithm

**Pseudocode:**
```
FUNCTION createField(userId, location, name):
  // 1. Validate inputs
  IF NOT isValidLocation(location) THEN
    THROW ValidationError("Location must be within Sri Lanka")
  END IF
  
  IF name.length < 1 OR name.length > 50 THEN
    THROW ValidationError("Field name must be 1-50 characters")
  END IF
  
  // 2. Check user field limit
  userFields = fieldRepository.findByUserId(userId)
  IF userFields.length >= 5 THEN
    THROW BusinessError("Maximum 5 fields allowed per user")
  END IF
  
  // 3. Check duplicate name
  existingField = fieldRepository.findByUserIdAndName(userId, name)
  IF existingField EXISTS THEN
    THROW ConflictError("Field name already exists")
  END IF
  
  // 4. Retrieve satellite image
  satelliteImage = satelliteService.getImage(location, dateRange, bands)
  
  // 5. Detect boundary using AI
  boundaryResult = aiService.detectBoundary(satelliteImage, location)
  boundary = boundaryResult.boundary
  confidence = boundaryResult.confidence
  
  // 6. Simplify boundary (Douglas-Peucker algorithm)
  simplifiedBoundary = simplifyPolygon(boundary, tolerance=0.0001)
  
  // 7. Calculate area
  area = calculatePolygonArea(simplifiedBoundary)
  
  // 8. Validate area
  IF area < 0.1 OR area > 50 THEN
    THROW ValidationError("Field area must be between 0.1 and 50 hectares")
  END IF
  
  // 9. Calculate center point
  center = calculateCentroid(simplifiedBoundary)
  
  // 10. Store field
  field = fieldRepository.create({
    user_id: userId,
    name: name,
    boundary: simplifiedBoundary,
    area: area,
    center: center,
    status: "active"
  })
  
  // 11. Initiate health monitoring (async)
  queueHealthMonitoring(field.field_id)
  
  // 12. Return field
  RETURN field
END FUNCTION
```

### 2.3 Area Calculation (Shoelace Formula)

**Algorithm:**
```javascript
/**
 * Calculate polygon area using Shoelace formula
 * @param {Array} coordinates - Array of [lon, lat] coordinates
 * @returns {number} - Area in hectares
 */
function calculatePolygonArea(coordinates) {
  // 1. Convert to UTM projection for accurate area calculation
  const utmCoordinates = coordinates.map(coord => {
    return convertWGS84ToUTM(coord[0], coord[1]);
  });
  
  // 2. Apply Shoelace formula
  let area = 0;
  const n = utmCoordinates.length;
  
  for (let i = 0; i < n - 1; i++) {
    const x1 = utmCoordinates[i][0];
    const y1 = utmCoordinates[i][1];
    const x2 = utmCoordinates[i + 1][0];
    const y2 = utmCoordinates[i + 1][1];
    
    area += (x1 * y2) - (x2 * y1);
  }
  
  // Close the polygon
  const x1 = utmCoordinates[n - 1][0];
  const y1 = utmCoordinates[n - 1][1];
  const x2 = utmCoordinates[0][0];
  const y2 = utmCoordinates[0][1];
  area += (x1 * y2) - (x2 * y1);
  
  // 3. Calculate absolute area
  area = Math.abs(area) / 2;
  
  // 4. Convert square meters to hectares
  const areaInHectares = area / 10000;
  
  return areaInHectares;
}
```

**Pseudocode:**
```
FUNCTION calculatePolygonArea(coordinates):
  // Convert to UTM for accurate area calculation
  utmCoords = []
  FOR EACH coord IN coordinates DO
    utmCoord = convertWGS84ToUTM(coord.lon, coord.lat)
    utmCoords.APPEND(utmCoord)
  END FOR
  
  // Shoelace formula
  area = 0
  n = utmCoords.length
  
  FOR i = 0 TO n-2 DO
    x1 = utmCoords[i].x
    y1 = utmCoords[i].y
    x2 = utmCoords[i+1].x
    y2 = utmCoords[i+1].y
    
    area = area + (x1 * y2) - (x2 * y1)
  END FOR
  
  // Close polygon
  area = area + (utmCoords[n-1].x * utmCoords[0].y) - (utmCoords[0].x * utmCoords[n-1].y)
  
  // Absolute area in square meters
  area = ABS(area) / 2
  
  // Convert to hectares
  areaInHectares = area / 10000
  
  RETURN areaInHectares
END FUNCTION
```

### 2.4 Boundary Simplification (Douglas-Peucker Algorithm)

**Algorithm:**
```javascript
/**
 * Simplify polygon using Douglas-Peucker algorithm
 * @param {Array} points - Array of [lon, lat] points
 * @param {number} tolerance - Simplification tolerance (degrees)
 * @returns {Array} - Simplified points
 */
function douglasPeucker(points, tolerance) {
  if (points.length <= 2) {
    return points;
  }
  
  // Find point with maximum distance from line
  let maxDistance = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    // Recursive call
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);
    
    // Combine results (remove duplicate point at maxIndex)
    return left.slice(0, -1).concat(right);
  } else {
    // All points between start and end can be removed
    return [start, end];
  }
}

/**
 * Calculate perpendicular distance from point to line
 * @param {Array} point - [lon, lat]
 * @param {Array} lineStart - [lon, lat]
 * @param {Array} lineEnd - [lon, lat]
 * @returns {number} - Distance in degrees
 */
function perpendicularDistance(point, lineStart, lineEnd) {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const numerator = Math.abs(
    (y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1
  );
  const denominator = Math.sqrt(
    Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2)
  );
  
  return numerator / denominator;
}
```

### 2.5 Database Operations

```sql
-- Create field
INSERT INTO fields (
  field_id,
  user_id,
  name,
  boundary,
  area,
  center,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  $1,  -- user_id
  $2,  -- name
  ST_GeomFromGeoJSON($3),  -- boundary (GeoJSON)
  $4,  -- area
  ST_GeomFromGeoJSON($5),  -- center
  'active',
  NOW(),
  NOW()
) RETURNING 
  field_id,
  name,
  ST_AsGeoJSON(boundary) as boundary,
  area,
  ST_AsGeoJSON(center) as center,
  created_at;

-- Get field by ID
SELECT 
  f.field_id,
  f.user_id,
  f.name,
  ST_AsGeoJSON(f.boundary) as boundary,
  f.area,
  ST_AsGeoJSON(f.center) as center,
  f.status,
  f.created_at,
  f.updated_at
FROM fields f
WHERE f.field_id = $1 AND f.user_id = $2 AND f.status = 'active';

-- List user's fields
SELECT 
  f.field_id,
  f.name,
  ST_AsGeoJSON(f.boundary) as boundary,
  f.area,
  f.created_at,
  h.health_status,
  h.health_score,
  h.measurement_date
FROM fields f
LEFT JOIN LATERAL (
  SELECT health_status, health_score, measurement_date
  FROM health_records
  WHERE field_id = f.field_id
  ORDER BY measurement_date DESC
  LIMIT 1
) h ON true
WHERE f.user_id = $1 AND f.status = 'active'
ORDER BY f.created_at DESC;

-- Update field boundary
UPDATE fields
SET 
  boundary = ST_GeomFromGeoJSON($2),
  area = $3,
  updated_at = NOW()
WHERE field_id = $1 AND user_id = $4
RETURNING 
  field_id,
  ST_AsGeoJSON(boundary) as boundary,
  area;

-- Delete field (soft delete)
UPDATE fields
SET status = 'deleted', updated_at = NOW()
WHERE field_id = $1 AND user_id = $2;

-- Spatial query: Find fields within bounding box
SELECT 
  field_id,
  name,
  ST_AsGeoJSON(boundary) as boundary,
  area
FROM fields
WHERE ST_Intersects(
  boundary,
  ST_MakeEnvelope($1, $2, $3, $4, 4326)  -- minLon, minLat, maxLon, maxLat
)
AND status = 'active';
```

---

## 3. SATELLITE PROCESSING MODULE

### 3.1 Class Diagram

```javascript
/**
 * SatelliteService Class
 * Handles satellite image retrieval and preprocessing
 */
class SatelliteService {
  constructor(sentinelHubClient, cacheService, s3Client) {
    this.sentinelHubClient = sentinelHubClient;
    this.cacheService = cacheService;
    this.s3Client = s3Client;
  }

  // Public Methods
  async getImage(fieldId, dateRange, bands) { }
  async getCachedImage(fieldId, date) { }
  async preprocessImage(image, options) { }

  // Private Methods
  async _checkCache(cacheKey) { }
  async _downloadImage(bbox, date, bands) { }
  async _applyCloudMask(image) { }
  async _normalizeImage(image) { }
  async _cropToField(image, boundary) { }
  async _storeInCache(cacheKey, image, metadata) { }
}
```

### 3.2 Image Retrieval Algorithm

**Pseudocode:**
```
FUNCTION getImage(fieldId, dateRange, bands):
  // 1. Get field boundary
  field = fieldRepository.findById(fieldId)
  IF field NOT EXISTS THEN
    THROW NotFoundError("Field not found")
  END IF
  
  boundary = field.boundary
  bbox = calculateBoundingBox(boundary)
  
  // 2. Check cache
  cacheKey = "satellite:" + fieldId + ":" + dateRange.to
  cachedImage = cacheService.get(cacheKey)
  IF cachedImage EXISTS THEN
    RETURN cachedImage
  END IF
  
  // 3. Request from Sentinel Hub API
  TRY
    imageResponse = sentinelHubClient.process({
      bbox: bbox,
      time: dateRange,
      bands: bands,  // ["B04", "B08", "B11"]
      resolution: 10,  // meters
      format: "image/tiff"
    })
  CATCH RateLimitError
    // Use older cached image if available
    olderImage = cacheService.get("satellite:" + fieldId + ":*")
    IF olderImage EXISTS THEN
      RETURN olderImage
    ELSE
      THROW RateLimitError("Satellite API rate limit exceeded")
    END IF
  END TRY
  
  // 4. Check cloud cover
  cloudCover = calculateCloudCover(imageResponse.image)
  IF cloudCover > 20 THEN
    // Try to find older image with less cloud cover
    FOR date IN RANGE(dateRange.to - 60 days, dateRange.to) DO
      olderImage = getImage(fieldId, {from: date, to: date}, bands)
      IF olderImage.cloudCover <= 20 THEN
        RETURN olderImage
      END IF
    END FOR
    
    THROW DataQualityError("No cloud-free images available")
  END IF
  
  // 5. Preprocess image
  preprocessedImage = preprocessImage(imageResponse.image, {
    normalize: TRUE,
    crop: boundary
  })
  
  // 6. Store in cache
  metadata = {
    acquisition_date: imageResponse.date,
    cloud_cover: cloudCover,
    resolution: 10
  }
  cacheService.set(cacheKey, preprocessedImage, metadata, TTL=2592000)  // 30 days
  
  // 7. Store in S3 for long-term storage
  s3Client.upload("skycrop-satellite", cacheKey, preprocessedImage)
  
  // 8. Return image
  RETURN {
    image: preprocessedImage,
    metadata: metadata
  }
END FUNCTION
```

### 3.3 Cloud Masking Algorithm

**Algorithm:**
```javascript
/**
 * Apply cloud masking to satellite image
 * @param {Buffer} image - GeoTIFF image buffer
 * @returns {Object} - Masked image and cloud cover percentage
 */
async function applyCloudMask(image) {
  // 1. Load image bands
  const geotiff = await GeoTIFF.fromArrayBuffer(image);
  const tiffImage = await geotiff.getImage();
  const rasters = await tiffImage.readRasters();
  
  const blue = rasters[0];   // B02
  const green = rasters[1];  // B03
  const red = rasters[2];    // B04
  const nir = rasters[3];    // B08
  
  // 2. Calculate cloud mask using simple threshold
  // Clouds have high reflectance in all bands
  const width = tiffImage.getWidth();
  const height = tiffImage.getHeight();
  const cloudMask = new Uint8Array(width * height);
  let cloudPixels = 0;
  
  for (let i = 0; i < width * height; i++) {
    // Cloud detection: high reflectance in blue and low NDVI
    const ndvi = (nir[i] - red[i]) / (nir[i] + red[i] + 1e-10);
    const isCloud = (blue[i] > 0.3 && ndvi < 0.2);
    
    cloudMask[i] = isCloud ? 1 : 0;
    if (isCloud) cloudPixels++;
  }
  
  // 3. Calculate cloud cover percentage
  const cloudCover = (cloudPixels / (width * height)) * 100;
  
  // 4. Apply mask to image (set cloud pixels to NaN)
  for (let i = 0; i < width * height; i++) {
    if (cloudMask[i] === 1) {
      red[i] = NaN;
      nir[i] = NaN;
    }
  }
  
  return {
    maskedImage: { red, nir },
    cloudCover: cloudCover
  };
}
```

### 3.4 Image Normalization

**Algorithm:**
```javascript
/**
 * Normalize image pixel values to 0-1 range
 * @param {Array} band - Image band array
 * @returns {Array} - Normalized band
 */
function normalizeImageBand(band) {
  // 1. Find min and max values (excluding NaN)
  let min = Infinity;
  let max = -Infinity;
  
  for (let i = 0; i < band.length; i++) {
    if (!isNaN(band[i])) {
      if (band[i] < min) min = band[i];
      if (band[i] > max) max = band[i];
    }
  }
  
  // 2. Normalize to 0-1 range
  const normalized = new Float32Array(band.length);
  const range = max - min;
  
  for (let i = 0; i < band.length; i++) {
    if (isNaN(band[i])) {
      normalized[i] = NaN;
    } else {
      normalized[i] = (band[i] - min) / range;
    }
  }
  
  return normalized;
}
```

---

## 4. HEALTH MONITORING MODULE

### 4.1 Class Diagram

```javascript
/**
 * HealthService Class
 * Calculates vegetation indices and classifies crop health
 */
class HealthService {
  constructor(healthRepository, satelliteService, fieldRepository) {
    this.healthRepository = healthRepository;
    this.satelliteService = satelliteService;
    this.fieldRepository = fieldRepository;
  }

  // Public Methods
  async calculateHealth(fieldId) { }
  async getLatestHealth(fieldId) { }
  async getHealthHistory(fieldId, dateRange) { }
  async refreshHealth(fieldId) { }

  // Private Methods
  async _calculateNDVI(red, nir) { }
  async _calculateNDWI(nir, swir) { }
  async _calculateTDVI(ndvi) { }
  async _classifyHealthStatus(ndvi) { }
  async _calculateHealthScore(ndvi) { }
  async _determineTrend(currentNDVI, previousNDVI) { }
  async _extractFieldPixels(image, boundary) { }
}
```

### 4.2 NDVI Calculation Algorithm

**Formula:** NDVI = (NIR - Red) / (NIR + Red + ε)

**Pseudocode:**
```
FUNCTION calculateNDVI(fieldId):
  // 1. Get field boundary
  field = fieldRepository.findById(fieldId)
  boundary = field.boundary
  
  // 2. Retrieve satellite image
  satelliteImage = satelliteService.getImage(fieldId, dateRange, ["B04", "B08"])
  red = satelliteImage.bands.B04
  nir = satelliteImage.bands.B08
  
  // 3. Extract field pixels
  fieldPixels = extractFieldPixels(red, nir, boundary)
  
  // 4. Calculate NDVI for each pixel
  ndviArray = []
  FOR EACH pixel IN fieldPixels DO
    redValue = pixel.red
    nirValue = pixel.nir
    
    // Skip invalid pixels
    IF redValue IS NaN OR nirValue IS NaN THEN
      CONTINUE
    END IF
    
    // Calculate NDVI
    epsilon = 1e-10  // Prevent division by zero
    ndvi = (nirValue - redValue) / (nirValue + redValue + epsilon)
    
    // Clip to valid range [-1, 1]
    ndvi = CLIP(ndvi, -1, 1)
    
    ndviArray.APPEND(ndvi)
  END FOR
  
  // 5. Calculate statistics
  ndviMean = MEAN(ndviArray)
  ndviMin = MIN(ndviArray)
  ndviMax = MAX(ndviArray)
  ndviStd = STANDARD_DEVIATION(ndviArray)
  
  // 6. Return NDVI statistics
  RETURN {
    mean: ndviMean,
    min: ndviMin,
    max: ndviMax,
    std: ndviStd,
    raster: ndviArray  // For visualization
  }
END FUNCTION
```

**Implementation:**
```javascript
// health.service.js
class HealthService {
  /**
   * Calculate NDVI from satellite image
   * @param {string} fieldId - Field ID
   * @returns {Promise<Object>} - NDVI statistics
   */
  async calculateNDVI(fieldId) {
    // 1. Get field boundary
    const field = await this.fieldRepository.findById(fieldId);
    const boundary = field.boundary;
    
    // 2. Retrieve satellite image
    const satelliteImage = await this.satelliteService.getImage(
      fieldId,
      { from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), to: new Date() },
      ['B04', 'B08']  // Red, NIR
    );
    
    const red = satelliteImage.bands.B04;
    const nir = satelliteImage.bands.B08;
    
    // 3. Extract field pixels
    const fieldPixels = this._extractFieldPixels(red, nir, boundary);
    
    // 4. Calculate NDVI for each pixel
    const ndviArray = [];
    const epsilon = 1e-10;
    
    for (const pixel of fieldPixels) {
      const redValue = pixel.red;
      const nirValue = pixel.nir;
      
      // Skip invalid pixels
      if (isNaN(redValue) || isNaN(nirValue)) {
        continue;
      }
      
      // Calculate NDVI
      const ndvi = (nirValue - redValue) / (nirValue + redValue + epsilon);
      
      // Clip to valid range
      const clippedNDVI = Math.max(-1, Math.min(1, ndvi));
      
      ndviArray.push(clippedNDVI);
    }
    
    // 5. Calculate statistics
    const ndviMean = this._calculateMean(ndviArray);
    const ndviMin = Math.min(...ndviArray);
    const ndviMax = Math.max(...ndviArray);
    const ndviStd = this._calculateStdDev(ndviArray, ndviMean);
    
    // 6. Return NDVI statistics
    return {
      mean: ndviMean,
      min: ndviMin,
      max: ndviMax,
      std: ndviStd,
      raster: ndviArray
    };
  }

  /**
   * Calculate mean of array
   * @param {Array<number>} arr - Array of numbers
   * @returns {number} - Mean value
   */
  _calculateMean(arr) {
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
  }

  /**
   * Calculate standard deviation
   * @param {Array<number>} arr - Array of numbers
   * @param {number} mean - Mean value
   * @returns {number} - Standard deviation
   */
  _calculateStdDev(arr, mean) {
    const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
    const variance = this._calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }
}
```

### 4.3 NDWI Calculation Algorithm

**Formula:** NDWI = (NIR - SWIR) / (NIR + SWIR + ε)

```javascript
/**
 * Calculate NDWI (Normalized Difference Water Index)
 * @param {Array} nir - NIR band (B08)
 * @param {Array} swir - SWIR band (B11)
 * @returns {Object} - NDWI statistics
 */
function calculateNDWI(nir, swir) {
  const ndwiArray = [];
  const epsilon = 1e-10;
  
  for (let i = 0; i < nir.length; i++) {
    if (isNaN(nir[i]) || isNaN(swir[i])) {
      continue;
    }
    
    const ndwi = (nir[i] - swir[i]) / (nir[i] + swir[i] + epsilon);
    const clippedNDWI = Math.max(-1, Math.min(1, ndwi));
    
    ndwiArray.push(clippedNDWI);
  }
  
  return {
    mean: calculateMean(ndwiArray),
    min: Math.min(...ndwiArray),
    max: Math.max(...ndwiArray),
    std: calculateStdDev(ndwiArray)
  };
}
```

### 4.4 Health Classification Algorithm

**Pseudocode:**
```
FUNCTION classifyHealthStatus(ndviMean):
  IF ndviMean >= 0.8 THEN
    status = "excellent"
    score = 90 + (ndviMean - 0.8) * 50  // 90-100
  ELSE IF ndviMean >= 0.7 THEN
    status = "good"
    score = 70 + (ndviMean - 0.7) * 200  // 70-89
  ELSE IF ndviMean >= 0.5 THEN
    status = "fair"
    score = 50 + (ndviMean - 0.5) * 100  // 50-69
  ELSE
    status = "poor"
    score = ndviMean * 100  // 0-49
  END IF
  
  // Ensure score is in valid range
  score = CLIP(score, 0, 100)
  
  RETURN {
    status: status,
    score: ROUND(score)
  }
END FUNCTION
```

**Implementation:**
```javascript
/**
 * Classify health status based on NDVI
 * @param {number} ndviMean - Mean NDVI value
 * @returns {Object} - Health status and score
 */
function classifyHealthStatus(ndviMean) {
  let status, score;
  
  if (ndviMean >= 0.8) {
    status = 'excellent';
    score = 90 + (ndviMean - 0.8) * 50;
  } else if (ndviMean >= 0.7) {
    status = 'good';
    score = 70 + (ndviMean - 0.7) * 200;
  } else if (ndviMean >= 0.5) {
    status = 'fair';
    score = 50 + (ndviMean - 0.5) * 100;
  } else {
    status = 'poor';
    score = ndviMean * 100;
  }
  
  // Clip score to valid range
  score = Math.max(0, Math.min(100, score));
  
  return {
    status: status,
    score: Math.round(score)
  };
}
```

### 4.5 Trend Analysis Algorithm

**Pseudocode:**
```
FUNCTION determineTrend(currentNDVI, previousNDVI):
  IF previousNDVI IS NULL THEN
    RETURN "stable"  // No previous data
  END IF
  
  change = currentNDVI - previousNDVI
  changePercent = (change / previousNDVI) * 100
  
  IF changePercent > 5 THEN
    RETURN "improving"
  ELSE IF changePercent < -5 THEN
    RETURN "declining"
  ELSE
    RETURN "stable"
  END IF
END FUNCTION
```

### 4.6 Database Operations

```sql
-- Insert health record
INSERT INTO health_records (
  record_id,
  field_id,
  measurement_date,
  ndvi_mean,
  ndvi_min,
  ndvi_max,
  ndvi_std,
  ndwi_mean,
  ndwi_min,
  ndwi_max,
  ndwi_std,
  tdvi_mean,
  health_status,
  health_score,
  trend,
  satellite_image_id,
  cloud_cover,
  created_at
) VALUES (
  gen_random_uuid(),
  $1,  -- field_id
  $2,  -- measurement_date
  $3,  -- ndvi_mean
  $4,  -- ndvi_min
  $5,  -- ndvi_max
  $6,  -- ndvi_std
  $7,  -- ndwi_mean
  $8,  -- ndwi_min
  $9,  -- ndwi_max
  $10, -- ndwi_std
  $11, -- tdvi_mean
  $12, -- health_status
  $13, -- health_score
  $14, -- trend
  $15, -- satellite_image_id
  $16, -- cloud_cover
  NOW()
) RETURNING record_id, measurement_date;

-- Get latest health record
SELECT 
  record_id,
  field_id,
  measurement_date,
  ndvi_mean,
  ndvi_min,
  ndvi_max,
  ndvi_std,
  ndwi_mean,
  ndwi_min,
  ndwi_max,
  ndwi_std,
  tdvi_mean,
  health_status,
  health_score,
  trend,
  cloud_cover,
  created_at
FROM health_records
WHERE field_id = $1
ORDER BY measurement_date DESC
LIMIT 1;

-- Get health history (last 6 months)
SELECT 
  measurement_date,
  ndvi_mean,
  ndwi_mean,
  health_status,
  health_score,
  trend
FROM health_records
WHERE field_id = $1
  AND measurement_date >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY measurement_date ASC;

-- Calculate average health score for user's fields
SELECT 
  AVG(h.health_score) as avg_health_score,
  COUNT(DISTINCT h.field_id) as total_fields
FROM health_records h
INNER JOIN fields f ON h.field_id = f.field_id
WHERE f.user_id = $1
  AND h.measurement_date = (
    SELECT MAX(measurement_date)
    FROM health_records
    WHERE field_id = h.field_id
  );
```

---

## 5. RECOMMENDATION ENGINE MODULE

### 5.1 Class Diagram

```javascript
/**
 * RecommendationService Class
 * Generates water and fertilizer recommendations
 */
class RecommendationService {
  constructor(recommendationRepository, healthService, weatherService) {
    this.recommendationRepository = recommendationRepository;
    this.healthService = healthService;
    this.weatherService = weatherService;
  }

  // Public Methods
  async generateWaterRecommendation(fieldId, ndwi, weather) { }
  async generateFertilizerRecommendation(fieldId, ndvi, growthStage) { }
  async detectAlerts(fieldId, healthData) { }
  async getRecommendations(fieldId) { }
  async updateRecommendationStatus(recommendationId, status) { }

  // Private Methods
  async _analyzeWaterStress(ndwi) { }
  async _analyzeFertilizerNeed(ndvi, growthStage) { }
  async _identifyStressedZones(ndviRaster, threshold) { }
  async _calculateSavings(fullArea, stressedArea, resourceCost) { }
  async _formatRecommendation(type, analysis, zones, savings) { }
}
```

### 5.2 Water Recommendation Algorithm

**Pseudocode:**
```
FUNCTION generateWaterRecommendation(fieldId, ndwi, weather):
  // 1. Analyze water stress level
  waterStress = analyzeWaterStress(ndwi.mean)
  
  // 2. Check weather forecast
  rainForecast = weather.forecast.filter(day => day.date <= NOW() + 48 hours)
  totalRainfall = SUM(rainForecast.map(day => day.rainfall_amount))
  
  // 3. Determine recommendation
  IF ndwi.mean > 0.3 THEN
    recommendation = {
      action: "no_irrigation",
      description: "Soil moisture is adequate. No irrigation needed.",
      timing: null,
      priority: "low"
    }
  ELSE IF ndwi.mean >= 0.1 AND ndwi.mean <= 0.3 THEN
    IF totalRainfall > 20 THEN
      recommendation = {
        action: "no_irrigation",
        description: "Moderate water stress detected, but rain expected within 48 hours (" + totalRainfall + "mm). No irrigation needed.",
        timing: null,
        priority: "low"
      }
    ELSE
      recommendation = {
        action: "irrigate_soon",
        description: "Moderate water stress detected. Irrigate within 2-3 days.",
        timing: "2-3 days",
        priority: "medium"
      }
    END IF
  ELSE IF ndwi.mean < 0.1 THEN
    recommendation = {
      action: "irrigate_immediately",
      description: "Severe water stress detected (NDWI: " + ndwi.mean + "). Irrigate immediately to prevent crop damage.",
      timing: "immediate",
      priority: "critical"
    }
  END IF
  
  // 4. Identify stressed zones
  stressedZones = identifyStressedZones(ndwiRaster, threshold=0.2)
  stressedArea = calculateArea(stressedZones)
  
  // 5. Calculate water savings
  fullFieldArea = field.area
  waterPerHectare = 50  // mm
  waterSaved = (fullFieldArea - stressedArea) * waterPerHectare
  
  // 6. Format recommendation
  RETURN {
    type: "water",
    severity: recommendation.priority,
    title: recommendation.action,
    description: recommendation.description,
    action: "Apply " + (stressedArea * waterPerHectare) + "mm water to stressed zones",
    zones: stressedZones,
    estimated_savings: waterSaved + "mm water saved",
    timing: recommendation.timing
  }
END FUNCTION
```

**Implementation:**
```javascript
// recommendation.service.js
class RecommendationService {
  /**
   * Generate water recommendation based on NDWI and weather
   * @param {string} fieldId - Field ID
   * @param {Object} ndwi - NDWI statistics
   * @param {Object} weather - Weather forecast
   * @returns {Promise<Object>} - Water recommendation
   */
  async generateWaterRecommendation(fieldId, ndwi, weather) {
    // 1. Analyze water stress level
    const waterStress = this._analyzeWaterStress(ndwi.mean);
    
    // 2. Check weather forecast (next 48 hours)
    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const rainForecast = weather.forecast.filter(day => 
      new Date(day.date) <= twoDaysLater
    );
    const totalRainfall = rainForecast.reduce((sum, day) => 
      sum + day.rainfall_amount, 0
    );
    
    // 3. Determine recommendation
    let recommendation;
    
    if (ndwi.mean > 0.3) {
      recommendation = {
        action: 'no_irrigation',
        description: 'Soil moisture is adequate. No irrigation needed.',
        timing: null,
        priority: 'low'
      };
    } else if (ndwi.mean >= 0.1 && ndwi.mean <= 0.3) {
      if (totalRainfall > 20) {
        recommendation = {
          action: 'no_irrigation',
          description: `Moderate water stress detected, but rain expected within 48 hours (${totalRainfall.toFixed(1)}mm). No irrigation needed.`,
          timing: null,
          priority: 'low'
        };
      } else {
        recommendation = {
          action: 'irrigate_soon',
          description: 'Moderate water stress detected. Irrigate within 2-3 days.',
          timing: '2-3 days',
          priority: 'medium'
        };
      }
    } else {
      recommendation = {
        action: 'irrigate_immediately',
        description: `Severe water stress detected (NDWI: ${ndwi.mean.toFixed(2)}). Irrigate immediately to prevent crop damage.`,
        timing: 'immediate',
        priority: 'critical'
      };
    }
    
    // 4. Identify stressed zones
    const field = await this.fieldRepository.findById(fieldId);
    const stressedZones = this._identifyStressedZones(ndwi.raster, 0.2);
    const stressedArea = this._calculateArea(stressedZones);
    
    // 5. Calculate water savings
    const fullFieldArea = field.area;
    const waterPerHectare = 50;  // mm
    const waterSaved = (fullFieldArea - stressedArea) * waterPerHectare;
    
    // 6. Format and store recommendation
    const recommendationData = {
      field_id: fieldId,
      type: 'water',
      severity: recommendation.priority,
      title: recommendation.action.replace(/_/g, ' ').toUpperCase(),
      description: recommendation.description,
      action: `Apply ${(stressedArea * waterPerHectare).toFixed(0)}mm water to stressed zones`,
      zones: stressedZones,
      estimated_savings: `${waterSaved.toFixed(0)}mm water saved`,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7 days
      status: 'pending'
    };
    
    const savedRecommendation = await this.recommendationRepository.create(recommendationData);
    
    return savedRecommendation;
  }

  /**
   * Analyze water stress level
   * @param {number} ndwi - Mean NDWI value
   * @returns {string} - Water stress level
   */
  _analyzeWaterStress(ndwi) {
    if (ndwi > 0.3) return 'none';
    if (ndwi >= 0.1) return 'moderate';
    return 'severe';
  }
}
```

### 5.3 Fertilizer Recommendation Algorithm

**Pseudocode:**
```
FUNCTION generateFertilizerRecommendation(fieldId, ndvi, growthStage):
  // 1. Analyze vegetation health
  vegetationHealth = analyzeVegetationHealth(ndvi.mean)
  
  // 2. Determine fertilizer need based on NDVI and growth stage
  IF ndvi.mean > 0.75 THEN
    recommendation = {
      action: "no_fertilizer",
      description: "Vegetation is healthy. No fertilizer needed at this time.",
      priority: "low"
    }
  ELSE IF ndvi.mean >= 0.6 AND ndvi.mean <= 0.75 THEN
    IF growthStage == "vegetative" THEN
      recommendation = {
        action: "apply_nitrogen",
        description: "Moderate vegetation vigor. Apply nitrogen fertilizer to boost growth.",
        fertilizer_type: "Urea",
        application_rate: 30,  // kg/ha
        priority: "medium"
      }
    ELSE IF growthStage == "reproductive" THEN
      recommendation = {
        action: "apply_balanced",
        description: "Reproductive stage detected. Apply balanced NPK fertilizer.",
        fertilizer_type: "NPK (15-15-15)",
        application_rate: 20,  // kg/ha
        priority: "medium"
      }
    ELSE
      recommendation = {
        action: "no_fertilizer",
        description: "Maturity stage. No fertilizer needed.",
        priority: "low"
      }
    END IF
  ELSE IF ndvi.mean < 0.6 THEN
    recommendation = {
      action: "apply_nitrogen_urgent",
      description: "Low vegetation vigor detected (NDVI: " + ndvi.mean + "). Apply nitrogen fertilizer urgently. Also check for pests or diseases.",
      fertilizer_type: "Urea",
      application_rate: 50,  // kg/ha
      priority: "high"
    }
  END IF
  
  // 3. Identify low-vigor zones
  lowVigorZones = identifyStressedZones(ndviRaster, threshold=0.7)
  lowVigorArea = calculateArea(lowVigorZones)
  
  // 4. Calculate cost savings
  fullFieldArea = field.area
  fertilizerCostPerKg = 50  // LKR
  IF recommendation.action != "no_fertilizer" THEN
    targetedCost = lowVigorArea * recommendation.application_rate * fertilizerCostPerKg
    fullFieldCost = fullFieldArea * recommendation.application_rate * fertilizerCostPerKg
    costSavings = fullFieldCost - targetedCost
  ELSE
    costSavings = 0
  END IF
  
  // 5. Format recommendation
  RETURN {
    type: "fertilizer",
    severity: recommendation.priority,
    title: recommendation.action,
    description: recommendation.description,
    action: "Apply " + recommendation.application_rate + " kg/ha " + recommendation.fertilizer_type + " to low-vigor zones",
    zones: lowVigorZones,
    estimated_savings: "LKR " + costSavings + " saved"
  }
END FUNCTION
```

### 5.4 Alert Detection Algorithm

**Pseudocode:**
```
FUNCTION detectAlerts(fieldId, healthData):
  alerts = []
  
  // 1. Severe water stress alert
  IF healthData.ndwi.mean < 0.05 THEN
    alerts.APPEND({
      type: "water_stress",
      severity: "critical",
      title: "SEVERE WATER STRESS",
      description: "Critical water stress detected (NDWI: " + healthData.ndwi.mean + "). Immediate irrigation required to prevent crop failure.",
      action: "Irrigate immediately"
    })
  END IF
  
  // 2. Rapid NDVI decline alert
  previousHealth = healthRepository.getPreviousRecord(fieldId)
  IF previousHealth EXISTS THEN
    ndviChange = ((healthData.ndvi.mean - previousHealth.ndvi_mean) / previousHealth.ndvi_mean) * 100
    
    IF ndviChange < -15 THEN
      alerts.APPEND({
        type: "rapid_decline",
        severity: "high",
        title: "RAPID HEALTH DECLINE",
        description: "NDVI dropped by " + ABS(ndviChange) + "% in the last measurement. Investigate for pests, diseases, or nutrient deficiency.",
        action: "Inspect field immediately"
      })
    END IF
  END IF
  
  // 3. Extreme weather alert
  weather = weatherService.getForecast(field.location)
  FOR EACH day IN weather.forecast DO
    IF day.rainfall_amount > 50 THEN
      alerts.APPEND({
        type: "heavy_rain",
        severity: "high",
        title: "HEAVY RAIN EXPECTED",
        description: "Heavy rain expected on " + day.date + " (" + day.rainfall_amount + "mm). Ensure drainage channels are clear.",
        action: "Prepare drainage"
      })
    END IF
    
    IF day.temp_max > 35 THEN
      alerts.APPEND({
        type: "extreme_heat",
        severity: "medium",
        title: "EXTREME HEAT WARNING",
        description: "High temperature expected on " + day.date + " (" + day.temp_max + "°C). Monitor for heat stress.",
        action: "Ensure adequate irrigation"
      })
    END IF
  END FOR
  
  // 4. Store alerts as recommendations
  FOR EACH alert IN alerts DO
    recommendationRepository.create({
      field_id: fieldId,
      type: "alert",
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      action: alert.action,
      status: "pending"
    })
  END FOR
  
  RETURN alerts
END FUNCTION
```

### 5.5 Database Operations

```sql
-- Create recommendation
INSERT INTO recommendations (
  recommendation_id,
  field_id,
  type,
  severity,
  title,
  description,
  action,
  zones,
  estimated_savings,
  created_at,
  expires_at,
  status
) VALUES (
  gen_random_uuid(),
  $1,  -- field_id
  $2,  -- type
  $3,  -- severity
  $4,  -- title
  $5,  -- description
  $6,  -- action
  $7,  -- zones (JSONB)
  $8,  -- estimated_savings
  NOW(),
  $9,  -- expires_at
  'pending'
) RETURNING recommendation_id;

-- Get active recommendations for field
SELECT 
  recommendation_id,
  type,
  severity,
  title,
  description,
  action,
  zones,
  estimated_savings,
  created_at,
  expires_at,
  status
FROM recommendations
WHERE field_id = $1
  AND status = 'pending'
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  created_at DESC;

-- Update recommendation status
UPDATE recommendations
SET 
  status = $2,  -- 'done', 'ignored', 'expired'
  user_action_at = NOW()
WHERE recommendation_id = $1
RETURNING recommendation_id, status;

-- Get recommendation history
SELECT 
  recommendation_id,
  type,
  severity,
  title,
  created_at,
  status,
  user_action_at
FROM recommendations
WHERE field_id = $1
ORDER BY created_at DESC
LIMIT 50;
```

---

## 6. AI/ML MODULE

### 6.1 U-Net Boundary Detection Model

**Model Architecture:**

```python
# models/unet.py
import tensorflow as tf
from tensorflow.keras import layers, Model

class UNet:
    """
    U-Net model for field boundary detection
    Input: 256×256×4 (RGB + NIR)
    Output: 256×256×1 (binary mask)
    """
    
    def __init__(self, input_shape=(256, 256, 4)):
        self.input_shape = input_shape
        self.model = self._build_model()
    
    def _build_model(self):
        inputs = layers.Input(shape=self.input_shape)
        
        # Encoder (Downsampling path)
        # Block 1
        conv1 = layers.Conv2D(64, 3, activation='relu', padding='same')(inputs)
        conv1 = layers.Conv2D(64, 3, activation='relu', padding='same')(conv1)
        pool1 = layers.MaxPooling2D(pool_size=(2, 2))(conv1)
        
        # Block 2
        conv2 = layers.Conv2D(128, 3, activation='relu', padding='same')(pool1)
        conv2 = layers.Conv2D(128, 3, activation='relu', padding='same')(conv2)
        pool2 = layers.MaxPooling2D(pool_size=(2, 2))(conv2)
        
        # Block 3
        conv3 = layers.Conv2D(256, 3, activation='relu', padding='same')(pool2)
        conv3 = layers.Conv2D(256, 3, activation='relu', padding='same')(conv3)
        pool3 = layers.MaxPooling2D(pool_size=(2, 2))(conv3)
        
        # Block 4
        conv4 = layers.Conv2D(512, 3, activation='relu', padding='same')(pool3)
        conv4 = layers.Conv2D(512, 3, activation='relu', padding='same')(conv4)
        pool4 = layers.MaxPooling2D(pool_size=(2, 2))(conv4)
        
        # Bottleneck
        conv5 = layers.Conv2D(1024, 3, activation='relu', padding='same')(pool4)
        conv5 = layers.Conv2D(1024, 3, activation='relu', padding='same')(conv5)
        
        # Decoder (Upsampling path)
        # Block 6
        up6 = layers.UpSampling2D(size=(2, 2))(conv5)
        up6 = layers.Conv2D(512, 2, activation='relu', padding='same')(up6)
        merge6 = layers.concatenate([conv4, up6], axis=3)
        conv6 = layers.Conv2D(512, 3, activation='relu', padding='same')(merge6)
        conv6 = layers.Conv2D(512, 3, activation='relu', padding='same')(conv6)
        
        # Block 7
        up7 = layers.UpSampling2D(size=(2, 2))(conv6)
        up7 = layers.Conv2D(256, 2, activation='relu', padding='same')(up7)
        merge7 = layers.concatenate([conv3, up7], axis=3)
        conv7 = layers.Conv2D(256, 3, activation='relu', padding='same')(merge7)
        conv7 = layers.Conv2D(256, 3, activation='relu', padding='same')(conv7)
        
        # Block 8
        up8 = layers.UpSampling2D(size=(2, 2))(conv7)
        up8 = layers.Conv2D(128, 2, activation='relu', padding='same')(up8)
        merge8 = layers.concatenate([conv2, up8], axis=3)
        conv8 = layers.Conv2D(128, 3, activation='relu', padding='same')(merge8)
        conv8 = layers.Conv2D(128, 3, activation='relu', padding='same')(conv8)
        
        # Block 9
        up9 = layers.UpSampling2D(size=(2, 2))(conv8)
        up9 = layers.Conv2D(64, 2, activation='relu', padding='same')(up9)
        merge9 = layers.concatenate([conv1, up9], axis=3)
        conv9 = layers.Conv2D(64, 3, activation='relu', padding='same')(merge9)
        conv9 = layers.Conv2D(64, 3, activation='relu', padding='same')(conv9)
        
        # Output layer
        outputs = layers.Conv2D(1, 1, activation='sigmoid')(conv9)
        
        model = Model(inputs=inputs, outputs=outputs)
        
        return model
    
    def compile_model(self):
        """Compile model with loss and optimizer"""
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss=self._combined_loss,
            metrics=[self._iou_metric, 'accuracy']
        )
    
    def _combined_loss(self, y_true, y_pred):
        """Combined Binary Cross-Entropy + Dice Loss"""
        bce = tf.keras.losses.binary_crossentropy(y_true, y_pred)
        dice = self._dice_loss(y_true, y_pred)
        return bce + dice
    
    def _dice_loss(self, y_true, y_pred):
        """Dice loss for better boundary detection"""
        smooth = 1e-6
        y_true_f = tf.keras.backend.flatten(y_true)
        y_pred_f = tf.keras.backend.flatten(y_pred)
        intersection = tf.keras.backend.sum(y_true_f * y_pred_f)
        return 1 - (2. * intersection + smooth) / (
            tf.keras.backend.sum(y_true_f) + tf.keras.backend.sum(y_pred_f) + smooth
        )
    
    def _iou_metric(self, y_true, y_pred):
        """Intersection over Union metric"""
        smooth = 1e-6
        y_pred_binary = tf.cast(y_pred > 0.5, tf.float32)
        intersection = tf.keras.backend.sum(y_true * y_pred_binary)
        union = tf.keras.backend.sum(y_true) + tf.keras.backend.sum(y_pred_binary) - intersection
        return (intersection + smooth) / (union + smooth)
```

### 6.2 Boundary Detection Inference

**Pseudocode:**
```
FUNCTION detectBoundary(satelliteImage, location):
  // 1. Preprocess image
  preprocessedImage = preprocessImage(satelliteImage, {
    resize: (256, 256),
    normalize: TRUE,
    channels: ["R", "G", "B", "NIR"]
  })
  
  // 2. Load U-Net model
  model = loadModel("models/unet_v1.0.0.h5")
  
  // 3. Run inference
  mask = model.predict(preprocessedImage)
  
  // 4. Post-process mask
  // Apply threshold
  binaryMask = (mask > 0.5).astype(uint8)
  
  // Morphological operations
  kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
  binaryMask = cv2.morphologyEx(binaryMask, cv2.MORPH_CLOSE, kernel)
  binaryMask = cv2.morphologyEx(binaryMask, cv2.MORPH_OPEN, kernel)
  
  // 5. Extract contours
  contours = cv2.findContours(binaryMask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
  
  // Select largest contour
  largestContour = MAX(contours, key=cv2.contourArea)
  
  // 6. Simplify polygon (Douglas-Peucker)
  epsilon = 0.001 * cv2.arcLength(largestContour, TRUE)
  simplifiedContour = cv2.approxPolyDP(largestContour, epsilon, TRUE)
  
  // 7. Convert pixel coordinates to GPS coordinates
  gpsCoordinates = []
  FOR EACH point IN simplifiedContour DO
    gpsCoord = pixelToGPS(point, location, imageSize=(256, 256), realWorldSize=512)
    gpsCoordinates.APPEND(gpsCoord)
  END FOR
  
  // 8. Create GeoJSON polygon
  boundary = {
    "type": "Polygon",
    "coordinates": [gpsCoordinates]
  }
  
  // 9. Calculate confidence score
  confidence = MEAN(mask[binaryMask == 1])
  
  // 10. Return result
  RETURN {
    boundary: boundary,
    confidence: confidence,
    processing_time: elapsed_time
  }
END FUNCTION
```

**Implementation:**
```python
# services/boundary_detection.py
import cv2
import numpy as np
import tensorflow as tf
from shapely.geometry import Polygon

class BoundaryDetectionService:
    """Service for detecting field boundaries using U-Net"""
    
    def __init__(self, model_path='models/unet_v1.0.0.h5'):
        self.model = tf.keras.models.load_model(model_path, compile=False)
    
    def detect_boundary(self, satellite_image, location):
        """
        Detect field boundary from satellite image
        
        Args:
            satellite_image: numpy array (H, W, 4) - RGB + NIR
            location: dict with 'lat' and 'lon'
        
        Returns:
            dict with 'boundary', 'confidence', 'processing_time'
        """
        import time
        start_time = time.time()
        
        # 1. Preprocess image
        preprocessed = self._preprocess_image(satellite_image)
        
        # 2. Run inference
        mask = self.model.predict(np.expand_dims(preprocessed, axis=0))[0]
        
        # 3. Post-process mask
        binary_mask = self._postprocess_mask(mask)
        
        # 4. Extract polygon
        polygon = self._extract_polygon(binary_mask)
        
        # 5. Convert to GPS coordinates
        gps_coords = self._pixel_to_gps(polygon, location, image_size=256, real_world_size=512)
        
        # 6. Create GeoJSON
        boundary = {
            'type': 'Polygon',
            'coordinates': [gps_coords]
        }
        
        # 7. Calculate confidence
        confidence = float(np.mean(mask[binary_mask == 1]))
        
        processing_time = time.time() - start_time
        
        return {
            'boundary': boundary,
            'confidence': confidence,
            'processing_time': processing_time
        }
    
    def _preprocess_image(self, image):
        """Preprocess image for model input"""
        # Resize to 256×256
        resized = cv2.resize(image, (256, 256))
        
        # Normalize to 0-1
        normalized = resized.astype(np.float32) / 255.0
        
        return normalized
    
    def _postprocess_mask(self, mask):
        """Post-process prediction mask"""
        # Apply threshold
        binary_mask = (mask[:, :, 0] > 0.5).astype(np.uint8)
        
        # Morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel)
        binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
        
        return binary_mask
    
    def _extract_polygon(self, binary_mask):
        """Extract polygon from binary mask"""
        # Find contours
        contours, _ = cv2.findContours(
            binary_mask,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        # Select largest contour
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Simplify polygon (Douglas-Peucker)
        epsilon = 0.001 * cv2.arcLength(largest_contour, True)
        simplified = cv2.approxPolyDP(largest_contour, epsilon, True)
        
        # Convert to list of points
        points = simplified.reshape(-1, 2).tolist()
        
        return points
    
    def _pixel_to_gps(self, pixel_coords, center_location, image_size, real_world_size):
        """Convert pixel coordinates to GPS coordinates"""
        lat = center_location['lat']
        lon = center_location['lon']
        
        # Calculate degrees per pixel
        meters_per_degree_lat = 111320  # approximately
        meters_per_degree_lon = 111320 * np.cos(np.radians(lat))
        
        degrees_per_pixel_lat = (real_world_size / image_size) / meters_per_degree_lat
        degrees_per_pixel_lon = (real_world_size / image_size) / meters_per_degree_lon
        
        # Convert pixel coordinates to GPS
        gps_coords = []
        center_pixel = image_size / 2
        
        for pixel_x, pixel_y in pixel_coords:
            # Calculate offset from center
            offset_x = pixel_x - center_pixel
            offset_y = center_pixel - pixel_y  # Flip Y axis
            
            # Convert to GPS
            gps_lon = lon + (offset_x * degrees_per_pixel_lon)
            gps_lat = lat + (offset_y * degrees_per_pixel_lat)
            
            gps_coords.append([gps_lon, gps_lat])
        
        # Close polygon
        if gps_coords[0] != gps_coords[-1]:
            gps_coords.append(gps_coords[0])
        
        return gps_coords
```

### 6.3 Random Forest Yield Prediction

**Feature Engineering:**

```python
# services/yield_prediction.py
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

class YieldPredictionService:
    """Service for predicting crop yield using Random Forest"""
    
    def __init__(self, model_path='models/yield_rf_v1.0.0.pkl'):
        self.model = joblib.load(model_path)
    
    def predict_yield(self, field_data):
        """
        Predict crop yield
        
        Args:
            field_data: dict with NDVI history, weather, field info
        
        Returns:
            dict with predicted yield and confidence interval
        """
        # 1. Extract features
        features = self._extract_features(field_data)
        
        # 2. Run prediction
        predicted_yield = self.model.predict([features])[0]
        
        # 3. Calculate confidence interval (95%)
        predictions = [tree.predict([features])[0] for tree in self.model.estimators_]
        confidence_lower = np.percentile(predictions, 2.5)
        confidence_upper = np.percentile(predictions, 97.5)
        
        # 4. Estimate revenue
        price_per_kg = 50  # LKR
        predicted_revenue = predicted_yield * field_data['area'] * price_per_kg
        
        # 5. Estimate harvest date
        days_to_harvest = self._estimate_harvest_date(field_data['growth_stage'])
        harvest_date = pd.Timestamp.now() + pd.Timedelta(days=days_to_harvest)
        
        return {
            'predicted_yield_per_ha': float(predicted_yield),
            'predicted_total_yield': float(predicted_yield * field_data['area']),
            'confidence_interval': {
                'lower': float(confidence_lower),
                'upper': float(confidence_upper)
            },
            'expected_revenue': float(predicted_revenue),
            'harvest_date_estimate': harvest_date.strftime('%Y-%m-%d')
        }
    
    def _extract_features(self, field_data):
        """Extract 25 features for yield prediction"""
        features = []
        
        # NDVI time series features (last 60 days)
        ndvi_history = field_data['ndvi_history']
        features.append(np.mean(ndvi_history))      # ndvi_mean
        features.append(np.max(ndvi_history))       # ndvi_max
        features.append(np.min(ndvi_history))       # ndvi_min
        features.append(np.std(ndvi_history))       # ndvi_std
        features.append(self._calculate_trend(ndvi_history))  # ndvi_trend
        features.append(np.argmax(ndvi_history))    # ndvi_peak_day
        
        # Growth stage features
        features.append(np.mean(ndvi_history[:20]))   # vegetative_ndvi
        features.append(np.mean(ndvi_history[20:40])) # reproductive_ndvi
        features.append(np.mean(ndvi_history[40:]))   # maturity_ndvi
        
        # Weather features (last 30 days)
        weather = field_data['weather_history']
        features.append(np.sum(weather['rainfall']))      # total_rainfall
        features.append(np.mean(weather['temperature']))  # avg_temperature
        features.append(np.max(weather['temperature']))   # max_temperature
        features.append(np.mean(weather['humidity']))     # avg_humidity
        features.append(self._count_rainy_days(weather['rainfall']))  # rainy_days
        features.append(self._max_consecutive_dry_days(weather['rainfall']))  # drought_days
        
        # Field features
        features.append(field_data['area'])  # field_area
        features.append(len(ndvi_history))   # days_since_planting
        
        # Location features (district encoding)
        district_code = self._encode_district(field_data['location'])
        features.extend(district_code)  # 8 features (one-hot encoding for 8 districts)
        
        return features
    
    def _calculate_trend(self, series):
        """Calculate linear trend (slope)"""
        x = np.arange(len(series))
        y = np.array(series)
        slope = np.polyfit(x, y, 1)[0]
        return slope
    
    def _count_rainy_days(self, rainfall):
        """Count days with >1mm rain"""
        return np.sum(np.array(rainfall) > 1)
    
    def _max_consecutive_dry_days(self, rainfall):
        """Calculate maximum consecutive dry days"""
        max_dry = 0
        current_dry = 0
        
        for rain in rainfall:
            if rain < 1:
                current_dry += 1
                max_dry = max(max_dry, current_dry)
            else:
                current_dry = 0
        
        return max_dry
    
    def _encode_district(self, location):
        """One-hot encode district (8 districts in Sri Lanka)"""
        districts = ['Ampara', 'Anuradhapura', 'Batticaloa', 'Hambantota', 
                     'Kurunegala', 'Polonnaruwa', 'Puttalam', 'Trincomalee']
        
        # Determine district from lat/lon (simplified)
        district = self._get_district_from_location(location)
        
        # One-hot encode
        encoding = [1 if d == district else 0 for d in districts]
        
        return encoding
    
    def _estimate_harvest_date(self, growth_stage):
        """Estimate days to harvest based on growth stage"""
        if growth_stage == 'vegetative':
            return 60
        elif growth_stage == 'reproductive':
            return 30
        else:
            return 10
```

---

## 7. WEATHER SERVICE MODULE

### 7.1 Weather Forecast Retrieval

**Implementation:**
```javascript
// weather.service.js
class WeatherService {
  constructor(openWeatherMapClient, cacheService, fieldRepository) {
    this.openWeatherMapClient = openWeatherMapClient;
    this.cacheService = cacheService;
    this.fieldRepository = fieldRepository;
  }

  /**
   * Get 7-day weather forecast
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<Array>} - 7-day forecast
   */
  async getForecast(latitude, longitude) {
    // 1. Check cache
    const cacheKey = `weather:${latitude}:${longitude}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 2. Call OpenWeatherMap API
    const response = await this.openWeatherMapClient.get('/data/2.5/forecast/daily', {
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
    
    // 4. Detect extreme weather
    const alerts = this._detectExtremeWeather(forecast);
    
    // 5. Cache for 6 hours
    await this.cacheService.setex(cacheKey, 21600, JSON.stringify({
      forecast: forecast,
      alerts: alerts
    }));
    
    return {
      forecast: forecast,
      alerts: alerts
    };
  }

  /**
   * Detect extreme weather conditions
   * @param {Array} forecast - Weather forecast
   * @returns {Array} - Weather alerts
   */
  _detectExtremeWeather(forecast) {
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

## 8. CONTENT MANAGEMENT MODULE

### 8.1 Full-Text Search Implementation

**MongoDB Text Index:**
```javascript
// Create text index on news_articles collection
db.news_articles.createIndex({
  title: 'text',
  summary: 'text',
  content: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    summary: 5,
    content: 1,
    tags: 3
  },
  name: 'news_text_index'
});
```

**Search Implementation:**
```javascript
// news.service.js
class NewsService {
  constructor(newsRepository) {
    this.newsRepository = newsRepository;
  }

  /**
   * Search news articles
   * @param {string} query - Search query
   * @param {Object} filters - Category, tags filters
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<Object>} - Search results
   */
  async searchArticles(query, filters = {}, page = 1, limit = 20) {
    // 1. Build search query
    const searchQuery = {
      $text: { $search: query },
      status: 'published'
    };
    
    // Add category filter
    if (filters.category) {
      searchQuery.category = filters.category;
    }
    
    // Add tags filter
    if (filters.tags && filters.tags.length > 0) {
      searchQuery.tags = { $in: filters.tags };
    }
    
    // 2. Execute search with pagination
    const skip = (page - 1) * limit;
    
    const articles = await this.newsRepository.find(searchQuery)
      .select({
        title: 1,
        slug: 1,
        category: 1,
        summary: 1,
        featured_image: 1,
        author: 1,
        published_at: 1,
        views: 1,
        score: { $meta: 'textScore' }  // Relevance score
      })
      .sort({ score: { $meta: 'textScore' } })  // Sort by relevance
      .skip(skip)
      .limit(limit);
    
    // 3. Get total count
    const total = await this.newsRepository.countDocuments(searchQuery);
    
    // 4. Return results
    return {
      articles: articles,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        total_pages: Math.ceil(total / limit),
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1
      }
    };
  }
}
```

---

## 9. DETAILED ALGORITHMS

### 9.1 Shoelace Formula (Polygon Area)

**Mathematical Formula:**
```
Area = (1/2) * |Σ(x_i * y_(i+1) - x_(i+1) * y_i)|
```

**Pseudocode:**
```
FUNCTION calculatePolygonArea(coordinates):
  // coordinates: array of [lon, lat] pairs
  
  // Convert to UTM projection for accurate area
  utmCoords = convertToUTM(coordinates)
  
  area = 0
  n = utmCoords.length
  
  FOR i = 0 TO n-1 DO
    j = (i + 1) MOD n
    area = area + (utmCoords[i].x * utmCoords[j].y)
    area = area - (utmCoords[j].x * utmCoords[i].y)
  END FOR
  
  area = ABS(area) / 2
  
  // Convert square meters to hectares
  areaInHectares = area / 10000
  
  RETURN areaInHectares
END FUNCTION
```

### 9.2 Douglas-Peucker Algorithm (Polygon Simplification)

**Pseudocode:**
```
FUNCTION douglasPeucker(points, tolerance):
  IF points.length <= 2 THEN
    RETURN points
  END IF
  
  // Find point with maximum distance from line
  maxDistance = 0
  maxIndex = 0
  start = points[0]
  end = points[points.length - 1]
  
  FOR i = 1 TO points.length - 2 DO
    distance = perpendicularDistance(points[i], start, end)
    IF distance > maxDistance THEN
      maxDistance = distance
      maxIndex = i
    END IF
  END FOR
  
  // If max distance > tolerance, recursively simplify
  IF maxDistance > tolerance THEN
    left = douglasPeucker(points[0..maxIndex], tolerance)
    right = douglasPeucker(points[maxIndex..end], tolerance)
    
    // Combine results (remove duplicate at maxIndex)
    RETURN left[0..-2] + right
  ELSE
    // All points between start and end can be removed
    RETURN [start, end]
  END IF
END FUNCTION

FUNCTION perpendicularDistance(point, lineStart, lineEnd):
  x = point.x
  y = point.y
  x1 = lineStart.x
  y1 = lineStart.y
  x2 = lineEnd.x
  y2 = lineEnd.y
  
  numerator = ABS((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1)
  denominator = SQRT((y2 - y1)^2 + (x2 - x1)^2)
  
  RETURN numerator / denominator
END FUNCTION
```

---

## 10. DATABASE OPERATIONS

### 10.1 Complex Queries

**Query 1: Get field with latest health data**
```sql
SELECT 
  f.field_id,
  f.name,
  ST_AsGeoJSON(f.boundary) as boundary,
  f.area,
  h.ndvi_mean,
  h.health_status,
  h.health_score,
  h.measurement_date
FROM fields f
LEFT JOIN LATERAL (
  SELECT 
    ndvi_mean,
    health_status,
    health_score,
    measurement_date
  FROM health_records
  WHERE field_id = f.field_id
  ORDER BY measurement_date DESC
  LIMIT 1
) h ON true
WHERE f.user_id = $1 AND f.status = 'active'
ORDER BY f.created_at DESC;
```

**Query 2: Get health trends (6 months)**
```sql
SELECT 
  DATE_TRUNC('week', measurement_date) as week,
  AVG(ndvi_mean) as avg_ndvi,
  AVG(ndwi_mean) as avg_ndwi,
  AVG(health_score) as avg_health_score
FROM health_records
WHERE field_id = $1
  AND measurement_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('week', measurement_date)
ORDER BY week ASC;
```

**Query 3: Spatial query - Find nearby fields**
```sql
SELECT 
  f2.field_id,
  f2.name,
  ST_Distance(f1.center, f2.center) as distance_meters
FROM fields f1
CROSS JOIN fields f2
WHERE f1.field_id = $1
  AND f2.field_id != $1
  AND f2.status = 'active'
  AND ST_DWithin(f1.center, f2.center, 5000)  -- Within 5km
ORDER BY distance_meters ASC
LIMIT 10;
```

### 10.2 Transaction Management

**Example: Create field with initial health monitoring**
```javascript
// field.service.js
async createFieldWithHealthMonitoring(userId, fieldData) {
  const client = await this.pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // 1. Create field
    const fieldResult = await client.query(`
      INSERT INTO fields (field_id, user_id, name, boundary, area, center, status, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, ST_GeomFromGeoJSON($3), $4, ST_GeomFromGeoJSON($5), 'active', NOW(), NOW())
      RETURNING field_id, name, ST_AsGeoJSON(boundary) as boundary, area
    `, [userId, fieldData.name, JSON.stringify(fieldData.boundary), fieldData.area, JSON.stringify(fieldData.center)]);
    
    const field = fieldResult.rows[0];
    
    // 2. Create initial health record (placeholder)
    await client.query(`
      INSERT INTO health_records (record_id, field_id, measurement_date, health_status, created_at)
      VALUES (gen_random_uuid(), $1, CURRENT_DATE, 'pending', NOW())
    `, [field.field_id]);
    
    // 3. Commit transaction
    await client.query('COMMIT');
    
    // 4. Queue async health monitoring job
    await this.jobQueue.add('health-monitoring', { fieldId: field.field_id });
    
    return field;
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### 10.3 Index Optimization

**Indexes for Performance:**
```sql
-- Fields table indexes
CREATE INDEX idx_fields_user_status ON fields(user_id, status) WHERE status = 'active';
CREATE INDEX idx_fields_spatial_boundary ON fields USING GIST(boundary);
CREATE INDEX idx_fields_spatial_center ON fields USING GIST(center);

-- Health records indexes
CREATE INDEX idx_health_field_date ON health_records(field_id, measurement_date DESC);
CREATE INDEX idx_health_status ON health_records(health_status);
CREATE INDEX idx_health_covering ON health_records(field_id, measurement_date DESC) 
  INCLUDE (ndvi_mean, health_status, health_score);

-- Recommendations indexes
CREATE INDEX idx_recommendations_field_status ON recommendations(field_id, status, expires_at);
CREATE INDEX idx_recommendations_severity ON recommendations(severity, created_at DESC);

-- Users indexes
CREATE INDEX idx_users_email ON users(email) WHERE status = 'active';
CREATE INDEX idx_users_last_login ON users(last_login DESC);
```

---

## 11. API IMPLEMENTATION DETAILS

### 11.1 Request Validation (Joi Schemas)

**Field Creation Validation:**
```javascript
// validators/field.validator.js
const Joi = require('joi');

const createFieldSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Field name is required',
      'string.min': 'Field name must be at least 1 character',
      'string.max': 'Field name must not exceed 50 characters'
    }),
  
  location: Joi.object({
    lat: Joi.number()
      .min(5.9)
      .max(9.9)
      .required()
      .messages({
        'number.min': 'Latitude must be within Sri Lanka (5.9°N - 9.9°N)',
        'number.max': 'Latitude must be within Sri Lanka (5.9°N - 9.9°N)'
      }),
    
    lon: Joi.number()
      .min(79.5)
      .max(82.0)
      .required()
      .messages({
        'number.min': 'Longitude must be within Sri Lanka (79.5°E - 82.0°E)',
        'number.max': 'Longitude must be within Sri Lanka (79.5°E - 82.0°E)'
      })
  }).required()
});

const updateFieldSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(50)
    .optional(),
  
  boundary: Joi.object({
    type: Joi.string().valid('Polygon').required(),
    coordinates: Joi.array()
      .items(
        Joi.array().items(
          Joi.array().items(Joi.number()).length(2)
        )
      )
      .required()
  }).optional()
});

module.exports = {
  createFieldSchema,
  updateFieldSchema
};
```

### 11.2 Response Formatting

**Standard Response Format:**
```javascript
// utils/response.utils.js
class ResponseFormatter {
  /**
   * Format success response
   * @param {Object} data - Response data
   * @param {Object} meta - Metadata (optional)
   * @returns {Object} - Formatted response
   */
  static success(data, meta = {}) {
    return {
      success: true,
      data: data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    };
  }

  /**
   * Format error response
   * @param {string} code - Error code
   * @param {string} message - Error message
   * @param {Object} details - Error details (optional)
   * @returns {Object} - Formatted error response
   */
  static error(code, message, details = {}) {
    return {
      success: false,
      error: {
        code: code,
        message: message,
        details: details
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Format paginated response
   * @param {Array} data - Data array
   * @param {Object} pagination - Pagination info
   * @returns {Object} - Formatted paginated response
   */
  static paginated(data, pagination) {
    return {
      success: true,
      data: data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        total_pages: Math.ceil(pagination.total / pagination.limit),
        has_next: pagination.page < Math.ceil(pagination.total / pagination.limit),
        has_prev: pagination.page > 1
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = ResponseFormatter;
```

### 11.3 Error Handling

**Custom Error Classes:**
```javascript
// errors/custom-errors.js
class AppError extends Error {
  constructor(code, message, statusCode = 500, details = {}) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = {}) {
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

class ForbiddenError extends AppError {
  constructor(message) {
    super('FORBIDDEN', message, 403);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super('CONFLICT', message, 409);
  }
}

class BusinessError extends AppError {
  constructor(code, message, details = {}) {
    super(code, message, 422, details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BusinessError
};
```

**Error Handling Middleware:**
```javascript
// middleware/error.middleware.js
const { AppError } = require('../errors/custom-errors');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    code: err.code,
    user: req.user?.userId,
    endpoint: req.path,
    method: req.method,
    body: req.body
  });
  
  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: req.id
      }
    });
  }
  
  // Handle Joi validation errors
  if (err.isJoi) {
    const details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: details
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: req.id
      }
    });
  }
  
  // Handle Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_VALIDATION_ERROR',
        message: err.message,
        details: err.errors
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: req.id
      }
    });
  }
  
  // Handle unknown errors
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: req.id
    }
  });
}

module.exports = errorHandler;
```

---

## 12. FRONTEND COMPONENT LOGIC

### 12.1 Redux Slices

**Auth Slice:**
```javascript
// store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
```

### 12.2 React Query Hooks

**useFields Hook:**
```javascript
// hooks/useFields.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldService } from '../services/field.service';

export function useFields() {
  return useQuery({
    queryKey: ['fields'],
    queryFn: fieldService.getFields,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    cacheTime: 30 * 60 * 1000  // 30 minutes
  });
}

export function useField(fieldId) {
  return useQuery({
    queryKey: ['field', fieldId],
    queryFn: () => fieldService.getField(fieldId),
    enabled: !!fieldId,
    staleTime: 5 * 60 * 1000
  });
}

export function useCreateField() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: fieldService.createField,
    onSuccess: () => {
      // Invalidate and refetch fields list
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    }
  });
}

export function useUpdateField() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ fieldId, updates }) => fieldService.updateField(fieldId, updates),
    onSuccess: (data, variables) => {
      // Invalidate specific field and fields list
      queryClient.invalidateQueries({ queryKey: ['field', variables.fieldId] });
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    }
  });
}

export function useDeleteField() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: fieldService.deleteField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    }
  });
}
```

### 12.3 Form Validation (React Hook Form)

**Add Field Form:**
```javascript
// components/AddFieldForm.jsx
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';

const addFieldSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Field name is required',
      'string.max': 'Field name must not exceed 50 characters'
    }),
  
  location: Joi.object({
    lat: Joi.number()
      .min(5.9)
      .max(9.9)
      .required()
      .messages({
        'number.min': 'Location must be within Sri Lanka',
        'number.max': 'Location must be within Sri Lanka'
      }),
    
    lon: Joi.number()
      .min(79.5)
      .max(82.0)
      .required()
  }).required()
});

function AddFieldForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue
  } = useForm({
    resolver: joiResolver(addFieldSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="name">Field Name</label>
        <input
          id="name"
          type="text"
          {...register('name')}
          placeholder="e.g., Main Field"
        />
        {errors.name && (
          <span className="error">{errors.name.message}</span>
        )}
      </div>

      <div>
        <label>Location</label>
        <MapSelector
          onLocationSelect={(lat, lon) => {
            setValue('location.lat', lat);
            setValue('location.lon', lon);
          }}
        />
        {errors.location && (
          <span className="error">{errors.location.message}</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Field'}
      </button>
    </form>
  );
}
```

---

## 13. SECURITY IMPLEMENTATION

### 13.1 Input Sanitization

**SQL Injection Prevention:**
```javascript
// Always use parameterized queries
// ✅ Good
const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ Bad (SQL injection risk)
// const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

**XSS Prevention:**
```javascript
// utils/sanitize.utils.js
const sanitizeHtml = require('sanitize-html');

class SanitizeUtils {
  /**
   * Sanitize HTML content
   * @param {string} html - HTML content
   * @returns {string} - Sanitized HTML
   */
  static sanitizeHtmlContent(html) {
    return sanitizeHtml(html, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
      allowedAttributes: {
        'a': ['href', 'target']
      },
      allowedSchemes: ['http', 'https']
    });
  }

  /**
   * Sanitize user input (remove HTML tags)
   * @param {string} input - User input
   * @returns {string} - Sanitized input
   */
  static sanitizeInput(input) {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }
}

module.exports = SanitizeUtils;
```

### 13.2 Rate Limiting

**Implementation:**
```javascript
// middleware/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis.config');

// General API rate limit
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:api:'
  }),
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 1000,                  // 1000 requests per hour
  keyGenerator: (req) => req.user?.userId || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retry_after: 3600
      }
    });
  }
});

// Strict rate limit for authentication endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:auth:'
  }),
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests per 15 minutes
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please try again in 15 minutes.',
        retry_after: 900
      }
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
```

---

## 14. PERFORMANCE OPTIMIZATION

### 14.1 Database Query Optimization

**Use EXPLAIN ANALYZE:**
```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT 
  f.field_id,
  f.name,
  h.ndvi_mean,
  h.health_status
FROM fields f
LEFT JOIN LATERAL (
  SELECT ndvi_mean, health_status
  FROM health_records
  WHERE field_id = f.field_id
  ORDER BY measurement_date DESC
  LIMIT 1
) h ON true
WHERE f.user_id = 'uuid-123' AND f.status = 'active';

-- Expected output:
-- Seq Scan on fields f  (cost=0.00..100.00 rows=10 width=50) (actual time=0.05..0.10 rows=5 loops=1)
-- Planning Time: 0.5 ms
-- Execution Time: 1.2 ms
```

### 14.2 Caching Strategy

**Multi-Level Caching:**
```javascript
// services/cache.service.js
class CacheService {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  /**
   * Get from cache with fallback
   * @param {string} key - Cache key
   * @param {Function} fetchFunction - Function to fetch data if cache miss
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>} - Cached or fetched data
   */
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

  /**
   * Invalidate cache by pattern
   * @param {string} pattern - Cache key pattern (e.g., 'field:*')
   */
  async invalidate(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## 15. TESTING SPECIFICATIONS

### 15.1 Unit Test Examples

**Test: NDVI Calculation**
```javascript
// tests/unit/health.service.test.js
const { HealthService } = require('../../src/services/health.service');

describe('HealthService', () => {
  describe('calculateNDVI', () => {
    it('should calculate NDVI correctly', () => {
      const red = [0.1, 0.2, 0.3];
      const nir = [0.5, 0.6, 0.7];
      
      const result = HealthService._calculateNDVI(red, nir);
      
      expect(result.mean).toBeCloseTo(0.556, 2);
      expect(result.min).toBeCloseTo(0.429, 2);
      expect(result.max).toBeCloseTo(0.636, 2);
    });

    it('should handle division by zero', () => {
      const red = [0, 0, 0];
      const nir = [0, 0, 0];
      
      const result = HealthService._calculateNDVI(red, nir);
      
      expect(result.mean).toBe(0);
    });

    it('should clip values to [-1, 1] range', () => {
      const red = [-0.5, 0.2];
      const nir = [1.5, 0.6];
      
      const result = HealthService._calculateNDVI(red, nir);
      
      expect(result.min).toBeGreaterThanOrEqual(-1);
      expect(result.max).toBeLessThanOrEqual(1);
    });
  });
});
```

### 15.2 Integration Test Examples

**Test: Field Creation Flow**
```javascript
// tests/integration/field.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/fields', () => {
  let authToken;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.data.token;
  });

  it('should create a new field successfully', async () => {
    const response = await request(app)
      .post('/api/v1/fields')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Field',
        location: {
          lat: 7.94,
          lon: 81.01
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('field_id');
    expect(response.body.data.name).toBe('Test Field');
    expect(response.body.data).toHaveProperty('boundary');
    expect(response.body.data).toHaveProperty('area');
  });

  it('should reject invalid location', async () => {
    const response = await request(app)
      .post('/api/v1/fields')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Field',
        location: {
          lat: 50.0,  // Outside Sri Lanka
          lon: 81.01
        }
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject duplicate field name', async () => {
    // Create first field
    await request(app)
      .post('/api/v1/fields')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Duplicate Field',
        location: { lat: 7.94, lon: 81.01 }
      });

    // Try to create duplicate
    const response = await request(app)
      .post('/api/v1/fields')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Duplicate Field',
        location: { lat: 7.95, lon: 81.02 }
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });
});
```

### 15.3 Mock Data Structures

**Mock Field Data:**
```javascript
// tests/mocks/field.mock.js
const mockField = {
  field_id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Field',
  boundary: {
    type: 'Polygon',
    coordinates: [
      [
        [81.01, 7.93],
        [81.02, 7.93],
        [81.02, 7.94],
        [81.01, 7.94],
        [81.01, 7.93]
      ]
    ]
  },
  area: 2.1,
  center: {
    type: 'Point',
    coordinates: [81.015, 7.935]
  },
  status: 'active',
  created_at: '2025-10-29T12:00:00Z',
  updated_at: '2025-10-29T12:00:00Z'
};

const mockHealthRecord = {
  record_id: '123e4567-e89b-12d3-a456-426614174002',
  field_id: '123e4567-e89b-12d3-a456-426614174000',
  measurement_date: '2025-10-28',
  ndvi_mean: 0.75,
  ndvi_min: 0.45,
  ndvi_max: 0.88,
  ndvi_std: 0.12,
  ndwi_mean: 0.18,
  ndwi_min: 0.05,
  ndwi_max: 0.32,
  ndwi_std: 0.08,
  tdvi_mean: 0.87,
  health_status: 'good',
  health_score: 78,
  trend: 'improving',
  satellite_image_id: 'S2A_20251028',
  cloud_cover: 5.2,
  created_at: '2025-10-28T14:30:00Z'
};

module.exports = {
  mockField,
  mockHealthRecord
};
```

---

## DOCUMENT APPROVAL

**Low-Level Design Document Sign-Off:**

By signing below, the undersigned acknowledge that they have reviewed the Low-Level Design Document and agree that it provides implementation-ready specifications for the SkyCrop system.

| **Name** | **Role** | **Signature** | **Date** |
|----------|----------|---------------|----------|
| [Developer Name] | Full Stack Developer | _________________ | __________ |
| [Architect Name] | System Architect | _________________ | __________ |
| [Lead Name] | Technical Lead | _________________ | __________ |
| [PM Name] | Product Manager | _________________ | __________ |

**Approval Decision:** ☐ APPROVED - Proceed to Implementation ☐ CONDITIONAL APPROVAL ☐ REJECTED

---

## DOCUMENT HISTORY

| **Version** | **Date** | **Author** | **Changes** |
|-------------|----------|------------|-------------|
| 1.0 | Oct 29, 2025 | Full Stack Developer | Initial LLD document with all 8 modules |

---

**END OF LOW-LEVEL DESIGN DOCUMENT**

---

**Document Location:** `Doc/System Design Phase/low_level_design.md`

*This document is confidential and intended for the development team only.*