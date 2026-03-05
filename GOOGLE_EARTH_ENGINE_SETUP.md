# Google Earth Engine Integration Guide

## Yes! Google Earth Engine Can Provide All Required Data

Google Earth Engine (GEE) is an excellent alternative to SentinelHub for crop health analysis. It can provide:
- ✅ **NDVI** (Normalized Difference Vegetation Index)
- ✅ **NDWI** (Normalized Difference Water Index)
- ✅ **TDVI** (Transformed Difference Vegetation Index)
- ✅ **Sentinel-2** satellite imagery
- ✅ **Free tier** with generous quotas
- ✅ **Better documentation** and community support

## Advantages of Google Earth Engine

1. **Free Tier**: More generous than SentinelHub
2. **Better API**: RESTful API with Python/JavaScript SDKs
3. **More Data Sources**: Access to Landsat, MODIS, Sentinel-1, Sentinel-2, and more
4. **Cloud Processing**: Built-in cloud computing infrastructure
5. **Better Documentation**: Extensive tutorials and examples

## Required Data for Your Backend

Your backend currently needs:
- **NDVI**: `(NIR - RED) / (NIR + RED)`
- **NDWI**: `(GREEN - NIR) / (GREEN + NIR)`
- **TDVI**: `(NIR - RED) / sqrt(NIR + RED)`
- **Source**: Sentinel-2 satellite imagery
- **Output**: Mean values for a field geometry on a specific date

## Integration Options

### Option 1: Google Earth Engine Python API (Recommended)

Use the `earthengine-api` Python package to compute indices server-side.

### Option 2: Google Earth Engine REST API

Use the REST API directly from Node.js backend.

### Option 3: Hybrid Approach

Use Google Earth Engine for computation, store results in your database.

## Implementation Guide

### Step 1: Set Up Google Earth Engine Account

1. Go to https://earthengine.google.com/
2. Sign up with your Google account
3. Request access (usually approved within 24-48 hours)
4. Once approved, you'll get access to the API

### Step 2: Install Dependencies

For Python API (if using Python service):
```bash
pip install earthengine-api
```

For Node.js REST API:
```bash
npm install axios
# No special package needed, just use HTTP requests
```

### Step 3: Authenticate

**Python:**
```python
import ee
ee.Authenticate()  # Opens browser for authentication
ee.Initialize()
```

**Node.js (REST API):**
You'll need to use service account or OAuth2. See Google Cloud documentation.

### Step 4: Create GEE Service Module

Create a new service file: `backend/src/services/geeHealth.service.js`

## Sample Implementation

Here's a sample implementation for your backend:

```javascript
// backend/src/services/geeHealth.service.js
const axios = require('axios');
const { logger } = require('../utils/logger');

const GEE_API_URL = 'https://earthengine.googleapis.com/v1alpha';
const GEE_PROJECT = process.env.GEE_PROJECT_ID || 'your-project-id';

class GEEHealthService {
  /**
   * Compute NDVI, NDWI, TDVI for a field using Google Earth Engine
   * @param {string} fieldId
   * @param {string} date - YYYY-MM-DD format
   * @param {object} geometry - GeoJSON geometry
   * @returns {Promise<{ndvi: number, ndwi: number, tdvi: number}>}
   */
  async computeIndices(fieldId, date, geometry) {
    try {
      // Use Google Earth Engine Python API via subprocess
      // OR use REST API if available
      
      // For now, we'll create a Python script that GEE can execute
      const pythonScript = this.buildGEEScript(geometry, date);
      
      // Execute via Python subprocess or REST API
      const result = await this.executeGEEScript(pythonScript);
      
      return {
        ndvi: result.ndvi,
        ndwi: result.ndwi,
        tdvi: result.tdvi,
      };
    } catch (error) {
      logger.error('GEE computation error', { fieldId, date, error: error.message });
      throw error;
    }
  }

  buildGEEScript(geometry, date) {
    // This would generate Python code for GEE
    return `
import ee
ee.Initialize()

# Load Sentinel-2 image collection
collection = ee.ImageCollection('COPERNICUS/S2_SR') \\
    .filterDate('${date}', '${date}') \\
    .filterBounds(ee.Geometry(${JSON.stringify(geometry)})) \\
    .first()

# Calculate indices
nir = collection.select('B8')
red = collection.select('B4')
green = collection.select('B3')

ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI')
ndwi = green.subtract(nir).divide(green.add(nir)).rename('NDWI')
tdvi = nir.subtract(red).divide(nir.add(red).sqrt()).rename('TDVI')

# Calculate mean over geometry
geometry = ee.Geometry(${JSON.stringify(geometry)})
ndvi_mean = ndvi.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: geometry,
    scale: 10,
    maxPixels: 1e9
}).get('NDVI').getInfo()

ndwi_mean = ndwi.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: geometry,
    scale: 10,
    maxPixels: 1e9
}).get('NDWI').getInfo()

tdvi_mean = tdvi.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: geometry,
    scale: 10,
    maxPixels: 1e9
}).get('TDVI').getInfo()

print({
    'ndvi': ndvi_mean,
    'ndwi': ndwi_mean,
    'tdvi': tdvi_mean
})
`;
  }
}
```

