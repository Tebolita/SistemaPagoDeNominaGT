# Pruebas de rendimiento, carga, estrés, picos y resistencia con k6 (ISO/IEC 25010 – Eficiencia de desempeño).
#
# Uso (PowerShell, desde la raíz del proyecto):
#   .\tests\performance\ejecutar.ps1                    # humo (1 usuario, 1 min)
#   .\tests\performance\ejecutar.ps1 carga estres       # varios perfiles seguidos
#   .\tests\performance\ejecutar.ps1 todas              # humo, carga, estres, picos y login (~25 min)
#   $env:VUS=50; $env:DURACION="10m"; .\tests\performance\ejecutar.ps1 carga
#
# Antes: levantar el backend con THROTTLE_LIMIT=100000 y LOGIN_THROTTLE_LIMIT=1000.
# Reportes en tests\performance\resultados\ (HTML, JSON, dashboard de k6 y CSV de recursos si hay Docker).
param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Tipos = @('humo'))

$ErrorActionPreference = 'Stop'
$Dir = $PSScriptRoot
$Raiz = Resolve-Path (Join-Path $Dir '..\..')
$Validos = @('humo', 'carga', 'estres', 'picos', 'resistencia', 'login')
if (-not $Tipos -or $Tipos.Count -eq 0) { $Tipos = @('humo') }
if ($Tipos -contains 'todas') { $Tipos = @('humo', 'carga', 'estres', 'picos', 'login') }
foreach ($t in $Tipos) { if ($Validos -notcontains $t) { throw "Perfil desconocido: $t (usa: $($Validos -join ', '), todas)" } }

# Configuración: variables de entorno > .env.rendimiento > valores por defecto
$archivoEnv = Join-Path $Dir '.env.rendimiento'
if (Test-Path $archivoEnv) {
  foreach ($linea in Get-Content $archivoEnv) {
    if ($linea -match '^\s*([A-Z_]+)\s*=\s*([^#]*)') {
      $k = $Matches[1]; $v = $Matches[2].Trim()
      if (-not [Environment]::GetEnvironmentVariable($k)) { Set-Item -Path "env:$k" -Value $v }
    }
  }
}
if (-not $env:BASE_URL) { $env:BASE_URL = 'http://localhost:4000/api' }

if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
  Write-Host 'No se encontró k6. Instálalo con:  winget install k6 --source winget' -ForegroundColor Yellow
  Write-Host '  (o choco install k6). Más opciones: https://grafana.com/docs/k6/latest/set-up/install-k6/'
  exit 1
}

if (-not $env:USUARIO) { $env:USUARIO = Read-Host 'Usuario (ADMINISTRADOR)' }
if (-not $env:CONTRASENA) {
  $seguro = Read-Host 'Contraseña' -AsSecureString
  $env:CONTRASENA = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro))
}
if (-not $env:CLAVE) { $env:CLAVE = Read-Host 'Clave numérica' }

try { Invoke-RestMethod -Uri "$($env:BASE_URL)/health" -TimeoutSec 5 | Out-Null }
catch { Write-Host "La API no responde en $($env:BASE_URL)/health. Levanta el backend o ajusta BASE_URL." -ForegroundColor Red; exit 1 }

$Salida = Join-Path $Dir 'resultados'
New-Item -ItemType Directory -Force -Path $Salida | Out-Null
$Marca = Get-Date -Format 'yyyyMMdd-HHmmss'
$resumen = @()
$fallos = 0

foreach ($tipo in $Tipos) {
  Write-Host "`n▶ Perfil: $tipo" -ForegroundColor Cyan

  # Muestreo de CPU/memoria de los contenedores (utilización de recursos), si hay Docker Compose
  $monitor = $null
  if (Get-Command docker -ErrorAction SilentlyContinue) {
    Push-Location $Raiz
    $ids = (docker compose ps -q backend sqlserver 2>$null) -join ' '
    Pop-Location
    if ($ids) {
      $csv = Join-Path $Salida "recursos-$tipo-$Marca.csv"
      'fecha,contenedor,cpu,memoria' | Out-File -Encoding utf8 $csv
      $monitor = Start-Job -ArgumentList $ids, $csv -ScriptBlock {
        param($ids, $csv)
        while ($true) {
          $hora = Get-Date -Format 'HH:mm:ss'
          docker stats --no-stream --format '{{.Name}},{{.CPUPerc}},{{.MemUsage}}' $ids.Split(' ') |
            ForEach-Object { "$hora,$_" } | Add-Content -Encoding utf8 $csv
          Start-Sleep -Seconds 5
        }
      }
    }
  }

  $env:K6_WEB_DASHBOARD = 'true'
  $env:K6_WEB_DASHBOARD_OPEN = 'false'
  $env:K6_WEB_DASHBOARD_EXPORT = Join-Path $Salida "dashboard-$tipo-$Marca.html"
  & k6 run -q -e "TIPO=$tipo" -e "SALIDA=$Salida" -e "MARCA=$Marca" (Join-Path $Dir 'k6-rendimiento.js')
  $codigo = $LASTEXITCODE
  if ($monitor) { Stop-Job $monitor; Remove-Job $monitor }

  switch ($codigo) {
    0 { $resultado = 'CUMPLE' }
    99 { $resultado = 'NO CUMPLE (umbrales superados)'; $fallos++ }
    default { $resultado = "ERROR (k6 terminó con código $codigo)"; $fallos++ }
  }
  $resumen += [pscustomobject]@{ Perfil = $tipo; Resultado = $resultado }
}

# Reporte al estilo JMeter (gráficas y estadísticas) de las corridas recién hechas
if (Get-Command node -ErrorAction SilentlyContinue) {
  & node (Join-Path $Dir 'generar-reporte.mjs') $Salida --marca $Marca | Out-Null
  Write-Host "Reporte con gráficas: $(Join-Path $Salida 'reporte-indice.html')"
}

Write-Host "`n════════ Resumen ($Marca) ════════" -ForegroundColor Cyan
$resumen | Format-Table -AutoSize
Write-Host "Reportes en: $Salida"
Get-ChildItem $Salida -Filter "*$Marca*" | ForEach-Object { "  $($_.Name)" }
exit $fallos
