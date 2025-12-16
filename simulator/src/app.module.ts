import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LocationService } from './services/location.service';
import { NoiseGeneratorService } from './services/noise-generator.service';
import { MqttService } from './services/mqtt.service';
import { DeviceSimulatorService } from './services/device-simulator.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [
    LocationService,
    NoiseGeneratorService,
    MqttService,
    DeviceSimulatorService,
  ],
})
export class AppModule { }
