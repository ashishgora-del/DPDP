# Prisma Removal & PostgreSQL Migration Plan

## 🎯 Overview
Replace Prisma ORM with native PostgreSQL client (pg/node-postgres) across the entire backend.

**Estimated Effort:** 39-61 hours (5-8 days)  
**Risk Level:** HIGH - Complete database layer rewrite  
**Rollback Plan:** Keep Prisma code in Git branches until verified

## 📋 Quick Summary

### Why Migrate?
- ❌ Prisma binary incompatible with cPanel shared hosting
- ❌ "timer has gone away" Rust panic errors
- ❌ Platform-specific binary compilation issues
- ✅ Native pg client = no binaries, universal compatibility
- ✅ Direct SQL control, better performance
- ✅ Smaller bundle size for faster deployments

### What's Changed?
- **FROM:** Prisma ORM with auto-generated queries
- **TO:** Raw SQL with parameterized inputs via pg (node-postgres)
- **Database:** PostgreSQL remains the same
- **Schema:** No changes to tables/columns
- **API:** No breaking changes to endpoints

### 17 Implementation Phases
1. **Setup** - Install pg, remove Prisma (1-2h)
2. **Database Layer** - Create DatabaseService with pooling (2-3h)
3. **App Module** - Wire up new service (30min)
4. **Auth & Users** - Rewrite authentication queries (4-6h)
5. **Catalog** - Convert complex nested queries (4-6h)
6. **Learning** - Transactions for progress tracking (4-6h)
7. **Admin** - Bulk operations with transactions (4-6h)
8. **Transformers** - snake_case ↔ camelCase utilities (2-3h)
9. **Testing** - Unit & integration tests (4-8h)
10. **Deployment** - Build & cPanel deploy (2-3h)
11. **Enums** - TypeScript enums for DB types (1-2h)
12. **Seed Data** - Convert seed.ts to SQL (2-3h)
13. **Error Handling** - PostgreSQL error codes (2-3h)
14. **Missing Methods** - Role mgmt, search, assessments (3-4h)
15. **Dev Workflow** - Migration scripts (1-2h)
16. **Health Monitoring** - Health check endpoints (1-2h)
17. **Cleanup** - Remove artifacts, docs (2-3h)

### Key Files Created (9 new files)
- `backend/src/database/database.service.ts` - Connection pool & queries
- `backend/src/database/database.module.ts` - NestJS module
- `backend/src/database/database.types.ts` - 20+ TypeScript interfaces
- `backend/src/database/enums.ts` - ContentBlockType, ProductType
- `backend/src/database/exceptions.ts` - Custom error classes
- `backend/src/database/transformers.ts` - Data mapping utilities
- `backend/src/database/index.ts` - Barrel exports
- `backend/src/health/health.controller.ts` - Health endpoints
- `backend/src/health/health.module.ts` - Health module

### Key Files Modified (10+ services)
- `backend/src/users/users.service.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/catalog/catalog.service.ts`
- `backend/src/learning/learning.service.ts`
- `backend/src/admin/admin.service.ts`
- `backend/src/app.module.ts`
- `backend/package.json`
- All test files (*.spec.ts)

### Key Files Deleted
- `backend/src/prisma/prisma.service.ts`
- `backend/src/prisma/prisma.module.ts`
- `backend/prisma/migrations/` (entire folder)
- `backend/node_modules/.prisma/`
- `backend/node_modules/@prisma/`

---

## 📊 Phase 1: Setup & Dependencies (1-2 hours)

### Files to Modify:
- `backend/package.json`
- `backend/package-lock.json` (auto-updated)

### Tasks:
1. **Install PostgreSQL client:**
   ```bash
   npm install pg @types/pg
   npm uninstall prisma @prisma/client
   ```

2. **Update package.json scripts:**
   - Remove: `prisma:generate`, `prisma:migrate`, `prisma:studio`, `prisma:seed`, `prisma:generate:deploy`
   - Add: `migration:create`, `migration:run`, `db:seed`, `db:reset`
   - Keep migration.sql for reference

3. **Clean up dependencies:**
   ```json
   // Remove from dependencies:
   "@prisma/client": "5.8.0"
   
   // Remove from devDependencies:
   "prisma": "5.8.0"
   
   // Add to dependencies:
   "pg": "^8.11.3"
   
   // Add to devDependencies:
   "@types/pg": "^8.10.9"
   ```

4. **Delete Prisma artifacts:**
   ```bash
   rm -rf node_modules/.prisma
   rm -rf node_modules/@prisma
   rm -rf backend/prisma/migrations
   # Keep: backend/prisma/schema.prisma (for reference)
   # Keep: backend/migration.sql (for schema reference)
   ```

### Validation:
- ✅ `npm install` runs without Prisma
- ✅ TypeScript compiles without Prisma types
- ✅ No Prisma references in package.json
- ✅ pg and @types/pg installed correctly

---

## 📊 Phase 2: Database Service Layer (2-3 hours)

### Files to Create:
- `backend/src/database/database.service.ts` (NEW)
- `backend/src/database/database.module.ts` (NEW)
- `backend/src/database/database.types.ts` (NEW)
- `backend/src/database/index.ts` (NEW - barrel export)

### Files to Delete:
- `backend/src/prisma/prisma.service.ts`
- `backend/src/prisma/prisma.module.ts`

### Tasks:

