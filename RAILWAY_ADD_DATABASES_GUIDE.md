# 🗄️ Quick Guide: Add PostgreSQL & Redis to Railway

**Time:** 5 minutes  
**Method:** Railway Dashboard (Manual)  
**Why:** Railway CLI/MCP doesn't support adding database services

---

## 🔗 **OPEN YOUR PROJECT:**

**Direct Link:** https://railway.app/project/c8fd9cd7-1a90-482f-bf09-4097eb42a8ef

Or go to: https://railway.app/dashboard → Click "skycrop-staging"

---

## ✅ **STEP 1: CHECK IF REDIS EXISTS**

**Look at your project dashboard:**

Do you see a **Redis** service card?
- ✅ **Yes** → Skip to Step 2 (PostgreSQL)
- ❌ **No** → Add it now (see below)

### **To Add Redis:**
1. Click **"+ New"** button (usually top-right or in center)
2. Select **"Database"**
3. Choose **"Add Redis"**
4. Wait 30 seconds
5. Redis card appears with status "Active" (green)

---

## ✅ **STEP 2: ADD POSTGRESQL**

**In your project dashboard:**

1. Click **"+ New"** button
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Wait 30 seconds
5. PostgreSQL card appears with status "Active" (green)

**That's it!** PostgreSQL is ready!

---

## ✅ **STEP 3: VERIFY BOTH DATABASES**

**Your dashboard should now show:**

```
skycrop-staging (Project)
├── skycrop-staging (Backend Service) ✅
├── PostgreSQL ✅ (Active)
└── Redis ✅ (Active)
```

**3 service cards total**

---

## 🎯 **VISUAL CHECKLIST:**

Look at your Railway dashboard and verify:

- [ ] I see **3 service cards** in my project
- [ ] One card labeled **"PostgreSQL"** with green "Active" status
- [ ] One card labeled **"Redis"** with green "Active" status
- [ ] One card labeled **"skycrop-staging"** (backend service)

---

## ⏭️ **AFTER ADDING DATABASES:**

**Tell me:** "Databases added" or "Both databases ready"

**Then I will automatically:**
1. ✅ Get PostgreSQL URL
2. ✅ Get Redis URL
3. ✅ Enable PostGIS extension
4. ✅ Set all environment variables
5. ✅ Generate public domain URL
6. ✅ Run database migrations
7. ✅ Test health endpoint
8. ✅ Save all URLs to deployment_config.txt

**All automated with Railway MCP tools!** 🚀

---

## 🆘 **COMMON ISSUES:**

### **Issue: Can't find "+ New" button**
- Look for **"Add Service"** button instead
- Or look for **"+"** icon at top-right
- Try refreshing the page

### **Issue: Database taking too long**
- Normal provisioning time: 30-60 seconds
- Refresh page after 1 minute
- Status should change from "Deploying" to "Active"

### **Issue: I already have Redis**
- Great! That's from your list-projects output
- Just add PostgreSQL then tell me

### **Issue: Dashboard looks different**
- Railway updates UI frequently
- Look for "Add Database" or "+ New" or "Add Service"
- Should be obvious button to add services

---

## 📸 **WHAT YOU'RE LOOKING FOR:**

**Button names to click:**
- "+ New"
- "Add Service"
- "+"
- "New Service"

**Then:**
- "Database"
- "PostgreSQL" or "Add PostgreSQL"
- "Redis" or "Add Redis"

---

## ⚡ **SUPER QUICK STEPS:**

```
1. Open: https://railway.app/project/c8fd9cd7-1a90-482f-bf09-4097eb42a8ef
2. Click: "+ New"
3. Click: "Database" → "Add PostgreSQL"
4. Wait 30 seconds
5. Verify: PostgreSQL shows "Active"
6. Verify: Redis exists (should be there already)
7. Tell me: "Databases added"
```

---

**Go ahead and add the databases! I'll wait for your update.** 🚀

**Takes literally 2 minutes!** ⏱️

