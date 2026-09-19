$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$cargoBin = Join-Path $env:USERPROFILE '.cargo\bin'
$env:Path = "$cargoBin;$env:Path"
$env:CARGO_TARGET_DIR = Join-Path $env:LOCALAPPDATA 'VCERevisionTracker\cargo-target'
$tauri = Join-Path $projectRoot 'node_modules\.bin\tauri.cmd'

Push-Location $projectRoot
try {
  & $tauri dev
  if ($LASTEXITCODE -ne 0) { throw "Tauri development session failed with exit code $LASTEXITCODE." }
}
finally {
  Pop-Location
}
