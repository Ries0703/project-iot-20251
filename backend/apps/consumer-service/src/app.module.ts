import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SensorEvent } from '@cityear/common';
import { getTypeOrmConfig } from '@cityear/database';
import { ClientsModule, Transport } from '@nestjs/microservices';
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

    // MQTT Client for broadcasting updates
    ClientsModule.registerAsync([
      {
        name: 'BROADCAST_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.MQTT,
          options: {
            url: configService.get<string>('MQTT_BROKER_URL', 'mqtt://localhost:1883'),
            clientId: 'consumer_broadcaster_' + Math.random().toString(16).substr(2, 8),
          },
        }),
      },
    ]),
  ],
  controllers: [AppController, MqttConsumerController],
  providers: [AppService, EventProcessingService],
})
export class AppModule { }
