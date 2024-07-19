import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token =
      request.headers.authorization?.split(' ')[1] || request.cookies['token'];
    const bypassGuard = this.reflector.get<boolean>(
      'bypassGuard',
      context.getHandler(),
    );

    if (bypassGuard) {
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      request.user = decodedToken;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
