import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton';
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center space-y-3">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    {message && <p className="text-sm text-gray-600">{message}</p>}
  </div>
);

export const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
);

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  message,
  fullScreen = false,
}) => {
  const content = type === 'skeleton' ? <LoadingSkeleton /> : <LoadingSpinner message={message} />;

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{content}</div>;
};
