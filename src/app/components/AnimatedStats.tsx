import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface StatProps {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  delay: number;
}

function AnimatedStat({ label, value, suffix = '', color, delay }: StatProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const increment = value / 50;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, 30);
      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="text-center"
    >
      <div className={`text-4xl font-bold mb-2 ${color}`}>
        {count}{suffix}
      </div>
      <div className="text-sm text-slate-600">{label}</div>
    </motion.div>
  );
}

export function AnimatedStats() {
  return (
    <div className="grid grid-cols-3 gap-8 mb-12">
      <AnimatedStat
        label="Organizations Trust Us"
        value={500}
        suffix="+"
        color="text-blue-600"
        delay={0.2}
      />
      <AnimatedStat
        label="Compliance Score Avg"
        value={95}
        suffix="%"
        color="text-green-600"
        delay={0.4}
      />
      <AnimatedStat
        label="Hours Saved Monthly"
        value={40}
        suffix="+"
        color="text-purple-600"
        delay={0.6}
      />
    </div>
  );
}
