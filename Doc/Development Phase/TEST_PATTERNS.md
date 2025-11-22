# Test Patterns & Best Practices - Sprint 4 Guide

**Created**: November 21, 2025  
**Based on**: Sprint 3 Testing Experience (119 tests, 93% coverage)  
**Team**: Full Stack Development Team

---

## 🎯 Purpose

Document proven test patterns from Sprint 3 to maintain high quality and coverage across Sprint 4 (mobile & web).

---

## 📊 Sprint 3 Testing Summary

**What Worked:**
- ✅ Unit tests caught logic bugs early
- ✅ Integration tests validated API contracts
- ✅ E2E tests simulated real user workflows
- ✅ 93% backend coverage achieved
- ✅ 119 tests passing consistently

**What Didn't Work:**
- ❌ Initial test failures due to incorrect mocking
- ❌ Flaky tests due to shared test state
- ❌ Long test execution times (fixed with parallel execution)
- ❌ Some tests too brittle (tightly coupled to implementation)

---

## 🧪 Test Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /____\     - Full user flows
     /      \    - Selenium/Playwright/Detox
    /        \   
   /__________\  Integration Tests (30%)
  /            \ - API endpoints
 /              \- Service interactions
/________________\
  Unit Tests (60%)
  - Services
  - Utilities
  - Components
```

---

## 📋 Test Pattern Guidelines

### 1. Unit Tests (Backend)

#### ✅ Pattern: AAA (Arrange, Act, Assert)

```javascript
// tests/unit/healthMonitoring.service.test.js
const { HealthMonitoringService } = require('../../src/services/healthMonitoring.service');

describe('HealthMonitoringService', () => {
  let service;
  let mockHealthRepo;
  let mockFieldRepo;
  let mockNotificationService;

  beforeEach(() => {
    // ARRANGE - Set up mocks and service
    mockHealthRepo = {
      findByFieldAndDateRange: jest.fn(),
      getLatestRecord: jest.fn(),
    };
    mockFieldRepo = {
      findById: jest.fn(),
    };
    mockNotificationService = {
      sendHealthAlert: jest.fn(),
    };

    service = new HealthMonitoringService(
      mockHealthRepo,
      mockFieldRepo,
      mockNotificationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeFieldHealth', () => {
    it('should detect declining health trend', async () => {
      // ARRANGE
      const fieldId = 'field-1';
      const mockHealthRecords = [
        { measurement_date: '2024-03-01', ndvi_mean: 0.8, health_score: 85 },
        { measurement_date: '2024-03-15', ndvi_mean: 0.65, health_score: 70 },
        { measurement_date: '2024-03-30', ndvi_mean: 0.5, health_score: 55 },
      ];
      mockHealthRepo.findByFieldAndDateRange.mockResolvedValue(mockHealthRecords);
      mockFieldRepo.findById.mockResolvedValue({ field_id: fieldId, name: 'Test Field' });

      // ACT
      const result = await service.analyzeFieldHealth(fieldId, '2024-03-01', '2024-03-30');

      // ASSERT
      expect(result.trend).toBe('declining');
      expect(result.currentHealth.health_score).toBe(55);
      expect(mockNotificationService.sendHealthAlert).toHaveBeenCalledWith(
        expect.any(String),
        'Test Field',
        expect.stringContaining('declining'),
        'warning'
      );
    });

    it('should throw error when field not found', async () => {
      // ARRANGE
      mockFieldRepo.findById.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        service.analyzeFieldHealth('non-existent', '2024-01-01', '2024-01-31')
      ).rejects.toThrow('FIELD_NOT_FOUND');
    });
  });
});
```

#### 🎯 Key Principles:
1. **One assertion per test** (or closely related assertions)
2. **Descriptive test names** - "should [expected behavior] when [condition]"
3. **Mock external dependencies** - Don't hit real databases/APIs
4. **Reset mocks between tests** - `jest.clearAllMocks()` in `afterEach`
5. **Test both happy path and error cases**

---

### 2. Integration Tests (Backend API)

#### ✅ Pattern: Real HTTP Requests with Supertest

```javascript
// tests/integration/healthMonitoring.api.test.js
const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/database.config');
const User = require('../../src/models/user.model');
const Field = require('../../src/models/field.model');
const HealthRecord = require('../../src/models/health.model');

// Mock external services
jest.mock('../../src/services/notification.service');

