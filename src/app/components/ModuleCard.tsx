import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  delay: number;
  step: number;
  onClick?: () => void;
}

export function ModuleCard({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  gradient, 
  delay,
  step,
  onClick 
}: ModuleCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${title} module - Step ${step}`}
      className="relative cursor-pointer group focus:outline-none focus:ring-4 focus:ring-purple-300 rounded-3xl"
    >
      {/* Glass card with backdrop blur */}
      <div className={`relative h-full rounded-3xl p-8 backdrop-blur-xl bg-white/60 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden`}>
        {/* Gradient overlay on hover */}
        <motion.div
          className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${gradient}`}
          initial={false}
          animate={{ opacity: isHovered ? 0.1 : 0 }}
        />
        
        {/* Step indicator */}
        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <span className={`font-semibold ${color}`}>{step}</span>
        </div>

        {/* Icon container */}
        <motion.div
          className={`w-16 h-16 rounded-2xl ${gradient} flex items-center justify-center mb-6 shadow-lg`}
          animate={{ 
            rotate: isHovered ? [0, -5, 5, 0] : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>

        {/* Content */}
        <h3 className={`text-xl mb-3 ${color}`}>{title}</h3>
        <p className="text-slate-600 leading-relaxed mb-6">{description}</p>

        {/* CTA Button */}
        <motion.button
          className={`px-6 py-2.5 rounded-full ${gradient} text-white shadow-md hover:shadow-lg transition-shadow font-medium`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Module
        </motion.button>

        {/* Decorative corner element */}
        <div className={`absolute bottom-0 right-0 w-24 h-24 ${gradient} opacity-5 rounded-tl-full`} />
      </div>
    </motion.div>
  );
}