# Mada Academy - Database Reset & Seed Script
param(
    [string]$ApiBase = "http://localhost:5000/api/v1"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Mada Academy - Database Reset & Comprehensive Seeder   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Sending Reset & Seed request to: $ApiBase/dev/reset-and-seed..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$ApiBase/dev/reset-and-seed" -Method POST -ContentType "application/json"
    Write-Host "`nDatabase successfully wiped and re-seeded with demo data!" -ForegroundColor Green
    Write-Host "Default Password: $($response.defaultPassword)`n" -ForegroundColor Yellow
    Write-Host "Available Demo Logins:" -ForegroundColor Cyan
    $response.logins | Format-Table -Property role, phone, name
} catch {
    Write-Host "Failed to call /dev/reset-and-seed endpoint." -ForegroundColor Red
    Write-Host "Make sure the backend is running (dotnet run) in Development environment.`n" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
}
