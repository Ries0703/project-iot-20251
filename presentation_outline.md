# CityEar - IoT Presentation Outline

## Slide 1: Title Slide
*   **Project**: CityEar - Wireless Sensor Network for Urban Noise
*   **Student**: Tran Anh Dung (20226031)

---

## Slide 2: The IoT Challenge
*   **Problem**: Monitoring city-wide noise requires massive scale.
*   **Why IoT?**:
    *   Manual measurement is impossible for 24/7 coverage.
    *   Need real-time "ears" on the ground for safety.
*   **Solution**: A Scalable Wireless Sensor Network (WSN).

---

## Slide 3: Network Architecture (Star Topology)
*   **Perception Layer (Edge)**: 1000 Simulated Nodes (Node.js).
*   **Network Layer**: MQTT Protocol over TCP/IP.
*   **Application Layer**: Cloud Processing & Dashboard.
*   *Key Concept*: Digital Twin Simulation validates the architecture before physical deployment.

---

## Slide 4: Why MQTT? (Protocol Analysis)
*   **Low Overhead**: Small headers save battery/bandwidth compared to HTTP.
*   **Pub/Sub**: Asynchronous - The sensor sleeps immediately after publishing.
*   **QoS (Quality of Service)**:
    *   **QoS 0**: Traffic Noise (Fire and Forget).
    *   **QoS 1**: Gunshots (Guaranteed Delivery).

---

## Slide 5: The "Digital Twin" Simulation
*   **Simulating the Edge**:
    *   Each virtual node mimics an ESP32.
    *   **Logic**: Time-based noise functionality (Rush Hour vs Night).
    *   **Edge Processing**: Simulating local decibel calculation (sending only `result`, not raw audio).

---

## Slide 6: Data Pipeline & Processing
*   **Stream Processing Strategy**:
    *   **Telemetry**: Batched & Windowed (Efficient DB writing).
    *   **Alerts**: Fast-Path Routing (Immediate WebSocket Trigger).
*   **Storage**: Time-Series Database (TimescaleDB) for historical analytics.

---

## Slide 7: Technical Results
*   **Scale**: Successfully handling **1000 Concurrent Nodes**.
*   **Throughput**: **200+ msg/sec**.
*   **Latency**: **< 150ms** for critical alerts.
*   *Demonstration of robust backend architecture.*

---

## Slide 8: Future Work
*   **Hardware Transition**: The simulator logic is ready to be ported to physical ESP32 devices.
*   **Edge AI**: Next step is implementing on-device sound classification (TinyML) instead of probabilistic simulation.
*   **Connectivity**: Transition to LoRaWAN for long-range city coverage.

---

## Slide 9: Live Demo & Q&A
*   Showcasing the Dashboard and Real-time MQTT logs.
