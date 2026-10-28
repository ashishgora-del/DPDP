# DPDP Multi-Module Platform

A modern, full-stack compliance platform with multiple modules sharing a unified backend.

## 🚀 Quick Start

### Start Backend (Required First)
```bash
cd backend
npm install              # First time only
npm run start:dev        # Runs on http://localhost:3001
```

### Start Frontend
```bash
cd ..                    # Back to root
npm install              # First time only
npm run dev              # Runs on http://localhost:5173
```

### Access Application
- **Main App:** http://localhost:5173
- **Learning Platform:** http://localhost:5173/learning-platform
- **Risk Assessment:** http://localhost:5173/risk-assessment
- **Backend API Docs:** http://localhost:3001/api/docs

## 📁 Project Structure

```
dpdp-try-3/
├── backend/              ← SHARED BACKEND (ALL modules)
│   ├── src/
│   │   ├── auth/         ← Shared authentication (JWT)
│   │   ├── users/        ← User management
│   │   ├── learning/     ← Learning platform APIs
│   │   ├── catalog/      ← Course catalog
│   │   └── admin/        ← Admin endpoints
│   └── prisma/           ← Database schema
│
├── src/
│   ├── shared/           ← Shared frontend code
│   │   └── auth/         ← Auth context (all modules use this)
│   ├── modules/
│   │   ├── learning-platform/  ← E-learning module
│   │   └── risk-assessment/    ← Risk assessment module
│   └── app/              ← Main landing page
│
└── AI-PrivacyLearning-main/  ← Reference (original code)
```

## 🎯 Key Features

### Shared Backend Architecture
- ✅ **Single authentication system** for all modules
- ✅ **Unified user management**
- ✅ **No code duplication**
- ✅ **Easy to add new modules**

### Modules
- 📚 **Learning Platform** - E-learning with courses, enrollments, progress tracking
- 🛡️ **Risk Assessment** - DPDPA compliance risk scoping
- 🏠 **Main Landing Page** - Modern glassmorphism design

### Tech Stack
- **Frontend:** React 19, TypeScript, Vite, TailwindCSS, Framer Motion
- **Backend:** NestJS, Prisma, PostgreSQL
- **Auth:** JWT with shared context

## 📖 Documentation

- **[Project Structure](./PROJECT_STRUCTURE.md)** - Complete architecture overview
- **[Backend Guide](./backend/SHARED_BACKEND_README.md)** - Backend setup and API docs
- **[Quick Start](./backend/QUICK_START.md)** - Backend quick reference

## 🔐 Authentication

All modules share the same authentication system:

```typescript
// Any module can use shared auth
import { useAuth } from '../../../shared/auth';

function MyComponent() {
  const { user, login, logout } = useAuth();
  // Works across all modules!
}
```

**Default Login:**
- Email: yagyabuttan@gmail.com
- Password: yagyayagya

## 🛠️ Development

### Adding a New Module

#### Backend (API)
1. Create folder: `backend/src/my-module/`
2. Add module, controller, service files
3. Register in `backend/src/app.module.ts`
4. Backend automatically handles auth!

#### Frontend (UI)
1. Create folder: `src/modules/my-module/`
2. Create pages and components
3. Add route in `src/app/App.tsx`
4. Import shared auth: `import { useAuth } from '../../shared/auth'`
5. Module ready to use!

### Database Changes
```bash
cd backend
# Edit prisma/schema.prisma
npm run prisma:migrate    # Create migration
npm run prisma:generate   # Generate types
```

## 🚢 Deployment

### Backend
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend
```bash
npm run build
# Deploy dist/ folder
```

## 📋 Available Scripts

### Frontend (Root)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run start:dev` - Start with hot reload
- `npm run start:prod` - Start production server
- `npm run build` - Build backend
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open database GUI

## 🎨 Design System

All modules use modern glassmorphism design:
- Gradient backgrounds (blue → purple → pink)
- Backdrop blur effects
- Smooth animations with Framer Motion
- Consistent color scheme across all pages

## 🔧 Troubleshooting

### Backend won't start?
- Check if PostgreSQL is running
- Verify `.env` file exists in `backend/`
- Run `npm install` in backend folder

### Frontend can't connect to backend?
- Ensure backend is running on port 3001
- Check `src/shared/auth/api.ts` baseURL
- Verify CORS settings in backend

### Database errors?
- Run migrations: `cd backend && npm run prisma:migrate`
- Check DATABASE_URL in backend/.env

## 📚 API Endpoints

**Authentication:**
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get profile

**Learning Platform:**
- GET `/api/catalog/courses` - List courses
- GET `/api/catalog/paths` - List learning paths
- POST `/api/learning/enrollments` - Enroll in course
- GET `/api/learning/enrollments` - My enrollments

**Full API docs:** http://localhost:3001/api/docs

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test both frontend and backend
4. Submit pull request

## 📄 License

MIT

---

**Version:** 1.0.0  
**Last Updated:** February 2026

For detailed architecture information, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)