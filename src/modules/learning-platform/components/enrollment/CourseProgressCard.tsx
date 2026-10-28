import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Enrollment } from '../../types';
import { formatDate, calculatePercentage } from '../../lib/helpers';
import ProgressBar from '../progress/ProgressBar';

interface CourseProgressCardProps {
  enrollment: Enrollment;
}

const CourseProgressCard: React.FC<CourseProgressCardProps> = ({ enrollment }) => {
  const navigate = useNavigate();
  const course = enrollment.course;

  if (!course) return null;

  const totalLessons = course.modules?.reduce(
    (acc, module) => acc + (module.lessons?.length || 0),
    0
  ) || 0;

  const completedLessons = Math.round((enrollment.progress / 100) * totalLessons);

  const handleContinue = () => {
    // Find first incomplete lesson or first lesson
    if (course.modules && course.modules[0]?.lessons?.[0]) {
      navigate(
        `/learning-platform/courses/${course.id}/lessons/${course.modules[0].lessons[0].id}`
      );
    }
  };

  const handleViewCourse = () => {
    navigate(`/learning-platform/courses/${course.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="md:flex">
        {/* Thumbnail */}
        <div className="md:w-1/3">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-48 md:h-full object-cover"
            />
          ) : (
            <div className="w-full h-48 md:h-full bg-gray-200 flex items-center justify-center text-gray-400 text-5xl">
              📚
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 md:w-2/3">
          {/* Status Badge */}
          <div className="mb-3">
            {enrollment.status === 'COMPLETED' ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Completed
              </span>
            ) : enrollment.status === 'DROPPED' ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Dropped
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                In Progress
              </span>
            )}
          </div>

          {/* Course Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>

          {/* Instructor */}
          {course.instructor && (
            <p className="text-sm text-gray-600 mb-4">by {course.instructor.name}</p>
          )}

          {/* Progress Bar */}
          <ProgressBar
            current={completedLessons}
            total={totalLessons}
            className="mb-4"
          />

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              {course.modules?.length || 0} modules
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              {totalLessons} lessons
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              Enrolled {formatDate(enrollment.enrolledAt)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {enrollment.status === 'COMPLETED' ? (
              <>
                <button
                  onClick={handleViewCourse}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  View Course
                </button>
                <button className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium">
                  View Certificate
                </button>
              </>
            ) : (
              <button
                onClick={handleContinue}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
              >
                Continue Learning
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseProgressCard;
