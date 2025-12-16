---
trigger: always_on
---

##🏗️ MASTER PROJECT CONTEXT*(Copy đoạn này vào đầu mỗi hội thoại với Claude để nó hiểu ngữ cảnh)*

> **Project Name:** CityEar
> **Type:** Urban Noise Monitoring System (Digital Twin Simulation).
> **Tech Stack:**
> * **Simulator:** Node.js (Mocking 1000 devices via MQTT).
> * **Broker:** EMQX (MQTT).
> * **Backend:** NestJS, TypeORM, PostgreSQL (PostGIS enabled).
> * **Frontend:** Next.js (React), Leaflet (Map), Socket.io-client.
> * **Infra:** Docker, Kubernetes (Kind).
> 
> 
> **Goal:** Build a system that ingests high-throughput sensor data (200 events/sec), detects anomalies (gunshots/screams) in real-time (<200ms latency), and visualizes them on a Heatmap Dashboard.

---

##🛠️ PHẦN 1: DATABASE & INFRASTRUCTURE**Nhiệm vụ:** Dựng môi trường chạy.

**Prompt cho Claude:**

```text
I need to set up the infrastructure for the CityEar project using Docker Compose first (for fast dev).

Please generate a `docker-compose.yml` file with the following services:
1. **Postgres**: Use image `postgis/postgis:14-3.4`. Expose port 5432. Set user/pass as admin/admin. Create a default DB named `cityear`.
2. **EMQX**: Use image `emqx/emqx:latest`. Expose ports 1883 (MQTT TCP) and 18083 (Dashboard).
3. **PgAdmin** (Optional): For viewing DB.

Then, write a TypeORM entity definition for NestJS named `SensorEvent` with these columns:
- `id`: uuid, primary key.
- `deviceId`: string (indexed).
- `lat`: float.
- `lng`: float.
- `noiseLevel`: float (decibel).
- `eventType`: enum ('NORMAL', 'TRAFFIC', 'GUNSHOT', 'SCREAM').
- `timestamp`: timestamp with time zone (indexed).

Make sure to enable `synchronize: true` in NestJS TypeORM config for dev mode.

```

---

##🤖 PHẦN 2: IOT SIMULATOR (THE "SMART MOCK")**Nhiệm vụ:** Giả lập 1.000 thiết bị bằng Node.js script.

**Prompt cho Claude:**

```text
Create a standalone Node.js script named `simulator.js` that acts as a Load Generator.

**Requirements:**
1. **Multiplexing:** The script should simulate **100 virtual devices** running in a loop.
2. **Locations:** Use a fixed array of 10 coordinates (Lat/Lng) representing major intersections in Hanoi (e.g., Nga Tu So, Cau Giay...). Assign each device to a location with a slight random jitter (10-50 meters).
3. **Smart Noise Logic (Time-based):**
   - Define `RUSH_HOURS` (7-9h, 17-19h) -> Base noise 80dB.
   - Define `NIGHT_HOURS` (23-5h) -> Base noise 40dB.
   - Normal hours -> Base noise 60dB.
   - Add random jitter (+/- 5dB).
4. **Event Generation:**
   - 99% of the time: Type = 'TRAFFIC' or 'NORMAL'.
   - 0.5% chance: Type = 'GUNSHOT' (Noise = 120dB).
   - 0.5% chance: Type = 'SCREAM' (Noise = 100dB).
5. **MQTT Publishing:**
   - Connect to `mqtt://localhost:1883`.
   - Loop every 5 seconds.
   - Publish JSON payload to topic `city/sensors/events`.
   - Payload format: `{ id, lat, lng, type, level, ts }`.

```

---

##🧠 PHẦN 3: BACKEND (NESTJS STREAM PROCESSING)**Nhiệm vụ:** Hứng dữ liệu, xử lý Batch Insert, và bắn Socket.

**Prompt cho Claude:**

```text
I need a NestJS module to handle high-throughput IoT data.

