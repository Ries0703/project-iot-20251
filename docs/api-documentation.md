# CityEar REST API Documentation

Base URL: `http://localhost:3000/api/events`

## Endpoints

### 1. GET `/recent`
Get recent sensor events.

**Query Parameters:**
- `minutes` (optional, default: 5) - Time range in minutes
- `limit` (optional, default: 100) - Maximum number of events

**Example:**
```bash
curl "http://localhost:3000/api/events/recent?minutes=10&limit=50"
```

**Response:**
```json
{
  "count": 50,
  "timeRange": "Last 10 minutes",
  "events": [...]
}
```

---

### 2. GET `/alerts`
Get recent alert events (GUNSHOT, SCREAM).

**Query Parameters:**
- `minutes` (optional, default: 60) - Time range in minutes
- `limit` (optional, default: 50) - Maximum number of alerts

**Example:**
```bash
curl "http://localhost:3000/api/events/alerts?minutes=30"
```

**Response:**
```json
{
  "count": 28,
  "timeRange": "Last 30 minutes",
  "alerts": [...]
}
```

---

### 3. GET `/device/:deviceId`
Get events for a specific device.

**Path Parameters:**
- `deviceId` - Device identifier (e.g., "device-0001")

**Query Parameters:**
- `minutes` (optional, default: 60) - Time range in minutes
- `limit` (optional, default: 100) - Maximum number of events

**Example:**
```bash
curl "http://localhost:3000/api/events/device/device-0001?minutes=30"
```

**Response:**
```json
{
  "deviceId": "device-0001",
  "count": 115,
  "events": [...]
}
```

---

### 4. GET `/stats`
Get aggregated statistics.

**Query Parameters:**
- `minutes` (optional, default: 60) - Time range in minutes

**Example:**
```bash
curl "http://localhost:3000/api/events/stats?minutes=5"
```

**Response:**
```json
{
  "timeRange": "Last 5 minutes",
  "totalEvents": 2900,
  "uniqueDevices": 50,
  "avgNoise": "80.36",
  "maxNoise": "129.30",
  "minNoise": "75.00",
  "anomalies": {
    "gunshot": 12,
    "scream": 16
  }
}
```

---

### 5. GET `/heatmap`
Get data for heatmap visualization.

**Query Parameters:**
- `minutes` (optional, default: 30) - Time range in minutes

**Example:**
```bash
curl "http://localhost:3000/api/events/heatmap?minutes=10"
```

**Response:**
```json
{
  "timeRange": "Last 10 minutes",
  "deviceCount": 50,
  "devices": [
    {
      "deviceId": "device-0028",
      "lat": 20.994181,
      "lng": 105.806628,
      "avgNoise": "80.5",
      "maxNoise": "123.3",
      "eventCount": 115,
      "lastSeen": "2025-12-16T11:29:50.013Z"
    },
    ...
  ]
}
```

---

### 6. GET `/health`
API health check.

**Example:**
```bash
curl "http://localhost:3000/api/events/health"
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-16T11:30:00.000Z",
  "database": "connected",
  "latestEvent": "2025-12-16T11:29:59.001Z",
  "lagMs": 456
}
```

---

## Error Responses

All endpoints return standard HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error

Error response format:
```json
{
  "statusCode": 500,
  "message": "Error description"
}
```

---

## CORS

CORS is enabled for all origins (`*`) in development mode.

---

## Rate Limiting

No rate limiting configured in development. Consider adding rate limiting for production.

---

## Frontend Integration Examples

### Fetch Recent Events
```typescript
const response = await fetch('http://localhost:3000/api/events/recent?minutes=5');
const data = await response.json();
console.log(`Received ${data.count} events`);
```

### Get Heatmap Data for Leaflet
```typescript
const response = await fetch('http://localhost:3000/api/events/heatmap?minutes=30');
const { devices } = await response.json();

devices.forEach(device => {
  L.circleMarker([device.lat, device.lng], {
    radius: device.avgNoise / 10,
    color: getColorByNoise(device.avgNoise)
  }).addTo(map);
});
```

### Poll for Alerts
```typescript
setInterval(async () => {
  const response = await fetch('http://localhost:3000/api/events/alerts?minutes=1');
  const { alerts } = await response.json();
  
  alerts.forEach(alert => {
    showNotification(`${alert.eventType} at ${alert.deviceId}`);
  });
}, 5000);
```
