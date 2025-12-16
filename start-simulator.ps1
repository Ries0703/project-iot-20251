# CityEar Simulator - Start Script

Write-Host "🌆 CityEar IoT Simulator" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\simulator"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Starting simulator with:" -ForegroundColor Yellow
Write-Host "  📍 Devices: $env:DEVICE_COUNT (default: 50)" -ForegroundColor White
Write-Host "  📡 MQTT: $env:MQTT_BROKER_URL (default: mqtt://localhost:1883)" -ForegroundColor White
Write-Host "  ⏱️  Interval: 5 seconds" -ForegroundColor White
Write-Host ""

npm run start:dev
