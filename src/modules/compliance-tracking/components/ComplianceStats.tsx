import { useMemo } from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { CHECKLIST_ITEMS, CHECKLIST_CATEGORIES } from '../../../shared/lib/checklistData';

interface ComplianceStatsProps {
  checkedItems: Set<string>;
}

export function ComplianceStats({ checkedItems }: ComplianceStatsProps) {
  // Calculate overall stats
  const stats = useMemo(() => {
    const total = CHECKLIST_ITEMS.length;
    const completed = checkedItems.size;
    const percentage = Math.round((completed / total) * 100);

    // By priority
    const required = CHECKLIST_ITEMS.filter((item) => item.priority === 'required');
    const requiredCompleted = required.filter((item) => checkedItems.has(item.id)).length;

    const recommended = CHECKLIST_ITEMS.filter((item) => item.priority === 'recommended');
    const recommendedCompleted = recommended.filter((item) => checkedItems.has(item.id)).length;

    const sdfOnly = CHECKLIST_ITEMS.filter((item) => item.priority === 'sdf-only');
    const sdfOnlyCompleted = sdfOnly.filter((item) => checkedItems.has(item.id)).length;

    // By category
    const categoryStats = CHECKLIST_CATEGORIES.map((category) => {
      const items = CHECKLIST_ITEMS.filter((item) => item.category === category);
      const completedCount = items.filter((item) => checkedItems.has(item.id)).length;
      return {
        category,
        total: items.length,
        completed: completedCount,
        percentage: Math.round((completedCount / items.length) * 100),
      };
    });

    return {
      total,
      completed,
      percentage,
      required: { total: required.length, completed: requiredCompleted },
      recommended: { total: recommended.length, completed: recommendedCompleted },
      sdfOnly: { total: sdfOnly.length, completed: sdfOnlyCompleted },
      categoryStats,
    };
  }, [checkedItems]);

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8 space-y-8">
      {/* Overall Progress */}
      <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-xl p-6 border border-white/40 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900">Overall Progress</h3>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {stats.percentage}%
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200/60 backdrop-blur-sm rounded-full h-4 shadow-inner border border-gray-300/30">
          <div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500 shadow-lg"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-700 mt-3 font-medium">
          {stats.completed} of {stats.total} items completed
        </p>
      </div>

      {/* By Priority */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/40 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">By Priority</h3>
        <div className="space-y-3">
          <PriorityBar
            label="Required"
            completed={stats.required.completed}
            total={stats.required.total}
            color="red"
          />
          <PriorityBar
            label="Recommended"
            completed={stats.recommended.completed}
            total={stats.recommended.total}
            color="amber"
          />
          <PriorityBar
            label="SDF Only"
            completed={stats.sdfOnly.completed}
            total={stats.sdfOnly.total}
            color="purple"
          />
        </div>
      </div>

      {/* By Category */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/40 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">By Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.categoryStats.map((cat) => (
            <CategoryCard key={cat.category} {...cat} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Priority Progress Bar
 */
function PriorityBar({
  label,
  completed,
  total,
  color,
}: {
  label: string;
  completed: number;
  total: number;
  color: 'red' | 'amber' | 'purple';
}) {
  const percentage = Math.round((completed / total) * 100);

  const colorClasses = {
    red: 'from-red-500 to-red-600',
    amber: 'from-amber-500 to-amber-600',
    purple: 'from-purple-500 to-purple-600',
  };

  const bgClasses = {
    red: 'bg-red-50/50',
    amber: 'bg-amber-50/50',
    purple: 'bg-purple-50/50',
  };

  return (
    <div className={`p-3 rounded-lg ${bgClasses[color]} border border-white/30`}>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-bold text-gray-800">{label}</span>
        <span className="font-semibold text-gray-700 bg-white/60 px-2 py-0.5 rounded-full">
          {completed}/{total}
        </span>
      </div>
      <div className="w-full bg-white/60 backdrop-blur-sm rounded-full h-3 shadow-inner border border-gray-200/30">
        <div
          className={`bg-gradient-to-r ${colorClasses[color]} h-3 rounded-full transition-all duration-500 shadow-md`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Category Card
 */
function CategoryCard({
  category,
  total,
  completed,
  percentage,
}: {
  category: string;
  total: number;
  completed: number;
  percentage: number;
}) {
  const isComplete = completed === total;

  return (
    <div className="border-2 border-white/40 bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm rounded-xl p-5 flex flex-col shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-900 flex-1 leading-tight">{category}</h4>
        {isComplete ? (
          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 drop-shadow-sm" />
        ) : completed > 0 ? (
          <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 drop-shadow-sm" />
        ) : (
          <Circle className="h-6 w-6 text-gray-300 flex-shrink-0" />
        )}
      </div>
      <div className="mt-auto">
        <div className="flex items-center justify-between text-xs text-gray-700 mb-2 font-semibold">
          <span>
            {completed}/{total}
          </span>
          <span className="bg-white/70 px-2 py-0.5 rounded-full">{percentage}%</span>
        </div>
        <div className="w-full bg-white/60 backdrop-blur-sm rounded-full h-2 shadow-inner border border-gray-200/30">
          <div
            className={`h-2 rounded-full transition-all duration-500 shadow-md ${
              isComplete ? 'bg-gradient-to-r from-green-500 to-green-600' : completed > 0 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gray-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
