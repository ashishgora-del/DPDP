/**
 * Shared application enums/constants.
 * These replace Prisma-generated enums and are used across DTOs, services and guards.
 * Values must match the CHECK constraints / column values in the PostgreSQL schema.
 */

// ------------------------------------------------------------------
// User roles (stored in the `roles` table and as JWT claims)
// ------------------------------------------------------------------
export const UserRole = {
  LEARNER: 'LEARNER',
  ADMIN: 'ADMIN',
  AUTHOR: 'AUTHOR',
} as const;
export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];
export const USER_ROLES = Object.values(UserRole);

// ------------------------------------------------------------------
// Primary role – stored in `users.primary_role`
// Describes the professional context of the user.
// ------------------------------------------------------------------
export const PrimaryRole = {
  BEGINNER: 'BEGINNER',
  PRACTITIONER: 'PRACTITIONER',
  DEVELOPER: 'DEVELOPER',
  DPO: 'DPO',
  LEGAL: 'LEGAL',
  EXECUTIVE: 'EXECUTIVE',
} as const;
export type PrimaryRoleType = (typeof PrimaryRole)[keyof typeof PrimaryRole];
export const PRIMARY_ROLES = Object.values(PrimaryRole);

// ------------------------------------------------------------------
// Course / Learning-path difficulty level
// Stored in `courses.level`
// ------------------------------------------------------------------
export const CourseLevel = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
} as const;
export type CourseLevelType = (typeof CourseLevel)[keyof typeof CourseLevel];
export const COURSE_LEVELS = Object.values(CourseLevel);

// ------------------------------------------------------------------
// Enrollment source – stored in `enrollments.source`
// ------------------------------------------------------------------
export const EnrollmentSource = {
  SELF: 'SELF',
  ORG_ASSIGN: 'ORG_ASSIGN',
  BULK_UPLOAD: 'BULK_UPLOAD',
} as const;
export type EnrollmentSourceType = (typeof EnrollmentSource)[keyof typeof EnrollmentSource];
export const ENROLLMENT_SOURCES = Object.values(EnrollmentSource);

// ------------------------------------------------------------------
// Content block type – stored in `content_blocks.type`
// Mirrors the PostgreSQL ContentBlockType enum
// ------------------------------------------------------------------
export const ContentBlockType = {
  VIDEO: 'VIDEO',
  TEXT: 'TEXT',
  QUIZ: 'QUIZ',
  DOWNLOAD: 'DOWNLOAD',
  CODE_LAB: 'CODE_LAB',
  EXTERNAL_LINK: 'EXTERNAL_LINK',
} as const;
export type ContentBlockTypeValue = (typeof ContentBlockType)[keyof typeof ContentBlockType];
export const CONTENT_BLOCK_TYPES = Object.values(ContentBlockType);

// ------------------------------------------------------------------
// Module progress status
// ------------------------------------------------------------------
export const ProgressStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
export type ProgressStatusType = (typeof ProgressStatus)[keyof typeof ProgressStatus];
export const PROGRESS_STATUSES = Object.values(ProgressStatus);
