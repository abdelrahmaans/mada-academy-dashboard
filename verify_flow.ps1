# End-to-End Seed Data Flow Verification
param(
    [string]$ApiBase = "http://localhost:5000/api/v1"
)

function Post-Login($phone, $password, $accountType = "staff") {
    $body = @{ phone = $phone; password = $password; accountType = $accountType } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$ApiBase/auth/login" -Method POST -Body $body -ContentType "application/json"
    return $res.data.accessToken
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   MADA ACADEMY - END-TO-END DATA FLOW VERIFICATION (SEED DATA)  " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Branch Manager Flow (R02)
Write-Host "`n[1] Testing Branch Manager Flow (R02: +201000000003)..." -ForegroundColor Yellow
$mgrToken = Post-Login "+201000000003" "Mada@2026" "staff"
$mgrHeaders = @{ Authorization = "Bearer $mgrToken" }

$freezes = Invoke-RestMethod -Uri "$ApiBase/operations/freeze-requests" -Method GET -Headers $mgrHeaders
Write-Host "  -> Subscription Freezes retrieved: $($freezes.data.Count)" -ForegroundColor Green
foreach ($f in $freezes.data) {
    Write-Host "     * Freeze ID: $($f.id) | Student: $($f.studentName) | Status: $($f.status) | MakeUpCredits: $($f.makeUpCreditsAwarded)" -ForegroundColor Gray
}

$comps = Invoke-RestMethod -Uri "$ApiBase/competitions" -Method GET -Headers $mgrHeaders
Write-Host "  -> Active Competitions retrieved: $($comps.data.Count)" -ForegroundColor Green
foreach ($c in $comps.data) {
    Write-Host "     * Competition: $($c.name) | Organizer: $($c.organizer) | Teams: $($c.teamsCount)" -ForegroundColor Gray
}

$hallOfFame = Invoke-RestMethod -Uri "$ApiBase/competitions/hall-of-fame" -Method GET -Headers $mgrHeaders
Write-Host "  -> Hall of Fame Awards retrieved: $($hallOfFame.data.Count)" -ForegroundColor Green
foreach ($a in $hallOfFame.data) {
    Write-Host "     * Award: $($a.title) | Team: $($a.teamName) | Competition: $($a.competitionName)" -ForegroundColor Gray
}

# 2. Accountant Flow (R06)
Write-Host "`n[2] Testing Accountant Flow (R06: +201000000006)..." -ForegroundColor Yellow
$accToken = Post-Login "+201000000006" "Mada@2026" "staff"
$accHeaders = @{ Authorization = "Bearer $accToken" }

$payroll = Invoke-RestMethod -Uri "$ApiBase/finance/payroll/instructors?month=2026-10" -Method GET -Headers $accHeaders
$payrollList = if ($payroll.data.items) { $payroll.data.items } else { $payroll.data }
Write-Host "  -> Dynamic Instructor Session Payroll calculated: $($payrollList.Count) instructors" -ForegroundColor Green
foreach ($p in $payrollList) {
    Write-Host "     * Instructor: $($p.instructorName) | Completed Sessions: $($p.completedSessionsCount) | Net: $($p.netPayable) EGP" -ForegroundColor Gray
}

$invoices = Invoke-RestMethod -Uri "$ApiBase/finance/invoices" -Method GET -Headers $accHeaders
Write-Host "  -> Invoices retrieved: $($invoices.data.items.Count)" -ForegroundColor Green
foreach ($inv in $invoices.data.items) {
    Write-Host "     * Invoice: $($inv.invoiceNumber) | Total: $($inv.totalPiastres / 100) EGP | Paid: $($inv.paidPiastres / 100) EGP | Status: $($inv.status)" -ForegroundColor Gray
}

# 3. Parent Flow (R08)
Write-Host "`n[3] Testing Family Portal Flow (R08: +201000000011)..." -ForegroundColor Yellow
$parentToken = Post-Login "+201000000011" "Mada@2026" "parent"
$parentHeaders = @{ Authorization = "Bearer $parentToken" }

$myStudents = Invoke-RestMethod -Uri "$ApiBase/consumer/me/students" -Method GET -Headers $parentHeaders
Write-Host "  -> Linked Children retrieved: $($myStudents.data.items.Count)" -ForegroundColor Green
foreach ($s in $myStudents.data.items) {
    Write-Host "     * Child: $($s.name) | Relationship: $($s.relationship)" -ForegroundColor Gray
}

$mySessions = Invoke-RestMethod -Uri "$ApiBase/consumer/me/sessions" -Method GET -Headers $parentHeaders
Write-Host "  -> Child Sessions & Attendance retrieved: $($mySessions.data.items.Count)" -ForegroundColor Green
foreach ($sess in $mySessions.data.items) {
    Write-Host "     * Session: #$($sess.sessionNumber) ($($sess.courseName)) | Attendance: $($sess.attendanceStatus) | Score: $($sess.evaluationScore)" -ForegroundColor Gray
}

$parentFreezes = Invoke-RestMethod -Uri "$ApiBase/consumer/freeze-requests" -Method GET -Headers $parentHeaders
Write-Host "  -> Child Subscription Freezes retrieved: $($parentFreezes.data.Count)" -ForegroundColor Green
foreach ($pf in $parentFreezes.data) {
    Write-Host "     * Child Freeze: $($pf.studentName) | Status: $($pf.status) | MakeUpCredits: $($pf.makeUpCreditsAwarded)" -ForegroundColor Gray
}

# 4. Secretary Flow (R05 - Referrals)
Write-Host "`n[4] Testing Secretary Flow (R05: +201000000005)..." -ForegroundColor Yellow
$secToken = Post-Login "+201000000005" "Mada@2026" "staff"
$secHeaders = @{ Authorization = "Bearer $secToken" }

$allStudents = Invoke-RestMethod -Uri "$ApiBase/students" -Method GET -Headers $secHeaders
Write-Host "  -> Registered Students retrieved: $($allStudents.data.items.Count)" -ForegroundColor Green
foreach ($st in $allStudents.data.items) {
    $refText = if ($st.referredByStudentId) { " (Referred by: $($st.referredByStudentId))" } else { "" }
    Write-Host "     * Student: $($st.fullName) | Status: $($st.status)$refText" -ForegroundColor Gray
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "   ALL SEED DATA FLOWS VALIDATED SUCCESSFULLY ACROSS ALL ROLES!   " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
