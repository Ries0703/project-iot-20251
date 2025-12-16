# TimescaleDB Migration - CityEar

## 🎯 Why TimescaleDB?

TimescaleDB là PostgreSQL extension được tối ưu hóa cho time-series data - hoàn hảo cho IoT sensor data của CityEar.

### Benefits

1. **Hypertables**: Tự động partition data theo thời gian
   - 1-day chunks cho storage hiệu quả
   - Query performance tối ưu cho time-range queries

2. **Compression**: Lưu trữ tiết kiệm CPU và RAM
   - Tự động compress data cũ hơn 7 ngày
   - Tiết kiệm lên đến 90% storage

3. **Continuous Aggregates**: Pre-computed statistics
   - 1-minute buckets cho real-time heatmap
   - Hourly aggregates cho dashboards
   - Automatically updated in background

4. **Retention Policies**: Tự động cleanup
   - Xóa data cũ hơn 90 ngày
   - Giữ database size manageable

5. **PostGIS Integration**: Geospatial queries
   - Future: tìm events trong bán kính 1km
   - Spatial indexing with GIST

## 📦 Versions (Latest as of Dec 2025)

- **TimescaleDB**: 2.24.0
- **PostgreSQL**: 17
- **PostGIS**: Included in timescaledb-ha image
- **EMQX**: 6.0.1
- **PgAdmin**: 9.11

## 🗃️ Schema Highlights

### Hypertable Configuration

```sql
-- Partition by timestamp with 1-day chunks
SELECT create_hypertable('sensor_events', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day'
);
```

### Composite Primary Key

TimescaleDB requires partition key in all unique indexes:

```sql
PRIMARY KEY (id, timestamp)
```

### Continuous Aggregates

**1-minute buckets** (real-time):
- AVG, MAX, MIN noise levels
- Event counts by type
- Gunshot/scream detection

**Hourly buckets** (analytics):
- Long-term trends
- Daily/weekly reports

## 🔧 Database-First Approach

Schema managed via SQL scripts in `database/`:
- `init-schema.sql` - Full initialization
- Future migrations in `database/migrations/`

TypeORM `synchronize: false` - code CANNOT modify schema

## 📊 Performance Expectations

With 200 events/second:
- **Ingestion**: < 10ms per batch (100 events)
- **Compression**: ~90% storage savings after 7 days  
- **Queries**: Sub-second for any time range
- **Retention**: Auto-cleanup keeps DB under control

## 🚀 Next Steps

1. ✅ Infrastructure running
2. ✅ Hypertables configured
3. ✅ Compression + retention policies active
4. ✅ Continuous aggregates created
5. 🔄 **Next**: Build IoT simulator to test ingestion

## 📚 Resources

- [TimescaleDB Docs](https://docs.timescale.com/)
- [Hypertables Guide](https://docs.timescale.com/use-timescale/latest/hypertables/)
- [Continuous Aggregates](https://docs.timescale.com/use-timescale/latest/continuous-aggregates/)
