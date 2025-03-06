import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  // Sample user data to be used in tests
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    latitude: 30.0444,
    longitude: 31.2357,
    city: 'Cairo',
    created_at: new Date(),
  };

  // Create a mock implementation for UserService
  const mockUserService = {
    // Note: service now returns an object with both user and token
    create: jest.fn(),
  };

  // We'll create a fresh mock for the response object for each test.
  let mockRes: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);

    // Initialize a mock response object with chainable methods.
    mockRes = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a user successfully', async () => {
      // Arrange: Simulate successful user creation by returning an object with user and token.
      const token = 'sample-token';
      const serviceResponse = { user: mockUser, token };
      mockUserService.create.mockResolvedValue(serviceResponse);

      // Act: Call signup with both body and the mock response.
      await userController.signup(mockUser, mockRes as Response);

      // Assert: Ensure the service was called and the response object methods were called correctly.
      expect(mockUserService.create).toHaveBeenCalledWith(mockUser);
      expect(mockRes.cookie).toHaveBeenCalledWith('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it('should handle errors when creation fails', async () => {
      // Arrange: Set up the service to throw an error.
      const error = new HttpException('Error', HttpStatus.BAD_REQUEST);
      mockUserService.create.mockRejectedValue(error);

      // Act: Call signup with both body and the mock response.
      await userController.signup(mockUser, mockRes as Response);

      // Assert: Verify that the error response is sent.
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({ message: error.message });
    });
  });
});
