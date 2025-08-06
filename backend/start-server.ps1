Write-Host "Starting CinemaHub Backend Server..." -ForegroundColor Green

# Start the server in background
$job = Start-Job -ScriptBlock {
    Set-Location "C:\Users\Lenovo\OneDrive\Desktop\app\backend"
    node test-server.js
}

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Test the server
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -UseBasicParsing
    Write-Host "Server is running! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Yellow
} catch {
    Write-Host "Server test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Server is running in background. Press any key to stop..." -ForegroundColor Cyan
Read-Host
Stop-Job $job
Remove-Job $job 