import { Test, TestingModule } from '@nestjs/testing';
import { GeocodingService } from './geocoding.service';
import axios from 'axios';
import { HttpException, HttpStatus } from '@nestjs/common';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GeocodingService', () => {
  let service: GeocodingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeocodingService],
    }).compile();

    service = module.get(GeocodingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return valid location info for valid coordinates', async () => {
    const mockAxiosResponse = {
      status: 200,
      data: {
        items: [
          {
            address: {
              label: 'Test Address',
              city: 'Test City',
              countryName: 'Test Country',
            },
          },
        ],
      },
      headers: {},
      config: {},
      statusText: 'OK',
    };

    mockedAxios.get.mockResolvedValueOnce(mockAxiosResponse);

    const result = await service.reverseGeocode(1.234, 5.678);
    expect(result).toBeDefined();
    expect(result).toEqual({
      address: 'Test Address',
      city: 'Test City',
      country: 'Test Country',
    });
  });

  it('should handle HTTP errors from geocoding service', async () => {
    const errorResponse = {
      isAxiosError: true,
      response: {
        status: 500,
        data: 'Internal Server Error',
        statusText: 'Internal Server Error',
        headers: {},
        config: {},
      },
    };

    mockedAxios.get.mockRejectedValueOnce(errorResponse);

    await expect(service.reverseGeocode(1.234, 5.678)).rejects.toThrowError(
      new HttpException('Geocoding service error: 500', HttpStatus.BAD_GATEWAY),
    );
  });

  it('should handle network errors', async () => {
    const networkError = {
      isAxiosError: true,
      message: 'Network Error',
      name: 'Error',
      config: {},
    };

    mockedAxios.get.mockRejectedValueOnce(networkError);

    await expect(service.reverseGeocode(1.234, 5.678)).rejects.toThrowError(
      new HttpException(
        'Error reverse geocoding coordinates: Network Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      ),
    );
  });
});
