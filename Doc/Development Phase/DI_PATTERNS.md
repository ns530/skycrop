# Dependency Injection Patterns - Sprint 4 Guide

**Created**: November 21, 2025  
**Based on**: Sprint 3 Retrospective Learnings  
**Team**: Full Stack Development Team

---

## 🎯 Purpose

This guide documents Dependency Injection (DI) patterns learned from Sprint 3 to ensure consistent, testable, and maintainable code across Sprint 4 (mobile & web).

---

## 🔥 Sprint 3 Lessons Learned

### Problem Encountered
During Sprint 3 integration testing, we faced issues where:
- Services were instantiated directly in routes using `new ServiceClass()`
- Mocking dependencies in tests was difficult
- Services had tight coupling to concrete implementations
- Tests had to mock internal implementation details

### Solution Adopted
- **Factory Functions**: Use singleton factory functions for services
- **Constructor Injection**: Pass dependencies via constructor
- **Interface Segregation**: Depend on abstractions, not concrete classes

---

## 📋 DI Pattern Guidelines

### 1. Backend Services (Node.js/Express)

#### ✅ DO: Use Factory Functions

```javascript
// src/services/notification.service.js
class NotificationService {
  constructor(emailService, pushService, userModel, deviceTokenModel) {
    this.emailService = emailService;
    this.pushService = pushService;
    this.User = userModel;
    this.DeviceToken = deviceTokenModel;
  }

  async sendHealthAlert(userId, fieldName, message, severity) {
    // Implementation...
  }
}

// Singleton factory
let notificationServiceInstance = null;

function getNotificationService() {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService(
      getEmailService(),
      getPushNotificationService(),
      require('../models/user.model'),
      require('../models/deviceToken.model')
    );
  }
  return notificationServiceInstance;
}

module.exports = { NotificationService, getNotificationService };
```

#### ✅ DO: Use Dependency Injection in Routes

```javascript
// src/api/routes/healthMonitoring.routes.js
const { getHealthMonitoringService } = require('../../services/healthMonitoring.service');
const { getNotificationService } = require('../../services/notification.service');

const healthService = getHealthMonitoringService();
const notificationService = getNotificationService();

router.get('/fields/:fieldId/health/history', async (req, res, next) => {
  const result = await healthService.getFieldHealthHistory(/* ... */);
  res.json(result);
});
```

#### ❌ DON'T: Instantiate Services Directly

```javascript
// ❌ BAD - Hard to test, tight coupling
const HealthMonitoringService = require('../../services/healthMonitoring.service');
const healthService = new HealthMonitoringService(); // Dependencies not injectable

router.get('/fields/:fieldId/health/history', async (req, res, next) => {
  const result = await healthService.getFieldHealthHistory(/* ... */);
  res.json(result);
});
```

---

### 2. Frontend Services (React/TypeScript)

#### ✅ DO: Use Context or Custom Hooks

```typescript
// src/context/ApiContext.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { createApiClient } from '../api/client';
import { createFieldsApi } from '../api/fieldsApi';
import { createHealthApi } from '../api/healthApi';

interface ApiContextValue {
  fieldsApi: ReturnType<typeof createFieldsApi>;
  healthApi: ReturnType<typeof createHealthApi>;
}

const ApiContext = createContext<ApiContextValue | undefined>(undefined);

export const ApiProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const value = useMemo(() => {
    const apiClient = createApiClient();
    return {
      fieldsApi: createFieldsApi(apiClient),
      healthApi: createHealthApi(apiClient),
    };
  }, []);

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
};
```

#### ✅ DO: Use Factory Functions for API Modules

```typescript
// src/api/fieldsApi.ts
import { AxiosInstance } from 'axios';

export const createFieldsApi = (client: AxiosInstance) => {
  return {
    getAll: async () => {
      const response = await client.get('/fields');
      return response.data;
    },
    
    getById: async (fieldId: string) => {
      const response = await client.get(`/fields/${fieldId}`);
      return response.data;
    },
    
    create: async (data: CreateFieldDto) => {
      const response = await client.post('/fields', data);
      return response.data;
    },
  };
};
```

---

### 3. Mobile Services (React Native/TypeScript)

#### ✅ DO: Use Service Singletons with Factory Functions

```typescript
// src/services/WebSocketService.ts
import io, { Socket } from 'socket.io-client';
import { store } from '../store';

class WebSocketService {
  private socket: Socket | null = null;
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  connect(token: string) {
    this.socket = io(this.apiUrl, { auth: { token } });
    
    this.socket.on('health_updated', (data) => {
      store.dispatch(updateFieldHealth(data));
    });
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

// Factory function
let webSocketServiceInstance: WebSocketService | null = null;

export const getWebSocketService = (apiUrl?: string): WebSocketService => {
  if (!webSocketServiceInstance && apiUrl) {
    webSocketServiceInstance = new WebSocketService(apiUrl);
  }
  if (!webSocketServiceInstance) {
    throw new Error('WebSocketService not initialized');
  }
  return webSocketServiceInstance;
};

// For testing: reset singleton
export const resetWebSocketService = () => {
  webSocketServiceInstance = null;
};
```

---

## 🧪 Testing Patterns with DI

### Backend Service Testing

