# DPDP Shared Backend

This is the **unified backend API** for all DPDP platform modules. It provides authentication, data management, and business logic for:

- **Learning Platform** (E-Learning Module)
- **Risk Assessment** Module
- **Future Modules** (easily extensible)

## Architecture Overview

```
backend/
├── src/
│   ├── auth/           # Authentication & JWT (shared by all modules)
│   ├── users/          # User management (shared)
│   ├── prisma/         # Database service (shared)
│   ├── learning/       # Learning platform specific endpoints
│   ├── catalog/        # Course catalog endpoints
│   ├── admin/          # Admin panel endpoints
│   ├── app.module.ts   # Root module
│   └── main.ts         # Application entry point
├── prisma/
│   ├── schema.prisma   # Database schema (Prisma ORM)
│   └── migrations/     # Database migrations
└── package.json        # Dependencies & scripts
```

## Key Features

### 🔐 Shared Authentication
- JWT-based authentication system
- Role-based access control (User, Admin, SuperAdmin)
- Used by all frontend modules (Learning Platform, Risk Assessment, etc.)

### 📚 Learning Platform APIs
- Course catalog management
- Enrollment system
- Progress tracking
- Module content delivery
- Admin management

### 🔧 Extensibility
The backend is designed to be modular. To add a new module:

1. Create a new folder in `src/` (e.g., `src/risk-assessment/`)
2. Add your module to `app.module.ts`
3. Define your routes and controllers
4. Update Prisma schema if needed

## Running the Backend

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```

4. **Seed initial data (optional):**
   ```bash
   npm run prisma:seed
   ```

5. **Start development server:**
   ```bash
   npm run start:dev
   ```

The backend will run on: **http://localhost:3001**

API Documentation (Swagger): **http://localhost:3001/api/docs**

## Environment Variables

Key environment variables in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dpdp_db"
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="7d"
PORT=3001
```

## API Endpoints

### Authentication (Shared)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Learning Platform
- `GET /api/catalog/courses` - List all courses
- `GET /api/catalog/paths` - List learning paths
- `POST /api/learning/enrollments` - Enroll in course
- `GET /api/learning/enrollments` - Get user enrollments
- `GET /api/learning/progress` - Get learning progress

### Admin
- `POST /api/admin/courses` - Create course
- `PATCH /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course
- (Full admin endpoints in Swagger docs)

## Adding New Modules

### Example: Adding Risk Assessment Module

1. **Create module structure:**
   ```bash
   cd src
   mkdir risk-assessment
   cd risk-assessment
   ```

2. **Create files:**
   ```typescript
   // risk-assessment.module.ts
   import { Module } from '@nestjs/common';
   import { RiskAssessmentController } from './risk-assessment.controller';
   import { RiskAssessmentService } from './risk-assessment.service';

   @Module({
     controllers: [RiskAssessmentController],
     providers: [RiskAssessmentService],
   })
   export class RiskAssessmentModule {}
   ```

3. **Register in app.module.ts:**
   ```typescript
   import { RiskAssessmentModule } from './risk-assessment/risk-assessment.module';

   @Module({
     imports: [
       // ... existing modules
       RiskAssessmentModule,
     ],
   })
   export class AppModule {}
   ```

4. **Update Prisma schema if needed:**
   ```prisma
   model RiskAssessment {
     id        String   @id @default(uuid())
     userId    String?
     orgName   String
     results   Json
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

5. **Run migration:**
   ```bash
   npm run prisma:migrate
   ```

## Database Schema

Uses **Prisma ORM** with PostgreSQL. Key models:

- `User` - User accounts (shared across all modules)
- `LearningDomain` - Learning domains/categories
- `LearningPath` - Structured learning paths
- `Course` - Individual courses
- `Module` - Course modules
- `Enrollment` - User course enrollments
- `Progress` - Learning progress tracking

See `prisma/schema.prisma` for full schema.

## Frontend Integration

All frontend modules connect to this backend:

```typescript
// Example: src/shared/auth/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm run start:prod
   ```

3. Use a process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start dist/main.js --name dpdp-backend
   ```

4. Configure reverse proxy (nginx/Apache) to route to port 3001

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Development Tips

- **Hot reload:** Changes auto-reload in dev mode
- **Swagger docs:** Access API docs at `/api/docs`
- **Prisma Studio:** Visual database editor: `npm run prisma:studio`
- **Database GUI:** Use at http://localhost:5555

## Folder Structure Best Practices

Each module should follow NestJS conventions:

```
module-name/
├── dto/                    # Data Transfer Objects
│   ├── create-*.dto.ts
│   └── update-*.dto.ts
├── entities/               # Database entities (optional)
├── module-name.controller.ts
├── module-name.service.ts
└── module-name.module.ts
```

## Contributing

When adding new features:

1. Create feature branch
2. Add endpoints to appropriate module
3. Update Prisma schema if needed
4. Run migrations
5. Test with Swagger/Postman
6. Update this README if adding major features

## Future Modules Support

This backend is designed to support:

- ✅ Learning Platform
- ✅ Risk Assessment (ready to integrate)
- 📋 Compliance Tracking
- 📊 Analytics Dashboard
- 🔔 Notification System
- 👥 Team Management
- And more...

Simply add new modules in `src/` and register them in `app.module.ts`!

## Troubleshooting

### Database connection issues
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify database exists

### Port already in use
- Change `PORT` in `.env`
- Or kill process on port 3001:
  ```bash
  # Windows
  netstat -ano | findstr :3001
  taskkill /PID <PID> /F
  
  # Linux/Mac
  lsof -ti:3001 | xargs kill -9
  ```

### Prisma migration errors
- Reset database: `npm run prisma:migrate reset`
- Re-run migrations: `npm run prisma:migrate`

## Support

For issues or questions:
- Check Swagger docs: http://localhost:3001/api/docs
- Review NestJS documentation: https://docs.nestjs.com
- Check Prisma docs: https://www.prisma.io/docs

---

**Last Updated:** February 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
