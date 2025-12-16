"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useDeviceStore, DeviceData } from '@/store/device-store';
import { useMemo, useEffect } from 'react';

// Hanoi coordinates
const CENTER: [number, number] = [21.0285, 105.8542];

// Component to access Map instance and resizing
function MapController() {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
    }, [map]);
    return null;
}

const DeviceMarker = ({ device }: { device: DeviceData }) => {
    // Determine color based on status/noise
    const getColor = (d: DeviceData) => {
        if (d.eventType === 'GUNSHOT' || d.eventType === 'SCREAM') return '#e11d48'; // Red-600
        if (d.noiseLevel > 80) return '#f59e0b'; // Amber-500
        if (d.noiseLevel > 50) return '#eab308'; // Yellow-500
        return '#10b981'; // Emerald-500
    };

    const getRadius = (d: DeviceData) => {
        if (d.eventType === 'GUNSHOT') return 12;
        if (d.noiseLevel > 80) return 8;
        return 5;
    };

    return (
        <CircleMarker
            center={[device.lat, device.lng]}
            pathOptions={{
                color: getColor(device),
                fillColor: getColor(device),
                fillOpacity: 0.7,
                weight: 1
            }}
            radius={getRadius(device)}
        >
            <Popup>
                <div className="p-2 min-w-[150px]">
                    <h3 className="font-bold text-sm">{device.deviceId}</h3>
                    <div className="text-xs text-gray-500">{new Date(device.timestamp).toLocaleTimeString()}</div>
                    <div className="mt-2 flex items-center justify-between">
                        <span>Noise:</span>
                        <span className="font-mono font-bold">{device.noiseLevel.toFixed(1)} dB</span>
                    </div>
                    <div className="mt-1">
                        Status: <span className="font-semibold">{device.eventType}</span>
                    </div>
                </div>
            </Popup>
        </CircleMarker>
    );
};

export default function DeviceMap() {
    const devices = useDeviceStore((state) => state.devices);

    // Memoize device list to prevent unnecessary re-renders of all markers
    const deviceList = useMemo(() => Object.values(devices), [devices]);

    return (
        <div className="w-full h-full min-h-[500px] relative rounded-lg overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
            <MapContainer
                center={CENTER}
                zoom={14}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <MapController />

                {deviceList.map((device) => (
                    <DeviceMarker key={device.deviceId} device={device} />
                ))}
            </MapContainer>

            <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 p-3 rounded-md border border-slate-700 text-xs text-slate-200">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Normal (&lt;50dB)
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span> High (&gt;50dB)
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span> Very High (&gt;80dB)
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse"></span> ALERT (Gunshot)
                </div>
            </div>
        </div>
    );
}
