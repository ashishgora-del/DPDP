import React from 'react';
import { Course } from '../../types';
import CourseCard from '../cards/CourseCard';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

interface CourseGridProps {
  courses: Course[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const CourseGrid: React.FC<CourseGridProps> = ({
  courses,
  isLoading = false,
  emptyMessage = 'No courses found'
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        description="Try adjusting your filters or search query"
        icon={<span>📚</span>}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};

export default CourseGrid;
