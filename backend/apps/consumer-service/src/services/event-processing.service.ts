import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensorEvent, EventType } from '@cityear/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';

export interface SensorEventDto {
    id: string;
    deviceId: string;
    lat: number;
    lng: number;
    noiseLevel: number;
    eventType: EventType;
    timestamp: string;
}

@Injectable()
export class EventProcessingService implements OnModuleInit {
    private readonly logger = new Logger(EventProcessingService.name);
    private buffer: SensorEventDto[] = [];
    private readonly BUFFER_SIZE = 100;
    private stats = {
        totalProcessed: 0,
        totalInserted: 0,
        lastFlushTime: Date.now(),
        alertCount: 0,
    };

    constructor(
        @InjectRepository(SensorEvent)
        private sensorEventRepository: Repository<SensorEvent>,
        @Inject('BROADCAST_SERVICE') private client: ClientProxy,
    ) { }


    onModuleInit() {
        this.logger.log('Event Processing Service initialized');
        this.logger.log(`Buffer size: ${this.BUFFER_SIZE}, Flush interval: 1 second`);
    }

    /**
     * Process incoming sensor event from MQTT
     */
    async processEvent(event: SensorEventDto): Promise<void> {
        this.stats.totalProcessed++;

        // Check if this is an alert (GUNSHOT or SCREAM)
        const isAlert = event.eventType === EventType.GUNSHOT || event.eventType === EventType.SCREAM;

        if (isAlert) {
            this.stats.alertCount++;
            this.logger.warn(
                `🚨 ALERT: ${event.eventType} detected at ${event.deviceId} (${event.noiseLevel} dB)`,
            );

            // Immediate insert for alerts
            await this.insertSingleEvent(event);

            // Broadcast via MQTT
            this.client.emit('city/internal/alerts', event);
            return;
        }

        // Normal event: Add to buffer
        this.buffer.push(event);

        // Flush if buffer is full
        if (this.buffer.length >= this.BUFFER_SIZE) {
            await this.flushBuffer();
        }
    }

    /**
     * Broadcast status update immediately
     */
    async broadcastStatus(event: any): Promise<void> {
        this.client.emit('city/internal/status', event);
    }

    /**
     * Insert single event immediately (for alerts)
     */
    private async insertSingleEvent(event: SensorEventDto): Promise<void> {
        try {
            const entity = this.sensorEventRepository.create({
                id: event.id,
                deviceId: event.deviceId,
                lat: event.lat,
                lng: event.lng,
                noiseLevel: event.noiseLevel,
                eventType: event.eventType,
                timestamp: new Date(event.timestamp),
            });

            await this.sensorEventRepository.save(entity);
            this.stats.totalInserted++;
        } catch (error) {
            this.logger.error(`Failed to insert alert event: ${error.message}`);
        }
    }

    /**
     * Flush buffer to database (batch insert)
     */
    @Cron(CronExpression.EVERY_SECOND)
    async flushBuffer(): Promise<void> {
        if (this.buffer.length === 0) {
            return;
        }

        const eventsToInsert = [...this.buffer];
        this.buffer = [];

        const startTime = Date.now();

        try {
            const entities = eventsToInsert.map(event =>
                this.sensorEventRepository.create({
                    id: event.id,
                    deviceId: event.deviceId,
                    lat: event.lat,
                    lng: event.lng,
                    noiseLevel: event.noiseLevel,
                    eventType: event.eventType,
                    timestamp: new Date(event.timestamp),
                }),
            );

            await this.sensorEventRepository.insert(entities);

            // Broadcast updates for real-time map (Green/Yellow status)
            // Determine if we should broadcast all or sample. 
            // For 100 events/sec, broadcasting all is fine for internal demo.
            this.client.emit('city/internal/updates', {
                type: 'BATCH',
                events: eventsToInsert
            });

            const duration = Date.now() - startTime;
            this.stats.totalInserted += entities.length;
            this.stats.lastFlushTime = Date.now();

            this.logger.log(
                `Flushed ${entities.length} events to database in ${duration}ms ` +
                `(Total: ${this.stats.totalInserted})`,
            );
        } catch (error) {
            this.logger.error(`Failed to flush buffer: ${error.message}`);
            // Re-add to buffer for retry
            this.buffer.unshift(...eventsToInsert);
        }
    }

    /**
     * Log statistics every 30 seconds
     */
    @Cron(CronExpression.EVERY_30_SECONDS)
    logStatistics() {
        if (this.stats.totalProcessed === 0) {
            return;
        }

        const eventsPerSecond = this.stats.totalProcessed / (Date.now() / 1000);

        this.logger.log('═══════════════════════════════════════');
        this.logger.log('📊 PROCESSING STATISTICS');
        this.logger.log('═══════════════════════════════════════');
        this.logger.log(`Total Processed: ${this.stats.totalProcessed}`);
        this.logger.log(`Total Inserted: ${this.stats.totalInserted}`);
        this.logger.log(`Events/sec: ${eventsPerSecond.toFixed(2)}`);
        this.logger.log(`Alert Count: ${this.stats.alertCount}`);
        this.logger.log(`Buffer Size: ${this.buffer.length}`);
        this.logger.log('═══════════════════════════════════════');
    }

    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.stats,
            bufferSize: this.buffer.length,
            eventsPerSecond: this.stats.totalProcessed / (Date.now() / 1000),
        };
    }
}