#### 2.1 Create DatabaseService
**File:** `backend/src/database/database.service.ts`
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      connectionString: this.config.get('DATABASE_URL'),
      max: 20, // Max connections for cPanel shared hosting
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      this.logger.log('✅ Database connected successfully');
      client.release();
    } catch (error) {
      this.logger.error('❌ Database connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('Database connection pool closed');
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      this.logger.debug(`Query executed in ${duration}ms`);
      return result;
    } catch (error) {
      this.logger.error('Query failed', { text, params, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
```

#### 2.2 Create DatabaseModule
**File:** `backend/src/database/database.module.ts`
```typescript
import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

#### 2.3 Create Type Definitions
**File:** `backend/src/database/database.types.ts`
```typescript
// Copy all types from Prisma schema and convert to TypeScript interfaces

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  primaryRole: string | null;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  billingEmail: string | null;
  createdAt: Date;
}

export interface UserOrganization {
  userId: string;
  organizationId: string;
  orgRole: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface UserRole {
  userId: string;
  roleId: string;
}

export interface Permission {
  id: string;
  key: string;
  description: string | null;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}

export interface Domain {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface LearningPath {
  id: string;
  slug: string;
  domainId: string;
  title: string;
  description: string | null;
  targetRole: string;
  estimatedHours: number | null; // Decimal from DB
  isPublic: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  pathId: string;
  title: string;
  description: string | null;
  level: string;
  orderIndex: number;
  isPublic: boolean;
  createdBy: string | null;
  createdAt: Date;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  isFree: boolean;
  estimatedMinutes: number | null;
  isPublished: boolean;
  createdBy: string | null;
  createdAt: Date;
}

export interface ContentBlock {
  id: string;
  moduleId: string;
  type: string; // ContentBlockType enum
  orderIndex: number;
  data: any; // JSONB
  createdAt: Date;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  organizationId: string | null;
  source: string | null;
  createdAt: Date;
}

export interface ModuleProgress {
  id: string;
  userId: string;
  moduleId: string;
  startedAt: Date | null;
  completedAt: Date | null;
  progressPercent: number; // Decimal from DB
  lastPosition: any | null; // JSONB
}

export interface Assessment {
  id: string;
  moduleId: string;
  title: string | null;
  config: any | null; // JSONB
}

export interface Question {
  id: string;
  assessmentId: string;
  orderIndex: number;
  type: string;
  text: string;
  options: any | null; // JSONB
  correctAnswer: any | null; // JSONB
}

export interface Attempt {
  id: string;
  assessmentId: string;
  userId: string;
  startedAt: Date;
  completedAt: Date | null;
  score: number | null; // Decimal from DB
  passed: boolean | null;
}

export interface Product {
  id: string;
  productType: string; // ProductType enum
  refId: string;
  name: string;
  description: string | null;
  currency: string;
  priceCents: number;
  isActive: boolean;
}

export interface Order {
  id: string;
  userId: string;
  organizationId: string | null;
  totalAmountCents: number;
  currency: string;
  status: string;
  gateway: string;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  amountCents: number;
}

export interface License {
  id: string;
  organizationId: string;
  productId: string;
  seats: number;
  seatsUsed: number;
  validFrom: Date;
  validUntil: Date | null;
  createdAt: Date;
}

export interface Event {
  id: string;
  userId: string | null;
  organizationId: string | null;
  eventType: string;
  refId: string | null;
  metadata: any | null; // JSONB
  occurredAt: Date;
}
```

#### 2.4 Create Barrel Export
**File:** `backend/src/database/index.ts`
```typescript
export * from './database.service';
export * from './database.module';
export * from './database.types';
export * from './enums'; // Will create in Phase 11
export * from './exceptions'; // Will create in Phase 13
export * from './transformers'; // Will create in Phase 8
```

### Validation:
- ✅ DatabaseService connects to PostgreSQL
- ✅ Test query executes successfully
- ✅ Transaction rollback works
- ✅ Health check returns true
- ✅ Connection pool properly configured

---

## 📊 Phase 3: Update App Module (30 minutes)

### Files to Modify:
- `backend/src/app.module.ts`

### Tasks:
1. Replace `PrismaModule` import with `DatabaseModule`
2. Update imports array

**Before:**
```typescript
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ...],
})
```

**After:**
```typescript
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule, ...],
})
```

### Validation:
- ✅ App starts without errors
- ✅ No Prisma references remain

---

## 📊 Phase 4: Auth & Users Module (4-6 hours)

### Files to Modify:
- `backend/src/users/users.service.ts`
- `backend/src/auth/auth.service.ts`

### Tasks for users.service.ts:

#### 4.1 Replace PrismaService with DatabaseService
**Before:**
```typescript
constructor(private prisma: PrismaService) {}
```

**After:**
```typescript
constructor(private db: DatabaseService) {}
```

#### 4.2 Rewrite all queries

**findByEmail (Before):**
```typescript
async findByEmail(email: string) {
  return this.prisma.user.findUnique({ where: { email } });
}
```

**findByEmail (After):**
```typescript
async findByEmail(email: string): Promise<User | null> {
  const result = await this.db.query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}
```

**create (Before):**
```typescript
async create(data: CreateUserDto) {
  return this.prisma.user.create({ data });
}
```

**create (After):**
```typescript
async create(data: CreateUserDto): Promise<User> {
  const result = await this.db.query<User>(
    `INSERT INTO users (id, email, password_hash, name, primary_role, is_super_admin, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING *`,
    [
      crypto.randomUUID(),
      data.email,
      data.passwordHash,
      data.name || null,
      data.primaryRole || null,
      false,
    ]
  );
  return result.rows[0];
}
```

**update (Before):**
```typescript
async update(id: string, data: UpdateUserDto) {
  return this.prisma.user.update({ where: { id }, data });
}
```

**update (After):**
```typescript
async update(id: string, data: UpdateUserDto): Promise<User> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  if (data.primaryRole !== undefined) {
    fields.push(`primary_role = $${paramCount++}`);
    values.push(data.primaryRole);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await this.db.query<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundException('User not found');
  }
  
  return result.rows[0];
}
```

### Similar patterns for auth.service.ts

**IMPORTANT:** bcrypt password hashing code remains UNCHANGED:
```typescript
import * as bcrypt from 'bcrypt';

// This stays exactly the same - bcrypt is independent of Prisma
async validateUser(email: string, password: string) {
  const user = await this.usersService.findByEmail(email);
  if (!user) return null;
  
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) return null;
  
  const { passwordHash, ...result } = user;
  return result;
}

async register(registerDto: RegisterDto) {
  const { email, password, name, primaryRole } = registerDto;
  
  // Hash password - NO CHANGES NEEDED
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  // Only this changes - uses new UsersService
  const user = await this.usersService.create({
    email,
    passwordHash,
    name,
    primaryRole,
  });
  
  await this.usersService.assignRole(user.id, 'LEARNER');
  
  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword };
}
```

**Summary of auth.service.ts changes:**
- ✅ Keep all bcrypt imports and calls unchanged
- ✅ Keep JWT token generation unchanged
- ✅ Only update: calls to UsersService methods (which now use DatabaseService internally)
- ❌ Do NOT modify password hashing logic

### Validation:
- ✅ User registration works
- ✅ User login works
- ✅ JWT token generation works
- ✅ Password hashing works

---

## 📊 Phase 5: Catalog Module (4-6 hours)

### Files to Modify:
- `backend/src/catalog/catalog.service.ts`

### Tasks:

#### 5.1 Replace all Prisma queries with raw SQL

**getDomains (Before):**
```typescript
async getDomains() {
  return this.prisma.domain.findMany({
    include: { learningPaths: true }
  });
}
```

**getDomains (After):**
```typescript
async getDomains() {
  const result = await this.db.query(`
    SELECT 
      d.*,
      json_agg(
        json_build_object(
          'id', lp.id,
          'slug', lp.slug,
          'title', lp.title,
          'targetRole', lp.target_role
        )
      ) FILTER (WHERE lp.id IS NOT NULL) as learning_paths
    FROM domains d
    LEFT JOIN learning_paths lp ON lp.domain_id = d.id
    GROUP BY d.id
    ORDER BY d.name
  `);
  return result.rows;
}
```

**getCourseById (Before):**
```typescript
async getCourseById(id: string) {
  return this.prisma.course.findUnique({
    where: { id },
    include: {
      modules: { orderBy: { orderIndex: 'asc' } }
    }
  });
}
```

**getCourseById (After):**
```typescript
async getCourseById(id: string) {
  const courseResult = await this.db.query(`
    SELECT c.*, lp.title as path_title
    FROM courses c
    LEFT JOIN learning_paths lp ON c.path_id = lp.id
    WHERE c.id = $1
  `, [id]);

  if (courseResult.rows.length === 0) {
    throw new NotFoundException('Course not found');
  }

  const modulesResult = await this.db.query(`
    SELECT * FROM modules
    WHERE course_id = $1
    ORDER BY order_index ASC
  `, [id]);

  return {
    ...courseResult.rows[0],
    modules: modulesResult.rows,
  };
}
```

### Validation:
- ✅ All catalog endpoints return correct data
- ✅ Nested relations load correctly
- ✅ Ordering works as expected

---

## 📊 Phase 6: Learning Module (4-6 hours)

### Files to Modify:
- `backend/src/learning/learning.service.ts`

### Tasks:

#### 6.1 Handle complex relations

**createEnrollment (Before):**
```typescript
async createEnrollment(userId: string, courseId: string) {
  return this.prisma.enrollment.create({
    data: { userId, courseId }
  });
}
```

**createEnrollment (After):**
```typescript
async createEnrollment(userId: string, courseId: string) {
  return this.db.transaction(async (client) => {
    // Check if enrollment exists
    const existingResult = await client.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (existingResult.rows.length > 0) {
      throw new ConflictException('Already enrolled');
    }

    // Create enrollment
    const result = await client.query(
      `INSERT INTO enrollments (id, user_id, course_id, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [crypto.randomUUID(), userId, courseId]
    );

    return result.rows[0];
  });
}
```

**updateProgress (Before):**
```typescript
async updateProgress(userId: string, moduleId: string, percent: number) {
  return this.prisma.moduleProgress.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    update: { progressPercent: percent },
    create: { userId, moduleId, progressPercent: percent }
  });
}
```

**updateProgress (After):**
```typescript
async updateProgress(userId: string, moduleId: string, percent: number) {
  const result = await this.db.query(
    `INSERT INTO module_progress (id, user_id, module_id, progress_percent, started_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id, module_id)
     DO UPDATE SET progress_percent = $4, 
                   completed_at = CASE WHEN $4 >= 100 THEN NOW() ELSE NULL END
     RETURNING *`,
    [crypto.randomUUID(), userId, moduleId, percent]
  );
  return result.rows[0];
}
```

### Validation:
- ✅ Enrollment creation works
- ✅ Progress tracking works
- ✅ Dashboard data loads correctly

---

## 📊 Phase 7: Admin Module (4-6 hours)

### Files to Modify:
- `backend/src/admin/admin.service.ts`

### Tasks:

#### 7.1 Complex CRUD operations

**createModule (Before):**
```typescript
async createModule(data: CreateModuleDto) {
  return this.prisma.module.create({ data });
}
```

**createModule (After):**
```typescript
async createModule(data: CreateModuleDto) {
  return this.db.transaction(async (client) => {
    // Get next order index
    const orderResult = await client.query(
      'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM modules WHERE course_id = $1',
      [data.courseId]
    );

    const result = await client.query(
      `INSERT INTO modules (id, course_id, title, description, order_index, is_free, estimated_minutes, is_published, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [
        crypto.randomUUID(),
        data.courseId,
        data.title,
        data.description || null,
        orderResult.rows[0].next_order,
        data.isFree || false,
        data.estimatedMinutes || null,
        false,
        data.createdBy || null,
      ]
    );

    return result.rows[0];
  });
}
```

**bulkUpdateContentBlocks (complex case):**
```typescript
async bulkUpdateContentBlocks(moduleId: string, blocks: ContentBlockDto[]) {
  return this.db.transaction(async (client) => {
    // Delete existing blocks
    await client.query('DELETE FROM content_blocks WHERE module_id = $1', [moduleId]);

    // Insert new blocks
    for (let i = 0; i < blocks.length; i++) {
      await client.query(
        `INSERT INTO content_blocks (id, module_id, type, order_index, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          crypto.randomUUID(),
          moduleId,
          blocks[i].type,
          i,
          JSON.stringify(blocks[i].data),
        ]
      );
    }

    // Return all blocks
    const result = await client.query(
      'SELECT * FROM content_blocks WHERE module_id = $1 ORDER BY order_index',
      [moduleId]
    );

    return result.rows;
  });
}
```

### Validation:
- ✅ All admin CRUD operations work
- ✅ Transactions handle failures correctly
- ✅ Order indices are maintained

---

## 📊 Phase 8: Data Transformation Layer (2-3 hours)

### Files to Create:
- `backend/src/database/transformers.ts` (NEW)

### Tasks:

#### 8.1 Handle PostgreSQL to TypeScript conversions
```typescript
export class DataTransformers {
  static toCamelCase(row: any): any {
    if (!row) return null;
    
    const result: any = {};
    for (const key in row) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = row[key];
    }
    return result;
  }

  static toSnakeCase(obj: any): any {
    if (!obj) return null;
    
    const result: any = {};
    for (const key in obj) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = obj[key];
    }
    return result;
  }

  static parseJsonFields(row: any, jsonFields: string[]): any {
    const result = { ...row };
    for (const field of jsonFields) {
      if (result[field] && typeof result[field] === 'string') {
        try {
          result[field] = JSON.parse(result[field]);
        } catch (e) {
          // Keep as string if parse fails
        }
      }
    }
    return result;
  }

  static mapToModel<T>(row: any, jsonFields: string[] = []): T {
    if (!row) return null as any;
    let result = this.toCamelCase(row);
    result = this.parseJsonFields(result, jsonFields);
    return result as T;
  }

  static mapToModels<T>(rows: any[], jsonFields: string[] = []): T[] {
    return rows.map(row => this.mapToModel<T>(row, jsonFields));
  }
}
```

#### 8.2 Apply Transformers in Services

**Example: catalog.service.ts**
```typescript
import { DataTransformers } from '../database/transformers';
import { Course, Module, ContentBlock } from '../database/database.types';

