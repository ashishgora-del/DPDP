import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TooltipStep {
  id: string;
  title: string;
  description: string;
  position: { top?: string; bottom?: string; left?: string; right?: string };
}

const tooltipSteps: TooltipStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Compliance Journey! 🎯',
    description: 'Let\'s walk through how to navigate your DPDP compliance platform. Follow the steps to get started.',
    position: { top: '20%', left: '50%' }
  },
  {
    id: 'hero',
    title: 'Start Your Journey',
    description: 'Begin with "Start Compliance Journey" to assess your current state, or explore features to learn more.',
    position: { top: '35%', left: '50%' }
  },
  {
    id: 'modules',
    title: 'Four Simple Modules',
    description: 'Work through these modules in sequence for complete DPDP compliance. Each step builds on the previous.',
    position: { top: '55%', left: '50%' }
  }
];

export function OnboardingTooltip() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-show tooltip on first visit
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (hasSeenOnboarding) {
      setIsVisible(false);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tooltipSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const currentTooltip = tooltipSteps[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Tooltip */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-50 w-96 bg-white rounded-2xl shadow-2xl p-6"
            style={{
              ...currentTooltip.position,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>

            {/* Content */}
            <div className="mb-6">
              <h3 className="text-slate-900 mb-2 pr-8">{currentTooltip.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {currentTooltip.description}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {tooltipSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
              >
                Skip Tour
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-shadow font-medium flex items-center justify-center gap-2"
              >
                {currentStep < tooltipSteps.length - 1 ? (
                  <>
                    Next <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  'Get Started'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
