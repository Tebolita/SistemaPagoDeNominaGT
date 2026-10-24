#!/usr/bin/env bash
# Restaura la base de datos desde una copia de backups/. ¡Reemplaza los datos actuales!
# Uso: ./scripts/restore-bd.sh NominaGT_20261024_020000.bak
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
: "${MSSQL_SA_PASSWORD:?Falta MSSQL_SA_PASSWORD (.env)}"
[ $# -eq 1 ] || { echo "Uso: $0 <archivo.bak dentro de backups/>"; exit 1; }
DB="${DB_NAME:-NominaGT}"
read -r -p "Esto reemplazará la base $DB con $1. ¿Continuar? (escribe SI) " r
[ "$r" = "SI" ] || { echo "Cancelado"; exit 1; }
docker compose stop backend
docker compose exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" \
  -Q "ALTER DATABASE [$DB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE [$DB] FROM DISK = N'/var/opt/mssql/backup/$1' WITH REPLACE; ALTER DATABASE [$DB] SET MULTI_USER;"
docker compose start backend
echo "Restauración completada"
