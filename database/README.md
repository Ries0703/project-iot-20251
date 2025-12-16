# Database Management Scripts

## Database-First Approach

CityEar sử dụng **database-first approach**: Schema được quản lý bằng SQL scripts, không cho phép code tự động sửa đổi database.

## Files

- `init-schema.sql` - Tạo schema ban đầu
- `reset-database.sql` - Drop và tạo lại database (development only)

## Commands

### 1. Initialize Schema (First time setup)

```bash
# Run from project root
Get-Content database\init-schema.sql | docker exec -i cityear-postgres psql -U admin -d cityear
```

### 2. Reset Database (Development only - DELETES ALL DATA!)

```bash
# Drop and recreate database
docker exec cityear-postgres psql -U admin -c "DROP DATABASE IF EXISTS cityear;"
docker exec cityear-postgres psql -U admin -c "CREATE DATABASE cityear;"

# Run schema initialization
Get-Content database\init-schema.sql | docker exec -i cityear-postgres psql -U admin -d cityear
```

### 3. Verify Schema

```bash
# List all tables
docker exec cityear-postgres psql -U admin -d cityear -c "\dt"

# Show table structure
docker exec cityear-postgres psql -U admin -d cityear -c "\d sensor_events"

# List all indexes
docker exec cityear-postgres psql -U admin -d cityear -c "\di"
```

## TypeORM Configuration

```typescript
// src/typeorm.config.ts
{
  synchronize: false,  // ❌ Code KHÔNG được tự động sửa schema
  logging: true,       // ✅ Log SQL queries for debugging
}
```

## Schema Changes

Khi cần sửa schema:

1. **KHÔNG** sửa entity và để TypeORM auto-sync
2. ✅ Tạo migration SQL script trong `database/migrations/`
3. ✅ Review và test migration
4. ✅ Apply migration manually vào database
5. ✅ Update entity để match với schema mới

## Example Migration

```sql
-- database/migrations/001-add-device-location.sql
ALTER TABLE sensor_events 
ADD COLUMN location GEOMETRY(Point, 4326);

CREATE INDEX idx_sensor_events_location 
ON sensor_events USING GIST(location);
```

Apply migration:
```bash
Get-Content database\migrations\001-add-device-location.sql | docker exec -i cityear-postgres psql -U admin -d cityear
```

## Why Database-First?

1. **Production Safety**: Code không thể accidentally sửa schema
2. **Migration Control**: Mọi thay đổi đều được review và track
3. **Team Collaboration**: Schema changes visible trong Git
4. **Rollback**: Dễ dàng rollback migrations
5. **Performance**: Không có overhead của schema sync mỗi lần start
