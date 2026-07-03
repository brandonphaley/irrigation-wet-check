#requires -Version 5
# ============================================================
#  SSC Wet Check - tiny static web server (no install needed)
#  Serves the built app in .\dist over http://<this-pc>:PORT
#  Uses a raw TCP socket so it needs NO admin rights and is
#  reachable from your phone on the same Wi-Fi.
# ============================================================
param(
  [int]$Port = 5173,
  [string]$Root = (Join-Path $PSScriptRoot 'dist')
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Root)) {
  Write-Host ''
  Write-Host "Could not find the built app at:" -ForegroundColor Yellow
  Write-Host "  $Root"
  Write-Host "Please tell Claude the dist folder is missing."
  Write-Host ''
  Read-Host 'Press Enter to close'
  exit 1
}
$RootFull = (Resolve-Path $Root).Path.TrimEnd('\')

function Get-Mime([string]$ext) {
  switch ($ext.ToLower()) {
    '.html'        { 'text/html; charset=utf-8' }
    '.htm'         { 'text/html; charset=utf-8' }
    '.js'          { 'text/javascript; charset=utf-8' }
    '.mjs'         { 'text/javascript; charset=utf-8' }
    '.css'         { 'text/css; charset=utf-8' }
    '.json'        { 'application/json; charset=utf-8' }
    '.webmanifest' { 'application/manifest+json; charset=utf-8' }
    '.svg'         { 'image/svg+xml' }
    '.png'         { 'image/png' }
    '.jpg'         { 'image/jpeg' }
    '.jpeg'        { 'image/jpeg' }
    '.gif'         { 'image/gif' }
    '.ico'         { 'image/x-icon' }
    '.woff'        { 'font/woff' }
    '.woff2'       { 'font/woff2' }
    '.ttf'         { 'font/ttf' }
    '.map'         { 'application/json' }
    '.txt'         { 'text/plain; charset=utf-8' }
    default        { 'application/octet-stream' }
  }
}

# Find this PC's LAN IPv4 address (for the phone URL).
$lan = $null
try {
  $lan = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
    Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*' } |
    Sort-Object { $_.IPAddress -like '192.168.*' } -Descending |
    Select-Object -First 1).IPAddress
} catch { $lan = $null }

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
try {
  $listener.Start(100)
} catch {
  Write-Host ''
  Write-Host "Could not start on port $Port (something else may be using it)." -ForegroundColor Yellow
  Write-Host $_.Exception.Message
  Read-Host 'Press Enter to close'
  exit 1
}

Write-Host ''
Write-Host '  SSC Wet Check is running.' -ForegroundColor Green
Write-Host ''
Write-Host "  On this computer:  http://localhost:$Port/"
if ($lan) { Write-Host "  On your phone:     http://${lan}:$Port/   (same Wi-Fi)" }
Write-Host ''
Write-Host '  Keep this window open while using the app. Close it to stop.'
Write-Host ''

# Open the app in the default browser now that the server is listening.
try { Start-Process "http://localhost:$Port/" } catch {}

while ($true) {
  $client = $null
  try {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()
    $stream.ReadTimeout = 5000

    # --- read the request line + headers (we only need the path) ---
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII)
    $requestLine = $reader.ReadLine()
    if ([string]::IsNullOrWhiteSpace($requestLine)) { $client.Close(); continue }
    while ($true) { $h = $reader.ReadLine(); if ($null -eq $h -or $h -eq '') { break } }

    $parts = $requestLine -split ' '
    $urlPath = if ($parts.Count -ge 2) { $parts[1] } else { '/' }
    $urlPath = ($urlPath -split '\?')[0]
    $urlPath = [System.Uri]::UnescapeDataString($urlPath)
    if ($urlPath -eq '/' -or $urlPath -eq '') { $urlPath = '/index.html' }

    $rel = $urlPath.TrimStart('/').Replace('/', '\')
    $full = [System.IO.Path]::GetFullPath((Join-Path $RootFull $rel))

    $status = '200 OK'
    $bytes = $null
    $mime = 'application/octet-stream'

    if ($full.StartsWith($RootFull, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path $full -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $mime = Get-Mime ([System.IO.Path]::GetExtension($full))
    } else {
      $status = '404 Not Found'
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not found')
      $mime = 'text/plain; charset=utf-8'
    }

    $header = "HTTP/1.1 $status`r`n" +
              "Content-Type: $mime`r`n" +
              "Content-Length: $($bytes.Length)`r`n" +
              "Cache-Control: no-cache`r`n" +
              "Access-Control-Allow-Origin: *`r`n" +
              "Connection: close`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Flush()
  } catch {
    # ignore a single bad/slow connection and keep serving
  } finally {
    if ($client) { try { $client.Close() } catch {} }
  }
}
