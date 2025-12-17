import { create } from 'zustand';

export interface DeviceData {
    id: string;
    deviceId: string;
    lat: number;
    lng: number;
    noiseLevel: number;
    eventType: 'NORMAL' | 'TRAFFIC' | 'GUNSHOT' | 'SCREAM';
    timestamp: string;
    lastSeen: number;
    locationName?: string;
    isActive?: boolean;
}

interface DeviceState {
    devices: Record<string, DeviceData>;
    alerts: DeviceData[];

    // Actions
    updateDevices: (events: DeviceData[]) => void;
    removeDevice: (deviceId: string) => void;
    addAlert: (alert: DeviceData) => void;
    setInitialDevices: (devices: DeviceData[]) => void;
    syncDeviceList: (devices: any[]) => void; // Syncs state from REST API list
}

export const useDeviceStore = create<DeviceState>((set) => ({
    devices: {},
    alerts: [],

    updateDevices: (events) => set((state) => {
        const newDevices = { ...state.devices };
        events.forEach(event => {
            // STRICT MODE: Only update if device ALREADY exists (Authorized by API List)
            // This prevents "Ghost Devices" from external scripts or stale sessions from polluting the map.
            if (newDevices[event.deviceId]) {
                newDevices[event.deviceId] = {
                    ...newDevices[event.deviceId],
                    ...event,

                    lastSeen: Date.now()
                };
            }
        });
        return { devices: newDevices };
    }),

    removeDevice: (deviceId) => set((state) => {
        const newDevices = { ...state.devices };
        delete newDevices[deviceId];
        return { devices: newDevices };
    }),

    addAlert: (alert) => set((state) => {
        // Keep only last 100 alerts
        const newAlerts = [alert, ...state.alerts].slice(0, 100);

        // Also update the device state to reflect the alert status immediately
        const newDevices = { ...state.devices };

        // STRICT MODE: Only update map if device is AUTHORIZED (exists in table list)
        if (newDevices[alert.deviceId]) {
            newDevices[alert.deviceId] = {
                ...newDevices[alert.deviceId],
                ...alert,
                isActive: true, // Alerts imply activity (if device exists)
                lastSeen: Date.now()
            };
        }

        return { alerts: newAlerts, devices: newDevices };
    }),

    setInitialDevices: (devices) => set(() => {
        const deviceMap: Record<string, DeviceData> = {};
        devices.forEach(d => {
            deviceMap[d.deviceId] = { ...d, lastSeen: Date.now(), isActive: true };
        });
        return { devices: deviceMap };
    }),

    syncDeviceList: (apiDevices) => set((state) => {
        // Create a FRESH map to ensure we remove deleted devices (Garbage Collection)
        const newDevices: Record<string, DeviceData> = {};

        apiDevices.forEach(d => {
            const existing = state.devices[d.id];
            // Merge existing dynamic data (noise, event) with new static data from API
            newDevices[d.id] = {
                id: d.id,
                deviceId: d.id,
                lat: d.lat,
                lng: d.lng,
                // Preserve state if exists, otherwise default
                noiseLevel: existing?.noiseLevel ?? 0,
                eventType: existing?.eventType ?? 'NORMAL',
                timestamp: existing?.timestamp ?? new Date().toISOString(),
                lastSeen: existing?.lastSeen ?? Date.now(),
                isActive: d.isActive === true || d.isActive === 'true' || d.isActive === 1 || d.isActive === '1',
                locationName: d.name
            };
        });

        return { devices: newDevices };
    })
}));
