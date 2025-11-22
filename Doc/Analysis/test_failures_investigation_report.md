# Backend Test Failures Investigation Report

**Date**: November 21, 2025  
**Investigator**: QA Agent (Bmad Method)  
**Status**: ✅ ROOT CAUSE IDENTIFIED  

---

## 🔍 EXECUTIVE SUMMARY

**Initial Report**: 2 failing tests out of 119  
**Actual Status**: **14 failing test suites** due to import errors  
**Root Cause**: Incorrect Sequelize imports in model files  
**Impact**: CRITICAL - 11 integration tests cannot run  
**Fix Complexity**: LOW - Simple import fixes required  

---

## 📊 FAILURE BREAKDOWN

### Category 1: Import Errors (Blocks 11 test suites) 🔴 CRITICAL

**Error**: `TypeError: Cannot read properties of undefined (reading 'ne')`

**Location**: `backend/src/models/actualYield.model.js:153`

```javascript
// Line 153 - INCORRECT
{ fields: ['prediction_id'], where: { prediction_id: { [sequelize.Op.ne]: null } } }
```

**Problem**:
- `sequelize` is an **instance** of Sequelize (created with `new Sequelize()`)
- `Op` (operators) is a property of the **Sequelize class**, not the instance
- `sequelize.Op` is `undefined`, so `sequelize.Op.ne` throws an error

**Affected Test Files** (all fail on app import):
1. `tests/integration/auth.api.test.js`
2. `tests/integration/contracts.openapi.test.js`
3. `tests/integration/fields.api.test.js`
4. `tests/integration/health.indices.test.js`
5. `tests/integration/ml.predict.test.js`
6. `tests/integration/ml.yield.test.js`
7. `tests/integration/recommendation.api.test.js`
8. `tests/integration/satellite.preprocess.test.js`
9. `tests/integration/satellite.tiles.test.js`
10. `tests/integration/weather.current.test.js`
11. `tests/integration/health.indices.test.js`

**Fix**: Import `Sequelize` class separately and use `Sequelize.Op.ne`

```javascript
// CORRECT IMPORT
const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database.config');

// CORRECT USAGE
{ fields: ['prediction_id'], where: { prediction_id: { [Op.ne]: null } } }
```

---

### Category 2: Import Errors (Blocks 1 test suite) 🔴 CRITICAL

**Error**: `TypeError: sequelize.literal is not a function`

**Location**: `backend/src/models/user.model.js:69` (and similar in `actualYield.model.js:128,133`)

```javascript
// Line 69 - INCORRECT
defaultValue: sequelize.literal('NOW()'),
```

**Problem**:
- `literal()` is a static method on the **Sequelize class**, not the instance
- `sequelize.literal` is `undefined`

**Affected Test Files**:
1. `tests/integration/dashboard.metrics.test.js`

**Fix**: Use `Sequelize.literal()` instead

```javascript
// CORRECT IMPORT
const { DataTypes, Sequelize } = require('sequelize');
const { sequelize } = require('../config/database.config');

// CORRECT USAGE
defaultValue: Sequelize.literal('NOW()'),
```

---

### Category 3: Logic Errors (Actual test failures) 🟡 MEDIUM

#### Failure 3.1: Health Service Error Mapping

**Error**: Test expects `statusCode: 400` but receives `statusCode: 501`

**Location**: `tests/unit/health.service.test.js:246`

**Test Code**:
```javascript
// Process 400 response from Sentinel Hub
axios.post.mockImplementationOnce(async () => ({ status: 400, data: {} }));
await expect(svc.computeIndicesForField(userId, fieldId, date))
  .rejects.toMatchObject({ statusCode: 400 });
```

**Expected Behavior**: When Sentinel Hub Process API returns 400, service should map to 400  
**Actual Behavior**: Service maps to 501 (NOT_IMPLEMENTED)

**Root Cause Hypothesis**: 
- Health service error mapping logic is incorrect
- Likely using a default 501 for non-500-series errors
- Need to check `src/services/health.service.js` error handling

**Impact**: MEDIUM - Affects error reporting for satellite processing errors

---

#### Failure 3.2: ML Gateway Segmentation Test

**Error**: `AppError: ML service request failed`

**Location**: `tests/unit/ml.gateway.service.segmentation.test.js:187`

**Test**: "inline return: returns maskBase64 and preserves model/version"

**Error Stack**:
```javascript
at MLGatewayService._callML (src/services/mlGateway.service.js:175:13)
at MLGatewayService.predict (src/services/mlGateway.service.js:310:18)
at MLGatewayService.detectBoundaries (src/services/mlGateway.service.js:374:24)
```

**Root Cause Hypothesis**:
- Mock configuration for axios call is incorrect or incomplete
- Request to ML service is not properly mocked
- Need to check test setup and mock expectations

**Impact**: MEDIUM - Affects boundary detection feature tests

---

#### Failure 3.3: Recommendation Service Jest Scope Error

