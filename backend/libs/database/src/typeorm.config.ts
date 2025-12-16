import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SensorEvent } from '@cityear/common';

export const getTypeOrmConfig = (
    configService: ConfigService,
): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USER', 'admin'),
    password: configService.get<string>('DB_PASSWORD', 'admin'),
    database: configService.get<string>('DB_NAME', 'cityear'),
    entities: [SensorEvent],
    synchronize: false, // Database-first approach
    logging: configService.get<boolean>('DB_LOGGING', false),
    extra: {
        max: 20,
        connectionTimeoutMillis: 5000,
    },
});
