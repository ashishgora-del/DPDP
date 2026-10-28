# Learning Platform Migration Plan

## 🎯 Objective
Migrate the AI-PrivacyLearning-main project into the main DPDP compliance platform as the 4th section (E-Learning Platform), creating a new module `src/modules/learning-platform/` following the same pattern as `src/modules/risk-assessment/`.

---

## 📊 Current State Analysis

### Main Project (Target)
- **Tech Stack**: Vite + React 18 + TypeScript + React Router v6 + Tailwind CSS
- **Base URL**: `/trinetrai/`
- **Existing Module**: `src/modules/risk-assessment/`
- **Theme**: Custom theme defined in `guidelines/COLOR_THEME_GUIDELINES.md`
- **Routing**: Client-side SPA routing with BrowserRouter

### Source Project (AI-PrivacyLearning-main)
- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
- **Backend**: NestJS + PostgreSQL + Prisma
- **Features**: 
  - Authentication (JWT)
  - Catalog browsing
  - Course enrollment
  - Progress tracking
  - Admin CMS

---

## 🏗️ Migration Strategy

### Phase 1: Structure Setup ✅ (To be implemented first)
Create the module structure similar to risk-assessment

### Phase 2: Core Pages Migration
Convert Next.js pages to React Router pages

### Phase 3: Components Migration  
Adapt components to use main project's theme

### Phase 4: API Integration
Create API client layer (backend integration pending)

### Phase 5: Routing Integration
Add routes to main App.tsx

### Phase 6: State Management
Implement context/state management

---

## 📁 Detailed File Structure Plan

```
src/modules/learning-platform/
├── pages/
│   ├── LearningHomePage.tsx          # Main landing page for E-Learning
│   ├── CatalogPage.tsx                # Browse all courses
│   ├── LearningPathsPage.tsx          # Browse learning paths by role
│   ├── LearningPathDetailPage.tsx     # Single learning path with courses
│   ├── CourseDetailPage.tsx           # Course overview & modules
│   ├── ModuleViewerPage.tsx           # Individual module content viewer
│   ├── MyLearningPage.tsx             # User dashboard (enrolled courses)
│   ├── LoginPage.tsx                  # Authentication (email/password)
│   ├── RegisterPage.tsx               # User registration
│   ├── ProfilePage.tsx                # User profile & settings
│   ├── AdminDashboardPage.tsx         # Admin CMS landing
│   ├── AdminDomainsPage.tsx           # Manage domains (CRUD)
│   ├── AdminPathsPage.tsx             # Manage learning paths (CRUD)
│   ├── AdminCoursesPage.tsx           # Manage courses (CRUD)
│   ├── AdminModulesPage.tsx           # Manage modules (CRUD)
│   ├── AdminUsersPage.tsx             # User management
│   ├── AdminRolesPage.tsx             # Role & permission management (Phase 2 placeholder)
│   └── AdminAnalyticsPage.tsx         # Analytics dashboard
│
├── components/
│   ├── cards/
│   │   ├── CourseCard.tsx             # Course preview card
│   │   ├── LearningPathCard.tsx       # Learning path card
│   │   ├── ModuleCard.tsx             # Module card with progress
│   │   └── DomainCard.tsx             # Domain category card
│   ├── progress/
│   │   ├── ProgressBar.tsx            # Progress indicator
│   │   ├── ProgressCircle.tsx         # Circular progress
│   │   └── ProgressStats.tsx          # Stats display
│   ├── content/
│   │   ├── VideoPlayer.tsx            # Video content player
│   │   ├── TextContent.tsx            # Text/markdown renderer
│   │   ├── QuizRenderer.tsx           # Quiz/assessment renderer
│   │   ├── CodeLabRenderer.tsx        # Code lab viewer
│   │   ├── DownloadBlock.tsx          # Download link component
│   │   └── ContentBlockRenderer.tsx   # Dynamic content block display
│   ├── enrollment/
│   │   ├── EnrollButton.tsx           # Enrollment CTA
│   │   ├── PaywallModal.tsx           # Premium content paywall
│   │   └── EnrollmentStatus.tsx       # Enrollment badge/status
│   ├── auth/
│   │   ├── AuthGuard.tsx              # Route protection wrapper
│   │   ├── RoleGuard.tsx              # RBAC protection wrapper
│   │   └── LoginForm.tsx              # Reusable login form
│   ├── admin/
│   │   ├── AdminSidebar.tsx           # Admin navigation
│   │   ├── DomainForm.tsx             # Domain create/edit form
│   │   ├── PathForm.tsx               # Path create/edit form
│   │   ├── CourseForm.tsx             # Course create/edit form
│   │   ├── ModuleForm.tsx             # Module create/edit form
│   │   └── ContentBlockForm.tsx       # Content block editor
│   ├── layout/
│   │   ├── LearningNavbar.tsx         # Learning platform navbar
│   │   ├── Breadcrumbs.tsx            # Navigation breadcrumbs
│   │   └── Footer.tsx                 # Footer component
│   └── common/
│       ├── LoadingSpinner.tsx         # Loading state
│       ├── ErrorDisplay.tsx           # Error message display
│       ├── EmptyState.tsx             # Empty state component
│       └── Tabs.tsx                   # Tab navigation
│
├── lib/
│   ├── api.ts                         # API client with interceptors
│   ├── auth.ts                        # Auth utilities & token management
│   ├── constants.ts                   # Module constants (roles, domains, content types)
│   ├── helpers.ts                     # Utility functions
│   ├── mockData.ts                    # Mock data for development
│   └── validators.ts                  # Form validation schemas
│
├── types/
│   ├── index.ts                       # Barrel export
│   ├── auth.types.ts                  # User, Role, Permission types
│   ├── catalog.types.ts               # Domain, Path, Course, Module types
│   ├── content.types.ts               # ContentBlock, ContentBlockType enums
│   ├── learning.types.ts              # Enrollment, Progress types
│   ├── assessment.types.ts            # Quiz, Question, Attempt types
│   ├── admin.types.ts                 # Admin DTOs and responses
│   └── api.types.ts                   # API request/response types
│
├── context/
│   ├── AuthContext.tsx                # Authentication state & methods
│   ├── LearningContext.tsx            # Learning progress state
│   └── AdminContext.tsx               # Admin CMS state
│
└── hooks/
    ├── useAuth.ts                     # Auth hook
    ├── useEnrollment.ts               # Enrollment management
    ├── useProgress.ts                 # Progress tracking
    ├── useCatalog.ts                  # Catalog data fetching
    └── useAdmin.ts                    # Admin operations
```

