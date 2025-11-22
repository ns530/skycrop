# Multi-Tenancy Architecture Decision - Sprint 4

**Decision Date**: November 21, 2025  
**Decision Makers**: Tech Lead, Backend Architect, Frontend Architect  
**Status**: ✅ Approved for Sprint 4  
**Review Date**: Post-Sprint 4 (Sprint 5 planning)

---

## 🎯 Context

SkyCrop needs to support multiple farmers/organizations using the same platform while:
1. Ensuring data isolation (Farmer A cannot see Farmer B's fields)
2. Supporting team collaboration (share fields with team members)
3. Implementing role-based access control (Admin, Manager, Farmer, Viewer)
4. Maintaining performance and scalability

**Question**: What multi-tenancy approach should we use?

---

## 📊 Multi-Tenancy Options Considered

### Option 1: Database-per-Tenant
**Approach**: Each farmer/organization gets their own PostgreSQL database.

**Pros:**
- ✅ Strong data isolation
- ✅ Easy to backup/restore per tenant
- ✅ Can scale databases independently
- ✅ Regulatory compliance easier

**Cons:**
- ❌ High infrastructure cost (N databases)
- ❌ Complex deployment (manage N databases)
- ❌ Difficult to share resources (e.g., satellite imagery)
- ❌ Schema migrations must run N times

**Cost**: High (estimate $50/month per 10 tenants)

---

### Option 2: Schema-per-Tenant
**Approach**: Single database, but each farmer gets their own schema (namespace).

**Pros:**
- ✅ Better data isolation than shared schema
- ✅ Lower cost than database-per-tenant
- ✅ Easier cross-tenant analytics

**Cons:**
- ❌ Still complex (N schemas to manage)
- ❌ Connection pooling issues (set search_path per query)
- ❌ Schema migrations run N times
- ❌ Not all ORMs support it well

**Cost**: Medium (estimate $20/month per 10 tenants)

---

### Option 3: Shared Schema with Tenant ID
**Approach**: Single database, single schema, all tables have `user_id` or `organization_id` column.

**Pros:**
- ✅ Simple architecture
- ✅ Low cost
- ✅ Easy to implement with existing ORMs (Sequelize)
- ✅ Single migration for all tenants
- ✅ Easy to share data (satellite imagery, weather)
- ✅ Simple queries with WHERE clauses

**Cons:**
- ❌ Must enforce tenant isolation in code (risk of bugs)
- ❌ Cannot easily backup/restore per tenant
- ❌ Row-level security (RLS) needed for extra safety
- ❌ Performance can degrade with millions of rows

**Cost**: Low (estimate $10/month per 10 tenants)

---

## ✅ Decision: Option 3 - Shared Schema with Tenant ID

### Rationale

1. **MVP Stage**: SkyCrop is in MVP phase. We prioritize:
   - Speed of development
   - Cost efficiency
   - Simple architecture

2. **Scale**: Expected 100-500 users in first year. Shared schema handles this easily.

3. **Existing Architecture**: Sprint 3 already uses `user_id` for data isolation. We're just formalizing it.

4. **Cost**: Operating budget limited. Database-per-tenant is 5x more expensive.

5. **Future Migration Path**: If we hit 10,000+ users, we can migrate to schema-per-tenant or database-per-tenant.

---

## 🏗️ Implementation Details

### Database Schema

All tables have a tenant identifier:

```sql
-- Fields table
CREATE TABLE fields (
  field_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id), -- Tenant isolation
  name VARCHAR(255) NOT NULL,
  crop_type VARCHAR(100),
  area DECIMAL(10, 2),
  -- ... other fields
);

CREATE INDEX idx_fields_user_id ON fields(user_id);

-- Health records table
CREATE TABLE health_records (
  record_id UUID PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES fields(field_id),
  user_id UUID NOT NULL, -- Denormalized for performance
  measurement_date DATE NOT NULL,
  ndvi_mean DECIMAL(5, 4),
  -- ... other fields
);

CREATE INDEX idx_health_records_user_id ON health_records(user_id);
CREATE INDEX idx_health_records_field_id ON health_records(field_id);
```

**Key Points:**
- Every table has `user_id` (owner)
- Denormalize `user_id` in child tables for performance (avoid JOINs in WHERE clause)
- Indexes on `user_id` for fast queries

---

### Backend Enforcement

#### 1. Middleware: Inject User ID

```javascript
// src/api/middleware/auth.middleware.js
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = {
    userId: decoded.user_id,
    email: decoded.email,
    role: decoded.role,
  };
  next();
};
```

#### 2. Repository Pattern: Auto-Filter by User ID

```javascript
// src/repositories/field.repository.js
class FieldRepository {
  async findAll(userId) {
    return await Field.findAll({
      where: { user_id: userId }, // Automatic tenant filtering
    });
  }

  async findById(fieldId, userId) {
    const field = await Field.findOne({
      where: {
        field_id: fieldId,
        user_id: userId, // Ensure user owns the field
      },
    });
    if (!field) {
      throw new AppError('FIELD_NOT_FOUND', 'Field not found', 404);
    }
    return field;
  }

  async create(userId, data) {
    return await Field.create({
      ...data,
      user_id: userId, // Auto-inject user ID
      field_id: uuidv4(),
    });
  }
}
```

**Critical Rule**: Every repository method MUST accept `userId` and filter by it!

#### 3. Service Layer: Pass User ID

```javascript
// src/services/healthMonitoring.service.js
class HealthMonitoringService {
  async getFieldHealthHistory(fieldId, userId, period) {
    // Verify field belongs to user
    const field = await this.fieldRepository.findById(fieldId, userId);
    
    // Fetch health records (also filtered by user_id)
    const records = await this.healthRepository.findByFieldAndDateRange(
      fieldId,
      userId, // Pass user ID
      startDate,
      endDate
    );
    
    return this._analyzeHealth(records);
  }
}
```

#### 4. Controller: Extract User ID from Request

```javascript
// src/api/controllers/field.controller.js
router.get('/fields', authMiddleware, async (req, res, next) => {
  try {
    const fields = await fieldService.getAllFields(req.user.userId);
    res.json({ success: true, data: fields });
  } catch (error) {
    next(error);
  }
});

router.get('/fields/:fieldId', authMiddleware, async (req, res, next) => {
  try {
    const field = await fieldService.getFieldById(
      req.params.fieldId,
      req.user.userId // Pass user ID
    );
    res.json({ success: true, data: field });
  } catch (error) {
    next(error);
  }
});
```

---

### Team Collaboration (Field Sharing)

**Future Enhancement (Sprint 5 or 6)**:

```sql
-- New table: Field Shares
CREATE TABLE field_shares (
  share_id UUID PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES fields(field_id),
  owner_id UUID NOT NULL REFERENCES users(user_id),
  shared_with_user_id UUID NOT NULL REFERENCES users(user_id),
  permission VARCHAR(50) NOT NULL, -- 'view' | 'edit'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_field_shares_shared_with ON field_shares(shared_with_user_id);
```

**Repository Update**:

```javascript
async findById(fieldId, userId) {
  // Check if user owns the field OR has shared access
  const field = await Field.findOne({
    where: {
      field_id: fieldId,
      [Op.or]: [
        { user_id: userId }, // Owner
        { '$shares.shared_with_user_id$': userId }, // Shared
      ],
    },
    include: [
      {
        model: FieldShare,
        as: 'shares',
        required: false,
      },
    ],
  });
  
  if (!field) {
    throw new AppError('FIELD_NOT_FOUND', 'Field not found or access denied', 404);
  }
  
  return field;
}
```

---

### Row-Level Security (RLS) - Optional Safety Layer

**PostgreSQL RLS** can enforce tenant isolation at the database level:

```sql
-- Enable RLS on fields table
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own fields
CREATE POLICY user_isolation_policy ON fields
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- Set current_user_id before each query
SET app.current_user_id = 'user-uuid-here';
```

**Pros:**
- Extra layer of security (defense in depth)
- Prevents accidental data leaks from buggy code

**Cons:**
- Must set session variable before each query
- Sequelize doesn't natively support RLS
- Performance overhead

**Decision**: Implement RLS in Sprint 5 or 6 if time allows. Not critical for MVP.

---

### Frontend Considerations

#### 1. User Context

```typescript
// src/context/UserContext.tsx
interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'farmer' | 'viewer';
  organization?: string; // Future: for multi-organization support
}

const UserContext = createContext<User | null>(null);

export const useUser = () => {
  const user = useContext(UserContext);
  if (!user) throw new Error('User not authenticated');
  return user;
};
```

#### 2. API Calls Always Include User Context

The backend automatically extracts `userId` from JWT token, so frontend doesn't need to explicitly send it:

```typescript
// ✅ GOOD - Backend extracts userId from token
const fields = await apiClient.get('/fields');

// ❌ NOT NEEDED - Don't send userId in query/body
const fields = await apiClient.get(`/fields?userId=${user.id}`);
```

#### 3. Role-Based UI

```typescript
// src/components/FieldActions.tsx
const FieldActions = ({ field }) => {
  const { role } = useUser();

  return (
    <>
      {/* Everyone can view */}
      <Button onClick={viewDetails}>View</Button>

      {/* Only farmers and managers can edit */}
      {(role === 'farmer' || role === 'manager') && (
        <Button onClick={editField}>Edit</Button>
      )}

      {/* Only field owner can delete */}
      {field.user_id === user.id && (
        <Button onClick={deleteField}>Delete</Button>
      )}
    </>
  );
};
```

---

## 🔒 Security Considerations

### 1. **Always Filter by User ID**
- Every query MUST include `WHERE user_id = ?`
- Never trust field IDs alone (attacker could guess IDs)
- Always verify ownership before mutations

### 2. **Audit Logging**
- Log all data access with user ID
- Detect suspicious patterns (e.g., user trying to access many fields in rapid succession)

### 3. **API Testing**
- Test that User A cannot access User B's data
- Test unauthorized access attempts (should return 403/404, not 500)

### 4. **SQL Injection Prevention**
- Use parameterized queries (Sequelize does this automatically)
- Never concatenate user input into SQL strings

### 5. **Rate Limiting**
- Per-user rate limits (prevent abuse)
- Global rate limits (prevent DDoS)

---

## 📈 Scalability Plan

### Current (MVP - Sprint 4)
- **Expected Load**: 100-500 users, 1,000-5,000 fields
- **Approach**: Single PostgreSQL database, shared schema
- **Cost**: ~$20/month (Heroku/Railway Postgres)

### Phase 2 (1,000-10,000 users)
- **Optimization**:
  - Add database indexes
  - Partition large tables by user_id
  - Implement Redis caching
  - Horizontal read replicas
- **Cost**: ~$100-200/month

### Phase 3 (10,000+ users)
- **Migration Options**:
  1. Schema-per-tenant for large organizations
  2. Shard database by user_id ranges (e.g., users 1-10k in DB1, 10k-20k in DB2)
  3. Move to managed multi-tenant service (e.g., AWS RDS Proxy)
- **Cost**: ~$500-1000/month

---

## 📝 Testing Strategy

### Unit Tests
```javascript
describe('FieldRepository', () => {
  it('should only return fields for the specified user', async () => {
    await createField({ user_id: 'user-1', name: 'Field A' });
    await createField({ user_id: 'user-2', name: 'Field B' });

    const fields = await fieldRepository.findAll('user-1');

    expect(fields).toHaveLength(1);
    expect(fields[0].name).toBe('Field A');
  });

  it('should throw error when accessing another user\'s field', async () => {
    const field = await createField({ user_id: 'user-2', name: 'Field B' });

    await expect(
      fieldRepository.findById(field.field_id, 'user-1')
    ).rejects.toThrow('FIELD_NOT_FOUND');
  });
});
```

### Integration Tests
```javascript
describe('Field API - Multi-tenancy', () => {
  it('should not allow user to access another user\'s field', async () => {
    const user1Token = await loginAsUser('user-1');
    const user2Field = await createFieldForUser('user-2');

    const response = await request(app)
      .get(`/api/v1/fields/${user2Field.field_id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(404);

    expect(response.body.error.code).toBe('FIELD_NOT_FOUND');
  });
});
```

---

## 🎯 Sprint 4 Action Items

### Backend
- [x] Verify all tables have `user_id` column
- [x] Add indexes on `user_id` columns
- [ ] Update all repositories to accept `userId` parameter
- [ ] Add unit tests for tenant isolation
- [ ] Add integration tests for unauthorized access

### Frontend
- [ ] Implement `useUser` hook
- [ ] Add role-based UI components
- [ ] Test that UI shows only user's own data
- [ ] Add error handling for 403/404 (access denied)

### Documentation
- [x] Document multi-tenancy decision (this doc)
- [ ] Update API docs with authorization notes
- [ ] Create team collaboration plan (for Sprint 5/6)

---

## 🔄 Review & Next Steps

**Post-Sprint 4**:
1. Measure query performance with realistic data volume (1,000+ users, 10,000+ fields)
2. Evaluate if database partitioning is needed
3. Plan field sharing feature for Sprint 5/6
4. Consider implementing PostgreSQL RLS for extra security

**Success Criteria**:
- ✅ No data leaks between users
- ✅ All queries include `user_id` filter
- ✅ API response times <200ms (p95)
- ✅ 100% test coverage for tenant isolation

---

## 📚 References

- [Multi-Tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multi-tenancy)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Sequelize Best Practices](https://sequelize.org/docs/v6/other-topics/best-practices/)

---

**Decision Status**: ✅ Approved  
**Implementation Target**: Sprint 4  
**Next Review**: Sprint 5 Planning (Week 15)

---

**Remember**: Multi-tenancy is critical for data security. Always verify user ownership before mutations! 🔒

