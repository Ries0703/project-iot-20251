"use client";

import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
                className={`relative w-full max-w-md h-full bg-card border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
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
                                <Label className="text-slate-200">Device Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Hoan Kiem Sensor #9000"
                                    className="bg-background border-border text-slate-50 focus-visible:ring-emerald-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-200">Latitude</Label>
                                    <Input
                                        type="number"
                                        step="0.0001"
                                        value={lat}
                                        onChange={(e) => setLat(e.target.value)}
                                        className="bg-background border-border text-slate-50 focus-visible:ring-emerald-500/50"
                                        showSpinner
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-200">Longitude</Label>
                                    <Input
                                        type="number"
                                        step="0.0001"
                                        value={lng}
                                        onChange={(e) => setLng(e.target.value)}
                                        className="bg-background border-border text-slate-50 focus-visible:ring-emerald-500/50"
                                        showSpinner
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-200">Profile</Label>
                                <Select value={profile} onValueChange={setProfile}>
                                    <SelectTrigger className="bg-background border-border text-slate-50 focus:ring-emerald-500/50">
                                        <SelectValue placeholder="Select profile" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="QUIET_RESIDENTIAL">Quiet Residential</SelectItem>
                                        <SelectItem value="BUSY_INTERSECTION">Busy Intersection</SelectItem>
                                        <SelectItem value="MARKET">Market</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-slate-200">Active Status</Label>
                                    <p className="text-xs text-slate-400">Enable data collection immediately</p>
                                </div>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    className="data-[state=checked]:bg-emerald-600"
                                />
                            </div>

                        </form>
                    </div>

                    {/* Footer / Actions */}
                    <div className="p-6 border-t border-border bg-card/50 flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose} disabled={loading} className="border-border text-slate-400 hover:bg-white/5 hover:text-white">
                            Cancel
                        </Button>
                        <Button type="submit" form="create-device-form" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Device
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
