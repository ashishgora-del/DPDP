import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { DatabaseService } from '../database/database.service';
import { CreateDomainDto } from './dto/domain.dto';
import { CreateModuleDto } from './dto/module.dto';
import { ContentBlockTypeEnum } from './dto/content-block.dto';

describe('AdminService', () => {
  let service: AdminService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    query: jest.fn(),
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDomain', () => {
    it('should create a new domain', async () => {
      const dto: CreateDomainDto = {
        name: 'Privacy',
        slug: 'privacy',
        description: 'Privacy domain',
        icon: 'icon',
      };

      const mockDomain = {
        id: '1',
        ...dto,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockDomain] });

      const result = await service.createDomain(dto);

      expect(result).toEqual(mockDomain);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO domains'),
        [dto.name, dto.slug, dto.description, dto.icon],
      );
    });
  });

  describe('updateDomain', () => {
    it('should update domain with dynamic fields', async () => {
      const dto = { name: 'Updated Privacy' };
      const mockDomain = {
        id: '1',
        name: 'Updated Privacy',
        slug: 'privacy',
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockDomain] });

      const result = await service.updateDomain('1', dto);

      expect(result).toEqual(mockDomain);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE domains SET'),
        expect.arrayContaining([dto.name, '1']),
      );
    });

    it('should throw NotFoundException if domain not found', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.updateDomain('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteDomain', () => {
    it('should delete domain', async () => {
      const mockDomain = {
        id: '1',
        name: 'Privacy',
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockDomain] });

      const result = await service.deleteDomain('1');

      expect(result).toEqual(mockDomain);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM domains'),
        ['1'],
      );
    });
  });

  describe('createModule', () => {
    it('should enforce first module as free', async () => {
      const dto: CreateModuleDto = {
        title: 'Module 1',
        slug: 'module-1',
        description: 'First module',
        courseId: '123',
        orderIndex: 0,
        estimatedDuration: 30,
        isFree: false, // Try to make it paid
      };

      const mockModule = {
        id: '1',
        ...dto,
        is_free: true, // Should be forced to true
        course_id: dto.courseId,
      };

      mockDatabaseService.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No modules yet
        .mockResolvedValueOnce({ rows: [mockModule] }) // Insert
        .mockResolvedValueOnce({ rows: [] }); // Course lookup

      const result = await service.createModule('user123', dto);

      expect(result.is_free).toBe(true);
    });

    it('should allow second module to be paid', async () => {
      const dto: CreateModuleDto = {
        title: 'Module 2',
        slug: 'module-2',
        description: 'Second module',
        courseId: '123',
        orderIndex: 1,
        estimatedDuration: 30,
        isFree: false,
      };

      const mockModule = {
        id: '2',
        ...dto,
        is_free: false,
        course_id: dto.courseId,
      };

      mockDatabaseService.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [mockModule] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.createModule('user123', dto);

      expect(result.is_free).toBe(false);
    });
  });

  describe('updateModule', () => {
    it('should prevent making first module paid', async () => {
      const dto = { isFree: false };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [{ id: '1', order_index: 0, is_free: true }],
      });

      await expect(service.updateModule('1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should allow updating non-first module', async () => {
      const dto = { title: 'Updated Module' };
      const mockModule = {
        id: '1',
        title: 'Updated Module',
        order_index: 1,
      };

      mockDatabaseService.query
        .mockResolvedValueOnce({ rows: [{ id: '1', order_index: 1 }] })
        .mockResolvedValueOnce({ rows: [mockModule] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.updateModule('1', dto);

      expect(result.title).toBe('Updated Module');
    });
  });

  describe('publishModule', () => {
    it('should publish module', async () => {
      const mockModule = {
        id: '1',
        is_published: true,
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockModule] });

      const result = await service.publishModule('1');

      expect(result.is_published).toBe(true);
    });
  });

  describe('getAllPathsAdmin', () => {
    it('should return paths with nested domain and courses', async () => {
      const mockPaths = [
        {
          id: '1',
          name: 'Path 1',
          domain: { id: '1', name: 'Privacy' },
          courses: [{ id: '1', name: 'Course 1' }],
        },
      ];

      mockDatabaseService.query.mockResolvedValueOnce({ rows: mockPaths });

      const result = await service.getAllPathsAdmin();

      expect(result).toEqual(mockPaths);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('json_agg'),
        [],
      );
    });
  });

  describe('getAllCoursesAdmin', () => {
    it('should return all courses when no pathId', async () => {
      const mockCourses = [
        {
          id: '1',
          name: 'Course 1',
          path: { id: '1', name: 'Path 1', domain: {} },
          modules: [],
        },
      ];

      mockDatabaseService.query.mockResolvedValueOnce({ rows: mockCourses });

      const result = await service.getAllCoursesAdmin();

      expect(result).toEqual(mockCourses);
    });

    it('should filter by pathId when provided', async () => {
      const mockCourses = [
        {
          id: '1',
          name: 'Course 1',
          path_id: 'path123',
        },
      ];

      mockDatabaseService.query.mockResolvedValueOnce({ rows: mockCourses });

      await service.getAllCoursesAdmin('path123');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.path_id = $1'),
        ['path123'],
      );
    });
  });

  describe('createContentBlock', () => {
    it('should create content block with metadata', async () => {
      const dto = {
        moduleId: '123',
        type: ContentBlockTypeEnum.TEXT,
        orderIndex: 0,
        content: 'Content here',
        metadata: { fontSize: 14 },
      };

      const mockBlock = {
        id: '1',
        module_id: '123',
        type: ContentBlockTypeEnum.TEXT,
        order_index: 0,
        content: 'Content here',
        metadata: { fontSize: 14 },
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockBlock] });

      const result = await service.createContentBlock(dto);

      expect(result).toEqual(mockBlock);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO content_blocks'),
        expect.arrayContaining([dto.moduleId, dto.type, dto.orderIndex, dto.content, JSON.stringify(dto.metadata)]),
      );
    });
  });
});
