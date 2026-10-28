# API Documentation

Complete reference for all API endpoints used in the Learning Platform module.

## Table of Contents

- [Authentication](#authentication)
- [Learning API](#learning-api)
- [Admin Courses](#admin-courses-api)
- [Admin Users](#admin-users-api)
- [Admin Categories](#admin-categories-api)
- [Admin Enrollments](#admin-enrollments-api)
- [Admin Analytics](#admin-analytics-api)
- [Admin Domains](#admin-domains-api)
- [Admin Paths](#admin-paths-api)
- [Admin Modules](#admin-modules-api)

---

## Authentication

All authenticated requests include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### POST /auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "LEARNER",
    "avatar": "https://...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- 401: Invalid credentials
- 400: Validation error

---

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Doe",
  "role": "LEARNER"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "name": "Jane Doe",
    "role": "LEARNER",
    "avatar": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- 409: Email already exists
- 400: Validation error

---

### GET /auth/profile

Get current authenticated user's profile.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "LEARNER",
  "avatar": "https://...",
  "bio": "Software developer",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- 401: Unauthorized (invalid/expired token)

---

### PATCH /users/me

Update current user's profile.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "bio": "Senior developer",
  "avatar": "https://..."
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Smith",
  "bio": "Senior developer",
  "avatar": "https://...",
  "role": "LEARNER",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

**Errors:**
- 401: Unauthorized
- 400: Validation error

---

## Learning API

### GET /catalog/courses

Browse courses with filtering and pagination.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `search` (string, optional)
- `category` (string, optional)
- `level` (string, optional): BEGINNER | INTERMEDIATE | ADVANCED
- `isPublished` (boolean, optional)

**Example Request:**
```
GET /catalog/courses?page=1&limit=10&category=Programming&level=BEGINNER
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Introduction to TypeScript",
      "slug": "intro-typescript",
      "description": "Learn TypeScript from scratch",
      "thumbnail": "https://...",
      "level": "BEGINNER",
      "price": 49.99,
      "rating": 4.8,
      "enrollmentCount": 1250,
      "isPublished": true,
      "category": {
        "id": "uuid",
        "name": "Programming"
      },
      "instructor": {
        "id": "uuid",
        "name": "Jane Teacher"
      },
      "modules": [
        {
          "id": "uuid",
          "title": "Getting Started",
          "order": 1
        }
      ]
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### GET /catalog/courses/:slug

Get detailed course information by slug.

**Parameters:**
- `slug` (string): Course slug (e.g., "intro-typescript")

**Example Request:**
```
GET /catalog/courses/intro-typescript
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "Introduction to TypeScript",
  "slug": "intro-typescript",
  "description": "Learn TypeScript from scratch",
  "thumbnail": "https://...",
  "level": "BEGINNER",
  "price": 49.99,
  "rating": 4.8,
  "enrollmentCount": 1250,
  "isPublished": true,
  "category": {
    "id": "uuid",
    "name": "Programming"
  },
  "instructor": {
    "id": "uuid",
    "name": "Jane Teacher",
    "avatar": "https://...",
    "bio": "10 years experience"
  },
  "modules": [
    {
      "id": "uuid",
      "title": "Getting Started",
      "description": "Introduction to TypeScript",
      "order": 1,
      "lessons": [
        {
          "id": "uuid",
          "title": "What is TypeScript?",
          "order": 1,
          "duration": 10
        }
      ]
    }
  ],
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Great course!",
      "user": {
        "name": "Student Name"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Errors:**
- 404: Course not found

---

### POST /learning/enrollments

Enroll in a course.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "courseId": "uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "courseId": "uuid",
  "userId": "uuid",
  "status": "ACTIVE",
  "progress": 0,
  "enrolledAt": "2024-01-01T00:00:00.000Z",
  "course": {
    "id": "uuid",
    "title": "Introduction to TypeScript",
    "thumbnail": "https://..."
  }
}
```

**Errors:**
- 401: Unauthorized
- 409: Already enrolled
- 404: Course not found

---

### GET /learning/enrollments/me

Get current user's enrollments.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (string, optional): ACTIVE | COMPLETED | DROPPED

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "status": "ACTIVE",
    "progress": 45,
    "enrolledAt": "2024-01-01T00:00:00.000Z",
    "lastAccessedAt": "2024-01-15T00:00:00.000Z",
    "course": {
      "id": "uuid",
      "title": "Introduction to TypeScript",
      "slug": "intro-typescript",
      "thumbnail": "https://...",
      "instructor": {
        "name": "Jane Teacher"
      }
    },
    "completedLessons": 5,
    "totalLessons": 11
  }
]
```

---

### POST /learning/progress

Mark a lesson as complete and update progress.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "lessonId": "uuid",
  "courseId": "uuid",
  "completed": true
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "lessonId": "uuid",
  "userId": "uuid",
  "completed": true,
  "completedAt": "2024-01-01T00:00:00.000Z",
  "courseProgress": 50
}
```

**Errors:**
- 401: Unauthorized
- 404: Lesson or enrollment not found

---

### GET /learning/progress/:courseId

Get detailed progress for a course.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `courseId` (string): Course ID

**Response (200 OK):**
```json
{
  "courseId": "uuid",
  "progress": 50,
  "completedLessons": [
    {
      "id": "uuid",
      "title": "What is TypeScript?",
      "completedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "nextLesson": {
    "id": "uuid",
    "title": "Setting up TypeScript",
    "moduleTitle": "Getting Started"
  }
}
```

---

### GET /learning/certificates/:courseId

Get or generate certificate for completed course.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `courseId` (string): Course ID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "courseId": "uuid",
  "userId": "uuid",
  "certificateUrl": "https://...",
  "issuedAt": "2024-01-01T00:00:00.000Z",
  "course": {
    "title": "Introduction to TypeScript",
    "instructor": {
      "name": "Jane Teacher"
    }
  },
  "user": {
    "name": "John Doe"
  }
}
```

**Errors:**
- 401: Unauthorized
- 404: Course not found or not completed

---

## Admin Courses API

**Note:** All admin endpoints require `ADMIN` role.

### GET /admin/courses

List all courses with admin details.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `search` (string, optional)
- `isPublished` (boolean, optional)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Introduction to TypeScript",
      "slug": "intro-typescript",
      "isPublished": true,
      "enrollmentCount": 1250,
      "rating": 4.8,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "instructor": {
        "id": "uuid",
        "name": "Jane Teacher"
      }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### GET /admin/courses/:id

Get full course details for editing.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Course ID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "Introduction to TypeScript",
  "slug": "intro-typescript",
  "description": "Learn TypeScript from scratch",
  "thumbnail": "https://...",
  "level": "BEGINNER",
  "price": 49.99,
  "isPublished": true,
  "categoryId": "uuid",
  "instructorId": "uuid",
  "modules": [
    {
      "id": "uuid",
      "title": "Getting Started",
      "description": "Introduction",
      "order": 1,
      "lessons": [
        {
          "id": "uuid",
          "title": "What is TypeScript?",
          "content": "...",
          "order": 1,
          "duration": 10
        }
      ]
    }
  ]
}
```

---

### POST /admin/courses

Create a new course.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "title": "Advanced React Patterns",
  "slug": "advanced-react-patterns",
  "description": "Master advanced React techniques",
  "thumbnail": "https://...",
  "level": "ADVANCED",
  "price": 99.99,
  "categoryId": "uuid",
  "instructorId": "uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "title": "Advanced React Patterns",
  "slug": "advanced-react-patterns",
  "description": "Master advanced React techniques",
  "thumbnail": "https://...",
  "level": "ADVANCED",
  "price": 99.99,
  "isPublished": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- 403: Forbidden (not admin)
- 409: Slug already exists
- 400: Validation error

---

### PATCH /admin/courses/:id

Update an existing course.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Course ID

**Request Body:**
```json
{
  "title": "Updated Title",
  "price": 79.99,
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "price": 79.99,
  "description": "Updated description",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### DELETE /admin/courses/:id

Delete a course (soft delete).

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Course ID

**Response (204 No Content)**

**Errors:**
- 403: Forbidden
- 404: Course not found

---

### POST /admin/courses/:id/publish

Publish a course to make it visible to learners.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Course ID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "isPublished": true,
  "publishedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /admin/courses/:id/unpublish

Unpublish a course to hide it from learners.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Course ID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "isPublished": false,
  "unpublishedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Admin Users API

### GET /admin/users

List all users with filtering.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `search` (string, optional)
- `role` (string, optional): LEARNER | INSTRUCTOR | ADMIN

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "LEARNER",
      "avatar": "https://...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "enrollmentCount": 5,
      "lastLoginAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1000,
    "page": 1,
    "limit": 10,
    "totalPages": 100
  }
}
```

---

### GET /admin/users/:id

Get detailed user information.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): User ID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "LEARNER",
  "avatar": "https://...",
  "bio": "Software developer",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLoginAt": "2024-01-15T00:00:00.000Z",
  "enrollments": [
    {
      "id": "uuid",
      "courseTitle": "Introduction to TypeScript",
      "progress": 50,
      "status": "ACTIVE"
    }
  ],
  "certificates": [
    {
      "id": "uuid",
      "courseTitle": "JavaScript Basics",
      "issuedAt": "2024-01-10T00:00:00.000Z"
    }
  ]
}
```

---

### PATCH /admin/users/:id/role

Update user's role.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): User ID

**Request Body:**
```json
{
  "role": "INSTRUCTOR"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "INSTRUCTOR",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### DELETE /admin/users/:id

Delete a user account.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): User ID

**Response (204 No Content)**

**Errors:**
- 403: Cannot delete yourself
- 404: User not found

---

## Admin Categories API

### GET /admin/categories

List all categories.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Programming",
    "slug": "programming",
    "description": "Software development courses",
    "courseCount": 150,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### POST /admin/categories

Create a new category.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Data Science",
  "slug": "data-science",
  "description": "Data analytics and ML courses"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Data Science",
  "slug": "data-science",
  "description": "Data analytics and ML courses",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /admin/categories/:id

Update a category.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Category ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "description": "Updated description",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### DELETE /admin/categories/:id

Delete a category.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Category ID

**Response (204 No Content)**

**Errors:**
- 409: Category has courses (cannot delete)

---

## Admin Enrollments API

### GET /admin/enrollments

List all enrollments with filtering.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `status` (string, optional): ACTIVE | COMPLETED | DROPPED
- `courseId` (string, optional)
- `userId` (string, optional)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "ACTIVE",
      "progress": 45,
      "enrolledAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "course": {
        "id": "uuid",
        "title": "Introduction to TypeScript"
      }
    }
  ],
  "meta": {
    "total": 5000,
    "page": 1,
    "limit": 10,
    "totalPages": 500
  }
}
```

---

### PATCH /admin/enrollments/:id/status

Update enrollment status.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Enrollment ID

**Request Body:**
```json
{
  "status": "DROPPED"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "DROPPED",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### DELETE /admin/enrollments/:id

Remove an enrollment.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Enrollment ID

**Response (204 No Content)**

---

## Admin Analytics API

### GET /admin/analytics/overview

Get platform-wide statistics.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "totalUsers": 10000,
  "totalCourses": 150,
  "totalEnrollments": 25000,
  "activeEnrollments": 18000,
  "completionRate": 68.5,
  "averageRating": 4.6,
  "revenueThisMonth": 125000,
  "newUsersThisMonth": 500
}
```

---

### GET /admin/analytics/courses/:id

Get detailed analytics for a specific course.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Course ID

**Response (200 OK):**
```json
{
  "courseId": "uuid",
  "title": "Introduction to TypeScript",
  "enrollments": 1250,
  "activeEnrollments": 800,
  "completions": 450,
  "completionRate": 36,
  "averageProgress": 52,
  "averageRating": 4.8,
  "totalRevenue": 62475,
  "enrollmentTrend": [
    {
      "date": "2024-01",
      "count": 150
    }
  ]
}
```

---

### GET /admin/analytics/users

Get user statistics and trends.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "totalUsers": 10000,
  "activeUsers": 7500,
  "usersByRole": {
    "LEARNER": 9500,
    "INSTRUCTOR": 450,
    "ADMIN": 50
  },
  "userGrowth": [
    {
      "date": "2024-01",
      "newUsers": 500,
      "totalUsers": 9500
    }
  ],
  "engagementMetrics": {
    "dailyActiveUsers": 2500,
    "weeklyActiveUsers": 5000,
    "monthlyActiveUsers": 7500
  }
}
```

---

## Admin Domains API

### GET /admin/domains

List all content domains.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Technology",
    "slug": "technology",
    "description": "Tech-related courses",
    "color": "#3B82F6",
    "icon": "💻",
    "pathCount": 5,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### POST /admin/domains

Create a new domain.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Business",
  "slug": "business",
  "description": "Business and management",
  "color": "#10B981",
  "icon": "💼"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Business",
  "slug": "business",
  "description": "Business and management",
  "color": "#10B981",
  "icon": "💼",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /admin/domains/:id

Update a domain.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Domain ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "color": "#8B5CF6"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "color": "#8B5CF6",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### DELETE /admin/domains/:id

Delete a domain.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Domain ID

**Response (204 No Content)**

---

## Admin Paths API

### GET /admin/paths

List learning paths with filtering.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `domainId` (string, optional)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Full Stack Developer",
      "slug": "full-stack-developer",
      "description": "Become a full stack developer",
      "domain": {
        "id": "uuid",
        "name": "Technology"
      },
      "courseCount": 8,
      "estimatedDuration": 240,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### POST /admin/paths

Create a learning path.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "title": "Data Scientist",
  "slug": "data-scientist",
  "description": "Master data science",
  "domainId": "uuid",
  "courseIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "title": "Data Scientist",
  "slug": "data-scientist",
  "description": "Master data science",
  "domainId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /admin/paths/:id

Update a learning path.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Path ID

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "description": "Updated description",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### DELETE /admin/paths/:id

Delete a learning path.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Path ID

**Response (204 No Content)**

---

## Admin Modules API

### GET /admin/modules

List all modules with filtering.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `courseId` (string, optional)
- `type` (string, optional): CONTENT | QUIZ | ASSIGNMENT

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Getting Started",
      "description": "Introduction module",
      "type": "CONTENT",
      "order": 1,
      "isPublished": true,
      "course": {
        "id": "uuid",
        "title": "Introduction to TypeScript"
      },
      "_count": {
        "lessons": 5
      }
    }
  ],
  "meta": {
    "total": 500,
    "page": 1,
    "limit": 20,
    "totalPages": 25
  }
}
```

---

### GET /admin/modules/:id

Get detailed module information.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Module ID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "Getting Started",
  "description": "Introduction module",
  "type": "CONTENT",
  "order": 1,
  "isPublished": true,
  "courseId": "uuid",
  "lessons": [
    {
      "id": "uuid",
      "title": "What is TypeScript?",
      "content": "...",
      "order": 1,
      "duration": 10
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /admin/modules

Create a new module.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "title": "Advanced Topics",
  "description": "Deep dive into advanced concepts",
  "type": "CONTENT",
  "order": 2,
  "courseId": "uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "title": "Advanced Topics",
  "description": "Deep dive into advanced concepts",
  "type": "CONTENT",
  "order": 2,
  "isPublished": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /admin/modules/:id

Update a module.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Module ID

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "order": 3
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "description": "Updated description",
  "order": 3,
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### DELETE /admin/modules/:id

Delete a module.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Module ID

**Response (204 No Content)**

---

### POST /admin/modules/:id/publish

Publish a module.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Module ID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "isPublished": true,
  "publishedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /admin/modules/:id/unpublish

Unpublish a module.

**Headers Required:**
```
Authorization: Bearer <admin-token>
```

**Parameters:**
- `id` (string): Module ID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "isPublished": false,
  "unpublishedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Not Found",
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Conflict",
  "error": "Resource already exists"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "An unexpected error occurred"
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authenticated requests**: 1000 requests per hour
- **Public endpoints**: 100 requests per hour
- **Login endpoint**: 10 requests per 15 minutes

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1640000000
```

---

## Pagination

All list endpoints support pagination with the following query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

Pagination metadata is returned in the `meta` field:

```json
{
  "data": [...],
  "meta": {
    "total": 1000,
    "page": 1,
    "limit": 10,
    "totalPages": 100
  }
}
```

---

**Last Updated**: Phase 11 - Documentation