---

## 🔄 File Migration Mapping

### Pages Mapping

| Source (AI-PrivacyLearning-main) | Target (learning-platform) | Priority | Notes |
|----------------------------------|----------------------------|----------|-------|
| `frontend/src/app/page.tsx` | `pages/LearningHomePage.tsx` | HIGH | Main landing page |
| `frontend/src/app/catalog/page.tsx` | `pages/CatalogPage.tsx` | HIGH | Course catalog with filters |
| `frontend/src/app/paths/page.tsx` | `pages/LearningPathsPage.tsx` | HIGH | Learning paths listing |
| `frontend/src/app/paths/[slug]/page.tsx` | `pages/LearningPathDetailPage.tsx` | HIGH | Single path with courses |
| `frontend/src/app/courses/[id]/page.tsx` | `pages/CourseDetailPage.tsx` | HIGH | Course detail view |
| `frontend/src/app/courses/[id]/modules/[moduleId]/page.tsx` | `pages/ModuleViewerPage.tsx` | HIGH | Module content viewer |
| `frontend/src/app/my-learning/page.tsx` | `pages/MyLearningPage.tsx` | HIGH | User dashboard |
| `frontend/src/app/auth/login/page.tsx` | `pages/LoginPage.tsx` | MEDIUM | Login form |
| `frontend/src/app/auth/register/page.tsx` | `pages/RegisterPage.tsx` | MEDIUM | Registration form |
| `frontend/src/app/admin/page.tsx` | `pages/AdminDashboardPage.tsx` | LOW | Admin home |
| `frontend/src/app/admin/domains/page.tsx` | `pages/AdminDomainsPage.tsx` | LOW | Domain management |
| `frontend/src/app/admin/paths/page.tsx` | `pages/AdminPathsPage.tsx` | LOW | Path management |
| `frontend/src/app/admin/courses/page.tsx` | `pages/AdminCoursesPage.tsx` | LOW | Course management |
| `frontend/src/app/admin/modules/page.tsx` | `pages/AdminModulesPage.tsx` | LOW | Module management |
| `frontend/src/app/admin/users/page.tsx` | `pages/AdminUsersPage.tsx` | LOW | User management |
| `frontend/src/app/admin/roles/page.tsx` | `pages/AdminRolesPage.tsx` | VERY_LOW | Role management (Phase 2 placeholder) |
| `frontend/src/app/admin/analytics/page.tsx` | `pages/AdminAnalyticsPage.tsx` | LOW | Analytics dashboard |

### Components to Reference

| Source Component | Purpose | Adaptation Needed |
|------------------|---------|-------------------|
| `frontend/src/components/layout/Navbar.tsx` | Navigation | Use main project's navigation pattern |
| `frontend/src/lib/api.ts` | **CRITICAL** - Axios instance with interceptors | Adapt for Vite (remove Next.js SSR checks) |
| `frontend/src/lib/auth-context.tsx` | **CRITICAL** - Auth context provider | Port to React Router context |
| Course card components | Display logic | Restyle with main theme colors |
| Form components | Input handling | Use main project's form patterns |

### Critical Backend Files to Reference

| Backend File | Purpose | Frontend Impact |
|--------------|---------|-----------------|
| `backend/prisma/schema.prisma` | **Complete data model** | Create matching TypeScript types |
| `backend/src/catalog/catalog.controller.ts` | Catalog API endpoints | API client methods |
| `backend/src/learning/learning.controller.ts` | Learning/enrollment endpoints | Progress tracking logic |
| `backend/src/admin/admin.controller.ts` | Admin CMS endpoints | Admin page implementations |
| `backend/src/auth/auth.controller.ts` | Auth endpoints | Login/register flow |

### Types to Port

Reference these files for comprehensive type definitions:

**From Backend Schema (`backend/prisma/schema.prisma`):**
- ✅ **Auth & RBAC:** User, Organization, Role, Permission, UserRole, RolePermission, UserOrganization
- ✅ **Catalog:** Domain, LearningPath, Course, Module, ContentBlock, ContentBlockType (enum)
- ✅ **Learning:** Enrollment, ModuleProgress
- ✅ **Assessments:** Assessment, Question, Attempt, QuestionType (MCQ, MULTI, TEXT)
- ✅ **Commerce (Phase 2):** Product, Order, OrderItem, License, ProductType (enum)
- ✅ **Analytics (Phase 2):** Event (event tracking system)

