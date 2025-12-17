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
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
            <div className="container mx-auto py-10 max-w-7xl">
                <div className="flex flex-col space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-end border-b border-slate-800 pb-6">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                Device Management
                            </h1>
                            <p className="text-slate-400">
                                Control Plane for Sensor Network Simulation.
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsSheetOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Deploy Sensor
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl overflow-hidden">
                        <div className="p-0">
                            <SimulatorDeviceTable key={refreshKey} />
                        </div>
                    </div>
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
