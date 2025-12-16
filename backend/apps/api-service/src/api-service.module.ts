import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorEvent } from '@cityear/common';
import { getTypeOrmConfig } from '@cityear/database';
import { EventsController } from './events.controller';
import { HealthController } from './health.controller';
import { ApiServiceController } from './api-service.controller';
import { EventsGateway } from './events.gateway';
import { ApiServiceService } from './api-service.service';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),

    // TypeORM configuration (read-only for API)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),

    // Register shared entities
    TypeOrmModule.forFeature([SensorEvent]),
  ],
  controllers: [ApiServiceController, EventsController, HealthController],
  providers: [ApiServiceService, EventsGateway],
})
export class ApiServiceModule { }
