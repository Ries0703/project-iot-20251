import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SensorEvent } from '@cityear/common';
import { getTypeOrmConfig } from '@cityear/database';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventProcessingService } from './services/event-processing.service';
import { MqttConsumerController } from './controllers/mqtt-consumer.controller';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),

    // TypeORM configuration with shared config
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),

    // Register shared entities
    TypeOrmModule.forFeature([SensorEvent]),

    // Schedule module for cron jobs
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, MqttConsumerController],
  providers: [AppService, EventProcessingService],
})
export class AppModule { }
