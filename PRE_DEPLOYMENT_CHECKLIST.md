# 🚀 Pre-Deployment Checklist - SkyCrop

**Complete this checklist before starting deployment to Railway/Vercel/Expo**

---

## ✅ PHASE 0: PREPARATION

### 1. Accounts Setup
- [ ] **Railway Account** - https://railway.app (✅ You have this)
- [ ] **Vercel Account** - https://vercel.com (✅ You have this)
- [ ] **Expo Account** - https://expo.dev (✅ You have this)
- [ ] **GitHub Account** - Repository must be pushed

### 2. Environment Files Created
- [ ] `backend/.env.example` exists
- [ ] `frontend/.env.example` exists
- [ ] `mobile/eas.json` exists ✅ Created
- [ ] `mobile/app.json` updated ✅ Created
- [ ] `deployment_config.txt` created ✅ Created

### 3. Git Repository Status
```bash
# Run these commands:
cd D:\FYP\SkyCrop
git status
# Should show: "nothing to commit, working tree clean"
```

- [ ] All changes committed
- [ ] Pushed to GitHub
- [ ] GitHub repository is accessible
- [ ] No sensitive files in git (check .gitignore)

### 4. Code Quality Checks

#### Backend
```bash
cd backend
npm install
npm test
npm run lint
```
- [ ] Backend tests pass
- [ ] No linting errors
- [ ] All dependencies installed

#### Frontend
```bash
cd frontend
npm install
npm test
npm run build
npm run preview
```
- [ ] Frontend tests pass
- [ ] Build succeeds
- [ ] Preview works locally
- [ ] No console errors

#### Mobile
```bash
cd mobile
npm install
npm test
npm run lint
```
- [ ] Mobile tests pass
- [ ] No TypeScript errors
- [ ] All dependencies installed

### 5. Database Check
- [ ] PostgreSQL migrations exist in `backend/database/migrations/`
- [ ] `init.sql` is ready
- [ ] PostGIS extension will be enabled
- [ ] Seed data prepared (optional)

### 6. Generate JWT Secret

```bash
# Run this command and save the output:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

- [ ] JWT Secret generated
- [ ] Saved in `deployment_config.txt`
- [ ] Minimum 64 characters

### 7. Mobile Assets Prepared

Check if these exist:
- [ ] `mobile/assets/icon.png` (1024x1024)
- [ ] `mobile/assets/splash.png` (1284x2778)
- [ ] `mobile/assets/adaptive-icon.png` (1024x1024)

**If missing:** Create placeholder images or use project logo

### 8. API Keys (Optional but recommended)

Collect if you have them:
- [ ] Weather API Key (OpenWeatherMap)
- [ ] Google Maps API Key
- [ ] AWS S3 credentials (if using)

---

## 🎯 READY TO DEPLOY?

### Pre-Flight Check

Run this command to verify everything:

```bash
# Backend health check
cd backend
npm start
# Visit: http://localhost:3000/api/v1/health
# Should return: {"status":"ok",...}

# Frontend build check
cd ../frontend
npm run build
# Should complete without errors

# Mobile compile check
cd ../mobile
npm run android --dry-run
# Should show no critical errors
```

### Final Verification

- [ ] ✅ All accounts created
- [ ] ✅ Config files created
- [ ] ✅ Git pushed to GitHub
- [ ] ✅ Backend builds locally
- [ ] ✅ Frontend builds locally
- [ ] ✅ Mobile compiles
- [ ] ✅ JWT secret generated
- [ ] ✅ Mobile assets exist

---

## 🚀 DEPLOYMENT ORDER

Once checklist is complete, proceed in this order:

1. **Phase 1: Railway** (60 min)
   - Deploy PostgreSQL + PostGIS
   - Deploy Redis
   - Deploy Backend API
   - Run migrations
   - Test health endpoint

2. **Phase 2: Vercel** (30 min)
   - Deploy Frontend
   - Set environment variables
   - Update Railway CORS
   - Test web dashboard

3. **Phase 3: Expo** (45 min)
   - Initialize EAS
   - Build Android APK
   - Test on device
   - Create download page

4. **Phase 4: Testing** (45 min)
   - Full integration testing
   - Cross-platform sync test
   - Performance check

---

## ⚠️ TROUBLESHOOTING

### If Backend Build Fails:
- Check Node version (needs >= 20.0.0)
- Verify all dependencies in package.json
- Check for syntax errors: `npm run lint`

### If Frontend Build Fails:
- Check for TypeScript errors: `npm run type-check`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Vite config

### If Mobile Build Fails:
- Verify React Native version compatibility
- Check Android SDK installed
- Clear metro cache: `npm start -- --reset-cache`

---

## 📞 NEED HELP?

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **Expo Docs:** https://docs.expo.dev
- **Discord Support:** Railway/Vercel/Expo community servers

---

**Ready? Let's deploy! 🚀**

