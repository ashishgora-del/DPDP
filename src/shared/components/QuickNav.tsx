import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Shield, 
  FileText, 
  GraduationCap, 
  X,
  Home,
  FileCheck,
  ListChecks
} from 'lucide-react';

interface QuickNavItem {
  label: string;
  path: string;
  icon: any;
  color: string;
  gradient: string;
}

export function QuickNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navItems: QuickNavItem[] = [
    {
      label: 'Home',
      path: '/',
      icon: Home,
      color: 'text-gray-600',
      gradient: 'from-gray-500 to-slate-500',
    },
    {
      label: 'Risk Assessment',
      path: '/risk-assessment',
      icon: Shield,
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Template Generation',
      path: '/template-generation',
      icon: FileText,
      color: 'text-green-600',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      label: 'My Documents',
      path: '/template-generation/documents',
      icon: FileCheck,
      color: 'text-purple-600',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Learning Platform',
      path: '/learning-platform',
      icon: GraduationCap,
      color: 'text-orange-600',
      gradient: 'from-orange-500 to-amber-500',
    },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-purple-500/50 transition-shadow"
        aria-label="Quick Navigation"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Compass className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-24 right-6 z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-4 w-72"
            >
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Quick Navigation</h3>
                <p className="text-xs text-gray-500">Jump to any module</p>
              </div>

              <div className="space-y-2">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNavigate(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all group border border-transparent hover:border-gray-200"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}
                    >
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 flex-1 text-left">
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
