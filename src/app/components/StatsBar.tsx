import { motion } from 'motion/react';
import { TrendingUp, Users, Clock, Target } from 'lucide-react';

interface Stat {
  label: string;
  value: string;
  icon: any;
  color: string;
}

export function StatsBar() {
  const stats: Stat[] = [
    {
      label: 'Organizations Assessed',
      value: '1,247+',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Documents Generated',
      value: '3,892+',
      icon: Target,
      color: 'text-green-600',
    },
    {
      label: 'Avg. Time Saved',
      value: '15 hrs',
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      label: 'Compliance Rate',
      value: '98%',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white/60 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradient(stat.color)} flex items-center justify-center`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 truncate">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function getGradient(color: string): string {
  const gradients: Record<string, string> = {
    'text-blue-600': 'from-blue-100 to-blue-200',
    'text-green-600': 'from-green-100 to-green-200',
    'text-orange-600': 'from-orange-100 to-orange-200',
    'text-purple-600': 'from-purple-100 to-purple-200',
  };
  return gradients[color] || 'from-gray-100 to-gray-200';
}
