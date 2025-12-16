import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import { LocationService } from './location.service';
import { NoiseGeneratorService } from './noise-generator.service';
import { MqttService } from './mqtt.service';
import { DeviceLocation, NoiseEvent } from '../interfaces/simulator.interface';

@Injectable()
export class DeviceSimulatorService implements OnModuleInit {
    private readonly logger = new Logger(DeviceSimulatorService.name);
    private devices: DeviceLocation[] = [];
    private stats = {
        totalPublished: 0,
        lastPublishTime: Date.now(),
        eventsByType: {
            NORMAL: 0,
            TRAFFIC: 0,
            GUNSHOT: 0,
            SCREAM: 0,
        },
    };

    constructor(
        private locationService: LocationService,
        private noiseGenerator: NoiseGeneratorService,
        private mqttService: MqttService,
        private configService: ConfigService,
    ) { }

    async onModuleInit() {
        const deviceCount = this.configService.get<number>('DEVICE_COUNT', 50);
        const startIndex = this.configService.get<number>('START_INDEX', 0);

        this.logger.log(`Initializing ${deviceCount} virtual devices (starting from ${startIndex})`);

        // Generate device locations
        this.devices = this.locationService.generateDeviceLocations(deviceCount, startIndex);

        this.logger.log(`Devices initialized:`);
        this.devices.forEach((device, index) => {
            if (index < 5 || index >= this.devices.length - 2) {
                // Log first 5 and last 2
                this.logger.log(`  ${device.deviceId} @ ${device.district} (${device.lat.toFixed(4)}, ${device.lng.toFixed(4)})`);
            } else if (index === 5) {
                this.logger.log(`  ... (${this.devices.length - 7} more devices) ...`);
            }
        });

        this.logger.log('Waiting for MQTT connection before starting simulation...');
    }

    /**
     * Publish events from all devices every 5 seconds
     */
    @Cron(CronExpression.EVERY_5_SECONDS)
    async publishEvents() {
        if (!this.mqttService.connected) {
            this.logger.warn('MQTT not connected, skipping publish');
            return;
        }

        const startTime = Date.now();
        const topic = this.configService.get<string>('MQTT_TOPIC', 'city/sensors/events');

        try {
            // Publish events from all devices
            const publishPromises = this.devices.map(async (device) => {
                const noiseData = this.noiseGenerator.generateNoiseEvent();

                const event: NoiseEvent = {
                    id: uuidv4(),
                    deviceId: device.deviceId,
                    lat: device.lat,
                    lng: device.lng,
                    noiseLevel: parseFloat(noiseData.level.toFixed(1)),
                    eventType: noiseData.eventType,
                    timestamp: new Date().toISOString(),
                    locationName: device.district
                };

                await this.mqttService.publish(topic, event);

                // Update stats
                this.stats.eventsByType[event.eventType]++;
                return event;
            });

            await Promise.all(publishPromises);

            const duration = Date.now() - startTime;
            this.stats.totalPublished += this.devices.length;
            this.stats.lastPublishTime = Date.now();

            this.logger.log(
                `Published ${this.devices.length} events in ${duration}ms ` +
                `(Total: ${this.stats.totalPublished})`,
            );

            // Log anomalies
            const publishedEvents = await Promise.all(publishPromises);
            const anomalies = publishedEvents.filter(
                e => e.eventType === 'GUNSHOT' || e.eventType === 'SCREAM'
            );

            if (anomalies.length > 0) {
                anomalies.forEach(anomaly => {
                    this.logger.warn(
                        `🚨 ANOMALY: ${anomaly.eventType} detected at ${anomaly.deviceId} ` +
                        `(${anomaly.noiseLevel} dB)`,
                    );
                });
            }
        } catch (error) {
            this.logger.error(`Failed to publish events: ${error.message}`);
        }
    }

    /**
     * Log statistics every 30 seconds
     */
    @Cron(CronExpression.EVERY_30_SECONDS)
    logStatistics() {
        if (this.stats.totalPublished === 0) {
            return;
        }

        const uptime = Math.floor((Date.now() - this.stats.lastPublishTime) / 1000);
        const eventsPerSecond = this.stats.totalPublished / (Date.now() / 1000);

        const total = Object.values(this.stats.eventsByType).reduce((sum, count) => sum + count, 0);
        const percentages = {
            NORMAL: ((this.stats.eventsByType.NORMAL / total) * 100).toFixed(2),
            TRAFFIC: ((this.stats.eventsByType.TRAFFIC / total) * 100).toFixed(2),
            GUNSHOT: ((this.stats.eventsByType.GUNSHOT / total) * 100).toFixed(2),
            SCREAM: ((this.stats.eventsByType.SCREAM / total) * 100).toFixed(2),
        };

        this.logger.log('═══════════════════════════════════════');
        this.logger.log('📊 SIMULATOR STATISTICS');
        this.logger.log('═══════════════════════════════════════');
        this.logger.log(`Total Events: ${this.stats.totalPublished}`);
        this.logger.log(`Events/sec: ${eventsPerSecond.toFixed(2)}`);
        this.logger.log(`Active Devices: ${this.devices.length}`);
        this.logger.log('');
        this.logger.log('Event Distribution:');
        this.logger.log(`  NORMAL:   ${this.stats.eventsByType.NORMAL.toString().padStart(6)} (${percentages.NORMAL}%)`);
        this.logger.log(`  TRAFFIC:  ${this.stats.eventsByType.TRAFFIC.toString().padStart(6)} (${percentages.TRAFFIC}%)`);
        this.logger.log(`  GUNSHOT:  ${this.stats.eventsByType.GUNSHOT.toString().padStart(6)} (${percentages.GUNSHOT}%)`);
        this.logger.log(`  SCREAM:   ${this.stats.eventsByType.SCREAM.toString().padStart(6)} (${percentages.SCREAM}%)`);
        this.logger.log('═══════════════════════════════════════');

        const noiseStats = this.noiseGenerator.getStats();
        this.logger.log(`Current Hour: ${noiseStats.hour}h (Base: ${noiseStats.baseNoise} dB, Rush: ${noiseStats.isRushHour})`);
    }

    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.stats,
            deviceCount: this.devices.length,
            uptime: Math.floor((Date.now() - this.stats.lastPublishTime) / 1000),
        };
    }
}
