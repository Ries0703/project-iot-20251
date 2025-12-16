"use client";

import { useDeviceStore } from '@/store/device-store';
import { AlertCircle, Volume2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function RealTimeFeed() {
    const alerts = useDeviceStore((state) => state.alerts);

    if (alerts.length === 0) {
        return (
            <Card className="h-full border-slate-800 bg-slate-900/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                        <AlertCircle className="w-5 h-5 text-emerald-500" />
                        Live Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-slate-500 py-10">
                        No critical alerts detected.
                        <div className="text-xs mt-2">Monitoring system active...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-slate-800 bg-slate-900/50 flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="flex items-center gap-2 text-slate-100">
                    <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
                    Live Alerts ({alerts.length})
                </CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {alerts.map((alert, index) => (
                    <div
                        key={`${alert.id}-${index}`}
                        className="p-3 bg-slate-800/80 rounded-lg border border-rose-900/50 shadow-sm flex items-start gap-3 transition-all hover:bg-slate-800"
                    >
                        <div className="mt-1 p-2 bg-rose-500/10 rounded-full text-rose-500">
                            <Volume2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-rose-400 text-sm uppercase tracking-wider">
                                    {alert.eventType}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(alert.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
                                <Badge variant="outline" className="text-slate-400 border-slate-700 text-[10px] px-1 py-0 h-5">
                                    {alert.deviceId}
                                    {alert.locationName && (
                                        <span className="ml-1 text-slate-500 border-l border-slate-700 pl-1">
                                            {alert.locationName}
                                        </span>
                                    )}
                                </Badge>
                                <span className="font-mono text-rose-300 font-bold">
                                    {alert.noiseLevel.toFixed(1)} dB
                                </span>
                            </div>
                            <div className="mt-1 text-[9px] font-mono text-slate-500">
                                {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
                            </div>
                        </div>
                    </div>

                ))}
            </div>
        </Card >
    );
}
