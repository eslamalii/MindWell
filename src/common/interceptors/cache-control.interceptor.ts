import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const request = context.switchToHttp().getRequest();

        // Don't cache POST requests
        if (request.method === 'GET') {
          // Cache GET requests for 5 minutes
          response.header('Cache-Control', 'public, max-age=300');
        } else {
          // Don't cache other methods
          response.header('Cache-Control', 'no-store');
        }
      }),
    );
  }
}
