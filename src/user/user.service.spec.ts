import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './user.entity';
import { GeocodingService } from './geocoding.service';
import { JwtService } from '@nestjs/jwt';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Repository, Connection } from 'typeorm';
import { CreateUserDto } from './dtos/create-user.dto';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;
  let geocodingService: GeocodingService;
  let jwtService: JwtService;
  let connection: Connection;

  // Mock data for testing
  const mockUser = {
    id: 1,
    name: 'test',
    email: 'test@test.com',
    latitude: 29.9,
    longitude: 31.2,
    city: 'Cairo',
    created_at: new Date(),
  };

  const mockCreateUserDto: CreateUserDto = {
    name: 'test',
    email: 'test@test.com',
    latitude: 29.9,
    longitude: 31.2,
  };

  const mockLocationInfo = {
    address: 'Test Address',
    city: 'Cairo',
    country: 'Egypt',
  };

  // Create a fresh mock query runner to simulate transaction behavior
  let mockQueryRunner: any;

  beforeEach(async () => {
    // Reinitialize the query runner for isolation between tests
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn().mockResolvedValue(mockUser),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: GeocodingService,
          useValue: {
            reverseGeocode: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: Connection,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    geocodingService = module.get<GeocodingService>(GeocodingService);
    jwtService = module.get<JwtService>(JwtService);
    connection = module.get<Connection>(Connection);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return user details by ID', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);

      const result = await service.findOne(1);
      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['name', 'email', 'city'],
      });
    });

    it('should throw an exception if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      // Use the query runner's save method (already mocked to resolve with mockUser)
      jest
        .spyOn(geocodingService, 'reverseGeocode')
        .mockResolvedValue(mockLocationInfo);
      jest.spyOn(jwtService, 'sign').mockReturnValue('test-token');

      const result = await service.create(mockCreateUserDto);

      expect(result).toEqual({ user: mockUser, token: 'test-token' });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
      });
      expect(geocodingService.reverseGeocode).toHaveBeenCalledWith(
        mockCreateUserDto.latitude,
        mockCreateUserDto.longitude,
      );
      expect(userRepository.create).toHaveBeenCalledWith({
        ...mockCreateUserDto,
        city: mockLocationInfo.city,
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(mockUser);
      expect(jwtService.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        expect.any(Object),
      );
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should handle geocoding service failure', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(geocodingService, 'reverseGeocode')
        .mockRejectedValue(new Error('Geocoding service unavailable'));

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        'Geocoding service unavailable',
      );
    });

    it('should handle database save failure', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(geocodingService, 'reverseGeocode')
        .mockResolvedValue(mockLocationInfo);
      // Override queryRunner.manager.save to reject with a database error
      jest
        .spyOn(mockQueryRunner.manager, 'save')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        'Database error',
      );
    });

    it('should validate JWT token generation', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(geocodingService, 'reverseGeocode')
        .mockResolvedValue(mockLocationInfo);
      // Ensure the save operation succeeds for this test
      jest.spyOn(mockQueryRunner.manager, 'save').mockResolvedValue(mockUser);
      // Override jwtService.sign to throw a JWT signing error
      jest.spyOn(jwtService, 'sign').mockImplementation(() => {
        throw new Error('JWT signing error');
      });

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        'JWT signing error',
      );
    });
  });

  it('should throw an exception if email already exists', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

    await expect(service.create(mockCreateUserDto)).rejects.toThrow(
      new HttpException('Email already exists', HttpStatus.BAD_REQUEST),
    );
  });

  it('should throw an exception if location is not in Egypt', async () => {
    const nonEgyptLocation = {
      address: 'Test Address',
      city: 'London',
      country: 'United Kingdom',
    };

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
    jest
      .spyOn(geocodingService, 'reverseGeocode')
      .mockResolvedValue(nonEgyptLocation);

    await expect(service.create(mockCreateUserDto)).rejects.toThrow(
      'User location must be within Egypt.',
    );
  });
});
