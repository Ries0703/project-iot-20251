
import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly service: AnalyticsService) { }

    @Get('trend')
    async getTrend(@Query('bucket') bucket: string) {
        return this.service.get24hTrend(bucket);
    }

    @Get('distribution')
    async getDistribution() {
        return this.service.getEventDistribution();
    }

    @Get('alerts')
    async getAlerts(
        @Query('start') start?: string,
        @Query('end') end?: string,
        @Query('deviceId') deviceId?: string,
        @Query('type') type?: string,
        @Query('minNoise') minNoise?: number,
        @Query('maxNoise') maxNoise?: number,
        @Query('skip') skip?: number,
        @Query('take') take?: number,
        @Query('sortBy') sortBy?: 'timestamp' | 'noiseLevel',
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    ) {
        return this.service.getRecentAlerts({ start, end, deviceId, type, minNoise, maxNoise, skip, take, sortBy, sortOrder });
    }

    @Get('stats')
    async getStats() {
        return this.service.getStats();
    }

    @Get('top-noisy')
    async getTopNoisy() {
        return this.service.getTopNoisySensors();
    }

    @Get('activity')
    async getActivity() {
        return this.service.getHourlyActivity();
    }
}
