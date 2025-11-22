# 🚀 SkyCrop Deployment - Quick Start Guide

**30-Minute Quick Reference**

---

## 📦 WHAT YOU'RE DEPLOYING

```
┌─────────────────────────────────────────────┐
│         SKYCROP PRODUCTION STACK            │
├─────────────────────────────────────────────┤
│  Backend API          → Railway             │
│  PostgreSQL + PostGIS → Railway             │
│  Redis                → Railway             │
│  Web Dashboard        → Vercel              │
│  Mobile App (Android) → Expo EAS            │
└─────────────────────────────────────────────┘
```

**Cost:** $10-20/month (everything else is FREE!)

---

## ⚡ SUPER QUICK DEPLOYMENT (4 HOURS)

### 1️⃣ RAILWAY (Backend) - 60 minutes

```bash
# 1. Sign up: https://railway.app
# 2. New Project → Deploy from GitHub
# 3. Select SkyCrop repo
# 4. Add PostgreSQL database
# 5. Add Redis
# 6. Configure backend service:
#    - Root: backend/
#    - Start: npm start

# 7. Add environment variables:
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=your-32-char-secret-key
CORS_ORIGINS=https://skycrop.vercel.app

# 8. Deploy → Get URL
# Result: https://skycrop-backend-xxx.up.railway.app ✅
```

### 2️⃣ VERCEL (Frontend) - 30 minutes

```bash
# 1. Sign up: https://vercel.com
# 2. New Project → Import from GitHub
# 3. Select SkyCrop repo
# 4. Configure:
#    - Framework: Vite
#    - Root: frontend/
#    - Build: npm run build
#    - Output: dist

# 5. Add environment variables:
VITE_API_BASE_URL=https://your-railway-backend.up.railway.app/api/v1
VITE_WS_URL=wss://your-railway-backend.up.railway.app

# 6. Deploy
# Result: https://skycrop.vercel.app ✅
```

### 3️⃣ EXPO (Mobile) - 45 minutes

```bash
# 1. Sign up: https://expo.dev
# 2. Install EAS CLI
npm install -g eas-cli
eas login

# 3. Configure app
cd mobile
eas build:configure

# 4. Update app.json and eas.json with backend URLs

# 5. Build Android APK
eas build --platform android --profile production

# Wait 15 minutes...
# Result: APK download link ✅
```

### 4️⃣ VERIFY - 15 minutes

```bash
# Test backend
curl https://your-backend.up.railway.app/api/v1/health

# Test frontend
# Open: https://skycrop.vercel.app

# Test mobile
# Download APK and install on Android
```

---

## 🎯 DEPLOYMENT ORDER

**MUST follow this order:**

```
1. Railway Backend     → Get backend URL
   ↓
2. Vercel Frontend     → Use backend URL
   ↓
3. Expo Mobile         → Use backend URL
   ↓
4. Test Everything     → Verify all works
```

**Why this order?**
- Frontend needs backend URL
- Mobile needs backend URL
- Can't test without backend running

---

## 📝 ESSENTIAL ENVIRONMENT VARIABLES

### Railway (Backend):
```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=min-32-chars-random-string
CORS_ORIGINS=https://skycrop.vercel.app
PORT=3000
```

### Vercel (Frontend):
```env
VITE_API_BASE_URL=https://your-backend.up.railway.app/api/v1
VITE_WS_URL=wss://your-backend.up.railway.app
```

### Expo (Mobile - in eas.json):
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://your-backend.up.railway.app/api/v1",
        "EXPO_PUBLIC_WS_URL": "wss://your-backend.up.railway.app"
      }
    }
  }
}
```

---

## 🔥 COMMON MISTAKES TO AVOID

❌ **Don't:** Deploy frontend before backend  
✅ **Do:** Deploy backend first, get URL, then frontend

❌ **Don't:** Forget to enable PostGIS in PostgreSQL  
✅ **Do:** Run `CREATE EXTENSION postgis;` after database setup

❌ **Don't:** Use HTTP URLs in production  
✅ **Do:** Always use HTTPS/WSS

❌ **Don't:** Hardcode URLs in code  
✅ **Do:** Use environment variables

❌ **Don't:** Commit .env files to git  
✅ **Do:** Use .env.example as template

---

## 🚨 TROUBLESHOOTING

### Backend Won't Start:
```bash
# Check Railway logs:
# Dashboard → Backend Service → Logs