## Alternative: Use Google Earth Engine via Python Microservice

Since your backend is Node.js, you could:

1. **Create a Python microservice** that uses GEE
2. **Call it from your Node.js backend** via HTTP
3. **Keep the same interface** as SentinelHub

### Python Microservice Example

```python
# ml-service/gee_indices.py
from flask import Flask, request, jsonify
import ee
import json

app = Flask(__name__)
ee.Initialize()

@app.route('/compute-indices', methods=['POST'])
def compute_indices():
    data = request.json
    geometry = data['geometry']
    date = data['date']
    
    # Load Sentinel-2
    collection = ee.ImageCollection('COPERNICUS/S2_SR') \
        .filterDate(date, date) \
        .filterBounds(ee.Geometry(geometry)) \
        .first()
    
    # Calculate indices
    nir = collection.select('B8')
    red = collection.select('B4')
    green = collection.select('B3')
    
    ndvi = nir.subtract(red).divide(nir.add(red))
    ndwi = green.subtract(nir).divide(green.add(nir))
    tdvi = nir.subtract(red).divide(nir.add(red).sqrt())
    
    # Get mean values
    geometry_ee = ee.Geometry(geometry)
    stats = {
        'ndvi': ndvi.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=geometry_ee,
            scale=10,
            maxPixels=1e9
        ).get('NDVI').getInfo(),
        'ndwi': ndwi.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=geometry_ee,
            scale=10,
            maxPixels=1e9
        ).get('NDWI').getInfo(),
        'tdvi': tdvi.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=geometry_ee,
            scale=10,
            maxPixels=1e9
        ).get('TDVI').getInfo()
    }
    
    return jsonify(stats)

if __name__ == '__main__':
    app.run(port=5001)
```

Then update your Node.js backend to call this service:

```javascript
// In health.service.js
async computeIndicesForField(user_id, field_id, date) {
  const geometry = await this.getFieldGeometry(user_id, field_id);
  
  // Call GEE Python service instead of SentinelHub
  const response = await axios.post('http://localhost:5001/compute-indices', {
    geometry: geometry,
    date: date
  });
  
  return {
    field_id,
    timestamp: `${date}T00:00:00.000Z`,
    source: 'sentinel2-gee',
    ndvi: response.data.ndvi,
    ndwi: response.data.ndwi,
    tdvi: response.data.tdvi,
  };
}
```

## Quick Start: Using Existing ML Service

Since you already have a `ml-service` directory with Python, you can add GEE there!

1. **Add to ml-service/requirements.txt:**
```
earthengine-api
```

2. **Add endpoint to ml-service/app/api.py:**
```python
from flask import Blueprint, request, jsonify
import ee

gee_bp = Blueprint('gee', __name__)

@gee_bp.route('/compute-indices', methods=['POST'])
def compute_indices():
    # Implementation here
    pass
```

3. **Update backend to use GEE service:**
```javascript
// In health.service.js, replace SentinelHub call with:
const response = await axios.post(`${ML_SERVICE_URL}/api/gee/compute-indices`, {
  geometry: geometry,
  date: date
});
```

## Environment Variables

Add to your `.env` files:

```bash
# Google Earth Engine
GEE_PROJECT_ID=your-project-id
GEE_SERVICE_ACCOUNT=your-service-account@project.iam.gserviceaccount.com
GEE_SERVICE_KEY_PATH=/path/to/service-account-key.json

# Or use ML service URL if using Python microservice
GEE_SERVICE_URL=http://localhost:5001
```

## Comparison: SentinelHub vs Google Earth Engine

| Feature | SentinelHub | Google Earth Engine |
|---------|-------------|---------------------|
| **Cost** | Paid plans | Free tier available |
| **API** | REST API | Python/JS SDK + REST |
| **Data Sources** | Sentinel-2, Landsat | Sentinel-2, Landsat, MODIS, more |
| **Processing** | Cloud-based | Cloud-based |
| **Documentation** | Good | Excellent |
| **Community** | Smaller | Large, active |
| **Setup Complexity** | Medium | Medium-High |
| **Node.js Support** | Native | Via Python or REST |

## Next Steps

1. **Request GEE Access**: https://earthengine.google.com/signup
2. **Choose Integration Method**: Python microservice (recommended) or REST API
3. **Update Backend**: Modify `health.service.js` to use GEE instead of SentinelHub
4. **Test**: Verify NDVI, NDWI, TDVI calculations match expected values
5. **Deploy**: Update production environment variables

## Resources

- **GEE Documentation**: https://developers.google.com/earth-engine
- **GEE Python API**: https://github.com/google/earthengine-api
- **Sentinel-2 in GEE**: https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR
- **NDVI Tutorial**: https://developers.google.com/earth-engine/tutorials/community/intro-to-python-api

## Migration Checklist

- [ ] Request Google Earth Engine access
- [ ] Set up authentication (service account or OAuth)
- [ ] Create Python microservice or REST API integration
- [ ] Update `health.service.js` to use GEE
- [ ] Test with sample field geometry
- [ ] Verify NDVI, NDWI, TDVI values
- [ ] Update environment variables
- [ ] Deploy and test in production
- [ ] Remove SentinelHub dependencies (optional)
