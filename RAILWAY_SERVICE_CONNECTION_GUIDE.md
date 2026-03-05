# Railway Service Connection Guide

## Problem
Your Railway backend service and PostGIS service are not connected. Railway is showing:
- "Trying to connect a database? Add Variable"
- "Trying to connect this database to a service? Add a Variable Reference"

## Solution: Connect Services via Variable References

### Step 1: Open Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Log in to your account
3. Select your project (the one with your backend and PostGIS services)

### Step 2: Connect PostGIS to Backend Service

#### Option A: Using Railway Dashboard (Recommended)

1. **Navigate to your Backend Service**
   - Click on your backend service in the Railway dashboard

2. **Go to Variables Tab**
   - Click on the **"Variables"** tab in your backend service
   - Or look for the **"Variables"** section in the service settings

3. **Add Variable Reference**
   - Click **"+ New Variable"** or **"Add Variable"** button
   - Look for **"Reference"** or **"Variable Reference"** option
   - Select your **PostGIS/PostgreSQL service** from the dropdown
   - Choose **`DATABASE_URL`** from the available variables
   - Railway will automatically create a reference like: `${{Postgres.DATABASE_URL}}`

4. **Also Add Private URL (Optional but Recommended)**
   - Add another variable reference for **`DATABASE_PRIVATE_URL`**
   - This is better for internal connections (no SSL needed, faster)
   - Select **`DATABASE_PRIVATE_URL`** from your PostGIS service

#### Option B: Using Railway CLI

If you prefer using the command line:

```bash
# Make sure you're in your project directory
cd backend

# Link to your Railway project (if not already linked)
railway link

# Add variable reference to PostGIS service
# Replace "Postgres" with your actual PostGIS service name
railway variables:set DATABASE_URL='${{Postgres.DATABASE_URL}}'
railway variables:set DATABASE_PRIVATE_URL='${{Postgres.DATABASE_PRIVATE_URL}}'
```

### Step 3: Verify Environment Variable Names

Your backend code expects these environment variable names:
- `DATABASEURL` (all caps, no underscore)
- `DATABASEPRIVATEURL` (all caps, no underscore)

But Railway provides:
- `DATABASE_URL` (with underscore)
- `DATABASE_PRIVATE_URL` (with underscore)

**You have two options:**

#### Option A: Add Aliases (Recommended)
Add these variables in your backend service to map Railway's variables:

```bash
# In Railway dashboard, add these variables:
DATABASEURL=${{Postgres.DATABASE_URL}}
DATABASEPRIVATEURL=${{Postgres.DATABASE_PRIVATE_URL}}
```

#### Option B: Update Code (Alternative)
Update `backend/src/config/database.config.js` to use Railway's naming convention.

### Step 4: Verify Connection

After adding the variable references:

1. **Check Variables in Railway Dashboard**
   - Go to your backend service → Variables tab
   - You should see:
     - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (or similar)
     - `DATABASE_PRIVATE_URL` = `${{Postgres.DATABASE_PRIVATE_URL}}` (if added)

2. **Redeploy Your Backend Service**
   - Railway should automatically redeploy when you add variables
   - Or manually trigger a redeploy from the dashboard

3. **Check Logs**
   - Go to your backend service → Logs tab
   - Look for: `Database connection established successfully.`
   - If you see connection errors, check the variable names match

### Step 5: Test Database Connection

You can test the connection using Railway CLI:

```bash
# Test database connection
railway run --service backend node -e "
const { initDatabase } = require('./src/config/database.config.js');
initDatabase().then(() => {
  console.log('✅ Database connected successfully!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
"
```

## Quick Fix Summary

1. **Railway Dashboard** → Your Backend Service → **Variables** tab
2. Click **"+ New Variable"** → Select **"Reference"**
3. Choose your **PostGIS service** → Select **`DATABASE_URL`**
4. Add alias: **`DATABASEURL`** = `${{Postgres.DATABASE_URL}}`
5. Add alias: **`DATABASEPRIVATEURL`** = `${{Postgres.DATABASE_PRIVATE_URL}}`
6. Wait for automatic redeploy
7. Check logs to verify connection

## Troubleshooting

### Issue: "Variable not found"
- Make sure your PostGIS service is in the same Railway project
- Check the service name matches exactly (case-sensitive)

### Issue: "Connection refused"
- Verify PostGIS service is running (green status)
- Check if you're using `DATABASE_PRIVATE_URL` for internal connections
- Ensure SSL is disabled for Railway internal connections (already handled in your code)

### Issue: "Authentication failed"
- Railway automatically handles credentials via variable references
- Don't manually set database credentials - let Railway handle it

### Issue: Variables not updating
- Trigger a manual redeploy after adding variables
- Check that variable references use the correct syntax: `${{ServiceName.VARIABLE_NAME}}`

## Additional Notes

- **Variable References** are Railway's way of securely sharing connection strings between services
- They're automatically updated if the database credentials change
- Use `DATABASE_PRIVATE_URL` for internal connections (faster, no SSL overhead)
- Use `DATABASE_URL` for external connections (if needed)

## Next Steps

After connecting the services:
1. Enable PostGIS extension (if not already done)
2. Run database migrations
3. Verify PostGIS functions are working

See `Doc/sky_crop_railway_deployment_guide.md` for PostGIS setup instructions.
