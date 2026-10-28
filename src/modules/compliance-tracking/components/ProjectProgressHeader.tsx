import { Shield, FileText, ListChecks, CheckCircle, ArrowRight } from 'lucide-react';

interface ProjectProgressHeaderProps {
  project: {
    id: string;
    name: string;
  };
  assessment: {
    orgName: string;
    riskTier: 'BASIC' | 'MODERATE' | 'HIGH';
    q2_geography: string;
  };
  templateCount: number;
}

const TIER_STYLES = {
  BASIC: 'bg-green-100 text-green-800 border-green-200',
  MODERATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
};

/**
 * Progress Header Component
 * Shows project context and user journey progress
 */
export function ProjectProgressHeader({
  project,
  assessment,
  templateCount,
}: ProjectProgressHeaderProps) {
  const steps = [
    {
      label: 'Risk Assessment',
      completed: true,
      icon: Shield,
      color: 'text-blue-600',
    },
    {
      label: `Templates (${templateCount})`,
      completed: true,
      icon: FileText,
      color: 'text-green-600',
    },
    {
      label: 'Compliance Tracking',
      completed: false,
      active: true,
      icon: ListChecks,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-6 mb-6">
      {/* Project Info */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {project.name}
            </h1>
            <p className="text-gray-600">
              <span className="font-medium">Organization:</span>{' '}
              {assessment.orgName}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Geography:</span>{' '}
              {formatGeography(assessment.q2_geography)}
            </p>
          </div>
          <div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${
                TIER_STYLES[assessment.riskTier]
              }`}
            >
              {assessment.riskTier} Risk
            </span>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="border-t border-white/30 pt-6">
        <h3 className="text-sm font-bold text-gray-700 mb-5 uppercase tracking-wide">
          Your Compliance Journey
        </h3>
        <div className="flex items-center justify-between max-w-3xl">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center border-3 transition-all duration-300 shadow-lg ${
                    step.completed
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-500 shadow-blue-300'
                      : step.active
                      ? 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-500 shadow-orange-300 scale-110'
                      : 'bg-white/70 backdrop-blur-sm border-gray-300'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-7 w-7 text-white drop-shadow-sm" />
                  ) : (
                    <step.icon
                      className={`h-7 w-7 ${
                        step.active ? 'text-white drop-shadow-sm' : 'text-gray-400'
                      }`}
                    />
                  )}
                </div>
                <p
                  className={`text-sm font-bold mt-3 text-center ${
                    step.completed || step.active
                      ? 'text-gray-900'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex-1 h-1 bg-gray-200/60 backdrop-blur-sm rounded-full mx-4 -mt-6 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 shadow-md"
                    style={{
                      width: step.completed ? '100%' : '0%',
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to format geography string
 */
function formatGeography(geography: string): string {
  if (!geography) return 'Not specified';
  
  // Handle common formats
  if (geography.includes('single_state')) return 'Single State';
  if (geography.includes('multi_state')) return 'Multiple States';
  if (geography.includes('pan_india')) return 'Pan-India';
  if (geography.includes('international')) return 'International';
  
  // Fallback: capitalize and replace underscores
  return geography
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
