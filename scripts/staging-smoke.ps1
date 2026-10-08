param(
    [string]$ApiBaseUrl = $env:API_BASE_URL,
    [string]$StaffPhone = $env:STAFF_PHONE,
    [string]$StaffPassword = $env:STAFF_PASSWORD,
    [string]$ParentPhone = $env:PARENT_PHONE,
    [string]$ParentPassword = $env:PARENT_PASSWORD
)

$ErrorActionPreference = "Stop"

if (-not $ApiBaseUrl) {
    Write-Error "ApiBaseUrl is required. Example: https://api.yourdomain.com/api/v1"
}

$ApiBaseUrl = $ApiBaseUrl.TrimEnd('/')

Write-Host "1. Checking health: $ApiBaseUrl/health" -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$ApiBaseUrl/health" -Method Get
Write-Host "   -> Health Status: $($health.status)" -ForegroundColor Green

if ($StaffPhone -and $StaffPassword) {
    Write-Host "2. Logging in as Staff: $StaffPhone" -ForegroundColor Cyan
    $loginBody = @{
        phone = $StaffPhone
        password = $StaffPassword
        accountType = "staff"
    } | ConvertTo-Json

    $loginResp = Invoke-RestMethod -Uri "$ApiBaseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResp.data.accessToken
    Write-Host "   -> Staff login successful." -ForegroundColor Green

    Write-Host "3. Verifying /me with Staff token" -ForegroundColor Cyan
    $headers = @{ Authorization = "Bearer $token" }
    $meResp = Invoke-RestMethod -Uri "$ApiBaseUrl/me" -Method Get -Headers $headers
    Write-Host "   -> Hello $($meResp.data.name) (Role: $($meResp.data.role))" -ForegroundColor Green

    Write-Host "4. Testing /finance/invoices" -ForegroundColor Cyan
    $invoicesResp = Invoke-RestMethod -Uri "$ApiBaseUrl/finance/invoices" -Method Get -Headers $headers
    Write-Host "   -> Retrieved $($invoicesResp.data.items.Count) invoices." -ForegroundColor Green
}

if ($ParentPhone -and $ParentPassword) {
    Write-Host "5. Logging in as Parent: $ParentPhone" -ForegroundColor Cyan
    $parentBody = @{
        phone = $ParentPhone
        password = $ParentPassword
        accountType = "parent"
    } | ConvertTo-Json

    $parentResp = Invoke-RestMethod -Uri "$ApiBaseUrl/auth/login" -Method Post -Body $parentBody -ContentType "application/json"
    $parentToken = $parentResp.data.accessToken
    Write-Host "   -> Parent login successful." -ForegroundColor Green

    Write-Host "6. Verifying /consumer/invoices" -ForegroundColor Cyan
    $parentHeaders = @{ Authorization = "Bearer $parentToken" }
    $consumerInvoices = Invoke-RestMethod -Uri "$ApiBaseUrl/consumer/invoices" -Method Get -Headers $parentHeaders
    Write-Host "   -> Retrieved $($consumerInvoices.data.items.Count) parent invoices." -ForegroundColor Green
}

Write-Host "SUCCESS: Staging smoke checks passed completely!" -ForegroundColor Green
