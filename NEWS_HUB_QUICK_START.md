# 📰 News Hub - Quick Start Guide

## 🚀 Try It Now!

### **1. Start the Dev Server**
```bash
cd frontend
npm run dev
```

### **2. Navigate to News**
- Open browser: `http://localhost:5173`
- Click **"News"** in the navigation menu
- Or go directly to: `http://localhost:5173/news`

### **3. Create Sample Content** (Optional)
Since we're using the admin content system:

1. Go to: `http://localhost:5173/admin/content`
2. Click **"Create content"**
3. Fill in:
   - **Title**: "10 Tips for Better Paddy Yield"
   - **Summary**: "Learn proven techniques to increase your harvest"
   - **Body**: Add detailed content (supports Markdown-like syntax)
   - **Status**: Select **"published"**
4. Click **"Save"**

Your article will appear immediately in the News Hub! 📰

---

## ✨ Features to Try

### **Browse Articles**
- Grid view with article cards
- Click any card to read full article

### **Filter by Category**
- Click category chips at the top
- Try: "Farming Tips", "Weather", "Market Prices", etc.

### **Search**
- Type keyword in search bar
- Results update instantly

### **Pagination**
- Navigate through pages if you have many articles
- Smart ellipsis for long lists

### **Article Details**
- Hero image display
- Rich text formatting
- Author and date metadata
- View count
- Tags

---

## 🧪 Run Tests

```bash
cd frontend
npm test -- src/features/news/api/newsApi.test.ts
```

**Expected Output:**
```
PASS src/features/news/api/newsApi.test.ts
  newsApi
    ✓ should fetch list of published articles
    ✓ should apply filters and pagination
    ✓ should fetch single article by ID
    ✓ should search articles by query
    ✓ should filter articles by category

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

---

## 📁 File Structure

```
frontend/src/features/news/
├── api/
│   ├── newsApi.ts              # API functions
│   └── newsApi.test.ts         # Tests
├── hooks/
│   └── useNews.ts              # React Query hooks
├── components/
│   └── NewsCard.tsx            # Article card component
├── pages/
│   ├── NewsListPage.tsx        # Browse page
│   └── ArticleDetailPage.tsx   # Detail page
└── index.ts                    # Exports
```

---

## 🎯 What Works Now

✅ Browse all published articles  
✅ Search by keyword  
✅ Filter by category  
✅ Read full articles  
✅ Pagination  
✅ Mobile responsive  
✅ Offline support (cached articles)  
✅ Prefetch on hover (instant navigation)  
✅ View tracking (placeholder)  

---

## 💡 Tips

1. **Category Badges**: Each category has unique color and icon
   - 🌾 Farming Tips = Green
   - 🌤️ Weather = Blue
   - 💰 Market Prices = Yellow
   - 🏛️ Gov Schemes = Purple
   - 📰 General = Gray

2. **Markdown-like Content**: Articles support simple formatting
   - `# Heading` → Large heading
   - `## Subheading` → Medium heading
   - `- Item` → Bullet list
   - Paragraphs → Auto-formatted

3. **Prefetch**: Hover over article cards for instant page loads

4. **Offline**: Articles you've viewed are cached for offline reading

---

## 📚 Full Documentation

See **NEWS_HUB_SUMMARY.md** for complete implementation details, architecture decisions, and future enhancements.

---

**Built with ❤️ for Sri Lankan farmers** 🌾

