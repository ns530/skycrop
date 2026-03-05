# Fix Railway ML Service Error

## 🔴 Current Error

```
[ONNXRuntimeError] : 3 : NO_SUCHFILE : Load model from ml-training/models/unet/1.0.0/model.onnx failed: File doesn't exist
```

## ✅ What I've Done

1. ✅ Added model file to git (commit `7c57625`)
2. ✅ Updated Dockerfile with verification steps
3. ✅ Committed and pushed changes
4. ✅ Triggered new deployment

## 🔧 The Fix: Configure Railway Root Directory

**The problem**: Railway is building from the repository root, but the Dockerfile expects to build from `ml-service/` directory.

**The solution**: Set Railway's "Root Directory" to `ml-service`

### Step-by-Step Instructions

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Login to your account

2. **Select Your Project**
   - Click on **`skycrop-ml-service`** project

3. **Open Service Settings**
   - Click on the **ML service** (the service itself, not the project)
   - Go to the **Settings** tab (or **Configuration**)

4. **Set Root Directory**
   - Find **"Root Directory"** or **"Build Root"** setting
   - Current value is probably: empty, `/`, or `./`
   - **Change it to**: `ml-service`
   - Click **Save**

5. **Redeploy**
   - Railway will automatically trigger a new deployment
   - Or manually click **"Deploy"** / **"Redeploy"**

6. **Verify**
   - Wait 3-5 minutes for build to complete
   - Check build logs - you should see:
     ```
     ✅ UNet model file found
     ```
   - Run test: `node test-ml-direct.js`
   - Should now pass! ✅

## Why This Fixes It

- **Before**: Railway builds from repo root → `COPY .` copies from root → model files not in `ml-service/` path
- **After**: Railway builds from `ml-service/` → `COPY .` copies from `ml-service/` → model files in correct location

## Alternative: If Root Directory Setting Not Available

If you can't find the Root Directory setting, you can:

1. **Create `railway.json` in ml-service directory**:
   ```json
   {
     "build": {
       "builder": "DOCKERFILE",
       "dockerfilePath": "Dockerfile"
     }
   }
   ```

2. **Or update Dockerfile to handle root build**:
   ```dockerfile
   # If building from repo root, adjust paths
   COPY ml-service/ /opt/ml-service/
   ```

But the **Root Directory** setting is the cleanest solution.

## Verification After Fix

Once Root Directory is set and redeployed:

```bash
# Test ML service
node test-ml-direct.js

# Should see:
# ✅ ML Segmentation: PASS
# 🎉 SUCCESS! Model file is working correctly!
```

---

**Status**: ⏳ Waiting for Railway Root Directory configuration  
**Next Action**: Configure Root Directory in Railway Dashboard  
**Time**: 2025-12-14 07:10 UTC
