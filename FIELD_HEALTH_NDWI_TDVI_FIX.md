# Field Health Screen - NDVI, NDWI, TDVI Display Fix

## ✅ What Was Fixed

### Problem
The Field Health screen was only showing **NDVI** data, but not displaying **NDWI** (Normalized Difference Water Index) and **TDVI** (Transformed Difference Vegetation Index) even though the backend provides this data.

### Solution
1. ✅ **Updated HealthAnalysis interface** to include NDWI and TDVI fields
2. ✅ **Added NDWI display card** showing water content metrics
3. ✅ **Added TDVI display card** showing stress detection metrics
4. ✅ **Added debug logging** to help identify API response issues
5. ✅ **Added error handling** for missing data

## 📊 What You'll See Now

### NDVI Card (Vegetation Health)
- Mean, Min, Max, Std Dev values
- Vegetation Cover percentage with progress bar

### NDWI Card (Water Content) - NEW!
- Mean, Min, Max, Std Dev values (if available)
- Info box explaining NDWI significance
- Shows when water content data is available

### TDVI Card (Stress Detection) - NEW!
- Mean value
- Info box explaining TDVI significance
- Shows when stress detection data is available

## 🔍 Debugging

### Check Terminal for API Response
The app now logs detailed information in development mode:

1. **Check Expo terminal** where you ran `npx expo start`
2. Look for logs prefixed with `[HealthAPI]` and `[FieldHealthScreen]`
3. You'll see:
   - Full API response structure
   - Whether NDWI/TDVI data is present
   - Any missing data warnings

### Example Logs You'll See:
```
[HealthAPI] Health summary response: { ... }
[FieldHealthScreen] Health data: { ... }
[FieldHealthScreen] Current health: {
  ndvi_mean: 0.62,
  ndwi_mean: 0.20,
  tdvi_mean: 0.45
}
```

### If NDWI/TDVI Don't Show

1. **Check API Response**:
   - Look at terminal logs for `[HealthAPI]` messages
   - Verify if `ndwi_mean` and `tdvi_mean` are in the response

2. **Check Backend**:
   - Ensure the field has health analysis data
   - Health records should have `ndwi_mean` and `tdvi_mean` values
   - If missing, trigger a new health analysis

3. **Trigger New Analysis**:
   - Tap "Request New Analysis" button in the health screen
   - Wait a few minutes for analysis to complete
   - Refresh the screen

## 🧪 Testing

1. **Navigate to Field Health**:
   - Go to Fields → Select a field → Tap "Crop Health"

2. **Check for All Three Indices**:
   - ✅ NDVI card should show (always visible if health data exists)
   - ✅ NDWI card should show (if `ndwi_mean` is in response)
   - ✅ TDVI card should show (if `tdvi_mean` is in response)

3. **If Cards Don't Appear**:
   - Check terminal for warnings
   - Verify backend has health data with NDWI/TDVI
   - Try triggering a new analysis

## 📝 API Response Structure

The backend should return:
```json
{
  "current": {
    "ndvi_mean": 0.62,
    "ndvi_min": 0.45,
    "ndvi_max": 0.78,
    "ndvi_std": 0.08,
    "ndwi_mean": 0.20,  // Water content
    "ndwi_min": 0.15,
    "ndwi_max": 0.25,
    "ndwi_std": 0.03,
    "tdvi_mean": 0.45,  // Stress detection
    "health_score": 75,
    "health_status": "good",
    ...
  }
}
```

## 🐛 Troubleshooting

### Issue: NDWI/TDVI cards don't appear
**Solution**:
- Check terminal logs for `[HealthAPI]` warnings
- Verify backend health records include NDWI/TDVI
- Trigger new health analysis if data is missing

### Issue: "No health data available"
**Solution**:
- Tap "Request Analysis" button
- Wait for analysis to complete (may take a few minutes)
- Refresh the screen

### Issue: API returns 404 or error
**Solution**:
- Verify field ID is correct
- Check backend is running and accessible
- Check network connection
- Look at terminal for detailed error messages

---

**Status**: ✅ Fixed  
**Files Modified**:
- `mobile/src/api/healthApi.ts` - Added NDWI/TDVI fields and debug logging
- `mobile/src/screens/fields/FieldHealthScreen.tsx` - Added NDWI/TDVI display cards

**Next Steps**: 
1. Reload the app
2. Navigate to Field Health screen
3. Check terminal for debug logs
4. Verify all three indices are displayed
