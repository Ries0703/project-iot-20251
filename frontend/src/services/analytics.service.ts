
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface AnalyticsStats {
    maxNoise: string;
    avgNoise: string;
    totalAlerts: number;
}

export interface TrendPoint {
    time: string;
    avgNoise: number;
    [key: string]: any;
}

export interface DistributionPoint {
    name: string;
    value: number;
    [key: string]: any;
}

export interface AlertLog {
    id: string;
    deviceId: string;
    eventType: 'GUNSHOT' | 'SCREAM';
    noiseLevel: number;
    timestamp: string;
    location?: string;
}

export const AnalyticsService = {
    async getStats(): Promise<AnalyticsStats> {
        const res = await fetch(`${API_URL}/analytics/stats`);
        return res.json();
    },

    async getTrend(bucket: string = '5 minutes'): Promise<TrendPoint[]> {
        const res = await fetch(`${API_URL}/analytics/trend?bucket=${encodeURIComponent(bucket)}`);
        const data = await res.json();
        return data.map((d: any) => ({ ...d, avgNoise: parseFloat(d.avgNoise) }));
    },

    async getDistribution(): Promise<DistributionPoint[]> {
        const res = await fetch(`${API_URL}/analytics/distribution`);
        const data = await res.json();
        return data.map((d: any) => ({ ...d, value: parseInt(d.value, 10) }));
    },

    async getAlerts(params: any = {}): Promise<AlertLog[]> {
        const searchParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== '') {
                searchParams.append(key, params[key]);
            }
        });
        const res = await fetch(`${API_URL}/analytics/alerts?${searchParams.toString()}`);
        return res.json();
    },

    async getTopNoisy(): Promise<{ deviceId: string; avgNoise: number;[key: string]: any }[]> {
        const res = await fetch(`${API_URL}/analytics/top-noisy`);
        const data = await res.json();
        return data.map((d: any) => ({ ...d, avgNoise: parseFloat(d.avgNoise) }));
    },

    async getActivity(): Promise<{ time: string; routine: number; critical: number;[key: string]: any }[]> {
        const res = await fetch(`${API_URL}/analytics/activity`);
        return res.json();
    }
};
