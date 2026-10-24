# Compatibilidad (ISO/IEC 25010): ejecuta la suite funcional en Chrome, Edge y Firefox
# y deja un reporte por navegador en results/compatibilidad_<navegador>.html.
#
# Uso (desde tests/selenium, con el entorno virtual activado y backend/frontend levantados):
#   $env:NOMINA_USER = "..."; $env:NOMINA_PASSWORD = "..."; $env:NOMINA_CLAVE = "..."
#   .\ejecutar_compatibilidad.ps1                 # los tres navegadores
#   .\ejecutar_compatibilidad.ps1 -Navegadores edge,firefox
param(
    [string[]]$Navegadores = @('chrome', 'edge', 'firefox'),
    # Las suites no funcionales se miden por separado; aquí solo interesa el comportamiento
    [string]$Filtro = 'not desempeno and not accesibilidad'
)

$resumen = @()
foreach ($nav in $Navegadores) {
    Write-Host "`n=== $nav ===" -ForegroundColor Cyan
    $env:BROWSER = $nav
    $env:HEADLESS = '1'
    $reporte = "results/compatibilidad_$nav.html"
    $salida = python -m pytest -m $Filtro --html=$reporte --self-contained-html -q -p no:cacheprovider 2>&1
    $final = ($salida | Select-String -Pattern '(passed|failed|error)' | Select-Object -Last 1).Line
    Write-Host $final
    $resumen += [pscustomobject]@{ Navegador = $nav; Resultado = $final; Reporte = $reporte }
}

Write-Host "`n=== Resumen de compatibilidad ===" -ForegroundColor Cyan
$resumen | Format-Table -AutoSize