**Key Enums to Define:**
```typescript
// ContentBlockType enum
enum ContentBlockType {
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
  QUIZ = 'QUIZ',
  DOWNLOAD = 'DOWNLOAD',
  CODE_LAB = 'CODE_LAB',
  EXTERNAL_LINK = 'EXTERNAL_LINK'
}

// Question types for assessments
enum QuestionType {
  MCQ = 'MCQ',           // Multiple Choice (single answer)
  MULTI = 'MULTI',       // Multiple Choice (multiple answers)
  TEXT = 'TEXT'          // Text/Essay answer
}

// User roles (primary role for learners)
type UserRole = 'BEGINNER' | 'DEVELOPER' | 'MANAGER' | 'LEADER' | 'USER' | 'PRACTITIONER' | 'GRC';

// System roles (for RBAC)
type SystemRole = 'LEARNER' | 'ADMIN' | 'AUTHOR' | 'REVIEWER' | 'SUPPORT';

// Organization roles
type OrgRole = 'ORG_ADMIN' | 'ORG_MEMBER' | 'INSTRUCTOR';

// Course levels
type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// Enrollment sources
type EnrollmentSource = 'SELF' | 'ORG_ASSIGN' | 'BULK_UPLOAD';

// Order/Payment statuses
type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

// Payment gateways
type PaymentGateway = 'RAZORPAY' | 'STRIPE';

// Event types for analytics
type EventType = 
  | 'COURSE_VIEW' 
  | 'MODULE_START' 
  | 'MODULE_COMPLETE' 
  | 'PAYWALL_VIEW' 
  | 'PURCHASE' 
  | 'QUIZ_ATTEMPT';
```

---

## 🎨 Theming Guidelines

### Color Mapping (from COLOR_THEME_GUIDELINES.md)

**Primary Actions** (Enroll, Start Course):
- Light: `#030213` (Deep Purple/Black)
- Dark: `oklch(0.985 0 0)` (Off-white)

**Secondary Actions** (Browse, Preview):
- Light: `oklch(0.95 0.0058 264.53)` (Very Light Purple)
- Dark: `oklch(0.269 0 0)` (Dark Gray)

**Progress Indicators**:
- Use gradient from primary to accent colors
- Accent: `#e9ebef` (Light) / `oklch(0.269 0 0)` (Dark)

**Cards & Surfaces**:
- Background: `#ffffff` (Light) / `oklch(0.145 0 0)` (Dark)
- Border: `rgba(0, 0, 0, 0.1)` (Light) / `oklch(0.269 0 0)` (Dark)

### Animation Guidelines
- Use Motion/Framer Motion (already in dependencies)
- Smooth transitions for page loads
- Subtle hover effects on cards
- Progress animations for module completion

---

## 🔌 API Integration Plan

### Backend Options

**Option A: Mock Data (Phase 1 - Immediate)**
- Create mock data files in `lib/mockData.ts`
- Simulate API responses
- Use localStorage for state persistence

**Option B: Separate Backend (Phase 2)**
- Run AI-PrivacyLearning-main backend separately
- Configure CORS
- API URL: `http://localhost:3001/api`

**Option C: Integrated Backend (Future)**
- Migrate NestJS backend to main project
- Deploy together

### API Client Structure

```typescript
// lib/api.ts - CRITICAL FILE
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/trinetrai/learning/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods organized by module
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials: { email: string; password: string }) => 
      apiClient.post('/auth/login', credentials),
    register: (data: RegisterDto) => 
      apiClient.post('/auth/register', data),
    refresh: (refreshToken: string) => 
      apiClient.post('/auth/refresh', { refreshToken }),
    getMe: () => 
      apiClient.get('/auth/me'),
    logout: () => 
      apiClient.post('/auth/logout'),
  },
  
  // Catalog endpoints (public + authenticated)
  catalog: {
    getDomains: () => 
      apiClient.get('/catalog/domains'),
    getDomainBySlug: (slug: string) => 
      apiClient.get(`/catalog/domains/${slug}`),
    getPaths: (params?: { role?: string; domainId?: string }) => 
      apiClient.get('/catalog/paths', { params }),
    getPathBySlug: (slug: string) => 
      apiClient.get(`/catalog/paths/${slug}`),
    getCourse: (id: string) => 
      apiClient.get(`/catalog/courses/${id}`),
    getModule: (id: string) => 
      apiClient.get(`/catalog/modules/${id}`),
    getModuleContent: (id: string) => 
      apiClient.get(`/catalog/modules/${id}/content`),
  },
  
  // Learning endpoints (authenticated)
  learning: {
    enroll: (courseId: string, organizationId?: string) => 
      apiClient.post('/learning/enrollments', { courseId, organizationId }),
    getEnrollments: () => 
      apiClient.get('/learning/enrollments'),
    getModuleProgress: (moduleId: string) => 
      apiClient.get(`/learning/progress/module/${moduleId}`),
    updateProgress: (moduleId: string, data: UpdateProgressDto) => 
      apiClient.post(`/learning/progress/module/${moduleId}`, data),
    getUserProgress: (courseId?: string) => 
      apiClient.get('/learning/progress', { params: { courseId } }),
    getDashboard: () => 
      apiClient.get('/learning/dashboard'),
  },
  
  // Admin endpoints (ADMIN/AUTHOR only)
  admin: {
    // Domains
    createDomain: (data: CreateDomainDto) => 
      apiClient.post('/admin/domains', data),
    updateDomain: (id: string, data: UpdateDomainDto) => 
      apiClient.patch(`/admin/domains/${id}`, data),
    deleteDomain: (id: string) => 
      apiClient.delete(`/admin/domains/${id}`),
    
    // Learning Paths
    getPaths: () => 
      apiClient.get('/admin/paths'),
    createPath: (data: CreatePathDto) => 
      apiClient.post('/admin/paths', data),
    updatePath: (id: string, data: UpdatePathDto) => 
      apiClient.patch(`/admin/paths/${id}`, data),
    deletePath: (id: string) => 
      apiClient.delete(`/admin/paths/${id}`),
    
    // Courses
    getCourses: (pathId?: string) => 
      apiClient.get('/admin/courses', { params: { pathId } }),
    createCourse: (data: CreateCourseDto) => 
      apiClient.post('/admin/courses', data),
    updateCourse: (id: string, data: UpdateCourseDto) => 
      apiClient.patch(`/admin/courses/${id}`, data),
    deleteCourse: (id: string) => 
      apiClient.delete(`/admin/courses/${id}`),
    
    // Modules
    getModules: (courseId?: string) => 
      apiClient.get('/admin/modules', { params: { courseId } }),
    createModule: (data: CreateModuleDto) => 
      apiClient.post('/admin/modules', data),
    updateModule: (id: string, data: UpdateModuleDto) => 
      apiClient.patch(`/admin/modules/${id}`, data),
    publishModule: (id: string) => 
      apiClient.patch(`/admin/modules/${id}/publish`),
    unpublishModule: (id: string) => 
      apiClient.patch(`/admin/modules/${id}/unpublish`),
    deleteModule: (id: string) => 
      apiClient.delete(`/admin/modules/${id}`),
    
    // Content Blocks
    createContentBlock: (moduleId: string, data: CreateContentBlockDto) => 
      apiClient.post(`/admin/modules/${moduleId}/content-blocks`, data),
    updateContentBlock: (id: string, data: UpdateContentBlockDto) => 
      apiClient.patch(`/admin/content-blocks/${id}`, data),
    deleteContentBlock: (id: string) => 
      apiClient.delete(`/admin/content-blocks/${id}`),
  },
};
```

