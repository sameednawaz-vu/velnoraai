# Hostinger Direct Deployment Automation for Velnora AI (velnoraai.app)
param (
    [string]$ApiToken = $env:HOSTINGER_API_TOKEN,
    [string]$Domain = "velnoraai.app",
    [string]$Username = "u174589978"
)

$rootDir = (Get-Item $PSScriptRoot).Parent.FullName

if (-not $ApiToken -and (Test-Path "$rootDir\.env")) {
    $envContent = Get-Content "$rootDir\.env"
    foreach ($line in $envContent) {
        if ($line -match "^HOSTINGER_API_TOKEN=(.*)$") {
            $ApiToken = $matches[1].Trim()
            break
        }
    }
}

if (-not $ApiToken) {
    Write-Error "HOSTINGER_API_TOKEN is not set. Please add HOSTINGER_API_TOKEN to your .env file or environment variables."
    exit 1
}

$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Velnora AI - Hostinger Deployment Tool" -ForegroundColor Cyan
Write-Host "  Domain: $Domain | User: $Username" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Build Astro static site
Write-Host "`n[1/5] Building production static site with Astro..." -ForegroundColor Yellow
Set-Location $rootDir
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed. Aborting deployment."
    exit 1
}

# 2. Ensure .htaccess and directory index.html files are in dist
Write-Host "`n[2/5] Verifying .htaccess configuration and directory routing..." -ForegroundColor Yellow
if (Test-Path "$rootDir\public\.htaccess") {
    Copy-Item -Path "$rootDir\public\.htaccess" -Destination "$rootDir\dist\.htaccess" -Force
}
$allDirs = Get-ChildItem -Path "$rootDir\dist" -Recurse -Directory
foreach ($d in $allDirs) {
    $parent = $d.Parent.FullName
    $matchingHtml = Join-Path $parent "$($d.Name).html"
    if (Test-Path $matchingHtml) {
        Copy-Item -Path $matchingHtml -Destination (Join-Path $d.FullName "index.html") -Force
    }
}

# 3. Create zip package
Write-Host "`n[3/5] Compressing production artifacts into deploy.zip..." -ForegroundColor Yellow
$zipPath = "$rootDir\deploy.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Set-Location "$rootDir\dist"
Compress-Archive -Path * -DestinationPath $zipPath -CompressionLevel Optimal
$fileSize = (Get-Item $zipPath).Length
Write-Host "Package created: $([math]::Round($fileSize / 1MB, 2)) MB ($fileSize bytes)" -ForegroundColor Green

# 4. Request Hostinger TUS upload endpoint
Write-Host "`n[4/5] Authorizing with Hostinger API..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $ApiToken"
    "Content-Type"  = "application/json"
}

$body = @{
    username = $Username
    domain   = $Domain
} | ConvertTo-Json

$uploadInfo = Invoke-RestMethod -Uri "https://developers.hostinger.com/api/hosting/v1/files/upload-urls" -Headers $headers -Method Post -Body $body
$baseUrl = $uploadInfo.url
$authKey = $uploadInfo.auth_key
$restAuthKey = $uploadInfo.rest_auth_key

$targetUrl = "$baseUrl/deploy.zip?override=true"
Write-Host "Connected to Hostinger TUS endpoint." -ForegroundColor Green

Write-Host "Creating TUS session..." -ForegroundColor Yellow
& curl.exe -s -X POST "$targetUrl" `
    -H "X-Auth: $authKey" `
    -H "X-Auth-Rest: $restAuthKey" `
    -H "Tus-Resumable: 1.0.0" `
    -H "Upload-Length: $fileSize" `
    -H "Upload-Offset: 0" | Out-Null

Write-Host "Uploading package payload..." -ForegroundColor Yellow
& curl.exe -s -X PATCH "$targetUrl" `
    -H "X-Auth: $authKey" `
    -H "X-Auth-Rest: $restAuthKey" `
    -H "Tus-Resumable: 1.0.0" `
    -H "Content-Type: application/offset+octet-stream" `
    -H "Upload-Offset: 0" `
    --data-binary "@$zipPath" | Out-Null

Write-Host "Upload complete." -ForegroundColor Green

# 5. Trigger extraction & deployment on server
Write-Host "`n[5/5] Triggering server extraction & activation..." -ForegroundColor Yellow
$deployUrl = "https://developers.hostinger.com/api/hosting/v1/accounts/$Username/websites/$Domain/deploy"
$deployBody = @{
    archive_path = "deploy.zip"
} | ConvertTo-Json

$deployRes = Invoke-RestMethod -Uri $deployUrl -Headers $headers -Method Post -Body $deployBody
Write-Host "Hostinger deploy response: $($deployRes.message)" -ForegroundColor Green

# Cleanup local zip
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "  Deployment Successfully Completed!" -ForegroundColor Green
Write-Host "  Live: https://$Domain" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
