# 🧪 Yield API Testing Guide

**Date**: November 19, 2025  
**Feature**: Actual Yield Data Persistence  
**Task**: Task 1 - Backend Yield API

---

## 📋 **Prerequisites**

1. **Database Migration**: Run the migration to create the `actual_yields` table

```bash
# From backend directory
cd backend

# Connect to PostgreSQL and run migration
psql -U postgres -d skycrop < database/migrations/002_actual_yields.sql

# Or if using Docker:
docker-compose exec postgres psql -U postgres -d skycrop < database/migrations/002_actual_yields.sql
```

2. **Start Backend Server**

```bash
cd backend
npm run dev
```

Server should be running on `http://localhost:3000`

---

## 🔧 **API Endpoints**

### **1. Create Yield Entry**
```http
POST /api/v1/fields/:fieldId/yield
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "actual_yield_per_ha": 4800.50,
  "total_yield_kg": 9601.00,
  "harvest_date": "2024-03-15",
  "notes": "Good harvest this season",
  "crop_variety": "BG 352",
  "season": "maha",
  "predicted_yield_per_ha": 4500.00
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "yield_id": "uuid-here",
    "field_id": "field-uuid",
    "user_id": "user-uuid",
    "actual_yield_per_ha": "4800.50",
    "total_yield_kg": "9601.00",
    "harvest_date": "2024-03-15",
    "predicted_yield_per_ha": "4500.00",
    "accuracy_mape": "6.68",
    "notes": "Good harvest this season",
    "crop_variety": "BG 352",
    "season": "maha",
    "created_at": "2024-11-19T10:30:00.000Z",
    "updated_at": "2024-11-19T10:30:00.000Z"
  },
  "meta": {
    "correlation_id": null,
    "latency_ms": 45
  }
}
```

---

### **2. List Yield Entries for Field**
```http
GET /api/v1/fields/:fieldId/yield?page=1&page_size=20&sort=harvest_date&order=desc
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "yield_id": "uuid-1",
      "field_id": "field-uuid",
      "actual_yield_per_ha": "4800.50",
      "total_yield_kg": "9601.00",
      "harvest_date": "2024-03-15",
      "predicted_yield_per_ha": "4500.00",
      "accuracy_mape": "6.68",
      "notes": "Good harvest this season",
      "crop_variety": "BG 352",
      "season": "maha",
      "created_at": "2024-11-19T10:30:00.000Z",
      "updated_at": "2024-11-19T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 1,
    "total_pages": 1
  },
  "meta": {
    "correlation_id": null,
    "latency_ms": 12,
    "cache_hit": false
  }
}
```

---

### **3. Get Yield Statistics**
```http
GET /api/v1/fields/:fieldId/yield/statistics
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_entries": 5,
    "avg_yield_per_ha": "4750.25",
    "min_yield_per_ha": "4200.00",
    "max_yield_per_ha": "5100.00",
    "avg_accuracy_mape": "8.45",
    "first_harvest": "2023-03-10",
    "latest_harvest": "2024-03-15"
  },
  "meta": {
    "correlation_id": null,
    "latency_ms": 8
  }
}
```

---

### **4. Get Single Yield Entry**
```http
GET /api/v1/yield/:yieldId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "yield_id": "uuid-here",
    "field_id": "field-uuid",
    "actual_yield_per_ha": "4800.50",
    "total_yield_kg": "9601.00",
    "harvest_date": "2024-03-15",
    "predicted_yield_per_ha": "4500.00",
    "accuracy_mape": "6.68",
    "notes": "Good harvest this season",
    "crop_variety": "BG 352",
    "season": "maha",
    "created_at": "2024-11-19T10:30:00.000Z",
    "updated_at": "2024-11-19T10:30:00.000Z",
    "field": {
      "field_id": "field-uuid",
      "name": "North Field",
      "area": "2.00",
      "area_sqm": "20000.00"
    }
  },
  "meta": {
    "correlation_id": null,
    "latency_ms": 15
  }
}
```

---

### **5. Update Yield Entry**
```http
PATCH /api/v1/yield/:yieldId
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (partial updates allowed):**
```json
{
  "actual_yield_per_ha": 4900.00,
  "notes": "Updated after recalculation"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "yield_id": "uuid-here",
    "field_id": "field-uuid",
    "actual_yield_per_ha": "4900.00",
    "notes": "Updated after recalculation",
    ...
  },
  "meta": {
    "correlation_id": null,
    "latency_ms": 18
  }
}
```

---

### **6. Delete Yield Entry**
```http
DELETE /api/v1/yield/:yieldId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Yield entry deleted successfully",
  "meta": {
    "correlation_id": null,
    "latency_ms": 10
  }
}
```

---

## 🧪 **cURL Testing Commands**

### **Setup: Get Auth Token**
```bash
# Login first
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# Get a field ID (assuming you have fields)
FIELD_ID=$(curl -X GET http://localhost:3000/api/v1/fields \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data[0].field_id')

echo "Field ID: $FIELD_ID"
```

### **Test 1: Create Yield Entry**
```bash
curl -X POST "http://localhost:3000/api/v1/fields/$FIELD_ID/yield" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actual_yield_per_ha": 4800.50,
    "total_yield_kg": 9601.00,
    "harvest_date": "2024-03-15",
    "notes": "Good harvest this season",
    "crop_variety": "BG 352",
    "season": "maha",
    "predicted_yield_per_ha": 4500.00
  }' | jq
