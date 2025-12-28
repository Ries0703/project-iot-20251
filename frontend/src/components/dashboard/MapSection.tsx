"use client";

import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const DeviceMap = dynamic(() => import('@/components/map/DeviceMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-card/50 text-muted-foreground animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin mb-2 text-emerald-500" />
            <span className="text-xs font-mono">Loading 3D Terrain...</span>
        </div>
    )
});

export default function MapSection() {
    return (
        <Card className="h-full w-full border-border bg-card shadow-xl overflow-hidden relative">
            <DeviceMap />
            {/* Overlay Gradient for cinematics/depth */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/90 to-transparent pointer-events-none z-[400]" />
        </Card>
    );
}