async findAll(): Promise<Course[]> {
  const result = await this.db.query(
    'SELECT * FROM courses ORDER BY title'
  );
  
  // Transform snake_case to camelCase
  return DataTransformers.mapToModels<Course>(result.rows);
}

async findCourseWithModules(courseId: string): Promise<Course & { modules: Module[] }> {
  const result = await this.db.query(
    `SELECT 
       c.*,
       json_agg(
         json_build_object(
           'id', m.id,
           'title', m.title,
           'order_index', m.order_index
         ) ORDER BY m.order_index
       ) as modules
     FROM courses c
     LEFT JOIN modules m ON m.course_id = c.id
     WHERE c.id = $1
     GROUP BY c.id`,
    [courseId]
  );
  
  if (result.rows.length === 0) return null;
  
  // Transform and parse JSON fields
  return DataTransformers.mapToModel<Course & { modules: Module[] }>(
    result.rows[0],
    ['modules'] // Parse modules JSON array
  );
}
```

**Example: learning.service.ts**
```typescript
import { DataTransformers } from '../database/transformers';
import { Enrollment, ModuleProgress } from '../database/database.types';

async getEnrollmentWithProgress(enrollmentId: string) {
  const result = await this.db.query(
    `SELECT 
       e.*,
       json_agg(
         json_build_object(
           'id', mp.id,
           'module_id', mp.module_id,
           'status', mp.status,
           'progress_percent', mp.progress_percent
         )
       ) as progress
     FROM enrollments e
     LEFT JOIN module_progress mp ON mp.enrollment_id = e.id
     WHERE e.id = $1
     GROUP BY e.id`,
    [enrollmentId]
  );
  
  return DataTransformers.mapToModel(
    result.rows[0],
    ['progress'] // Parse progress JSON array
  );
}
```

**Example: admin.service.ts (JSON fields)**
```typescript
import { DataTransformers } from '../database/transformers';
import { ContentBlock, Question } from '../database/database.types';

async getContentBlock(id: string): Promise<ContentBlock> {
  const result = await this.db.query(
    'SELECT * FROM content_blocks WHERE id = $1',
    [id]
  );
  
  // Parse 'data' JSONB field
  return DataTransformers.mapToModel<ContentBlock>(
    result.rows[0],
    ['data'] // Parse data JSONB column
  );
}

async getQuestion(id: string): Promise<Question> {
  const result = await this.db.query(
    'SELECT * FROM questions WHERE id = $1',
    [id]
  );
  
  // Parse multiple JSONB fields
  return DataTransformers.mapToModel<Question>(
    result.rows[0],
    ['options', 'correctAnswer'] // Parse both JSONB fields
  );
}
```

### Validation:
- ✅ Snake_case converts to camelCase (created_at → createdAt)
- ✅ JSON fields parse correctly (JSONB → JavaScript objects)
- ✅ json_agg arrays transform properly
- ✅ All services use DataTransformers consistently

---

## 📊 Phase 9: Testing & Validation (4-8 hours)

### Files to Test:
- All service files
- All controller endpoints

### Tasks:

#### 9.1 Unit Tests
**Example: users.service.spec.ts**
```typescript
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/database.service';

