# PostGIS trong CityEar

## 🗺️ PostGIS là gì?

PostGIS là PostgreSQL extension cho geospatial data. Nó cho phép bạn:
- Lưu trữ geometry/geography data (points, lines, polygons)
- Query theo khoảng cách, khu vực, direction
- Spatial indexing với GIST
- Advanced GIS functions

## 📍 Cách dùng trong CityEar

### 1. Storage: Geometry Column

Mỗi sensor event có 3 location fields:

```sql
lat FLOAT             -- Latitude (cho display)
lng FLOAT             -- Longitude (cho display)
location GEOMETRY     -- PostGIS Point (cho spatial queries)
```

**Trigger tự động populate:**
```sql
-- Bạn chỉ cần insert lat/lng
INSERT INTO sensor_events (lat, lng, ...)
VALUES (21.0285, 105.8342, ...);

-- location tự động được tạo!
-- location = POINT(105.8342 21.0285)
```

### 2. Query Use Cases

#### A. Tìm events trong bán kính

```sql
-- Tìm events trong 1km từ Hồ Gươm
SELECT * FROM sensor_events
WHERE ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(105.8542, 21.0285), 4326)::geography,
    1000  -- meters
);
```

**Frontend use case:** Click vào map → hiện events gần đó

#### B. Geofencing (Virtual fence)

```sql
-- Tìm events trong khu Phố Cổ
SELECT * FROM sensor_events
WHERE ST_Within(
    location,
    ST_GeomFromText('POLYGON((...))', 4326)
);
```

**Use case:** Alerts cho specific districts/zones

#### C. Clustering (Nhóm events gần nhau)

```sql
-- Detect incident clusters
SELECT 
    ST_AsText(ST_Centroid(ST_Collect(location))) as center,
    COUNT(*) as event_count
FROM sensor_events
WHERE "timestamp" > NOW() - INTERVAL '10 min'
GROUP BY ST_SnapToGrid(location, 0.001)  -- 100m grid
HAVING COUNT(*) > 5;
```

**Use case:** "Multiple gunshots detected in area X"

#### D. Route Analysis

```sql
-- Events dọc theo bus route
SELECT * FROM sensor_events
WHERE ST_DWithin(
    location::geography,
    line_path::geography,
    500  -- 500m buffer
);
```

**Use case:** Noise monitoring dọc traffic routes

#### E. Heatmap Grid

```sql
-- Aggregate events by grid cells
SELECT 
    ST_AsGeoJSON(ST_Centroid(ST_SnapToGrid(location, 0.01))) as grid,
    AVG("noiseLevel") as avg_noise
FROM sensor_events
GROUP BY ST_SnapToGrid(location, 0.01);
```

**Use case:** Real-time heatmap trên dashboard

### 3. Spatial Index (GIST)

```sql
CREATE INDEX idx_sensor_events_location 
ON sensor_events USING GIST(location);
```

**Performance:**
- Queries: Sub-second cho millions of points
- Scales: Hoạt động tốt với 1000+ sensors

### 4. Frontend Integration

#### Query gần sensor (TypeORM)

```typescript
const nearbyEvents = await connection.query(`
    SELECT 
        id,
        "deviceId",
        "noiseLevel",
        "eventType",
        ST_Distance(
            location::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000 as distance_km
    FROM sensor_events
    WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
    )
    AND "timestamp" > NOW() - INTERVAL '1 hour'
    ORDER BY distance_km
    LIMIT 10
`, [lng, lat, radiusMeters]);
```

#### GeoJSON cho Leaflet map

```typescript
const heatmapData = await connection.query(`
    SELECT 
        ST_AsGeoJSON(location) as geometry,
        "noiseLevel",
        "eventType"
    FROM sensor_events
    WHERE "timestamp" > NOW() - INTERVAL '1 hour'
`);

// Frontend: Render trên Leaflet
heatmapData.forEach(row => {
    const geojson = JSON.parse(row.geometry);
    L.circleMarker([geojson.coordinates[1], geojson.coordinates[0]], {
        radius: row.noiseLevel / 10,
        color: getColorByEventType(row.eventType)
    }).addTo(map);
});
```

## 🎯 Tại sao dùng PostGIS?

### So với chỉ dùng lat/lng:

**Không dùng PostGIS:**
```sql
-- Slow! Phải tính distance cho mọi row
SELECT * FROM sensor_events
WHERE sqrt(pow(lat - 21.0285, 2) + pow(lng - 105.8342, 2)) < 0.01;
```

**Dùng PostGIS với GIST index:**
```sql
-- Fast! Index-based
SELECT * FROM sensor_events
WHERE ST_DWithin(location::geography, point, 1000);
```

### Performance difference:
- **No index**: O(n) - scan all rows
- **GIST index**: O(log n) - spatial tree search
- **Result**: 100x faster cho large datasets

## 📚 Các functions hay dùng

- `ST_MakePoint(lng, lat)` - Create point từ coordinates
- `ST_SetSRID(geom, 4326)` - Set coordinate system (WGS84)
- `ST_Distance(a, b)` - Khoảng cách (meters)
- `ST_DWithin(a, b, distance)` - Check within radius
- `ST_Within(point, polygon)` - Point in polygon
- `ST_AsGeoJSON(geom)` - Export to GeoJSON
- `ST_AsText(geom)` - Export to WKT
- `ST_Centroid(geom)` - Tìm trung tâm
- `ST_Collect(geom)` - Nhóm nhiều points

## 🔗 Resources

- [PostGIS Docs](https://postgis.net/documentation/)
- [Spatial Ref (SRID 4326)](https://spatialreference.org/ref/epsg/4326/)
- Examples: `database/postgis-examples.sql`
