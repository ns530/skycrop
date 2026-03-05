# Quick Migration Guide: SentinelHub → Google Earth Engine

## Summary

✅ **Yes, Google Earth Engine can provide all required data!**
- NDVI, NDWI, TDVI indices
- Sentinel-2 satellite imagery
- Free tier available
- Better documentation

## What I've Created

1. **`ml-service/app/gee_indices.py`** - GEE computation module
2. **New API endpoint**: `POST /api/gee/compute-indices` in your ML service
3. **Updated `requirements.txt`** - Added `earthengine-api`

## Quick Setup (5 Steps)

### Step 1: Install Google Earth Engine

```bash
cd ml-service
pip install earthengine-api
```

### Step 2: Authenticate GEE

```bash
# This will open a browser for authentication
earthengine authenticate
```

Or for production, set up a service account (see GOOGLE_EARTH_ENGINE_SETUP.md)

### Step 3: Update Backend to Use GEE

Edit `backend/src/services/health.service.js`:

Find the `computeIndicesForField` method and replace the SentinelHub call:

```javascript
// OLD (SentinelHub):
const token = await this.getOAuthToken();
const url = `${SENTINELHUBBASEURL}/api/v1/process`;
const resp = await axios.post(url, processBody, {...});

// NEW (Google Earth Engine via ML service):
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:80';
const resp = await axios.post(`${ML_SERVICE_URL}/api/gee/compute-indices`, {
  geometry: geometry,
  date: date
}, {
  headers: {
    'X-Internal-Auth': process.env.ML_SERVICE_INTERNAL_AUTH_TOKEN || 'your-internal-token'
  }
});

const { ndvi, ndwi, tdvi } = resp.data.indices;
```

### Step 4: Test

```bash
# Start ML service
cd ml-service
python -m flask run --port=80

# Test the endpoint
curl -X POST http://localhost:80/api/gee/compute-indices \
  -H "Content-Type: application/json" \
  -H "X-Internal-Auth: your-token" \
  -d '{
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[80.0, 6.0], [80.1, 6.0], [80.1, 6.1], [80.0, 6.1], [80.0, 6.0]]]
    },
    "date": "2024-01-15"
  }'
```

### Step 5: Update Environment Variables

Add to `backend/.env`:
```bash
# Use GEE instead of SentinelHub
USE_GEE=true
ML_SERVICE_URL=http://localhost:80
ML_SERVICE_INTERNAL_AUTH_TOKEN=your-internal-token
```

## Complete Code Change

Here's the exact change needed in `health.service.js`:

```javascript
// Around line 270, replace:
async computeIndicesForField(user_id, field_id, date) {
  // ... existing cache check code ...
  
  const geometry = await this.getFieldGeometry(user_id, field_id);
  
  // REPLACE THIS BLOCK:
  // const processBody = this.buildProcessBodyForGeometry(geometry, date, HEALTHDEFAULTIMAGESIZE);
  // const token = await this.getOAuthToken();
  // const url = `${SENTINELHUBBASEURL}/api/v1/process`;
  // const resp = await axios.post(url, processBody, {...});
  // const { ndvi, ndwi, tdvi } = this.parseProcessResponse(resp.data, resp.headers);
  
  // WITH THIS:
  const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:80';
  const ML_AUTH_TOKEN = process.env.ML_SERVICE_INTERNAL_AUTH_TOKEN;
  
  const resp = await axios.post(`${ML_SERVICE_URL}/api/gee/compute-indices`, {
    geometry: geometry,
    date: date
  }, {
    headers: {
      'X-Internal-Auth': ML_AUTH_TOKEN,
      'Content-Type': 'application/json'
    },
    timeout: 60000  // GEE can take longer
  });
  
  const { ndvi, ndwi, tdvi } = resp.data.indices;
  
  // Rest of the code stays the same...
  const payload = {
    field_id,
    timestamp: `${date}T00:00:00.000Z`,
    source: 'sentinel2-gee',  // Changed from 'sentinel2'
    ndvi,
    ndwi,
    tdvi,
  };
  
  // ... rest of method ...
}
```

## Benefits

1. ✅ **No more SentinelHub OAuth errors**
2. ✅ **Free tier available**
3. ✅ **Better documentation**
4. ✅ **More reliable**
5. ✅ **Uses your existing ML service**

## Troubleshooting

### "Google Earth Engine not installed"
```bash
pip install earthengine-api
```

### "Failed to initialize Google Earth Engine"
```bash
earthengine authenticate
```

### "No Sentinel-2 image found"
- Check if date has cloud-free imagery
- Try a different date
- GEE will automatically filter cloudy images (<30% cloud)

### "Computation timeout"
- Increase timeout in backend: `timeout: 120000` (2 minutes)
- GEE can take 30-60 seconds for large areas

## Next Steps

1. ✅ Install and authenticate GEE
2. ✅ Update backend code
3. ✅ Test with a sample field
4. ✅ Deploy
5. ✅ Remove SentinelHub code (optional)

## Need Help?

See `GOOGLE_EARTH_ENGINE_SETUP.md` for detailed documentation.
