# Next Steps After Google Earth Engine Sign-In

## Step 1: Install Google Earth Engine API

Open terminal and run:

```bash
cd ml-service
pip install earthengine-api
```

## Step 2: Authenticate Locally

After installing, authenticate your local machine:

```bash
# This will open a browser for authentication
earthengine authenticate
```

**What happens:**
- A browser window will open
- You'll be asked to sign in with your Google account (the one you used for GEE)
- Grant permissions
- Authentication credentials will be saved locally

## Step 3: Test the Setup

### Option A: Test via Python (Quick Test)

Create a test file `ml-service/test_gee.py`:

```python
import ee

# Initialize
ee.Initialize()

# Test with a simple geometry
geometry = ee.Geometry.Polygon([[[80.0, 6.0], [80.1, 6.0], [80.1, 6.1], [80.0, 6.1], [80.0, 6.0]]])

# Load Sentinel-2
collection = ee.ImageCollection('COPERNICUS/S2_SR') \
    .filterDate('2024-01-15', '2024-01-16') \
    .filterBounds(geometry) \
    .first()

print("✅ GEE is working! Found image:", collection.get('system:index').getInfo())
```

Run it:
```bash
cd ml-service
python test_gee.py
```

### Option B: Test via ML Service API

1. **Start your ML service:**
```bash
cd ml-service
python -m flask run --port=80
# Or use your normal start command
```

2. **Test the endpoint:**
```bash
curl -X POST http://localhost:80/api/gee/compute-indices \
  -H "Content-Type: application/json" \
  -H "X-Internal-Auth: your-internal-token" \
  -d '{
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[80.0, 6.0], [80.1, 6.0], [80.1, 6.1], [80.0, 6.1], [80.0, 6.0]]]
    },
    "date": "2024-01-15"
  }'
```

## Step 4: Verify Backend Configuration

Check your `backend/.env` file has:

```bash
ML_SERVICE_URL=http://localhost:80
ML_SERVICE_INTERNAL_AUTH_TOKEN=your-internal-token
```

(Use the same token you use for other ML service endpoints)

## Step 5: Test Full Flow

1. **Start ML service:**
```bash
cd ml-service
python -m flask run --port=80
```

2. **Start backend:**
```bash
cd backend
npm start
```

3. **Trigger health analysis from your mobile app or API:**
   - The backend will call ML service
   - ML service will use GEE to compute indices
   - Results will be returned

## Troubleshooting

### "earthengine: command not found"
```bash
# Make sure you installed it
pip install earthengine-api

# If using virtual environment, activate it first
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

### "Authentication failed"
```bash
# Try re-authenticating
earthengine authenticate --force
```

### "No module named 'ee'"
```bash
# Make sure you're in the right environment
pip install earthengine-api
```

### "GEE computation failed: No Sentinel-2 image found"
- Try a different date (recent dates work better)
- Check if the area has cloud-free imagery
- GEE automatically filters images with >30% cloud

### "Connection refused" when calling ML service
- Make sure ML service is running on port 80
- Check `ML_SERVICE_URL` in backend `.env`
- Verify firewall isn't blocking

## Success Indicators

✅ **GEE is working when:**
- `earthengine authenticate` completes without errors
- Test script runs and prints image info
- ML service endpoint returns indices (ndvi, ndwi, tdvi)
- Backend can trigger health analysis successfully

## What Happens Next

Once everything is set up:
1. User triggers health analysis in mobile app
2. Backend calls ML service `/api/gee/compute-indices`
3. ML service uses GEE to compute NDVI, NDWI, TDVI
4. Results are cached and returned
5. Mobile app displays health data! 🎉

## Quick Checklist

- [ ] Installed `earthengine-api`: `pip install earthengine-api`
- [ ] Authenticated: `earthengine authenticate`
- [ ] Tested GEE: Ran test script or API call
- [ ] ML service running: `python -m flask run --port=80`
- [ ] Backend configured: Check `.env` has `ML_SERVICE_URL`
- [ ] Tested full flow: Trigger health analysis from app

## Need Help?

If you get stuck:
1. Check ML service logs for GEE errors
2. Verify authentication: `earthengine authenticate --force`
3. Test with a simple Python script first
4. Check backend logs when calling the endpoint
