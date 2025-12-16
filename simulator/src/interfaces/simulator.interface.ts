export interface Location {
    lat: number;
    lng: number;
}

export interface HotspotConfig {
    name: string;
    lat: number;
    lng: number;
    deviceCount: number;
}

export interface DeviceLocation extends Location {
    deviceId: string;
    district: string;
}

export interface NoiseEvent {
    id: string;
    deviceId: string;
    lat: number;
    lng: number;
    noiseLevel: number;
    eventType: 'NORMAL' | 'TRAFFIC' | 'GUNSHOT' | 'SCREAM';
    timestamp: string;
    locationName?: string;
}
