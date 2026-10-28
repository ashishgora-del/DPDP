import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

/**
 * Empty State Component for Compliance Tracking
 * Shows when there's no data or user needs to complete prerequisites
 */
export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-12 text-center">
      <div className="max-w-md mx-auto">
        {icon || (
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-6 py-3 bg-blue-600/90 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

/**
 * Error State Component
 * Shows when an error occurs with option to retry
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-50/70 backdrop-blur-md border border-red-200/50 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-red-900">{error}</p>
          <p className="text-sm text-red-700">Please try again</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-white/90 backdrop-blur-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-all shadow-md hover:shadow-lg"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
