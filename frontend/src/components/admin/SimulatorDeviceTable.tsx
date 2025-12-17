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
import { Loader2, Siren, Volume2, Power, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const SIMULATOR_API = process.env.NEXT_PUBLIC_SIMULATOR_API_URL || 'http://localhost:3001';

export function SimulatorDeviceTable() {
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
        if (!confirm(`Are you sure you want to delete ${device.name}?`)) return;

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
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                        {row.original.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold text-sm text-slate-100">{row.original.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono tracking-wide">{row.original.id}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'profile',
            header: 'Profile',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-slate-800 text-slate-400 hover:bg-slate-800 border-none font-normal">
                        {row.original.profile}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: 'isActive',
            header: 'Status',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className={`flex h-2 w-2 rounded-full ${row.original.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></span>
                    <span className={`text-sm font-medium ${row.original.isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                        {row.original.isActive ? 'Ready' : 'Stopped'}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'coordinates',
            header: 'Location',
            cell: ({ row }) => (
                <div className="font-mono text-xs text-slate-500">
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
        <div className="space-y-4">
            {/* Header / Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Search by ID or Name..."
                        className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-slate-400">
                        Total: <span className="text-slate-100 font-bold">{devices.length}</span>
                    </div>

                </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-black overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-900/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-slate-800 hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="h-10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                                    className="group border-slate-800 transition-colors hover:bg-slate-900/30"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                                    No devices found. Deploy one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls - Clean, grouped on the right */}
            <div className="flex items-center justify-end gap-6 py-2 px-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Rows per page</span>
                    <select
                        className="h-8 w-16 rounded border border-slate-800 bg-slate-950 text-xs text-slate-300 focus:border-indigo-500 focus:ring-0 focus:outline-none"
                        value={table.getState().pagination.pageSize}
                        onChange={e => {
                            table.setPageSize(Number(e.target.value))
                        }}
                    >
                        {[10, 20, 30, 40, 50].map(pageSize => (
                            <option key={pageSize} value={pageSize}>
                                {pageSize}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 min-w-[4rem] text-right">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-colors"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-colors"
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

