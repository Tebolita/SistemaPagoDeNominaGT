#!/usr/bin/env bash
# Pruebas de rendimiento, carga, estrés, picos y resistencia con k6 (ISO/IEC 25010 – Eficiencia de desempeño).
#
# Uso:  ./tests/performance/ejecutar.sh [humo|carga|estres|picos|resistencia|login|todas] ...
#   ./tests/performance/ejecutar.sh               → humo (1 usuario, 1 min)
#   ./tests/performance/ejecutar.sh carga estres  → varios perfiles seguidos
#   ./tests/performance/ejecutar.sh todas         → humo, carga, estres, picos y login (~25 min)
#   VUS=50 DURACION=10m ./tests/performance/ejecutar.sh carga
#
# Antes: levantar el backend con límites altos para que el rate limiting no corte la prueba:
#   THROTTLE_LIMIT=100000 LOGIN_THROTTLE_LIMIT=1000 npm run start:prod    (o en el .env de Docker)
#
# Deja en tests/performance/resultados/: <tipo>-<fecha>.html y .json (resumen por endpoint),
# dashboard-<tipo>-<fecha>.html (gráficas de k6), reporte-<tipo>-<fecha>.html (estilo JMeter, con
# reporte-indice.html para todas las corridas) y recursos-<tipo>-<fecha>.csv (CPU/RAM si hay Docker).
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
RAIZ="$(cd "$DIR/../.." && pwd)"
PERFILES_VALIDOS="humo carga estres picos resistencia login"

TIPOS="${*:-humo}"
[ "$TIPOS" = "todas" ] && TIPOS="humo carga estres picos login"
for t in $TIPOS; do
  [[ " $PERFILES_VALIDOS " == *" $t "* ]] || { echo "Perfil desconocido: $t (usa: $PERFILES_VALIDOS todas)"; exit 2; }
done

# Configuración: variables de entorno > .env.rendimiento > valores por defecto
if [ -f "$DIR/.env.rendimiento" ]; then
  while IFS='=' read -r k v; do
    [[ -z "$k" || "$k" == \#* ]] && continue
    v="${v%%#*}"; v="$(echo "$v" | xargs)"
    [ -z "${!k:-}" ] && export "$k=$v"
  done < "$DIR/.env.rendimiento"
fi
export BASE_URL="${BASE_URL:-http://localhost:4000/api}"

if ! command -v k6 >/dev/null 2>&1; then
  echo "No se encontró k6. Instálalo:"
  echo "  macOS:   brew install k6"
  echo "  Linux:   https://grafana.com/docs/k6/latest/set-up/install-k6/"
  echo "  Windows: winget install k6 --source winget   (y usa ejecutar.ps1)"
  exit 1
fi

[ -z "${USUARIO:-}" ] && read -r -p "Usuario (ADMINISTRADOR): " USUARIO
[ -z "${CONTRASENA:-}" ] && { read -r -s -p "Contraseña: " CONTRASENA; echo; }
[ -z "${CLAVE:-}" ] && read -r -p "Clave numérica: " CLAVE
export USUARIO CONTRASENA CLAVE

if ! curl -fsS --max-time 5 "$BASE_URL/health" >/dev/null; then
  echo "La API no responde en $BASE_URL/health. Levanta el backend (o ajusta BASE_URL) y vuelve a intentar."
  exit 1
fi

SALIDA="$DIR/resultados"
mkdir -p "$SALIDA"
MARCA="$(date +%Y%m%d-%H%M%S)"
declare -a RESUMEN=()
FALLOS=0

# Muestreo de CPU y memoria de los contenedores (utilización de recursos), si hay Docker Compose
iniciar_monitor() {
  local csv="$1"
  command -v docker >/dev/null 2>&1 || return 0
  local ids
  ids="$(cd "$RAIZ" && docker compose ps -q backend sqlserver 2>/dev/null | xargs)"
  [ -z "$ids" ] && return 0
  echo "fecha,contenedor,cpu,memoria" > "$csv"
  ( while true; do
      docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}" $ids 2>/dev/null \
        | sed "s/^/$(date +%H:%M:%S),/" >> "$csv"
      sleep 5
    done ) &
  MONITOR=$!
}

for TIPO in $TIPOS; do
  echo; echo "▶ Perfil: $TIPO"
  MONITOR=""
  iniciar_monitor "$SALIDA/recursos-$TIPO-$MARCA.csv"
  K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_OPEN=false \
  K6_WEB_DASHBOARD_EXPORT="$SALIDA/dashboard-$TIPO-$MARCA.html" \
    k6 run -q -e TIPO="$TIPO" -e SALIDA="$SALIDA" -e MARCA="$MARCA" "$DIR/k6-rendimiento.js"
  CODIGO=$?
  [ -n "$MONITOR" ] && kill "$MONITOR" 2>/dev/null
  case $CODIGO in
    0) RESULTADO="CUMPLE" ;;
    99) RESULTADO="NO CUMPLE (umbrales superados)"; FALLOS=$((FALLOS + 1)) ;;
    *) RESULTADO="ERROR (k6 terminó con código $CODIGO)"; FALLOS=$((FALLOS + 1)) ;;
  esac
  RESUMEN+=("$(printf '%-12s %s' "$TIPO" "$RESULTADO")")
done

# Reporte al estilo JMeter (gráficas y estadísticas) de las corridas recién hechas
if command -v node >/dev/null 2>&1; then
  node "$DIR/generar-reporte.mjs" "$SALIDA" --marca "$MARCA" >/dev/null && \
    echo "Reporte con gráficas: $SALIDA/reporte-indice.html"
fi

echo; echo "════════ Resumen ($MARCA) ════════"
printf '%s\n' "${RESUMEN[@]}"
echo "Reportes en: $SALIDA"
ls -1 "$SALIDA" | grep "$MARCA" | sed 's/^/  /'
exit $FALLOS
