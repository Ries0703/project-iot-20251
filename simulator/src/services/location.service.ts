import { Injectable, Logger } from '@nestjs/common';
import { HotspotConfig, DeviceLocation, Location } from '../interfaces/simulator.interface';

@Injectable()
export class LocationService {
    private readonly logger = new Logger(LocationService.name);

    // Major Hanoi districts as hotspots
    private readonly HOTSPOTS: HotspotConfig[] = [
        { name: 'Hoàn Kiếm', lat: 21.0285, lng: 105.8542, deviceCount: 8 },
        { name: 'Cầu Giấy', lat: 21.0278, lng: 105.7963, deviceCount: 7 },
        { name: 'Ba Đình', lat: 21.0352, lng: 105.8190, deviceCount: 6 },
        { name: 'Đống Đa', lat: 21.0136, lng: 105.8270, deviceCount: 6 },
        { name: 'Hai Bà Trưng', lat: 20.9953, lng: 105.8516, deviceCount: 5 },
        { name: 'Thanh Xuân', lat: 20.9943, lng: 105.8067, deviceCount: 5 },
        { name: 'Long Biên', lat: 21.0364, lng: 105.8776, deviceCount: 5 },
        { name: 'Tây Hồ', lat: 21.0758, lng: 105.8197, deviceCount: 4 },
    ];

    // Hanoi urban core bounds
    private readonly BOUNDS = {
        north: 21.05,
        south: 20.98,
        east: 105.87,
        west: 105.78,
    };

    /**
     * Generate device locations using hybrid grid strategy
     * 80% clustered around hotspots, 20% grid-fill
     */
    generateDeviceLocations(totalDevices: number, startIndex: number = 0): DeviceLocation[] {
        const locations: DeviceLocation[] = [];
        let deviceIndex = startIndex;

        // Calculate how many devices per hotspot
        const totalHotspotDevices = this.HOTSPOTS.reduce((sum, h) => sum + h.deviceCount, 0);
        const scaleFactor = totalDevices / totalHotspotDevices;

        // Generate hotspot-based locations (80%)
        for (const hotspot of this.HOTSPOTS) {
            const devicesForHotspot = Math.round(hotspot.deviceCount * scaleFactor * 0.8);

            for (let i = 0; i < devicesForHotspot; i++) {
                locations.push({
                    deviceId: `device-${String(deviceIndex).padStart(4, '0')}`,
                    district: hotspot.name,
                    ...this.jitterLocation(hotspot, 200), // 200m radius
                });
                deviceIndex++;
            }
        }

        // Fill remaining with hex grid (20%)
        const remaining = totalDevices - locations.length;
        if (remaining > 0) {
            const gridLocations = this.generateHexGrid(remaining, deviceIndex);
            locations.push(...gridLocations);
        }

        this.logger.log(`Generated ${locations.length} device locations (${startIndex} to ${deviceIndex - 1})`);
        return locations;
    }

    /**
     * Add random jitter to a location (in meters)
     */
    private jitterLocation(center: Location, radiusMeters: number): Location {
        // Convert meters to degrees (approximate)
        const radiusDegrees = radiusMeters / 111000; // 1 degree ≈ 111km

        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radiusDegrees;

        return {
            lat: center.lat + distance * Math.cos(angle),
            lng: center.lng + distance * Math.sin(angle),
        };
    }

    /**
     * Generate hexagonal grid locations for coverage
     */
    private generateHexGrid(count: number, startIndex: number): DeviceLocation[] {
        const locations: DeviceLocation[] = [];
        const { north, south, east, west } = this.BOUNDS;

        // Calculate grid spacing
        const latRange = north - south;
        const lngRange = east - west;
        const gridSize = Math.ceil(Math.sqrt(count));
        const latStep = latRange / gridSize;
        const lngStep = lngRange / gridSize;

        let deviceIndex = startIndex;
        let generated = 0;

        for (let i = 0; i < gridSize && generated < count; i++) {
            for (let j = 0; j < gridSize && generated < count; j++) {
                const lat = south + (i + 0.5) * latStep;
                const lng = west + (j + 0.5) * lngStep;

                locations.push({
                    deviceId: `device-${String(deviceIndex).padStart(4, '0')}`,
                    district: 'Grid',
                    ...this.jitterLocation({ lat, lng }, 100), // 100m jitter
                });

                deviceIndex++;
                generated++;
            }
        }

        return locations;
    }

    /**
     * Validate location is within Hanoi bounds
     */
    isValidLocation(location: Location): boolean {
        const { north, south, east, west } = this.BOUNDS;
        return (
            location.lat >= south &&
            location.lat <= north &&
            location.lng >= west &&
            location.lng <= east
        );
    }
}