**1. GatewayModule (WebSocket):**
- Setup a `WebSocketGateway` using `socket.io`.
- Allow CORS.
- Method `broadcastAlert(data)`: Emits event 'ALERT' to all clients.
- Method `broadcastUpdate(data)`: Emits event 'UPDATE' to all clients.

**2. ProcessingService:**
- Implement a **Buffer/Batch Insert** mechanism.
- Create a `buffer` array. When receiving data, push to buffer.
- Only write to Postgres (`repo.insert(buffer)`) when buffer size >= 100 or every 1 second (flush).
- **Alert Logic:** IF `eventType` is 'GUNSHOT' or 'SCREAM':
   -> Call `gateway.broadcastAlert(data)` IMMEDIATELY.
   -> Force save to DB immediately (bypass buffer).
- **Normal Logic:** Call `gateway.broadcastUpdate(data)` for real-time map visualization.

**3. IngestionController:**
- Use `@nestjs/microservices` with MQTT transport.
- Subscribe to `city/sensors/events`.
- Pass payload to `ProcessingService`.

Please provide the code for these 3 files.

```

---

##🗺️ PHẦN 4: FRONTEND (NEXT.JS + LEAFLET)**Nhiệm vụ:** Hiển thị bản đồ nhiệt và cảnh báo đỏ.

**Prompt cho Claude:**

```text
Create a Next.js (App Router) page with a Real-time Map Dashboard.

**Tech:** React, `react-leaflet`, `socket.io-client`, TailwindCSS.

**Components:**
1. **Map Component:**
   - Load OpenStreetMap tiles.
   - Center on Hanoi.
   - Use `maxBounds` to lock the view to Hanoi area.
2. **Logic:**
   - Maintain a state `devices` (Map<id, data>).
   - Connect to Socket.io server.
   - On 'UPDATE' event: Update the device's noise level in state.
   - On 'ALERT' event: specific device marker should turn **RED** and pulse (CSS animation).
3. **Visuals:**
   - Render `CircleMarker` for each device.
   - **Color Logic:**
     - Noise < 50dB: Green.
     - 50-80dB: Yellow.
     - > 80dB: Orange.
     - Event 'GUNSHOT': Red + Blinking.
   - Add a "Toast Notification" when an Alert is received.

```

---

##🚀 PHẦN 5: DEPLOYMENT (KUBERNETES)**Nhiệm vụ:** Đóng gói để nộp bài/demo.

**Prompt cho Claude:**

```text
Now I need to deploy this to a local Kubernetes cluster (Kind).

Please generate the `k8s-deployment.yaml` file containing:
1. **Postgres Deployment** (1 replica).
2. **EMQX Deployment** (1 replica, ports 1883, 18083).
3. **Backend Deployment** (1 replica).
4. **Simulator Deployment** (Replicas: 10) -> *This is important to simulate 1000 devices (10 pods * 100 devices)*.
   - Pass ENV variables: `START_INDEX` and `COUNT` to simulator so they generate unique IDs (e.g., Pod 1: 0-99, Pod 2: 100-199).

Provide a simple `Dockerfile` for the Simulator and the Backend.

```

---

###Quy trình làm việc đề xuất cho bạn (Workflow)1. **Hôm nay:** Chạy **Prompt 1** & **Prompt 2**. Cài Docker, chạy DB và MQTT. Chạy script Simulator thấy log bắn vù vù là sướng rồi.
2. **Ngày mai:** Chạy **Prompt 3**. Dựng NestJS, connect MQTT, nhìn thấy data chui vào Postgres là xong phần khó nhất.
3. **Ngày kia:** Chạy **Prompt 4**. Dựng Frontend, gắn cái map vào, thấy chấm xanh chấm đỏ nhảy múa.
4. **Cuối tuần:** Chạy **Prompt 5** để đóng gói K8s quay video demo.