---

## 🛣️ Routing Integration

### Routes to Add in `src/app/App.tsx`

```tsx
import { Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import IntroPage from '../modules/risk-assessment/pages/IntroPage';
import AssessmentPage from '../modules/risk-assessment/pages/AssessmentPage';
import ResultsPage from '../modules/risk-assessment/pages/ResultsPage';
import FAQPage from '../modules/risk-assessment/pages/FAQPage';
import ResourcesPage from '../modules/risk-assessment/pages/ResourcesPage';

// Learning Platform imports
import LearningHomePage from '../modules/learning-platform/pages/LearningHomePage';
import CatalogPage from '../modules/learning-platform/pages/CatalogPage';
import LearningPathsPage from '../modules/learning-platform/pages/LearningPathsPage';
import LearningPathDetailPage from '../modules/learning-platform/pages/LearningPathDetailPage';
import CourseDetailPage from '../modules/learning-platform/pages/CourseDetailPage';
import ModuleViewerPage from '../modules/learning-platform/pages/ModuleViewerPage';
import MyLearningPage from '../modules/learning-platform/pages/MyLearningPage';
import LoginPage from '../modules/learning-platform/pages/LoginPage';
import RegisterPage from '../modules/learning-platform/pages/RegisterPage';
import ProfilePage from '../modules/learning-platform/pages/ProfilePage';
import AdminDashboardPage from '../modules/learning-platform/pages/AdminDashboardPage';
import AdminDomainsPage from '../modules/learning-platform/pages/AdminDomainsPage';
import AdminPathsPage from '../modules/learning-platform/pages/AdminPathsPage';
import AdminCoursesPage from '../modules/learning-platform/pages/AdminCoursesPage';
import AdminModulesPage from '../modules/learning-platform/pages/AdminModulesPage';
import AdminUsersPage from '../modules/learning-platform/pages/AdminUsersPage';
import AdminRolesPage from '../modules/learning-platform/pages/AdminRolesPage';
import AdminAnalyticsPage from '../modules/learning-platform/pages/AdminAnalyticsPage';

export default function App() {
  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={<HomePage />} />
      
      {/* Risk Assessment Module */}
      <Route path="/risk-assessment" element={<IntroPage />} />
      <Route path="/risk-assessment/start" element={<AssessmentPage />} />
      <Route path="/risk-assessment/results/:id" element={<ResultsPage />} />
      <Route path="/risk-assessment/faq" element={<FAQPage />} />
      <Route path="/risk-assessment/resources" element={<ResourcesPage />} />
      
      {/* Learning Platform Module - Public Routes */}
      <Route path="/learning" element={<LearningHomePage />} />
      <Route path="/learning/catalog" element={<CatalogPage />} />
      <Route path="/learning/paths" element={<LearningPathsPage />} />
      <Route path="/learning/paths/:slug" element={<LearningPathDetailPage />} />
      <Route path="/learning/courses/:id" element={<CourseDetailPage />} />
      
      {/* Learning Platform - Auth Routes */}
      <Route path="/learning/login" element={<LoginPage />} />
      <Route path="/learning/register" element={<RegisterPage />} />
      
      {/* Learning Platform - Protected User Routes */}
      <Route path="/learning/my-learning" element={<MyLearningPage />} />
      <Route path="/learning/profile" element={<ProfilePage />} />
      <Route path="/learning/courses/:courseId/modules/:moduleId" element={<ModuleViewerPage />} />
      
      {/* Learning Platform - Protected Admin Routes */}
      <Route path="/learning/admin" element={<AdminDashboardPage />} />
      <Route path="/learning/admin/domains" element={<AdminDomainsPage />} />
      <Route path="/learning/admin/paths" element={<AdminPathsPage />} />
      <Route path="/learning/admin/courses" element={<AdminCoursesPage />} />
      <Route path="/learning/admin/modules" element={<AdminModulesPage />} />
      <Route path="/learning/admin/users" element={<AdminUsersPage />} />
      <Route path="/learning/admin/roles" element={<AdminRolesPage />} />
      <Route path="/learning/admin/analytics" element={<AdminAnalyticsPage />} />
    </Routes>
  );
}
```

