import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { catalogApi, learningApi } from '../lib/api';
import { Course, Lesson, Module, Progress } from '../types';
import { useAuth } from '../../../shared/auth';
import { getErrorMessage, formatDuration } from '../lib/helpers';
import Header from '../components/layout/Header';
import AuthGuard from '../components/common/AuthGuard';
import ContentRenderer from '../components/content/ContentRenderer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const LessonViewPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load course and lesson data
  useEffect(() => {
    const loadData = async () => {
      if (!courseId || !lessonId) return;

      setIsLoading(true);
      setError('');

      try {
        // Load course with modules and lessons
        const courseResponse = await catalogApi.getCourseById(courseId);
        setCourse(courseResponse.data);

        // Find current lesson
        let foundLesson: Lesson | null = null;
        for (const module of courseResponse.data.modules || []) {
          const lesson = module.lessons?.find((l: any) => l.id === lessonId);
          if (lesson) {
            foundLesson = lesson;
            break;
          }
        }
        setCurrentLesson(foundLesson);

        // Load progress
        const progressResponse = await learningApi.getProgress(courseResponse.data.id);
        setProgress(progressResponse.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [courseId, lessonId]);

  // Mark lesson as complete
  const handleMarkComplete = async () => {
    if (!currentLesson || !lessonId) return;

    setIsMarkingComplete(true);
    setError('');

    try {
      const response = await learningApi.markLessonComplete(lessonId);
      setProgress(prev => [...prev.filter(p => p.lessonId !== lessonId), response.data]);
      
      // Navigate to next lesson
      const nextLesson = getNextLesson();
      if (nextLesson && courseId) {
        navigate(`/learning-platform/courses/${courseId}/lessons/${nextLesson.id}`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsMarkingComplete(false);
    }
  };

  // Get next lesson
  const getNextLesson = (): Lesson | null => {
    if (!course?.modules || !currentLesson) return null;

    let foundCurrent = false;
    for (const module of course.modules) {
      for (const lesson of module.lessons || []) {
        if (foundCurrent) return lesson;
        if (lesson.id === currentLesson.id) foundCurrent = true;
      }
    }
    return null;
  };

  // Get previous lesson
  const getPreviousLesson = (): Lesson | null => {
    if (!course?.modules || !currentLesson) return null;

    let previousLesson: Lesson | null = null;
    for (const module of course.modules) {
      for (const lesson of module.lessons || []) {
        if (lesson.id === currentLesson.id) return previousLesson;
        previousLesson = lesson;
      }
    }
    return null;
  };

  // Check if lesson is completed
  const isLessonCompleted = (lessonId: string): boolean => {
    return progress.some(p => p.lessonId === lessonId && p.completed);
  };

  const nextLesson = getNextLesson();
  const previousLesson = getPreviousLesson();
  const currentLessonCompleted = currentLesson ? isLessonCompleted(currentLesson.id) : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorMessage message={error} onRetry={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Lesson Not Found</h2>
            <button
              onClick={() => navigate('/learning-platform/my-learning')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to My Learning
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        {/* Course Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'w-80' : 'w-0'
          } bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 h-screen sticky top-0`}
        >
          {isSidebarOpen && (
            <div className="p-6">
              <div className="mb-6">
                <button
                  onClick={() => navigate(`/learning-platform/courses/${course.id}`)}
                  className="text-sm text-blue-600 hover:text-blue-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Course Overview
                </button>
                <h2 className="text-lg font-bold text-gray-900">{course.title}</h2>
              </div>

              {/* Modules and Lessons */}
              <div className="space-y-4">
                {course.modules?.map((module: Module, moduleIndex: number) => (
                  <div key={module.id} className="border-b border-gray-200 pb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Module {moduleIndex + 1}: {module.title}
                    </h3>
                    <ul className="space-y-1">
                      {module.lessons?.map((lesson: Lesson, lessonIndex: number) => {
                        const completed = isLessonCompleted(lesson.id);
                        const isCurrent = lesson.id === currentLesson.id;

                        return (
                          <li key={lesson.id}>
                            <button
                              onClick={() =>
                                navigate(
                                  `/learning-platform/courses/${courseId}/lessons/${lesson.id}`
                                )
                              }
                              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                                isCurrent
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span className="flex items-center flex-1">
                                {completed ? (
                                  <svg
                                    className="w-4 h-4 mr-2 text-green-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : (
                                  <span className="w-4 h-4 mr-2 border-2 border-gray-300 rounded-full" />
                                )}
                                <span className="truncate">{lesson.title}</span>
                              </span>
                              {lesson.duration && (
                                <span className="text-xs text-gray-500 ml-2">
                                  {formatDuration(lesson.duration)}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed top-20 left-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
          >
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              {isSidebarOpen ? (
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </button>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Lesson Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentLesson.title}</h1>
              {currentLesson.description && (
                <p className="text-gray-600">{currentLesson.description}</p>
              )}
              {currentLessonCompleted && (
                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Completed
                </div>
              )}
            </div>

            {/* Lesson Content */}
            {error && <ErrorMessage message={error} className="mb-6" />}

            {currentLesson.contentBlocks && currentLesson.contentBlocks.length > 0 ? (
              <div className="space-y-6 mb-8">
                {currentLesson.contentBlocks.map(block => (
                  <ContentRenderer key={block.id} block={block} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center mb-8">
                <p className="text-gray-600">No content available for this lesson yet.</p>
              </div>
            )}

            {/* Navigation and Actions */}
            <div className="border-t border-gray-200 pt-6 flex items-center justify-between">
              <div>
                {previousLesson ? (
                  <button
                    onClick={() =>
                      navigate(
                        `/learning-platform/courses/${courseId}/lessons/${previousLesson.id}`
                      )
                    }
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Previous
                  </button>
                ) : (
                  <div />
                )}
              </div>

              <div className="flex gap-3">
                {!currentLessonCompleted && (
                  <button
                    onClick={handleMarkComplete}
                    disabled={isMarkingComplete}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50"
                  >
                    {isMarkingComplete ? <LoadingSpinner size="small" /> : 'Mark as Complete'}
                  </button>
                )}
                {nextLesson ? (
                  <button
                    onClick={() =>
                      navigate(
                        `/learning-platform/courses/${courseId}/lessons/${nextLesson.id}`
                      )
                    }
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    Next
                    <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/learning-platform/my-learning')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    Back to My Learning
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LessonViewPage;
