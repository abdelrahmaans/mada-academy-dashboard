# End-to-End Multi-Role Seed Data Flow Verification (All 10 Roles: R00 - R09)
param(
    [string]$ApiBase = "http://localhost:5000/api/v1",
    [string]$Password = "Mada@2026"
)

$ErrorActionPreference = "Stop"
$results = [System.Collections.Generic.List[PSCustomObject]]::new()

function Test-RoleFlow($roleCode, $roleName, [scriptblock]$flowBlock) {
    Write-Host "`n[$roleCode] Testing $roleName..." -ForegroundColor Yellow
    try {
        & $flowBlock
        $results.Add([PSCustomObject]@{ Role = $roleCode; Name = $roleName; Status = "PASSED"; Error = "" })
        Write-Host "  -> [OK] $roleCode flow verified successfully." -ForegroundColor Green
    } catch {
        $results.Add([PSCustomObject]@{ Role = $roleCode; Name = $roleName; Status = "FAILED"; Error = $_.Exception.Message })
        Write-Host "  -> [FAIL] $roleCode failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Post-Login($phone, $password, $accountType = "staff") {
    $body = @{ phone = $phone; password = $password; accountType = $accountType } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$ApiBase/auth/login" -Method POST -Body $body -ContentType "application/json"
    return $res.data.accessToken
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   MADA ACADEMY - 10-ROLE END-TO-END FLOW VERIFICATION (SEED)   " -ForegroundColor Cyan
Write-Host "   Target API Base: $ApiBase" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 0. Platform Admin Flow (R00)
Test-RoleFlow "R00" "Platform Admin (+201000000001)" {
    $token = Post-Login "+201000000001" $Password "staff"
    $headers = @{ Authorization = "Bearer $token" }
    $academies = Invoke-RestMethod -Uri "$ApiBase/platform/academies" -Method GET -Headers $headers
    $items = if ($academies.data.items) { $academies.data.items } else { $academies.data }
    Write-Host "  -> Academies listed: $($items.Count)" -ForegroundColor Gray
    $roles = Invoke-RestMethod -Uri "$ApiBase/platform/roles" -Method GET -Headers $headers
    $rolesList = if ($roles.data.items) { $roles.data.items } else { $roles.data }
    Write-Host "  -> Platform Catalog Roles: $($rolesList.Count)" -ForegroundColor Gray
}

# 1. Academy Owner Flow (R01)
Test-RoleFlow "R01" "Academy Owner (+201000000002)" {
    $token = Post-Login "+201000000002" $Password "staff"
    $headers = @{ Authorization = "Bearer $token" }
    $branches = Invoke-RestMethod -Uri "$ApiBase/academy/branches" -Method GET -Headers $headers
    Write-Host "  -> Academy Branches: $($branches.data.items.Count)" -ForegroundColor Gray
    $roles = Invoke-RestMethod -Uri "$ApiBase/academy/roles" -Method GET -Headers $headers
    Write-Host "  -> Tenant Role Overrides & Members: $($roles.data.items.Count)" -ForegroundColor Gray
    $audit = Invoke-RestMethod -Uri "$ApiBase/academy/audit-events" -Method GET -Headers $headers
    $auditItems = if ($audit.data.items) { $audit.data.items } else { $audit.data }
    Write-Host "  -> Academy Audit Trail Events: $($auditItems.Count)" -ForegroundColor Gray
}

# 2. Branch Manager Flow (R02)
Test-RoleFlow "R02" "Branch Manager (+201000000003)" {
    $token = Post-Login "+201000000003" $Password "staff"
    $headers = @{ Authorization = "Bearer $token" }
    $summary = Invoke-RestMethod -Uri "$ApiBase/dashboard/summary" -Method GET -Headers $headers
    Write-Host "  -> Branch Summary: Students=$($summary.data.students) | Sessions=$($summary.data.upcomingSessions)" -ForegroundColor Gray
    $freezes = Invoke-RestMethod -Uri "$ApiBase/operations/freeze-requests" -Method GET -Headers $headers
    Write-Host "  -> Subscription Freezes: $($freezes.data.Count)" -ForegroundColor Gray
    $comps = Invoke-RestMethod -Uri "$ApiBase/competitions" -Method GET -Headers $headers
    Write-Host "  -> Active Competitions: $($comps.data.Count)" -ForegroundColor Gray
}

# 3. Head Instructor Flow (R03)
Test-RoleFlow "R03" "Head Instructor (+201000000004)" {
    $token = Post-Login "+201000000004" $Password "staff"
    $headers = @{ Authorization = "Bearer $token" }
    $groups = Invoke-RestMethod -Uri "$ApiBase/scheduling/groups" -Method GET -Headers $headers
    $groupItems = if ($groups.data.items) { $groups.data.items } else { $groups.data }
    Write-Host "  -> Academic Groups in Branch: $($groupItems.Count)" -ForegroundColor Gray
    $supervision = Invoke-RestMethod -Uri "$ApiBase/supervision/my-groups" -Method GET -Headers $headers
    $supItems = if ($supervision.data.items) { $supervision.data.items } else { $supervision.data }
    Write-Host "  -> Supervised Groups in Scope: $($supItems.Count)" -ForegroundColor Gray
}

# 4. Main Instructor Flow (R04)
Test-RoleFlow "R04" "Main Instructor (+201000000010)" {
    $token = Post-Login "+201000000010" $Password "staff"
    $headers = @{ Authorization = "Bearer $token" }
    $sessions = Invoke-RestMethod -Uri "$ApiBase/sessions" -Method GET -Headers $headers
    $sessionItems = if ($sessions.data.items) { $sessions.data.items } else { $sessions.data }
    Write-Host "  -> Assigned Sessions: $($sessionItems.Count)" -ForegroundColor Gray
}

# 5. Secretary Flow (R05)
Test-RoleFlow "R05" "Secretary (+201000000005)" {
    $token = Post-Login "+201000000005" $Password "staff"
    $headers = @{ Authorization = "Bearer $token" }
    $students = Invoke-RestMethod -Uri "$ApiBase/students" -Method GET -Headers $headers
    Write-Host "  -> Students Directory: $($students.data.items.Count) students" -ForegroundColor Gray
    $freezes = Invoke-RestMethod -Uri "$ApiBase/operations/freeze-requests" -Method GET -Headers $headers
    Write-Host "  -> Freeze Queue for Desk: $($freezes.data.Count)" -ForegroundColor Gray
}

# 6. Accountant Flow (R06)
Test-RoleFlow "R06" "Accountant (+201000000006)" {
    $token = Post-Login "+201000000006" $Password "staff"
    $headers = @{ Authorization = "Bearer $token" }
    $invoices = Invoke-RestMethod -Uri "$ApiBase/finance/invoices" -Method GET -Headers $headers
    Write-Host "  -> Finance Invoices: $($invoices.data.items.Count)" -ForegroundColor Gray
    $payroll = Invoke-RestMethod -Uri "$ApiBase/finance/payroll/instructors?month=2026-10" -Method GET -Headers $headers
    $payrollList = if ($payroll.data.items) { $payroll.data.items } else { $payroll.data }
    Write-Host "  -> Instructor Session Payroll: $($payrollList.Count) instructors computed" -ForegroundColor Gray
}

# 7. Media & Marketing Manager Flow (R07)
Test-RoleFlow "R07" "Marketing Desk (+201000000007)" {
    $token = Post-Login "+201000000007" $Password "staff"
    $headers = @{ Authorization = "Bearer $token" }
    $leads = Invoke-RestMethod -Uri "$ApiBase/leads" -Method GET -Headers $headers
    $leadItems = if ($leads.data.items) { $leads.data.items } else { $leads.data }
    Write-Host "  -> Persisted Leads in Scope: $($leadItems.Count)" -ForegroundColor Gray
    $campaigns = Invoke-RestMethod -Uri "$ApiBase/marketing/campaigns" -Method GET -Headers $headers
    $campItems = if ($campaigns.data.items) { $campaigns.data.items } else { $campaigns.data }
    Write-Host "  -> Active Marketing Campaigns: $($campItems.Count)" -ForegroundColor Gray
}

# 8. Parent Flow (R08)
Test-RoleFlow "R08" "Parent Family Portal (+201000000011)" {
    $token = Post-Login "+201000000011" $Password "parent"
    $headers = @{ Authorization = "Bearer $token" }
    $children = Invoke-RestMethod -Uri "$ApiBase/consumer/me/students" -Method GET -Headers $headers
    Write-Host "  -> Linked Children: $($children.data.items.Count)" -ForegroundColor Gray
    $sessions = Invoke-RestMethod -Uri "$ApiBase/consumer/me/sessions" -Method GET -Headers $headers
    Write-Host "  -> Linked Child Sessions & Attendance: $($sessions.data.items.Count)" -ForegroundColor Gray
    $freezes = Invoke-RestMethod -Uri "$ApiBase/consumer/freeze-requests" -Method GET -Headers $headers
    Write-Host "  -> Child Subscription Freezes: $($freezes.data.Count)" -ForegroundColor Gray
}

# 9. Student Flow (R09)
Test-RoleFlow "R09" "Student Portal (+201000000012)" {
    $token = Post-Login "+201000000012" $Password "student"
    $headers = @{ Authorization = "Bearer $token" }
    $sessions = Invoke-RestMethod -Uri "$ApiBase/consumer/me/sessions" -Method GET -Headers $headers
    Write-Host "  -> Student Self Sessions: $($sessions.data.items.Count)" -ForegroundColor Gray
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "                     VERIFICATION SUMMARY                        " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
$results | Format-Table -AutoSize -Property Role, Name, Status, Error

$failedCount = ($results | Where-Object { $_.Status -eq "FAILED" }).Count
if ($failedCount -eq 0) {
    Write-Host "SUCCESS: All 10 roles (R00 - R09) passed live verification!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "FAILURE: $failedCount role(s) failed verification." -ForegroundColor Red
    exit 1
}