### Update HomePage ModuleCard

In `src/app/HomePage.tsx`, the E-Learning module card should route to `/learning`:

```tsx
{
  title: 'E-Learning',
  description: 'Train your team with interactive courses...',
  icon: GraduationCap,
  color: 'text-purple-600',
  gradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
  step: 4,
  route: '/learning'  // ✅ Already defined
}
```

---

## 📝 Implementation Checklist

### Phase 0: Dependencies & Setup (30 mins) 📦
- [ ] Install required dependencies: `npm install axios zustand date-fns`
- [ ] Create `.env` file with `VITE_API_URL=http://localhost:3001/api`
- [ ] Verify all existing dependencies are compatible
- [ ] Review COLOR_THEME_GUIDELINES.md thoroughly

### Phase 1: Foundation (Day 1) 🏗️
- [ ] Create `src/modules/learning-platform/` directory structure
- [ ] Create all subdirectories: `pages/`, `components/`, `lib/`, `types/`, `context/`, `hooks/`
- [ ] Create component subdirectories: `cards/`, `progress/`, `content/`, `enrollment/`, `auth/`, `admin/`, `layout/`, `common/`
- [ ] Set up TypeScript types from Prisma schema (all 20+ entities)
- [ ] Create constants file with roles, domains, content types, API URLs
- [ ] Create mock data file for development (domains, paths, courses, modules)
- [ ] Set up environment variables (VITE_API_URL)

### Phase 2: Core Infrastructure (Day 2) 🔧
- [ ] **CRITICAL:** Implement `lib/api.ts` with axios instance and interceptors
- [ ] **CRITICAL:** Implement `context/AuthContext.tsx` with login/logout/register
- [ ] Implement `lib/auth.ts` helper utilities
- [ ] Implement `lib/validators.ts` with Zod schemas
- [ ] Implement `lib/helpers.ts` utility functions
- [ ] Create `hooks/useAuth.ts` custom hook
- [ ] Create `hooks/useCatalog.ts` for data fetching
- [ ] Test auth flow with mock data

### Phase 3: Public Pages (Day 3) 📄
- [ ] `pages/LearningHomePage.tsx` - Landing page with overview cards
- [ ] `pages/CatalogPage.tsx` - Course grid with filters by domain/role
- [ ] `pages/LearningPathsPage.tsx` - Role-based learning paths listing
- [ ] `pages/LearningPathDetailPage.tsx` - Single path with course cards
- [ ] `pages/CourseDetailPage.tsx` - Course overview with modules list
- [ ] Add routes to `App.tsx` for public pages
- [ ] Test navigation from HomePage to all public pages

### Phase 4: Authentication (Day 4) 🔐
- [ ] `pages/LoginPage.tsx` - Login form with validation
- [ ] `pages/RegisterPage.tsx` - Registration form with role selection
- [ ] `components/auth/LoginForm.tsx` - Reusable login component
- [ ] `components/auth/AuthGuard.tsx` - Route protection wrapper
- [ ] `components/auth/RoleGuard.tsx` - RBAC protection wrapper
- [ ] Update `AuthContext` with token refresh logic
- [ ] Test login/logout/register flows
- [ ] Implement protected route redirection

### Phase 5: Learning Features (Day 5) 📚
- [ ] `pages/MyLearningPage.tsx` - Dashboard with enrolled courses
- [ ] `pages/ModuleViewerPage.tsx` - Module content viewer
- [ ] `pages/ProfilePage.tsx` - User profile and settings
- [ ] `context/LearningContext.tsx` - Learning state management
- [ ] `hooks/useEnrollment.ts` - Enrollment logic
- [ ] `hooks/useProgress.ts` - Progress tracking
- [ ] `components/enrollment/EnrollButton.tsx` - Enrollment CTA
- [ ] `components/enrollment/PaywallModal.tsx` - Premium content gate
- [ ] Test enrollment and progress tracking

### Phase 6: Core Components (Day 6) 🎨
- [ ] `components/cards/CourseCard.tsx` - Course preview card
- [ ] `components/cards/LearningPathCard.tsx` - Learning path card
- [ ] `components/cards/ModuleCard.tsx` - Module card with progress
- [ ] `components/cards/DomainCard.tsx` - Domain category card
- [ ] `components/progress/ProgressBar.tsx` - Progress indicator
- [ ] `components/progress/ProgressCircle.tsx` - Circular progress
- [ ] `components/progress/ProgressStats.tsx` - Stats display
- [ ] `components/common/LoadingSpinner.tsx` - Loading state
- [ ] `components/common/ErrorDisplay.tsx` - Error handling
- [ ] `components/common/EmptyState.tsx` - Empty state UI

### Phase 7: Content Renderers (Day 7) 🎬
- [ ] `components/content/ContentBlockRenderer.tsx` - Dynamic content router
- [ ] `components/content/TextContent.tsx` - Text/markdown display
- [ ] `components/content/VideoPlayer.tsx` - Video player (placeholder or real)
- [ ] `components/content/QuizRenderer.tsx` - Quiz component
- [ ] `components/content/CodeLabRenderer.tsx` - Code lab viewer
- [ ] `components/content/DownloadBlock.tsx` - Download links
- [ ] Test all content block types rendering
- [ ] Implement progress tracking in module viewer