describe('UsersService', () => {
  let service: UsersService;
  let db: DatabaseService;

  beforeEach(async () => {
    const mockDb = {
      query: jest.fn(),
      transaction: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    db = module.get<DatabaseService>(DatabaseService);
  });

  it('should find user by email', async () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
    jest.spyOn(db, 'query').mockResolvedValue({ rows: [mockUser] } as any);

    const result = await service.findByEmail('test@test.com');
    
    expect(result).toEqual(mockUser);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      ['test@test.com']
    );
  });

  it('should handle not found', async () => {
    jest.spyOn(db, 'query').mockResolvedValue({ rows: [] } as any);
    const result = await service.findByEmail('notfound@test.com');
    expect(result).toBeNull();
  });
});
```

#### 9.2 Integration Tests
**Example: auth.e2e-spec.ts**
```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'newuser@test.com',
        password: 'Password123!',
        name: 'New User',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('newuser@test.com');
  });

  it('/auth/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@elearning.com',
        password: 'AdminPassword123!',
      })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });
});
```

#### 9.3 Manual Testing Checklist
- [ ] User registration
- [ ] User login
- [ ] Get all domains
- [ ] Get courses by domain
- [ ] Get module content
- [ ] Create enrollment
- [ ] Update progress
- [ ] Create/Update/Delete admin content
- [ ] Complex queries with joins
- [ ] Transaction rollback on error

### Validation:
- ✅ All tests pass
- ✅ No Prisma references remain
- ✅ Performance is acceptable

---

## 📊 Phase 10: Deployment & Cleanup (2-3 hours)

### Files to Delete:
- `backend/prisma/` (entire directory)
- `backend/node_modules/.prisma/`
- `backend/node_modules/@prisma/`

### Files to Update:
- `backend/package.json` - Remove Prisma scripts
- `backend/README.md` - Update setup instructions
- `backend/.env.example` - Ensure DATABASE_URL is documented

### Tasks:

#### 10.1 Pre-deployment
1. Run full test suite
2. Build production bundle
3. Verify bundle size reduced (no Prisma binaries)
4. Test on staging environment

#### 10.2 cPanel Deployment

**Step 1: Build Production Bundle**
```bash
cd backend
npm run build
```

**Step 2: Create Deployment Zip**
```bash
# Create zip with required files only
$files = @(
  'dist',
  'package.json',
  'package-lock.json',
  '.env'
)

Compress-Archive -Path $files -DestinationPath 'backend-deploy.zip' -Force
```

**Step 3: Upload to cPanel**
1. Login to cPanel → File Manager
2. Navigate to `/home/dymgcxar/public_html/trinetrai/`
3. Upload `backend-deploy.zip`
4. Extract the zip file
5. Delete the zip after extraction

**Step 4: Install Dependencies on Server**
```bash
# SSH into cPanel or use Terminal in File Manager
cd ~/public_html/trinetrai
npm ci --production
```

**Step 5: Configure Environment**
- Edit `.env` file with production DATABASE_URL
- Verify all environment variables set correctly
- Check Node.js version (should be 18.20.8)

**Step 6: Configure Node.js App in cPanel**
1. Go to cPanel → Setup Node.js App
2. Set Application Root: `/home/dymgcxar/public_html/trinetrai`
3. Set Application URL: `https://urjourney.in`
4. Set Application Startup File: `dist/main.js`
5. Set Node.js Version: 18.20.8
6. Click "Save"

**Step 7: Start Application**
- Click "Start App" in cPanel
- Wait 30 seconds for startup
- Check status shows "Running"

**Step 8: Verify Deployment**
```bash
# Test health endpoint
curl https://urjourney.in/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":...}
```

#### 10.3 Post-deployment
1. ✅ Verify all endpoints work
   - Test login: POST /auth/login
   - Test catalog: GET /catalog/domains
   - Test enrollment: GET /learning/enrollments
2. ✅ Check database connection pooling
   - Monitor active connections in PostgreSQL
   - Should see 10-20 connections (pool size)
3. ✅ Monitor performance metrics
   - Response times < 500ms
   - CPU usage < 50%
   - Memory usage stable
4. ✅ Set up database backups
   - Configure daily PostgreSQL backups in cPanel
   - Test backup restoration procedure

### Validation:
- ✅ Application runs on cPanel
- ✅ No Prisma-related errors
- ✅ All features work as expected

---

## � Phase 11: Enums & Type Constants (1-2 hours)

### Files to Create:
- `backend/src/database/enums.ts` (NEW)

### Tasks:

#### 11.1 Convert Prisma Enums to TypeScript
**From schema.prisma:**
```prisma
enum ContentBlockType {
  VIDEO
  TEXT
  QUIZ
  DOWNLOAD
  CODE_LAB
  EXTERNAL_LINK
}

enum ProductType {
  MODULE
  COURSE
  PATH
  ORG_BUNDLE
}
```

**To enums.ts:**
```typescript
export enum ContentBlockType {
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
  QUIZ = 'QUIZ',
  DOWNLOAD = 'DOWNLOAD',
  CODE_LAB = 'CODE_LAB',
  EXTERNAL_LINK = 'EXTERNAL_LINK',
}

export enum ProductType {
  MODULE = 'MODULE',
  COURSE = 'COURSE',
  PATH = 'PATH',
  ORG_BUNDLE = 'ORG_BUNDLE',
}

// Helper functions
export function isValidContentBlockType(type: string): type is ContentBlockType {
  return Object.values(ContentBlockType).includes(type as ContentBlockType);
}

export function isValidProductType(type: string): type is ProductType {
  return Object.values(ProductType).includes(type as ProductType);
}
```

#### 11.2 Create PostgreSQL Enum Types
**Add to migration.sql or run manually:**
```sql
-- These should already exist from your migration.sql
-- Verify they exist:
SELECT typname FROM pg_type WHERE typtype = 'e';

-- If missing, create them:
CREATE TYPE "ContentBlockType" AS ENUM ('VIDEO', 'TEXT', 'QUIZ', 'DOWNLOAD', 'CODE_LAB', 'EXTERNAL_LINK');
CREATE TYPE "ProductType" AS ENUM ('MODULE', 'COURSE', 'PATH', 'ORG_BUNDLE');
```

#### 11.3 Update Services to Use Enums
Replace string literals with enum values in all services.

**Before:**
```typescript
const block = await this.prisma.contentBlock.create({
  data: { type: 'VIDEO', ... }
});
```

**After:**
```typescript
import { ContentBlockType } from '../database/enums';

const result = await this.db.query(
  `INSERT INTO content_blocks (type, ...) VALUES ($1::content_block_type, ...)`,
  [ContentBlockType.VIDEO, ...]
);
```

### Validation:
- ✅ Enums match database types
- ✅ TypeScript validates enum values
- ✅ Invalid enum values rejected

---

## 📊 Phase 12: Seed Data Migration (2-3 hours)

### Files to Create:
- `backend/src/database/seed.sql` (NEW)
- `backend/scripts/seed-database.ts` (NEW)

### Tasks:

#### 12.1 Convert seed.ts to SQL
**From:** `backend/prisma/seed.ts` (279 lines of TypeScript)

