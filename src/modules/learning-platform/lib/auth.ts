import { UserRole, SystemRole } from '../types';

/**
 * Check if user has required role
 */
export const hasRole = (userRole: UserRole | undefined, requiredRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
};

/**
 * Check if user has required system role
 */
export const hasSystemRole = (userSystemRole: SystemRole | undefined, requiredRoles: SystemRole[]): boolean => {
  if (!userSystemRole) return false;
  return requiredRoles.includes(userSystemRole);
};

/**
 * Check if user is admin
 */
export const isAdmin = (userRole: UserRole | undefined): boolean => {
  return userRole === UserRole.ADMIN;
};

/**
 * Check if user is instructor
 */
export const isInstructor = (userRole: UserRole | undefined): boolean => {
  return userRole === UserRole.INSTRUCTOR;
};

/**
 * Check if user is learner
 */
export const isLearner = (userRole: UserRole | undefined): boolean => {
  return userRole === UserRole.LEARNER;
};

/**
 * Get role label
 */
export const getRoleLabel = (role: UserRole): string => {
  const roleLabels: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Admin',
    [UserRole.INSTRUCTOR]: 'Instructor',
    [UserRole.LEARNER]: 'Learner'
  };
  return roleLabels[role] || role;
};

/**
 * Get system role label
 */
export const getSystemRoleLabel = (role: SystemRole): string => {
  const roleLabels: Record<SystemRole, string> = {
    [SystemRole.SUPER_ADMIN]: 'Super Admin',
    [SystemRole.CONTENT_MANAGER]: 'Content Manager',
    [SystemRole.INSTRUCTOR]: 'Instructor',
    [SystemRole.SUPPORT]: 'Support'
  };
  return roleLabels[role] || role;
};
