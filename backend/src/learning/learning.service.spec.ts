import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { LearningService } from './learning.service';
import { DatabaseService } from '../database/database.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateModuleProgressDto } from './dto/update-module-progress.dto';

describe('LearningService', () => {
  let service: LearningService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    query: jest.fn(),
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<LearningService>(LearningService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEnrollment', () => {
    it('should create enrollment successfully', async () => {
      const dto: CreateEnrollmentDto = {
        courseId: '456',
        organizationId: null,
      };

      const mockEnrollment = {
        id: '789',
        user_id: '123',
        course_id: '456',
        organization_id: null,
        enrolled_at: new Date(),
        course: { id: '456', name: 'Course 1' },
      };

      mockDatabaseService.transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn()
            .mockResolvedValueOnce({ rows: [{ id: '456' }] })       // Course exists check
            .mockResolvedValueOnce({ rows: [] })                     // Enrollment exists check
            .mockResolvedValueOnce({ rows: [{ id: '789' }] })       // INSERT enrollment
            .mockResolvedValueOnce({ rows: [mockEnrollment] }),      // SELECT with JOINs
        };
        return callback(mockClient);
      });

      const result = await service.createEnrollment('123', dto);

      expect(result).toEqual(mockEnrollment);
      expect(mockDatabaseService.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if course not found', async () => {
      const dto: CreateEnrollmentDto = {
        courseId: 'nonexistent',
        organizationId: null,
      };

      mockDatabaseService.transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockResolvedValueOnce({ rows: [] }),
        };
        return callback(mockClient);
      });

      await expect(service.createEnrollment('123', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if already enrolled', async () => {
      const dto: CreateEnrollmentDto = {
        courseId: '456',
        organizationId: null,
      };

      mockDatabaseService.transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn()
            .mockResolvedValueOnce({ rows: [{ id: '456' }] })
            .mockResolvedValueOnce({ rows: [{ id: '789' }] }),
        };
        return callback(mockClient);
      });

      await expect(service.createEnrollment('123', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getUserEnrollments', () => {
    it('should return user enrollments with nested data', async () => {
      const mockEnrollments = [
        {
          id: '1',
          user_id: '123',
          course_id: '456',
          enrolled_at: new Date(),
          course: {
            id: '456',
            name: 'Course 1',
            modules: [],
          },
        },
      ];

      mockDatabaseService.query.mockResolvedValueOnce({ rows: mockEnrollments });

      const result = await service.getUserEnrollments('123');

      expect(result).toEqual(mockEnrollments);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE e.user_id = $1'),
        ['123'],
      );
    });
  });

  describe('getModuleProgress', () => {
    it('should return existing progress', async () => {
      const mockProgress = {
        id: '1',
        user_id: '123',
        module_id: '456',
        progress_percent: 50,
        completed_at: null,
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockProgress] });

      const result = await service.getModuleProgress('123', '456');

      expect(result).toEqual(mockProgress);
    });

    it('should create new progress if not exists', async () => {
      const newProgress = {
        id: '1',
        user_id: '123',
        module_id: '456',
        progress_percent: 0,
        started_at: new Date(),
      };

      mockDatabaseService.query
        .mockResolvedValueOnce({ rows: [] })                           // SELECT (no existing)
        .mockResolvedValueOnce({ rows: [{ id: 'new-uuid' }] })        // INSERT RETURNING id
        .mockResolvedValueOnce({ rows: [newProgress] });               // SELECT with JOINs

      const result = await service.getModuleProgress('123', '456');

      expect(result).toEqual(newProgress);
      expect(mockDatabaseService.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('updateModuleProgress', () => {
    it('should update progress and log event', async () => {
      const dto: UpdateModuleProgressDto = {
        progressPercent: 75,
        lastPosition: 100,
      };

      const mockUpdated = {
        id: '1',
        user_id: '123',
        module_id: '456',
        progress_percent: 75,
        completed_at: null,
      };

      mockDatabaseService.transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn()
            .mockResolvedValueOnce({ rows: [{ progress_percent: 50 }] })
            .mockResolvedValueOnce({ rows: [mockUpdated] })
            .mockResolvedValueOnce({ rows: [{}] }),
        };
        return callback(mockClient);
      });

      const result = await service.updateModuleProgress('123', '456', dto);

      expect(result).toEqual(mockUpdated);
      expect(mockDatabaseService.transaction).toHaveBeenCalled();
    });

    it('should mark as completed when progress >= 95', async () => {
      const dto: UpdateModuleProgressDto = {
        progressPercent: 100,
        lastPosition: 200,
      };

      const mockUpdated = {
        id: '1',
        user_id: '123',
        module_id: '456',
        progress_percent: 100,
        completed_at: expect.any(Date),
      };

      mockDatabaseService.transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn()
            .mockResolvedValueOnce({ rows: [{ progress_percent: 90, completed_at: null }] })
            .mockResolvedValueOnce({ rows: [mockUpdated] })
            .mockResolvedValueOnce({ rows: [{}] }),
        };
        return callback(mockClient);
      });

      const result = await service.updateModuleProgress('123', '456', dto);

      expect(result.completed_at).toBeTruthy();
    });
  });

  describe('getMyLearningDashboard', () => {
    it('should return dashboard with stats', async () => {
      const mockDashboard = {
        enrollments: [],
        progressRecords: [],
        stats: {
          totalEnrolled: 5,
          completedModules: 10,
          inProgressModules: 3,
        },
      };

      mockDatabaseService.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.getMyLearningDashboard('123');

      expect(result).toHaveProperty('enrollments');
      expect(result).toHaveProperty('progressRecords');
      expect(result).toHaveProperty('stats');
    });
  });
});
