import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;
  let mockRes: Partial<Response>;

  beforeEach(async () => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user and return it', async () => {
      const dto = {
        name: 'test',
        email: 'test@test.com',
        latitude: 29.970089,
        longitude: 31.243959,
      };

      const result = {
        id: 7,
        name: 'test',
        email: 'test@test.com',
        latitude: 29.970089,
        longitude: 31.243959,
        city: 'El Maadi',
        created_at: '2024-07-20T00:16:50.427Z',
      };

      jest.spyOn(service, 'create').mockResolvedValue(result as any);

      await controller.signup(dto, mockRes as any);

      expect(service.create).toHaveBeenCalledWith(dto, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith(result);
    });

    it('should handle errors when creating a user', async () => {
      const dto = {
        name: 'test',
        email: 'test@test.com',
        latitude: 29.970089,
        longitude: 31.243959,
      };
      const error = new Error('User creation failed');
      jest.spyOn(service, 'create').mockRejectedValue(error);

      await controller.signup(dto, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({ message: error.message });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const result = { name: 'John', email: 'john@example.com', city: 'Cairo' };
      jest.spyOn(service, 'findOne').mockResolvedValue(result as any);

      const userId = 1;
      const response = await controller.getProfile(userId);

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(response).toEqual(result);
    });

    it('should handle errors when fetching user profile', async () => {
      const userId = 1;
      const error = new Error('User not found');
      jest.spyOn(service, 'findOne').mockRejectedValue(error);

      await expect(controller.getProfile(userId)).rejects.toThrow(error);
    });
  });
});