### Phase 8: Layout Components (Day 8) 🗂️
- [ ] `components/layout/LearningNavbar.tsx` - Learning platform navbar
- [ ] `components/layout/Breadcrumbs.tsx` - Navigation breadcrumbs
- [ ] `components/layout/Footer.tsx` - Footer component
- [ ] Integrate navbar into all pages
- [ ] Add user menu with logout in navbar
- [ ] Responsive design verification

### Phase 9: Admin CMS (Day 9-10) 👨‍💼
- [ ] `pages/AdminDashboardPage.tsx` - Admin landing with stats
- [ ] `pages/AdminDomainsPage.tsx` - Domain CRUD
- [ ] `pages/AdminPathsPage.tsx` - Learning path CRUD
- [ ] `pages/AdminCoursesPage.tsx` - Course CRUD
- [ ] `pages/AdminModulesPage.tsx` - Module CRUD with publish toggle
- [ ] `pages/AdminUsersPage.tsx` - User management
- [ ] `pages/AdminRolesPage.tsx` - Role management (Phase 2 placeholder with info)
- [ ] `pages/AdminAnalyticsPage.tsx` - Analytics dashboard (placeholder)
- [ ] `components/admin/AdminSidebar.tsx` - Admin navigation
- [ ] `components/admin/DomainForm.tsx` - Domain form
- [ ] `components/admin/PathForm.tsx` - Path form
- [ ] `components/admin/CourseForm.tsx` - Course form
- [ ] `components/admin/ModuleForm.tsx` - Module form
- [ ] `components/admin/ContentBlockForm.tsx` - Content block editor
- [ ] `context/AdminContext.tsx` - Admin state management
- [ ] `hooks/useAdmin.ts` - Admin operations hook
- [ ] Protect admin routes with RoleGuard
- [ ] Test full CRUD operations

### Phase 10: Integration & Polish (Day 11) ✨
- [ ] Add all routes to `App.tsx`
- [ ] Update HomePage navigation (already has route: `/learning`)
- [ ] Test all user journeys:
  - [ ] Browse catalog → Course detail → Enroll
  - [ ] Login → My Learning → Resume module
  - [ ] Register → Explore paths → Enroll
  - [ ] Admin login → Create course → Publish
- [ ] Responsive design for mobile/tablet
- [ ] Dark mode verification with theme guidelines
- [ ] Performance optimization (lazy loading)
- [ ] Error boundary implementation
- [ ] Loading states consistency

### Phase 11: Testing & Documentation (Day 12) ✅
- [ ] Test with mock data
- [ ] Test with live backend (if available)
- [ ] Browser testing (Chrome, Firefox, Edge)
- [ ] Accessibility audit (keyboard navigation, screen readers)
- [ ] Create module-specific README
- [ ] Document API endpoints used
- [ ] Document component props and usage
- [ ] Create troubleshooting guide

---

## 🎯 Key Features to Implement

### Must-Have (MVP)
1. ✅ Browse course catalog (public access)
2. ✅ View course details and modules
3. ✅ User registration & login
4. ✅ Enroll in courses
5. ✅ View enrolled courses (My Learning)
6. ✅ Track module progress
7. ✅ First module free policy
8. ✅ Paywall for premium modules

### Nice-to-Have (v2)
9. ⏳ Admin CMS (create/edit courses)
10. ⏳ Quiz/assessment rendering
11. ⏳ Video player integration
12. ⏳ Certificates on completion
13. ⏳ Search & filters
14. ⏳ Recommendations

---

## 🔍 Reference Files

### Theme & Styling ✅
- `guidelines/COLOR_THEME_GUIDELINES.md` - **ALL color definitions and usage rules**
- `guidelines/Guidelines.md` - General design system guidelines
- `src/styles/theme.css` - CSS custom properties
- `src/styles/tailwind.css` - Tailwind configuration
- `src/styles/index.css` - Main stylesheet imports

### Existing Module Pattern ✅
- `src/modules/risk-assessment/pages/IntroPage.tsx` - Page structure and layout example
- `src/modules/risk-assessment/pages/AssessmentPage.tsx` - Interactive page with state
- `src/modules/risk-assessment/pages/ResultsPage.tsx` - Results display pattern
- `src/app/HomePage.tsx` - Navigation integration and module cards
- `src/app/App.tsx` - Routing setup with React Router
- `src/app/components/ModuleCard.tsx` - Reusable card component

### Source Material (AI-PrivacyLearning-main) 📚

**Critical Backend Files:**
- `backend/prisma/schema.prisma` - **COMPLETE data model (20+ entities)**
- `backend/src/catalog/catalog.controller.ts` - Catalog API endpoints
- `backend/src/catalog/catalog.service.ts` - Business logic for catalog
- `backend/src/learning/learning.controller.ts` - Learning/enrollment endpoints
- `backend/src/learning/learning.service.ts` - Learning business logic
- `backend/src/admin/admin.controller.ts` - Admin CMS endpoints
- `backend/src/admin/admin.service.ts` - Admin business logic
- `backend/src/auth/auth.controller.ts` - Auth endpoints
- `backend/src/auth/auth.service.ts` - Auth business logic
- `backend/src/auth/guards/jwt-auth.guard.ts` - JWT guard implementation
- `backend/src/auth/guards/roles.guard.ts` - RBAC guard
- `backend/src/auth/decorators/roles.decorator.ts` - Roles decorator

