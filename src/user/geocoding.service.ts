import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeocodingService {
  private readonly apiKey = 'S1G2HcNTZZ0Z3A0VJ136397V-Vho2mEJRs4_xS35AjA';

  async reverseGeocode(latitude: number, longitude: number) {
    const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${latitude},${longitude}&apiKey=${this.apiKey}&lang=en-US`;

    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Error reverse geocoding coordinates: ${error.message}`);
    }
  }
}