describe('Health Monitoring API', () => {
  let authToken;
  let testUser;
  let testField;

  beforeAll(async () => {
    // Set up test database
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      user_id: 'test-user-1',
      email: 'test@example.com',
      password_hash: 'hashed',
      role: 'farmer',
      status: 'active',
    });

    // Create test field
    testField = await Field.create({
      field_id: 'test-field-1',
      user_id: testUser.user_id,
      name: 'Test Field',
      location: { type: 'Point', coordinates: [80.0, 7.0] },
      area: 1.5,
      crop_type: 'paddy',
      status: 'active',
    });

    // Create health records
    await HealthRecord.bulkCreate([
      { field_id: testField.field_id, measurement_date: '2024-03-01', ndvi_mean: 0.8, health_score: 85 },
      { field_id: testField.field_id, measurement_date: '2024-03-15', ndvi_mean: 0.75, health_score: 80 },
    ]);

    // Generate auth token
    authToken = 'mock-jwt-token'; // Or generate real JWT
  });

  afterEach(async () => {
    // Clean up database
    await HealthRecord.destroy({ where: {} });
    await Field.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/v1/fields/:fieldId/health/history', () => {
    it('should return health history for authenticated user', async () => {
      const response = await request(app)
        .get(`/api/v1/fields/${testField.field_id}/health/history?period=30d`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.items[0]).toMatchObject({
        ndvi_mean: expect.any(Number),
        health_score: expect.any(Number),
      });
    });

    it('should return 404 for non-existent field', async () => {
      const response = await request(app)
        .get('/api/v1/fields/non-existent/health/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FIELD_NOT_FOUND');
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .get(`/api/v1/fields/${testField.field_id}/health/history`)
        .expect(401);
    });
  });
});
```

#### 🎯 Key Principles:
1. **Test real HTTP endpoints** - Use `supertest`
2. **Set up test database** - Use `sync({ force: true })` or migrations
3. **Clean up after each test** - Ensure test isolation
4. **Test authentication/authorization** - Verify 401/403 responses
5. **Mock external services** - Don't call real OpenWeather, SendGrid, etc.

---

### 3. E2E Tests (Backend)

#### ✅ Pattern: Full User Workflow

```javascript
// tests/integration/e2e.real.test.js
describe('End-to-End Workflow Integration Tests', () => {
  it('should complete a full analysis workflow for a new field', async () => {
    // 1. Create user and field
    const user = await User.create(/* ... */);
    const field = await Field.create(/* ... */);

    // 2. Add health data
    await HealthRecord.bulkCreate(/* ... */);

    // 3. Trigger health analysis
    const healthResponse = await request(app)
      .post(`/api/v1/fields/${field.field_id}/health/compute`)
      .send({ startDate: '2024-01-01', endDate: '2024-03-01' })
      .expect(200);

    expect(healthResponse.body.data.trend).toBe('declining');

    // 4. Generate recommendations
    const recsResponse = await request(app)
      .post(`/api/v1/fields/${field.field_id}/recommendations/generate`)
      .expect(200);

    expect(recsResponse.body.data.recommendations.length).toBeGreaterThan(0);

    // 5. Predict yield
    const yieldResponse = await request(app)
      .post(`/api/v1/fields/${field.field_id}/yield/predict`)
      .send({ planting_date: '2023-11-01', crop_variety: 'BG 300', price_per_kg: 90 })
      .expect(200);

    expect(yieldResponse.body.data.predicted_yield_per_ha).toBeGreaterThan(0);

    // 6. Verify notifications sent
    expect(mockNotificationService.sendHealthAlert).toHaveBeenCalled();
    expect(mockNotificationService.sendRecommendation).toHaveBeenCalled();
    expect(mockNotificationService.sendYieldPrediction).toHaveBeenCalled();
  });
});
```

#### 🎯 Key Principles:
1. **Test complete user journeys** - Multiple API calls in sequence
2. **Verify side effects** - Check notifications, database state, etc.
3. **Use realistic data** - Mimic actual user behavior
4. **Test error recovery** - What happens when something fails?

---

### 4. Unit Tests (Frontend - React)

#### ✅ Pattern: React Testing Library

```typescript
// tests/components/FieldCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldCard } from '../../src/components/FieldCard';