**To:** `backend/src/database/seed.sql`
```sql
-- Roles
INSERT INTO roles (id, name, description) VALUES
  ('role_learner', 'LEARNER', 'Default role for learners'),
  ('role_admin', 'ADMIN', 'Administrator role with full access'),
  ('role_author', 'AUTHOR', 'Content author role')
ON CONFLICT (name) DO NOTHING;

-- Admin user
INSERT INTO users (id, email, password_hash, name, is_super_admin, primary_role, created_at, updated_at) VALUES
  ('admin_user_id', 'admin@elearning.com', '$2b$10$...', 'Admin User', true, 'PRACTITIONER', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Assign admin role
INSERT INTO user_roles (user_id, role_id) VALUES
  ('admin_user_id', 'role_admin')
ON CONFLICT DO NOTHING;

-- Domains
INSERT INTO domains (id, slug, name, description) VALUES
  ('domain_privacy', 'privacy', 'Data Privacy', 'Learn about data privacy and protection'),
  ('domain_security', 'security', 'Security', 'Cybersecurity fundamentals')
ON CONFLICT (slug) DO NOTHING;

-- Learning Paths
INSERT INTO learning_paths (id, slug, title, description, domain_id, level, estimated_hours, is_published, created_at, updated_at) VALUES
  ('path_dpdp_intro', 'dpdp-introduction', 'Introduction to DPDP Act', 'Comprehensive guide to Data Protection Act', 'domain_privacy', 'BEGINNER', 8.5, true, NOW(), NOW()),
  ('path_gdpr_basics', 'gdpr-basics', 'GDPR Fundamentals', 'Learn the basics of GDPR compliance', 'domain_privacy', 'INTERMEDIATE', 12.0, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Courses
INSERT INTO courses (id, path_id, slug, title, description, level, duration_minutes, is_published, created_at, updated_at) VALUES
  ('course_dpdp_101', 'path_dpdp_intro', 'dpdp-101', 'DPDP Act Overview', 'Understanding the basics of DPDP Act 2023', 'BEGINNER', 60, true, NOW(), NOW()),
  ('course_dpdp_202', 'path_dpdp_intro', 'dpdp-202', 'Data Fiduciary Obligations', 'Learn about obligations under DPDP Act', 'INTERMEDIATE', 90, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Modules
INSERT INTO modules (id, course_id, order_index, title, description, duration_minutes, is_free, created_at, updated_at) VALUES
  ('module_intro_1', 'course_dpdp_101', 0, 'Introduction to Data Privacy', 'Learn the fundamentals', 20, true, NOW(), NOW()),
  ('module_intro_2', 'course_dpdp_101', 1, 'Key Concepts', 'Understand key terminology', 25, false, NOW(), NOW()),
  ('module_intro_3', 'course_dpdp_101', 2, 'Quiz: Test Your Knowledge', 'Assessment module', 15, false, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Content Blocks
INSERT INTO content_blocks (id, module_id, type, order_index, data, created_at, updated_at) VALUES
  ('block_vid_1', 'module_intro_1', 'VIDEO', 0, '{"url":"https://example.com/video1.mp4","duration":300}', NOW(), NOW()),
  ('block_text_1', 'module_intro_1', 'TEXT', 1, '{"content":"<p>Welcome to the course...</p>"}', NOW(), NOW()),
  ('block_quiz_1', 'module_intro_3', 'QUIZ', 0, '{"questions":[{"id":"q1","text":"What is DPDP?"}]}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Assessments
INSERT INTO assessments (id, module_id, title, config, created_at, updated_at) VALUES
  ('assess_1', 'module_intro_3', 'Module 1 Quiz', '{"passingScore":70,"timeLimit":900}', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Questions
INSERT INTO questions (id, assessment_id, order_index, type, text, options, correct_answer) VALUES
  ('q1', 'assess_1', 0, 'multiple_choice', 'What does DPDP stand for?', 
   '[{"id":"a","text":"Data Protection and Privacy"},{"id":"b","text":"Digital Personal Data Protection"}]',
   '{"answer":"b"}'),
  ('q2', 'assess_1', 1, 'true_false', 'DPDP Act applies to all organizations in India', 
   '[{"id":"true","text":"True"},{"id":"false","text":"False"}]',
   '{"answer":"true"}')
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (id, product_type, ref_id, name, description, currency, price_cents, is_active) VALUES
  ('prod_course_1', 'COURSE', 'course_dpdp_101', 'DPDP 101 Course', 'Single course access', 'INR', 99900, true),
  ('prod_path_1', 'PATH', 'path_dpdp_intro', 'DPDP Learning Path', 'Complete learning path', 'INR', 499900, true),
  ('prod_org_license', 'ORG_LICENSE', 'domain_privacy', 'Organization License - Privacy', '10 seats', 'INR', 4999900, true)
ON CONFLICT DO NOTHING;
```

#### 12.2 Create Seed Script
**File:** `backend/scripts/seed-database.ts`
```typescript
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🌱 Seeding database...');
    
    const seedSQL = fs.readFileSync(
      path.join(__dirname, '../src/database/seed.sql'),
      'utf-8'
    );

    await pool.query(seedSQL);
    
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedDatabase();
```

#### 12.3 Update package.json
```json
{
  "scripts": {
    "seed": "ts-node scripts/seed-database.ts"
  }
}
```

### Validation:
- ✅ Seed script runs without errors
- ✅ Default data created in database
- ✅ Idempotent (can run multiple times)

---

## 📊 Phase 13: Error Handling & Exceptions (2-3 hours)

### Files to Create:
- `backend/src/database/exceptions.ts` (NEW)

### Tasks:

#### 13.1 Create Custom Database Exceptions
```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class DatabaseException extends HttpException {
  constructor(message: string, originalError?: Error) {
    super(
      {
        message,
        error: 'Database Error',
        details: originalError?.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export class UniqueConstraintException extends HttpException {
  constructor(field: string) {
    super(
      {
        message: `${field} already exists`,
        error: 'Unique Constraint Violation',
      },
      HttpStatus.CONFLICT
    );
  }
}

export class ForeignKeyException extends HttpException {
  constructor(relation: string) {
    super(
      {
        message: `Referenced ${relation} does not exist`,
        error: 'Foreign Key Violation',
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class NotFoundDatabaseException extends HttpException {
  constructor(resource: string) {
    super(
      {
        message: `${resource} not found`,
        error: 'Not Found',
      },
      HttpStatus.NOT_FOUND
    );
  }
}
```

#### 13.2 Add Error Handler to DatabaseService
```typescript
// In database.service.ts
import { DatabaseException, UniqueConstraintException, ForeignKeyException } from './exceptions';

async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  try {
    return await this.pool.query(text, params);
  } catch (error) {
    this.handleDatabaseError(error);
  }
}

private handleDatabaseError(error: any): never {
  // PostgreSQL error codes
  switch (error.code) {
    case '23505': // unique_violation
      const field = this.extractFieldFromError(error);
      throw new UniqueConstraintException(field);
    
    case '23503': // foreign_key_violation
      const relation = this.extractRelationFromError(error);
      throw new ForeignKeyException(relation);
    
    case '23502': // not_null_violation
      throw new DatabaseException('Required field is missing');
    
    case '22P02': // invalid_text_representation
      throw new DatabaseException('Invalid data format');
    
    case '08006': // connection_failure
      throw new DatabaseException('Database connection failed');
    
    default:
      throw new DatabaseException('Database operation failed', error);
  }
}

private extractFieldFromError(error: any): string {
  // Parse error detail to extract field name
  const detail = error.detail || '';
  const match = detail.match(/Key \(([^)]+)\)/);
  return match ? match[1] : 'field';
}

private extractRelationFromError(error: any): string {
  const detail = error.detail || '';
  const match = detail.match(/table "([^"]+)"/);
  return match ? match[1] : 'relation';
}
```

