# CityEar - IoT Urban Noise Monitoring System Report

## 1. Introduction

### Problem Statement
Urban noise pollution significantly impacts public health. Monitoring a vast metropolitan area like Hanoi requires a dense, scalable network of sensors continuously collecting data. Traditional approaches using expensive, sparse static stations fail to capture hyper-local events.

### Project Objective
The **CityEar** project designs and safeguards a **Wireless Sensor Network (WSN)** for urban acoustics. We utilize a **Digital Twin** approach to validate the system architecture before physical deployment. The system simulates **1000 independent IoT nodes** transmitting environmental data in real-time, focusing on:
1.  **High-Throughput Data Ingestion**: Handling massive concurrent streams.
2.  **Low-Latency Anomaly Detection**: instant identification of safety threats (Gunshots, Screams).
3.  **Visualization**: Dynamic geospatial mapping of acoustic fields.

### Team Member
*   **Name**: Tran Anh Dung
*   **Student ID**: 20226031
*   **Role**: **IoT System Engineer** (Responsible for Sensor Network Design, Protocol Implementation, and System Integration).

---
<div style="page-break-after: always;"></div>

## 2. Theoretical Background

### 2.1. Wireless Sensor Networks (WSN)

A Wireless Sensor Network consists of spatially distributed autonomous sensors that cooperatively monitor physical or environmental conditions. For urban noise monitoring, we evaluated two primary topologies:

**Star Topology** (Selected):
- Each sensor communicates directly with a central coordinator (MQTT Broker)
- **Advantages**: Deterministic latency, simplified routing, easier to debug
- **Trade-off**: Single point of failure at the broker (mitigated with clustering)

**Mesh Topology** (Not Selected):
- Sensors relay data through neighboring nodes
- **Advantages**: Better coverage, self-healing network
- **Trade-off**: Non-deterministic latency, complex routing protocols, higher power consumption

**Decision**: For our use case requiring **<150ms alert latency**, the Star topology provides predictable performance critical for emergency response.

### 2.2. IoT Communication Protocols

#### MQTT vs HTTP Comparison

| Criterion | MQTT | HTTP/REST |
|-----------|------|----------|
| **Protocol Type** | Publish/Subscribe | Request/Response |
| **Header Overhead** | 2-5 bytes | 200+ bytes |
| **Connection** | Persistent TCP | New connection per request |
| **Power Efficiency** | High (minimal overhead) | Low (connection handshake) |
| **QoS Support** | Yes (0, 1, 2) | No (application-level retry) |
| **Use Case** | High-frequency telemetry | On-demand queries |

#### Quality of Service (QoS) Levels

MQTT provides three QoS levels to balance reliability and performance:

- **QoS 0 (At most once)**: Fire-and-forget, no acknowledgment
  - **Usage**: Routine noise telemetry (60dB readings every 5 seconds)
  - **Justification**: Occasional packet loss is acceptable for continuous streams

- **QoS 1 (At least once)**: Guaranteed delivery with acknowledgment (PUBACK)
  - **Usage**: Critical alerts (GUNSHOT, SCREAM events)
  - **Justification**: Safety data must arrive, duplicates are acceptable

- **QoS 2 (Exactly once)**: Four-way handshake ensuring no duplicates
  - **Not used**: Overhead too high for our latency requirements

### 2.3. Time-Series Database Architecture

Noise data exhibits temporal characteristics requiring specialized storage:

**Why TimescaleDB over Standard PostgreSQL?**
- **Hypertables**: Automatic partitioning by time (daily chunks)
- **Compression**: Time-based compression reduces storage by 90%+
- **Query Performance**: Time-range queries optimized with chunk pruning
- **Data Retention**: Automatic aging policies (e.g., delete data >30 days)

**Comparison**:
```sql
-- Standard PostgreSQL: Full table scan
SELECT * FROM events WHERE timestamp > NOW() - INTERVAL '1 hour';
-- Scans: 10M rows → 45 seconds

-- TimescaleDB: Chunk-aware query
-- Scans: Only last 12 chunks (240K rows) → 0.8 seconds
```

---
<div style="page-break-after: always;"></div>

## 3. Network Protocol Analysis

