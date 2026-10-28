import { motion } from 'motion/react';
import { Shield, FileText, ListChecks, GraduationCap, Sparkles, ArrowRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModuleCard } from './components/ModuleCard';
import { FloatingHelp } from './components/FloatingHelp';
import { OnboardingTooltip } from './components/OnboardingTooltip';
import { ProgressIndicator } from './components/ProgressIndicator';
import { AnimatedStats } from './components/AnimatedStats';
import { AchievementBadge } from './components/AchievementBadge';
import { StatsBar } from './components/StatsBar';
import { useAuth, LoginModal } from '../shared/auth';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const progressSteps = [
    { label: 'Risk Assessment', completed: false },
    { label: 'Template Generation', completed: false },
    { label: 'Compliance Tracker', completed: false },
    { label: 'E-Learning', completed: false }
  ];

  const modules = [
    {
      title: 'Risk Assessment',
      description: 'Identify and evaluate data protection risks with our AI-powered assessment tool. Get actionable insights in minutes.',
      icon: Shield,
      color: 'text-blue-600',
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      step: 1,
      route: '/risk-assessment'
    },
    {
      title: 'Template Generation',
      description: 'Auto-generate DPDP-compliant policies, consent forms, and notices tailored to your organization\'s needs.',
      icon: FileText,
      color: 'text-green-600',
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-500',
      step: 2,
      route: '/template-generation'
    },
    {
      title: 'Compliance Tracker',
      description: 'Monitor your compliance status in real-time with visual dashboards and automated alerts for deadlines.',
      icon: ListChecks,
      color: 'text-orange-600',
      gradient: 'bg-gradient-to-br from-orange-500 to-amber-500',
      step: 3,
      route: '/compliance-tracking'
    },
    {
      title: 'E-Learning',
      description: 'Train your team with interactive courses and certifications on DPDP Act 2023 compliance fundamentals.',
      icon: GraduationCap,
      color: 'text-purple-600',
      gradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
      step: 4,
      route: '/learning-platform'
    }
  ];

  const handleModuleClick = (route: string, index: number) => {
    setCurrentStep(index);
    if (route) {
      navigate(route);
    }
  };

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

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-8 py-6 backdrop-blur-md bg-white/40 border-b border-white/60"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900 leading-none">DPDP Compliance</h1>
                <p className="text-xs text-slate-600">Simplifying Data Protection</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-slate-700 hover:text-slate-900 transition-colors font-medium">
                Resources
              </button>
              <button
                onClick={() => navigate('/projects')}
                className="px-4 py-2 text-slate-700 hover:text-blue-700 transition-colors font-medium"
              >
                My Projects
              </button>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-700">
                    Welcome, <span className="font-semibold">{user.name}</span>
                  </span>
                  <button 
                    onClick={logout}
                    className="px-4 py-2 flex items-center gap-2 bg-white/80 backdrop-blur-sm text-slate-700 rounded-xl hover:bg-white transition-colors border border-white/60 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-6 py-2.5 bg-white/80 backdrop-blur-sm text-slate-700 rounded-xl hover:bg-white transition-colors border border-white/60 font-medium"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </motion.header>

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
                <span className="text-sm font-medium text-slate-700">DPDP Act 2023 Compliant</span>
              </motion.div>

              {/* Headline */}
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Your Journey to
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
                  Complete Compliance
                </span>
              </h1>

              {/* Subtext */}
              <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
                Navigate India's Digital Personal Data Protection Act with confidence. 
                Our platform guides you through every step—from risk assessment to team training—
                in a simple, visual journey designed for everyone.
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
                  onClick={() => navigate('/risk-assessment')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow font-medium flex items-center gap-2 text-lg"
                >
                  Start Compliance Journey
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/projects')}
                  className="px-8 py-4 bg-white/60 backdrop-blur-md text-slate-700 rounded-2xl border border-white/60 hover:bg-white transition-colors font-medium text-lg flex items-center gap-2"
                >
                  My Projects
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Progress Indicator */}
        <section className="px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <ProgressIndicator steps={progressSteps} currentStep={currentStep} />
          </div>
        </section>

        {/* Journey Section Header */}
        <section className="px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-slate-900 mb-3">Your Compliance Roadmap</h2>
              <p className="text-slate-600 max-w-2xl mx-auto mb-12">
                Follow these four modules in sequence to achieve complete DPDP compliance. 
                Each step is designed to be simple, guided, and accessible for all skill levels.
              </p>
            </motion.div>
            <StatsBar />
          </div>
        </section>

        {/* Modules Grid */}
        <section className="px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modules.map((module, index) => (
                <ModuleCard
                  key={index}
                  {...module}
                  delay={0.8 + index * 0.1}
                  onClick={() => handleModuleClick(module.route, index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Features Strip */}
        <section className="px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="bg-white/60 backdrop-blur-xl rounded-3xl p-10 border border-white/60 shadow-2xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-slate-900 mb-2">Non-Technical Friendly</h3>
                  <p className="text-sm text-slate-600">
                    Designed for business users with zero legal or technical background
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-slate-900 mb-2">AI-Powered Speed</h3>
                  <p className="text-sm text-slate-600">
                    Generate compliance documents and assessments in minutes, not weeks
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h3 className="text-slate-900 mb-2">Always Up-to-Date</h3>
                  <p className="text-sm text-slate-600">
                    Automatically updated with latest DPDP regulations and best practices
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-8 py-8 backdrop-blur-md bg-white/40 border-t border-white/60">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-slate-600">
              © 2026 DPDP Compliance Platform. Built for India's Digital Future.
            </p>
          </div>
        </footer>
      </div>

      {/* Floating Components */}
      <FloatingHelp />
      <OnboardingTooltip />
      <AchievementBadge />
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          // Optional: show success message or redirect
          console.log('Login successful!');
        }}
      />
    </div>
  );
}