#### 13.3 Replace Prisma Errors in Services
**Before (Prisma):**
```typescript
try {
  await this.prisma.user.create({ data });
} catch (error) {
  if (error.code === 'P2002') {
    throw new ConflictException('Email already exists');
  }
  throw error;
}
```

**After (pg):**
```typescript
// DatabaseService handles errors automatically
const result = await this.db.query(
  'INSERT INTO users (...) VALUES (...)',
  [...]
);
// UniqueConstraintException thrown automatically on duplicate
```

### Validation:
- ✅ Duplicate email returns 409 Conflict
- ✅ Missing foreign key returns 400 Bad Request
- ✅ Not found returns 404
- ✅ Generic errors return 500

---

## 📊 Phase 14: Missing Service Methods (3-4 hours)

### Files to Review & Add:
- `backend/src/users/users.service.ts` - Add role management
- `backend/src/learning/learning.service.ts` - Add assessment methods
- `backend/src/catalog/catalog.service.ts` - Add search/filter

### Tasks:

#### 14.1 Role Management (users.service.ts)
**Add missing methods:**
```typescript
async assignRole(userId: string, roleName: string): Promise<void> {
  await this.db.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, id FROM roles WHERE name = $2
     ON CONFLICT DO NOTHING`,
    [userId, roleName]
  );
}

async removeRole(userId: string, roleName: string): Promise<void> {
  await this.db.query(
    `DELETE FROM user_roles
     WHERE user_id = $1 AND role_id = (SELECT id FROM roles WHERE name = $2)`,
    [userId, roleName]
  );
}

async getUserRoles(userId: string): Promise<string[]> {
  const result = await this.db.query(
    `SELECT r.name FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [userId]
  );
  return result.rows.map(row => row.name);
}
```

#### 14.2 Assessment Methods (learning.service.ts)
```typescript
async createAttempt(userId: string, assessmentId: string) {
  const result = await this.db.query(
    `INSERT INTO attempts (id, assessment_id, user_id, started_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [crypto.randomUUID(), assessmentId, userId]
  );
  return result.rows[0];
}

async submitAttempt(attemptId: string, score: number, passed: boolean) {
  const result = await this.db.query(
    `UPDATE attempts
     SET completed_at = NOW(), score = $2, passed = $3
     WHERE id = $1
     RETURNING *`,
    [attemptId, score, passed]
  );
  return result.rows[0];
}

async getAttemptHistory(userId: string, assessmentId: string) {
  const result = await this.db.query(
    `SELECT * FROM attempts
     WHERE user_id = $1 AND assessment_id = $2
     ORDER BY started_at DESC`,
    [userId, assessmentId]
  );
  return result.rows;
}
```

#### 14.3 Search/Filter (catalog.service.ts)
```typescript
async searchCourses(query: string, filters?: {
  level?: string;
  pathId?: string;
}): Promise<any[]> {
  let sql = `
    SELECT c.*, lp.title as path_title
    FROM courses c
    LEFT JOIN learning_paths lp ON c.path_id = lp.id
    WHERE c.is_public = true
  `;
  const params: any[] = [];

  if (query) {
    params.push(`%${query}%`);
    sql += ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
  }

  if (filters?.level) {
    params.push(filters.level);
    sql += ` AND c.level = $${params.length}`;
  }

  if (filters?.pathId) {
    params.push(filters.pathId);
    sql += ` AND c.path_id = $${params.length}`;
  }

  sql += ` ORDER BY c.title`;

  const result = await this.db.query(sql, params);
  return result.rows;
}
```

### Validation:
- ✅ All methods from original services implemented
- ✅ Role assignment works
- ✅ Assessment flow complete
- ✅ Search returns correct results

---

## 📊 Phase 15: Development Workflow & Scripts (1-2 hours)

### Files to Create:
- `backend/scripts/create-migration.ts` (NEW)
- `backend/scripts/run-migration.ts` (NEW)
- `backend/MIGRATION_GUIDE.md` (NEW)

### Tasks:

#### 15.1 Manual Migration Script
**File:** `backend/scripts/create-migration.ts`
```typescript
import * as fs from 'fs';
import * as path from 'path';

const migrationName = process.argv[2];
if (!migrationName) {
  console.error('Usage: npm run migration:create <name>');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
const filename = `${timestamp}_${migrationName}.sql`;
const migrationsDir = path.join(__dirname, '../migrations');

if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const template = `-- Migration: ${migrationName}
-- Created: ${new Date().toISOString()}

-- Up Migration
BEGIN;

-- Add your SQL here


COMMIT;

-- Down Migration (for rollback)
-- BEGIN;
-- 
-- 
-- COMMIT;
`;

const filepath = path.join(migrationsDir, filename);
fs.writeFileSync(filepath, template);

console.log(`✅ Migration created: ${filename}`);
```

#### 15.2 Run Migration Script
**File:** `backend/scripts/run-migration.ts`
```typescript
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Create migrations table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      // Check if already executed
      const check = await pool.query(
        'SELECT id FROM migrations WHERE name = $1',
        [file]
      );

      if (check.rows.length === 0) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        
        await pool.query(sql);
        await pool.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        
        console.log(`✅ ${file} completed`);
      } else {
        console.log(`⏭️  ${file} already executed`);
      }
    }

    console.log('✅ All migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigrations();
```

#### 15.3 Update package.json
```json
{
  "scripts": {
    "migration:create": "ts-node scripts/create-migration.ts",
    "migration:run": "ts-node scripts/run-migration.ts",
    "db:seed": "ts-node scripts/seed-database.ts",
    "db:reset": "npm run migration:run && npm run db:seed"
  }
}
```

#### 15.4 Create Migration Guide
**File:** `backend/MIGRATION_GUIDE.md`
```markdown
# Database Migration Guide (Post-Prisma)

## Creating a New Migration

```bash
npm run migration:create add_user_preferences
```

This creates: `migrations/20260221_120000_add_user_preferences.sql`

Edit the file and add your SQL.

## Running Migrations

```bash
npm run migration:run
```

Runs all pending migrations in order.

## Seeding Database

```bash
npm run db:seed
```

## Full Reset

```bash
npm run db:reset
```

Runs migrations + seeds.
```

### Validation:
- ✅ Can create new migrations
- ✅ Migrations run in order
- ✅ Already-run migrations skipped
- ✅ Seed script works

---

## �🚨 Risk Mitigation

### Rollback Strategy:
1. Keep Prisma code in `prisma-version` Git branch
2. Tag current deployment before migration
3. Have database backup ready
4. Test rollback procedure

### Common Issues & Solutions:

| Issue | Solution |
|-------|----------|
| SQL injection | Use parameterized queries ($1, $2, etc.) |
| Transaction deadlocks | Add retry logic with exponential backoff |
| Connection pool exhausted | Tune max connections, add timeout |
| Date timezone issues | Use `timestamptz` type, convert in app |
| NULL handling | Check for null explicitly in queries |
| Type mismatches | Create strict TypeScript interfaces |

---

## 📈 Performance Considerations

1. **Connection Pooling:**
   - Set `max: 20` for cPanel shared hosting
   - Adjust based on concurrent users

2. **Query Optimization:**
   - Use indexes on frequently queried columns
   - Avoid N+1 queries (use JOINs)
   - Use `EXPLAIN ANALYZE` for slow queries

3. **Caching Strategy:**
   - Consider Redis for frequently accessed data
   - Cache catalog data (domains, courses)

---

## ✅ Success Criteria

- [ ] Zero Prisma dependencies in package.json
- [ ] All API endpoints return expected data
- [ ] All tests pass
- [ ] Application runs on cPanel without crashes
- [ ] Response times < 500ms for most endpoints
- [ ] No SQL injection vulnerabilities
- [ ] Proper error handling for all database operations
- [ ] Transaction rollback works correctly
- [ ] Database connections properly released

---

## 📚 Prisma to SQL Conversion Reference

### Common Prisma Patterns → SQL Equivalents

| Prisma Feature | SQL Equivalent |
|----------------|----------------|
| `findUnique({ where: { id } })` | `SELECT * FROM table WHERE id = $1` |
| `findMany({ orderBy: { name: 'asc' } })` | `SELECT * FROM table ORDER BY name ASC` |
| `findFirst({ where: {...} })` | `SELECT * FROM table WHERE ... LIMIT 1` |
| `take: 10, skip: 20` | `LIMIT 10 OFFSET 20` |
| `include: { relation: true }` | `LEFT JOIN relation ON ...` |
| `select: { field1: true, field2: true }` | `SELECT field1, field2 FROM table` |
| `where: { field: { contains: 'text' } }` | `WHERE field ILIKE '%text%'` |
| `count({ where: {...} })` | `SELECT COUNT(*) FROM table WHERE ...` |
| `create({ data: {...} })` | `INSERT INTO table (...) VALUES (...) RETURNING *` |
| `update({ where: { id }, data: {...} })` | `UPDATE table SET ... WHERE id = $1 RETURNING *` |
| `delete({ where: { id } })` | `DELETE FROM table WHERE id = $1 RETURNING *` |
| `upsert({ where, create, update })` | `INSERT ... ON CONFLICT DO UPDATE` |

### Pagination Example
**Prisma:**
```typescript
const { page = 1, limit = 12 } = filters;
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
  prisma.course.findMany({ skip, take: limit }),
  prisma.course.count(),
]);

