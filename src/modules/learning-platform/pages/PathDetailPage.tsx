import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { catalogApi } from '../lib/api';
import { BookOpen, Clock, ChevronRight, Award, Users, Target, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: number;
  level: string;
  modules: ModuleDetail[];
}

interface ModuleDetail {
  id: string;
  title: string;
  estimatedMinutes: number;
}

interface PathDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  targetRole: string;
  estimatedHours: number;
  domain: {
    id: string;
    name: string;
    slug: string;
  };
  courses: CourseDetail[];
}

const PathDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [path, setPath] = useState<PathDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetchPath();
  }, [slug]);

  const fetchPath = async () => {
    try {
      const { data } = await catalogApi.getPathBySlug(slug!);
      setPath(data as any);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load path');
      console.error('Error fetching path:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading course path...</div>
        </div>
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Path Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'This course path does not exist.'}</p>
            <Link
              to="/learning-platform/catalog"
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              Back to Catalog
            </Link>
          </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-white/60 backdrop-blur-md border border-white/20 shadow-xl"
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
          
          <div className="relative z-10">
            <Link 
              to="/learning-platform/catalog" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Catalog</span>
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
              {path.title}
            </h1>
            <p className="text-gray-600 text-lg mb-8 max-w-3xl">{path.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-200/50"
              >
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Target className="w-5 h-5" />
                  <div className="text-xs font-medium uppercase tracking-wide">Domain</div>
                </div>
                <div className="font-bold text-gray-900">{path.domain.name}</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 border border-purple-200/50"
              >
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Users className="w-5 h-5" />
                  <div className="text-xs font-medium uppercase tracking-wide">Target Role</div>
                </div>
                <div className="font-bold text-gray-900">{path.targetRole}</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-2xl p-4 border border-pink-200/50"
              >
                <div className="flex items-center gap-2 text-pink-600 mb-2">
                  <Clock className="w-5 h-5" />
                  <div className="text-xs font-medium uppercase tracking-wide">Duration</div>
                </div>
                <div className="font-bold text-gray-900">{path.estimatedHours}h</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-blue-50 to-purple-100/50 rounded-2xl p-4 border border-blue-200/50"
              >
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <BookOpen className="w-5 h-5" />
                  <div className="text-xs font-medium uppercase tracking-wide">Courses</div>
                </div>
                <div className="font-bold text-gray-900">{path.courses.length}</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text">Courses in This Path</h2>
          </div>

          {path.courses.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center">
              <p className="text-gray-500">No courses available in this path yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {path.courses.map((course, index) => (
                <motion.div 
                  key={course.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xs font-semibold shadow-md">
                          {course.level}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{course.description}</p>

                      <div className="flex items-center flex-wrap gap-6 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-700">{course.duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
                          <BookOpen className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-gray-700">{course.modules.length} modules</span>
                        </div>
                      </div>

                      {course.modules.length > 0 && (
                        <details className="mb-4">
                          <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-2">
                            <ChevronRight className="w-4 h-4" />
                            View Modules ({course.modules.length})
                          </summary>
                          <div className="mt-3 pl-4 space-y-2 border-l-2 border-gradient-to-b from-blue-400 to-purple-400">
                            {course.modules.map((module) => (
                              <motion.div 
                                key={module.id} 
                                whileHover={{ x: 5 }}
                                className="text-sm bg-gray-50 rounded-lg p-3 hover:bg-blue-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-700">{module.title}</span>
                                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">{module.estimatedMinutes} min</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>

                    <Link
                      to={`/learning-platform/courses/${course.id}`}
                      className="ml-4 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex-shrink-0 group-hover:scale-110"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default PathDetailPage;
