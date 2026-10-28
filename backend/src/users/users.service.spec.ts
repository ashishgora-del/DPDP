import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    query: jest.fn(),
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockUser = {
        id: '123',
        email: createUserDto.email,
        password_hash: createUserDto.password,
        first_name: createUserDto.firstName,
        last_name: createUserDto.lastName,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [] }); // Email check
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockUser] }); // Insert

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.query).toHaveBeenCalledTimes(2);
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [{ id: '123', email: createUserDto.email }],
      });

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@example.com'],
      );
    });

    it('should return null if user not found', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await service.findById('123');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithRoles', () => {
    it('should return user with roles', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
        roles: [{ id: '1', name: 'user' }],
      };

      mockDatabaseService.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await service.findByIdWithRoles('123');

      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('json_agg'),
        ['123'],
      );
    });
  });

  describe('assignRole', () => {
    it('should assign a role to user', async () => {
      const mockRole = { id: '1', name: '1' };
      const mockUserRole = {
        user_id: '123',
        role_id: '1',
        assigned_at: new Date(),
      };

      mockDatabaseService.query
        .mockResolvedValueOnce({ rows: [mockRole] })      // SELECT role by name
        .mockResolvedValueOnce({ rows: [] })              // check existing user_role
        .mockResolvedValueOnce({ rows: [mockUserRole] }); // INSERT user_role

      const result = await service.assignRole('123', '1');

      expect(result).toEqual(mockUserRole);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_roles'),
        ['123', '1'],
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const mockUpdatedUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Updated Name',
        updated_at: new Date(),
      };

      mockDatabaseService.query
        .mockResolvedValueOnce({ rows: [{ id: '123' }] })    // findById
        .mockResolvedValueOnce({ rows: [mockUpdatedUser] }); // UPDATE RETURNING

      const result = await service.updateProfile('123', updateDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining(['Updated Name', '123']),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockDatabaseService.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.updateProfile('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });
});