return {
  data,
  meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
};
```

**SQL:**
```typescript
const page = filters?.page || 1;
const limit = filters?.limit || 12;
const offset = (page - 1) * limit;

const [dataResult, countResult] = await Promise.all([
  db.query('SELECT * FROM courses LIMIT $1 OFFSET $2', [limit, offset]),
  db.query('SELECT COUNT(*) as total FROM courses'),
]);

return {
  data: dataResult.rows,
  meta: {
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    totalPages: Math.ceil(countResult.rows[0].total / limit),
  },
};
```

### Search with ILIKE
**Prisma:**
```typescript
where: {
  OR: [
    { title: { contains: query, mode: 'insensitive' } },
    { description: { contains: query, mode: 'insensitive' } },
  ],
}
```

**SQL:**
```typescript
const result = await db.query(
  `SELECT * FROM courses 
   WHERE title ILIKE $1 OR description ILIKE $1`,
  [`%${query}%`]
);
```

### Complex Nested Include
**Prisma:**
```typescript
prisma.course.findMany({
  include: {
    path: { include: { domain: true } },
    modules: {
      where: { isPublished: true },
      orderBy: { orderIndex: 'asc' },
    },
  },
});
```

**SQL:**
```typescript
const result = await db.query(`
  SELECT 
    c.*,
    json_build_object(
      'id', lp.id,
      'title', lp.title,
      'domain', json_build_object(
        'id', d.id,
        'name', d.name
      )
    ) as path,
    json_agg(
      json_build_object(
        'id', m.id,
        'title', m.title,
        'orderIndex', m.order_index
      ) ORDER BY m.order_index
    ) FILTER (WHERE m.id IS NOT NULL) as modules
  FROM courses c
  LEFT JOIN learning_paths lp ON c.path_id = lp.id
  LEFT JOIN domains d ON lp.domain_id = d.id
  LEFT JOIN modules m ON m.course_id = c.id AND m.is_published = true
  GROUP BY c.id, lp.id, d.id
`);
```

### Upsert with Composite Unique
**Prisma (composite unique on userId + moduleId):**
```typescript
prisma.moduleProgress.upsert({
  where: { userId_moduleId: { userId, moduleId } },
  update: { progressPercent: percent },
  create: { userId, moduleId, progressPercent: percent },
});
```

**SQL:**
```typescript
const result = await db.query(
  `INSERT INTO module_progress (id, user_id, module_id, progress_percent, started_at)
   VALUES ($1, $2, $3, $4, NOW())
   ON CONFLICT (user_id, module_id) 
   DO UPDATE SET 
     progress_percent = $4,
     updated_at = NOW()
   RETURNING *`,
  [crypto.randomUUID(), userId, moduleId, percent]
);
```

### Many-to-Many Join (Composite PK)
**Prisma (UserRole with composite @@id([userId, roleId])):**
```typescript
prisma.userRole.create({
  data: { userId, roleId },
});
```

**SQL:**
```typescript
// No need for UUID id - composite key is the PK
const result = await db.query(
  `INSERT INTO user_roles (user_id, role_id)
   VALUES ($1, $2)
   ON CONFLICT (user_id, role_id) DO NOTHING
   RETURNING *`,
  [userId, roleId]
);
```

### Check Existence with Composite Key
**Prisma:**
```typescript
const exists = await prisma.enrollment.findFirst({
  where: { userId, courseId, organizationId },
});
```

**SQL:**
```typescript
const result = await db.query(
  `SELECT id FROM enrollments 
   WHERE user_id = $1 AND course_id = $2 AND organization_id = $3
   LIMIT 1`,
  [userId, courseId, organizationId]
);
const exists = result.rows.length > 0;
```

---

## 📚 Reference Files

**Critical files to review:**
- `backend/prisma/schema.prisma` - For all model definitions
- `backend/migration.sql` - For exact table structure
- All `*.service.ts` files - For query patterns

**SQL Pattern Reference:**
```sql
-- Single record
SELECT * FROM table WHERE id = $1

-- List with pagination
SELECT * FROM table ORDER BY created_at DESC LIMIT $1 OFFSET $2

-- Join
SELECT t1.*, t2.name as related_name
FROM table1 t1
LEFT JOIN table2 t2 ON t1.foreign_id = t2.id

-- Aggregate
SELECT 
  COUNT(*) as total,
  AVG(score) as avg_score
FROM table

-- JSON aggregation
SELECT 
  parent.*,
  json_agg(child.*) as children
FROM parent
LEFT JOIN child ON child.parent_id = parent.id
GROUP BY parent.id

