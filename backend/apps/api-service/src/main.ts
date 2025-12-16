import { NestFactory } from '@nestjs/core';
import { ApiServiceModule } from './api-service.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(ApiServiceModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3000);

  // Enable CORS for frontend  
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  await app.listen(port);

  logger.log(`🌐 CityEar API Service is running on: http://localhost:${port}`);
  logger.log(`📊 Database: ${configService.get('DB_HOST')}:${configService.get('DB_PORT')}`);
}

bootstrap();
