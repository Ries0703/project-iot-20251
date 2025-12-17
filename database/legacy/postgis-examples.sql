-- PostGIS Usage Examples for CityEar

-- 1. INSERT: Location tự động được tạo từ lat/lng bởi trigger
INSERT INTO sensor_events (id, "deviceId", lat, lng, "noiseLevel", "eventType", "timestamp")
VALUES 
    (gen_random_uuid(), 'device-001', 21.0285, 105.8342, 65.5, 'TRAFFIC', NOW()),
    (gen_random_uuid(), 'device-002', 21.0227, 105.8194, 125.0, 'GUNSHOT', NOW()),
    (gen_random_uuid(), 'device-003', 21.0317, 105.8500, 55.0, 'NORMAL', NOW());

-- 2. VERIFY: Check location column được populate
SELECT 
    "deviceId",
    lat,
    lng,
    ST_AsText(location) as location_wkt,
    ST_X(location) as longitude,
    ST_Y(location) as latitude
FROM sensor_events
LIMIT 5;

-- 3. DISTANCE: Tìm events trong bán kính 1km từ một điểm
-- Example: Tìm events gần Hồ Gươm (21.0285°N, 105.8542°E)
SELECT 
    "deviceId",
    "noiseLevel",
    "eventType",
    ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(105.8542, 21.0285), 4326)::geography
    ) / 1000 as distance_km
FROM sensor_events
WHERE ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(105.8542, 21.0285), 4326)::geography,
    1000  -- 1km radius
)
ORDER BY distance_km
LIMIT 10;

-- 4. GEOFENCING: Tìm events trong một khu vực (polygon)
-- Example: Find events in Old Quarter (Phố Cổ) area
SELECT 
    "deviceId",
    "noiseLevel",
    "eventType",
    "timestamp"
FROM sensor_events
WHERE ST_Within(
    location,
    ST_GeomFromText('POLYGON((
        105.847 21.035,
        105.858 21.035,
        105.858 21.025,
        105.847 21.025,
        105.847 21.035
    ))', 4326)
)
AND "timestamp" > NOW() - INTERVAL '1 hour';

-- 5. CLUSTERING: Nhóm events gần nhau (100m radius)
-- Useful for detecting incident clusters
SELECT 
    ST_AsText(ST_Centroid(ST_Collect(location))) as cluster_center,
    COUNT(*) as event_count,
    AVG("noiseLevel") as avg_noise,
    COUNT(*) FILTER (WHERE "eventType" IN ('GUNSHOT', 'SCREAM')) as alerts
FROM sensor_events
WHERE "timestamp" > NOW() - INTERVAL '10 minutes'
GROUP BY ST_SnapToGrid(location, 0.001)  -- ~100m grid
HAVING COUNT(*) > 3
ORDER BY event_count DESC;

-- 6. NEAREST NEIGHBORS: Tìm 5 sensors gần nhất với một vị trí
SELECT 
    "deviceId",
    "noiseLevel",
    "eventType",
    ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(105.8342, 21.0285), 4326)::geography
    ) as distance_meters
FROM sensor_events
WHERE "timestamp" > NOW() - INTERVAL '5 minutes'
ORDER BY location <-> ST_SetSRID(ST_MakePoint(105.8342, 21.0285), 4326)
LIMIT 5;

-- 7. HEATMAP DATA: Aggregate events by grid cells (for frontend heatmap)
SELECT 
    ST_AsGeoJSON(ST_Centroid(ST_SnapToGrid(location, 0.01))) as grid_center,
    COUNT(*) as event_count,
    AVG("noiseLevel") as avg_noise,
    MAX("noiseLevel") as max_noise
FROM sensor_events
WHERE "timestamp" > NOW() - INTERVAL '1 hour'
GROUP BY ST_SnapToGrid(location, 0.01)  -- ~1km grid
ORDER BY event_count DESC;

-- 8. ROUTE ANALYSIS: Events along a path (e.g., bus route)
-- Create a line from Hoan Kiem to Cau Giay
WITH route AS (
    SELECT ST_MakeLine(ARRAY[
        ST_SetSRID(ST_MakePoint(105.8542, 21.0285), 4326),
        ST_SetSRID(ST_MakePoint(105.7963, 21.0278), 4326)
    ]) as path
)
SELECT 
    e."deviceId",
    e."noiseLevel",
    e."eventType",
    ST_Distance(e.location::geography, r.path::geography) as distance_from_route
FROM sensor_events e, route r
WHERE ST_DWithin(
    e.location::geography,
    r.path::geography,
    500  -- 500m buffer on both sides
)
AND e."timestamp" > NOW() - INTERVAL '1 hour'
ORDER BY distance_from_route;

-- 9. SPATIAL STATISTICS
SELECT 
    "eventType",
    COUNT(*) as total_events,
    ST_AsText(ST_Centroid(ST_Collect(location))) as geographic_center,
    ST_Area(ST_ConvexHull(ST_Collect(location))::geography) / 1000000 as coverage_area_km2
FROM sensor_events
WHERE "timestamp" > NOW() - INTERVAL '24 hours'
GROUP BY "eventType";

-- 10. CLEANUP: Delete test data
-- DELETE FROM sensor_events WHERE "deviceId" LIKE 'device-%';
