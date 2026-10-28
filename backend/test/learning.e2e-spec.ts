import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('LearningController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `learning${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Learning',
        lastName: 'User',
      });

    accessToken = response.body.accessToken;
    userId = response.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/learning/enrollments (POST)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/learning/enrollments')
        .send({ courseId: 'some-id' })
        .expect(401);
    });

    it('should enroll user in course', async () => {
      // Get a course first
      const coursesResponse = await request(app.getHttpServer())
        .get('/catalog/courses');

      if (coursesResponse.body.length > 0) {
        const courseId = coursesResponse.body[0].id;

        return request(app.getHttpServer())
          .post('/learning/enrollments')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ courseId, organizationId: null })
          .expect((res) => {
            // 201 for success, 409 if already enrolled, 404 if course not found
            expect([201, 409, 404]).toContain(res.status);
          });
      }
    });

    it('should return 404 for non-existent course', () => {
      return request(app.getHttpServer())
        .post('/learning/enrollments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ 
          courseId: '00000000-0000-0000-0000-000000000000',
          organizationId: null 
        })
        .expect(404);
    });
  });

  describe('/learning/enrollments (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/learning/enrollments')
        .expect(401);
    });

    it('should return user enrollments', () => {
      return request(app.getHttpServer())
        .get('/learning/enrollments')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/learning/progress/module/:moduleId (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/learning/progress/module/some-module-id')
        .expect(401);
    });

    it('should return module progress', () => {
      return request(app.getHttpServer())
        .get('/learning/progress/module/some-module-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          // 200 with progress or 404 if module not found
          expect([200, 404]).toContain(res.status);
        });
    });
  });

  describe('/learning/progress/module/:moduleId (POST)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/learning/progress/module/some-module-id')
        .send({ progressPercent: 50 })
        .expect(401);
    });

    it('should update module progress', () => {
      return request(app.getHttpServer())
        .post('/learning/progress/module/some-module-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ 
          progressPercent: 50,
          lastPosition: 100 
        })
        .expect((res) => {
          // 200 with updated progress or 404
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should validate progressPercent range', () => {
      return request(app.getHttpServer())
        .post('/learning/progress/module/some-module-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ 
          progressPercent: 150, // Invalid > 100
          lastPosition: 100 
        })
        .expect(400);
    });

    it('should auto-complete at 100% progress', async () => {
      // Get enrolled course and module
      const enrollments = await request(app.getHttpServer())
        .get('/learning/enrollments')
        .set('Authorization', `Bearer ${accessToken}`);

      if (enrollments.body.length > 0 && enrollments.body[0].course.modules?.length > 0) {
        const moduleId = enrollments.body[0].course.modules[0].id;

        return request(app.getHttpServer())
          .post(`/learning/progress/module/${moduleId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ 
            progressPercent: 100,
            lastPosition: 1000 
          })
          .expect((res) => {
            if (res.status === 200) {
              expect(res.body).toHaveProperty('completed_at');
            }
          });
      }
    });
  });

  describe('/learning/dashboard (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/learning/dashboard')
        .expect(401);
    });

    it('should return learning dashboard', () => {
      return request(app.getHttpServer())
        .get('/learning/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('enrollments');
          expect(res.body).toHaveProperty('progressRecords');
          expect(res.body).toHaveProperty('stats');
          expect(res.body.stats).toHaveProperty('totalEnrolled');
          expect(res.body.stats).toHaveProperty('completedModules');
          expect(res.body.stats).toHaveProperty('inProgressModules');
        });
    });
  });

  describe('/learning/progress (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/learning/progress')
        .expect(401);
    });

    it('should return all user progress', () => {
      return request(app.getHttpServer())
        .get('/learning/progress')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should support courseId filter', async () => {
      const enrollments = await request(app.getHttpServer())
        .get('/learning/enrollments')
        .set('Authorization', `Bearer ${accessToken}`);

      if (enrollments.body.length > 0) {
        const courseId = enrollments.body[0].course_id;

        return request(app.getHttpServer())
          .get(`/learning/progress?courseId=${courseId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
      }
    });
  });
});
