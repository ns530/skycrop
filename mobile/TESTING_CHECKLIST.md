# Mobile App Testing Checklist

## Metro Bundler Status ✅
- Metro bundler is running (multiple node processes detected)
- Started with `--clear` flag to reset cache
- Should show QR code and connection options in terminal

## Testing Steps

### 1. Check Metro Bundler Terminal
Look for:
- ✅ "Metro waiting on..."
- ✅ QR code for Expo Go
- ✅ Options: Press `a` for Android, `i` for iOS, `w` for web

### 2. Dashboard Screen Tests

#### Expected Behavior:
- [ ] App opens without errors
- [ ] Dashboard tab is visible and accessible
- [ ] Shows loading spinner while fetching fields
- [ ] Displays greeting message (Good Morning/Afternoon/Evening)
- [ ] Shows user name from auth context
- [ ] Displays field count stat card
- [ ] Displays total hectares stat card
- [ ] Displays alerts count (mock data: 12)
- [ ] Displays average score (mock data: 4.2)
- [ ] Shows field health summary bars (Excellent, Good, Fair, Poor)
- [ ] Displays recent activity items
- [ ] Shows quick action buttons (Add Field, Check Health, Weather, Tips)
- [ ] Pull-to-refresh works
- [ ] Error message displays if API fails

#### API Calls:
- Endpoint: `GET /api/v1/fields?status=active&limit=100`
- Should include Authorization header with Bearer token
- Response format: `{ data: FieldSummary[], pagination: {...} }`

### 3. Fields List Screen Tests

#### Expected Behavior:
- [ ] Fields tab is visible and accessible
- [ ] Shows loading spinner while fetching
- [ ] Displays list of fields using FieldCard component
- [ ] Each field card shows:
  - [ ] Field name
  - [ ] Area in hectares
  - [ ] Health status badge (if available)
  - [ ] Health score (if available)
  - [ ] Last update time (if available)
- [ ] Shows "Add Field" button in header
- [ ] Empty state displays if no fields exist
- [ ] Pull-to-refresh works
- [ ] Error message displays if API fails
- [ ] Footer shows pagination info if more fields exist

#### API Calls:
- Endpoint: `GET /api/v1/fields?status=active&sort_by=created_at&sort_order=desc`
- Should include Authorization header with Bearer token
- Response format: `{ data: FieldSummary[], pagination: {...} }`

### 4. Field Detail Navigation Tests

#### Navigation Flow:
- [ ] Tap on a field card → Navigates to FieldDetail screen
- [ ] FieldDetail screen loads without errors
- [ ] Shows field information (name, area, location, etc.)
- [ ] Tap "View Health" → Navigates to FieldHealth screen
- [ ] Tap "View Recommendations" → Navigates to FieldRecommendations screen
- [ ] Tap "View Yield" → Navigates to FieldYield screen
- [ ] All navigation passes `fieldId` as string (no type errors)

#### API Calls:
- Field Detail: `GET /api/v1/fields/{fieldId}`
- Field Health: `GET /api/v1/fields/{fieldId}/health/summary`
- Field Recommendations: `GET /api/v1/fields/{fieldId}/recommendations`

### 5. Error Monitoring

#### Check Metro Terminal:
- [ ] No red error messages
- [ ] No module resolution errors
- [ ] No TypeScript compilation errors
- [ ] Bundle builds successfully

#### Check Device Console:
- [ ] No runtime JavaScript errors
- [ ] No network request failures (unless backend is down)
- [ ] No authentication errors (401/403)
- [ ] API calls are being made correctly

#### Common Issues to Watch For:
1. **Network Errors**: Check if API_BASE_URL is correct
   - Current: `https://backend-production-9e94.up.railway.app`
2. **Authentication Errors**: Check if token is being sent
   - Token should be in AsyncStorage under `skycrop_auth_token`
3. **Type Errors**: All fieldId parameters should be strings
4. **Navigation Errors**: Check if screen names match exactly

## API Endpoint Verification

### Fields API
- ✅ `GET /api/v1/fields` - List fields
- ✅ `GET /api/v1/fields/{fieldId}` - Get field detail
- ✅ `POST /api/v1/fields` - Create field
- ✅ `PATCH /api/v1/fields/{fieldId}` - Update field
- ✅ `DELETE /api/v1/fields/{fieldId}` - Delete field

### Health API
- ✅ `GET /api/v1/fields/{fieldId}/health/summary` - Get health summary
- ✅ `POST /api/v1/fields/{fieldId}/health/analyze` - Trigger analysis

### Recommendations API
- ✅ `GET /api/v1/fields/{fieldId}/recommendations` - Get recommendations
- ✅ `POST /api/v1/fields/{fieldId}/recommendations/generate` - Generate recommendations
- ✅ `PATCH /api/v1/fields/{fieldId}/recommendations/{recId}` - Update status

## Debugging Tips

1. **If Dashboard/Fields don't load:**
   - Check Metro terminal for errors
   - Verify API_BASE_URL in `src/config/env.ts`
   - Check if user is authenticated (token exists)
   - Check network tab in React Native Debugger

2. **If Navigation fails:**
   - Verify screen names match exactly
   - Check route param types (should be string for fieldId)
   - Check navigation prop types

3. **If API calls fail:**
   - Check API_BASE_URL is accessible
   - Verify token is being sent in Authorization header
   - Check response format matches expected structure

4. **To view API calls:**
   - Enable React Native Debugger
   - Check Network tab
   - Look for requests to `/api/v1/fields`

## Success Criteria

✅ All screens load without errors
✅ API calls are made correctly
✅ Navigation works between all screens
✅ Error handling displays appropriate messages
✅ Loading states show while fetching data
✅ Pull-to-refresh works on list screens

