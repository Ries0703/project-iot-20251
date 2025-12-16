import DashboardLayout from '@/components/DashboardLayout';
import StoreInitializer from '@/components/StoreInitializer';

interface DeviceData {
  id: string;
  deviceId: string;
  lat: number;
  lng: number;
  noiseLevel: number;
  eventType: 'NORMAL' | 'TRAFFIC' | 'GUNSHOT' | 'SCREAM';
  timestamp: string;
  lastSeen: number;
}

// Function to fetch initial snapshot from Backend API
async function getInitialDevices(): Promise<DeviceData[]> {
  // In Docker/K8s, we might use internal service name, but for this setup we use localhost
  // We need to ensure we hit the correct port (3000 for API Service)
  const apiUrl = process.env.API_URL || 'http://localhost:3000';

  try {
    // Fetch snapshot (e.g. last 30 mins heatmap data)
    const res = await fetch(`${apiUrl}/api/events/heatmap?minutes=30`, {
      cache: 'no-store' // Only cache for short duration or no-store for real-time-ish
    });

    if (!res.ok) {
      console.error('Failed to fetch initial data:', res.statusText);
      return [];
    }

    const data = await res.json();

    // Transform API response to DeviceData format if needed
    // The API returns { devices: [...] } structure
    // Note: API returns `avgNoise` etc, but our Store expects `noiseLevel`.
    // We might need to map it or adjust the API. 
    // For simplicity, we use the raw data but map keys to match store.

    return data.devices.map((d: any) => ({
      id: d.deviceId, // Using deviceId as ID for map logic
      deviceId: d.deviceId,
      lat: d.lat,
      lng: d.lng,
      noiseLevel: parseFloat(d.avgNoise), // Use avg noise as initial level
      eventType: 'NORMAL', // Default to normal for initial state
      timestamp: d.lastSeen,
      lastSeen: new Date(d.lastSeen).getTime()
    }));

  } catch (error) {
    console.error('Error fetching initial devices:', error);
    return [];
  }
}

export default async function Page() {
  const devices = await getInitialDevices();

  return (
    <>
      <StoreInitializer devices={devices} />
      <DashboardLayout />
    </>
  );
}
