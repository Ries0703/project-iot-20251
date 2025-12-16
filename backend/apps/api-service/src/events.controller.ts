import { Controller, Get, Query, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { SensorEvent, EventType } from '@cityear/common';

@Controller('api/events')
export class EventsController {
    constructor(
        @InjectRepository(SensorEvent)
        private sensorEventRepository: Repository<SensorEvent>,
    ) { }

    /**
     * GET /api/events/recent
     * Get recent events (last N minutes)
     */
    @Get('recent')
    async getRecentEvents(
        @Query('minutes') minutes: string = '5',
        @Query('limit') limit: string = '100',
    ) {
        const minutesAgo = new Date(Date.now() - parseInt(minutes) * 60 * 1000);

        const events = await this.sensorEventRepository.find({
            where: {
                timestamp: MoreThan(minutesAgo),
            },
            order: {
                timestamp: 'DESC',
            },
            take: parseInt(limit),
        });

        return {
            count: events.length,
            timeRange: `Last ${minutes} minutes`,
            events,
        };
    }

    /**
     * GET /api/events/alerts
     * Get recent alerts (GUNSHOT, SCREAM)
     */
    @Get('alerts')
    async getAlerts(
        @Query('minutes') minutes: string = '60',
        @Query('limit') limit: string = '50',
    ) {
        const minutesAgo = new Date(Date.now() - parseInt(minutes) * 60 * 1000);

        const alerts = await this.sensorEventRepository.find({
            where: [
                { eventType: EventType.GUNSHOT, timestamp: MoreThan(minutesAgo) },
                { eventType: EventType.SCREAM, timestamp: MoreThan(minutesAgo) },
            ],
            order: {
                timestamp: 'DESC',
            },
            take: parseInt(limit),
        });

        return {
            count: alerts.length,
            timeRange: `Last ${minutes} minutes`,
            alerts,
        };
    }

    /**
     * GET /api/events/device/:deviceId
     * Get events for specific device
     */
    @Get('device/:deviceId')
    async getDeviceEvents(
        @Param('deviceId') deviceId: string,
        @Query('minutes') minutes: string = '60',
        @Query('limit') limit: string = '100',
    ) {
        const minutesAgo = new Date(Date.now() - parseInt(minutes) * 60 * 1000);

        const events = await this.sensorEventRepository.find({
            where: {
                deviceId,
                timestamp: MoreThan(minutesAgo),
            },
            order: {
                timestamp: 'DESC',
            },
            take: parseInt(limit),
        });

        return {
            deviceId,
            count: events.length,
            events,
        };
    }

    /**
     * GET /api/events/stats
     * Get aggregated statistics
     */
    @Get('stats')
    async getStats(@Query('minutes') minutes: string = '60') {
        const minutesAgo = new Date(Date.now() - parseInt(minutes) * 60 * 1000);

        const stats = await this.sensorEventRepository
            .createQueryBuilder('event')
            .select('COUNT(*)', 'totalEvents')
            .addSelect('COUNT(DISTINCT event.deviceId)', 'uniqueDevices')
            .addSelect('AVG(event.noiseLevel)', 'avgNoise')
            .addSelect('MAX(event.noiseLevel)', 'maxNoise')
            .addSelect('MIN(event.noiseLevel)', 'minNoise')
            .addSelect('COUNT(CASE WHEN event.eventType = :gunshot THEN 1 END)', 'gunshotCount')
            .addSelect('COUNT(CASE WHEN event.eventType = :scream THEN 1 END)', 'screamCount')
            .where('event.timestamp > :timestamp', { timestamp: minutesAgo })
            .setParameters({ gunshot: EventType.GUNSHOT, scream: EventType.SCREAM })
            .getRawOne();

        return {
            timeRange: `Last ${minutes} minutes`,
            totalEvents: parseInt(stats.totalEvents),
            uniqueDevices: parseInt(stats.uniqueDevices),
            avgNoise: parseFloat(stats.avgNoise).toFixed(2),
            maxNoise: parseFloat(stats.maxNoise).toFixed(2),
            minNoise: parseFloat(stats.minNoise).toFixed(2),
            anomalies: {
                gunshot: parseInt(stats.gunshotCount),
                scream: parseInt(stats.screamCount),
            },
        };
    }

    /**
     * GET /api/events/heatmap
     * Get data for heatmap visualization
     */
    @Get('heatmap')
    async getHeatmapData(@Query('minutes') minutes: string = '30') {
        const minutesAgo = new Date(Date.now() - parseInt(minutes) * 60 * 1000);

        const heatmapData = await this.sensorEventRepository
            .createQueryBuilder('event')
            .select('event.deviceId', 'deviceId')
            .addSelect('event.lat', 'lat')
            .addSelect('event.lng', 'lng')
            .addSelect('AVG(event.noiseLevel)', 'avgNoise')
            .addSelect('MAX(event.noiseLevel)', 'maxNoise')
            .addSelect('COUNT(*)', 'eventCount')
            .addSelect('MAX(event.timestamp)', 'lastSeen')
            .where('event.timestamp > :timestamp', { timestamp: minutesAgo })
            .groupBy('event.deviceId')
            .addGroupBy('event.lat')
            .addGroupBy('event.lng')
            .getRawMany();

        return {
            timeRange: `Last ${minutes} minutes`,
            deviceCount: heatmapData.length,
            devices: heatmapData.map(d => ({
                deviceId: d.deviceId,
                lat: parseFloat(d.lat),
                lng: parseFloat(d.lng),
                avgNoise: parseFloat(d.avgNoise).toFixed(1),
                maxNoise: parseFloat(d.maxNoise).toFixed(1),
                eventCount: parseInt(d.eventCount),
                lastSeen: d.lastSeen,
            })),
        };
    }

    /**
     * GET /api/events/health
     * API health check
     */
    @Get('health')
    async healthCheck() {
        const latestEvent = await this.sensorEventRepository.findOne({
            order: { timestamp: 'DESC' },
        });

        const lag = latestEvent
            ? Date.now() - new Date(latestEvent.timestamp).getTime()
            : null;

        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            latestEvent: latestEvent?.timestamp,
            lagMs: lag,
        };
    }
}