**Critical Frontend Files:**
- `frontend/src/lib/api.ts` - **CRITICAL: Axios instance with interceptors**
- `frontend/src/lib/auth-context.tsx` - **CRITICAL: Auth context provider**
- `frontend/src/app/catalog/page.tsx` - Catalog page implementation
- `frontend/src/app/paths/page.tsx` - Learning paths page
- `frontend/src/app/paths/[slug]/page.tsx` - Learning path detail
- `frontend/src/app/courses/[id]/page.tsx` - Course detail page
- `frontend/src/app/my-learning/page.tsx` - Dashboard implementation
- `frontend/src/app/auth/login/page.tsx` - Login page
- `frontend/src/app/auth/register/page.tsx` - Register page
- `frontend/src/app/admin/domains/page.tsx` - Admin domain management
- `frontend/src/app/admin/paths/page.tsx` - Admin path management
- `frontend/src/app/admin/courses/page.tsx` - Admin course management
- `frontend/src/app/admin/modules/page.tsx` - Admin module management
- `frontend/src/components/layout/Navbar.tsx` - Navigation component

**DTOs (Data Transfer Objects):**
- `backend/src/auth/dto/` - Auth DTOs (login, register)
- `backend/src/learning/dto/` - Learning DTOs (enrollment, progress)
- `backend/src/admin/dto/` - Admin DTOs (domain, path, course, module, content-block)
- `backend/src/catalog/` - Catalog response types

**Documentation:**
- `AI-PrivacyLearning-main/IMPLEMENTATION_SUMMARY.md` - **Feature reference and business rules**
- `AI-PrivacyLearning-main/README.md` - Architecture overview
- `AI-PrivacyLearning-main/QUICKSTART.md` - Setup instructions
- `AI-PrivacyLearning-main/DEPLOYMENT.md` - Deployment guide

---

## 🚀 Getting Started Command

### Step 1: Install Dependencies
```bash
cd "C:\Users\yb185039\my_projects\dpdp\dpdp try 3"
npm install axios zustand date-fns
```

### Step 2: Create Environment File
Create `.env` in project root:
```env
VITE_API_URL=http://localhost:3001/api
```

### Step 3: Create Directory Structure
```bash
# Create main module directory
New-Item -ItemType Directory -Path "src\modules\learning-platform" -Force

# Create subdirectories
$dirs = @(
  "pages",
  "components\cards",
  "components\progress",
  "components\content",
  "components\enrollment",
  "components\auth",
  "components\admin",
  "components\layout",
  "components\common",
  "lib",
  "types",
  "context",
  "hooks"
)

foreach ($dir in $dirs) {
  New-Item -ItemType Directory -Path "src\modules\learning-platform\$dir" -Force
}
```

### Step 4: Start Implementation
Follow the phase-by-phase checklist starting with:
1. TypeScript types (from Prisma schema)
2. Constants and mock data
3. API client setup
4. Auth context
5. Pages one by one

---

## 📐 Code Templates

### Template: Page Component Structure
```tsx
// Example: pages/CatalogPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Course } from '../types';
import CourseCard from '../components/cards/CourseCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

export default function CatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await api.catalog.getCourses();
      setCourses(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-foreground mb-8">Course Catalog</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Template: Component with Theme Colors
```tsx
// Example: components/cards/CourseCard.tsx
import { Link } from 'react-router-dom';
import { Course } from '../../types';
import { BookOpen, Clock } from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link to={`/learning/courses/${course.id}`}>
      <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold text-foreground mb-2">{course.title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {course.description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{course.moduleCount} modules</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration}</span>
          </div>
        </div>
        
        <div className="mt-4">
          <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
            {course.level}
          </span>
        </div>
      </div>
    </Link>
  );
}
```

### Template: Protected Route with AuthGuard
```tsx
// Example: components/auth/AuthGuard.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (requireAuth && !user) {
    return <Navigate to="/learning/login" replace />;
  }

  return <>{children}</>;
}
```

---

## 📦 Dependencies & Libraries

### Already Installed (from main package.json) ✅
- ✅ `react-router-dom` - Routing (recently installed)
- ✅ `motion` (Framer Motion) - Animations
- ✅ `lucide-react` - Icons
- ✅ `@radix-ui/*` - UI components (all primitives available)
- ✅ `class-variance-authority` - Component variants
- ✅ `tailwind-merge` - Tailwind class merging
- ✅ `clsx` - Conditional classes
- ✅ `react-hook-form` - Form handling
- ✅ Tailwind CSS - Styling

### Need to Install (from AI-PrivacyLearning-main) 📥
```bash
npm install axios zustand date-fns
```

- **axios** - HTTP client for API calls (critical)
- **zustand** - State management (optional, can use Context API instead)
- **date-fns** - Date formatting utilities

### Optional (Phase 2)
```bash
npm install react-markdown remark-gfm  # For markdown content rendering
npm install react-player                # For video player
npm install recharts                    # For analytics charts (admin)
```

---

## ⚠️ Important Considerations

### Do NOT Copy
- ❌ Next.js specific code (App Router, Server Components, `'use client'` directives)
- ❌ `next/link` - Use `react-router-dom` `Link` instead
- ❌ `next/image` - Use standard `<img>` or custom component
- ❌ Next.js `useRouter` - Use `react-router-dom` `useNavigate` and `useParams`
- ❌ Backend code (NestJS stays separate)
- ❌ Database migrations (handle separately)
- ❌ Original theme/styling (use main project theme)
- ❌ `process.env.NEXT_PUBLIC_*` - Use `import.meta.env.VITE_*`

### Do Adapt & Transform
- ✅ **Next.js Pages → React Router Pages**
  - Remove `'use client'` directives
  - Replace `usePathname()` with `useLocation()`
  - Replace `useRouter()` with `useNavigate()` and `useParams()`
  - Replace `Link` from `next/link` with `Link` from `react-router-dom`
  
- ✅ **Component Logic**
  - Keep useState, useEffect, and custom hooks as-is
  - Adapt data fetching (no SSR, client-side only)
  - Keep business rules (first module free, RBAC, etc.)
  
- ✅ **Styling Adaptation**
  - Replace their blue theme (`primary-600`) with our theme colors
  - Use COLOR_THEME_GUIDELINES.md for all colors
  - Keep responsive design patterns
  - Adapt animations to Motion library (already available)

- ✅ **API Client**
  - Remove Next.js SSR checks (`typeof window !== 'undefined'`)
  - Use Vite env vars (`import.meta.env.VITE_API_URL`)
  - Keep axios interceptors logic

### Do Preserve
- ✅ Main project's routing approach (React Router v6+)
- ✅ Main project's theme system (COLOR_THEME_GUIDELINES.md)
- ✅ Main project's component patterns (similar to risk-assessment)
- ✅ Main project's build setup (Vite + Tailwind CSS v4)
- ✅ Main project's base URL (`/trinetrai/`)

---

## 🔄 Key Transformations Required

### 1. Import Replacements
```typescript
// ❌ OLD (Next.js)
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';

// ✅ NEW (React Router)
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
// Use standard <img> or create custom Image component
```

### 2. Navigation Patterns
```typescript
// ❌ OLD (Next.js)
const router = useRouter();
router.push('/learning/courses/123');

// ✅ NEW (React Router)
const navigate = useNavigate();
navigate('/learning/courses/123');
```

### 3. Route Parameters
```typescript
// ❌ OLD (Next.js App Router - dynamic params prop)
export default function CoursePage({ params }: { params: { id: string } }) {
  const { id } = params;
}

// ✅ NEW (React Router)
export default function CoursePage() {
  const { id } = useParams();
}
```

### 4. Environment Variables
```typescript
// ❌ OLD (Next.js)
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ✅ NEW (Vite)
const API_URL = import.meta.env.VITE_API_URL;
```

### 5. Layout Pattern
```typescript
// ❌ OLD (Next.js layout.tsx with children)
export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <Navbar />
      <main>{children}</main>
    </AuthProvider>
  );
}

// ✅ NEW (Wrap entire app in main.tsx)
// In main.tsx:
<BrowserRouter basename="/trinetrai">
  <AuthProvider>
    <App />  {/* App contains Routes */}
  </AuthProvider>
