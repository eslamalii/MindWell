import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ResponseSchemas } from './response-schemas';

/**
 * Decorator for common API responses
 */
export const ApiCommonResponses = {
  /**
   * User created successfully response
   */
  userCreated: () =>
    applyDecorators(
      ApiResponse({
        status: 201,
        description: 'User successfully created',
        schema: ResponseSchemas.User,
      }),
    ),

  /**
   * User profile retrieved successfully response
   */
  userProfile: () =>
    applyDecorators(
      ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
        schema: ResponseSchemas.UserProfile,
      }),
    ),

  /**
   * Email already exists error response
   */
  emailExists: () =>
    applyDecorators(
      ApiResponse({
        status: 400,
        description: 'Bad request - Email already exists',
        schema: ResponseSchemas.EmailExists,
      }),
    ),

  /**
   * Location not in Egypt error response
   */
  locationError: () =>
    applyDecorators(
      ApiResponse({
        status: 403,
        description: 'Forbidden - Location not in Egypt',
        schema: ResponseSchemas.LocationError,
      }),
    ),

  /**
   * User not found error response
   */
  userNotFound: () =>
    applyDecorators(
      ApiResponse({
        status: 404,
        description: 'User not found',
        schema: ResponseSchemas.NotFound,
      }),
    ),

  /**
   * Health check response
   */
  healthCheck: () =>
    applyDecorators(
      ApiResponse({
        status: 200,
        description: 'Health check successful',
        schema: ResponseSchemas.HealthCheck,
      }),
    ),
};
