# ⚡ VERCEL DEPLOYMENT - QUICK SETUP CARD

**Time:** 5 minutes  
**Steps:** 6 simple steps

---

## 🔗 STEP 1: GO TO VERCEL

**URL:** https://vercel.com/dashboard

---

## 📦 STEP 2: IMPORT PROJECT

1. Click `Add New...` → `Project`
2. Select your `SkyCrop` repository
3. Click `Import`

---

## ⚙️ STEP 3: CONFIGURE

```
Framework Preset:  Vite
Root Directory:    frontend
Build Command:     npm run build
Output Directory:  dist
Install Command:   npm install
```

---

## 🔧 STEP 4: ENVIRONMENT VARIABLES

Click "Environment Variables" and add:

### Variable 1:
**Name:** `VITE_API_BASE_URL`  
**Value:** `https://skycrop-staging-production.up.railway.app/api/v1`

### Variable 2:
**Name:** `VITE_WS_URL`  
**Value:** `wss://skycrop-staging-production.up.railway.app`

### Variable 3:
**Name:** `VITE_APP_NAME`  
**Value:** `SkyCrop`

---

## 🚀 STEP 5: DEPLOY

Click `Deploy` button → Wait 1-2 minutes

---

## 📋 STEP 6: COPY URL

After deployment completes:

**Your URL:** `https://skycrop-[something].vercel.app`

**Copy the full URL!**

---

## ✅ CHECKLIST

Before deploying, verify:

- [ ] Root Directory = `frontend`
- [ ] Build Command = `npm run build`
- [ ] Output Directory = `dist`
- [ ] 3 environment variables added
- [ ] All URLs correct (no typos)

---

## 💬 AFTER DEPLOYMENT:

**Tell me:**

`"Vercel deployed: https://skycrop-[your-url].vercel.app"`

**Then I'll automatically:**
- Update Railway CORS settings
- Test frontend-backend connection
- Verify everything works
- Complete Phase 2! ✅

---

## ❓ NEED HELP?

Check the full guide: `PHASE_2_VERCEL_DEPLOYMENT_GUIDE.md`

---

**🎯 GO DEPLOY NOW!** → https://vercel.com/dashboard

