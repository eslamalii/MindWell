import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './user.entity';
import { GeocodingService } from './geocoding.service';
import { JwtService } from '@nestjs/jwt';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { Response } from 'express';

describe('UserService', () => {
  let userService: UserService;
  let userRepo: Repository<User>;
  let geoService: GeocodingService;
  let jwtService: JwtService;
  let mockRes: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useClass: Repository },
        { provide: GeocodingService, useValue: { reverseGeocode: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    geoService = module.get<GeocodingService>(GeocodingService);
    jwtService = module.get<JwtService>(JwtService);

    mockRes = {
      cookie: jest.fn(),
    };
  });

  describe('findOne', () => {
    it('should return user details by ID', async () => {
      const mockUser = {
        name: 'test',
        email: 'test@test.com',
        city: 'El Maadi',
      };
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as User);

      const result = await userService.findOne(1);
      expect(result).toEqual(mockUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['name', 'email', 'city'],
      });
    });

    it('should throw an error if user not found', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      await expect(userService.findOne(1)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'test',
        email: 'test@test.com',
        latitude: 29.970089,
        longitude: 31.243959,
      };
      const locationInfo = {
        items: [{ address: { countryName: 'Egypt', city: 'El Maadi' } }],
      };
      const mockUser: User = {
        id: 1,
        ...createUserDto,
        city: 'El Maadi',
        created_at: new Date(),
      };

      jest.spyOn(userRepo, 'find').mockResolvedValue([]);
      jest
        .spyOn(geoService, 'reverseGeocode')
        .mockResolvedValue(locationInfo as any);
      jest.spyOn(userRepo, 'create').mockReturnValue(mockUser);
      jest.spyOn(userRepo, 'save').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue('jwt-token');

      const result = await userService.create(createUserDto, mockRes as any);
      expect(result).toEqual(mockUser);
      expect(userRepo.find).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(geoService.reverseGeocode).toHaveBeenCalledWith(
        createUserDto.latitude,
        createUserDto.longitude,
      );
      expect(userRepo.create).toHaveBeenCalledWith({
        ...createUserDto,
        city: 'El Maadi',
      });
      expect(userRepo.save).toHaveBeenCalledWith(mockUser);
      expect(jwtService.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        { secret: 'shezlong-task', expiresIn: '2h' },
      );
      expect(mockRes.cookie).toHaveBeenCalledWith('token', 'jwt-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    });

    it('should throw an error if email already exists', async () => {
      jest
        .spyOn(userRepo, 'find')
        .mockResolvedValue([{ email: 'test@test.com' }] as User[]);

      const createUserDto: CreateUserDto = {
        name: 'test',
        email: 'test@test.com',
        latitude: 29.970089,
        longitude: 31.243959,
      };

      await expect(
        userService.create(createUserDto, mockRes as any),
      ).rejects.toThrow(
        new HttpException('Email already exists', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw an error if location is not in Egypt', async () => {
      const locationInfo = {
        items: [{ address: { countryName: 'USA', city: 'New York' } }],
      };
      jest.spyOn(userRepo, 'find').mockResolvedValue([]);
      jest
        .spyOn(geoService, 'reverseGeocode')
        .mockResolvedValue(locationInfo as any);

      const createUserDto: CreateUserDto = {
        name: 'test',
        email: 'test@test.com',
        latitude: 29.970089,
        longitude: 31.243959,
      };

      await expect(
        userService.create(createUserDto, mockRes as any),
      ).rejects.toThrow(
        new HttpException(
          'User location must be within Egypt.',
          HttpStatus.FORBIDDEN,
        ),
      );
    });
  });
});
