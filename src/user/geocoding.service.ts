import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeocodingService {
  // Replace hardcoded API key with environment variable
  private readonly apiKey = process.env.GEOCODING_API_KEY;

  async reverseGeocode(latitude: number, longitude: number) {
    const url = `https://api.geocode.search.hereapi.com/v1/revgeocode?at=${latitude},${longitude}&apiKey=${this.apiKey}`;

    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Error reverse geocoding coordinates: ${error.message}`);
    }
  }
}