describe('FieldCard', () => {
  const mockField = {
    id: 'field-1',
    name: 'Test Field',
    crop_type: 'paddy',
    area: 2.5,
    health_score: 75,
    last_updated: '2024-03-01T10:00:00Z',
  };

  it('should render field information', () => {
    render(<FieldCard field={mockField} />);

    expect(screen.getByText('Test Field')).toBeInTheDocument();
    expect(screen.getByText('paddy')).toBeInTheDocument();
    expect(screen.getByText('2.5 ha')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument(); // Health score
  });

  it('should show warning color for low health score', () => {
    const lowHealthField = { ...mockField, health_score: 45 };
    render(<FieldCard field={lowHealthField} />);

    const healthBadge = screen.getByTestId('health-badge');
    expect(healthBadge).toHaveClass('bg-warning');
  });

  it('should call onPress when card is clicked', () => {
    const mockOnPress = jest.fn();
    render(<FieldCard field={mockField} onPress={mockOnPress} />);

    fireEvent.click(screen.getByRole('button'));

    expect(mockOnPress).toHaveBeenCalledWith(mockField.id);
  });
});
```

#### 🎯 Key Principles:
1. **Test user interactions** - Click, type, etc.
2. **Query by user-visible text** - Not by implementation details
3. **Use `data-testid` sparingly** - Prefer semantic queries
4. **Mock API calls** - Use MSW or mock hooks
5. **Test accessibility** - Use `getByRole`, `getByLabelText`

---

### 5. Integration Tests (Frontend - API)

#### ✅ Pattern: Mock Service Worker (MSW)

```typescript
// tests/api/fieldsApi.test.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createFieldsApi } from '../../src/api/fieldsApi';
import { createApiClient } from '../../src/api/client';

const server = setupServer(
  rest.get('/api/v1/fields', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: [
          { id: 'field-1', name: 'Field A', crop_type: 'paddy' },
          { id: 'field-2', name: 'Field B', crop_type: 'wheat' },
        ],
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fieldsApi', () => {
  const apiClient = createApiClient();
  const fieldsApi = createFieldsApi(apiClient);

  it('should fetch all fields', async () => {
    const result = await fieldsApi.getAll();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('Field A');
  });

  it('should handle network errors', async () => {
    server.use(
      rest.get('/api/v1/fields', (req, res, ctx) => {
        return res.networkError('Failed to connect');
      })
    );

    await expect(fieldsApi.getAll()).rejects.toThrow('Network error');
  });
});
```

#### 🎯 Key Principles:
1. **Mock HTTP layer** - Use MSW, not axios mocks
2. **Test real API client** - Don't mock the client itself
3. **Test error handling** - Network errors, 4xx, 5xx responses
4. **Verify request details** - Headers, query params, body

---

### 6. E2E Tests (Frontend - Playwright)

#### ✅ Pattern: Full User Flow

```typescript
// e2e/field-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Field Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new field', async ({ page }) => {
    // Navigate to fields page
    await page.click('text=Fields');
    await expect(page).toHaveURL('/fields');

    // Click "Add Field" button
    await page.click('text=Add Field');

    // Fill out form
    await page.fill('[name="name"]', 'E2E Test Field');
    await page.selectOption('[name="crop_type"]', 'paddy');
    await page.fill('[name="area"]', '2.5');

    // Select location on map (simulate)
    await page.click('[data-testid="map-picker"]');
    // ... map interactions ...

    // Submit form
    await page.click('button[type="submit"]');

    // Verify field appears in list
    await expect(page.locator('text=E2E Test Field')).toBeVisible();
  });

  test('should view field health history', async ({ page }) => {
    // Navigate to field detail
    await page.click('text=Fields');
    await page.click('text=Test Field');

    // Check health chart is visible
    await expect(page.locator('[data-testid="health-chart"]')).toBeVisible();

    // Verify chart data
    const chartData = await page.locator('.recharts-line-curve').count();
    expect(chartData).toBeGreaterThan(0);
  });
});
```

#### 🎯 Key Principles:
1. **Test real user workflows** - From login to goal completion
2. **Use real browser** - Not jsdom
3. **Wait for elements** - Use `waitForSelector`, `waitForURL`
4. **Take screenshots on failure** - Playwright does this automatically
5. **Test across browsers** - Chrome, Firefox, Safari

---

## 🔧 Test Utilities & Helpers

### 1. Test Database Setup

```javascript
// tests/utils/testDb.js
const { sequelize } = require('../../src/config/database.config');

async function setupTestDb() {
  await sequelize.sync({ force: true });
}

async function teardownTestDb() {
  await sequelize.close();
}

async function clearTestDb() {
  const models = Object.values(sequelize.models);
  for (const model of models) {
    await model.destroy({ where: {}, force: true });
  }
}

module.exports = { setupTestDb, teardownTestDb, clearTestDb };
```

### 2. Test Data Factories

```javascript
// tests/factories/user.factory.js
const User = require('../../src/models/user.model');

let userCounter = 0;

async function createTestUser(overrides = {}) {
  userCounter++;
  return await User.create({
    user_id: `test-user-${userCounter}`,
    email: `test${userCounter}@example.com`,
    password_hash: 'hashedpassword',
    first_name: 'Test',
    last_name: 'User',
    role: 'farmer',
    status: 'active',
    ...overrides,
  });
}

