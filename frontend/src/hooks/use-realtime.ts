"use client";

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useDeviceStore, DeviceData } from '@/store/device-store';
import { toast } from 'sonner'; // Will use sonner for toasts, need to install or use basic alert

// Define socket URL - assuming running locally or behind same proxy
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000/events';

export const useRealTimeConnection = () => {
    const { updateDevices, addAlert } = useDeviceStore();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        console.log('🔌 Connecting to WebSocket at', SOCKET_URL);

        const socket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log('✅ Connected to Gateway');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected');
            setIsConnected(false);
        });

        socket.on('update', (payload: any) => {
            // Payload structure: { type: 'BATCH', events: [...] }
            if (payload && payload.events) {
                updateDevices(payload.events);
            }
        });

        socket.on('alert', (alert: DeviceData) => {
            console.log('🚨 Alert received:', alert);
            addAlert(alert);
            // Play notification sound?
        });

        return () => {
            socket.disconnect();
        };
    }, [updateDevices, addAlert]);

    return { isConnected };
};
