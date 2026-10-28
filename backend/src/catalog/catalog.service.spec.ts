import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { DatabaseService } from '../database/database.service';

describe('CatalogService', () => {
  let service: CatalogService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDomains', () => {
    it('should return all domains with nested data', async () => {
      const mockDomains = [
        {
          id: '1',
          name: 'Privacy',
          slug: 'privacy',
          description: 'Privacy domain',
          icon: 'icon',
          paths: [],
        },
      ];

      mockDatabaseService.query.mockResolvedValueOnce({ rows: mockDomains });

      const result = await service.getAllDomains();

      expect(result).toEqual(mockDomains);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [],
      );
    });
  });

  describe('getDomainBySlug', () => {
    it('should return domain by slug', async () => {
      const mockDomain = {
        id: '1',
        name: 'Privacy',
        slug: 'privacy',
        paths: [],
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockDomain] });

      const result = await service.getDomainBySlug('privacy');

      expect(result).toEqual(mockDomain);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE d.slug = $1'),
        ['privacy'],
      );
    });

    it('should throw NotFoundException if domain not found', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.getDomainBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllPaths', () => {
    it('should return all paths', async () => {
      const mockPaths = [
        {
          id: '1',
          name: 'Path 1',
          slug: 'path-1',
          domain: { id: '1', name: 'Privacy' },
          courses: [],
        },
      ];

      mockDatabaseService.query.mockResolvedValueOnce({ rows: mockPaths });

      const result = await service.getAllPaths();

      expect(result).toEqual(mockPaths);
    });
  });

  describe('getCourseById', () => {
    it('should return course with modules', async () => {
      const mockCourse = {
        id: '1',
        name: 'Course 1',
        slug: 'course-1',
        path: { id: '1', name: 'Path 1' },
        modules: [],
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockCourse] });

      const result = await service.getCourseById('1');

      expect(result).toEqual(mockCourse);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.id = $1'),
        ['1'],
      );
    });

    it('should throw NotFoundException if course not found', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.getCourseById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getModuleById', () => {
    it('should return module with content blocks', async () => {
      const mockModule = {
        id: '1',
        title: 'Module 1',
        slug: 'module-1',
        is_published: true,
        course: { id: '1', name: 'Course 1' },
        content_blocks: [],
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockModule] });

      const result = await service.getModuleById('1');

      expect(result).toEqual(mockModule);
    });

    it('should throw NotFoundException if module not found', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.getModuleById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkModuleAccess', () => {
    it('should return true for free module', async () => {
      const mockModule = {
        id: '1',
        is_free: true,
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockModule] });

      const result = await service.checkModuleAccess('1', '123');

      expect(result).toBe(true);
    });

    it('should return true if user is enrolled', async () => {
      const mockModule = {
        id: '1',
        is_free: false,
      };

      const mockEnrollment = {
        user_id: '123',
        course_id: '1',
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockModule] });
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockEnrollment] });

      const result = await service.checkModuleAccess('1', '123');

      expect(result).toBe(true);
    });

    it('should return false if user not enrolled in paid module', async () => {
      const mockModule = {
        id: '1',
        is_free: false,
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockModule] });
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.checkModuleAccess('1', '123');

      expect(result).toBe(false);
    });
  });
});
