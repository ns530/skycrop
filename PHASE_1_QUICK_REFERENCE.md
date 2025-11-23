# 🚂 PHASE 1: Railway Deployment - Quick Reference Card

**⏱️ Total Time:** 60 minutes  
**💰 Cost:** $0 (free credit)  
**🎯 Goal:** Live backend API on Railway

---

## 📋 STEPS OVERVIEW

```
Step 1.1: Create Project         → 5 min   → railway.app/dashboard
Step 1.2: Deploy PostgreSQL      → 10 min  → Enable PostGIS
Step 1.3: Deploy Redis           → 5 min   → Get connection URL
Step 1.4: Configure Backend      → 10 min  → Set root dir: backend
Step 1.5: Set Variables          → 15 min  → Use Raw Editor
Step 1.6: Deploy Backend         → 10 min  → Monitor build logs
Step 1.7: Run Migrations         → 5 min   → railway run npm run migrate
Step 1.8: Test Health            → 5 min   → /api/v1/health
Step 1.9: Save URLs              → 5 min   → Update deployment_config.txt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 60 minutes
```

---

## 🔗 IMPORTANT LINKS

| Service | URL |
|---------|-----|
| Railway Dashboard | https://railway.app/dashboard |
| Railway Docs | https://docs.railway.app |
| Railway CLI | `npm install -g @railway/cli` |
| Your Deployment Guide | `PHASE_1_RAILWAY_DEPLOYMENT_STEPS.md` |
| Track Progress | `deployment_config.txt` |

---

## 🔐 KEY VALUES TO SAVE

```
DATABASE_URL=postgresql://postgres:...@...railway.app:7432/railway
REDIS_URL=redis://default:...@...railway.app:6379
BACKEND_URL=https://skycrop-backend-production-xxx.up.railway.app
JWT_SECRET=180913647ffcb30e5c662b0c1835aafefedbe6a18bd22a3288ddf01ec92d6330ab973f060bd7e30149ddb7d703b0188c8b135e2d2d9ea111c3f7d57827b7809d
```

**Save all to:** `deployment_config.txt`

---

## ⚡ CRITICAL RAILWAY SETTINGS

### Root Directory:
```
backend
```

### Watch Paths:
```
backend/**
```

### Environment Variables (Raw Editor):
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=180913647ffcb30e5c662b0c1835aafefedbe6a18bd22a3288ddf01ec92d6330ab973f060bd7e30149ddb7d703b0188c8b135e2d2d9ea111c3f7d57827b7809d
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
LOG_LEVEL=info
WEBSOCKET_PORT=3000
ENABLE_CRON_JOBS=true
ENABLE_FIELD_SHARING=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_DISASTER_DETECTION=true
ENABLE_YIELD_PREDICTION=true
```

### PostGIS SQL:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

---

## 🧪 TESTING COMMANDS

### Health Check:
```powershell
$url = "https://YOUR-BACKEND-URL.up.railway.app"
Invoke-RestMethod -Uri "$url/api/v1/health" | ConvertTo-Json
```

### Expected Response:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

---

## 🚨 COMMON ISSUES

| Issue | Solution |
|-------|----------|
| Build fails | Check root directory = `backend` |
| 502/503 error | Wait 1-2 minutes, service starting |
| Database disconnected | Verify `${{Postgres.DATABASE_URL}}` syntax |
| Redis disconnected | Verify `${{Redis.REDIS_URL}}` syntax |
| PostGIS error | Run CREATE EXTENSION SQL |
| Migrations fail | Use Railway CLI: `railway run npm run migrate` |

---

## 📊 SUCCESS CRITERIA

```
✅ Railway project created
✅ PostgreSQL running with PostGIS
✅ Redis running
✅ Backend deployed (status: Active)
✅ Environment variables set
✅ Migrations executed
✅ Health endpoint: 200 OK
✅ Database: connected
✅ Redis: connected
✅ No critical errors in logs
✅ Backend URL saved
```

**When all ✅, Phase 1 is COMPLETE!**

---

## ⏭️ AFTER PHASE 1

**You'll have:**
- Live backend API
- Production database
- Public URL ready for frontend

**Next: Phase 2 - Vercel (Frontend)**
- Time: 30 minutes
- Use backend URL from Phase 1

---

## 📞 GET HELP

**Stuck?** Check:
1. `PHASE_1_RAILWAY_DEPLOYMENT_STEPS.md` (detailed guide)
2. Railway logs (Dashboard → Service → Logs)
3. Railway docs: https://docs.railway.app
4. Ask me for help anytime!

---

**🚀 Ready? Open: https://railway.app/dashboard**

**Then follow: `PHASE_1_RAILWAY_DEPLOYMENT_STEPS.md`**

