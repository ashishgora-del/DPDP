import { UserRole, SystemRole, ContentBlockType, QuestionType } from '../types';

// Determine API URL based on environment
const getApiBaseUrl = (): string => {
  // Check environment variable first
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }
  
  // For development
  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api';
  }
  
  // For production - use same domain
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

// Authentication
export const AUTH_TOKEN_KEY = 'learning_platform_token';
export const AUTH_USER_KEY = 'learning_platform_user';

// Roles
export const USER_ROLES = [
  { value: UserRole.ADMIN, label: 'Admin' },
  { value: UserRole.INSTRUCTOR, label: 'Instructor' },
  { value: UserRole.LEARNER, label: 'Learner' }
];

export const SYSTEM_ROLES = [
  { value: SystemRole.SUPER_ADMIN, label: 'Super Admin' },
  { value: SystemRole.CONTENT_MANAGER, label: 'Content Manager' },
  { value: SystemRole.INSTRUCTOR, label: 'Instructor' },
  { value: SystemRole.SUPPORT, label: 'Support' }
];

// Content Types
export const CONTENT_BLOCK_TYPES = [
  { value: ContentBlockType.TEXT, label: 'Text', icon: '📝' },
  { value: ContentBlockType.VIDEO, label: 'Video', icon: '🎥' },
  { value: ContentBlockType.IMAGE, label: 'Image', icon: '🖼️' },
  { value: ContentBlockType.QUIZ, label: 'Quiz', icon: '❓' },
  { value: ContentBlockType.ASSIGNMENT, label: 'Assignment', icon: '📋' },
  { value: ContentBlockType.RESOURCE, label: 'Resource', icon: '📚' }
];

export const QUESTION_TYPES = [
  { value: QuestionType.MULTIPLE_CHOICE, label: 'Multiple Choice' },
  { value: QuestionType.TRUE_FALSE, label: 'True/False' },
  { value: QuestionType.SHORT_ANSWER, label: 'Short Answer' },
  { value: QuestionType.ESSAY, label: 'Essay' }
];

// Pagination
export const DEFAULT_PAGE_SIZE = 12;
export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

// Course Filters
export const PRICE_RANGES = [
  { label: 'Free', min: 0, max: 0 },
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $200', min: 100, max: 200 },
  { label: 'Over $200', min: 200, max: Infinity }
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'title_desc', label: 'Title (Z-A)' },
  { value: 'price_asc', label: 'Price (Low to High)' },
  { value: 'price_desc', label: 'Price (High to Low)' }
];

// Validation Rules
export const VALIDATION_RULES = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address'
    }
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters'
    }
  },
  name: {
    required: 'Name is required',
    minLength: {
      value: 2,
      message: 'Name must be at least 2 characters'
    }
  },
  title: {
    required: 'Title is required',
    minLength: {
      value: 3,
      message: 'Title must be at least 3 characters'
    },
    maxLength: {
      value: 200,
      message: 'Title must not exceed 200 characters'
    }
  },
  description: {
    required: 'Description is required',
    minLength: {
      value: 10,
      message: 'Description must be at least 10 characters'
    }
  },
  price: {
    required: 'Price is required',
    min: {
      value: 0,
      message: 'Price must be 0 or greater'
    }
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  COURSE_CREATED: 'Course created successfully!',
  COURSE_UPDATED: 'Course updated successfully!',
  COURSE_DELETED: 'Course deleted successfully!',
  COURSE_PUBLISHED: 'Course published successfully!',
  MODULE_CREATED: 'Module created successfully!',
  MODULE_UPDATED: 'Module updated successfully!',
  MODULE_DELETED: 'Module deleted successfully!',
  LESSON_CREATED: 'Lesson created successfully!',
  LESSON_UPDATED: 'Lesson updated successfully!',
  LESSON_DELETED: 'Lesson deleted successfully!',
  ENROLLMENT_CREATED: 'Successfully enrolled in course!',
  PROGRESS_UPDATED: 'Progress updated!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logout successful!',
  REGISTER_SUCCESS: 'Registration successful!'
};

// Currency Options
export const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'INR', label: 'INR (₹)', symbol: '₹' }
];

// Time Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Quiz Settings
export const DEFAULT_PASSING_SCORE = 70;
export const DEFAULT_QUIZ_TIME_LIMIT = 30; // minutes

// File Upload
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Routes
export const ROUTES = {
  HOME: '/learning-platform',
  LOGIN: '/learning-platform/login',
  REGISTER: '/learning-platform/register',
  CATALOG: '/learning-platform/catalog',
  COURSE_DETAIL: '/learning-platform/courses/:slug',
  MY_LEARNING: '/learning-platform/my-learning',
  LESSON_VIEW: '/learning-platform/courses/:courseId/lessons/:lessonId',
  PROFILE: '/learning-platform/profile',
  
  // Admin Routes
  ADMIN: '/learning-platform/admin',
  ADMIN_COURSES: '/learning-platform/admin/courses',
  ADMIN_COURSE_EDIT: '/learning-platform/admin/courses/:id/edit',
  ADMIN_USERS: '/learning-platform/admin/users',
  ADMIN_CATEGORIES: '/learning-platform/admin/categories',
  ADMIN_ENROLLMENTS: '/learning-platform/admin/enrollments',
  ADMIN_ANALYTICS: '/learning-platform/admin/analytics',
  ADMIN_SETTINGS: '/learning-platform/admin/settings',
  ADMIN_ROLES: '/learning-platform/admin/roles'
};
