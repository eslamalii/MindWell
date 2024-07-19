// src/user/user.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import request from 'supertest';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthGuard } from '../common/guards/auth.guard';
import { Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let token: string;

  const mockUserService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        JwtService,
        Reflector,
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest.fn((context) => {
          const request = context.switchToHttp().getRequest();
          const token =
            request.headers.authorization?.split(' ')[1] ||
            request.cookies['token'];
          if (token) {
            try {
              const decodedToken = jwtService.verify(token, {
                secret: process.env.JWT_SECRET,
              });
              request.user = decodedToken;
              return true;
            } catch (error) {
              throw new UnauthorizedException('Invalid token');
            }
          }
          throw new UnauthorizedException('No token provided');
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    jwtService = moduleFixture.get<JwtService>(JwtService);
    token = jwtService.sign(
      { userId: 2 },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '2h',
      },
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/user/signup (POST)', async () => {
    const createUserDto = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      latitude: 30.0444,
      longitude: 31.2357,
    };
    const userResponse = {
      ...createUserDto,
      id: 1,
    };

    mockUserService.create.mockResolvedValue(userResponse);

    return request(app.getHttpServer())
      .post('/user/signup')
      .send(createUserDto)
      .expect(HttpStatus.CREATED)
      .expect(userResponse);
  });

  describe('GET /user', () => {
    it('should return user profile with 200 status', async () => {
      const userId = 4;
      const userProfile = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        city: 'Cairo',
      };

      mockUserService.findOne.mockResolvedValue(userProfile);

      return request(app.getHttpServer())
        .get(`/user?user_id=${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK)
        .expect(userProfile);
    });

    it('should return 401 if no token is provided', async () => {
      const userId = 4;

      return request(app.getHttpServer())
        .get(`/user?user_id=${userId}`)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No token provided',
          error: 'Unauthorized',
        });
    });

    it('should return 401 if invalid token is provided', async () => {
      const userId = 2;
      const invalidToken = 'invalid.token.here';

      return request(app.getHttpServer())
        .get(`/user?user_id=${userId}`)
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
          error: 'Unauthorized',
        });
    });
  });
});
