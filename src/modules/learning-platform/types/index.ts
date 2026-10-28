// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  LEARNER = 'LEARNER'
}

export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  INSTRUCTOR = 'INSTRUCTOR',
  SUPPORT = 'SUPPORT'
}

export enum ContentBlockType {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
  RESOURCE = 'RESOURCE'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY'
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED'
}

export enum ModuleType {
  THEORY = 'THEORY',
  PRACTICAL = 'PRACTICAL',
  ASSESSMENT = 'ASSESSMENT',
  PROJECT = 'PROJECT'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum OrgRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export enum AssignmentStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED'
}

// Domain Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  systemRole?: SystemRole;
  organizationId?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: OrgRole;
  joinedAt: string;
  user?: User;
  organization?: Organization;
}

export interface Domain {
  id: number;
  name: string;
  description?: string;
  slug?: string;
  color?: string;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    courses?: number;
    learningPaths?: number;
  };
}

export interface LearningPath {
  id: number;
  name: string;
  description?: string;
  domainId: number;
  prerequisites?: string;
  createdAt?: string;
  updatedAt?: string;
  domain?: Domain;
  courses?: Course[];
  _count?: {
    courses?: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  parent?: Category;
  children?: Category[];
  courses?: Course[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  categoryId?: string;
  instructorId: string;
  thumbnailUrl?: string;
  price: number;
  currency: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  instructor?: User;
  modules?: Module[];
  enrollments?: Enrollment[];
  tags?: Tag[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  type?: ModuleType;
  isPublished?: boolean;
  isFree?: boolean;
  estimatedMinutes?: number;
  createdAt: string;
  updatedAt: string;
  course?: Course;
  lessons?: Lesson[];
  _count?: {
    contentBlocks?: number;
    lessons?: number;
  };
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  module?: Module;
  contentBlocks?: ContentBlock[];
  progress?: Progress[];
}

export interface ContentBlock {
  id: string;
  lessonId: string;
  type: ContentBlockType;
  content: any;
  order: number;
  createdAt: string;
  updatedAt: string;
  lesson?: Lesson;
}

export interface Quiz {
  id: string;
  lessonId?: string;
  courseId?: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  createdAt: string;
  updatedAt: string;
  lesson?: Lesson;
  course?: Course;
  questions?: Question[];
  attempts?: QuizAttempt[];
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  text: string;
  options?: any;
  correctAnswer: any;
  points: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  quiz?: Quiz;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  answers: any;
  completedAt?: string;
  createdAt: string;
  quiz?: Quiz;
  user?: User;
}

export interface Assignment {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  dueDate?: string;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
  lesson?: Lesson;
  submissions?: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  content: string;
  fileUrl?: string;
  status: AssignmentStatus;
  score?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
  assignment?: Assignment;
  user?: User;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  user?: User;
  course?: Course;
}

export interface Progress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  user?: User;
  lesson?: Lesson;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
  certificateUrl: string;
  user?: User;
  course?: Course;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  courses?: Course[];
}

export interface Order {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  paymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  course?: Course;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
  order?: Order;
}

// API Response Types
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Form Types
export interface CourseFormData {
  title: string;
  description: string;
  categoryId?: string;
  thumbnailUrl?: string;
  price: number;
  currency?: string;
}

export interface ModuleFormData {
  title: string;
  description?: string;
  order: number;
}

export interface LessonFormData {
  title: string;
  description?: string;
  duration?: number;
  order: number;
}

export interface ContentBlockFormData {
  type: ContentBlockType;
  content: any;
  order: number;
}

export interface QuizFormData {
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
}

export interface QuestionFormData {
  type: QuestionType;
  text: string;
  options?: any;
  correctAnswer: any;
  points: number;
  order: number;
}

// Filter/Query Types
export interface CourseFilters {
  categoryId?: string;
  instructorId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isPublished?: boolean;
  tags?: string[];
}

export interface EnrollmentFilters {
  userId?: string;
  courseId?: string;
  status?: EnrollmentStatus;
}
