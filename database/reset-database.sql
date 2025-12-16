-- Drop and recreate database (for development reset)
-- WARNING: This will delete all data!

DROP DATABASE IF EXISTS cityear;
CREATE DATABASE cityear;

\c cityear;

-- Run the schema initialization
\i init-schema.sql;
