$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$cargoBin = Join-Path $env:USERPROFILE '.cargo\bin'
$env:Path = "$cargoBin;$env:Path"
$env:CARGO_TARGET_DIR = Join-Path $env:LOCALAPPDATA 'VCERevisionTracker\cargo-target'
$tauri = Join-Path $projectRoot 'node_modules\.bin\tauri.cmd'
$outputDir = Join-Path $projectRoot 'desktop-build'

Push-Location $projectRoot
try {
  & $tauri build --bundles nsis
  if ($LASTEXITCODE -ne 0) { throw "Tauri build failed with exit code $LASTEXITCODE." }
}
finally {
  Pop-Location
}

$releaseDir = Join-Path $env:CARGO_TARGET_DIR 'release'
$appExe = Join-Path $releaseDir 'vce-revision-tracker.exe'
$installer = Get-ChildItem -LiteralPath (Join-Path $releaseDir 'bundle\nsis') -Filter '*-setup.exe' -File |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not (Test-Path -LiteralPath $appExe)) { throw "Built application not found at $appExe." }
if (-not $installer) { throw 'Built NSIS installer was not found.' }

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
$portableOutput = Join-Path $outputDir 'VCE Revision Tracker.exe'
$installerOutput = Join-Path $outputDir 'VCE Revision Tracker Setup.exe'
$checksumsOutput = Join-Path $outputDir 'SHA256SUMS.txt'
Copy-Item -LiteralPath $appExe -Destination $portableOutput -Force
Copy-Item -LiteralPath $installer.FullName -Destination $installerOutput -Force

function Get-Sha256Hex([string]$path) {
  $stream = [System.IO.File]::OpenRead($path)
  $sha256 = [System.Security.Cryptography.SHA256]::Create()
  try {
    return -join ($sha256.ComputeHash($stream) | ForEach-Object { $_.ToString('x2') })
  }
  finally {
    $sha256.Dispose()
    $stream.Dispose()
  }
}

$checksumLines = @($portableOutput, $installerOutput) | ForEach-Object {
  $hash = Get-Sha256Hex $_
  "$hash  $([System.IO.Path]::GetFileName($_))"
}
Set-Content -LiteralPath $checksumsOutput -Value $checksumLines -Encoding ascii

Write-Output "Desktop application: $portableOutput"
Write-Output "Windows installer: $installerOutput"
Write-Output "SHA-256 checksums: $checksumsOutput"
