import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, CheckCircle, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';

export default function IntroPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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

      {/* Header */}
      <header className="bg-white/60 backdrop-blur-md shadow-sm border-b border-white/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text">DPDPA Risk Assessment</span>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/risk-assessment/resources')}
                className="text-sm text-gray-600 hover:text-blue-700 font-medium transition-colors"
              >
                Resources
              </button>
              <button
                onClick={() => navigate('/risk-assessment/faq')}
                className="text-sm text-gray-600 hover:text-blue-700 font-medium transition-colors"
              >
                FAQ
              </button>
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-gray-900">Understand Your DPDPA Compliance Risk in </span>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
                5 Minutes
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Get personalized guidance tailored to your organization's data processing profile.
              Complete a quick 10-question assessment and receive actionable compliance recommendations.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/risk-assessment/start')}
                className="inline-flex items-center px-8 py-4 text-base font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Start Risk Scoping
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-8 py-4 text-base font-bold rounded-xl text-blue-700 bg-white/80 backdrop-blur-md hover:bg-white transition-colors border-2 border-blue-600 shadow-lg"
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>

          {/* Risk Level Visual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-t-4 border-t-green-500"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-transparent bg-clip-text mb-2">BASIC</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Standard compliance requirements for low-risk data processing
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-t-4 border-t-amber-500"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
                <span className="text-2xl">!</span>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 text-transparent bg-clip-text mb-2">MODERATE</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Enhanced controls for medium-risk processing activities
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-t-4 border-t-red-500"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-md">
                  <AlertCircle className="h-7 w-7 text-white" />
                </div>
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 text-transparent bg-clip-text mb-2">HIGH</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Comprehensive safeguards for high-risk or sensitive data
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/40 backdrop-blur-sm py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 text-transparent bg-clip-text mb-12 text-center"
          >
            Why Use This Portal?
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-md">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                Proportional Guidance
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Get only the templates and guidance relevant to your risk level
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-md">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                Quick Assessment
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Complete in 5-10 minutes with clear, context-aware questions
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-md">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                Actionable Templates
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Download ready-to-use DPDPA compliance templates
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-md">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                SDF Detection
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Identify if you qualify as a Significant Data Fiduciary
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Assess Your DPDPA Compliance?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Answer 10 simple questions and get your personalized risk report
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/risk-assessment/start')}
            className="inline-flex items-center px-8 py-4 text-base font-bold rounded-xl text-blue-700 bg-white hover:bg-gray-50 transition-colors shadow-xl"
          >
            Start Assessment Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </motion.button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs">
            © 2026 DPDPA Risk Scoping Portal. This tool provides general guidance and does not constitute legal advice.
          </p>
          <p className="text-xs mt-2 text-gray-400">
            Consult a qualified data protection professional for specific compliance requirements.
          </p>
        </div>
      </footer>
    </div>
  );
}
