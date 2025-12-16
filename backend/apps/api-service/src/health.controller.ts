import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensorEvent } from '@cityear/common';

@Controller('health')
export class HealthController {
    constructor(
        @InjectRepository(SensorEvent)
        private sensorEventRepository: Repository<SensorEvent>,
    ) { }

    /**
     * GET /health/liveness
     * K8s liveness probe - checks if application is running
     */
    @Get('liveness')
    async liveness() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }

    /**
     * GET /health/readiness
     * K8s readiness probe - checks if application is ready to serve traffic
     */
    @Get('readiness')
    async readiness() {
        try {
            // Check database connection
            await this.sensorEventRepository.query('SELECT 1');

            // Check if data is flowing (optional, but useful)
            const recentEvent = await this.sensorEventRepository
                .createQueryBuilder('event')
                .select('MAX(event.timestamp)', 'latest')
                .getRawOne();

            const lag = recentEvent?.latest
                ? Date.now() - new Date(recentEvent.latest).getTime()
                : null;

            // Consider ready if database accessible and lag < 30 seconds
            const isReady = lag === null || lag < 30000;

            return {
                status: isReady ? 'ready' : 'not ready',
                timestamp: new Date().toISOString(),
                checks: {
                    database: 'connected',
                    latestEvent: recentEvent?.latest || null,
                    lagMs: lag,
                    dataFlowing: lag !== null && lag < 30000,
                },
            };
        } catch (error) {
            return {
                status: 'not ready',
                timestamp: new Date().toISOString(),
                checks: {
                    database: 'error',
                    error: error.message,
                },
            };
        }
    }

    /**
     * GET /health
     * Combined health check
     */
    @Get()
    async health() {
        try {
            const [livenessResult, readinessResult] = await Promise.all([
                this.liveness(),
                this.readiness(),
            ]);

            return {
                status: readinessResult.status === 'ready' ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                liveness: livenessResult,
                readiness: readinessResult,
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
            };
        }
    }
}
