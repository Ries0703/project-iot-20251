# MQTT Topics Documentation

## Topic Structure

CityEar uses a hierarchical MQTT topic structure for clear organization and efficient routing.

## Topics

### `city/sensors/events`

**Purpose**: Main data ingestion channel for sensor events

**Direction**: Device → Backend

**QoS**: 1 (At least once delivery)

**Payload Format**: JSON

**Payload Schema**:
```json
{
  "id": "device-001",
  "lat": 21.0285,
  "lng": 105.8542,
  "type": "TRAFFIC",
  "level": 75.5,
  "ts": "2024-12-16T10:30:00.000Z"
}
```

**Field Descriptions**:
- `id` (string): Unique device identifier
- `lat` (number): Latitude coordinate (-90 to 90)
- `lng` (number): Longitude coordinate (-180 to 180)
- `type` (string): Event type - "NORMAL", "TRAFFIC", "GUNSHOT", or "SCREAM"
- `level` (number): Noise level in decibels (dB)
- `ts` (string): ISO 8601 timestamp

**Example Messages**:

```json
// Normal traffic noise
{
  "id": "device-042",
  "lat": 21.0285,
  "lng": 105.8342,
  "type": "TRAFFIC",
  "level": 78.2,
  "ts": "2024-12-16T07:15:30.000Z"
}

// Gunshot detection
{
  "id": "device-137",
  "lat": 21.0227,
  "lng": 105.8194,
  "type": "GUNSHOT",
  "level": 125.0,
  "ts": "2024-12-16T23:45:12.000Z"
}
```

### Future Topics (Reserved)

- `city/sensors/status` - Device health and connectivity status
- `city/sensors/config` - Device configuration updates
- `city/alerts/gunshot` - Dedicated gunshot alert channel
- `city/alerts/scream` - Dedicated scream alert channel
- `city/admin/control` - Administrative commands

## MQTT Broker Configuration

**Broker**: EMQX

**Connection Details**:
- Host: `localhost` (development) / `emqx-service` (Kubernetes)
- Port: `1883` (TCP) / `8083` (WebSocket)
- Protocol: MQTT v5.0

**Authentication**: 
- Development: No authentication required
- Production: Username/password or JWT tokens

## Client Configuration

### Simulator (Publisher)

```javascript
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://localhost:1883', {
  clientId: `simulator-${deviceId}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
});

client.publish('city/sensors/events', JSON.stringify(payload), {
  qos: 1,
  retain: false,
});
```

### Backend (Subscriber)

```typescript
@MessagePattern('city/sensors/events')
async handleSensorEvent(@Payload() payload: SensorEventDto) {
  // Process event
}
```

## Performance Metrics

- **Expected Throughput**: 200 messages/second
- **Message Size**: ~150 bytes (JSON)
- **Bandwidth**: ~30 KB/s
- **Retention**: None (messages not retained)
- **Max Payload Size**: 1 KB

## Monitoring

Access EMQX Dashboard: http://localhost:18083

**Key Metrics to Monitor**:
- Messages in/out per second
- Connection count
- Subscription count
- Message queue depth
- Delivery latency

## Testing

### Publish Test Message

```bash
# Using mosquitto_pub
mosquitto_pub -h localhost -p 1883 \
  -t "city/sensors/events" \
  -m '{"id":"test-001","lat":21.0285,"lng":105.8342,"type":"NORMAL","level":55.0,"ts":"2024-12-16T10:00:00Z"}'
```

### Subscribe to Topic

```bash
# Using mosquitto_sub
mosquitto_sub -h localhost -p 1883 \
  -t "city/sensors/events" \
  -v
```
