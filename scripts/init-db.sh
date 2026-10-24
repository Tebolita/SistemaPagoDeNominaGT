#!/usr/bin/env bash
# Inicializa la base de datos del entorno Docker en un solo paso (ISO 25010 – Portabilidad: instalabilidad).
#   1) crea la base si no existe          2) aplica el esquema con Prisma (fuente de verdad: schema.prisma)
#   3) carga los datos mínimos (roles, estados, parámetros, indicadores y un administrador)
#   4) aplica las migraciones migracion_*.sql (todas idempotentes)
# Nota: database_extension.sql es el script histórico (crea la base "PagoPlanilla" con un esquema
#       anterior); no se usa aquí porque choca con el esquema actual de Prisma.
#
# Uso (desde la raíz, con .env completo, incluidos ADMIN_USER, ADMIN_PASSWORD y ADMIN_CLAVE):
#   ./scripts/init-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
: "${MSSQL_SA_PASSWORD:?Falta MSSQL_SA_PASSWORD (.env)}"
: "${ADMIN_PASSWORD:?Falta ADMIN_PASSWORD (.env): contraseña del administrador inicial}"
: "${ADMIN_CLAVE:?Falta ADMIN_CLAVE (.env): clave numérica del administrador inicial}"
DB="${DB_NAME:-NominaGT}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@empresa.com}"
SQLCMD=(docker compose exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -b)

# Copia un .sql al contenedor y lo ejecuta en la base (más fiable que leer de stdin)
correr_sql() {
  local archivo="$1"; shift
  docker compose cp "$archivo" "sqlserver:/tmp/$(basename "$archivo")" >/dev/null
  "${SQLCMD[@]}" -d "$DB" -i "/tmp/$(basename "$archivo")" "$@"
}

docker compose up -d sqlserver
echo "Esperando a SQL Server..."
until "${SQLCMD[@]}" -Q "SELECT 1" >/dev/null 2>&1; do sleep 3; done

echo "1/4 Creando la base $DB si no existe"
"${SQLCMD[@]}" -Q "IF DB_ID('$DB') IS NULL CREATE DATABASE [$DB]"

echo "2/4 Aplicando el esquema con Prisma"
docker compose --profile init build db-esquema >/dev/null
docker compose --profile init run --rm db-esquema

echo "3/4 Datos iniciales"
# Hash bcrypt (12 rondas, igual que el backend) calculado dentro del contenedor; valida la política
HASHES=$(docker compose --profile init run --rm --no-deps \
  -e ADMIN_PASSWORD="$ADMIN_PASSWORD" -e ADMIN_CLAVE="$ADMIN_CLAVE" db-esquema node -e '
    const b = require("bcryptjs");
    const p = process.env.ADMIN_PASSWORD, c = process.env.ADMIN_CLAVE;
    const ok = p.length >= 8 && p.length <= 72 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(p);
    if (!ok) { console.error("ADMIN_PASSWORD no cumple la política (8-72, mayúscula, minúscula, número y símbolo)"); process.exit(1); }
    if (!/^\d+$/.test(c)) { console.error("ADMIN_CLAVE debe ser numérica"); process.exit(1); }
    console.log(b.hashSync(p, 12) + " " + b.hashSync(c, 12));
  ' | tail -1)
ADMIN_HASH="${HASHES%% *}"
CLAVE_HASH="${HASHES##* }"
correr_sql scripts/sql/seed_inicial.sql \
  -v ADMIN_USER="$ADMIN_USER" ADMIN_HASH="$ADMIN_HASH" CLAVE_HASH="$CLAVE_HASH" ADMIN_EMAIL="$ADMIN_EMAIL"

echo "4/4 Migraciones"
for f in migracion_*.sql; do echo "    $f"; correr_sql "$f"; done

echo "Listo. Levanta el sistema con: docker compose up -d --build  →  http://localhost:8080"
