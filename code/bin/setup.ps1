# setup.ps1 — Adds the lcdev CLI to your PATH on Windows (PowerShell).
# Safe to run multiple times (idempotent).

$BinDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if already in PATH
if ($env:PATH -split ';' | Where-Object { $_ -eq $BinDir }) {
    Write-Host "✓ lcdev is already in your PATH." -ForegroundColor Green
    Write-Host "  Try: lcdev --help"
    exit 0
}

# Add to current session
$env:PATH = "$BinDir;$env:PATH"

# Add to user PATH permanently (persists across sessions)
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -split ';' | Where-Object { $_ -eq $BinDir }) {
    Write-Host "✓ PATH entry already exists in user environment." -ForegroundColor Green
} else {
    [Environment]::SetEnvironmentVariable("PATH", "$BinDir;$currentPath", "User")
    Write-Host "✓ Added to user PATH:" -ForegroundColor Green
    Write-Host "  $BinDir"
}

Write-Host ""

# Verify
if (Get-Command lcdev -ErrorAction SilentlyContinue) {
    Write-Host "✓ lcdev is ready! Try: lcdev --help" -ForegroundColor Green
} else {
    Write-Host "→ Restart your terminal to use 'lcdev' directly." -ForegroundColor Yellow
}
