# DPDP Project Structure

## Overview

This is a **multi-module web application** with a **single shared backend** serving all frontend modules.

```
dpdp-try-3/
├── backend/                          ← SHARED BACKEND (ALL modules use this)
│   ├── src/
│   │   ├── auth/                     ← Shared authentication
│   │   ├── users/                    ← Shared user management
│   │   ├── learning/ catalog/ admin/ ← Learning platform APIs
│   │   └── app.module.ts             ← Add new modules here
│   ├── prisma/                       ← Shared database
│   └── package.json                  ← Backend dependencies
│
├── src/                              ← FRONTEND
│   ├── shared/                       ← Shared frontend code
│   │   └── auth/                     ← Shared auth (all modules use this)
│   │       ├── AuthContext.tsx       ← Auth state
│   │       ├── api.ts                ← Axios client (points to backend)
│   │       └── LoginModal.tsx        ← Reusable login
│   │
│   ├── modules/                      ← Feature modules
│   │   ├── learning-platform/        ← E-learning module
│   │   └── risk-assessment/          ← Risk assessment module
│   │
│   └── app/                          ← Main app
│       ├── App.tsx                   ← Root component
│       └── HomePage.tsx              ← Landing page
│
├── AI-PrivacyLearning-main/          ← REFERENCE (original learning platform)
│   └── backend/                      ← Kept for reference, not used
│
├── package.json                      ← Frontend dependencies
└── vite.config.ts                    ← Vite configuration
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Vite)                         │
│                    http://localhost:5173                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Main App   │  │   Learning   │  │     Risk     │      │
│  │   HomePage   │  │   Platform   │  │  Assessment  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                  ┌─────────▼─────────┐                       │
│                  │   Shared Auth     │                       │
│                  │  AuthContext.tsx  │                       │
│                  │     api.ts        │                       │
│                  └─────────┬─────────┘                       │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   HTTP/REST     │
                    │  (axios calls)  │
                    └────────┬────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                BACKEND (NestJS + Prisma)                      │
│                  http://localhost:3001/api                    │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              SHARED MODULES (All use these)          │    │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │    │
│  │  │    Auth    │  │   Users    │  │   Prisma     │   │    │
│  │  │    JWT     │  │   CRUD     │  │  (Database)  │   │    │
│  │  └────────────┘  └────────────┘  └──────────────┘   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │           MODULE-SPECIFIC ENDPOINTS                  │    │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │    │
│  │  │  Catalog   │  │  Learning  │  │    Admin     │   │    │
│  │  │  Courses   │  │ Enrollments│  │   Manage     │   │    │
│  │  └────────────┘  └────────────┘  └──────────────┘   │    │
│  │                                                       │    │
│  │  ┌────────────┐                                      │    │
│  │  │Risk Assess │  ← Add new modules here             │    │
│  │  │  (Future)  │                                      │    │
│  │  └────────────┘                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │    Database     │
                    └─────────────────┘
```

## How It Works

### 1. User Accesses Frontend
- Visits http://localhost:5173
- Sees main home page

### 2. User Navigates to Module
- Clicks "E-Learning" → `/learning-platform`
- Clicks "Risk Assessment" → `/risk-assessment`

### 3. Module Needs Authentication
- Uses **shared AuthContext** (`src/shared/auth/`)
- Shows **shared LoginModal**
- All modules use same auth state

### 4. Frontend Calls Backend API
- All API calls go through `src/shared/auth/api.ts`
- Axios client configured with:
  ```typescript
  baseURL: 'http://localhost:3001/api'
  ```
- Auth token automatically added to requests

### 5. Backend Processes Request
- Validates JWT token (shared auth)
- Routes to appropriate module:
  - `/api/auth/*` → Auth module (shared)
  - `/api/catalog/*` → Catalog module (learning)
  - `/api/learning/*` → Learning module
  - `/api/admin/*` → Admin module
- Returns data to frontend

### 6. Frontend Displays Data
- Module receives data from backend
- Renders UI with modern design
- Updates shared auth state if needed

## Data Flow Example: User Login

```
1. User clicks "Login" in Learning Platform
   ↓
2. LoginModal opens (src/shared/auth/LoginModal.tsx)
   ↓
3. User enters credentials
   ↓
4. LoginModal calls authApi.login()
   ↓
5. Axios sends: POST http://localhost:3001/api/auth/login
   ↓
6. Backend auth.controller.ts receives request
   ↓
7. Backend validates credentials (auth.service.ts)
   ↓
8. Backend generates JWT token
   ↓
9. Backend returns { accessToken, user }
   ↓
10. Frontend stores token in localStorage
    ↓
11. AuthContext updates user state
    ↓
12. All modules now have access to authenticated user
    ↓
13. Future API calls include token in Authorization header
```

