
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SensorEvent } from '@cityear/common';
import { Repository } from 'typeorm';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(SensorEvent)
        private readonly repo: Repository<SensorEvent>,
    ) { }

    async get24hTrend(bucket: string = '5 minutes') {
        const allowedBuckets = ['1 minute', '5 minutes', '15 minutes', '1 hour'];
        if (!allowedBuckets.includes(bucket)) bucket = '5 minutes';

        const query = `
      SELECT 
        to_char(time_bucket('${bucket}', timestamp), 'HH24:MI') as time,
        AVG("noiseLevel") as "avgNoise"
      FROM sensor_events
      WHERE timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY 1
      ORDER BY 1;
    `;

        const result = await this.repo.query(query);
        return result.map(r => ({ ...r, avgNoise: parseFloat(r.avgNoise).toFixed(1) }));
    }

    async getEventDistribution() {
        const query = `
      SELECT "eventType" as name, COUNT(*) as value
      FROM sensor_events
      WHERE timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY 1;
    `;
        return this.repo.query(query);
    }

    async getRecentAlerts(params: {
        start?: string;
        end?: string;
        deviceId?: string;
        type?: string;
        minNoise?: number;
        maxNoise?: number;
        skip?: number;
        take?: number;
        sortBy?: 'timestamp' | 'noiseLevel';
        sortOrder?: 'ASC' | 'DESC';
    }) {
        const qb = this.repo.createQueryBuilder('event')
            .where('1=1');

        if (params.start) qb.andWhere('event.timestamp >= :start', { start: params.start });
        if (params.end) qb.andWhere('event.timestamp <= :end', { end: params.end });

        if (params.deviceId) {
            qb.andWhere('event.deviceId ILIKE :deviceId', { deviceId: `%${params.deviceId}%` });
        }

        if (params.type && params.type !== 'ALL') {
            qb.andWhere('event.eventType = :type', { type: params.type });
        } else {
            // Default to showing only alerts if no specific type request (or if ALL is intended to be just alerts)
            if (params.type) {
                // user specified something.
            } else {
                // default: only dangerous stuff
                qb.andWhere("event.eventType IN (:...types)", { types: ['GUNSHOT', 'SCREAM'] });
            }
        }

        if (params.minNoise) qb.andWhere('event.noiseLevel >= :min', { min: params.minNoise });
        if (params.maxNoise) qb.andWhere('event.noiseLevel <= :max', { max: params.maxNoise });

        const sortField = params.sortBy === 'noiseLevel' ? 'event.noiseLevel' : 'event.timestamp';
        const sortOrder = params.sortOrder === 'ASC' ? 'ASC' : 'DESC';

        return qb.orderBy(sortField, sortOrder)
            .skip(params.skip || 0)
            .take(params.take || 20)
            .getMany();
    }

    async getStats() {
        // 1. Max Noise Today
        const { max } = await this.repo
            .createQueryBuilder('event')
            .select('MAX(event.noiseLevel)', 'max')
            .where("timestamp > NOW() - INTERVAL '24 hours'")
            .getRawOne();

        // 2. Avg Noise Today
        const { avg } = await this.repo
            .createQueryBuilder('event')
            .select('AVG(event.noiseLevel)', 'avg')
            .where("timestamp > NOW() - INTERVAL '24 hours'")
            .getRawOne();

        // 3. Total Alerts Today
        const alerts = await this.repo
            .createQueryBuilder('event')
            .where("timestamp > NOW() - INTERVAL '24 hours'")
            .andWhere("event.eventType IN (:...types)", { types: ['GUNSHOT', 'SCREAM'] })
            .getCount();

        return {
            maxNoise: parseFloat(max || 0).toFixed(1),
            avgNoise: parseFloat(avg || 0).toFixed(1),
            totalAlerts: alerts
        };
    }
    async getTopNoisySensors() {
        // Top 5 devices with highest average noise in last 24h
        const query = `
            SELECT "deviceId", AVG("noiseLevel") as "avgNoise"
            FROM sensor_events
            WHERE timestamp > NOW() - INTERVAL '24 hours'
            GROUP BY 1
            ORDER BY 2 DESC
            LIMIT 5;
        `;
        const result = await this.repo.query(query);
        return result.map(r => ({ ...r, avgNoise: parseFloat(r.avgNoise).toFixed(1) }));
    }

    async getHourlyActivity() {
        // Activity Volume: Routine (Traffic/Normal) vs Critical (Gunshot/Scream)
        const query = `
             SELECT 
                to_char(time_bucket('1 hour', timestamp), 'HH24:00') as time,
                SUM(CASE WHEN "eventType" IN ('GUNSHOT', 'SCREAM') THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN "eventType" NOT IN ('GUNSHOT', 'SCREAM') THEN 1 ELSE 0 END) as routine
            FROM sensor_events
            WHERE timestamp > NOW() - INTERVAL '24 hours'
            GROUP BY 1
            ORDER BY 1;
        `;
        const result = await this.repo.query(query);
        return result.map(r => ({
            time: r.time,
            critical: parseInt(r.critical, 10),
            routine: parseInt(r.routine, 10)
        }));
    }
}
