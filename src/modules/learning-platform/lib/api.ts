import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../../../shared/auth';
import { API_BASE_URL, ERROR_MESSAGES } from './constants';
import type {
  User,
  Course,
  Module,
  Lesson,
  ContentBlock,
  Quiz,
  Question,
  QuizAttempt,
  Enrollment,
  Progress,
  Category,
  Tag,
  Certificate,
  Organization,
  OrganizationMember,
  Assignment,
  AssignmentSubmission,
  Domain,
  LearningPath,
  LoginResponse,
  RegisterData,
  LoginData,
  PaginatedResponse,
  CourseFilters,
  EnrollmentFilters,
  CourseFormData,
  ModuleFormData,
  LessonFormData,
  ContentBlockFormData,
  QuizFormData,
  QuestionFormData
} from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 401:
          // Unauthorized - only clear token, don't redirect
          // Let AuthContext and route guards handle navigation
          if (!error.config?.url?.includes('/auth/me')) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
          }
          break;
        case 403:
          console.error(ERROR_MESSAGES.FORBIDDEN);
          break;
        case 404:
          console.error(ERROR_MESSAGES.NOT_FOUND);
          break;
        case 500:
          console.error(ERROR_MESSAGES.SERVER_ERROR);
          break;
        default:
          console.error(ERROR_MESSAGES.GENERIC_ERROR);
      }
    } else if (error.request) {
      console.error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    
    return Promise.reject(error);
  }
);

// =============================================================================
// AUTH API
// =============================================================================

export const authApi = {
  login: (data: LoginData) =>
    api.post<LoginResponse>('/auth/login', data),
  
  register: (data: RegisterData) =>
    api.post<LoginResponse>('/auth/register', data),
  
  getProfile: () =>
    api.get<User>('/auth/me'),
  
  updateProfile: (data: Partial<User>) =>
    api.patch<User>('/users/me', data)
};

// =============================================================================
// CATALOG API
// =============================================================================

export const catalogApi = {
  getPaths: (filters?: { role?: string; domainId?: string }) =>
    api.get<LearningPath[]>('/catalog/paths', { params: filters }),
  
  getPathBySlug: (slug: string) =>
    api.get<LearningPath>(`/catalog/paths/${slug}`),
  
  getCourses: (filters?: CourseFilters, page = 1, limit = 12) =>
    api.get<PaginatedResponse<Course>>('/catalog/courses', {
      params: { ...filters, page, limit }
    }),
  
  getCourseById: (id: string) =>
    api.get<Course>(`/catalog/courses/${id}`), 
  
  getCategories: () =>
    api.get<Category[]>('/catalog/categories'),
  
  getCategoryBySlug: (slug: string) =>
    api.get<Category>(`/catalog/categories/${slug}`),
  
  getTags: () =>
    api.get<Tag[]>('/catalog/tags'),
  
  searchCourses: (query: string, page = 1, limit = 12) =>
    api.get<PaginatedResponse<Course>>('/catalog/courses/search', {
      params: { q: query, page, limit }
    })
};

// =============================================================================
// LEARNING API
// =============================================================================

export const learningApi = {
  // Enrollments
  enroll: (courseId: string) =>
    api.post<Enrollment>('/learning/enrollments', { courseId }),
  
  getMyEnrollments: (filters?: EnrollmentFilters) =>
    api.get<Enrollment[]>('/learning/enrollments', { params: filters }),
  
  getEnrollment: (courseId: string) =>
    api.get<Enrollment>(`/learning/enrollments/${courseId}`),
  
  // Progress
  markLessonComplete: (lessonId: string) =>
    api.post<Progress>('/learning/progress', { lessonId }),
  
  getProgress: (courseId: string) =>
    api.get<Progress[]>(`/learning/progress/${courseId}`),
  
  // Quizzes
  startQuiz: (quizId: string) =>
    api.post<QuizAttempt>(`/learning/quizzes/${quizId}/attempts`),
  
  submitQuiz: (quizId: string, attemptId: string, answers: any) =>
    api.post<QuizAttempt>(`/learning/quizzes/${quizId}/attempts/${attemptId}/submit`, { answers }),
  
  getQuizAttempts: (quizId: string) =>
    api.get<QuizAttempt[]>(`/learning/quizzes/${quizId}/attempts`),
  
  // Assignments
  submitAssignment: (assignmentId: string, content: string, fileUrl?: string) =>
    api.post<AssignmentSubmission>(`/learning/assignments/${assignmentId}/submissions`, {
      content,
      fileUrl
    }),
  
  getAssignmentSubmissions: (assignmentId: string) =>
    api.get<AssignmentSubmission[]>(`/learning/assignments/${assignmentId}/submissions`),
  
  // Certificates
  getCertificate: (courseId: string) =>
    api.get<Certificate>(`/learning/certificates/${courseId}`),
  
  getMyCertificates: () =>
    api.get<Certificate[]>('/learning/certificates'),
  
  downloadCertificate: (certificateId: string) =>
    api.get(`/learning/certificates/${certificateId}/download`, { responseType: 'blob' })
};

