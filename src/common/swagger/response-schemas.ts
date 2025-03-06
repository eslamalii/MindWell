import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

/**
 * Common response schemas for Swagger documentation
 */
export const ResponseSchemas = {
  User: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
        description: 'Unique identifier for the user',
      },
      name: {
        type: 'string',
        example: 'John Doe',
        description: 'Full name of the user',
      },
      email: {
        type: 'string',
        example: 'john@example.com',
        description: 'Email address of the user',
      },
      latitude: {
        type: 'number',
        format: 'float',
        example: 29.970089,
        description: 'Latitude coordinate of user location',
      },
      longitude: {
        type: 'number',
        format: 'float',
        example: 31.243959,
        description: 'Longitude coordinate of user location',
      },
      city: {
        type: 'string',
        example: 'Cairo',
        description: 'City name of the user location',
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2023-01-01T00:00:00.000Z',
        description: 'Date and time when the user was created',
      },
    },
    required: ['id', 'name', 'email', 'latitude', 'longitude', 'created_at'],
  } as SchemaObject,

  UserProfile: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'John Doe',
        description: 'Full name of the user',
      },
      email: {
        type: 'string',
        example: 'john@example.com',
        description: 'Email address of the user',
      },
      city: {
        type: 'string',
        example: 'Cairo',
        description: 'City name of the user location',
      },
    },
    required: ['name', 'email'],
  } as SchemaObject,

  Error: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Error message',
        description: 'Description of the error',
      },
      statusCode: {
        type: 'integer',
        example: 400,
        description: 'HTTP status code',
      },
    },
    required: ['message', 'statusCode'],
  } as SchemaObject,

  EmailExists: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Email already exists',
        description: 'Error message indicating the email is already registered',
      },
    },
    required: ['message'],
  } as SchemaObject,

  LocationError: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'User location must be within Egypt.',
        description: 'Error message indicating the location is not valid',
      },
    },
    required: ['message'],
  } as SchemaObject,

  NotFound: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'User not found',
        description:
          'Error message indicating the requested resource was not found',
      },
      statusCode: {
        type: 'integer',
        example: 404,
        description: 'HTTP status code',
      },
    },
    required: ['message', 'statusCode'],
  } as SchemaObject,

  HealthCheck: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        example: 'ok',
        description: 'Status of the application',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2023-01-01T00:00:00.000Z',
        description: 'Current server time',
      },
    },
    required: ['status', 'timestamp'],
  } as SchemaObject,
};
