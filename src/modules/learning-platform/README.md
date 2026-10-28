# Learning Platform Module

A comprehensive e-learning platform built with React, TypeScript, and Tailwind CSS, integrated into the DPDP (Data Privacy & Protection) application.

## 🎯 Overview

This module provides a complete learning management system (LMS) with features for browsing courses, enrolling in learning paths, tracking progress, and comprehensive admin capabilities for content management.

**Status**: 90% Complete ✅ | **Files**: 54 | **Lines of Code**: ~8,350

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [API Integration](#api-integration)
- [Components](#components)
- [Development](#development)

## ✨ Features

### For Learners
- ✅ **Browse Catalog** - Explore available courses and learning paths
- ✅ **Course Details** - View course information, modules, and lessons
- ✅ **User Authentication** - Register and login with secure JWT authentication
- ✅ **Enrollment** - Enroll in courses and track progress
- ✅ **My Learning** - View enrolled courses and resume learning
- ✅ **Lesson Viewing** - Interactive lesson player with content blocks
- ✅ **Profile Management** - Update profile, change password, manage settings
- ✅ **Certificates** - Download and share course completion certificates

### For Admins
- ✅ **Dashboard** - Overview with key metrics and recent activity
- ✅ **Course Management** - Create, edit, publish/unpublish courses
- ✅ **Domain Management** - Organize content by domains with custom colors/icons
- ✅ **Learning Paths** - Create structured learning journeys
- ✅ **Module Management** - Manage course modules with publish controls
- ✅ **User Management** - View and manage user accounts and roles
- ✅ **Category Management** - Organize courses with categories
- ✅ **Enrollment Monitoring** - Track and manage student enrollments
- ✅ **Analytics** - View platform performance and course statistics

## 🛠️ Tech Stack

- **React 18.3.1** - UI library with hooks and modern features
- **TypeScript 5.6+** - Type safety and better DX
- **React Router v7.13.0** - Navigation and routing
- **Axios 1.7.9** - HTTP client with interceptors
- **Tailwind CSS v4.1.12** - Utility-first styling
- **Vite 6.3.5** - Fast build tool and dev server
- **Date-fns 4.1.0** - Date formatting and manipulation

## 🏗️ Architecture

### Directory Structure

```
learning-platform/
├── api/                          # API Client Modules
│   ├── index.ts                 # Axios instance + interceptors
│   ├── auth.ts                  # Authentication API
│   ├── learning.ts              # Learning API
│   ├── admin-courses.ts         # Admin course management
│   ├── admin-users.ts           # Admin user management
│   ├── admin-categories.ts      # Category management
│   ├── admin-enrollments.ts     # Enrollment management
│   ├── admin-analytics.ts       # Analytics API
│   ├── admin-domains.ts         # Domain management
│   ├── admin-paths.ts           # Learning path management
│   └── admin-modules.ts         # Module management
│
├── components/                   # React Components
│   ├── common/                  # Reusable UI
│   │   ├── ErrorBoundary.tsx   # Error catching
│   │   ├── LoadingSpinner.tsx  # Loading states
│   │   ├── AuthGuard.tsx       # Route protection
│   │   ├── Card.tsx            # Card wrapper
│   │   ├── Button.tsx          # Styled buttons
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   └── Pagination.tsx      # Pagination
│   │
│   ├── layout/                  # Layout Components
│   │   ├── Header.tsx          # App header
│   │   ├── AdminLayout.tsx     # Admin wrapper
│   │   └── AdminSidebar.tsx    # Admin navigation
│   │
│   └── admin/                   # Admin Components
│       ├── StatsCard.tsx       # Dashboard stats
│       ├── RecentEnrollmentsTable.tsx
│       ├── PopularCoursesChart.tsx
│       └── CourseForm.tsx      # Course editor
│
├── pages/                        # Page Components
│   ├── public/                  # Public Pages
│   │   ├── HomePage.tsx        # Landing
│   │   ├── LoginPage.tsx       # Login
│   │   ├── RegisterPage.tsx    # Registration
│   │   ├── CatalogPage.tsx     # Course catalog
│   │   └── CourseDetailPage.tsx
│   │
│   ├── protected/               # Protected Pages
│   │   ├── MyLearningPage.tsx  # Enrollments
│   │   ├── LessonViewPage.tsx  # Lesson viewer
│   │   ├── ProfilePage.tsx     # User profile
│   │   ├── SettingsPage.tsx    # Settings
│   │   └── CertificatesPage.tsx
│   │
│   └── admin/                   # Admin Pages
│       ├── AdminDashboardPage.tsx
│       ├── AdminCoursesPage.tsx
│       ├── AdminCourseEditPage.tsx
│       ├── AdminUsersPage.tsx
│       ├── AdminCategoriesPage.tsx
│       ├── AdminEnrollmentsPage.tsx
│       ├── AdminAnalyticsPage.tsx
│       ├── AdminDomainsPage.tsx
│       ├── AdminPathsPage.tsx
│       └── AdminModulesPage.tsx
│
├── store/                        # State Management
│   └── auth-context.tsx         # Auth context
│
├── hooks/                        # Custom Hooks
│   └── useAuth.ts              # Auth hook
│
├── types/                        # TypeScript Types
│   └── index.ts                # All type definitions
│
├── constants/                    # Constants
│   └── index.ts                # API URL, routes
│
├── utils/                        # Utilities
│   └── storage.ts              # Token storage
│
└── index.tsx                     # Entry Point
```

## 🚀 Installation

### Prerequisites
- Node.js 18+ and npm
- Backend API running on `http://localhost:3001`
- Environment variables configured

### Setup Steps

```bash
# Install dependencies (if not already done)
npm install

# Configure environment
echo "VITE_API_URL=http://localhost:3001/api" > .env

# Start development server
npm run dev
```

### Backend Setup
The module requires the NestJS backend from `AI-PrivacyLearning-main/backend`:

```bash
cd AI-PrivacyLearning-main/backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed  # Optional: seed demo data
npm run start:dev
```

## 💡 Usage

### Adding New Pages

```tsx
// 1. Create page component
// src/modules/learning-platform/pages/MyNewPage.tsx
export default function MyNewPage() {
  return <div>My New Page</div>;
}

// 2. Add route in index.tsx
const MyNewPage = lazy(() => import('./pages/MyNewPage'));

<Route path="/my-new-page" element={
  <Suspense fallback={<LoadingSpinner fullScreen />}>
    <MyNewPage />
  </Suspense>
} />
```

### Using Authentication

```tsx
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.name}!</p>
      ) : (
        <button onClick={() => login('user@example.com', 'password')}>
          Login
        </button>
      )}
    </div>
  );
}
```

### Protected Routes

```tsx
import AuthGuard from './components/common/AuthGuard';
import { UserRole } from './types';

// Require authentication
<Route path="/profile" element={
  <AuthGuard>
    <ProfilePage />
  </AuthGuard>
} />

// Require specific role
<Route path="/admin/*" element={
  <AuthGuard requiredRoles={[UserRole.ADMIN]}>
    <AdminDashboardPage />
  </AuthGuard>
} />
```

### Making API Calls

```tsx
import { learningApi } from './api/learning';

async function enrollInCourse(courseId: string) {
  try {
    const enrollment = await learningApi.enroll(courseId);
    console.log('Enrolled:', enrollment);
  } catch (error) {
    console.error('Enrollment failed:', error);
  }
}
```

## 🔌 API Integration

### Base Configuration

```typescript
// API client automatically injects JWT token from localStorage
import apiClient from './api';

// All requests include Authorization header if token exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Available API Modules

1. **authApi** (`api/auth.ts`)
   - `login(email, password)` - User authentication
   - `register(data)` - User registration
   - `getProfile()` - Get current user
   - `updateProfile(data)` - Update user profile

2. **learningApi** (`api/learning.ts`)
   - `getCourses(params)` - Browse catalog
   - `getCourseBySlug(slug)` - Course details
   - `enroll(courseId)` - Enroll in course
   - `getMyEnrollments()` - User enrollments
   - `markLessonComplete(lessonId)` - Track progress
   - `getCertificate(courseId)` - Get certificate

3. **adminCoursesApi** (`api/admin-courses.ts`)
   - `getCourses(params)` - List all courses
   - `getCourse(id)` - Get course details
   - `createCourse(data)` - Create new course
   - `updateCourse(id, data)` - Update course
   - `deleteCourse(id)` - Delete course
   - `publishCourse(id)` - Publish course
   - `unpublishCourse(id)` - Unpublish course

4. **adminUsersApi** (`api/admin-users.ts`)
   - `getUsers(params)` - List users
   - `getUser(id)` - Get user details
   - `updateUserRole(id, role)` - Change user role
   - `deleteUser(id)` - Delete user

5. **adminCategoriesApi** (`api/admin-categories.ts`)
   - `getCategories()` - List categories
   - `createCategory(data)` - Create category
   - `updateCategory(id, data)` - Update category
   - `deleteCategory(id)` - Delete category

6. **adminEnrollmentsApi** (`api/admin-enrollments.ts`)
   - `getEnrollments(params)` - List enrollments
   - `updateEnrollmentStatus(id, status)` - Update status
   - `deleteEnrollment(id)` - Remove enrollment

7. **adminAnalyticsApi** (`api/admin-analytics.ts`)
   - `getOverview()` - Dashboard stats
   - `getCourseStats(courseId)` - Course analytics
   - `getUserStats()` - User statistics

8. **adminDomainsApi** (`api/admin-domains.ts`)
   - `getDomains()` - List domains
   - `createDomain(data)` - Create domain
   - `updateDomain(id, data)` - Update domain
   - `deleteDomain(id)` - Delete domain

9. **adminPathsApi** (`api/admin-paths.ts`)
   - `getPaths(params)` - List learning paths
   - `createPath(data)` - Create path
   - `updatePath(id, data)` - Update path
   - `deletePath(id)` - Delete path

10. **adminModulesApi** (`api/admin-modules.ts`)
    - `getModules(params)` - List modules
    - `getModule(id)` - Get module details
    - `createModule(data)` - Create module
    - `updateModule(id, data)` - Update module
    - `deleteModule(id)` - Delete module
    - `publishModule(id)` - Publish module
    - `unpublishModule(id)` - Unpublish module

## 🧩 Components

### Layout Components

**Header** (`components/layout/Header.tsx`)
- Main navigation bar
- User menu with logout
- Authentication state handling
- Links: Home, Catalog, My Learning, Profile, Admin

**AdminLayout** (`components/layout/AdminLayout.tsx`)
- Wrapper for admin pages
- Includes AdminSidebar
- Content area for page content

**AdminSidebar** (`components/layout/AdminSidebar.tsx`)
- Admin navigation menu
- 4 sections: Overview, Content Management, User Management, Analytics
- Active route highlighting
- Back to platform link

### Common Components

**ErrorBoundary** (`components/common/ErrorBoundary.tsx`)
- Catches JavaScript errors in component tree
- Displays fallback UI with error message
- Shows error stack in development
- Try Again and Go Home buttons
- Usage: Wrap routes or components

**LoadingSpinner** (`components/common/LoadingSpinner.tsx`)
- Props: `size` (small | medium | large), `fullScreen`, `message`, `className`
- Multiple size options
- Full-screen overlay mode
- Optional loading message
- Usage: Suspense fallback, async operations

**AuthGuard** (`components/common/AuthGuard.tsx`)
- Protects routes requiring authentication
- Supports role-based access control
- Redirects to login if not authenticated
- Props: `children`, `requiredRoles?: UserRole[]`

**Card** (`components/common/Card.tsx`)
- Reusable card container
- Props: `children`, `className?`, `onClick?`
- Consistent styling and spacing

**Button** (`components/common/Button.tsx`)
- Styled button component
- Variants: primary, secondary, danger
- Sizes: small, medium, large
- Props: `variant`, `size`, `disabled`, `loading`, `onClick`, `children`

**Pagination** (`components/common/Pagination.tsx`)
- Page navigation controls
- Props: `currentPage`, `totalPages`, `onPageChange`
- Shows page numbers with ellipsis for long ranges

### Admin Components

**StatsCard** (`components/admin/StatsCard.tsx`)
- Dashboard statistics display
- Props: `title`, `value`, `icon`, `trend?`, `trendValue?`
- Shows metric with optional trend indicator

**RecentEnrollmentsTable** (`components/admin/RecentEnrollmentsTable.tsx`)
- Recent enrollments list
- Shows user, course, date, status
- Quick view of latest activity

**PopularCoursesChart** (`components/admin/PopularCoursesChart.tsx`)
- Visual chart of popular courses
- Shows enrollment counts
- Helps identify trending content

**CourseForm** (`components/admin/CourseForm.tsx`)
- Course creation/editing form
- Props: `initialData?`, `onSubmit`, `onCancel`
- Fields: title, slug, description, category, price, thumbnail, etc.
- Client-side validation

## 🛣️ Routing

### Public Routes (No Authentication)
- `/` - HomePage
- `/login` - LoginPage
- `/register` - RegisterPage
- `/catalog` - CatalogPage
- `/courses/:slug` - CourseDetailPage

### Protected Routes (Authentication Required)
- `/my-learning` - MyLearningPage (enrolled courses)
- `/lessons/:id` - LessonViewPage (lesson content)
- `/profile` - ProfilePage (user profile)
- `/settings` - SettingsPage (account settings)
- `/certificates` - CertificatesPage (earned certificates)

### Admin Routes (Admin Role Required)
- `/admin` - AdminDashboardPage
- `/admin/courses` - AdminCoursesPage
- `/admin/courses/:id/edit` - AdminCourseEditPage
- `/admin/users` - AdminUsersPage
- `/admin/categories` - AdminCategoriesPage
- `/admin/enrollments` - AdminEnrollmentsPage
- `/admin/analytics` - AdminAnalyticsPage
- `/admin/domains` - AdminDomainsPage
- `/admin/paths` - AdminPathsPage
- `/admin/modules` - AdminModulesPage

### Performance Optimizations
- **Lazy Loading**: 11 routes lazy-loaded with React.lazy
- **Eager Loading**: HomePage, LoginPage, RegisterPage (critical paths)
- **Code Splitting**: Automatic chunk splitting per route
- **Suspense**: Loading spinner fallback during chunk loading

## 🔄 State Management

### AuthContext

The `AuthContext` provides global authentication state:

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

// Usage
const { user, login, logout, isAuthenticated } = useAuth();
```

### Local State Patterns

Most components use local state with `useState` for:
- Form inputs
- Loading states
- Error messages
- Pagination

Example:
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [courses, setCourses] = useState<Course[]>([]);
```

## 🛠️ Development

### Code Organization
- **Pages**: One file per page, focused on layout
- **Components**: Small, reusable, single responsibility
- **API**: One file per domain, grouped endpoints
- **Types**: Centralized in `types/index.ts`
- **Constants**: API URLs, routes, enums in `constants/index.ts`

### Best Practices
- ✅ Use TypeScript for type safety
- ✅ Validate forms before submission
- ✅ Handle errors gracefully with try-catch
- ✅ Show loading states during async operations
- ✅ Use AuthGuard for protected routes
- ✅ Lazy load non-critical routes
- ✅ Keep components small and focused
- ✅ Extract reusable logic to custom hooks

### Performance Tips
- Lazy load images with `loading="lazy"`
- Debounce search inputs
- Paginate large lists
- Use React.memo for expensive components
- Keep bundle size small with code splitting

## 📦 Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables

Set `VITE_API_URL` to production backend:

```env
VITE_API_URL=https://api.production.com/api
```

### Backend Requirements
- NestJS backend must be deployed
- Database (PostgreSQL) accessible
- CORS configured for frontend domain
- JWT secret configured

## 🐛 Troubleshooting

Common issues and solutions:

**401 Unauthorized Errors**
- Check if token is stored in localStorage
- Verify token hasn't expired
- Try logging out and logging back in

**404 Not Found**
- Verify API_URL is correct in .env
- Check backend is running
- Confirm route exists in backend

**CORS Errors**
- Backend must allow frontend origin
- Check CORS configuration in NestJS

**Build Errors**
- Run `npm install` to ensure dependencies
- Check TypeScript errors with `npm run build`
- Verify all imports are correct

## 📚 Additional Documentation

- [Migration Plan](../LEARNING_PLATFORM_MIGRATION_PLAN.md) - Complete migration roadmap
- [API Documentation](./API_DOCUMENTATION.md) - Detailed API reference
- [Component Guide](./COMPONENT_GUIDE.md) - Component usage examples
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Detailed troubleshooting

## 📝 License

This module is part of the DPDP project.

## 🤝 Contributing

When contributing:
1. Follow existing code structure
2. Add TypeScript types for new features
3. Update README with new components/pages
4. Test authentication flows
5. Ensure admin features require admin role

---

**Migration Status**: 90% Complete | **Last Updated**: Phase 11 - Testing & Documentation
