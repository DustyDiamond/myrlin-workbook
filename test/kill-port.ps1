$conns = Get-NetTCPConnection -LocalPort 3456 -ErrorAction SilentlyContinue
if ($conns) {
    foreach ($c in $conns) {
        Write-Host "Found PID $($c.OwningProcess) State: $($c.State)"
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "Killed PID $($c.OwningProcess)"
    }
    Start-Sleep -Seconds 1
}

$check = Get-NetTCPConnection -LocalPort 3456 -ErrorAction SilentlyContinue
if ($check) {
    Write-Host "WARNING: Port 3456 STILL IN USE"
} else {
    Write-Host "Port 3456 is FREE"
}
