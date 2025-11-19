# 🤖 AI Recommendations - Quick Start Guide

## 🚀 Try It in 2 Minutes!

### **1. Start Dev Server**
```bash
npm run dev
```

### **2. Navigate to Recommendations**
1. Go to `http://localhost:5173`
2. Click **Dashboard** → **Fields**
3. Click any field card
4. Click **"Recommendations"** tab (map view)

### **3. See AI in Action** ✨
- AI automatically analyzes your field:
  - Health data (NDVI, trend)
  - Weather forecast
  - Yield predictions
  - Growth stage
- Generates 3-5 smart recommendations
- Shows priority (🔴 High, 🟡 Medium, ⚪ Low)
- Includes deadlines ("Apply before...")
- Weather hints for timing

### **4. Apply a Recommendation**
- Read the recommendation
- Take action in your field
- Click **"Mark as applied"**
- See it move to **"History"** section

---

## 🧪 Run Tests

```bash
npm test -- src/features/recommendations/api/aiRecommendationEngine.test.ts
```

**Expected Output:**
```
PASS src/features/recommendations/api/aiRecommendationEngine.test.ts
  ✓ 15 tests passing in 1.7s
```

---

## 🎯 What Recommendations Will You See?

The AI analyzes your field and may recommend:

### **🔴 High Priority (Act Now!)**
- 🚨 **Critical Health Alert** - NDVI <0.4, declining
- 💧 **Apply Irrigation** - Water stress detected
- 🌧️ **Drain Field** - Heavy rain coming
- 🦠 **Disease Risk** - Inspect for fungal disease
- 🌾 **Harvest Ready** - Prepare for harvest

### **🟡 Medium Priority (Plan This Week)**
- 🌱 **Nitrogen Fertilizer** - Vegetative stage
- 🌾 **P&K Fertilizer** - Flowering stage
- 🐛 **Monitor Pests** - High humidity risk
- 📊 **Boost Yield** - Below target prediction

### **⚪ Low Priority (Maintain)**
- ✅ **Continue Practices** - Health improving

---

## 🧠 AI Rules at Work

**Example 1: Water Stress**
```
Field Data:
- NDVI: 0.55 (low)
- Rainfall: 5mm (dry)
- Last irrigation: 10 days ago

AI Decision: 💧 "Apply Irrigation"
Priority: HIGH
Deadline: 3 days
```

**Example 2: Fertilizer Timing**
```
Field Data:
- Growth stage: Vegetative
- NDVI: 0.65 (moderate)
- Last fertilizer: 20 days ago

AI Decision: 🌱 "Apply Nitrogen Fertilizer"
Priority: MEDIUM
Deadline: 7 days
Dose: 40kg/ha urea
```

**Example 3: Weather Alert**
```
Field Data:
- Weather forecast: "Heavy rain expected"

AI Decision: 🌧️ "Drain Excess Water"
Priority: HIGH
Deadline: 1 day
```

---

## 📁 File Structure

```
frontend/src/features/recommendations/
├── api/
│   ├── recommendationApi.ts              # Enhanced with AI
│   ├── aiRecommendationEngine.ts         # Core AI logic
│   └── aiRecommendationEngine.test.ts    # 15 tests ✅
├── components/
│   ├── RecommendationCard.tsx            # Individual rec
│   └── RecommendationsList.tsx           # All recs
├── pages/
│   └── FieldRecommendationsPage.tsx      # Main page
└── hooks/
    └── useRecommendations.ts             # React Query
```

---

## 🎨 Priority Colors

- 🔴 **High / Overdue**: Red badge - Act immediately!
- 🟡 **Medium**: Yellow badge - Plan within week
- ⚪ **Low**: Gray badge - Monitor and maintain
- 🟢 **Applied**: Green badge - Completed

---

## 💡 Pro Tips

1. **Check Daily**: New recommendations based on latest data
2. **Apply Before Deadline**: Recommendations have time limits
3. **Track History**: See what you've applied and when
4. **Weather Hints**: Blue badges show weather-related timing
5. **Offline Works**: AI generates locally, no internet needed

---

## 🆘 Troubleshooting

### **No Recommendations Showing?**
- Field might be in excellent condition! (Good news!)
- Or health data not yet available
- Wait for satellite data update

### **Too Many Recommendations?**
- AI shows max 5 (most important only)
- Focus on **HIGH priority** first

### **Recommendations Don't Make Sense?**
- AI uses mock data for now (demo)
- Real backend integration coming soon
- Rules based on agricultural best practices

---

## 📚 Full Documentation

See **AI_RECOMMENDATIONS_SUMMARY.md** for:
- Complete AI rule documentation (10 rules)
- Architecture decisions
- Testing strategy
- Future enhancements
- BMAD methodology application

---

## 🔥 What Makes This Special?

1. **Smart AI**: 10 intelligent rules analyzing your field
2. **Priority System**: Know what to do first
3. **Time-Sensitive**: Deadlines create urgency
4. **Weather-Aware**: Tied to forecast conditions
5. **Explainable**: See WHY AI recommends
6. **Offline-Capable**: Works without internet
7. **Mobile-First**: Quick decisions on phone
8. **History Tracking**: Learn what worked

---

## 🎉 **You're Ready!**

The AI is analyzing your fields right now. Go check what it recommends! 🚀

---

**Questions?** Check the full documentation in `AI_RECOMMENDATIONS_SUMMARY.md`

**Built with 🧠 for 🌾 Sri Lankan farmers**

