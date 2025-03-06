import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { ArgumentsHost } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockArgumentsHost: Partial<ArgumentsHost>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: <T = any>(): T =>
          ({
            status: statusMock,
            json: jsonMock,
          }) as unknown as T,
        getRequest: <T = any>(): T => ({}) as unknown as T,
        getNext: <T = any>(): T => ({}) as unknown as T,
      }),
    };
  });

  it('should catch an HttpException and respond with proper status and json', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockArgumentsHost as ArgumentsHost);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
      }),
    );
  });
});
