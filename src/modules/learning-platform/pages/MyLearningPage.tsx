import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { learningApi } from '../lib/api';
import { Enrollment, EnrollmentStatus } from '../types';
import { useAuth } from '../../../shared/auth';
import { getErrorMessage } from '../lib/helpers';
import Header from '../components/layout/Header';
import CourseProgressCard from '../components/enrollment/CourseProgressCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import { BookOpen, Clock, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const MyLearningPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | EnrollmentStatus>('all');

  useEffect(() => {
    const loadEnrollments = async () => {
      setIsLoading(true);
      setError('');

      try {
        const filters = filter !== 'all' ? { status: filter } : undefined;
        const response = await learningApi.getMyEnrollments(filters);
        setEnrollments(response.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadEnrollments();
  }, [filter]);

  const filteredEnrollments = enrollments;

  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === EnrollmentStatus.ACTIVE).length,
    completed: enrollments.filter(e => e.status === EnrollmentStatus.COMPLETED).length,
    dropped: enrollments.filter(e => e.status === EnrollmentStatus.DROPPED).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 -right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 -left-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">My Learning</h1>
          <p className="text-gray-600 text-lg">Track your progress and continue learning</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Courses</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-transparent bg-clip-text">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 text-transparent bg-clip-text">{stats.active}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-transparent bg-clip-text">{stats.completed}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <Award className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Certificates</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">{stats.completed}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-2"
        >
          <nav className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              All Courses ({stats.total})
            </button>
            <button
              onClick={() => setFilter(EnrollmentStatus.ACTIVE)}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                filter === EnrollmentStatus.ACTIVE
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              In Progress ({stats.active})
            </button>
            <button
              onClick={() => setFilter(EnrollmentStatus.COMPLETED)}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                filter === EnrollmentStatus.COMPLETED
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              Completed ({stats.completed})
            </button>
          </nav>
        </motion.div>

        {/* Content */}
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
        ) : filteredEnrollments.length === 0 ? (
          <EmptyState
            title="No courses found"
            description={
              filter === 'all'
                ? "You haven't enrolled in any courses yet. Browse the catalog to get started!"
                : `You don't have any ${filter.toLowerCase()} courses.`
            }
            icon={<span>📚</span>}
            action={{
              label: 'Browse Catalog',
              onClick: () => navigate('/learning-platform/catalog')
            }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            {filteredEnrollments.map((enrollment, index) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + (index * 0.1) }}
              >
                <CourseProgressCard enrollment={enrollment} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default MyLearningPage;
