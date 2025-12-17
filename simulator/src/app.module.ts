import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationService } from './services/location.service';
import { NoiseGeneratorService } from './services/noise-generator.service';
import { MqttService } from './services/mqtt.service';
import { DeviceSimulatorService } from './services/device-simulator.service';
import { DevicesController } from './controllers/devices.controller';
import { SimulatedDevice } from './entities/simulated-device.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'simulator.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Auto-create tables for dev
    }),
    TypeOrmModule.forFeature([SimulatedDevice]),
  ],
  controllers: [DevicesController],
  providers: [
    LocationService,
    NoiseGeneratorService,
    MqttService,
    DeviceSimulatorService,
  ],
})
export class AppModule { }
