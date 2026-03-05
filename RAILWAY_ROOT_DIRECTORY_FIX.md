# Railway Root Directory Configuration Fix

## Problem

The ML service is failing because model files are not being copied during the Docker build. The error shows:
```
Load model from ml-training/models/unet/1.0.0/model.onnx failed: File doesn't exist
```

## Root Cause

Railway is likely building from the **repository root** instead of the `ml-service/` directory. This means:
- The Dockerfile `COPY . /opt/ml-service` is copying from the wrong location
- Model files in `ml-service/ml-training/` are not being included

## Solution: Configure Railway Root Directory

### Step 1: Access Railway Dashboard

1. Go to https://railway.app
2. Login to your account
3. Select the **`skycrop-ml-service`** project

### Step 2: Configure Root Directory

1. Click on the **ML service** (not the project, but the service itself)
2. Go to **Settings** tab
3. Scroll down to **"Root Directory"** or **"Build Root"** setting
4. Set it to: **`ml-service`**
5. **Save** the changes

### Step 3: Redeploy

After saving, Railway will automatically trigger a new deployment. Or manually trigger:
- Click **"Deploy"** or **"Redeploy"** button
- Or use CLI: `cd ml-service && railway up`

## Verification

After redeployment, check the build logs. You should see:
```
✅ UNet model file found
```

If you see:
```
❌ UNet model file NOT found
```

Then the Root Directory is still incorrect.

## Alternative: Check Current Root Directory

If you're not sure what the current setting is:

1. Go to Railway Dashboard
2. Select `skycrop-ml-service` project
3. Click on the service
4. Go to Settings
5. Look for "Root Directory" or "Build Root"
6. It should be: `ml-service` (not empty, not `/`, not `./`)

## Why This Matters

When Railway builds your service:
- **Without Root Directory**: Builds from repository root → `COPY .` copies everything from root
- **With Root Directory = `ml-service`**: Builds from `ml-service/` → `COPY .` copies from `ml-service/` directory

Since your Dockerfile is in `ml-service/` and expects to copy from that directory, Railway must build from `ml-service/` as the root.

## Current Status

✅ Dockerfile updated with verification steps  
✅ Changes committed and pushed  
⏳ Waiting for Railway to rebuild  
🔍 Next: Check Railway Dashboard for Root Directory setting

---

**Last Updated**: 2025-12-14 07:05 UTC
