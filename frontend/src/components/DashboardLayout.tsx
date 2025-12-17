"use client";

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRealTimeConnection } from '@/hooks/use-realtime';
import RealTimeFeed from '@/components/dashboard/RealTimeFeed';
import NoiseStatistics from '@/components/dashboard/NoiseStatistics';
import { Activity, Radio, Wifi, MapPin } from 'lucide-react';
import { useDeviceStore } from '@/store/device-store';

// Dynamically import Map to avoid SSR issues with Leaflet
const DeviceMap = dynamic(() => import('@/components/map/DeviceMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 animate-pulse border border-slate-800 rounded-lg">
            Loading 3D Terrain...
        </div>
    )
});

export default function DashboardLayout() {
    const { isConnected } = useRealTimeConnection();
    const devices = useDeviceStore(state => state.devices);
    const syncDeviceList = useDeviceStore(state => state.syncDeviceList);
    const deviceCount = Object.keys(devices).length;

    // Fetch authorized devices from Simulator on mount
    const SIMULATOR_API = process.env.NEXT_PUBLIC_SIMULATOR_API_URL || 'http://localhost:3001';

    useEffect(() => {
        const initDevices = async () => {
            try {
                const res = await fetch(`${SIMULATOR_API}/devices`);
                if (res.ok) {
                    const data = await res.json();
                    syncDeviceList(data);
                    console.log(`✅ Authorized ${data.length} devices from Simulator`);
                }
            } catch (err) {
                console.error("Failed to fetch authorized devices:", err);
            }
        };

        initDevices();
    }, []);

    // Calculate average noise
    const avgNoise = deviceCount > 0
        ? (Object.values(devices).reduce((acc, d) => acc + d.noiseLevel, 0) / deviceCount).toFixed(1)
        : '0.0';

    return (
        <main className="h-screen w-screen bg-slate-950 text-slate-50 overflow-hidden flex flex-col font-sans selection:bg-rose-500/30">
            {/* Header / Top Bar */}
            <header className="h-14 flex-none border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-rose-600/20 p-2 rounded-lg">
                        <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                    </div>
                    <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        CityEar <span className="text-slate-500 font-normal">Command Center</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <a
                        href="/admin/devices"
                        target="_blank"
                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-md hover:bg-indigo-500/20 transition-colors"
                    >
                        Manage Devices
                    </a>
                </div>

                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-4 h-4" />
                        <span className="font-mono font-bold text-slate-200">{deviceCount}</span> Sensors
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <Activity className="w-4 h-4" />
                        <span className="font-mono font-bold text-emerald-400">{avgNoise} dB</span> Avg
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
                        <span className={`flex h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <span className={`text-xs font-semibold ${isConnected ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isConnected ? 'LIVE FEED' : 'OFFLINE'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content Grid - Strictly calculate height */}
            <div className="flex-1 p-4 grid grid-cols-12 gap-4 h-[calc(100vh-3.5rem)] overflow-hidden">
                {/* Left Panel: Map (Dominant) */}
                <div className="col-span-12 lg:col-span-9 h-full rounded-lg overflow-hidden border border-slate-800 shadow-xl bg-slate-900 relative">
                    <DeviceMap />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none z-[400]" />
                </div>

                {/* Right Panel: Feed + Stats */}
                <div className="col-span-12 lg:col-span-3 h-full flex flex-col gap-4 min-h-0">
                    {/* Feed Area - Takes available space */}
                    <div className="flex-1 min-h-0">
                        <RealTimeFeed />
                    </div>

                    {/* Stats Area - Fixed height at bottom */}
                    <div className="h-48 flex-none">
                        <NoiseStatistics />
                    </div>

                    <div className="flex-none p-2 rounded-lg border border-slate-800 bg-slate-900/30 text-[10px] text-slate-500 text-center">
                        <p>CityEar System v1.0 • Latency: ~25ms</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
