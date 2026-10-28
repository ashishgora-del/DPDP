# Backend Structure - Quick Reference

## Current Status
✅ **Shared backend successfully created** at root level `backend/`

## Location
- **Shared Backend:** `backend/` (root level)
- **Original Backend:** `AI-PrivacyLearning-main/backend/` (kept for reference)

## What's Shared

### 🔐 Authentication (ALL modules use this)
```
backend/src/auth/
├── auth.controller.ts      # Login, register, logout
├── auth.service.ts         # JWT logic
├── jwt.strategy.ts         # JWT validation
└── guards/                 # Auth guards
```

**Endpoints:**
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- POST `/api/auth/logout`

### 👥 User Management (ALL modules use this)
```
backend/src/users/
├── users.controller.ts     # User CRUD
├── users.service.ts        # User business logic
└── dto/                    # User data transfer objects
```

### 📚 Learning Platform (Module-specific)
```
backend/src/
├── catalog/                # Course catalog APIs
├── learning/               # Enrollments, progress
└── admin/                  # Admin management
```

### 🗄️ Database (Shared)
```
backend/prisma/
├── schema.prisma           # Database schema
└── migrations/             # Database migrations
```

**All modules use the same database** with different tables/models.

## Running the Backend

### Start Backend Server
```bash
cd backend
npm install              # First time only
npm run start:dev        # Development mode
```

Backend runs on: **http://localhost:3001**

### Available Scripts
```bash
npm run start:dev        # Development (hot reload)
npm run start:prod       # Production
npm run build            # Build for production
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Visual database editor
npm run prisma:seed      # Seed initial data
```

## Frontend Configuration

All frontend modules point to the same backend:

```typescript
// src/shared/auth/api.ts (ALREADY CONFIGURED)
const api = axios.create({
  baseURL: 'http://localhost:3001/api',  // Shared backend
});
```

**Current Frontend Modules Using This Backend:**
- ✅ Learning Platform (`src/modules/learning-platform/`)
- ⏳ Risk Assessment (can integrate when needed)
- ⏳ Future modules (ready to integrate)

## Adding New Module to Backend

### Quick Steps:

1. **Create module folder:**
   ```bash
   cd backend/src
   mkdir my-new-module
   ```

2. **Create module files:**
   ```typescript
   // my-new-module/my-new-module.module.ts
   import { Module } from '@nestjs/common';
   
   @Module({
     controllers: [MyController],
     providers: [MyService],
   })
   export class MyNewModule {}
   ```

3. **Register in app.module.ts:**
   ```typescript
   import { MyNewModule } from './my-new-module/my-new-module.module';
   
   @Module({
     imports: [
       // ... existing
       MyNewModule,
     ],
   })
   export class AppModule {}
   ```

4. **Restart backend:**
   ```bash
   # Server auto-restarts in dev mode
   # Or manually: npm run start:dev
   ```

## Database Schema Overview

```prisma
// Key models in prisma/schema.prisma

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  primaryRole   UserRole  @default(USER)
  // Used by ALL modules
}

model Course {
  id            String    @id @default(uuid())
  title         String
  // Learning platform specific
}

// Add new models for new modules here
model RiskAssessment {
  id            String    @id @default(uuid())
  // Risk assessment specific
}
```

## Environment Variables

```env
# backend/.env (already configured)

DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
JWT_EXPIRATION="7d"
PORT=3001
```

## API Endpoints Summary

### Authentication (Shared - All Modules)
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get profile
- `PATCH /api/users/me` - Update profile

### Learning Platform
- `GET /api/catalog/courses` - List courses
- `GET /api/catalog/paths` - List learning paths
- `POST /api/learning/enrollments` - Enroll
- `GET /api/learning/enrollments` - My enrollments
- `GET /api/learning/progress` - My progress

### Admin (Learning Platform)
- `POST /api/admin/courses` - Create course
- `PATCH /api/admin/courses/:id` - Update course
- Full CRUD for domains, paths, modules

**Swagger Documentation:** http://localhost:3001/api/docs

## File Structure

```
backend/
├── src/
│   ├── auth/              ← SHARED (all modules)
│   ├── users/             ← SHARED (all modules)
│   ├── prisma/            ← SHARED (database service)
│   ├── catalog/           ← Learning platform
│   ├── learning/          ← Learning platform
│   ├── admin/             ← Learning platform
│   ├── app.module.ts      ← Root module (add new modules here)
│   └── main.ts            ← Entry point
├── prisma/
│   ├── schema.prisma      ← Database schema
│   └── migrations/        ← Version history
├── package.json           ← Dependencies
└── .env                   ← Configuration
```

## Key Benefits of Shared Backend

✅ **Single source of truth** for authentication  
✅ **Shared user database** across all modules  
✅ **No code duplication** for auth/users  
✅ **Easy to add new modules** (just add to src/)  
✅ **Single deployment** (one server for all APIs)  
✅ **Consistent API patterns** across modules  

## Testing the Backend

```bash
# Check backend is running
curl http://localhost:3001/api/auth/me

# Or open in browser
http://localhost:3001/api/docs
```

## Deployment Notes

For production:

1. **Build:**
   ```bash
   npm run build
   ```

2. **Run:**
   ```bash
   npm run start:prod
   ```

3. **Configure frontend API base URL:**
   ```typescript
   const api = axios.create({
     baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
   });
   ```

## Troubleshooting

### Backend not starting?
- Check if port 3001 is free
- Verify DATABASE_URL in .env
- Run `npm install` in backend folder

### Database errors?
- Run migrations: `npm run prisma:migrate`
- Check PostgreSQL is running
- Verify database exists

### Frontend can't connect?
- Verify backend is running on port 3001
- Check CORS settings in main.ts
- Verify baseURL in frontend api.ts

---

For detailed documentation, see [SHARED_BACKEND_README.md](./SHARED_BACKEND_README.md)