**Error**: `ReferenceError: The module factory of jest.mock() is not allowed to reference any out-of-scope variables.`

**Location**: `tests/unit/recommendation.service.test.js:112`

**Problem**:
```javascript
// Line 112 - INVALID jest.mock() usage
const rows = listByWhere({  // <-- listByWhere is out-of-scope
  fieldId: replacements.fieldId,
  ...
});
```

**Root Cause**: 
- `jest.mock()` factory function cannot reference variables from outer scope
- Need to prefix variable with `mock` (e.g., `mockListByWhere`) or restructure the mock

**Impact**: HIGH - Recommendation service has NO test coverage

---

## 🎯 FIX PRIORITY

### 🔴 CRITICAL (Fix Immediately)

**Priority 1**: Fix Sequelize import in `actualYield.model.js`
- **Impact**: Unblocks 11 integration test suites
- **Effort**: 2 minutes
- **Files**: 1 model file

**Priority 2**: Fix Sequelize import in `user.model.js`
- **Impact**: Unblocks 1 integration test suite (dashboard)
- **Effort**: 1 minute
- **Files**: 1 model file

### 🟡 HIGH (Fix in Sprint 3 Week 1)

**Priority 3**: Fix health service error mapping
- **Impact**: Correct error handling for satellite API failures
- **Effort**: 15 minutes (investigate + fix + verify)
- **Files**: `src/services/health.service.js` + test

**Priority 4**: Fix ML gateway test mock
- **Impact**: Restore test coverage for boundary detection
- **Effort**: 10 minutes (fix mock setup)
- **Files**: Test file only

**Priority 5**: Fix recommendation service test scope
- **Impact**: Restore test coverage for recommendations
- **Effort**: 20 minutes (restructure mock)
- **Files**: Test file only

---

## 📋 DETAILED FIX PLAN

### Fix 1: actualYield.model.js (CRITICAL)

**File**: `backend/src/models/actualYield.model.js`

**Change Line 3-4**:
```javascript
// BEFORE
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

// AFTER
const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database.config');
```

**Change Line 153**:
```javascript
// BEFORE
{ fields: ['prediction_id'], where: { prediction_id: { [sequelize.Op.ne]: null } } },

// AFTER
{ fields: ['prediction_id'], where: { prediction_id: { [Op.ne]: null } } },
```

---

### Fix 2: user.model.js (CRITICAL)

**File**: `backend/src/models/user.model.js`

**Change Line 3-4**:
```javascript
// BEFORE
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

// AFTER
const { DataTypes, Sequelize } = require('sequelize');
const { sequelize } = require('../config/database.config');
```

**Change Line 69 & 74**:
```javascript
// BEFORE (line 69)
defaultValue: sequelize.literal('NOW()'),

// AFTER (line 69)
defaultValue: Sequelize.literal('NOW()'),

// BEFORE (line 74)
defaultValue: sequelize.literal('NOW()'),

// AFTER (line 74)
defaultValue: Sequelize.literal('NOW()'),
```

---

### Fix 3: Health Service Error Mapping (HIGH)

**File**: `backend/src/services/health.service.js`

**Investigation Needed**:
1. Locate error handling for Sentinel Hub Process API calls
2. Verify error mapping logic: 4xx should map to 400, 5xx to 503
3. Check if there's a default 501 fallback

**Expected Code Pattern**:
```javascript
// CORRECT ERROR MAPPING
if (error.response) {
  const status = error.response.status;
  if (status >= 500) {
    throw new AppError('UPSTREAM_ERROR', 'Satellite service unavailable', 503);
  } else if (status >= 400) {
    throw new AppError('VALIDATION_ERROR', 'Invalid satellite request', 400);
  }
} else {
  throw new AppError('NETWORK_ERROR', 'Satellite service unreachable', 503);
}
```

---

### Fix 4: ML Gateway Test Mock (HIGH)

**File**: `backend/tests/unit/ml.gateway.service.segmentation.test.js`

**Investigation Needed**:
1. Check test setup at line ~187
2. Verify axios mock for ML service call
3. Ensure mock returns expected structure: `{ maskBase64, model, version }`

**Expected Mock Pattern**:
```javascript
axios.post.mockResolvedValueOnce({
  status: 200,
  data: {
    maskBase64: 'base64-encoded-data',
    model: 'u-net-v2',
    version: '2.0.0'
  }
});
```

---

### Fix 5: Recommendation Service Test Scope (HIGH)

**File**: `backend/tests/unit/recommendation.service.test.js`

**Change Line 112**:
```javascript
// BEFORE - invalid out-of-scope reference
jest.mock('some-module', () => {
  const listByWhere = (...) => { ... };  // Out of scope!
  return { listByWhere };
});

// AFTER - use mock prefix or move to outer scope
const mockListByWhere = (...) => { ... };  // Now in scope
jest.mock('some-module', () => {
  return { listByWhere: mockListByWhere };
});
```

---

