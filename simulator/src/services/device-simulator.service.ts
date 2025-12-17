import { Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { LocationService } from './location.service';
import { NoiseGeneratorService } from './noise-generator.service';
import { MqttService } from './mqtt.service';
import { NoiseEvent } from '../interfaces/simulator.interface';
import { SimulatedDevice, DeviceProfile } from '../entities/simulated-device.entity';

@Injectable()
export class DeviceSimulatorService implements OnModuleInit {
    private readonly logger = new Logger(DeviceSimulatorService.name);

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
        @InjectRepository(SimulatedDevice)
        private deviceRepo: Repository<SimulatedDevice>,
    ) { }

    async onModuleInit() {
        // Seed Database if empty
        const count = await this.deviceRepo.count();
        if (count === 0) {
            const deviceCount = this.configService.get<number>('DEVICE_COUNT', 50);
            const startIndex = this.configService.get<number>('START_INDEX', 0);

            this.logger.log(`Seeding ${deviceCount} devices to Database...`);
            const locations = this.locationService.generateDeviceLocations(deviceCount, startIndex);

            const devicesToSave = locations.map(loc => this.deviceRepo.create({
                id: loc.deviceId,
                name: `${loc.district} Sensor #${loc.deviceId.split('-')[1]}`,
                lat: loc.lat,
                lng: loc.lng,
                profile: DeviceProfile.QUIET_RESIDENTIAL,
                isActive: true
            }));

            await this.deviceRepo.save(devicesToSave);
            this.logger.log('Seeding complete.');
        } else {
            this.logger.log(`Loaded ${count} devices from Database.`);
        }

        // Announce all active devices on startup (simulating power-on)
        this.announceAllDevices();
    }

    private async announceAllDevices() {
        if (!this.mqttService.connected) {
            // Retry later or rely on auto-reconnect logic to trigger this
            // For now, simple delay
            setTimeout(() => this.announceAllDevices(), 2000);
            return;
        }

        const devices = await this.deviceRepo.findBy({ isActive: true });
        this.logger.log(`Announcing ${devices.length} active devices...`);

        for (const device of devices) {
            await this.emitConnect(device);
            // Stagger slightly to avoid thundering herd on simulator startup
            await new Promise(r => setTimeout(r, 10));
        }
    }

    /**
     * Send 'Connect' packet (Auto-provisioning)
     */
    async emitConnect(device: SimulatedDevice) {
        const payload = {
            deviceId: device.id,
            name: device.name,
            lat: device.lat,
            lng: device.lng,
            firmware: device.firmware || '1.0.0',
            status: 'ONLINE',
            timestamp: new Date().toISOString()
        };

        await this.mqttService.publish('city/sensors/connect', payload);
    }

    async forceEvent(device: SimulatedDevice, type: 'GUNSHOT' | 'SCREAM') {
        if (!device.isActive) {
            throw new BadRequestException('Device is currently inactive');
        }

        const event: NoiseEvent = {
            id: uuidv4(),
            deviceId: device.id,
            lat: device.lat,
            lng: device.lng,
            noiseLevel: type === 'GUNSHOT' ? 130 : 100,
            eventType: type,
            timestamp: new Date().toISOString(),
            locationName: device.name
        };

        await this.mqttService.publish('city/sensors/events', event);
        this.logger.warn(`FORCED ${type} on ${device.name}`);
    }

    @Cron(CronExpression.EVERY_5_SECONDS)
    async publishEvents() {
        if (!this.mqttService.connected) return;

        const startTime = Date.now();
        const devices = await this.deviceRepo.findBy({ isActive: true });
        const topic = this.configService.get<string>('MQTT_TOPIC', 'city/sensors/events');

        // Parallel publishing
        const promises = devices.map(async (device) => {
            const noiseData = this.noiseGenerator.generateNoiseEvent();
            // TODO: Use device profile to adjust noise generator args if needed

            const event: NoiseEvent = {
                id: uuidv4(),
                deviceId: device.id,
                lat: device.lat,
                lng: device.lng,
                noiseLevel: parseFloat(noiseData.level.toFixed(1)),
                eventType: noiseData.eventType,
                timestamp: new Date().toISOString(),
                locationName: device.name
            };

            await this.mqttService.publish(topic, event);

            // Simple stats tracking (in-memory is fine for logging)
            this.stats.eventsByType[event.eventType]++;
            return event;
        });

        await Promise.all(promises);

        const duration = Date.now() - startTime;
        this.stats.totalPublished += devices.length;
        this.stats.lastPublishTime = Date.now();

        if (devices.length > 0) {
            this.logger.log(`Published ${devices.length} events in ${duration}ms`);
        }
    }

    /**
     * Log statistics every 30 seconds
     */
    @Cron(CronExpression.EVERY_30_SECONDS)
    async logStatistics() {
        if (this.stats.totalPublished === 0) {
            return;
        }

        const activeCount = await this.deviceRepo.count({ where: { isActive: true } });
        const uptime = Math.floor((Date.now() - this.stats.lastPublishTime) / 1000);
        const eventsPerSecond = this.stats.totalPublished / (Date.now() / 1000);

        const total = Object.values(this.stats.eventsByType).reduce((sum, count) => sum + count, 0);
        const percentages = {
            NORMAL: total ? ((this.stats.eventsByType.NORMAL / total) * 100).toFixed(2) : '0.00',
            TRAFFIC: total ? ((this.stats.eventsByType.TRAFFIC / total) * 100).toFixed(2) : '0.00',
            GUNSHOT: total ? ((this.stats.eventsByType.GUNSHOT / total) * 100).toFixed(2) : '0.00',
            SCREAM: total ? ((this.stats.eventsByType.SCREAM / total) * 100).toFixed(2) : '0.00',
        };

        this.logger.log('═══════════════════════════════════════');
        this.logger.log('📊 SIMULATOR STATISTICS');
        this.logger.log('═══════════════════════════════════════');
        this.logger.log(`Total Events: ${this.stats.totalPublished}`);
        this.logger.log(`Events/sec: ${eventsPerSecond.toFixed(2)}`);
        this.logger.log(`Active Devices: ${activeCount}`);
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
    async getStats() {
        const activeCount = await this.deviceRepo.count({ where: { isActive: true } });
        return {
            ...this.stats,
            deviceCount: activeCount,
            uptime: Math.floor((Date.now() - this.stats.lastPublishTime) / 1000),
        };
    }
}
