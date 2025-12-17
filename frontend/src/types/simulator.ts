export enum DeviceProfile {
    QUIET_RESIDENTIAL = 'QUIET_RESIDENTIAL',
    BUSY_INTERSECTION = 'BUSY_INTERSECTION',
    MARKET = 'MARKET',
}

export interface SimulatedDevice {
    id: string;
    name: string;
    lat: number;
    lng: number;
    isActive: boolean;
    profile: DeviceProfile;
    minNoise: number;
    maxNoise: number;
    firmware: string;
}