// =============================================================================
// ADMIN - COURSES API
// =============================================================================

export const adminCoursesApi = {
  // Courses
  getAllCourses: (page = 1, limit = 20) =>
    api.get<PaginatedResponse<Course>>('/admin/courses', {
      params: { page, limit }
    }),
  
  createCourse: (data: CourseFormData) =>
    api.post<Course>('/admin/courses', data),
  
  getCourse: (id: string) =>
    api.get<Course>(`/admin/courses/${id}`),
  
  updateCourse: (id: string, data: Partial<CourseFormData>) =>
    api.patch<Course>(`/admin/courses/${id}`, data),
  
  deleteCourse: (id: string) =>
    api.delete(`/admin/courses/${id}`),
  
  publishCourse: (id: string) =>
    api.patch<Course>(`/admin/courses/${id}/publish`),
  
  unpublishCourse: (id: string) =>
    api.patch<Course>(`/admin/courses/${id}/unpublish`),
  
  // Modules
  createModule: (courseId: string, data: ModuleFormData) =>
    api.post<Module>(`/admin/courses/${courseId}/modules`, data),
  
  updateModule: (courseId: string, moduleId: string, data: Partial<ModuleFormData>) =>
    api.patch<Module>(`/admin/courses/${courseId}/modules/${moduleId}`, data),
  
  deleteModule: (courseId: string, moduleId: string) =>
    api.delete(`/admin/courses/${courseId}/modules/${moduleId}`),
  
  reorderModules: (courseId: string, moduleIds: string[]) =>
    api.patch(`/admin/courses/${courseId}/modules/reorder`, { moduleIds }),
  
  // Lessons
  createLesson: (moduleId: string, data: LessonFormData) =>
    api.post<Lesson>(`/admin/modules/${moduleId}/lessons`, data),
  
  updateLesson: (moduleId: string, lessonId: string, data: Partial<LessonFormData>) =>
    api.patch<Lesson>(`/admin/modules/${moduleId}/lessons/${lessonId}`, data),
  
  deleteLesson: (moduleId: string, lessonId: string) =>
    api.delete(`/admin/modules/${moduleId}/lessons/${lessonId}`),
  
  reorderLessons: (moduleId: string, lessonIds: string[]) =>
    api.patch(`/admin/modules/${moduleId}/lessons/reorder`, { lessonIds }),
  
  // Content Blocks
  createContentBlock: (lessonId: string, data: ContentBlockFormData) =>
    api.post<ContentBlock>(`/admin/lessons/${lessonId}/content`, data),
  
  updateContentBlock: (lessonId: string, blockId: string, data: Partial<ContentBlockFormData>) =>
    api.patch<ContentBlock>(`/admin/lessons/${lessonId}/content/${blockId}`, data),
  
  deleteContentBlock: (lessonId: string, blockId: string) =>
    api.delete(`/admin/lessons/${lessonId}/content/${blockId}`),
  
  // Quizzes
  createQuiz: (lessonId: string, data: QuizFormData) =>
    api.post<Quiz>(`/admin/lessons/${lessonId}/quizzes`, data),
  
  updateQuiz: (quizId: string, data: Partial<QuizFormData>) =>
    api.patch<Quiz>(`/admin/quizzes/${quizId}`, data),
  
  deleteQuiz: (quizId: string) =>
    api.delete(`/admin/quizzes/${quizId}`),
  
  // Questions
  createQuestion: (quizId: string, data: QuestionFormData) =>
    api.post<Question>(`/admin/quizzes/${quizId}/questions`, data),
  
  updateQuestion: (quizId: string, questionId: string, data: Partial<QuestionFormData>) =>
    api.patch<Question>(`/admin/quizzes/${quizId}/questions/${questionId}`, data),
  
  deleteQuestion: (quizId: string, questionId: string) =>
    api.delete(`/admin/quizzes/${quizId}/questions/${questionId}`)
};

// =============================================================================
// ADMIN - USERS API
// =============================================================================