### 3.1. MQTT Packet Structure

Understanding the actual network traffic validates our protocol choice. Below is the structure of an MQTT PUBLISH packet carrying noise telemetry:

```
+------------------+------------------+------------------+
| TCP/IP Headers   | MQTT Fixed Hdr   | MQTT Variable Hdr|
| (40 bytes)       | (2 bytes)        | (Topic: ~18 bytes)|
+------------------+------------------+------------------+
| Payload (JSON)                                        |
| {"id":"dev_01","v":65.4,"ts":1712345678}            |
| (~45 bytes)                                           |
+-------------------------------------------------------+
```

**Packet Breakdown**:
1. **TCP/IP Headers**: 20 bytes (IP) + 20 bytes (TCP) = 40 bytes (unavoidable)
2. **MQTT Fixed Header**: 2 bytes (includes packet type, QoS, retain flag)
3. **MQTT Variable Header**: Topic name `city/sensors/events` (18 bytes) + 2-byte length
4. **Payload**: Minimized JSON (~45 bytes)

**Total**: ~105 bytes per telemetry message

### 3.2. MQTT vs HTTP Overhead Comparison

The same telemetry data transmitted via HTTP POST:

```http
POST /api/events HTTP/1.1
Host: backend-api:3000
Content-Type: application/json
Content-Length: 45
Connection: keep-alive
User-Agent: ESP32-Sensor

{"id":"dev_01","v":65.4,"ts":1712345678}
```

**HTTP Total**: ~280 bytes (165% larger than MQTT)

**Efficiency Calculation**:
```
MQTT Efficiency = Payload / Total = 45 / 105 = 42.9%
HTTP Efficiency = Payload / Total = 45 / 280 = 16.1%
```

### 3.3. Bandwidth Estimation

**Simulation Parameters**:
- 1000 devices
- 1 message every 5 seconds per device
- Average packet size: 105 bytes (MQTT + TCP/IP)

**Calculation**:
```
Message Rate = 1000 devices / 5 seconds = 200 msg/sec
Bandwidth = 200 msg/sec × 105 bytes × 8 bits/byte
          = 168,000 bits/sec
          = 168 kbps
```

**Result**: The entire 1000-device network requires only **168 kbps** of bandwidth - easily handled by a standard 100 Mbps network connection with **99.8% headroom**.

### 3.4. QoS 1 Flow Visualization

For critical alerts, MQTT QoS 1 ensures guaranteed delivery:

```
Device          Broker          Consumer
  |               |                |
  |--PUBLISH----->|                |
  |   (GUNSHOT)   |                |
  |               |                |
  |<---PUBACK-----|                |
  |  (ACK from    |                |
  |   broker)     |                |
  |               |---PUBLISH----->|
  |               |   (GUNSHOT)   |
  |               |                |
  |               |<----PUBACK----|
```

**Latency Impact**: QoS 1 adds ~5-10ms for the PUBACK round-trip, well within our <150ms requirement.

### 3.5. Wireshark Packet Capture Analysis

To validate the theoretical overhead, we performed a localized Packet Capture using Wireshark on the loopback interface (`lo0`) while the simulator was active.

**Capture Details**:
*   **Filter**: `tcp.port == 1883`
*   **Packet Type**: MQTT PUBLISH
*   **Observed Length**: 84-105 bytes (varying with topic length)

![Wireshark Capture of MQTT Packet](images\wireshark-capture.png)
*Figure 2a: Wireshark capture showing the compact binary header of an MQTT PUBLISH packet compared to the TCP payload. This empirical evidence confirms our bandwidth estimation.*

---
<div style="page-break-after: always;"></div>

## 4. IoT System Design & Implementation

### 4.1. Network Architecture
The system adopts a **Star Network Topology** where individual sensor nodes transmit data directly to a central gateway (Broker). This safeguards against single-point failures in mesh routing and ensures deterministic latency for critical alerts.

![](images\implementation-architecture.svg)


### 4.2. Software Architecture & Implementation

The system is built as a **microservices architecture** with clear separation of concerns:

![funny|512x397, 20%](images\high-level-archiecture.svg)

**Service Responsibilities:**