```javascript
// tests/unit/notification.service.test.js
const { NotificationService } = require('../../src/services/notification.service');

describe('NotificationService', () => {
  let notificationService;
  let mockEmailService;
  let mockPushService;
  let mockUserModel;
  let mockDeviceTokenModel;

  beforeEach(() => {
    // Create mocks
    mockEmailService = {
      sendEmail: jest.fn(),
    };
    mockPushService = {
      sendPushNotification: jest.fn(),
    };
    mockUserModel = {
      findByPk: jest.fn(),
    };
    mockDeviceTokenModel = {
      findAll: jest.fn(),
    };

    // Inject mocks via constructor
    notificationService = new NotificationService(
      mockEmailService,
      mockPushService,
      mockUserModel,
      mockDeviceTokenModel
    );
  });

  it('should send health alert to user', async () => {
    mockUserModel.findByPk.mockResolvedValue({ email: 'test@example.com' });
    mockDeviceTokenModel.findAll.mockResolvedValue([{ device_token: 'token123' }]);

    await notificationService.sendHealthAlert('user-1', 'Field A', 'NDVI dropped', 'critical');

    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
    expect(mockPushService.sendPushNotification).toHaveBeenCalledTimes(1);
  });
});
```

### Frontend API Testing

```typescript
// tests/api/fieldsApi.test.ts
import { createFieldsApi } from '../../src/api/fieldsApi';
import { AxiosInstance } from 'axios';

describe('fieldsApi', () => {
  let mockAxios: jest.Mocked<AxiosInstance>;
  let fieldsApi: ReturnType<typeof createFieldsApi>;

  beforeEach(() => {
    mockAxios = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any;

    fieldsApi = createFieldsApi(mockAxios);
  });

  it('should fetch all fields', async () => {
    const mockData = { success: true, data: [{ id: '1', name: 'Field A' }] };
    mockAxios.get.mockResolvedValue({ data: mockData });

    const result = await fieldsApi.getAll();

    expect(mockAxios.get).toHaveBeenCalledWith('/fields');
    expect(result).toEqual(mockData);
  });
});
```

---

## 📝 Best Practices

### 1. **Single Responsibility**
Each service should have one clear purpose:
- ✅ `EmailService` - Send emails
- ✅ `PushNotificationService` - Send push notifications
- ✅ `NotificationService` - Orchestrate notifications (uses Email + Push)
- ❌ `MegaService` - Does everything

### 2. **Constructor Injection**
Always inject dependencies via constructor, not via global imports inside methods:
```javascript
// ✅ GOOD
class MyService {
  constructor(dependency) {
    this.dependency = dependency;
  }
  
  async doWork() {
    return this.dependency.doSomething();
  }
}

// ❌ BAD
class MyService {
  async doWork() {
    const dependency = require('./dependency'); // Hard to mock!
    return dependency.doSomething();
  }
}
```

### 3. **Factory Functions for Singletons**
Use factory functions to manage singleton instances:
```javascript
let instance = null;

function getService() {
  if (!instance) {
    instance = new Service(/* dependencies */);
  }
  return instance;
}
```

### 4. **Reset Functions for Tests**
Provide reset functions for singletons to ensure test isolation:
```javascript
function resetService() {
  instance = null;
}

module.exports = { getService, resetService };
```

### 5. **Avoid Circular Dependencies**
If Service A depends on Service B, and Service B depends on Service A, refactor:
- Extract shared logic to a third service
- Use events or callbacks instead of direct calls
- Reconsider your architecture

---

## 🔄 Migration Guide: Existing Code to DI

### Step 1: Identify Direct Instantiations
Search for `new ServiceName()` in your codebase.

### Step 2: Create Factory Function
```javascript
// Before
const myService = new MyService();

// After
let myServiceInstance = null;

function getMyService() {
  if (!myServiceInstance) {
    myServiceInstance = new MyService(/* inject dependencies */);
  }
  return myServiceInstance;
}
```

### Step 3: Update Constructor
```javascript
// Before
class MyService {
  doWork() {
    const otherService = new OtherService(); // Tight coupling
  }
}

// After
class MyService {
  constructor(otherService) {
    this.otherService = otherService;
  }
  
  doWork() {
    return this.otherService.doSomething();
  }
}
```

### Step 4: Update Routes/Controllers
```javascript
// Before
const MyService = require('../services/myService');
const myService = new MyService();

// After
const { getMyService } = require('../services/myService');
const myService = getMyService();
```

### Step 5: Update Tests
```javascript
// Before - mocking modules is hard
jest.mock('../services/myService');

// After - inject mocks via constructor
const myService = new MyService(mockDependency);
```

---

## 📚 Additional Resources

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Injection in JavaScript](https://www.freecodecamp.org/news/a-quick-intro-to-dependency-injection-what-it-is-and-when-to-use-it-7578c84fa88f/)
- [Testing with DI](https://kentcdodds.com/blog/how-to-write-tests-for-react-with-react-testing-library)

---

## 🎯 Sprint 4 Action Items

### Backend
- ✅ All Sprint 3 services use factory functions
- [ ] Apply same pattern to new Sprint 4 services (WebSocket, User Management)

### Frontend (Web)
- [ ] Create `ApiContext` for centralized API management
- [ ] Use factory functions for all API modules
- [ ] Ensure all services are testable

### Mobile
- [ ] Create service singletons with factory functions
- [ ] Inject dependencies for WebSocket, API clients
- [ ] Add reset functions for test isolation

---

**Remember**: DI is about making code testable, flexible, and maintainable. When in doubt, ask: "Can I easily test this code by mocking its dependencies?" If no, refactor! 💪

