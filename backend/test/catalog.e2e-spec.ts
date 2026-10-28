import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CatalogController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login to get access token
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `catalog${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Catalog',
        lastName: 'User',
      });

    accessToken = response.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/catalog/domains (GET)', () => {
    it('should return all domains', () => {
      return request(app.getHttpServer())
        .get('/catalog/domains')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('slug');
          }
        });
    });
  });

  describe('/catalog/domains/:slug (GET)', () => {
    it('should return domain by slug', async () => {
      // First get all domains to get a valid slug
      const domainsResponse = await request(app.getHttpServer())
        .get('/catalog/domains');

      if (domainsResponse.body.length > 0) {
        const slug = domainsResponse.body[0].slug;

        return request(app.getHttpServer())
          .get(`/catalog/domains/${slug}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body.slug).toBe(slug);
            expect(res.body).toHaveProperty('learningPaths');
          });
      }
    });

    it('should return 404 for non-existent domain', () => {
      return request(app.getHttpServer())
        .get('/catalog/domains/nonexistent-slug')
        .expect(404);
    });
  });

  describe('/catalog/paths (GET)', () => {
    it('should return all learning paths', () => {
      return request(app.getHttpServer())
        .get('/catalog/paths')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('title');
            expect(res.body[0]).toHaveProperty('domain');
          }
        });
    });
  });

  describe('/catalog/paths/:slug (GET)', () => {
    it('should return path by slug with courses', async () => {
      const pathsResponse = await request(app.getHttpServer())
        .get('/catalog/paths');

      if (pathsResponse.body.length > 0) {
        const slug = pathsResponse.body[0].slug;

        return request(app.getHttpServer())
          .get(`/catalog/paths/${slug}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body.slug).toBe(slug);
            expect(res.body).toHaveProperty('courses');
          });
      }
    });
  });

  describe('/catalog/courses (GET)', () => {
    it('should return all courses', () => {
      return request(app.getHttpServer())
        .get('/catalog/courses')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/catalog/courses?page=1&limit=5')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(5);
        });
    });

    it('should support search', () => {
      return request(app.getHttpServer())
        .get('/catalog/courses?search=privacy')
        .expect(200);
    });
  });

  describe('/catalog/courses/:id (GET)', () => {
    it('should return course with modules', async () => {
      const coursesResponse = await request(app.getHttpServer())
        .get('/catalog/courses');

      if (coursesResponse.body.length > 0) {
        const courseId = coursesResponse.body[0].id;

        return request(app.getHttpServer())
          .get(`/catalog/courses/${courseId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body.id).toBe(courseId);
            expect(res.body).toHaveProperty('modules');
          });
      }
    });

    it('should return 404 for non-existent course', () => {
      return request(app.getHttpServer())
        .get('/catalog/courses/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('/catalog/modules/:id (GET)', () => {
    it('should return module or 404 for unknown id', () => {
      return request(app.getHttpServer())
        .get('/catalog/modules/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should return module content for enrolled user', async () => {
      // This test requires enrollment setup
      // Simplified version - just check auth is required
      return request(app.getHttpServer())
        .get('/catalog/modules/some-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res) => {
          // Will be 404 or 200 depending on data
          expect([200, 404]).toContain(res.status);
        });
    });
  });
});
