# Database Schema Documentation

## Overview
CityEar uses PostgreSQL 14 with PostGIS extension for storing and querying sensor events with geospatial capabilities.

## Tables

### sensor_events

Stores all noise measurement events from IoT devices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique event identifier |
| `deviceId` | VARCHAR(100) | NOT NULL, INDEXED | Device identifier |
| `lat` | FLOAT | NOT NULL | Latitude coordinate |
| `lng` | FLOAT | NOT NULL | Longitude coordinate |
| `noiseLevel` | FLOAT | NOT NULL, INDEXED | Noise level in decibels (dB) |
| `eventType` | ENUM | NOT NULL, INDEXED | Event classification |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NOT NULL, INDEXED | Event occurrence time |
| `createdAt` | TIMESTAMP WITH TIME ZONE | NOT NULL | Record creation time |

### Event Types

The `eventType` column uses an ENUM with the following values:

- **NORMAL**: Background noise (< 50 dB)
- **TRAFFIC**: Traffic-related noise (50-80 dB)
- **GUNSHOT**: Potential gunshot detection (> 120 dB)
- **SCREAM**: Potential scream detection (~100 dB)

## Indexes

For optimal query performance at 200 events/second:

- `idx_sensor_events_deviceId` - Fast device-specific queries
- `idx_sensor_events_timestamp` - Time-range queries and sorting
- `idx_sensor_events_eventType` - Filter by event type (anomaly detection)
- `idx_sensor_events_noiseLevel` - Range queries on noise levels

## Performance Optimizations

1. **Connection Pooling**: 
   - Min connections: 5
   - Max connections: 20
   - Connection timeout: 2000ms

2. **Batch Inserts**: 
   - Buffer size: 100 events
   - Flush interval: 1 second
   - Immediate write for GUNSHOT/SCREAM events

3. **Indexes**: 
   - All frequently queried columns are indexed
   - Composite indexes for common query patterns

## Future Enhancements

### PostGIS Integration

For advanced geospatial queries, consider adding:

```sql
-- Add geometry column
ALTER TABLE sensor_events 
ADD COLUMN location GEOMETRY(Point, 4326);

-- Create spatial index
CREATE INDEX idx_sensor_events_location 
ON sensor_events USING GIST(location);

-- Example: Find events within 1km radius
SELECT * FROM sensor_events
WHERE ST_DWithin(
  location, 
  ST_SetSRID(ST_MakePoint(105.8342, 21.0285), 4326)::geography,
  1000
);
```

## Query Examples

### Recent high-noise events
```sql
SELECT * FROM sensor_events
WHERE noiseLevel > 80
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

### Anomaly detection
```sql
SELECT deviceId, COUNT(*) as alert_count
FROM sensor_events
WHERE eventType IN ('GUNSHOT', 'SCREAM')
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY deviceId
ORDER BY alert_count DESC;
```

### Heatmap data aggregation
```sql
SELECT 
  DATE_TRUNC('minute', timestamp) as minute,
  AVG(noiseLevel) as avg_noise,
  MAX(noiseLevel) as max_noise,
  COUNT(*) as event_count
FROM sensor_events
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute DESC;
```
