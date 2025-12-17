-- Comprehensive system health check

-- 1. Check for duplicate IDs (should be 0)
SELECT COUNT(*) as duplicate_count 
FROM (
    SELECT id, COUNT(*) 
    FROM sensor_events 
    WHERE "deviceId" LIKE 'device-%'
    GROUP BY id 
    HAVING COUNT(*) > 1
) duplicates;

-- 2. Check timestamp consistency (look for future timestamps or weird gaps)
SELECT 
    MIN("timestamp") as earliest_event,
    MAX("timestamp") as latest_event,
    MAX("timestamp") - MIN("timestamp") as time_range,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE "timestamp" > NOW()) as future_events
FROM sensor_events
WHERE "deviceId" LIKE 'device-%';

-- 3. Check for NULL values (should be 0 for critical fields)
SELECT 
    COUNT(*) FILTER (WHERE "deviceId" IS NULL) as null_deviceId,
    COUNT(*) FILTER (WHERE lat IS NULL) as null_lat,
    COUNT(*) FILTER (WHERE lng IS NULL) as null_lng,
    COUNT(*) FILTER (WHERE "noiseLevel" IS NULL) as null_noise,
    COUNT(*) FILTER (WHERE "eventType" IS NULL) as null_eventType,
    COUNT(*) FILTER (WHERE location IS NULL) as null_location
FROM sensor_events
WHERE "deviceId" LIKE 'device-%';

-- 4. Check location validity (all should be within Hanoi bounds)
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE lat < 20.88 OR lat > 21.38) as out_of_bounds_lat,
    COUNT(*) FILTER (WHERE lng < 105.73 OR lng > 106.03) as out_of_bounds_lng
FROM sensor_events
WHERE "deviceId" LIKE 'device-%';

-- 5. Check noise level sanity (should be 30-140 dB range)
SELECT 
    MIN("noiseLevel") as min_noise,
    MAX("noiseLevel") as max_noise,
    AVG("noiseLevel")::numeric(10,2) as avg_noise,
    COUNT(*) FILTER (WHERE "noiseLevel" < 30) as too_quiet,
    COUNT(*) FILTER (WHERE "noiseLevel" > 140) as too_loud
FROM sensor_events
WHERE "deviceId" LIKE 'device-%';

-- 6. Check device distribution (should have ~50 unique devices)
SELECT 
    COUNT(DISTINCT "deviceId") as unique_devices,
    COUNT(*) / COUNT(DISTINCT "deviceId") as avg_events_per_device
FROM sensor_events
WHERE "deviceId" LIKE 'device-%';

-- 7. Check ingestion rate over time (events per 5-second window)
SELECT 
    time_bucket('5 seconds', "timestamp") as time_window,
    COUNT(*) as events_in_window
FROM sensor_events
WHERE "deviceId" LIKE 'device-%'
  AND "timestamp" > NOW() - INTERVAL '1 minute'
GROUP BY time_window
ORDER BY time_window DESC
LIMIT 12;

-- 8. Check PostGIS location data integrity
SELECT 
    COUNT(*) FILTER (WHERE location IS NOT NULL) as has_location,
    COUNT(*) FILTER (WHERE ST_X(location) IS NOT NULL) as has_longitude,
    COUNT(*) FILTER (WHERE ST_Y(location) IS NOT NULL) as has_latitude
FROM sensor_events
WHERE "deviceId" LIKE 'device-%';

-- 9. Recent error patterns (sudden spike in anomalies could indicate issue)
SELECT 
    time_bucket('1 minute', "timestamp") as minute,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE "eventType" = 'GUNSHOT') as gunshots,
    COUNT(*) FILTER (WHERE "eventType" = 'SCREAM') as screams,
    ROUND(COUNT(*) FILTER (WHERE "eventType" IN ('GUNSHOT', 'SCREAM')) * 100.0 / COUNT(*), 2) as anomaly_rate
FROM sensor_events
WHERE "deviceId" LIKE 'device-%'
  AND "timestamp" > NOW() - INTERVAL '5 minutes'
GROUP BY minute
ORDER BY minute DESC;
