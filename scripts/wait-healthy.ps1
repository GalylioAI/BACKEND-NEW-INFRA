param(
  [int]$TimeoutSeconds = 120
)

$services = @(
  "http://localhost:8080/health",
  "http://localhost:8081/health",
  "http://localhost:8082/health",
  "http://localhost:8083/health",
  "http://localhost:8084/health",
  "http://localhost:8085/health"
)

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
foreach ($url in $services) {
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 3
      if ($response.success -eq $true -and $response.data.status -eq "ok") {
        Write-Host "$url ok"
        break
      }
    } catch {
      Start-Sleep -Seconds 2
      continue
    }
    Start-Sleep -Seconds 2
  }
  if ((Get-Date) -ge $deadline) {
    throw "Timed out waiting for $url"
  }
}
