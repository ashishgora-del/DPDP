# Backend Setup Instructions

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure your database connection:
```
DATABASE_URL="postgresql://username:password@localhost:5432/elearning?schema=public"
JWT_SECRET="your-secret-key"
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Seed the database with initial data:
```bash
npm run prisma:seed
```

## Running the Application

Development mode:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:3001/api/docs

## Test Credentials

After seeding, use these credentials:
- **Admin**: admin@elearning.com / Admin@123
- **Learner**: learner@elearning.com / Learner@123

## Database Management

Open Prisma Studio to manage data:
```bash
npm run prisma:studio
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Catalog
- `GET /api/catalog/domains` - List domains
- `GET /api/catalog/paths` - List learning paths
- `GET /api/catalog/courses/:id` - Get course details
- `GET /api/catalog/modules/:id` - Get module details

### Learning
- `POST /api/learning/enrollments` - Enroll in course
- `GET /api/learning/enrollments` - Get user enrollments
- `POST /api/learning/progress/module/:id` - Update progress
- `GET /api/learning/dashboard` - Get learning dashboard

### Admin (Requires ADMIN or AUTHOR role)
- `POST /api/admin/domains` - Create domain
- `POST /api/admin/paths` - Create learning path
- `POST /api/admin/courses` - Create course
- `POST /api/admin/modules` - Create module
- `PATCH /api/admin/modules/:id/publish` - Publish module
