import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAnalyticsApi, learningApi } from '../lib/api';
import { Course, Enrollment, UserRole } from '../types';
import { useAuth } from '../../../shared/auth';
import { getErrorMessage } from '../lib/helpers';
import { hasRole } from '../lib/auth';
import AdminLayout from '../components/layout/AdminLayout';
import AuthGuard from '../components/common/AuthGuard';
import StatsCard from '../components/admin/StatsCard';
import RecentEnrollmentsTable from '../components/admin/RecentEnrollmentsTable';
import PopularCoursesChart from '../components/admin/PopularCoursesChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  totalRevenue: number;
  coursesTrend?: number;
  studentsTrend?: number;
  enrollmentsTrend?: number;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    totalRevenue: 0
  });
  const [recentEnrollments, setRecentEnrollments] = useState<Enrollment[]>([]);
  const [popularCourses, setPopularCourses] = useState<Array<Course & { enrollmentCount: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Check if user has admin access
  const isAdmin = user && (hasRole(user.role as any, [UserRole.ADMIN]) || hasRole(user.role as any, [UserRole.INSTRUCTOR]));

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError('');

      try {
        // Load dashboard stats
        const statsResponse = await adminAnalyticsApi.getDashboardStats();
        const apiStats = statsResponse.data;
        
        // Calculate derived stats from enrollments
        const activeEnrollments = apiStats.recentEnrollments.filter(e => e.status === 'ACTIVE').length;
        const completedEnrollments = apiStats.recentEnrollments.filter(e => e.status === 'COMPLETED').length;
        
        setStats({
          totalCourses: apiStats.totalCourses,
          totalStudents: apiStats.totalUsers,
          totalEnrollments: apiStats.totalEnrollments,
          activeEnrollments: activeEnrollments,
          completedEnrollments: completedEnrollments,
          totalRevenue: apiStats.totalRevenue
        });

        // Set recent enrollments from API response
        setRecentEnrollments(apiStats.recentEnrollments.slice(0, 10));

        // Set popular courses from API response
        setPopularCourses(apiStats.popularCourses);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access the admin dashboard.</p>
          <button
            onClick={() => navigate('/learning-platform')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your learning platform</p>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => window.location.reload()}
            className="mb-6"
          />
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Courses"
                value={stats.totalCourses}
                icon={
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                }
                color="blue"
                trend={
                  stats.coursesTrend
                    ? { value: stats.coursesTrend, isPositive: stats.coursesTrend > 0 }
                    : undefined
                }
              />

              <StatsCard
                title="Total Students"
                value={stats.totalStudents}
                icon={
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                }
                color="green"
                trend={
                  stats.studentsTrend
                    ? { value: stats.studentsTrend, isPositive: stats.studentsTrend > 0 }
                    : undefined
                }
              />

              <StatsCard
                title="Active Enrollments"
                value={stats.activeEnrollments}
                icon={
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                color="yellow"
                trend={
                  stats.enrollmentsTrend
                    ? { value: stats.enrollmentsTrend, isPositive: stats.enrollmentsTrend > 0 }
                    : undefined
                }
              />

              <StatsCard
                title="Completed Courses"
                value={stats.completedEnrollments}
                icon={
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                color="purple"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => navigate('/learning-platform/admin/courses/new')}
                className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 hover:border-primary-500 group"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-primary-200">
                    <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Create Course</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/learning-platform/admin/courses')}
                className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Manage Courses</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/learning-platform/admin/users')}
                className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Manage Users</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/learning-platform/admin/analytics')}
                className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">View Analytics</span>
                </div>
              </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Enrollments - Takes 2 columns */}
              <div className="lg:col-span-2">
                <RecentEnrollmentsTable
                  enrollments={recentEnrollments}
                  isLoading={isLoading}
                />
              </div>

              {/* Popular Courses - Takes 1 column */}
              <div>
                <PopularCoursesChart courses={popularCourses} isLoading={isLoading} />
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