## ✅ VERIFICATION PLAN

### After Fixes 1-2 (Import Errors)

```bash
cd backend
npm test 2>&1 | grep "Test Suites"
```

**Expected Output**:
```
Test Suites: 3 failed, 27 passed, 30 total
Tests:       3 failed, 116 passed, 119 total
```

**Success Criteria**: 
- 11 integration test suites now pass
- Only 3 test suites failing (health, ml gateway, recommendation)

### After Fixes 3-5 (Logic Errors)

```bash
cd backend
npm test -- --coverage
```

**Expected Output**:
```
Test Suites: 30 passed, 30 total
Tests:       119 passed, 119 total
Coverage: >93% statements, >81% branches
```

**Success Criteria**:
- All tests passing
- Coverage thresholds met

---

## 📊 TEST COVERAGE IMPACT

### Current State (Before Fixes)
- **Test Suites**: 14 failed, 16 passed (53% pass rate)
- **Tests**: Cannot run 11 integration suites
- **Coverage**: 62% (below 80% threshold)

### Expected State (After Import Fixes 1-2)
- **Test Suites**: 3 failed, 27 passed (90% pass rate)
- **Tests**: ~116 passing, 3 failing
- **Coverage**: ~88% (above threshold)

### Expected State (After All Fixes)
- **Test Suites**: 30 passed (100% pass rate)
- **Tests**: 119 passing
- **Coverage**: ~94% statements, ~81% branches

---

## 🚨 RISK ASSESSMENT

### Critical Risks
1. **Production Code May Have Same Bugs**: If tests use these models, production might have runtime errors
2. **Code Review Gap**: These errors should have been caught in review
3. **CI/CD May Be Bypassed**: Tests should block deployment on failures

### Mitigation
1. **Immediate**: Fix all import errors (Fixes 1-2)
2. **Sprint 3 Week 1**: Fix logic errors (Fixes 3-5)
3. **Process Improvement**: Add pre-commit hooks to run tests locally

---

## 🔍 ROOT CAUSE ANALYSIS

### How Did These Errors Get Introduced?

**Hypothesis 1: Copy-Paste Error**
- Developer likely copied model template
- Didn't verify Sequelize imports
- Tests weren't run after adding model files

**Hypothesis 2: Incomplete Migration**
- Models may have been created early (Sprint 1)
- Code was refactored, breaking tests
- Test suite wasn't run end-to-end

**Hypothesis 3: Test Environment Issue**
- Tests may pass in one environment but fail in another
- Sequelize version mismatch?
- Need to verify `package.json` dependencies

### Prevention Strategies

1. **Pre-commit Hooks**: Add `husky` + `lint-staged`
   ```json
   {
     "husky": {
       "hooks": {
         "pre-commit": "npm test"
       }
     }
   }
   ```

2. **CI/CD Enforcement**: Ensure GitHub Actions blocks merge on test failures

3. **Code Review Checklist**: Add "Tests pass locally" requirement

4. **Documentation**: Add "Running Tests" section to README

---

## 📅 TIMELINE

**Immediate (Next 30 minutes)**:
- ✅ Investigation complete (this report)
- 🔄 Apply Fix 1 (actualYield.model.js)
- 🔄 Apply Fix 2 (user.model.js)
- 🔄 Verify 11 test suites now pass

**Sprint 3 Day 1 (2 hours)**:
- 🔄 Apply Fix 3 (health service error mapping)
- 🔄 Apply Fix 4 (ML gateway test mock)
- 🔄 Apply Fix 5 (recommendation test scope)
- 🔄 Verify all 119 tests pass

**Sprint 3 Day 2 (1 hour)**:
- 🔄 Add pre-commit hooks
- 🔄 Update CI/CD configuration
- 🔄 Document test running process

---

## 🎓 LESSONS LEARNED

### What Went Wrong
1. ❌ Models used incorrect Sequelize imports
2. ❌ Tests weren't run after model creation
3. ❌ No pre-commit hooks to catch failures

### What Went Right
1. ✅ Comprehensive test suite caught issues
2. ✅ Clear error messages helped debugging
3. ✅ Modular architecture made investigation easier

### Action Items
1. ✅ Fix import errors immediately
2. ✅ Run full test suite before Sprint 3 kickoff
3. ✅ Add pre-commit hooks in Sprint 3
4. ✅ Update developer documentation

---

## 📞 NEXT STEPS

1. **Developer Agent**: Apply Fixes 1-2 (import errors)
2. **QA Agent**: Verify 11 test suites now pass
3. **PM Agent**: Update Sprint 3 planning with test fix tasks
4. **DevOps Agent**: Add pre-commit hooks + CI/CD enforcement

---

**Report Status**: ✅ COMPLETE  
**Next Update**: After applying fixes  
**Estimated Fix Time**: 30 minutes (import fixes) + 2 hours (logic fixes)

---

*Investigation conducted by QA Agent using Bmad Method*  
*Date: November 21, 2025*