module.exports = { createTestUser };
```

### 3. Custom Matchers

```javascript
// tests/utils/customMatchers.js
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
    };
  },
});
```

---

## 📝 Test Naming Conventions

### Good Test Names:
- ✅ `should return 200 and field data when authenticated`
- ✅ `should throw FIELD_NOT_FOUND when field does not exist`
- ✅ `should detect declining trend when NDVI drops by >20%`
- ✅ `should trigger health alert notification for critical health`

### Bad Test Names:
- ❌ `test1`
- ❌ `it works`
- ❌ `getFieldHealthHistory test`
- ❌ `should work correctly` (too vague)

---

## 🚫 Anti-Patterns to Avoid

### 1. Testing Implementation Details
```javascript
// ❌ BAD - Test knows too much about internal state
expect(service.internalCounter).toBe(5);
expect(service._cache).toHaveProperty('field-1');

// ✅ GOOD - Test observable behavior
expect(await service.getFieldHealth('field-1')).toMatchObject({ health_score: 85 });
```

### 2. Shared Test State
```javascript
// ❌ BAD - Tests affect each other
let sharedField;

test('create field', () => {
  sharedField = createField();
});

test('update field', () => {
  updateField(sharedField); // Depends on previous test!
});

// ✅ GOOD - Each test is independent
test('create field', () => {
  const field = createField();
  expect(field).toBeDefined();
});

test('update field', () => {
  const field = createField(); // Create fresh
  updateField(field);
});
```

### 3. Overly Brittle Assertions
```javascript
// ❌ BAD - Fails if response structure changes slightly
expect(response.body).toEqual({
  success: true,
  data: {
    field_id: 'field-1',
    name: 'Test',
    created_at: '2024-03-01T10:00:00.000Z', // Exact timestamp!
    updated_at: '2024-03-01T10:00:00.000Z',
    // ... 20 more fields
  },
  meta: { timestamp: '2024-03-01T10:00:00.000Z' },
});

// ✅ GOOD - Test what matters
expect(response.body).toMatchObject({
  success: true,
  data: {
    field_id: 'field-1',
    name: 'Test',
  },
});
expect(response.body.data.created_at).toBeDefined();
```

### 4. Not Cleaning Up
```javascript
// ❌ BAD - Leaves test data in database
afterEach(() => {
  // Nothing!
});

// ✅ GOOD - Clean up after each test
afterEach(async () => {
  await HealthRecord.destroy({ where: {} });
  await Field.destroy({ where: {} });
  await User.destroy({ where: {} });
  jest.clearAllMocks();
});
```

---

## 🎯 Sprint 4 Testing Strategy

### Mobile App (React Native)
- **Unit Tests**: 60+ tests (components, hooks, utilities)
- **Integration Tests**: 15+ tests (API integration, navigation)
- **E2E Tests**: 10+ tests (Detox - full user flows)
- **Target Coverage**: >70%

### Web Dashboard (React)
- **Unit Tests**: 80+ tests (components, hooks, utilities)
- **Integration Tests**: 20+ tests (API integration, routing)
- **E2E Tests**: 15+ tests (Playwright - full user flows)
- **Target Coverage**: >75%

### Backend Enhancements (WebSocket, Multi-user)
- **Unit Tests**: 20+ tests (new services, middleware)
- **Integration Tests**: 10+ tests (WebSocket, user management APIs)
- **E2E Tests**: 5+ tests (real-time workflows)
- **Target Coverage**: >90%

---

## 📚 Testing Tools Reference

### Backend
- **Jest**: Test runner, assertions, mocks
- **Supertest**: HTTP integration testing
- **Nock**: HTTP mocking (alternative to MSW for Node)
- **Sinon**: Spies, stubs, mocks (alternative to Jest mocks)

### Frontend (Web)
- **Vitest**: Fast test runner for Vite projects
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **MSW**: Mock Service Worker for API mocking

### Mobile
- **Jest**: Test runner (React Native preset)
- **React Native Testing Library**: Component testing
- **Detox**: E2E testing for React Native
- **Firebase Test Lab**: Real device testing (optional)

---

## 🎉 Summary

**Key Takeaways:**
1. **Follow AAA pattern**: Arrange, Act, Assert
2. **Test behavior, not implementation**
3. **Keep tests independent** - No shared state
4. **Mock external dependencies** - Databases, APIs, services
5. **Clean up after tests** - Reset state, clear mocks
6. **Write descriptive test names** - "should X when Y"
7. **Aim for high coverage** - But don't chase 100%
8. **Run tests frequently** - On every commit

**Remember**: Good tests are an investment. They catch bugs early, enable refactoring, and serve as living documentation! 💪

---

**Sprint 4 Goal: Maintain >70% coverage across all platforms!** 🎯

