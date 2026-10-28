import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthGuard from './components/common/AuthGuard';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';

// Eager load critical pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CourseDetailPage from './pages/CourseDetailPage';

// Lazy load secondary pages
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const PathDetailPage = lazy(() => import('./pages/PathDetailPage'));
const MyLearningPage = lazy(() => import('./pages/MyLearningPage'));
const LessonViewPage = lazy(() => import('./pages/LessonViewPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'));

// Lazy load all admin pages
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminCoursesPage = lazy(() => import('./pages/AdminCoursesPage'));
const AdminCourseEditPage = lazy(() => import('./pages/AdminCourseEditPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage'));
const AdminEnrollmentsPage = lazy(() => import('./pages/AdminEnrollmentsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));
const AdminDomainsPage = lazy(() => import('./pages/AdminDomainsPage'));
const AdminPathsPage = lazy(() => import('./pages/AdminPathsPage'));
const AdminModulesPage = lazy(() => import('./pages/AdminModulesPage'));

const LearningPlatformModule: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/paths/:slug" element={<PathDetailPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route
          path="/my-learning"
          element={
            <AuthGuard>
              <MyLearningPage />
            </AuthGuard>
          }
        />
        <Route
          path="/courses/:courseId/lessons/:lessonId"
          element={
            <AuthGuard>
              <LessonViewPage />
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <SettingsPage />
            </AuthGuard>
          }
        />
        <Route
          path="/certificates"
          element={
            <AuthGuard>
              <CertificatesPage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <AdminDashboardPage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <AuthGuard>
              <AdminCoursesPage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin/courses/:courseId/edit"
          element={
            <AuthGuard>
              <AdminCourseEditPage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AuthGuard>
              <AdminUsersPage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AuthGuard>
              <AdminCategoriesPage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin/enrollments"
          element={
            <AuthGuard>
              <AdminEnrollmentsPage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AuthGuard>
              <AdminAnalyticsPage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin/domains"
          element={
            <AuthGuard>
              <AdminDomainsPage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin/paths"
          element={
            <AuthGuard>
              <AdminPathsPage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin/modules"
          element={
            <AuthGuard>
              <AdminModulesPage />
            </AuthGuard>
          }
        />
        
        {/* Protected Routes - To be implemented */}
        {/*
        <Route path="/admin/*" element={
          <AuthGuard requiredRoles={[UserRole.ADMIN]}>
            <AdminRoutes />
          </AuthGuard>
        } />
        */}
          </Routes>
        </Suspense>
    </ErrorBoundary>
  );
};

export default LearningPlatformModule;
