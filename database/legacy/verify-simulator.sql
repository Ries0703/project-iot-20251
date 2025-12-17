-- Verify simulator data ingestion
SELECT 
    COUNT(*) as total_events,
    COUNT(DISTINCT "deviceId") as unique_devices,
    MIN("timestamp") as first_event,
    MAX("timestamp") as last_event,
    ROUND(AVG("noiseLevel"), 2) as avg_noise
FROM sensor_events 
WHERE "deviceId" LIKE 'device-%';

-- Event type distribution
SELECT 
    "eventType",
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM sensor_events
WHERE "deviceId" LIKE 'device-%'
GROUP BY "eventType"
ORDER BY count DESC;

-- Recent anomalies
SELECT 
    "deviceId",
    "eventType",
    "noiseLevel",
    "timestamp"
FROM sensor_events
WHERE "deviceId" LIKE 'device-%'
  AND "eventType" IN ('GUNSHOT', 'SCREAM')
ORDER BY "timestamp" DESC
LIMIT 10;
