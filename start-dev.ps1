# Maaza Cafe - Development Startup Script
Write-Host "☕ Starting Maaza Cafe Management System..." -ForegroundColor Yellow

$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "frontend"

# Start Backend
Write-Host "🚀 Launching Backend Server on http://localhost:5001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; npm run dev"

# Start Frontend
Write-Host "🎨 Launching Frontend Vite Server on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; npm run dev"

Write-Host "✅ Both servers launched! Open http://localhost:5173 in your browser." -ForegroundColor Green
