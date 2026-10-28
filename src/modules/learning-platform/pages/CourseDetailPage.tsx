import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { catalogApi, learningApi } from '../lib/api';
import { useAuth } from '../../../shared/auth';
import Header from '../components/layout/Header';
import { BookOpen, Clock, ChevronRight, Award, Target, CheckCircle2, ArrowLeft, Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModuleDetail {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  isPublished: boolean;
  isFree: boolean;
  orderIndex: number;
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: string;
  isFree: boolean;
  isPublic: boolean;
  learningOutcomes?: string[];
  modules: ModuleDetail[];
}

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCourse();
    if (user) {
      checkEnrollmentStatus();
    }
  }, [id, user]);

  const fetchCourse = async () => {
    try {
      const { data } = await catalogApi.getCourseById(id!);
      setCourse(data as any);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load course');
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    if (!id || !user) return;
    try {
      const { data } = await learningApi.getMyEnrollments();
      console.log('My enrollments:', data);
      console.log('Current course ID:', id);
      const enrolled = data.some((enrollment: any) => {
        console.log('Checking enrollment courseId:', enrollment.courseId, 'against', id);
        return enrollment.courseId === id;
      });
      console.log('Is enrolled:', enrolled);
      setIsEnrolled(enrolled);
    } catch (err) {
      console.error('Error checking enrollment:', err);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/learning-platform/login');
      return;
    }

    if (isEnrolled) {
      navigate('/learning-platform/my-learning');
      return;
    }

    setEnrolling(true);
    try {
      await learningApi.enroll(id!);
      setIsEnrolled(true);
      navigate('/learning-platform/my-learning');
    } catch (err: any) {
      console.error('Enrollment error:', err);
      alert(err.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading course...</div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'This course does not exist.'}</p>
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
                {course.title}
              </h1>
              <p className="text-gray-600 text-lg mb-8 max-w-3xl">{course.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-200/50"
                >
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Target className="w-5 h-5" />
                    <div className="text-xs font-medium uppercase tracking-wide">Level</div>
                  </div>
                  <div className="font-bold text-gray-900">{course.level}</div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 border border-purple-200/50"
                >
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <div className="text-xs font-medium uppercase tracking-wide">Duration</div>
                  </div>
                  <div className="font-bold text-gray-900">{course.duration} min</div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-2xl p-4 border border-pink-200/50"
                >
                  <div className="flex items-center gap-2 text-pink-600 mb-2">
                    <BookOpen className="w-5 h-5" />
                    <div className="text-xs font-medium uppercase tracking-wide">Modules</div>
                  </div>
                  <div className="font-bold text-gray-900">{course.modules.length}</div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-4 border border-green-200/50"
                >
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    {course.isFree ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    <div className="text-xs font-medium uppercase tracking-wide">Access</div>
                  </div>
                  <div className="font-bold text-gray-900">{course.isFree ? 'Free' : 'Premium'}</div>
                </motion.div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEnroll}
                disabled={enrolling || isEnrolled}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
              >
                {enrolling ? 'Enrolling...' : isEnrolled ? '✓ Already Enrolled' : user ? 'Enroll Now' : 'Sign in to Enroll'}
              </motion.button>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Course Details */}
            <div className="md:col-span-2">
              {/* Learning Outcomes */}
              {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-6 mb-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Award className="w-6 h-6 text-purple-600" />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text">What You'll Learn</h2>
                  </div>
                  <ul className="space-y-3">
                    {course.learningOutcomes.map((outcome, idx) => (
                      <motion.li 
                        key={idx} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3 group"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center mt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{outcome}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Modules */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text">Course Modules</h2>
                </div>

                {course.modules.length === 0 ? (
                  <p className="text-gray-500">No modules available in this course yet.</p>
                ) : (
                  <div className="space-y-3">
                    {course.modules.map((module, idx) => (
                      <motion.div 
                        key={module.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                        className="border border-gray-200/50 bg-white/40 rounded-xl p-4 hover:bg-white/60 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                                <span className="text-sm font-bold text-white">{idx + 1}</span>
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{module.title}</h3>
                                {module.description && (
                                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-3 ml-13 text-sm">
                              <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-lg">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-gray-700">{module.estimatedMinutes} min</span>
                              </div>
                              {!module.isFree && (
                                <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-lg">
                                  <Lock className="w-4 h-4 text-yellow-600" />
                                  <span className="font-medium text-yellow-700">Premium</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 ml-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="md:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-6 sticky top-24"
              >
                <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text mb-6">Course Info</h3>

                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Target className="w-4 h-4" />
                      <div className="text-xs font-medium uppercase tracking-wide">Course Level</div>
                    </div>
                    <div className="text-gray-900 font-bold">{course.level}</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50">
                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                      <Clock className="w-4 h-4" />
                      <div className="text-xs font-medium uppercase tracking-wide">Total Duration</div>
                    </div>
                    <div className="text-gray-900 font-bold">{course.duration} minutes</div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-4 border border-pink-200/50">
                    <div className="flex items-center gap-2 text-pink-600 mb-2">
                      <BookOpen className="w-4 h-4" />
                      <div className="text-xs font-medium uppercase tracking-wide">Number of Modules</div>
                    </div>
                    <div className="text-gray-900 font-bold">{course.modules.length}</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      {course.isFree ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <div className="text-xs font-medium uppercase tracking-wide">Access Type</div>
                    </div>
                    <div className="text-gray-900 font-bold">
                      {course.isFree ? 'Free Access' : 'Premium'}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEnroll}
                  disabled={enrolling || isEnrolled}
                  className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                >
                  {enrolling ? 'Enrolling...' : isEnrolled ? '✓ Already Enrolled' : user ? 'Enroll Now' : 'Sign in to Enroll'}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
