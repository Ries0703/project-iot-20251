# Report Outline: CityEar - Urban Noise Monitoring System

This outline adapts the structure from the reference report (`demo.md`) to the CityEar simulation project.

## 1. INTRODUCTION
### 1.1. Context and Problem Statement
*   **1.1.1 Context**: Urban noise pollution monitoring using IoT. Need for scalable, real-time data collection (1000+ sensors). Simulation as a "Digital Twin" validation step.
*   **1.1.2 Problem Statement**: 
    *   Cost and complexity of physical deployment.
    *   Need for "Fast Path" alert latency (<150ms) for emergencies (Gunshots).
    *   Need for massive time-series data storage (Scale).
    *   Solution: A simulated environment to prove architecture viability before hardware spend.

### 1.2. Proposed Solution
*   **Overview**: Full-stack IoT system with Simulated Perception Layer (Node.js), MQTT Broker (EMQX), Time-Series Database (TimescaleDB), and Real-time Dashboard (Next.js/Leaflet).
*   **Key Capability**: Validating 1000 concurrent devices and <150ms latency.

## 2. TEAMWORK
*(Placeholder section to match reference structure - assumes individual or small team)*
*   **Tran Anh Dung (20226031)**:
    *   IoT System Engineer.
    *   Responsibilities: Simulator logic, Backend implementation (NestJS), Database optimization (TimescaleDB), and Frontend Visualization.

## 3. SYSTEM DESIGN AND ANALYSIS
### 3.1. System Architecture Diagram
*   **Architecture**: Multi-layered Microservices (Perception, Network, Application).
*   **Diagram**: [Insert High-level Mermaid Diagram here]

### 3.2. Components of the System
*   **A. Device Layer (Simulated)**: 
    *   Virtual Nodes (Node.js) mimicking ESP32 behavior.
    *   Noise generation patterns (Rush hour logic vs. random anomalies).
*   **B. Connectivity Layer**:
    *   **EMQX Broker**: Handles 1000 simultaneous TCP connections.
    *   **Protocol**: MQTT over TCP (Port 1883).
*   **C. IoT Platform Layer**:
    *   **TimescaleDB**: Specialized storage for time-series telemetry.
    *   **Backend Consumer**: Ingestion service with batch processing.
*   **D. Application Layer**:
    *   **API Gateway**: REST & WebSocket handling.
    *   **Frontend**: React/Next.js SPA for map and analytics.

### 3.4. Data Pipeline Architecture (Verified)
This section details the dual-path processing logic confirmed in the codebase (`consumer-service` and `api-service`):

*   **A. Batch Path (High Volume Telemetry)**
    *   **Goal**: Efficient storage of continuous 200 msg/sec streams.
    *   **Implementation**: `EventProcessingService`
    *   **Logic**:
        *   Buffer Size: 100 messages.
        *   Flush Interval: 1 second or when full.
        *   Bulk Insert: Single SQL transaction to TimescaleDB.
    *   **Diagram**: [Insert Batch Path Sequence Diagram]

*   **B. Fast Path (Critical Latency)**
    *   **Goal**: Sub-150ms alert propagation for "Gunshot" events.
    *   **Implementation**: `EventsGateway` (WebSocket)
    *   **Logic**:
        *   Subscribes directly to `city/internal/alerts`.
        *   Bypasses database buffer.
        *   Immediate `server.emit('alert')` to frontend clients.
    *   **Diagram**: [Insert Fast Path Flow Diagram]

### 3.5. Technologies for the System
#### 3.3.1 Hardware and Edge Devices (Simulated)
*   **Virtual MCU**: Node.js processes representing ESP32-DevKitC features.
*   **Virtual Sensors**:
    *   **Microphone (KY-037)**: Modeled by probabilistic noise generators (40dB - 130dB).
    *   **GPS Module (NEO-6M)**: Modeled by fixed GeoJSON coordinates in PostGIS.

