# EMQX Access Information

## Dashboard Access

**URL**: http://localhost:18083

**Default Credentials:**
- Username: `admin`
- Password: `public`

## If Account is Locked

### Option 1: Wait 10 minutes
EMQX will automatically unlock the account after 10 minutes.

### Option 2: Restart EMQX container (faster)
```powershell
docker restart cityear-emqx
```

Wait 15 seconds for EMQX to start, then login again.

## MQTT Connection Info

For devices/simulator:
- **Host**: localhost
- **Port**: 1883 (TCP) or 8083 (WebSocket)
- **No authentication** (development mode)

## Monitoring Metrics

In Dashboard, check:
1. **Overview** → Connections (should see simulator connections)
2. **Overview** → Messages/sec (should see ~10 msg/s for 50 devices)
3. **Clients** → Connected clients list
4. **Topics** → `city/sensors/events` subscription count

## Reset to Default

If needed to completely reset EMQX:
```powershell
docker-compose restart emqx
```