```

### **Test 2: List Yield Entries**
```bash
curl -X GET "http://localhost:3000/api/v1/fields/$FIELD_ID/yield?page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### **Test 3: Get Statistics**
```bash
curl -X GET "http://localhost:3000/api/v1/fields/$FIELD_ID/yield/statistics" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### **Test 4: Get Single Entry** (after creating one)
```bash
# Get yield ID from previous response
YIELD_ID="uuid-from-create-response"

curl -X GET "http://localhost:3000/api/v1/yield/$YIELD_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### **Test 5: Update Entry**
```bash
curl -X PATCH "http://localhost:3000/api/v1/yield/$YIELD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actual_yield_per_ha": 4900.00,
    "notes": "Updated after recalculation"
  }' | jq
```

### **Test 6: Delete Entry**
```bash
curl -X DELETE "http://localhost:3000/api/v1/yield/$YIELD_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## ✅ **Validation Tests**

### **Test: Duplicate Entry (Should Fail)**
```bash
# Try to create two entries for the same field on the same date
curl -X POST "http://localhost:3000/api/v1/fields/$FIELD_ID/yield" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actual_yield_per_ha": 4800.50,
    "total_yield_kg": 9601.00,
    "harvest_date": "2024-03-15"
  }' | jq

# Expected: 409 Conflict
```

### **Test: Future Harvest Date (Should Fail)**
```bash
curl -X POST "http://localhost:3000/api/v1/fields/$FIELD_ID/yield" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actual_yield_per_ha": 4800.50,
    "total_yield_kg": 9601.00,
    "harvest_date": "2025-12-31"
  }' | jq

# Expected: 400 Bad Request
```

### **Test: Invalid Field ID (Should Fail)**
```bash
curl -X POST "http://localhost:3000/api/v1/fields/00000000-0000-0000-0000-000000000000/yield" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actual_yield_per_ha": 4800.50,
    "total_yield_kg": 9601.00,
    "harvest_date": "2024-03-15"
  }' | jq

# Expected: 404 Not Found
```

### **Test: Missing Required Fields (Should Fail)**
```bash
curl -X POST "http://localhost:3000/api/v1/fields/$FIELD_ID/yield" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Missing required fields"
  }' | jq

# Expected: 400 Bad Request with validation errors
```

---

## 📊 **Expected Results**

### **Success Criteria:**
- ✅ All CREATE requests return 201 with valid data
- ✅ All GET requests return 200 with correct data
- ✅ All PATCH requests return 200 with updated data
- ✅ All DELETE requests return 200 with success message
- ✅ Duplicate entries return 409 Conflict
- ✅ Future harvest dates return 400 Bad Request
- ✅ Invalid field IDs return 404 Not Found
- ✅ Missing required fields return 400 with validation errors
- ✅ Accuracy (MAPE) is auto-calculated when prediction provided
- ✅ Data persists to PostgreSQL (not localStorage)
- ✅ Cache invalidation works (Redis keys cleared on create/update/delete)

---

## 🐛 **Troubleshooting**

### **Error: "Table 'actual_yields' does not exist"**
```bash
# Run the migration
psql -U postgres -d skycrop < backend/database/migrations/002_actual_yields.sql
```

### **Error: "Field not found or does not belong to user"**
```bash
# Make sure you're using a valid field_id that belongs to the logged-in user
# Check your fields:
curl -X GET http://localhost:3000/api/v1/fields \
  -H "Authorization: Bearer $TOKEN" | jq '.data[].field_id'
```

### **Error: "Unauthorized"**
```bash
# Your token might have expired. Login again:
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}' \
  | jq -r '.data.token')
```

---

## ✅ **Task 1 Completion Checklist**

- [x] Database migration created (`002_actual_yields.sql`)
- [x] Sequelize model created (`actualYield.model.js`)
- [x] Service layer created (`yield.service.js`)
- [x] Controller created (`yield.controller.js`)
- [x] Routes created with validation (`yield.routes.js`)
- [x] Routes registered in `app.js`
- [x] Frontend API updated (`yieldApi.ts`)
- [x] TypeScript errors: 0
- [ ] Backend endpoints tested (use this guide)
- [ ] Frontend integration tested (test in browser)

---

## 🚀 **Next Steps**

After testing backend endpoints:

1. **Test Frontend Integration**:
   - Start frontend dev server: `cd frontend && npm run dev`
   - Navigate to a field detail page
   - Try adding a yield entry
   - Verify it appears in the history table
   - Check browser network tab (should see API calls to `/api/v1/fields/*/yield`)

2. **Move to Task 2**: Deploy to Railway (see `NEXT_STEPS_PRIORITY.md`)

---

**Built with ❤️ using BMAD Methodology**  
**November 19, 2025**

