import { isValidEmail, isEmpty } from './helpers';
import { VALIDATION_RULES } from './constants';

/**
 * Validate login form
 */
export const validateLogin = (email: string, password: string): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isEmpty(email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Invalid email address';
  }

  if (isEmpty(password)) {
    errors.password = 'Password is required';
  }

  return errors;
};

/**
 * Validate registration form
 */
export const validateRegister = (
  email: string,
  password: string,
  name: string,
  confirmPassword?: string
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isEmpty(email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Invalid email address';
  }

  if (isEmpty(name)) {
    errors.name = 'Name is required';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (isEmpty(password)) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

/**
 * Validate course form
 */
export const validateCourse = (
  title: string,
  description: string,
  price: number
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isEmpty(title)) {
    errors.title = 'Title is required';
  } else if (title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (title.length > 200) {
    errors.title = 'Title must not exceed 200 characters';
  }

  if (isEmpty(description)) {
    errors.description = 'Description is required';
  } else if (description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  if (price < 0) {
    errors.price = 'Price must be 0 or greater';
  }

  return errors;
};

/**
 * Validate module form
 */
export const validateModule = (title: string): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isEmpty(title)) {
    errors.title = 'Title is required';
  } else if (title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  return errors;
};

/**
 * Validate lesson form
 */
export const validateLesson = (title: string): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isEmpty(title)) {
    errors.title = 'Title is required';
  } else if (title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  return errors;
};

/**
 * Validate quiz form
 */
export const validateQuiz = (
  title: string,
  passingScore: number
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isEmpty(title)) {
    errors.title = 'Title is required';
  } else if (title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (passingScore < 0 || passingScore > 100) {
    errors.passingScore = 'Passing score must be between 0 and 100';
  }

  return errors;
};

/**
 * Validate question form
 */
export const validateQuestion = (
  text: string,
  points: number
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isEmpty(text)) {
    errors.text = 'Question text is required';
  }

  if (points <= 0) {
    errors.points = 'Points must be greater than 0';
  }

  return errors;
};

/**
 * Validate file upload
 */
export const validateFile = (
  file: File,
  allowedTypes: string[],
  maxSize: number
): string | null => {
  if (!allowedTypes.includes(file.type)) {
    return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
    return `File size exceeds ${maxSizeMB}MB limit`;
  }

  return null;
};

/**
 * Validate password change form
 */
export const validatePasswordChange = (data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.currentPassword) {
    errors.currentPassword = 'Current password is required';
  }

  if (!data.newPassword) {
    errors.newPassword = 'New password is required';
  } else if (data.newPassword.length < 8) {
    errors.newPassword = 'Password must be at least 8 characters';
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your new password';
  } else if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
    errors.newPassword = 'New password must be different from current password';
  }

  return errors;
};