#### 3.3.2 Communication Protocols and Data Formats
*   **MQTT**:
    *   Topics: `city/sensors/device_{id}/events`.
    *   Payload: JSON (minimized).
*   **QoS Strategy**:
    *   Telemetry (Noise): QoS 0.
    *   Alerts (Gunshot): QoS 1.
*   **Payload Analysis**:
    *   Actual JSON Schema:
        ```json
        {
          "id": "uuid-v4",
          "deviceId": "device-0001",
          "lat": 21.0,
          "lng": 105.8,
          "noiseLevel": 65.5,
          "eventType": "NORMAL",
          "timestamp": "ISO8601",
          "locationName": "District Sensor X"
        }
        ```
    *   **Payload Size**: ~180-200 bytes.
    *   **HTTP Overhead**: Headers (~300 bytes) + Connection Handshake.
    *   **MQTT Overhead**: ~4 bytes fixed header + Topic string.
*   **Packet Size Comparison**:
    *   MQTT Total: ~220 bytes.
    *   HTTP Total: ~500 bytes (Over 2x larger).
*   **Bandwidth Estimation**:
    *   1000 devices @ 0.2 msg/sec (5s interval).
    *   Throughput: 1000 * 0.2 * 220 bytes * 8 bits = **352 Kbps**.
    *   Result: Still extremely efficient, <1% of 100Mbps link.

#### 3.3.3 Server Backend and Infrastructure
*   **Core Stack**:
    *   **Framework**: NestJS (TypeScript).
    *   **Runtime**: Node.js.
    *   **Database**: PostgreSQL 17 + TimescaleDB + PostGIS.
    *   **Containerization**: Docker Compose (Network isolation).

#### 3.3.4 Security and Operational Measures
*   **Network Segregation**: Docker internal networks for Backend<->DB traffic.
*   **Scalability**:
    *   DB: Hypertable automated partitioning.
    *   Broker: EMQX clustering capable.

## 4. IMPLEMENTATION AND RESULT
### 4.1. Implementation
*   **4.1.1. Perception Layer (Simulator Logic)**:
    *   Code structure: `NoiseGeneratorService`.
    *   Logic: Time-of-day biases (Day/Night/Rush Hour).
*   **4.1.2. Connectivity**:
    *   Mosquitto/EMQX configuration.
    *   Topic structure design.
*   **4.1.3. Backend Services**:
    *   Gateway (Ingestion) -> Service (Processing) -> Repo (Storage).
    *   Fast Path implementation (Socket.io broadcast).
*   **4.1.4. Database Schema**:
    *   SQL definition of `sensor_events`.
    *   Continuous Aggregates (Materialized Views).
*   **4.1.5. Frontend Application**:
    *   Leaflet Map integration.
    *   Recharts for analytics.
*   **4.1.6. Deployment**:
    *   `docker-compose up` flow.
    *   Resource usage monitoring.

### 4.2. Results
*   **Performance Metrics**: 
    *   **Throughput**: 200 msg/sec (Successfully simulating data volume of 1000 devices).
    *   **Latency**: <150ms for alerts.
    *   **Simulation Note**: 
        > [!NOTE]
        > The current simulation multiplexes 1000 *logical* devices over a single high-throughput MQTT connection to stress-test the **Data Processing Pipeline**. It does not simulate 1000 concurrent TCP sockets, which would require a distributed load testing tool (e.g., JMeter/Locust).
*   **Visual Evidence (Screenshots)**:
    *   Fig 1: Real-time Heatmap (DeviceMap).
    *   Fig 2: Analytics Dashboard.
    *   Fig 3: Wireshark Packet Capture.
    *   Demo Video Link.

## 5. CONCLUSION
*   **Summary**: Validated a scalable IoT architecture suitable for city-wide deployment.
*   **Future Work**:
    *   Hardware: Migration to physical ESP32 + LoRaWAN.
    *   Edge AI: TinyML sound classification.
