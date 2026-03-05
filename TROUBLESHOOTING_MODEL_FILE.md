# Troubleshooting: ML Model File Not Found in Deployment

## Current Status

✅ **Model file exists locally**: `ml-service/ml-training/models/unet/1.0.0/model.onnx` (7.4 MB)  
✅ **Model file is in git**: Verified with `git ls-files`  
✅ **Build completed successfully**: Railway deployment finished  
❌ **Model file not found in container**: Service still returns 502 error

## Problem Analysis

The model file is committed to git and the build completes, but the file is not found at runtime in the container. This suggests one of these issues:

### Possible Causes

1. **Railway Build Context Issue**
   - Railway might be building from repository root instead of `ml-service/` directory
   - The Dockerfile `COPY . /opt/ml-service` might not be copying from the right location

2. **Git Repository Branch**
   - Railway might be building from a different branch
   - The commit might not be on the branch Railway is watching

3. **Railway Root Directory Setting**
   - Railway service might have a "Root Directory" setting that's incorrect
   - This would cause Railway to build from the wrong directory

## Solutions to Try

### Solution 1: Verify Railway Root Directory Setting

1. Go to Railway Dashboard
2. Select `skycrop-ml-service` project
3. Go to Service Settings
4. Check "Root Directory" setting
5. It should be: `ml-service` (not empty or `/`)
6. If incorrect, set it to `ml-service` and redeploy

### Solution 2: Verify Git Branch

```bash
# Check current branch
git branch

# Verify commit is on main
git log --oneline -1

# Check if Railway is watching the correct branch
# (Check in Railway dashboard → Settings → Source)
```

### Solution 3: Check Build Logs for File Copy

Look in Railway build logs for:
- `COPY . /opt/ml-service` step
- Any errors or warnings about missing files
- File listing showing what was copied

### Solution 4: Update Dockerfile to Explicitly Copy Model

Modify `ml-service/Dockerfile` to explicitly copy the model file:

```dockerfile
# Copy application
COPY . /opt/ml-service

# Explicitly verify model file is copied
RUN ls -la /opt/ml-service/ml-training/models/unet/1.0.0/ || echo "Model directory not found"
RUN test -f /opt/ml-service/ml-training/models/unet/1.0.0/model.onnx || echo "Model file not found"
```

This will help identify if the file is being copied during build.

### Solution 5: Use Railway Environment Variables

Set the model path via environment variable and download on startup if not found:

1. Add startup script to download model if missing
2. Or use Railway volumes to mount the model file

## Immediate Action Items

1. **Check Railway Dashboard**:
   - [ ] Verify Root Directory is set to `ml-service`
   - [ ] Verify Git branch is `main`
   - [ ] Check build logs for file copy operations

2. **Verify Git**:
   ```bash
   git ls-files ml-service/ml-training/models/unet/1.0.0/model.onnx
   git log --oneline -1
   ```

3. **Test Locally**:
   ```bash
   cd ml-service
   docker build -t test-ml .
   docker run --rm test-ml ls -la /opt/ml-service/ml-training/models/unet/1.0.0/
   ```

## Next Steps

1. Check Railway service settings for Root Directory
2. If Root Directory is wrong, fix it and redeploy
3. If Root Directory is correct, check build logs more carefully
4. Consider adding explicit file verification in Dockerfile

---

**Last Updated**: 2025-12-14 06:58 UTC  
**Status**: Investigating Railway build context
