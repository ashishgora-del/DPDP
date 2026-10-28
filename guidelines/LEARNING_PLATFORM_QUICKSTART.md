# Learning Platform - Quick Start Guide

## 🎯 What's Been Implemented

The E-Learning Platform has been successfully integrated as the 4th section of the DPDP compliance project. Currently, **Phase 0 & 1 are complete** (25% of total work).

### ✅ Working Features
- User registration and login pages
- Landing page with hero section
- Authentication context (login/register/logout)
- Complete API client with 40+ endpoints
- Header navigation
- Protected route guards
- Form validation

### ⏳ Not Yet Implemented
- Course catalog browsing
- Course detail pages
- Enrollment functionality
- Lesson viewing
- Admin panel
- (14 more pages to be created)

---

## 🚀 Quick Start

### 1. Development Server Already Running
Your Vite dev server should already be running. If not:

```bash
npm run dev
```

### 2. Access the Learning Platform

Open your browser and navigate to:
```
http://localhost:5173/trinetrai/learning-platform
```

### 3. What You Can See

#### Landing Page ✅
- Navigate to: `/trinetrai/learning-platform`
- **What works**:
  - Hero section with call-to-action
  - Features showcase (6 cards)
  - "Browse Courses" button
  - "Get Started" / "Register" button
  - Header with navigation

#### Registration Page ✅
- Navigate to: `/trinetrai/learning-platform/register`
- **What works**:
  - Form with validation
  - Role selection (Learner/Instructor)
  - Form validation (client-side)
- **Note**: Submission will fail without backend (expected)

#### Login Page ✅
- Navigate to: `/trinetrai/learning-platform/login`
- **What works**:
  - Email/password form
  - Form validation
  - Error messages
- **Note**: Login will fail without backend (expected)

### 4. What Happens When You Click Things

| Action | What Happens | Why |
|--------|--------------|-----|
| Click "Browse Courses" | Shows "Route not found" or 404 | CatalogPage not yet created (Phase 2) |
| Click "My Learning" | Shows "Route not found" or 404 | MyLearningPage not yet created (Phase 3) |
| Submit Registration | Shows API error | Backend not running (expected) |
| Submit Login | Shows API error | Backend not running (expected) |

---

## 🔧 Full Testing with Backend

To test authentication and API features, you need the backend running.

### Option 1: Use Existing Backend (Recommended)

```bash
# Navigate to backend folder
cd AI-PrivacyLearning-main/backend

# Install dependencies (first time only)
npm install

# Set up database (first time only)
# Update .env with database connection
# Then run:
npx prisma migrate dev
npx prisma db seed

# Start backend
npm run start:dev
```

Backend will run on: `http://localhost:3001`

### Option 2: Mock API (For Development)

If you don't want to run the full backend, you can create mock API responses:

```bash
# Install json-server
npm install -g json-server

# Create db.json with mock data
# Run mock server
json-server --watch db.json --port 3001
```

---

## 📁 File Structure

```
src/modules/learning-platform/
├── pages/
│   ├── HomePage.tsx                 ✅ Landing page
│   ├── LoginPage.tsx                ✅ Login form
│   └── RegisterPage.tsx             ✅ Registration form
│
├── components/
│   ├── layout/
│   │   └── Header.tsx               ✅ Navigation header
│   └── common/
│       ├── AuthGuard.tsx            ✅ Protected routes
│       ├── LoadingSpinner.tsx       ✅ Loading UI
│       ├── ErrorMessage.tsx         ✅ Error display
│       └── EmptyState.tsx           ✅ Empty state UI
│
├── lib/
│   ├── api.ts                       ✅ API client (40+ endpoints)
│   ├── constants.ts                 ✅ Configuration
│   ├── auth.ts                      ✅ Auth utilities
│   ├── helpers.ts                   ✅ Helper functions
│   └── validators.ts                ✅ Form validation
│
├── types/
│   └── index.ts                     ✅ All TypeScript types
│
├── context/
│   └── AuthContext.tsx              ✅ Authentication state
│
└── index.tsx                        ✅ Module entry point
```

---

## 🧪 Testing Without Backend

You can test the UI and client-side validation without the backend:

### Test Registration Form Validation
1. Go to `/trinetrai/learning-platform/register`
2. Try submitting with:
   - Empty fields → See validation errors
   - Invalid email → See "Invalid email address"
   - Short password → See "Password must be at least 8 characters"
   - Mismatched passwords → See "Passwords do not match"

### Test Login Form Validation
1. Go to `/trinetrai/learning-platform/login`
2. Try submitting with:
   - Empty fields → See validation errors
   - Invalid email format → See error

### Test Navigation
1. Click Header links
2. See navigation between pages
3. Notice "Admin" link only shows when logged in as Admin (not visible without auth)

---

## 📋 Next Steps

### For Development (Phase 2 - Catalog)
Create these files next:

1. **CatalogPage.tsx** - Course listing with filters
   - Display courses in grid
   - Filter by category, price
   - Search functionality
   - Pagination

2. **CourseDetailPage.tsx** - Individual course view
   - Course information
   - Modules and lessons list
   - Enrollment button
   - Instructor info

3. **CourseCard.tsx** - Reusable course card
   - Thumbnail, title, price
   - Category, instructor
   - Enrollment count

### For Backend Integration
1. Ensure backend is running on `http://localhost:3001`
2. Verify `.env` has correct `VITE_API_URL`
3. Test registration
4. Test login
5. Check if JWT token is stored in localStorage
6. Try accessing protected routes

---

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### Backend connection errors
- Check if backend is running: `http://localhost:3001/api`
- Verify `.env` has `VITE_API_URL=http://localhost:3001/api`
- Check CORS is enabled in backend

### TypeScript errors
```bash
# Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Routing issues
- Ensure you're accessing `/trinetrai/learning-platform` (with base path)
- Check `vite.config.ts` has correct base setting

---

## 📚 Resources

- **Full Migration Plan**: See `LEARNING_PLATFORM_MIGRATION_PLAN.md`
- **Implementation Status**: See `LEARNING_PLATFORM_IMPLEMENTATION_STATUS.md`
- **Module README**: See `src/modules/learning-platform/README.md`
- **API Documentation**: See API client in `lib/api.ts`
- **Type Definitions**: See `types/index.ts`

---

## ✅ Verification Checklist

Test these to verify the implementation:

- [ ] Landing page loads at `/trinetrai/learning-platform`
- [ ] Can navigate to Register page
- [ ] Can navigate to Login page
- [ ] Header shows correct links
- [ ] Registration form validates input
- [ ] Login form validates input
- [ ] No console errors (except API connection errors)
- [ ] No TypeScript errors
- [ ] Responsive design works on mobile

---

## 💡 Tips

1. **Use React DevTools** to inspect AuthContext state
2. **Check localStorage** to see if tokens are being stored (after backend is connected)
3. **Use Network tab** to see API calls (when backend is running)
4. **Check Console** for any errors or warnings

---

**Status**: Foundation Complete ✅  
**Ready for**: Phase 2 (Catalog Implementation)  
**Estimated Time for Phase 2**: 4-6 hours (7 components)

Happy coding! 🚀
