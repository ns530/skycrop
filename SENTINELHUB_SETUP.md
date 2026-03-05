# SentinelHub API Setup Guide

## SentinelHub API Endpoints

Your backend uses the following SentinelHub API endpoints:

### 1. OAuth Token Endpoint
- **URL**: `https://services.sentinel-hub.com/oauth/token`
- **Method**: POST
- **Purpose**: Get OAuth access token for API authentication
- **Content-Type**: `application/x-www-form-urlencoded`

### 2. Process API Endpoint
- **Base URL**: `https://services.sentinel-hub.com`
- **API Endpoint**: `/api/v1/process`
- **Method**: POST
- **Purpose**: Request satellite imagery processing (NDVI, NDWI, TDVI indices)

### 3. Configuration in Backend
The backend uses these environment variables:
- `SENTINELHUBBASEURL` (default: `https://services.sentinel-hub.com`)
- `SENTINELHUBTOKENURL` (default: `https://services.sentinel-hub.com/oauth/token`)
- `SENTINELHUBCLIENTID` (**REQUIRED**)
- `SENTINELHUBCLIENTSECRET` (**REQUIRED**)

## How to Get SentinelHub Credentials

### Step 1: Create SentinelHub Account
1. Go to https://www.sentinel-hub.com/
2. Sign up for a free account (or log in if you already have one)
3. Navigate to your Dashboard

### Step 2: Create OAuth Client
1. In the SentinelHub Dashboard, go to **"OAuth clients"** section
2. Click **"Create new OAuth client"**
3. Fill in the details:
   - **Name**: SkyCrop (or any name you prefer)
   - **Redirect URL**: Not required for client credentials flow
   - **Scopes**: Select the scopes you need (usually `SH` for Sentinel Hub)
4. Click **"Create"**
5. You'll receive:
   - **Client ID** (this is your `SENTINELHUBCLIENTID`)
   - **Client Secret** (this is your `SENTINELHUBCLIENTSECRET`)

### Step 3: Configure Backend Environment Variables

Add these to your `backend/.env` file:

```bash
# SentinelHub API Credentials
SENTINELHUBCLIENTID=your-client-id-here
SENTINELHUBCLIENTSECRET=your-client-secret-here

# Optional (usually don't need to change):
# SENTINELHUBBASEURL=https://services.sentinel-hub.com
# SENTINELHUBTOKENURL=https://services.sentinel-hub.com/oauth/token
```

### Step 4: Restart Backend
After adding the credentials, restart your backend server:
```bash
cd backend
npm start
# or
node src/app.js
```

## Testing the Configuration

### Test OAuth Token
You can test if your credentials work by making a direct request:

```bash
curl -X POST https://services.sentinel-hub.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"
```

If successful, you'll get a response like:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

## Troubleshooting

### Error: "SentinelHub OAuth error (401)"
This means:
- ❌ Client ID is incorrect
- ❌ Client Secret is incorrect
- ❌ Credentials are expired/revoked
- ❌ OAuth client doesn't have required scopes

**Solution**: 
1. Verify credentials in SentinelHub Dashboard
2. Check that environment variables are set correctly
3. Ensure no extra spaces or quotes in `.env` file
4. Restart backend after changing `.env`

### Error: "SentinelHub OAuth error (403)"
This means:
- ❌ OAuth client doesn't have required permissions/scopes

**Solution**: 
1. Check OAuth client scopes in SentinelHub Dashboard
2. Ensure `SH` scope is enabled

### Error: Network/Timeout
This means:
- ❌ Backend cannot reach SentinelHub servers
- ❌ Firewall blocking outbound connections

**Solution**: 
1. Check backend network connectivity
2. Verify firewall rules allow outbound HTTPS to `services.sentinel-hub.com`

## Free Tier Limits

SentinelHub free tier typically includes:
- Limited number of requests per month
- Limited processing area
- Some features may be restricted

Check your SentinelHub Dashboard for current usage and limits.

## Production Considerations

For production:
1. Store credentials securely (use environment variables, not code)
2. Use a secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
3. Monitor API usage to avoid exceeding limits
4. Implement retry logic for transient failures
5. Cache OAuth tokens (your backend already does this)

## Additional Resources

- SentinelHub Documentation: https://docs.sentinel-hub.com/
- SentinelHub API Reference: https://docs.sentinel-hub.com/api/
- SentinelHub Dashboard: https://www.sentinel-hub.com/dashboard
