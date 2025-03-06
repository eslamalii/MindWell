import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LocationInfo } from './interfaces/location-info.interface';

@Injectable()
export class GeocodingService {
  private readonly apiKey = process.env.HERE_API_KEY;

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<LocationInfo> {
    const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${latitude},${longitude}&apiKey=${this.apiKey}&lang=en-US`;

    try {
      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: (status) => status === 200,
      });

      if (!response.data || !response.data.items || !response.data.items[0]) {
        throw new HttpException(
          'Invalid location data',
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        address: response.data.items[0].address.label,
        city: response.data.items[0].address.city,
        country: response.data.items[0].address.countryName,
      };
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new HttpException(
          `Geocoding service error: ${error.response.status}`,
          HttpStatus.BAD_GATEWAY,
        );
      } else if (error.request) {
        // The request was made but no response was received
        throw new HttpException(
          'Geocoding service timeout',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      } else {
        // Something happened in setting up the request
        throw new HttpException(
          `Error reverse geocoding coordinates: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
