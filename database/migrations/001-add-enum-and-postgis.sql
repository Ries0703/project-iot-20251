-- Migration: Add enum type and PostGIS geometry column
-- Run this to enhance the sensor_events table

-- Step 1: Create enum type for event classification
CREATE TYPE event_type_enum AS ENUM ('NORMAL', 'TRAFFIC', 'GUNSHOT', 'SCREAM');

-- Step 2: Drop existing table (only for dev - in production use ALTER TABLE)
DROP TABLE IF EXISTS sensor_events CASCADE;

-- Step 3: Recreate table with enum and PostGIS
CREATE TABLE sensor_events (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    "deviceId" TEXT NOT NULL,
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    "noiseLevel" FLOAT NOT NULL,
    "eventType" event_type_enum NOT NULL DEFAULT 'NORMAL',  -- Using enum type
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- PostGIS geometry column (Point in WGS84 coordinate system)
    location GEOMETRY(Point, 4326),
    
    -- Composite primary key including partition column
    PRIMARY KEY (id, "timestamp")
);

-- Step 4: Convert to hypertable
SELECT create_hypertable('sensor_events', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Step 5: Create indexes
CREATE INDEX idx_sensor_events_deviceId ON sensor_events("deviceId", "timestamp" DESC);
CREATE INDEX idx_sensor_events_eventType ON sensor_events("eventType", "timestamp" DESC);
CREATE INDEX idx_sensor_events_noiseLevel ON sensor_events("noiseLevel", "timestamp" DESC);

-- Step 6: Create spatial index for PostGIS (GIST index)
CREATE INDEX idx_sensor_events_location ON sensor_events USING GIST(location);

-- Step 7: Add comment
COMMENT ON COLUMN sensor_events."noiseLevel" IS 'Noise level in decibels (dB)';
COMMENT ON COLUMN sensor_events.location IS 'Geographic location as PostGIS Point (SRID 4326 - WGS84)';

-- Step 8: Create trigger to auto-populate location from lat/lng
CREATE OR REPLACE FUNCTION update_location_from_coords()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically create PostGIS Point from lat/lng
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_location
    BEFORE INSERT OR UPDATE ON sensor_events
    FOR EACH ROW
    EXECUTE FUNCTION update_location_from_coords();

-- Step 9: Enable compression
ALTER TABLE sensor_events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'deviceId',
    timescaledb.compress_orderby = 'timestamp DESC'
);

SELECT add_compression_policy('sensor_events', INTERVAL '7 days', if_not_exists => TRUE);

-- Step 10: Add retention policy
SELECT add_retention_policy('sensor_events', INTERVAL '90 days', if_not_exists => TRUE);

-- Step 11: Recreate continuous aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS sensor_events_1min
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 minute', "timestamp") AS bucket,
    "deviceId",
    AVG("noiseLevel") as avg_noise,
    MAX("noiseLevel") as max_noise,
    MIN("noiseLevel") as min_noise,
    COUNT(*) as event_count,
    COUNT(*) FILTER (WHERE "eventType" = 'GUNSHOT') as gunshot_count,
    COUNT(*) FILTER (WHERE "eventType" = 'SCREAM') as scream_count
FROM sensor_events
GROUP BY bucket, "deviceId";

SELECT add_continuous_aggregate_policy('sensor_events_1min',
    start_offset => INTERVAL '10 minutes',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute',
    if_not_exists => TRUE
);

CREATE MATERIALIZED VIEW IF NOT EXISTS sensor_events_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', "timestamp") AS bucket,
    "deviceId",
    AVG("noiseLevel") as avg_noise,
    MAX("noiseLevel") as max_noise,
    MIN("noiseLevel") as min_noise,
    COUNT(*) as event_count,
    COUNT(*) FILTER (WHERE "eventType" = 'GUNSHOT') as gunshot_count,
    COUNT(*) FILTER (WHERE "eventType" = 'SCREAM') as scream_count
FROM sensor_events
GROUP BY bucket, "deviceId";

SELECT add_continuous_aggregate_policy('sensor_events_hourly',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Verify enum type
SELECT enum_range(NULL::event_type_enum);

-- Verify PostGIS
SELECT PostGIS_Version();

-- Show table structure
\d sensor_events
