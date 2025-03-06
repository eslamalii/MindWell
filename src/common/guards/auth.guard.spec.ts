import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflectorMock: { get: jest.Mock };

  beforeEach(() => {
    // Create a dummy reflector that returns false for bypassGuard
    reflectorMock = { get: jest.fn().mockReturnValue(false) };
    guard = new AuthGuard(reflectorMock as unknown as Reflector);
    jest.clearAllMocks();
  });

  it('should return true if request has an authenticated user', () => {
    (jwt.verify as jest.Mock).mockReturnValue({ userId: '123' });

    const mockRequest = {
      headers: {
        authorization: 'Bearer token',
      },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest as any,
      }),
      getHandler: () => {},
    };

    expect(guard.canActivate(context as ExecutionContext)).toBeTruthy();
  });

  it('should throw UnauthorizedException if request does not have an authenticated user', () => {
    const dummyHandler = () => {};
    const context: Partial<ExecutionContext> = {
      switchToHttp: () => ({
        getRequest: <T = any>(): T =>
          ({
            headers: {},
            cookies: {},
          }) as unknown as T,
        getResponse: <T = any>(): T => ({}) as unknown as T,
        getNext: <T = any>(): T => ({}) as unknown as T,
      }),
      getHandler: () => dummyHandler,
    };

    // Since there is no token, we expect an exception with message 'No token provided'
    expect(() => guard.canActivate(context as ExecutionContext)).toThrow(
      new UnauthorizedException('No token provided'),
    );
  });
});