# Common issues:
- Missing DATABASE_URL → Add PostgreSQL service
- Missing REDIS_URL → Add Redis service
- Port conflict → Railway auto-assigns PORT
```

### Frontend Can't Connect:
```bash
# Check Vercel build logs:
# Dashboard → Project → Deployments → Latest

# Common issues:
- Wrong API URL → Check VITE_API_BASE_URL
- CORS error → Add frontend URL to Railway CORS_ORIGINS
- Build failed → Check npm install and build command
```

### Mobile App Crashes:
```bash
# Check Expo build logs:
# https://expo.dev → Project → Builds

# Common issues:
- Wrong API URL → Check eas.json env variables
- Missing permissions → Check app.json android.permissions
- Build failed → Check package.json dependencies
```

---

## 📊 MONITORING CHECKLIST

After deployment, set up:

- [ ] **Sentry** (Error Tracking)
  - Backend: https://sentry.io
  - Frontend: https://sentry.io
  - Cost: FREE (5,000 errors/month)

- [ ] **UptimeRobot** (Uptime Monitoring)
  - Monitor: https://api.skycrop.io/health
  - Interval: Every 5 minutes
  - Cost: FREE

- [ ] **Railway Metrics**
  - Dashboard → Service → Metrics
  - Watch: CPU, Memory, Network

- [ ] **Vercel Analytics**
  - Dashboard → Project → Analytics
  - Watch: Page views, Performance

---

## 💡 PRO TIPS

**1. Use Railway CLI for debugging:**
```bash
npm i -g @railway/cli
railway login
railway link
railway logs
railway shell
```

**2. Enable auto-deploy:**
- Railway: Auto-deploys on git push (enabled by default)
- Vercel: Auto-deploys on git push (enabled by default)

**3. Use staging environment:**
```bash
# Create staging branch
git checkout -b staging

# Deploy to staging:
# Railway → New Environment → Staging
# Vercel → Settings → Git → Add Branch
```

**4. Database migrations:**
```bash
# After deploying, run migrations:
railway run npm run migrate

# Or in Railway shell:
# Dashboard → Service → Shell → npm run migrate
```

**5. Health checks:**
```bash
# Add health endpoint:
# backend/src/routes/health.js

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    database: 'connected',
    redis: 'connected'
  });
});
```

---

## 🎯 SUCCESS CRITERIA

**Deployment is successful when:**

✅ Backend health endpoint returns 200 OK  
✅ Frontend loads and displays login page  
✅ Can create account and login on web  
✅ Mobile app installs and connects to backend  
✅ Can create field on web and see on mobile  
✅ WebSocket real-time features work  
✅ No errors in Sentry  
✅ Uptime is 99.9%+  

---

## 📚 DETAILED GUIDES

For step-by-step instructions, see:

📖 **Full Guide:** `PRODUCTION_DEPLOYMENT_SEQUENTIAL_GUIDE.md`  
📖 **Railway Guide:** https://docs.railway.app  
📖 **Vercel Guide:** https://vercel.com/docs  
📖 **Expo Guide:** https://docs.expo.dev/build/introduction  

---

## 🆘 NEED HELP?

**Documentation:**
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Expo: https://docs.expo.dev

**Support:**
- Railway Discord: https://discord.gg/railway
- Vercel Discord: https://vercel.com/discord
- Expo Discord: https://chat.expo.dev

**Community:**
- Railway Twitter: @Railway
- Vercel Twitter: @vercel
- Expo Twitter: @expo

---

## 🎉 READY TO DEPLOY?

**Three options:**

1. **Follow Full Guide** (Recommended for first time)
   - See: `PRODUCTION_DEPLOYMENT_SEQUENTIAL_GUIDE.md`
   - Time: 4-5 hours
   - Includes: Testing, monitoring, backups

2. **Quick Deploy** (Experienced users)
   - Follow this guide
   - Time: 2-3 hours
   - Get running fast

3. **One Command Deploy** (Future)
   - Script coming soon
   - Time: 30 minutes
   - Automated setup

---

**Let's deploy! 🚀🌾**

Follow the steps above and you'll be live in a few hours!

**Questions?** Check `PRODUCTION_DEPLOYMENT_SEQUENTIAL_GUIDE.md` for detailed instructions! 💪✨

