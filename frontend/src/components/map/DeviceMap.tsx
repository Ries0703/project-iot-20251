"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useDeviceStore, DeviceData } from '@/store/device-store';
import { useMemo, useEffect, useState, useRef } from 'react';
import { Copy, MapPin, FileJson, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import copy from 'copy-to-clipboard';
import L from 'leaflet';

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
        if (!d.isActive) return '#ffffff'; // White (Inactive) - Handle false/0/undefined
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
                fillOpacity: !device.isActive ? 1.0 : 0.7, // Solid white for inactive
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
                        Status: <span className="font-semibold">{!device.isActive ? 'INACTIVE (OFF)' : device.eventType}</span>
                    </div>
                </div>
            </Popup>
        </CircleMarker>
    );
};

const ContextMenuInspector = () => {
    const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const [geoData, setGeoData] = useState<{ lat: number, lng: number, address: string | null } | null>(null);
    const [loading, setLoading] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);

    // We need map instance to convert LatLng to ContainerPoint for positioning
    const map = useMap();

    useEffect(() => {
        if (menuRef.current) {
            // Critical: Prevent Leaflet from capturing clicks on this element
            // This ensures clicking the menu doesn't trigger map.on('click') which closes it
            L.DomEvent.disableClickPropagation(menuRef.current);
            L.DomEvent.disableScrollPropagation(menuRef.current);
        }
    }, [menuRef.current]); // Check specific ref current change if needed, though usually ref doesn't trigger render. But this is safe.

    const mapEvents = useMapEvents({
        contextmenu(e) {
            // Prevent default browser menu
            e.originalEvent.preventDefault();

            const { lat, lng } = e.latlng;
            setGeoData({ lat, lng, address: null });
            setMenuPosition(e.containerPoint); // Use container point for absolute positioning
            setLoading(true);

            // Fetch address
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
                .then(res => res.json())
                .then(data => {
                    if (data.display_name) {
                        const parts = data.display_name.split(',').slice(0, 3).join(',');
                        setGeoData(prev => prev ? { ...prev, address: parts } : null);
                    } else {
                        setGeoData(prev => prev ? { ...prev, address: "Unknown Location" } : null);
                    }
                })
                .catch(() => setGeoData(prev => prev ? { ...prev, address: "Network Error" } : null))
                .finally(() => setLoading(false));
        },
        click() {
            // Close menu on click elsewhere
            setMenuPosition(null);
        },
        dragstart() {
            setMenuPosition(null);
        }
    });

    const handleCopy = (text: string, label: string) => {
        // "Nuclear option": Window.prompt is the only 100% way to show text for copy in strict environments
        window.prompt(`Press Ctrl+C to copy ${label}:`, text);
        setMenuPosition(null);
    };

    if (!menuPosition || !geoData) return null;

    return (
        <div
            ref={menuRef}
            className="absolute z-[2000] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-64 text-slate-200 overflow-hidden flex flex-col"
            style={{
                top: menuPosition.y,
                left: menuPosition.x,
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Header: Info */}
            <div className="p-3 bg-slate-800 border-b border-slate-700 relative">
                <button
                    onClick={() => setMenuPosition(null)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-white"
                >
                    <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-100">Location Info</span>
                </div>
                <div className="font-mono text-xs text-slate-300">
                    {geoData.lat.toFixed(5)}, {geoData.lng.toFixed(5)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 leading-tight h-8 flex items-center">
                    {loading ? "Searching address..." : (geoData.address || "No address found")}
                </div>
            </div>

            {/* Actions */}
            <div className="p-1 flex flex-col gap-0.5">
                <button
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded text-xs text-start transition-colors"
                    onClick={() => handleCopy(`${geoData.lat}, ${geoData.lng}`, 'Coordinates')}
                >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    Copy Coordinates
                </button>
                <button
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded text-xs text-start transition-colors"
                    onClick={() => handleCopy(geoData.address || '', 'Address')}
                    disabled={!geoData.address}
                >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Copy Address
                </button>
                <button
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded text-xs text-start transition-colors"
                    onClick={() => handleCopy(JSON.stringify(geoData, null, 2), 'JSON Data')}
                >
                    <FileJson className="w-3.5 h-3.5 text-slate-500" />
                    Copy JSON
                </button>
            </div>
        </div>
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
                <ContextMenuInspector />

                {deviceList.map((device) => (
                    <DeviceMarker key={device.deviceId} device={device} />
                ))}
            </MapContainer>

            <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 p-3 rounded-md border border-slate-700 text-xs text-slate-200">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-white border border-slate-500"></span> Inactive (OFF)
                </div>
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
