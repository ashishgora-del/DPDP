import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  showLabel = true,
  size = 'medium',
  className = ''
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const heightClasses = {
    small: 'h-1',
    medium: 'h-2',
    large: 'h-3'
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">
            {current} of {total} completed
          </span>
          <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className="bg-primary-600 h-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
