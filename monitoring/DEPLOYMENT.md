# Grafana Alloy Observability Stack - Deployment Walkthrough

## Overview

Successfully deployed a **fully self-hosted** observability stack for the CityEar IoT system using Grafana Alloy v1.12.1+ with Prometheus, Loki, and Grafana.

## What Was Deployed

### 1. Grafana Alloy (Port 12345)
**Role**: Single unified telemetry collector  
**Replaces**: Prometheus scrapers + Promtail + separate agents

**Collecting:**
- ✅ PostgreSQL/TimescaleDB metrics (connection pools, query performance, DB size)
- ✅ EMQX MQTT broker metrics (connections, message rates, subscriptions)
- ✅ Docker container logs (all services with metadata)

**Access**: http://localhost:12345

---

### 2. Prometheus (Port 9090)
**Role**: Metrics storage (Time-series DB)  
**Retention**: 15 days  
**Receives**: Metrics from Alloy via remote_write API

**Access**: http://localhost:9090

---

### 3. Loki (Port 3100)
**Role**: Log aggregation and storage  
**Retention**: 14 days (336 hours)  
**Schema**: v13 (latest, supports OTLP)

**Access**: http://localhost:3100

---

### 4. Grafana (Port 3003)
**Role**: Unified visualization dashboard  
**Credentials**: `admin` / `admin`  
**Datasources**: Auto-provisioned (Prometheus + Loki)

**Access**: http://localhost:3003

---

## Configuration Files Created

```
monitoring/
├── config.alloy                     # Alloy pipelines (Postgres, EMQX, Docker logs)
├── prometheus.yml                   # Prometheus scrape config
├── loki-config.yml                  # Loki storage schema v13
├── grafana/
│   └── provisioning/
│       └── datasources/
│           └── datasources.yml      # Auto-provisioned Prometheus + Loki
└── README.md                        # Setup and troubleshooting guide
```

---

## Configuration Fixes Applied

During deployment, the following issues were identified and resolved:

| Component    | Issue                                  | Fix                                                      |
|--------------|----------------------------------------|----------------------------------------------------------|
| Alloy        | Invalid `data_source_name` (singular)  | Changed to `data_source_names` (array)                   |
| Alloy        | Invalid `batch_wait` in endpoint block | Removed from `loki.write.endpoint`                       |
| Alloy        | Invalid `relabel_rules` reference      | Removed from `loki.source.docker`                        |
| Prometheus   | Invalid YAML `retention.time` field    | Moved to CLI flag `--storage.tsdb.retention.time=15d`    |
| Loki         | Schema v11 incompatibility             | Updated to v13 with `tsdb` store                         |
| Loki         | Permission denied on `/tmp/loki`       | Added `user: "0"` to run as root + recreated container   |

---

## How to Use

### 1. Access Grafana Dashboard
1. Navigate to http://localhost:3003
2. Login with `admin` / `admin`
3. Go to **Explore** → Select **Prometheus** datasource
4. Query examples:
   ```promql
   # PostgreSQL connection count
   pg_stat_database_numbackends
   
   # EMQX active connections
   emqx_connections_count
   ```

### 2. View Container Logs
1. In Grafana, go to **Explore** → Select **Loki** datasource
2. Query examples:
   ```logql
   {container_name="cityear-api"}
   {container_name="cityear-consumer"} |= "error"
   {container_name=~"cityear-.*"} | json
   ```

### 3. Monitor Alloy Health
1. Navigate to http://localhost:12345
2. View component graph - all nodes should be **green** (healthy)
3. Check for any red/yellow nodes indicating collection issues

### 4. Verify Prometheus Targets
1. Navigate to http://localhost:9090/targets
2. Verify all targets show "UP":
   - `prometheus` (self)
   - `alloy` (self)
   - Postgres exporter (via Alloy)
   - EMQX metrics (via Alloy)

---

## Services Status

All 4 services are **running and healthy**:

```bash
$ docker compose ps prometheus loki grafana alloy

NAME                 STATUS          PORTS
cityear-alloy        Up 3 minutes    0.0.0.0:12345->12345/tcp
cityear-grafana      Up 4 minutes    0.0.0.0:3003->3000/tcp
cityear-prometheus   Up 2 minutes    0.0.0.0:9090->9090/tcp
cityear-loki         Up 29 seconds   0.0.0.0:3100->3100/tcp
```

---

## Next Steps (Optional Enhancements)

1. **Import Dashboards**: Add pre-built Grafana dashboards from https://grafana.com/grafana/dashboards/
   - PostgreSQL: Dashboard ID `9628`
   - Docker Containers: Dashboard ID `893`

2. **Add Alerting**: Configure Prometheus AlertManager for critical threshold alerts

3. **Custom Dashboards**: Create custom visualizations for IoT-specific metrics (noise levels, device health, etc.)

4. **Application Tracing**: Instrument NestJS backend with OpenTelemetry for distributed tracing

---

## Troubleshooting

If any service fails to start, check logs:
```bash
docker compose logs <service-name>
```

For detailed troubleshooting, see `monitoring/README.md`.
