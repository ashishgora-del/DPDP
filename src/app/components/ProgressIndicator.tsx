import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  completed: boolean;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-16">
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute top-6 left-0 w-full h-1 bg-gradient-to-r from-slate-200 via-slate-200 to-slate-200 rounded-full" />
        
        {/* Progress bar fill */}
        <motion.div
          className="absolute top-6 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              {/* Step circle */}
              <motion.div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative z-10 ${
                  index <= currentStep
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                    : 'bg-white border-2 border-slate-200'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                {step.completed ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <span className={`font-semibold ${index <= currentStep ? 'text-white' : 'text-slate-400'}`}>
                    {index + 1}
                  </span>
                )}
              </motion.div>

              {/* Step label */}
              <motion.p
                className={`mt-3 text-sm font-medium text-center max-w-24 ${
                  index <= currentStep ? 'text-slate-900' : 'text-slate-400'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                {step.label}
              </motion.p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