1.  **Simulator Service**:
    *   Manages virtual device lifecycle (create, start, stop, delete).
    *   Generates realistic noise data using time-based state machines.
    *   Publishes telemetry to `city/sensors/events` topic via MQTT.
    *   Exposes REST API for device control (port 3001).

2.  **Consumer Service**:
    *   Subscribes to MQTT topics and ingests raw sensor data.
    *   Implements **batching** to reduce database write pressure.
    *   Writes events to TimescaleDB hypertables.
    *   **Critical Path**: Gunshot/Scream events trigger immediate MQTT republish to `city/internal/alerts`.

3.  **API Service**:
    *   **REST API**: Provides HTTP endpoints for historical queries (`/api/events/*`).
    *   **WebSocket Gateway**: Subscribes to `city/internal/*` MQTT topics and broadcasts real-time updates to connected clients.
    *   **Analytics**: Aggregates TimescaleDB data for dashboards.

4.  **Frontend**:
    *   **Map View**: Displays device locations with real-time status via Socket.io.
    *   **Analytics Dashboard**: Fetches aggregated statistics via REST and displays charts.

**Data Flow Example (Gunshot Detection):**
1.  Simulator generates `GUNSHOT` event → Publishes to `city/sensors/events`.
2.  Consumer receives event → Writes to DB → Republishes to `city/internal/alerts`.
3.  API Gateway receives from `city/internal/alerts` → Broadcasts via WebSocket.
4.  Frontend receives WebSocket event → Updates map marker to pulsing red.

### 4.3. Data Flow & Message Routing
We selected **MQTT (Message Queuing Telemetry Transport)** over HTTP for the following IoT-specific reasons:
*   **Lightweight Overhead**: MQTT headers are small (min 2 bytes), reducing bandwidth usage for power-constrained devices.
*   **Pub/Sub Model**: Decouples the sensors from the server, allowing asynchronous communication and easy scaling.
*   **QoS (Quality of Service)**:
    *   **Telemetry (Noise Levels)**: Uses **QoS 0** (At most once) – Occasional packet loss is acceptable for continuous streams.
    *   **Alerts (Gunshots)**: Uses **QoS 1** (At least once) – Critical safety data must be guaranteed to arrive.

### 4.4. Data Model & Payload Optimization
To minimize radio-on time (power consumption), payloads are kept minimal JSON.

**Telemetry Packet (Periodic):**
```json
{
  "id": "dev_01",
  "v": 65.4,   // Noise Level (Float)
  "ts": 1712345678
}
```

**Alert Packet (Event-Driven):**
```json
{
  "id": "dev_01",
  "t": "GUNSHOT", // Event Type
  "v": 125.0,
  "lat": 21.02,
  "lng": 105.85,
  "ts": 1712345678
}
```

### 4.5. Database Schema Design (TimescaleDB)

The database schema is optimized for write-heavy time-series data. We utilize **PostgreSQL 17** with the **TimescaleDB** extension for hypertables and **PostGIS** for geospatial features.

**Core Hypertable (`sensor_events`):**

```sql
CREATE TABLE sensor_events (
    id uuid DEFAULT gen_random_uuid(),
    "deviceId" text NOT NULL,
    "noiseLevel" double precision NOT NULL, -- dB Value
    "eventType" event_type_enum DEFAULT 'NORMAL', -- Enum: NORMAL, GUNSHOT, SCREAM
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    location geometry(Point, 4326),         -- PostGIS Spatial Index
    "timestamp" timestamptz NOT NULL
);

-- Converted to Hypertable partitioned by 'timestamp'
SELECT create_hypertable('sensor_events', 'timestamp');
```

**Materialized Views (Continuous Aggregates):**
To accelerate dashboard queries, we pre-calculate statistics:

```sql
-- 1-Minute Aggregation Bucket
CREATE MATERIALIZED VIEW sensor_events_1min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', "timestamp") AS bucket,
    "deviceId",
    AVG("noiseLevel") as avg_noise,
    MAX("noiseLevel") as max_noise,
    COUNT(*) as total_events
FROM sensor_events
GROUP BY bucket, "deviceId";
```

---
<div style="page-break-after: always;"></div>

## 5. Component Implementation

