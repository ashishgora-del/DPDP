import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Enrollment } from '../../types';
import { formatDate, getInitials } from '../../lib/helpers';

interface RecentEnrollmentsTableProps {
  enrollments: Enrollment[];
  isLoading?: boolean;
}

const RecentEnrollmentsTable: React.FC<RecentEnrollmentsTableProps> = ({
  enrollments,
  isLoading = false
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Enrollments</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Enrollments</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No enrollments yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Recent Enrollments</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enrolled
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {enrollments.map(enrollment => (
              <tr
                key={enrollment.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/learning-platform/admin/enrollments/${enrollment.id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {enrollment.user?.avatarUrl ? (
                      <img
                        src={enrollment.user.avatarUrl}
                        alt={enrollment.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-700">
                          {getInitials(enrollment.user?.name || 'U')}
                        </span>
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {enrollment.user?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">{enrollment.user?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{enrollment.course?.title}</div>
                  <div className="text-sm text-gray-500">
                    {enrollment.course?.category?.name || 'No category'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-900">{enrollment.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {enrollment.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  ) : enrollment.status === 'ACTIVE' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Dropped
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(enrollment.enrolledAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => navigate('/learning-platform/admin/enrollments')}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View all enrollments →
        </button>
      </div>
    </div>
  );
};

export default RecentEnrollmentsTable;
