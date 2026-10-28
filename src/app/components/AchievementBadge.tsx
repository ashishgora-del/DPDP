import { motion, AnimatePresence } from 'motion/react';
import { Award, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Achievement {
  title: string;
  description: string;
  icon: string;
}

export function AchievementBadge() {
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievement] = useState<Achievement>({
    title: 'Welcome Aboard! 🎉',
    description: 'You\'ve taken the first step towards DPDP compliance',
    icon: '🏆'
  });

  useEffect(() => {
    // Show achievement after 2 seconds as a welcome gesture
    const timer = setTimeout(() => {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        setShowAchievement(true);
        localStorage.setItem('hasSeenWelcome', 'true');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showAchievement) {
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowAchievement(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showAchievement]);

  return (
    <AnimatePresence>
      {showAchievement && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className="fixed top-24 right-8 z-50 w-80"
        >
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-200/60 p-6 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-yellow-200/20 rounded-full blur-2xl" />
            
            <button
              onClick={() => setShowAchievement(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/60 hover:bg-white flex items-center justify-center transition-colors z-10"
            >
              <X className="w-4 h-4 text-amber-900" />
            </button>

            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-3">
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0 shadow-lg"
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 0.6,
                    repeat: 0
                  }}
                >
                  <Award className="w-7 h-7 text-white" />
                </motion.div>
                <div className="flex-1">
                  <h4 className="text-amber-900 mb-1">{achievement.title}</h4>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    {achievement.description}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-500"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
