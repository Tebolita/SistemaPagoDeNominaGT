#!/usr/bin/env bash
# Copia de seguridad completa de la base de datos (ISO 25010 – Fiabilidad: recuperabilidad).
# Uso: ./scripts/backup-bd.sh [dias_de_retencion=14]   (ejecutar desde la raíz del proyecto)
# Genera backups/<DB_NAME>_<fecha>.bak y borra las copias más antiguas que la retención.
# Programarlo con cron, p. ej.:  0 2 * * *  cd /ruta/al/proyecto && ./scripts/backup-bd.sh
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
: "${MSSQL_SA_PASSWORD:?Falta MSSQL_SA_PASSWORD (.env)}"
DB="${DB_NAME:-NominaGT}"
RETENCION="${1:-14}"
ARCHIVO="${DB}_$(date +%Y%m%d_%H%M%S).bak"

mkdir -p backups
docker compose exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" \
  -Q "BACKUP DATABASE [$DB] TO DISK = N'/var/opt/mssql/backup/$ARCHIVO' WITH INIT, CHECKSUM, COMPRESSION"
# Verifica que la copia sea legible antes de darla por buena
docker compose exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" \
  -Q "RESTORE VERIFYONLY FROM DISK = N'/var/opt/mssql/backup/$ARCHIVO' WITH CHECKSUM"
find backups -name "${DB}_*.bak" -mtime +"$RETENCION" -delete
echo "Copia creada: backups/$ARCHIVO"
