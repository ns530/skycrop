# PowerShell Diagnostic Script for SkyCrop Deployment

Write-Host "🔍 SkyCrop Deployment Diagnostics" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

$BACKEND_URL = "https://backend-production-9e94.up.railway.app"
$FRONTEND_URL = "https://skycrop.vercel.app"

# Test 1: Backend Health
Write-Host "1. Testing Backend Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$BACKEND_URL/health" -Method GET -UseBasicParsing
    Write-Host "   ✅ Status: $($health.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($health.Content.Substring(0, [Math]::Min(100, $health.Content.Length)))" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Auth Login Endpoint
Write-Host "2. Testing Auth Login Endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        email = "test@test.com"
        password = "test"
    } | ConvertTo-Json
    
    $login = Invoke-WebRequest -Uri "$BACKEND_URL/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "   Status: $($login.StatusCode)" -ForegroundColor Gray
    if ($login.StatusCode -eq 404) {
        Write-Host "   ❌ 404 NOT FOUND - Route doesn't exist!" -ForegroundColor Red
    } elseif ($login.StatusCode -eq 400 -or $login.StatusCode -eq 401) {
        Write-Host "   ✅ Endpoint exists ($($login.StatusCode) = validation/auth error, not 404)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Unexpected status: $($login.StatusCode)" -ForegroundColor Yellow
    }
    Write-Host "   Response: $($login.Content.Substring(0, [Math]::Min(200, $login.Content.Length)))" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404) {
        Write-Host "   ❌ 404 NOT FOUND - Route doesn't exist!" -ForegroundColor Red
    } elseif ($statusCode -eq 400 -or $statusCode -eq 401) {
        Write-Host "   ✅ Endpoint exists ($statusCode = validation/auth error, not 404)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Status: $statusCode" -ForegroundColor Yellow
    }
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Test 3: Auth Signup Endpoint
Write-Host "3. Testing Auth Signup Endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        email = "test@test.com"
        password = "test123"
        name = "Test User"
    } | ConvertTo-Json
    
    $signup = Invoke-WebRequest -Uri "$BACKEND_URL/api/v1/auth/signup" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "   Status: $($signup.StatusCode)" -ForegroundColor Gray
    if ($signup.StatusCode -eq 404) {
        Write-Host "   ❌ 404 NOT FOUND - Route doesn't exist!" -ForegroundColor Red
    } elseif ($signup.StatusCode -eq 400 -or $signup.StatusCode -eq 409) {
        Write-Host "   ✅ Endpoint exists ($($signup.StatusCode) = validation error, not 404)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Unexpected status: $($signup.StatusCode)" -ForegroundColor Yellow
    }
    Write-Host "   Response: $($signup.Content.Substring(0, [Math]::Min(200, $signup.Content.Length)))" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404) {
        Write-Host "   ❌ 404 NOT FOUND - Route doesn't exist!" -ForegroundColor Red
    } elseif ($statusCode -eq 400 -or $statusCode -eq 409) {
        Write-Host "   ✅ Endpoint exists ($statusCode = validation error, not 404)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Status: $statusCode" -ForegroundColor Yellow
    }
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Test 4: CORS Headers
Write-Host "4. Testing CORS Headers..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = $FRONTEND_URL
    }
    $cors = Invoke-WebRequest -Uri "$BACKEND_URL/health" -Method GET -Headers $headers -UseBasicParsing
    $corsOrigin = $cors.Headers["Access-Control-Allow-Origin"]
    if ($corsOrigin) {
        Write-Host "   Access-Control-Allow-Origin: $corsOrigin" -ForegroundColor Gray
        if ($corsOrigin -like "*skycrop.vercel.app*") {
            Write-Host "   ✅ CORS configured correctly for Vercel domain" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  CORS may not include skycrop.vercel.app" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ CORS headers not present" -ForegroundColor Red
    }
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Check Railway logs: railway logs" -ForegroundColor White
Write-Host "   2. Check Vercel env vars: vercel env ls" -ForegroundColor White
Write-Host "   3. Verify VITE_API_BASE_URL is set in Vercel" -ForegroundColor White
Write-Host "   4. Check browser Network tab for actual request URLs" -ForegroundColor White
Write-Host ""
