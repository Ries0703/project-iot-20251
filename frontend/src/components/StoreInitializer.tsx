"use client";

import { useRef } from 'react';
import { useDeviceStore, DeviceData } from '@/store/device-store';

export default function StoreInitializer({ devices }: { devices: DeviceData[] }) {
    const initialized = useRef(false);

    if (!initialized.current) {
        useDeviceStore.getState().setInitialDevices(devices);
        initialized.current = true;
    }

    return null;
}
