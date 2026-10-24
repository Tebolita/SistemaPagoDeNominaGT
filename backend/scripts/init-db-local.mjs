#!/usr/bin/env node
// Inicializa la base de datos en un SQL Server que ya está corriendo (sin docker compose).
//   1) prisma db push: crea la base si no existe y aplica el esquema (fuente de verdad: schema.prisma)
//   2) datos mínimos: roles, estados de nómina, parámetros, indicadores y un administrador
//   3) migraciones migracion_*.sql de la raíz (todas idempotentes)
// Lee DATABASE_URL de backend/.env. Se puede repetir sin duplicar datos.
//
// Uso (desde backend/):  npm run db:init
// Variables opcionales:  ADMIN_USER, ADMIN_PASSWORD, ADMIN_CLAVE, ADMIN_EMAIL (si faltan, las pregunta)
import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

const BACKEND = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = join(BACKEND, '..');
const SEED = join(RAIZ, 'scripts', 'sql', 'seed_inicial.sql');
const SIMULAR = process.env.DRY_RUN === '1';
const TMP = mkdtempSync(join(tmpdir(), 'nomina-db-'));
const POLITICA = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;

function salir(mensaje) {
  console.error(`\n✖ ${mensaje}`);
  process.exit(1);
}

function preguntar(texto, { oculto = false, defecto } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (oculto) {
      rl._writeToOutput = (s) => {
        if (s.includes(texto)) rl.output.write(s);
        else if (!s.includes('\n')) rl.output.write('*');
      };
    }
    rl.question(`${texto}${defecto ? ` [${defecto}]` : ''}: `, (r) => {
      rl.close();
      if (oculto) process.stdout.write('\n');
      resolve(r.trim() || defecto || '');
    });
  });
}

function prisma(args) {
  console.log(`  $ npx prisma ${args.join(' ')}`);
  if (SIMULAR) return;
  execFileSync('npx', ['prisma', ...args], { cwd: BACKEND, stdio: 'inherit', shell: process.platform === 'win32' });
}

/** Ejecuta un script SQL; los separadores GO de sqlcmd se envían como lotes separados. */
function ejecutarSql(nombre, sql) {
  const lotes = sql.split(/^\s*GO\s*$/im).map((l) => l.trim()).filter(Boolean);
  lotes.forEach((lote, i) => {
    const archivo = join(TMP, `${nombre.replace(/\W+/g, '_')}_${i + 1}.sql`);
    writeFileSync(archivo, lote);
    prisma(['db', 'execute', '--file', archivo]);
  });
}

const sqlTexto = (v) => String(v).replace(/'/g, "''");

async function main() {
  const url = process.env.DATABASE_URL || '';
  if (!url || /CAMBIAR|servidor;|usuario_app/i.test(url)) {
    salir('Completa DATABASE_URL en backend/.env con los datos de tu SQL Server');
  }
  const base = /database=([^;]+)/i.exec(url)?.[1] ?? '(sin nombre)';
  const servidor = /^sqlserver:\/\/([^;]+)/i.exec(url)?.[1] ?? '?';
  console.log(`Base de datos: ${base} en ${servidor}${SIMULAR ? '  (simulación: no se ejecuta nada)' : ''}\n`);

  const usuario = process.env.ADMIN_USER || (await preguntar('Usuario administrador', { defecto: 'admin' }));
  let contrasena = process.env.ADMIN_PASSWORD;
  while (!contrasena || contrasena.length < 8 || contrasena.length > 72 || !POLITICA.test(contrasena)) {
    if (contrasena) console.log('  Debe tener 8-72 caracteres, con mayúscula, minúscula, número y símbolo.');
    contrasena = await preguntar('Contraseña del administrador', { oculto: true });
  }
  let clave = process.env.ADMIN_CLAVE;
  while (!/^\d{4,}$/.test(clave || '')) {
    if (clave) console.log('  La clave debe ser numérica (mínimo 4 dígitos).');
    clave = await preguntar('Clave numérica del administrador (segundo factor del login)');
  }
  const correo = process.env.ADMIN_EMAIL || (await preguntar('Correo del administrador', { defecto: 'admin@empresa.com' }));

  console.log('\n1/3 Esquema (crea la base si no existe)');
  prisma(['db', 'push']);

  console.log('\n2/3 Datos iniciales');
  const seed = readFileSync(SEED, 'utf8')
    .replaceAll('$(ADMIN_USER)', sqlTexto(usuario))
    .replaceAll('$(ADMIN_HASH)', bcrypt.hashSync(contrasena, 12))
    .replaceAll('$(CLAVE_HASH)', bcrypt.hashSync(clave, 12))
    .replaceAll('$(ADMIN_EMAIL)', sqlTexto(correo));
  ejecutarSql('seed_inicial', seed);

  console.log('\n3/3 Migraciones');
  const migraciones = readdirSync(RAIZ).filter((f) => /^migracion_.*\.sql$/.test(f)).sort();
  for (const m of migraciones) {
    console.log(`  · ${m}`);
    ejecutarSql(m, readFileSync(join(RAIZ, m), 'utf8'));
  }

  console.log(`\n✔ Listo. Si la base no tenía usuarios, ya puedes entrar con "${usuario}" y la clave indicada.`);
  if (SIMULAR) console.log(`  (SQL generado para revisar en ${TMP})`);
}

main().catch((e) => salir(e.message));
