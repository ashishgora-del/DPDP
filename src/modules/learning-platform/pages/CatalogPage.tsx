import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi } from '../lib/api';
import { getErrorMessage } from '../lib/helpers';
import Header from '../components/layout/Header';
import ErrorMessage from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BookOpen, Clock, Target, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface LearningPath {
  id: string;
  slug: string;
  title: string;
  description: string;
  targetRole: string;
  estimatedHours: number;
  domain: {
    name: string;
    slug: string;
  };
  courses: any[];
}

const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadPaths = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await catalogApi.getPaths();
        setPaths(response.data as any);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadPaths();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

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
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md border border-white/20 rounded-full mb-4 shadow-lg">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Expert-Led Courses</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">Course Catalog</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explore our comprehensive learning paths and courses
          </p>
        </motion.div>

        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => window.location.reload()}
            className="mb-6"
          />
        )}

        {/* Learning Paths Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.map((path, index) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => navigate(`/learning-platform/paths/${path.slug}`)}
              className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-md">
                    {path.targetRole}
                  </span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-full">
                    <Target className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">{path.domain.name}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {path.title}
                </h3>
                <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">
                  {path.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">{path.courses.length} courses</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-lg">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-gray-700">{path.estimatedHours}h</span>
                    </div>
                  </div>
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md group-hover:shadow-lg"
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {paths.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg"
          >
            <p className="text-gray-500 text-lg">No learning paths available yet. Check back soon!</p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default CatalogPage;
