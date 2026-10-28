import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../../types';
import { formatCurrency } from '../../lib/helpers';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/learning-platform/courses/${course.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl">
            📚
          </div>
        )}
        {course.isPublished ? (
          <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
            Published
          </span>
        ) : (
          <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
            Draft
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {course.category && (
          <div className="mb-2">
            <span className="inline-block px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded">
              {course.category.name}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Instructor */}
        {course.instructor && (
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
              {course.instructor.name.charAt(0).toUpperCase()}
            </div>
            <span className="ml-2 text-sm text-gray-700">{course.instructor.name}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          {/* Price */}
          <div className="text-lg font-bold text-gray-900">
            {!course.price || course.price === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              formatCurrency(course.price, course.currency || 'USD')
            )}
          </div>

          {/* Enrollment count */}
          {course.enrollments && course.enrollments.length > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              {course.enrollments.length} enrolled
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