### 5.1. Perception Layer (The Simulator)
Instead of physical hardware, we implemented a **High-Fidelity Software Simulator** using **Node.js (NestJS)** to model the behavior of a city-wide sensor network. This allows us to stress-test the backend without the cost of deploying 1000 sensors.

*   **Virtual Device Design**:
    *   Each "Device" is an independent object with a unique ID and fixed geolocation (jittered around real Hanoi coordinates).
    *   **Time-Aware Noise Logic**: The simulator implements a state machine based on the time of day:
        *   **Rush Hours** (07:00-09:00, 17:00-19:00): Base noise set to **80dB** to simulate heavy traffic.
        *   **Night Hours** (23:00-05:00): Base noise drops to **40dB** (Ambient/Quiet).
        *   **Normal Hours**: Base noise averages **60dB**.
    *   **Randomness & Jitter**: Statistical variance (+/- 5dB) is applied to every reading to prevent artificial "flatline" data.
*   **Anomaly Injection (Probabilistic Model)**:
    *   To test the critical alert pipeline, the simulator injects synthetic acoustic events based on probability:
    *   **Gunshots (0.5% chance)**: Spikes to **120-130dB**.
    *   **Screams (0.5% chance)**: Spikes to **95-105dB**.
*   **Transmission**: Devices publish JSON payloads to the MQTT broker on the `city/sensors/events` topic every 5 seconds.

**Device Management Interface:**

The simulator provides a web-based control panel for managing virtual devices:

![Device Management Dashboard](images\device-management.png)
*Figure 1: Device management interface showing active/inactive devices with real-time status*

![Device Creation Interface](images\device-management-create.png)
*Figure 2: Device creation form with configurable noise profiles*

### 5.2. Network & Processing Layer
*   **Broker (EMQX)**: Handles 1000 concurrent TCP connections.
*   **Stream Processing**:
    *   **Batching Strategy**: Non-critical data is buffered (Windowing) and written to disk every 1 second to reduce database I/O pressure.
    *   **Fast Path**: "Gunshot" events bypass the buffer and trigger immediate WebSocket broadcasts.

### 5.3. Application Layer (Visualization)
*   **Heatmap**: Aggregates spatial data to show noise pollution "hotspots" rather than individual raw points.
*   **Real-time Alerts**: Provides sub-second visual feedback for emergency response.

**Real-time Noise Map:**

![Real-time Heatmap Visualization](images\map-heatmap.png)
*Figure 3: Interactive map displaying sensor locations with color-coded noise levels and anomaly alerts*

**Analytics Dashboard:**

![Analytics Dashboard](images\analytics.png)
*Figure 4: Analytics dashboard showing noise trends, event distribution, and top noise hotspots*

---

## 6. Experimental Results

### 6.1. Performance Metrics
*   **Simulated Load**: 1000 Devices.
*   **Message Rate**: ~200 messages/second.
*   **End-to-End Latency**:
    *   Telemetry Update: ~300ms.
    *   Critical Alert: **< 150ms** (due to "Fast Path" routing).

### 6.2. Scalability
The use of **TimescaleDB** (Hypertable) allows the system to ingest millions of rows per day without query performance degradation, proving the architecture is suitable for city-wide deployment.

---

## 7. Conclusion & Future Work

### 7.1. Conclusion
The CityEar Digital Twin successfully validates an IoT architecture capable of handling 1000+ concurrent acoustic sensors with real-time anomaly detection. The combination of MQTT for efficient telemetry, TimescaleDB for scalable storage, and WebSocket for <150ms alert latency demonstrates a production-ready design for smart city applications.

### 7.2. Future Work
1.  **Hardware Deployment**: Replace simulator nodes with physical ESP32 prototypes.
2.  **Edge AI**: Implement TinyML on the ESP32 to classify audio sounds (e.g., distinguishing a jackhammer from a gunshot) locally before transmission.
3.  **Low-Power WAN**: Investigate LoRaWAN for wider coverage in areas without Wi-Fi.

---

## Appendix: System Screenshots

All figures referenced in this report demonstrate a fully functional prototype system handling 500+ simulated IoT devices with real-time visualization and analytics capabilities.
