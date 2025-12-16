# 🌆 CityEar - Urban Noise Monitoring System

A real-time IoT system that simulates 1000 noise sensors across a city, detects acoustic anomalies (gunshots/screams), and visualizes them on an interactive map dashboard.

## 🏗️ Architecture

```
┌─────────────┐      MQTT       ┌──────────────┐     WebSocket    ┌─────────────┐
│ IoT Devices │ ───────────────> │   NestJS     │ ───────────────> │  Next.js    │
│ (Simulator) │   200 events/s  │   Backend    │   Real-time     │  Dashboard  │
└─────────────┘                 └──────────────┘                  └─────────────┘
                                       │
                                       ▼
                                 ┌──────────────┐
                                 │  PostgreSQL  │
                                 │  + PostGIS   │
                                 └──────────────┘
```

## 🛠️ Tech Stack

- **Simulator**: Node.js (1000 virtual devices via MQTT)
- **Broker**: EMQX (MQTT)
- **Backend**: NestJS + TypeORM + PostgreSQL (PostGIS)
- **Frontend**: Next.js + Leaflet + Socket.io
- **Infrastructure**: Docker → Kubernetes (Kind)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- PostgreSQL client (optional)

### 1. Start Infrastructure

```bash
# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up -d

# Check service health
docker-compose ps
```

### 2. Access Services

- **PostgreSQL**: `localhost:5432`
  - User: `admin`
  - Password: `admin`
  - Database: `cityear`
  
- **EMQX Dashboard**: http://localhost:18083
  - User: `admin`
  - Password: `public`
  
- **PgAdmin**: http://localhost:5050
  - Email: `admin@cityear.com`
  - Password: `admin`

### 3. Verify Installation

```bash
# Test PostgreSQL connection
psql -h localhost -U admin -d cityear -c "SELECT PostGIS_Version();"

# Check EMQX status
curl http://localhost:18083/api/v5/status
```

## 📊 Performance Targets

- **Throughput**: 200 events/second
- **Latency**: < 200ms for anomaly detection
- **Scalability**: 1000+ concurrent devices
- **Availability**: 99.9% uptime

## 🗂️ Project Structure

```
cityear/
├── backend/           # NestJS backend
├── frontend/          # Next.js dashboard
├── simulator/         # IoT device simulator
├── k8s/              # Kubernetes manifests
├── docker-compose.yml
└── README.md
```

## 📝 Development Workflow

1. **Phase 1**: ✅ Infrastructure Setup (Current)
2. **Phase 2**: IoT Simulator Development
3. **Phase 3**: Backend Processing Pipeline
4. **Phase 4**: Frontend Dashboard
5. **Phase 5**: Kubernetes Deployment

## 🔧 Troubleshooting

### PostgreSQL Connection Issues

```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### EMQX Not Starting

```bash
# Check EMQX logs
docker-compose logs emqx

# Verify port availability
netstat -an | findstr "1883"
```

## 📚 Documentation

- [Database Schema](./docs/database-schema.md)
- [MQTT Topics](./docs/mqtt-topics.md)
- [API Documentation](./docs/api.md)

## 👥 Contributors

CityEar Team - IoT Course Project

## 📄 License

MIT
