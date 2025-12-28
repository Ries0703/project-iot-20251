"use client";

import { useDeviceStore } from '@/store/device-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMemo } from 'react';

export default function NoiseStatistics() {
    const devices = useDeviceStore(state => state.devices);

    const stats = useMemo(() => {
        const values = Object.values(devices);
        const ranges = [
            { name: 'Quiet (<50)', count: 0, color: '#10b981' }, // Emerald-500
            { name: 'Moderate (50-80)', count: 0, color: '#eab308' }, // Yellow-500
            { name: 'Loud (>80)', count: 0, color: '#f59e0b' }, // Amber-500
            { name: 'Danger (>100)', count: 0, color: '#e11d48' }, // Rose-600
        ];

        values.forEach(d => {
            if (d.noiseLevel > 100) ranges[3].count++;
            else if (d.noiseLevel > 80) ranges[2].count++;
            else if (d.noiseLevel > 50) ranges[1].count++;
            else ranges[0].count++;
        });

        return ranges;
    }, [devices]);

    return (
        <Card className="h-full border-border bg-card">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                    Noise Distribution
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats} className="!outline-none focus:outline-none">
                        <XAxis
                            dataKey="name"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                            itemStyle={{ color: '#f8fafc' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {stats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