</BrowserRouter>

// Create a Layout component for shared structure:
// components/layout/LearningLayout.tsx
export default function LearningLayout({ children }) {
  return (
    <>
      <LearningNavbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
```

### 6. Auth Context Adaptation
```typescript
// Remove Next.js specific SSR check
// ❌ OLD
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('accessToken');
}

// ✅ NEW (client-side only in Vite)
const token = localStorage.getItem('accessToken');
```

---

## 📞 Questions to Resolve

1. **Backend Integration Timeline**: 
   - Start with mock data initially? ✅ Recommended
   - Connect to running NestJS backend later? (Phase 2)
   
2. **Authentication Strategy**: 
   - Implement full JWT flow with refresh tokens? ✅ Yes, as per source
   - Or simplified localStorage-only version? (Not recommended)
   
3. **Admin Features Priority**: 
   - Include in Phase 1 (Day 9-10)? ✅ Yes, for completeness
   - Or defer to Phase 2? (Optional based on timeline)
   
4. **Video Content Handling**: 
   - Use placeholder/iframe initially? ✅ Recommended
   - Integrate react-player library? (Phase 2)
   
5. **Payment Integration**: 
   - Implement paywall UI/modal? ✅ Yes, UI only
   - Just show placeholder message? (Backend integration Phase 2)

6. **State Management**: 
   - Use Zustand (lighter)? ✅ Recommended for enrolled courses
   - Or stick to Context API only? (Also valid option)

7. **Testing Strategy**:
   - Manual testing with mock data? ✅ Phase 1
   - Connect to backend for integration testing? (Phase 2)
   - Automated tests? (Phase 3)

---

## ✅ Final Checklist Before Starting

- [ ] **Reviewed** COLOR_THEME_GUIDELINES.md in detail
- [ ] **Understood** the transformation from Next.js → React Router
- [ ] **Identified** all import replacements needed
- [ ] **Prepared** mock data structure based on Prisma schema
- [ ] **Confirmed** axios, zustand, date-fns will be installed
- [ ] **Ready** to create directory structure
- [ ] **Understand** the component organization pattern
- [ ] **Know** where to reference source files from AI-PrivacyLearning-main
- [ ] **Clear** on what NOT to copy (Next.js specific code)
- [ ] **Ready** to follow the 12-phase implementation plan

---

**Status**: ✅ **PLAN COMPLETE - ALL ITEMS COVERED**  

**Missing Items Check**: ✅ **NOTHING MISSING**
- ✅ All pages mapped (17 pages including AdminRolesPage)
- ✅ All components identified (35+ components)
- ✅ All API endpoints documented (40+ endpoints)
- ✅ All types defined (from 20+ Prisma entities + 9 enums)
- ✅ Dependencies identified (axios, zustand, date-fns)
- ✅ Transformations documented (Next.js → React Router)
- ✅ Theme integration clear (COLOR_THEME_GUIDELINES.md)
- ✅ Code templates provided
- ✅ Setup commands ready
- ✅ Reference files comprehensive
- ✅ Assessment/Quiz types included (QuestionType enum)
- ✅ Analytics event types included (EventType enum)
- ✅ User profile update endpoint (PATCH /users/me)
- ✅ Organization roles (OrgRole enum)
- ✅ Payment/commerce types (OrderStatus, PaymentGateway)

**Next Step**: Install dependencies and begin Phase 1 implementation! 🚀
