'use client';

import { useState, useEffect } from 'react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
} from '@tanstack/react-table';
import { useDeviceStore } from '@/store/device-store';
import { useConfirm } from '@/components/providers/confirm-modal-provider';
import { SimulatedDevice } from '@/types/simulator';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Siren, Volume2, Power, Trash2, ChevronLeft, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { toast } from 'sonner';

const SIMULATOR_API = process.env.NEXT_PUBLIC_SIMULATOR_API_URL || 'http://localhost:3001';

export function SimulatorDeviceTable() {
    const { confirm } = useConfirm();
    const [devices, setDevices] = useState<SimulatedDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const syncDeviceList = useDeviceStore((state) => state.syncDeviceList); // Import action
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [globalFilter, setGlobalFilter] = useState(''); // Search state

    // Filtered data
    const filteredDevices = devices.filter(d =>
        d.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        d.id.toLowerCase().includes(globalFilter.toLowerCase())
    );

    const fetchDevices = async () => {
        try {
            const res = await fetch(`${SIMULATOR_API}/devices`);
            if (!res.ok) throw new Error('Failed to fetch devices');
            const data = await res.json();
            setDevices(data);
            syncDeviceList(data); // Sync to global store for Map to recognize inactive devices
        } catch (error) {
            console.error(error);
            toast.error('Could not load devices from Simulator', {
                description: 'Is the simulator running on port 3001?'
            });
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchDevices();
        const interval = setInterval(fetchDevices, 5000); // Poll for updates
        return () => clearInterval(interval);
    }, []);

    const triggerEvent = async (id: string, type: 'GUNSHOT' | 'SCREAM') => {
        try {
            const res = await fetch(`${SIMULATOR_API}/devices/${id}/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });
            if (!res.ok) throw new Error('Failed');
            toast.success(`Triggered ${type} successfully!`);
        } catch (err) {
            toast.error('Failed to trigger event');
        }
    };

    const toggleDevice = async (device: SimulatedDevice) => {
        try {
            const res = await fetch(`${SIMULATOR_API}/devices/${device.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !device.isActive }),
            });
            if (!res.ok) throw new Error('Failed');
            toast.success(`Device ${device.isActive ? 'Stopped' : 'Started'}`);
            fetchDevices();
        } catch (err) {
            toast.error('Failed to toggle device');
        }
    };

    const handleDelete = async (device: SimulatedDevice) => {
        const confirmed = await confirm({
            title: `Delete ${device.name}?`,
            description: (
                <span>
                    This action cannot be undone. This will permanently delete <b>{device.id}</b> from the simulation.
                </span>
            ),
            confirmText: 'Delete Device',
            variant: 'destructive',
        });

        if (!confirmed) return;

        try {
            const res = await fetch(`${SIMULATOR_API}/devices/${device.id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed');
            toast.success('Device deleted');
            fetchDevices();
        } catch (err) {
            toast.error('Failed to delete device');
        }
    };

    const columns: ColumnDef<SimulatedDevice>[] = [
        {
            accessorKey: 'name',
            header: 'Environment', // Vercel style often implies "Project" or "Environment"
            cell: ({ row }) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="h-6 w-6 rounded flex-none bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-400 font-mono">
                        {row.original.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-medium text-xs text-slate-200">{row.original.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{row.original.id}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'profile',
            header: 'Profile',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-mono px-2 py-0 h-5">
                    {row.original.profile}
                </Badge>
            ),
        },
        {
            accessorKey: 'isActive',
            header: 'Status',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${row.original.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                    <span className={`text-xs font-medium ${row.original.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {row.original.isActive ? 'Online' : 'Offline'}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'coordinates',
            header: 'Location',
            cell: ({ row }) => (
                <div className="text-xs text-slate-500">
                    {row.original.lat.toFixed(4)}, {row.original.lng.toFixed(4)}
                </div>
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                        onClick={() => toggleDevice(row.original)}
                        title={row.original.isActive ? "Stop" : "Start"}
                    >
                        <Power className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400 hover:text-amber-500 hover:bg-slate-800"
                        onClick={() => triggerEvent(row.original.id, 'GUNSHOT')}
                        title="Simulate Gunshot"
                    >
                        <Siren className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400 hover:text-orange-500 hover:bg-slate-800"
                        onClick={() => triggerEvent(row.original.id, 'SCREAM')}
                        title="Simulate Scream"
                    >
                        <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-slate-800"
                        onClick={() => handleDelete(row.original)}
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const table = useReactTable({
        data: filteredDevices,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        autoResetPageIndex: false, // Critical: Prevent reset to page 0 when data updates via polling
        state: {
            pagination,
        },
    });

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden flex flex-col">
            {/* Header / Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-border bg-white/[0.02]">
                <div className="flex items-center gap-2 w-full max-w-sm relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search devices..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="bg-background border-border pl-9 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500/50"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">
                        {filteredDevices.filter(d => d.isActive).length} Active
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border-slate-500/20">
                        {filteredDevices.filter(d => !d.isActive).length} Inactive
                    </Badge>
                </div>
            </div>

            {/* Table Area - No double borders */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-transparent border-b border-border">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="h-9 text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-4 bg-card/50">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="group border-border transition-colors hover:bg-white/[0.02]"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-2 pl-4 border-b border-border/50">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="p-3 rounded-full bg-slate-800/50 text-slate-600">
                                            <Siren className="w-6 h-6" />
                                        </div>
                                        <p>No devices found matching your criteria</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls - Footer Style */}
            <div className="flex items-center justify-between border-t border-border bg-white/[0.02] p-2 px-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Show</span>
                    <div className="flex items-center gap-2">
                        <Select
                            value={String(table.getState().pagination.pageSize)}
                            onValueChange={value => table.setPageSize(Number(value))}
                        >
                            <SelectTrigger className="h-7 w-[4.5rem] bg-background/50 border-border text-xs text-slate-300">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 50, 100].map(pageSize => (
                                    <SelectItem key={pageSize} value={String(pageSize)}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 border border-transparent hover:border-border hover:bg-white/5 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 border border-transparent hover:border-border hover:bg-white/5 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

