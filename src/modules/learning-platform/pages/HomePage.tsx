import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/auth';
import Header from '../components/layout/Header';
import { motion } from 'motion/react';
import { BookOpen, Award, Users, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <div className="relative z-10">
      <Header />
      
      {/* Hero Section */}
      <section className="px-8 pt-20 pb-16">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full border border-white/60 shadow-lg mb-6"
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-slate-700">Interactive Learning Platform</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Master Data Privacy &
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
                Protection Compliance
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Access comprehensive courses on DPDP Act 2023, data protection best practices, and regulatory requirements. 
              Learn from industry experts at your own pace with interactive content and certifications.
            </p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/learning-platform/catalog')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow font-medium flex items-center gap-2 text-lg"
              >
                Browse Courses
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              {!isAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/learning-platform/register')}
                  className="px-8 py-4 bg-white/80 backdrop-blur-md text-slate-700 rounded-2xl border border-white/60 shadow-lg hover:bg-white transition-all font-medium text-lg"
                >
                  Get Started Free
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: BookOpen,
                title: 'Expert-Led Courses',
                description: 'Learn from industry professionals with real-world experience',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: Award,
                title: 'Get Certified',
                description: 'Earn recognized certifications upon course completion',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: Users,
                title: 'Community Support',
                description: 'Join thousands of learners and share knowledge',
                color: 'from-green-500 to-emerald-500'
              },
              {
                icon: TrendingUp,
                title: 'Track Progress',
                description: 'Monitor your learning journey with detailed analytics',
                color: 'from-orange-500 to-amber-500'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-white/60 backdrop-blur-md rounded-3xl p-12 border border-white/60 shadow-xl"
          >
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text mb-2">
                  50+
                </div>
                <div className="text-slate-600 font-medium">Expert-Led Courses</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text mb-2">
                  10,000+
                </div>
                <div className="text-slate-600 font-medium">Active Learners</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 text-transparent bg-clip-text mb-2">
                  95%
                </div>
                <div className="text-slate-600 font-medium">Completion Rate</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      </div>
    </div>
  );
};

export default HomePage;
