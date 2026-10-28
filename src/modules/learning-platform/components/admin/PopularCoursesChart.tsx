import React from 'react';
import { Course } from '../../types';

interface PopularCoursesChartProps {
  courses: Array<Course & { enrollmentCount: number }>;
  isLoading?: boolean;
}

const PopularCoursesChart: React.FC<PopularCoursesChartProps> = ({
  courses,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Courses</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-6 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Courses</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No courses available</p>
        </div>
      </div>
    );
  }

  const maxEnrollments = Math.max(...courses.map(c => c.enrollmentCount));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Popular Courses</h3>
        <span className="text-sm text-gray-500">Top 5 by enrollments</span>
      </div>
      <div className="space-y-4">
        {courses.slice(0, 5).map((course, index) => {
          const percentage = maxEnrollments > 0 ? (course.enrollmentCount / maxEnrollments) * 100 : 0;
          
          return (
            <div key={course.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold mr-3">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {course.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {course.instructor?.name || 'Unknown Instructor'}
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex items-center">
                  <svg className="w-4 h-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-900">
                    {course.enrollmentCount}
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${percentage}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Enrollments:</span>
          <span className="font-bold text-gray-900">
            {courses.reduce((sum, course) => sum + course.enrollmentCount, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PopularCoursesChart;