export const adminUsersApi = {
  getUsers: (page = 1, limit = 20, search?: string) =>
    api.get<PaginatedResponse<User>>('/admin/users', {
      params: { page, limit, search }
    }),
  
  getUser: (id: string) =>
    api.get<User>(`/admin/users/${id}`),
  
  updateUser: (id: string, data: Partial<User>) =>
    api.patch<User>(`/admin/users/${id}`, data),
  
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`)
};

// =============================================================================
// ADMIN - CATEGORIES API
// =============================================================================

export const adminCategoriesApi = {
  getCategories: () =>
    api.get<Category[]>('/admin/categories'),
  
  createCategory: (data: { name: string; description?: string; parentId?: string }) =>
    api.post<Category>('/admin/categories', data),
  
  updateCategory: (id: string, data: { name?: string; description?: string; parentId?: string }) =>
    api.patch<Category>(`/admin/categories/${id}`, data),
  
  deleteCategory: (id: string) =>
    api.delete(`/admin/categories/${id}`)
};

// =============================================================================
// ADMIN - ENROLLMENTS API
// =============================================================================

export const adminEnrollmentsApi = {
  getEnrollments: (page = 1, limit = 20, filters?: EnrollmentFilters) =>
    api.get<PaginatedResponse<Enrollment>>('/admin/enrollments', {
      params: { page, limit, ...filters }
    }),
  
  updateEnrollmentStatus: (id: string, status: string) =>
    api.patch<Enrollment>(`/admin/enrollments/${id}`, { status })
};

// =============================================================================
// ADMIN - ANALYTICS API
// =============================================================================

export const adminAnalyticsApi = {
  getDashboardStats: () =>
    api.get<{
      totalCourses: number;
      totalUsers: number;
      totalEnrollments: number;
      totalRevenue: number;
      recentEnrollments: Enrollment[];
      popularCourses: Array<Course & { enrollmentCount: number }>;
    }>('/admin/analytics/dashboard'),
  
  getCourseAnalytics: (courseId: string) =>
    api.get<{
      enrollments: number;
      completions: number;
      averageProgress: number;
      revenue: number;
    }>(`/admin/analytics/courses/${courseId}`)
};

// =============================================================================
// ADMIN - DOMAINS API
// =============================================================================

export const adminDomainsApi = {
  getAllDomains: () =>
    api.get<Domain[]>('/admin/domains'),
  
  getDomain: (id: number) =>
    api.get<Domain>(`/admin/domains/${id}`),
  
  createDomain: (data: { name: string; description?: string; color?: string; icon?: string }) =>
    api.post<Domain>('/admin/domains', data),
  
  updateDomain: (id: number, data: { name?: string; description?: string; color?: string; icon?: string }) =>
    api.patch<Domain>(`/admin/domains/${id}`, data),
  
  deleteDomain: (id: number) =>
    api.delete(`/admin/domains/${id}`)
};

// =============================================================================
// ADMIN - LEARNING PATHS API
// =============================================================================

export const adminPathsApi = {
  getAllPaths: () =>
    api.get<LearningPath[]>('/admin/paths'),
  
  getPath: (id: number) =>
    api.get<LearningPath>(`/admin/paths/${id}`),
  
  createPath: (data: { name: string; description?: string; domainId: number; courseIds?: number[]; prerequisites?: string }) =>
    api.post<LearningPath>('/admin/paths', data),
  
  updatePath: (id: number, data: { name?: string; description?: string; domainId?: number; courseIds?: number[]; prerequisites?: string }) =>
    api.patch<LearningPath>(`/admin/paths/${id}`, data),
  
  deletePath: (id: number) =>
    api.delete(`/admin/paths/${id}`)
};

// =============================================================================
// ADMIN - MODULES API
// =============================================================================

export const adminModulesApi = {
  getAllModules: (params?: { page?: number; limit?: number; courseId?: string }) =>
    api.get<PaginatedResponse<Module>>('/admin/modules', { params }),
  
  getModule: (id: string) =>
    api.get<Module>(`/admin/modules/${id}`),
  
  createModule: (data: { courseId: string; title: string; description?: string; order: number; type?: string; isFree?: boolean }) =>
    api.post<Module>('/admin/modules', data),
  
  updateModule: (id: string, data: Partial<{ title: string; description: string; order: number; type: string; isFree: boolean }>) =>
    api.patch<Module>(`/admin/modules/${id}`, data),
  
  deleteModule: (id: string) =>
    api.delete(`/admin/modules/${id}`),
  
  publishModule: (id: string) =>
    api.patch<Module>(`/admin/modules/${id}/publish`, { isPublished: true }),
  
  unpublishModule: (id: string) =>
    api.patch<Module>(`/admin/modules/${id}/publish`, { isPublished: false })
};

// =============================================================================
// ORGANIZATIONS API
// =============================================================================

export const organizationsApi = {
  getOrganizations: () =>
    api.get<Organization[]>('/organizations'),
  
  createOrganization: (data: { name: string; domain: string }) =>
    api.post<Organization>('/organizations', data),
  
  getMembers: (orgId: string) =>
    api.get<OrganizationMember[]>(`/organizations/${orgId}/members`),
  
  addMember: (orgId: string, userId: string, role: string) =>
    api.post<OrganizationMember>(`/organizations/${orgId}/members`, { userId, role }),
  
  removeMember: (orgId: string, memberId: string) =>
    api.delete(`/organizations/${orgId}/members/${memberId}`)
};

export default api;
