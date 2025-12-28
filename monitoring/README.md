# CityEar IoT Observability Stack

This directory contains the configuration for the Grafana Alloy observability stack, providing comprehensive metrics and logging for the CityEar IoT system.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Grafana Alloy                           │
│  (Collector - Scrapes metrics, collects logs)              │
└────────┬──────────────────────────────────┬─────────────────┘
         │                                  │
         ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│   Prometheus     │              │      Loki        │
│ (Metrics Store)  │              │  (Log Store)     │
└────────┬─────────┘              └────────┬─────────┘
         │                                  │
         └──────────────┬───────────────────┘
                        ▼
                ┌──────────────────┐
                │     Grafana      │
                │ (Visualization)  │
                └──────────────────┘
```

## Services

### Grafana Alloy (Port 12345)
- **Role**: Telemetry collector
- **Collects**: 
  - PostgreSQL/TimescaleDB metrics
  - EMQX MQTT broker metrics
  - Docker container logs
- **UI**: http://localhost:12345

### Prometheus (Port 9090)
- **Role**: Metrics storage and querying
- **Retention**: 15 days
- **UI**: http://localhost:9090

### Loki (Port 3100)
- **Role**: Log aggregation and storage
- **Retention**: 14 days
- **API**: http://localhost:3100

### Grafana (Port 3003)
- **Role**: Visualization and dashboards
- **Credentials**: admin / admin
- **URL**: http://localhost:3003

## Quick Start

1. **Start the observability stack**:
   ```bash
   docker compose up -d prometheus loki grafana alloy
   ```

2. **Verify services are running**:
   ```bash
   docker compose ps
   ```

3. **Access Grafana**:
   - Navigate to http://localhost:3003
   - Login with `admin` / `admin`
   - Datasources (Prometheus & Loki) are auto-provisioned

4. **Check Alloy UI**:
   - Navigate to http://localhost:12345
   - Verify all components show as "Healthy" (green)

## Monitoring Capabilities

### Metrics Available
- **PostgreSQL/TimescaleDB**:
  - Connection pools, query performance
  - Database size, transaction rates
  - Table/index statistics
  
- **EMQX MQTT Broker**:
  - Active connections, subscriptions
  - Message throughput, publish/subscribe rates
  - Session statistics

### Logs Collected
- All Docker container logs (backend-api, consumer, simulator, frontend, etc.)
- Structured with container metadata (name, ID, labels)
- Real-time streaming to Loki

## Configuration Files

- `config.alloy`: Main Alloy configuration (collectors, pipelines)
- `prometheus.yml`: Prometheus server config
- `loki-config.yml`: Loki server config
- `grafana/provisioning/datasources/datasources.yml`: Auto-provision Grafana datasources

## Troubleshooting

### Alloy shows "Unhealthy" components
1. Check Alloy logs: `docker compose logs alloy`
2. Verify target services are running: `docker compose ps`
3. Check Alloy UI at http://localhost:12345 for detailed error messages

### No metrics in Prometheus
1. Verify Prometheus is receiving data: http://localhost:9090/targets
2. Check Alloy is forwarding metrics: http://localhost:12345
3. Verify postgres_exporter is exporting: http://localhost:9090/metrics

### No logs in Loki
1. Verify Docker socket is accessible to Alloy
2. Check Loki health: `docker compose logs loki`
3. Query Loki directly: http://localhost:3100/ready

## Retention & Storage

- **Prometheus**: 15 days retention, stored in `prometheus_data` volume
- **Loki**: 14 days retention, stored in `loki_data` volume
- **Grafana**: Dashboard/config in `grafana_data` volume

## Useful Grafana dashboard IDs

Import these from https://grafana.com/grafana/dashboards/:
- **PostgreSQL**: Dashboard ID `9628`
- **Docker Containers**: Dashboard ID `893`
- **Loki Logs**: Built-in "Explore" view

## Debug Logging

Alloy is configured with `level = "debug"` for comprehensive visibility. 
To reduce verbosity, edit `config.alloy` and change to `level = "info"`.
