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
}

interface DeviceState {
    devices: Record<string, DeviceData>;
    alerts: DeviceData[];

    // Actions
    updateDevices: (events: DeviceData[]) => void;
    addAlert: (alert: DeviceData) => void;
    setInitialDevices: (devices: DeviceData[]) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
    devices: {},
    alerts: [],

    updateDevices: (events) => set((state) => {
        const newDevices = { ...state.devices };
        events.forEach(event => {
            newDevices[event.deviceId] = {
                ...event,
                lastSeen: Date.now()
            };
        });
        return { devices: newDevices };
    }),

    addAlert: (alert) => set((state) => {
        // Keep only last 20 alerts
        const newAlerts = [alert, ...state.alerts].slice(0, 20);

        // Also update the device state to reflect the alert status immediately
        const newDevices = { ...state.devices };
        if (newDevices[alert.deviceId]) {
            newDevices[alert.deviceId] = {
                ...newDevices[alert.deviceId],
                ...alert,
                lastSeen: Date.now()
            };
        }

        return { alerts: newAlerts, devices: newDevices };
    }),

    setInitialDevices: (devices) => set(() => {
        const deviceMap: Record<string, DeviceData> = {};
        devices.forEach(d => {
            deviceMap[d.deviceId] = { ...d, lastSeen: Date.now() };
        });
        return { devices: deviceMap };
    })
}));
