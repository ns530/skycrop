# Authentication Production Testing Plan

## Test Environment
- **Frontend URL**: https://skycrop.vercel.app
- **Backend URL**: https://backend-production-9e94.up.railway.app/api/v1
- **Environment Variables**: VITE_API_BASE_URL=https://backend-production-9e94.up.railway.app/api/v1

## Test Prerequisites
1. Frontend deployed to Vercel with production environment variables
2. Backend running on Railway at https://backend-production-9e94.up.railway.app
3. Browser developer tools available for network monitoring

## Test Cases

### TC-AUTH-001: Verify API Base URL Configuration
**Objective**: Confirm API requests target Railway backend instead of Vercel domain

**Steps**:
1. Open browser developer tools (F12)
2. Navigate to Network tab
3. Go to the deployed frontend application
4. Attempt to access login page
5. Check network requests for any API calls

**Expected Results**:
- No API requests should go to `*.vercel.app` domains
- API requests should target `https://backend-production-9e94.up.railway.app/api/v1/*`
- Browser console should show no CORS errors related to domain mismatches

### TC-AUTH-002: Account Creation (Signup) Test
**Objective**: Verify new user registration works with Railway backend

**Steps**:
1. Navigate to signup page (`/signup`)
2. Fill in registration form:
   - Name: Test User [timestamp]
   - Email: test-[timestamp]@example.com
   - Password: password123
   - Confirm Password: password123
3. Click "Sign Up" button
4. Monitor network tab for signup API call

**Expected Results**:
- API request: `POST https://backend-production-9e94.up.railway.app/api/v1/auth/signup`
- Response status: 201 Created or 200 OK
- No 404 errors
- User redirected to dashboard or email verification page
- Success message displayed

### TC-AUTH-003: Sign-in Test
**Objective**: Verify user login works with Railway backend

**Steps**:
1. Navigate to login page (`/auth/login` or `/`)
2. Fill in login form:
   - Email: [use email from successful signup test]
   - Password: password123
3. Click "Sign In" or "Continue" button
4. Monitor network tab for login API call

**Expected Results**:
- API request: `POST https://backend-production-9e94.up.railway.app/api/v1/auth/signin`
- Response status: 200 OK
- No 404 errors
- JWT token received in response
- User redirected to dashboard (`/dashboard`)
- Dashboard loads successfully

### TC-AUTH-004: Error Handling Test
**Objective**: Verify error responses are handled correctly

**Steps**:
1. Attempt login with invalid credentials:
   - Email: invalid@example.com
   - Password: wrongpassword
2. Monitor network response

**Expected Results**:
- API request: `POST https://backend-production-9e94.up.railway.app/api/v1/auth/signin`
- Response status: 401 Unauthorized
- Error message displayed: "Invalid email or password"
- No 404 errors

### TC-AUTH-005: Browser Console Verification
**Objective**: Ensure no JavaScript errors or network failures

**Steps**:
1. Open browser console (F12 → Console tab)
2. Perform signup and signin tests
3. Check for any errors

**Expected Results**:
- No JavaScript errors
- No network errors
- No CORS errors
- No 404 errors for API endpoints

## Test Data
- Test Email Pattern: `test-{timestamp}@example.com`
- Test Password: `password123`
- Test Name: `Test User {timestamp}`

## Success Criteria
- [ ] All API requests target Railway backend URL
- [ ] No requests to Vercel domains for API calls
- [ ] Signup functionality works (account creation successful)
- [ ] Signin functionality works (authentication successful)
- [ ] No 404 errors in network tab
- [ ] Successful HTTP status codes (200/201) for valid requests
- [ ] Proper error handling for invalid requests
- [ ] No JavaScript console errors
- [ ] No CORS issues

## Reporting
Document any failures with:
- Screenshots of network tab
- Console error messages
- API request/response details
- Steps to reproduce