## Key Design Decisions

### Why Shared Backend?

✅ **Single Authentication System**
- All modules use same login
- Users don't need multiple accounts
- Consistent security across platform

✅ **No Code Duplication**
- Auth logic written once
- User management centralized
- Database schema unified

✅ **Easy to Add Modules**
- Just add new folder in `backend/src/`
- Register in `app.module.ts`
- Frontend can immediately use new APIs

✅ **Better Maintenance**
- Update security in one place
- Single database to manage
- Unified deployment

### Why Shared Auth Frontend?

✅ **Consistent User Experience**
- Same login flow everywhere
- Shared user state
- Single logout affects all modules

✅ **Code Reuse**
- LoginModal used by all modules
- AuthContext provides auth state
- API client configured once

✅ **Easier Development**
- Add new module, auth already works
- No need to implement auth per module
- Faster feature development

## Starting the Application

### Full Stack Setup

1. **Start Backend:**
   ```bash
   cd backend
   npm install          # First time
   npm run start:dev    # http://localhost:3001
   ```

2. **Start Frontend:**
   ```bash
   cd ..               # Back to root
   npm install         # First time
   npm run dev         # http://localhost:5173
   ```

3. **Access Application:**
   - Main App: http://localhost:5173
   - Learning Platform: http://localhost:5173/learning-platform
   - Risk Assessment: http://localhost:5173/risk-assessment
   - Backend API Docs: http://localhost:3001/api/docs

## Adding a New Module

### Backend (New API Endpoints)

1. Create module:
   ```bash
   cd backend/src
   mkdir my-module
   ```

2. Create module files:
   ```typescript
   // my-module/my-module.module.ts
   import { Module } from '@nestjs/common';
   
   @Module({
     controllers: [MyController],
     providers: [MyService],
   })
   export class MyModule {}
   ```

3. Register in app.module.ts:
   ```typescript
   import { MyModule } from './my-module/my-module.module';
   
   @Module({
     imports: [
       // ...existing
       MyModule,
     ],
   })
   export class AppModule {}
   ```

### Frontend (New UI Module)

1. Create module folder:
   ```bash
   cd src/modules
   mkdir my-module
   ```

2. Create pages:
   ```tsx
   // src/modules/my-module/pages/HomePage.tsx
   import { useAuth } from '../../../shared/auth';
   
   export default function HomePage() {
     const { user } = useAuth();
     // Use shared auth!
   }
   ```

3. Add routes in App.tsx:
   ```tsx
   import MyModule from './modules/my-module';
   
   <Route path="/my-module/*" element={<MyModule />} />
   ```

4. Module automatically has access to:
   - ✅ Shared authentication
   - ✅ Backend API (via axios client)
   - ✅ User state
   - ✅ Login/Logout

## Environment Configuration

### Development (Current Setup)
```
Frontend: http://localhost:5173
Backend:  http://localhost:3001
Database: PostgreSQL (local)
```

### Production (Future)
```
Frontend: https://yourdomain.com
Backend:  https://api.yourdomain.com
Database: PostgreSQL (cloud)
```

Update `src/shared/auth/api.ts`:
```typescript
const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3001/api',
});
```

## File Locations Cheat Sheet

### Need to add authentication to a new module?
→ `import { useAuth } from '../../../shared/auth'`

### Need to call backend API?
→ `import api from '../../../shared/auth/api'`

### Need to add new backend endpoint?
→ Create in `backend/src/your-module/`

### Need to add new database table?
→ Edit `backend/prisma/schema.prisma`

### Need to add new frontend route?
→ Edit `src/app/App.tsx`

### Need to update backend dependencies?
→ Edit `backend/package.json`

### Need to update frontend dependencies?
→ Edit `package.json` (root level)

## Summary

🎯 **One Backend** → Serves all frontend modules  
🔐 **Shared Auth** → Used by all modules  
📦 **Modular Frontend** → Each module independent but shares auth  
🗄️ **Single Database** → All data in one place  
🚀 **Easy to Extend** → Add modules without touching existing code  

---

**Original Backend Location:** `AI-PrivacyLearning-main/backend/` (kept for reference)  
**Active Shared Backend:** `backend/` (all modules use this)  
**Frontend:** `src/` with modules in `src/modules/`
