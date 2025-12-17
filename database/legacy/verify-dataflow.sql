-- Real-time dataflow verification

-- 1. Events per minute (should see ~600 events/min = 50 devices × 12 publishes)
SELECT 
    time_bucket('1 minute', "timestamp") as minute,
    COUNT(*) as events,
    COUNT(DISTINCT "deviceId") as devices,
    ROUND(AVG("noiseLevel"), 1) as avg_noise
FROM sensor_events
WHERE "deviceId" LIKE 'device-%'
  AND "timestamp" > NOW() - INTERVAL '5 minutes'
GROUP BY minute
ORDER BY minute DESC;

-- 2. Recent anomalies (verify alert detection)
SELECT 
    "deviceId",
    "eventType",
    "noiseLevel",
    "timestamp",
    AGE(NOW(), "timestamp") as time_ago
FROM sensor_events
WHERE "deviceId" LIKE 'device-%'
  AND "eventType" IN ('GUNSHOT', 'SCREAM')
  AND "timestamp" > NOW() - INTERVAL '10 minutes'
ORDER BY "timestamp" DESC
LIMIT 10;

-- 3. Ingestion health check
SELECT 
    COUNT(*) FILTER (WHERE "timestamp" > NOW() - INTERVAL '30 seconds') as last_30sec,
    COUNT(*) FILTER (WHERE "timestamp" > NOW() - INTERVAL '1 minute') as last_1min,
    COUNT(*) FILTER (WHERE "timestamp" > NOW() - INTERVAL '5 minutes') as last_5min,
    MAX("timestamp") as latest_event,
    NOW() - MAX("timestamp") as lag
FROM sensor_events
WHERE "deviceId" LIKE 'device-%';
