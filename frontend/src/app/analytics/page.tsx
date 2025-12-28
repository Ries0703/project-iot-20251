'use client';

import { useEffect, useState, useMemo } from 'react';
import { AnalyticsService, AnalyticsStats, TrendPoint, DistributionPoint, AlertLog } from '../../services/analytics.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar, LabelList
} from 'recharts';
import { Activity, AlertTriangle, Volume2, MapPin, Filter } from 'lucide-react';
import { Loader } from '../../components/ui/loader';

// Grafana-inspired Palette
const COLORS = {
    NORMAL: 'var(--color-chart-1)',   // Emerald
    TRAFFIC: 'var(--color-chart-2)',  // Cyan
    GUNSHOT: 'var(--color-chart-4)',  // Rose
    SCREAM: 'var(--color-chart-5)'    // Yellow
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="min-w-[8rem] rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
                {label && <p className="mb-1.5 text-muted-foreground font-medium">{label}</p>}
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex w-full items-center gap-2 mb-1 last:mb-0">
                        <span className="h-2 w-2 rounded-full ring-1 ring-border" style={{ backgroundColor: entry.color }}></span>
                        <span className="text-foreground capitalize font-semibold">{entry.name}:</span>
                        <span className="font-mono font-bold text-foreground tabular-nums ml-auto">
                            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function AnalyticsPage() {
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [trend, setTrend] = useState<TrendPoint[]>([]);
    const [distribution, setDistribution] = useState<DistributionPoint[]>([]);
    const [alerts, setAlerts] = useState<AlertLog[]>([]);
    const [topNoisy, setTopNoisy] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [trendBucket, setTrendBucket] = useState('5 minutes');

    // Filter States
    // Filter States
    // Pagination & Sort State
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingAlerts, setIsFetchingAlerts] = useState(false);

    // Draft Filter State (UI inputs)
    const [draftDevice, setDraftDevice] = useState('');
    const [draftType, setDraftType] = useState('ALL');
    const [draftMinNoise, setDraftMinNoise] = useState<number | ''>('');
    const [draftMaxNoise, setDraftMaxNoise] = useState<number | ''>('');
    const [draftStart, setDraftStart] = useState('');
    const [draftEnd, setDraftEnd] = useState('');
    const [draftSortBy, setDraftSortBy] = useState<'timestamp' | 'noiseLevel'>('timestamp');
    const [draftSortOrder, setDraftSortOrder] = useState<'ASC' | 'DESC'>('DESC');

    // Applied Filter State (Actually used for fetching)
    const [activeFilters, setActiveFilters] = useState({
        deviceId: '',
        type: 'ALL',
        minNoise: '' as number | '',
        maxNoise: '' as number | '',
        start: '',
        end: '',
        sortBy: 'timestamp' as 'timestamp' | 'noiseLevel',
        sortOrder: 'DESC' as 'ASC' | 'DESC'
    });

    // UI State
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [statsData, distData, topData, activityData] = await Promise.all([
                    AnalyticsService.getStats(),
                    AnalyticsService.getDistribution(),
                    AnalyticsService.getTopNoisy(),
                    AnalyticsService.getActivity()
                ]);

                setStats(statsData);
                setDistribution(distData);
                setTopNoisy(topData);

                // Fill missing 24h
                const filledActivity = [];
                const now = new Date();
                const currentHour = now.getHours();

                for (let i = 23; i >= 0; i--) {
                    const h = (currentHour - i + 24) % 24;
                    const timeLabel = `${h.toString().padStart(2, '0')}:00`;
                    const found = activityData.find((d: any) => d.time === timeLabel);
                    filledActivity.push(found || { time: timeLabel, routine: 0, critical: 0 });
                }

                setActivity(filledActivity);
            } catch (err) {
                console.error('Failed to load stats', err);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
        const interval = setInterval(loadStats, 5000);
        return () => clearInterval(interval);
    }, []);

    // Dedicated Trend Effect
    useEffect(() => {
        const loadTrend = async () => {
            const trendData = await AnalyticsService.getTrend(trendBucket);
            setTrend(trendData);
        };
        loadTrend();
        const interval = setInterval(loadTrend, 5000);
        return () => clearInterval(interval);
    }, [trendBucket]);

    // Filter Logic: Fetch on filter change (Debounced ideally, but direct effect for now)
    // We separate this to avoid refreshing filters every 5s if user is typing
    // Filter Logic: Reset and fetch logic
    // Apply Filters Handler
    const handleApplyFilters = () => {
        setPage(0);
        setHasMore(true);
        setActiveFilters({
            deviceId: draftDevice,
            type: draftType,
            minNoise: draftMinNoise,
            maxNoise: draftMaxNoise,
            start: draftStart,
            end: draftEnd,
            sortBy: draftSortBy,
            sortOrder: draftSortOrder
        });
        setIsFilterOpen(false);
    };

    // Fetch Alerts Effect
    useEffect(() => {
        const fetchAlerts = async () => {
            if (!hasMore && page > 0) return;

            setIsFetchingAlerts(true);
            try {
                const limit = 20;
                const data = await AnalyticsService.getAlerts({
                    deviceId: activeFilters.deviceId,
                    type: activeFilters.type === 'ALL' ? undefined : activeFilters.type,
                    minNoise: activeFilters.minNoise,
                    maxNoise: activeFilters.maxNoise,
                    start: activeFilters.start,
                    end: activeFilters.end,
                    skip: page * limit,
                    take: limit,
                    sortBy: activeFilters.sortBy,
                    sortOrder: activeFilters.sortOrder
                });

                if (data.length < limit) {
                    setHasMore(false);
                }

                setAlerts(prev => page === 0 ? data : [...prev, ...data]);
            } catch (e) {
                console.error("Failed to fetch alerts", e);
            } finally {
                setIsFetchingAlerts(false);
            }
        };

        fetchAlerts();
    }, [page, activeFilters]);

    // Infinite Scroll Handler
    const handleScroll = (e: any) => {
        const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
        if (bottom && hasMore && !isFetchingAlerts) {
            setPage(prev => prev + 1);
        }
    };

    const totalEvents = useMemo(() => distribution.reduce((acc, curr) => acc + curr.value, 0), [distribution]);

    // Global Styles: Chart outlines & Input Spinners
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .recharts-wrapper { outline: none !important; } 
            *:focus { outline: none !important; }
            
            /* Hide number input spinners */
            input[type=number]::-webkit-inner-spin-button, 
            input[type=number]::-webkit-outer-spin-button { 
                -webkit-appearance: none; 
                margin: 0; 
            }
            input[type=number] {
                -moz-appearance: textfield;
            }
        `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); }
    }, []);

    if (loading && !stats) return (
        <div className="flex items-center justify-center h-screen bg-background text-emerald-500 animate-pulse">
            Initializing Dashboard...
        </div>
    );

    return (
        <div className="space-y-6 p-6 min-h-screen bg-background text-slate-200 font-sans selection:bg-emerald-500/30">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Activity className="w-6 h-6 text-emerald-400" />
                        CityEar Analytics
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">REAL-TIME NOISE INTELLIGENCE SYSTEM</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-xs animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    LIVE FEED
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Total Events (New) */}
                <Card className="bg-card border-border hover:border-blue-500/30 transition-all rounded-sm shadow-lg">
                    <CardContent className="p-6">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Detected</p>
                        <div className="text-4xl font-bold text-blue-500 flex items-end gap-2">
                            {totalEvents.toLocaleString()}
                        </div>
                        <p className="text-xs text-blue-400/60 mt-2">All classified audio events</p>
                    </CardContent>
                </Card>

                {/* KPI 2: Critical Alerts */}
                <Card className="bg-card border-border hover:border-rose-500/30 transition-all rounded-sm shadow-lg">
                    <CardContent className="p-6">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Critical Events</p>
                        <div className="text-4xl font-bold text-rose-500 flex items-end gap-2">
                            {stats?.totalAlerts}
                        </div>
                        <p className="text-xs text-rose-400/60 mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Gunshots & Screams
                        </p>
                    </CardContent>
                </Card>

                {/* KPI 3: Max Noise */}
                <Card className="bg-card border-border hover:border-emerald-500/30 transition-all rounded-sm shadow-lg">
                    <CardContent className="p-6 relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-3 opacity-10"><Volume2 className="w-16 h-16 text-white" /></div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Peak Noise (24h)</p>
                        <div className="text-4xl font-bold text-white flex items-end gap-2">
                            {stats?.maxNoise} <span className="text-lg text-slate-500 mb-1">dB</span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 mt-4 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-rose-500 w-[70%]"></div>
                        </div>
                    </CardContent>
                </Card>

                {/* KPI 4: Avg Noise */}
                <Card className="bg-card border-border hover:border-cyan-500/30 transition-all rounded-sm shadow-lg">
                    <CardContent className="p-6">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">City Average</p>
                        <div className="text-4xl font-bold text-cyan-400 flex items-end gap-2">
                            {stats?.avgNoise} <span className="text-lg text-slate-500 mb-1">dB</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Baseline: 60dB (+32%)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[350px]">
                {/* Distribution Pie (Solid) */}
                <Card className="bg-card border-border rounded-sm shadow-lg flex flex-col">
                    <CardHeader className="py-3 border-b border-border">
                        <CardTitle className="text-sm font-semibold text-slate-300">Event Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distribution}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                    label={(props: any) => {
                                        const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
                                        const RADIAN = Math.PI / 180;
                                        const radius = (innerRadius || 0) + (outerRadius - (innerRadius || 0)) * 0.6;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                        if (!percent || percent <= 0.05) return null;

                                        return (
                                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="bold" fontFamily="monospace">
                                                {`${(percent * 100).toFixed(0)}%`}
                                            </text>
                                        );
                                    }}
                                    labelLine={false}
                                >
                                    {distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#444'} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-sans)', color: 'var(--color-muted-foreground)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Trend Area Chart */}
                <Card className="bg-card border-border rounded-sm shadow-lg flex flex-col">
                    <CardHeader className="py-3 border-b border-border flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            Noise Trend (24h)
                        </CardTitle>
                        <Select value={trendBucket} onValueChange={setTrendBucket}>
                            <SelectTrigger className="w-[140px] h-7 text-xs bg-background border-border text-slate-300">
                                <SelectValue placeholder="Select bucket" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1 minute">High Res (1m)</SelectItem>
                                <SelectItem value="5 minutes">Medium (5m)</SelectItem>
                                <SelectItem value="15 minutes">Low (15m)</SelectItem>
                                <SelectItem value="1 hour">Hourly</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend} className="!outline-none focus:outline-none">
                                <defs>
                                    <linearGradient id="colorNoise" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.2} />
                                <XAxis
                                    dataKey="time"
                                    stroke="var(--color-muted-foreground)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    interval={60}
                                    minTickGap={10}
                                />
                                <YAxis
                                    stroke="var(--color-muted-foreground)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[40, 100]}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="avgNoise"
                                    stroke="var(--color-chart-1)"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorNoise)"
                                    name="Noise Level (dB)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[350px]">
                {/* Top Noisy Sensors */}
                <Card className="bg-card border-border rounded-sm shadow-lg flex flex-col">
                    <CardHeader className="py-3 border-b border-border">
                        <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-rose-500" />
                            Noise Hotspots (Top 5)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topNoisy} layout="vertical" barCategoryGap={10} className="!outline-none focus:outline-none">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={true} vertical={false} opacity={0.2} />
                                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} hide />
                                <YAxis
                                    dataKey="deviceId"
                                    type="category"
                                    width={100}
                                    stroke="var(--color-muted-foreground)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    fontFamily="var(--font-mono)"
                                />
                                <Tooltip content={<CustomTooltip />} cursor={false} />
                                <Bar
                                    dataKey="avgNoise"
                                    fill="var(--color-chart-4)"
                                    activeBar={{ fill: 'var(--color-chart-4)', stroke: 'var(--color-foreground)', strokeWidth: 1, textAnchor: 'start', opacity: 1, filter: 'drop-shadow(0 0 4px var(--color-chart-4))' }}
                                    radius={[0, 4, 4, 0]}
                                    barSize={16}
                                    name="Avg dB"
                                    background={{ fill: 'var(--color-muted)/20' }}
                                >
                                    <LabelList dataKey="avgNoise" position="insideRight" fill="white" fontSize={10} fontWeight="bold" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Hourly Activity Volume */}
                <Card className="bg-card border-border rounded-sm shadow-lg flex flex-col">
                    <CardHeader className="py-3 border-b border-border">
                        <CardTitle className="text-sm font-semibold text-slate-300">24h Activity Volume</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activity}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.2} />
                                <XAxis dataKey="time" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--color-muted-foreground)" fontSize={10} allowDecimals={false} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={false} />
                                <Bar dataKey="routine" stackId="a" fill="var(--color-chart-2)" activeBar={{ fill: 'var(--color-chart-2)', filter: 'drop-shadow(0 0 6px var(--color-chart-2))' }} name="Routine" barSize={20} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="critical" stackId="a" fill="var(--color-chart-4)" activeBar={{ fill: 'var(--color-chart-4)', filter: 'drop-shadow(0 0 6px var(--color-chart-4))' }} name="Critical" barSize={20} radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Alerts Log */}
            <Card className="bg-card border-border rounded-sm shadow-lg overflow-hidden">
                <CardHeader className="py-3 px-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <CardTitle className="text-sm font-semibold text-slate-200">Incident Log</CardTitle>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 border border-border">{alerts.length} events</span>
                    </div>

                    {/* Notion-style Filter Toggle */}
                    <div className="relative z-20">
                        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`h-8 gap-2 border-border bg-background text-xs hover:bg-white/5 hover:text-white ${isFilterOpen ? 'border-emerald-500/50 text-emerald-400' : 'text-slate-300'}`}
                                >
                                    <Filter className="w-3 h-3" />
                                    Filter & Sort
                                    {(activeFilters.deviceId || activeFilters.type !== 'ALL' || activeFilters.minNoise || activeFilters.maxNoise) && (
                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4 bg-popover border-border space-y-4" align="end">
                                {/* Sort Section */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Sort By</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDraftSortBy('timestamp')}
                                            className={`h-7 text-xs ${draftSortBy === 'timestamp' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:text-emerald-300' : 'border-border text-slate-400'}`}
                                        >
                                            Time
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDraftSortBy('noiseLevel')}
                                            className={`h-7 text-xs ${draftSortBy === 'noiseLevel' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:text-emerald-300' : 'border-border text-slate-400'}`}
                                        >
                                            Noise
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDraftSortOrder('DESC')}
                                            className={`h-7 text-xs ${draftSortOrder === 'DESC' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 hover:text-blue-300' : 'border-border text-slate-400'}`}
                                        >
                                            High ➔ Low
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDraftSortOrder('ASC')}
                                            className={`h-7 text-xs ${draftSortOrder === 'ASC' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 hover:text-blue-300' : 'border-border text-slate-400'}`}
                                        >
                                            Low ➔ High
                                        </Button>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-border"></div>

                                {/* Filters Section */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Filters</h4>

                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-400">Classification</Label>
                                        <Select value={draftType} onValueChange={setDraftType}>
                                            <SelectTrigger className="h-8 text-xs bg-background border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">All Events</SelectItem>
                                                <SelectItem value="GUNSHOT">Gunshot</SelectItem>
                                                <SelectItem value="SCREAM">Scream</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-400">Device ID</Label>
                                        <Input
                                            placeholder="e.g. device-001"
                                            value={draftDevice}
                                            onChange={(e) => setDraftDevice(e.target.value)}
                                            className="h-8 text-xs bg-background border-border"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-400">Noise Range (dB)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Min"
                                                value={draftMinNoise}
                                                onChange={(e) => setDraftMinNoise(e.target.value === '' ? '' : Number(e.target.value))}
                                                className="h-8 text-xs bg-background border-border text-center"
                                                showSpinner
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Max"
                                                value={draftMaxNoise}
                                                onChange={(e) => setDraftMaxNoise(e.target.value === '' ? '' : Number(e.target.value))}
                                                className="h-8 text-xs bg-background border-border text-center"
                                                showSpinner
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-400">Time Range</Label>
                                        <div className="space-y-1">
                                            <Input
                                                type="datetime-local"
                                                value={draftStart}
                                                onChange={(e) => setDraftStart(e.target.value)}
                                                className="h-8 text-[10px] bg-background border-border"
                                            />
                                            <Input
                                                type="datetime-local"
                                                value={draftEnd}
                                                onChange={(e) => setDraftEnd(e.target.value)}
                                                className="h-8 text-[10px] bg-background border-border"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-border"></div>

                                <Button
                                    onClick={handleApplyFilters}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-bold"
                                >
                                    APPLY CHANGES
                                </Button>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
                <CardContent className="p-0 relative min-h-[300px]">
                    {/* Loading Overlay - Prevents shrinking */}
                    {isFetchingAlerts && page === 0 && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
                            <Loader />
                        </div>
                    )}

                    <div
                        className="overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                        onScroll={handleScroll}
                    >
                        <table className="w-full text-xs text-left text-slate-400">
                            <thead className="text-[10px] uppercase tracking-wider bg-background text-slate-500 font-medium sticky top-0 z-10 border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 font-normal">Timestamp</th>
                                    <th className="px-6 py-3 font-normal">Device ID</th>
                                    <th className="px-6 py-3 font-normal">Event Type</th>
                                    <th className="px-6 py-3 font-normal text-right">Noise Level</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {alerts.length === 0 && !isFetchingAlerts ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-600">No events found matching your criteria.</td></tr>
                                ) : (
                                    alerts.map((alert) => (
                                        <tr key={alert.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-2.5 text-slate-300 group-hover:text-white transition-colors border-l-2 border-transparent hover:border-emerald-500/50">
                                                {new Date(alert.timestamp).toLocaleString(undefined, {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                                                })}
                                            </td>
                                            <td className="px-6 py-2.5">
                                                <span className="text-cyan-600 group-hover:text-cyan-400 transition-colors">{alert.deviceId}</span>
                                            </td>
                                            <td className="px-6 py-2.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${alert.eventType === 'GUNSHOT'
                                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                    <span className={`w-1 h-1 rounded-full ${alert.eventType === 'GUNSHOT' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                                                    {alert.eventType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-2.5 text-right">
                                                <span className={`font-bold ${alert.noiseLevel > 110 ? 'text-rose-400' : 'text-slate-300'}`}>
                                                    {alert.noiseLevel.toFixed(1)}
                                                </span>
                                                <span className="text-slate-600 ml-1 font-normal">dB</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {isFetchingAlerts && page > 0 && (
                            <div className="py-4 flex justify-center">
                                <Loader size="sm" />
                            </div>
                        )}
                        {!hasMore && alerts.length > 0 && (
                            <div className="py-4 text-center text-slate-600 font-mono text-[10px]">
                                — End of Log —
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="text-center text-[10px] text-slate-600 font-mono pb-4">
                CityEar Analytics v1.2 • Connected to Node: main-cluster-01
            </div>
        </div>
    );
}
