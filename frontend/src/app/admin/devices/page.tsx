"use client";

import { useState } from 'react';
import { SimulatorDeviceTable } from '@/components/admin/SimulatorDeviceTable';
import { CreateDeviceSheet } from '@/components/admin/CreateDeviceSheet';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function DeviceManagementPage() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleDeviceCreated = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-background text-slate-50 selection:bg-rose-500/30">
            <div className="container mx-auto py-10 max-w-7xl">
                <div className="flex flex-col space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-end border-b border-border pb-6">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                Device Management
                            </h1>
                            <p className="text-slate-400">
                                Control Plane for Sensor Network Simulation.
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsSheetOpen(true)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Deploy Sensor
                        </Button>
                    </div>

                    {/* Content */}
                    <SimulatorDeviceTable key={refreshKey} />
                </div>
            </div>

            <CreateDeviceSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={handleDeviceCreated}
            />
        </div>
    );
}
