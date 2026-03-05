# How to Update Sentinel Hub Credentials

## ✅ Yes, you can easily replace the old account with your new Sentinel Hub free tier account!

## Required Credentials

You need **2 main credentials** from your new Sentinel Hub account:

1. **Client ID** (`SENTINELHUBCLIENTID`)
2. **Client Secret** (`SENTINELHUBCLIENTSECRET`)

### Optional (usually don't need to change):
- **Base URL** (`SENTINELHUBBASEURL`) - Default: `https://services.sentinel-hub.com`
- **Token URL** (`SENTINELHUBTOKENURL`) - Default: `https://services.sentinel-hub.com/oauth/token`

---

## Where to Find Your Credentials

1. **Log in** to your Sentinel Hub account: https://www.sentinel-hub.com/
2. Go to **Dashboard** → **OAuth clients** (or **Configuration** → **OAuth clients**)
3. You'll see your **Client ID** and **Client Secret**
4. Copy both values

---

## How to Update

### Step 1: Update Environment Variables

You need to update these environment variables in your `.env` file:

**Location:** `backend/.env` (or wherever you store your environment variables)

**Add/Update these lines:**

```env
# ============ SENTINEL HUB API ============
SENTINELHUBCLIENTID=your-new-client-id-here
SENTINELHUBCLIENTSECRET=your-new-client-secret-here

# Optional (usually don't need to change):
# SENTINELHUBBASEURL=https://services.sentinel-hub.com
# SENTINELHUBTOKENURL=https://services.sentinel-hub.com/oauth/token
```

### Step 2: Update in Different Environments

#### **Local Development:**
- Edit `backend/.env` file
- Restart your backend server

#### **Railway (Production):**
1. Go to your Railway project dashboard
2. Select your backend service
3. Go to **Variables** tab
4. Update or add:
   - `SENTINELHUBCLIENTID` = your new client ID
   - `SENTINELHUBCLIENTSECRET` = your new client secret
5. Railway will automatically redeploy

#### **Other Cloud Platforms:**
- Update environment variables in your platform's dashboard
- Restart/redeploy your service

---

## Files That Use These Credentials

The credentials are used in these services:

1. **`backend/src/services/health.service.js`** - For health monitoring (NDVI, NDWI, TDVI)
2. **`backend/src/services/satellite.service.js`** - For satellite tile retrieval

Both services read from the same environment variables, so updating them in one place will work for both.

---

## Testing the New Credentials

After updating, test if it works:

### Option 1: Test via API
```bash
# Make a request to health endpoint (if you have a field)
curl http://localhost:3000/api/v1/fields/{fieldId}/health/compute?date=2025-01-15
```

### Option 2: Check Logs
- Start your backend server
- Look for any errors related to "SentinelHub OAuth error"
- If you see `SentinelHub OAuth error (401)` or `(403)`, the credentials are wrong

### Option 3: Check Railway Logs
```bash
# If deployed on Railway
railway logs
```

---

## Common Issues

### ❌ Error: "SentinelHub OAuth error (401)"
- **Cause**: Invalid Client ID or Client Secret
- **Fix**: Double-check you copied the credentials correctly (no extra spaces)

### ❌ Error: "SentinelHub OAuth error (403)"
- **Cause**: Account doesn't have proper permissions or trial expired
- **Fix**: Verify your account is active and has API access

### ❌ Error: "Sentinel Hub credentials missing"
- **Cause**: Environment variables not set
- **Fix**: Make sure `.env` file exists and has the variables set

---

## Quick Checklist

- [ ] Got Client ID from Sentinel Hub dashboard
- [ ] Got Client Secret from Sentinel Hub dashboard
- [ ] Updated `SENTINELHUBCLIENTID` in `.env` file
- [ ] Updated `SENTINELHUBCLIENTSECRET` in `.env` file
- [ ] Updated Railway/cloud platform variables (if deployed)
- [ ] Restarted backend server
- [ ] Tested API endpoint
- [ ] Verified no errors in logs

---

## Example `.env` Configuration

```env
# ============ SENTINEL HUB API ============
SENTINELHUBCLIENTID=abc123def456ghi789
SENTINELHUBCLIENTSECRET=xyz789uvw456rst123abc456def789

# Optional URLs (usually don't need to change)
SENTINELHUBBASEURL=https://services.sentinel-hub.com
SENTINELHUBTOKENURL=https://services.sentinel-hub.com/oauth/token
```

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to Git (it's already in `.gitignore`)
- Never share your Client Secret publicly
- If credentials are exposed, regenerate them in Sentinel Hub dashboard
- Use different credentials for development and production if possible

---

## Need Help?

If you're still having issues:
1. Check Sentinel Hub dashboard to confirm account is active
2. Verify you're using the correct account type (free tier)
3. Check backend logs for specific error messages
4. Make sure there are no extra spaces in the credentials

---

**That's it!** Once you update the credentials and restart your server, it should work with your new account. 🚀
