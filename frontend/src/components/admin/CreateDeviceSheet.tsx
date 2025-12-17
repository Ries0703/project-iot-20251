"use client";

import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CreateDeviceSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const SIMULATOR_API = process.env.NEXT_PUBLIC_SIMULATOR_API_URL || 'http://localhost:3001';

export function CreateDeviceSheet({ isOpen, onClose, onSuccess }: CreateDeviceSheetProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [lat, setLat] = useState('21.0285');
    const [lng, setLng] = useState('105.8542');
    const [profile, setProfile] = useState('QUIET_RESIDENTIAL');
    const [isActive, setIsActive] = useState(true);

    // Handle animation timing
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            // Slight delay to allow render before animation
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsVisible(true);
                });
            });

            // Reset form on open
            setName('');
            setLat('21.0285');
            setLng('105.8542');
            setProfile('QUIET_RESIDENTIAL');
            setIsActive(true);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                name,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                profile,
                isActive
            };

            const res = await fetch(`${SIMULATOR_API}/devices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to create device');

            toast.success('Device created successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create device');
        } finally {
            setLoading(false);
        }
    };

    if (!shouldRender) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Slide-in Panel */}
            <div
                className={`relative w-full max-w-md h-full bg-slate-950 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-50">Add New Device</h2>
                            <p className="text-sm text-slate-400">Deploy a new sensor to the network.</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Content / Form */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <form id="create-device-form" onSubmit={handleSubmit} className="space-y-6">

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-200">Device Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Hoan Kiem Sensor #9000"
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-200">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={lat}
                                        onChange={(e) => setLat(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-200">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={lng}
                                        onChange={(e) => setLng(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-200">Profile</label>
                                <select
                                    value={profile}
                                    onChange={(e) => setProfile(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                >
                                    <option value="QUIET_RESIDENTIAL">Quiet Residential</option>
                                    <option value="BUSY_INTERSECTION">Busy Intersection</option>
                                    <option value="MARKET">Market</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-800">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-200">Active Status</label>
                                    <p className="text-xs text-slate-400">Enable data collection immediately</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                        </form>
                    </div>

                    {/* Footer / Actions */}
                    <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose} disabled={loading} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                            Cancel
                        </Button>
                        <Button type="submit" form="create-device-form" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Device
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
