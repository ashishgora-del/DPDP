import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminCoursesApi } from '../lib/api';
import { Course, UserRole } from '../types';
import { useAuth } from '../../../shared/auth';
import { getErrorMessage } from '../lib/helpers';
import { hasRole } from '../lib/auth';
import Header from '../components/layout/Header';
import CourseForm, { CourseFormData } from '../components/admin/CourseForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const AdminCourseEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const isAdmin = user && (hasRole(user.role as any, [UserRole.ADMIN]) || hasRole(user.role as any, [UserRole.INSTRUCTOR]));
  const isNewCourse = courseId === 'new';

  useEffect(() => {
    if (isAdmin && !isNewCourse) {
      loadCourse();
    } else if (isNewCourse) {
      setIsLoading(false);
    }
  }, [isAdmin, courseId]);

  const loadCourse = async () => {
    if (!courseId) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await adminCoursesApi.getCourse(courseId);
      setCourse(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: CourseFormData) => {
    setSubmitError('');
    setSuccessMessage('');

    try {
      if (isNewCourse) {
        const response = await adminCoursesApi.createCourse(formData);
        setSuccessMessage('Course created successfully!');
        setTimeout(() => {
          navigate(`/learning-platform/admin/courses/${response.data.id}/edit`);
        }, 1500);
      } else if (courseId) {
        await adminCoursesApi.updateCourse(courseId, formData);
        setSuccessMessage('Course updated successfully!');
        await loadCourse();
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      throw err;
    }
  };

  const handleCancel = () => {
    navigate('/learning-platform/admin/courses');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">You don't have permission to manage courses.</p>
            <button
              onClick={() => navigate('/learning-platform')}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/learning-platform/admin/courses')}
            className="text-primary-600 hover:text-primary-700 font-medium mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Courses
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isNewCourse ? 'Create New Course' : 'Edit Course'}
          </h1>
          <p className="text-gray-600">
            {isNewCourse
              ? 'Fill in the details to create a new course'
              : 'Update course information and settings'}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={loadCourse}
            className="mb-6"
          />
        )}

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {submitError}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Form */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <CourseForm
              initialData={
                course
                  ? {
                      title: course.title,
                      description: course.description || '',
                      categoryId: course.categoryId || '',
                      price: course.price,
                      thumbnailUrl: course.thumbnailUrl || '',
                      isPublished: course.isPublished
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              submitLabel={isNewCourse ? 'Create Course' : 'Update Course'}
            />
          </div>
        )}

        {/* Additional Sections for Existing Courses */}
        {!isNewCourse && course && (
          <div className="mt-8 space-y-6">
            {/* Modules Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Course Modules</h2>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium text-sm">
                  Add Module
                </button>
              </div>
              <p className="text-gray-600 text-sm">
                Module management will be available in the next phase
              </p>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-200">
              <h2 className="text-xl font-bold text-red-900 mb-2">Danger Zone</h2>
              <p className="text-gray-600 mb-4 text-sm">
                Once you delete a course, there is no going back. Please be certain.
              </p>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">
                Delete Course
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCourseEditPage;
