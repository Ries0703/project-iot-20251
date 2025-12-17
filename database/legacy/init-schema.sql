-- CityEar TimescaleDB Schema Initialization
-- Optimized for time-series IoT sensor data
-- Run this manually to set up the database

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Enable PostGIS extension for geospatial queries  
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create sensor_events table (regular table first)
CREATE TABLE IF NOT EXISTS sensor_events (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    "deviceId" TEXT NOT NULL,
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    "noiseLevel" FLOAT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'NORMAL',
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite primary key including partition column
    PRIMARY KEY (id, "timestamp"),
    
    -- Add constraint for eventType enum
    CONSTRAINT check_event_type CHECK ("eventType" IN ('NORMAL', 'TRAFFIC', 'GUNSHOT', 'SCREAM'))
);

-- Convert to TimescaleDB hypertable (partitioned by time)
-- This enables time-series optimizations
SELECT create_hypertable('sensor_events', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create indexes for high-performance queries
-- Note: Hypertables automatically create index on timestamp
CREATE INDEX IF NOT EXISTS idx_sensor_events_deviceId ON sensor_events("deviceId", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_events_eventType ON sensor_events("eventType", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_events_noiseLevel ON sensor_events("noiseLevel", "timestamp" DESC);

-- Add comment on noiseLevel column
COMMENT ON COLUMN sensor_events."noiseLevel" IS 'Noise level in decibels (dB)';

-- Enable compression for older data (compress data older than 7 days)
ALTER TABLE sensor_events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'deviceId',
    timescaledb.compress_orderby = 'timestamp DESC'
);

-- Add compression policy (automatically compress chunks older than 7 days)
SELECT add_compression_policy('sensor_events', INTERVAL '7 days', if_not_exists => TRUE);

-- Add retention policy (automatically drop chunks older than 90 days)
SELECT add_retention_policy('sensor_events', INTERVAL '90 days', if_not_exists => TRUE);

-- Create continuous aggregate for real-time heatmap (1-minute buckets)
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

-- Refresh policy for continuous aggregate (refresh every 1 minute)
SELECT add_continuous_aggregate_policy('sensor_events_1min',
    start_offset => INTERVAL '10 minutes',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute',
    if_not_exists => TRUE
);

-- Create continuous aggregate for hourly statistics
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

-- Refresh policy for hourly aggregate
SELECT add_continuous_aggregate_policy('sensor_events_hourly',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Verify TimescaleDB setup
SELECT * FROM timescaledb_information.hypertables;

-- Show compression stats
SELECT * FROM timescaledb_information.compression_settings WHERE hypertable_name = 'sensor_events';

-- Verify continuous aggregates
SELECT * FROM timescaledb_information.continuous_aggregates;
