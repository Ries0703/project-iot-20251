import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('CONSUMER_PORT', 3001);
    const mqttUrl = configService.get<string>('MQTT_BROKER_URL', 'mqtt://localhost:1883');

    // Configure MQTT microservice
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.MQTT,
        options: {
            url: mqttUrl,
            clientId: `consumer-${Math.random().toString(16).slice(2, 8)}`,
        },
    });

    // Start MQTT microservice
    await app.startAllMicroservices();
    logger.log(`📡 MQTT Consumer connected to: ${mqttUrl}`);
    logger.log(`   Subscribed to topic: city/sensors/events`);

    // Enable CORS for health check endpoints
    app.enableCors({
        origin: '*',
        credentials: true,
    });

    await app.listen(port);

    logger.log(`🔌 CityEar Consumer Service is running on: http://localhost:${port}`);
    logger.log(`📊 Database: ${configService.get('DB_HOST')}:${configService.get('DB_PORT')}`);
}

bootstrap();
