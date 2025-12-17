-- Test PostGIS trigger
INSERT INTO sensor_events (id, "deviceId", lat, lng, "noiseLevel", "eventType", "timestamp")
VALUES 
    (gen_random_uuid(), 'test-001', 21.0285, 105.8342, 65.5, 'TRAFFIC', NOW()),
    (gen_random_uuid(), 'test-002', 21.0227, 105.8194, 125.0, 'GUNSHOT', NOW()),
    (gen_random_uuid(), 'test-003', 21.0317, 105.8500, 55.0, 'NORMAL', NOW());

-- Verify location column
SELECT 
    "deviceId",
    lat,
    lng,
    ST_AsText(location) as location_wkt,
    ST_X(location) as longitude,
    ST_Y(location) as latitude
FROM sensor_events
ORDER BY "timestamp" DESC
LIMIT 3;
