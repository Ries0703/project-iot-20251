import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // Enable HTTP for Admin API
  app.enableCors();
  await app.listen(3001);

  logger.log('🌆 CityEar IoT Simulator started');
  logger.log(`👉 API: http://localhost:3001`);
  logger.log(`📍 Devices: ${process.env.DEVICE_COUNT || 50}`);
  logger.log(
    `📡 MQTT: ${process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883'}`,
  );
  logger.log(`⏱️  Publish interval: 5 seconds`);
  logger.log('');
  logger.log('Simulator is running. Press Ctrl+C to stop.');

  // Keep process running
  // process.on('SIGINT'...) is handled by NestJS shutdown hooks automatically mostly,
  // but explicit is fine. Removed custom handler to let Nest handle signals cleanly.
}

bootstrap();
