import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import compression from 'compression';
import helmet from 'helmet';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CacheControlInterceptor } from './common/interceptors/cache-control.interceptor';
import { setupSwagger } from './common/swagger/swagger.config';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(compression());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Set request timeout
  app.use((req, res, next) => {
    res.setTimeout(10000, () => {
      res.status(408).send('Request Timeout');
    });
    next();
  });

  // Configure CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Automatically convert primitives
      },
    }),
  );

  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Setup Swagger documentation
  setupSwagger(app);

  // Add global interceptor for logging
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new CacheControlInterceptor(),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`Application running on port ${port}`);
}
bootstrap();