-- Upsert
INSERT INTO table (id, field) VALUES ($1, $2)
ON CONFLICT (id) DO UPDATE SET field = $2
```

---

## 🎯 Timeline Estimate

| Phase | Time | Complexity |
|-------|------|------------|
| 1. Setup | 1-2h | Low |
| 2. Database Layer | 2-3h | Medium |
| 3. App Module | 0.5h | Low |
| 4. Auth/Users | 4-6h | High |
| 5. Catalog | 4-6h | High |
| 6. Learning | 4-6h | High |
| 7. Admin | 4-6h | High |
| 8. Transformers | 2-3h | Medium |
| 9. Testing | 4-8h | High |
| 10. Deployment | 2-3h | Medium |
| **11. Enums** | 1-2h | Low |
| **12. Seed Data** | 2-3h | Medium |
| **13. Error Handling** | 2-3h | Medium |
| **14. Missing Methods** | 3-4h | High |
| **15. Dev Workflow** | 1-2h | Low |
| **16. Health & Monitoring** | 1-2h | Low |
| **17. Final Cleanup** | 2-3h | Low |
| **Total** | **39-61h** | **5-8 days** |

---

## 📊 Phase 16: Health Check & Monitoring (1-2 hours)

### Files to Create:
- `backend/src/health/health.controller.ts` (NEW)
- `backend/src/health/health.module.ts` (NEW)

### Files to Modify:
- `backend/src/app.module.ts`
- `backend/src/main.ts`

### Tasks:

#### 16.1 Create Health Check Controller
**File:** `backend/src/health/health.controller.ts`
```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private db: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'Database health check' })
  async databaseCheck() {
    const isHealthy = await this.db.healthCheck();
    
    return {
      status: isHealthy ? 'ok' : 'error',
      database: isHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health metrics' })
  async detailedCheck() {
    const isDbHealthy = await this.db.healthCheck();
    
    return {
      status: isDbHealthy ? 'ok' : 'degraded',
      checks: {
        database: {
          status: isDbHealthy ? 'pass' : 'fail',
          timestamp: new Date().toISOString(),
        },
        memory: {
          status: 'pass',
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
        },
        uptime: {
          status: 'pass',
          seconds: process.uptime(),
        },
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
```

#### 16.2 Create Health Module
**File:** `backend/src/health/health.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

#### 16.3 Add to App Module
Update imports in `backend/src/app.module.ts`:
```typescript
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ... other imports
    HealthModule,
  ],
})
```

#### 16.4 Update CORS Configuration
**File:** `backend/src/main.ts`
Add production CORS origins:
```typescript
// CORS
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000',
];

app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

#### 16.5 Update .env.example
Add CORS configuration:
```dotenv
# CORS (comma-separated origins)
CORS_ORIGIN="http://localhost:5173,http://localhost:3000,https://urjourney.in"
```

### Validation:
- ✅ GET /health returns 200
- ✅ GET /health/db returns database status
- ✅ GET /health/detailed returns all metrics
- ✅ CORS works from production domain

---

## 📊 Phase 17: Final Cleanup & Documentation (2-3 hours)

### Files to Delete:
- `backend/prisma/` (entire directory)
- `backend/node_modules/.prisma/` (if exists)
- `backend/node_modules/@prisma/` (if exists)
- Any remaining Prisma-related files

### Files to Create:
- `backend/DATABASE_MIGRATION_COMPLETED.md` (NEW)
- `backend/POST_MIGRATION_CHECKLIST.md` (NEW)

### Files to Update:
- `backend/README.md`
- `backend/.gitignore`

### Tasks:

#### 17.1 Update README.md
**File:** `backend/README.md`
Add new sections:
```markdown
# DPDP Backend API

## Database

This application uses PostgreSQL with the `pg` (node-postgres) client library.

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. Run migrations:
   ```bash
   npm run migration:run
   ```

4. Seed database:
   ```bash
   npm run db:seed
   ```

### Development

```bash
# Start in development mode
npm run start:dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm run start:prod
```

### Database Migrations

```bash
# Create a new migration
npm run migration:create <migration-name>

# Run pending migrations
npm run migration:run

# Full database reset (migrations + seed)
npm run db:reset
```

### Health Checks

- Basic: GET /health
- Database: GET /health/db
- Detailed: GET /health/detailed

### API Documentation

Swagger UI available at: http://localhost:3001/api/docs
```

#### 17.2 Create Migration Completion Doc
**File:** `backend/DATABASE_MIGRATION_COMPLETED.md`
```markdown
# Prisma to PostgreSQL Migration - Completed

**Date:** [Current Date]
**Status:** ✅ COMPLETED

## What Changed

### Removed
- ❌ Prisma ORM (@prisma/client, prisma)
- ❌ Prisma CLI and all related tooling
- ❌ Prisma schema.prisma file
- ❌ Prisma migrations folder
- ❌ All Prisma-specific code

### Added
- ✅ PostgreSQL client (pg)
- ✅ DatabaseService with connection pooling
- ✅ Raw SQL queries with parameterized inputs
- ✅ Manual transaction management
- ✅ Custom error handling for PostgreSQL errors
- ✅ Type-safe interfaces for all models
- ✅ Migration tracking system
- ✅ Health check endpoints

## Benefits

1. **cPanel Compatibility:** No more binary compatibility issues
2. **Performance:** Direct SQL queries, no ORM overhead
3. **Control:** Full control over queries and transactions
4. **Lightweight:** Smaller bundle size, faster deployments
5. **Standard:** Uses standard PostgreSQL client

## Migration Summary

- **Total Files Modified:** 25+
- **Total Lines of Code:** ~3000+
- **Time Spent:** 40-50 hours
- **Breaking Changes:** None (API unchanged)

## Testing Status

- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ All API endpoints functional
- ✅ Database transactions working
- ✅ Health checks operational
- ✅ Deployed to cPanel successfully

## Rollback Plan

If issues arise, rollback to commit: [Git commit hash before migration]

Git branch with Prisma code: `prisma-version`

## Next Steps

1. Monitor production logs for database errors
2. Set up automated backups
3. Tune connection pool settings based on load
4. Add database query logging for debugging

## References

- PostgreSQL docs: https://www.postgresql.org/docs/
- node-postgres docs: https://node-postgres.com/
- Original migration plan: PRISMA_REMOVAL_PLAN.md
```

#### 17.3 Create Post-Migration Checklist
**File:** `backend/POST_MIGRATION_CHECKLIST.md`
```markdown
# Post-Migration Checklist

## ✅ Code Verification

- [ ] No `import` statements from `@prisma/client`
- [ ] No `PrismaService` references
- [ ] All services use `DatabaseService`
- [ ] All queries use parameterized inputs ($1, $2, etc.)
- [ ] All enums converted to TypeScript
- [ ] All types defined in database.types.ts
- [ ] No Prisma error codes (P2002, etc.)
- [ ] PostgreSQL error codes handled (23505, etc.)

## ✅ Dependencies

- [ ] `@prisma/client` removed from package.json
- [ ] `prisma` removed from devDependencies
- [ ] `pg` added to dependencies
- [ ] `@types/pg` added to devDependencies
- [ ] `npm install` completes without errors
- [ ] No Prisma warnings in logs

## ✅ Database

- [ ] All migrations applied successfully
- [ ] Database seed completes without errors
- [ ] All tables exist with correct schema
- [ ] All indexes created
- [ ] All foreign keys working
- [ ] All enum types created

## ✅ Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual API testing complete
- [ ] All CRUD operations work
- [ ] Transactions rollback on errors
- [ ] Error responses correct

## ✅ Deployment

- [ ] Built successfully: `npm run build`
- [ ] No TypeScript errors
- [ ] Bundle size reduced (no Prisma binaries)
- [ ] Environment variables configured
- [ ] Health checks respond correctly
- [ ] Application starts without errors

## ✅ Production

- [ ] Deployed to cPanel
- [ ] No runtime errors in logs
- [ ] Database connections stable
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] All features functional

## ✅ Documentation

- [ ] README.md updated
- [ ] Migration guide created
- [ ] API docs still accurate
- [ ] Team notified of changes
- [ ] Deployment docs updated

## ✅ Monitoring

- [ ] Error logging configured
- [ ] Database query logging enabled (if needed)
- [ ] Performance metrics tracked
- [ ] Backup strategy in place
- [ ] Alerting configured

## 🎉 Migration Complete!

If all items checked, migration is successful.
```

#### 17.4 Update .gitignore
Add/verify these entries:
```gitignore
# Prisma (no longer used)
prisma/migrations/

# Database
*.db
*.sqlite

# Environment
.env
.env.local
.env.production

# Logs
logs/
*.log

# Build
dist/
build/
```

### Validation:
- ✅ All Prisma files deleted
- ✅ README reflects new setup
- ✅ Documentation complete
- ✅ Checklist can be followed

---

**Status:** Ready for implementation  
**Next Step:** Begin Phase 1 - Setup & Dependencies
