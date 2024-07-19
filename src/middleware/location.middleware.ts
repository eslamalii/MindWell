import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import { IGeoLocation } from 'src/interfaces/GeoLocation';

@Injectable()
export class LocationMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const userIpAddress =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    try {
      const { country_name, country_capital, city, latitude, longitude } =
        await this.getCountryFromIP(userIpAddress);

      if (country_name !== 'Egypt') {
        throw new BadRequestException(
          'User must be located in Egypt to sign up.',
        );
      }

      next();
    } catch (error) {
      throw new BadRequestException('Unable to determine user location.');
    }
  }

  private async getCountryFromIP(ipAddress: string): Promise<IGeoLocation> {
    const response = await fetch(
      `https://api.ipgeolocation.io/ipgeo?apiKey=559f85c1fbdf42478e2c98918f8d0796&ip=${ipAddress}`,
    );
    const data = await response.json();

    return data;
  }
}
