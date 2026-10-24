// Suite de rendimiento del Sistema de Nómina GT (ISO/IEC 25010 – Eficiencia de desempeño).
//
// Un solo script con varios perfiles (variable TIPO):
//   humo         1 usuario, 1 min: verifica que todo responde y da la línea base
//   carga        usuarios esperados (VUS=20) durante DURACION (5m): comportamiento temporal normal
//   estres       escalones 20 → 50 → 100 → 150 usuarios: capacidad y punto de quiebre
//   picos        de 5 a 100 usuarios de golpe: recuperación ante picos
//   resistencia  VUS usuarios durante DURACION (30m): fugas de memoria / degradación en el tiempo
// Variables opcionales: VUS, DURACION (fase estable), RAMPA (subidas), PAUSA (s entre pantallas),
//   LOGINS_POR_SEGUNDO, UMBRAL_*_MS, SALIDA (carpeta de reportes; debe existir), MARCA
//   login        2 inicios de sesión por segundo: costo de bcrypt (requiere LOGIN_THROTTLE_LIMIT alto)
//
// Umbrales = requisitos no funcionales del proyecto (tests/selenium/tests/test_desempeno.py):
//   listados p95 <= 500 ms · login p95 <= 1500 ms · con concurrencia p95 <= 2000 ms · errores < 1 %
//
// Uso directo:  k6 run -e TIPO=carga -e BASE_URL=http://localhost:4000/api -e USUARIO=admin \
//                      -e CONTRASENA=... -e CLAVE=1234 tests/performance/k6-rendimiento.js
// (o con los scripts ejecutar.sh / ejecutar.ps1, que preparan todo y guardan los reportes)
import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Configuración ────────────────────────────────────────────────────
const BASE = (__ENV.BASE_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const TIPO = (__ENV.TIPO || 'humo').toLowerCase();
const VUS = Number(__ENV.VUS || 20);
const PAUSA_MAX = Number(__ENV.PAUSA || 3); // segundos de "tiempo de lectura" entre pantallas
const SALIDA = (__ENV.SALIDA || 'resultados').replace(/\/$/, '');
const MARCA = __ENV.MARCA || new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

const UMBRAL_LISTADO = Number(__ENV.UMBRAL_LISTADO_MS || 500);
const UMBRAL_LOGIN = Number(__ENV.UMBRAL_LOGIN_MS || 1500);
const UMBRAL_GLOBAL = Number(__ENV.UMBRAL_GLOBAL_MS || 2000);
const UMBRAL_PESADO = Number(__ENV.UMBRAL_PESADO_MS || 3000); // exportaciones Excel/PDF

// Endpoints de solo lectura (no ensucian la base). umbral en ms para p95.
const ENDPOINTS = {
  health: { ruta: '/health', umbral: 200 },
  resumen: { ruta: '/reporteria/resumen', umbral: UMBRAL_LISTADO },
  empleados: { ruta: '/empleado', umbral: UMBRAL_LISTADO },
  departamentos: { ruta: '/departamento', umbral: UMBRAL_LISTADO },
  puestos: { ruta: '/puesto', umbral: UMBRAL_LISTADO },
  jornadas: { ruta: '/jornada-laboral', umbral: UMBRAL_LISTADO },
  bancos: { ruta: '/banco', umbral: UMBRAL_LISTADO },
  nominas: { ruta: '/nomina', umbral: UMBRAL_LISTADO },
  estados_nomina: { ruta: '/estado-nomina', umbral: UMBRAL_LISTADO },
  parametros: { ruta: '/parametro-global', umbral: UMBRAL_LISTADO },
  cuentas: { ruta: '/cuenta-bancaria-empresa', umbral: UMBRAL_LISTADO },
  asistencias: { ruta: '/asistencia?page=1&limit=10', umbral: UMBRAL_LISTADO },
  ventas: { ruta: '/venta?page=1&limit=20', umbral: UMBRAL_LISTADO },
  clientes: { ruta: '/cliente', umbral: UMBRAL_LISTADO },
  rep_empleados: { ruta: '/reporteria/empleados', umbral: UMBRAL_LISTADO },
  rep_salarios: { ruta: '/reporteria/salarios', umbral: UMBRAL_LISTADO },
  rep_nomina: { ruta: '/reporteria/nomina', umbral: UMBRAL_LISTADO },
  export_excel: { ruta: '/reporteria/empleados/export/excel', umbral: UMBRAL_PESADO },
};

// Pantallas del sistema: cada una dispara en paralelo las peticiones que hace el frontend.
// peso = probabilidad relativa de que un usuario la abra.
const PANTALLAS = [
  { nombre: 'inicio', peso: 20, endpoints: ['resumen'] },
  { nombre: 'rrhh_empleados', peso: 20, endpoints: ['empleados', 'departamentos', 'puestos', 'jornadas', 'bancos'] },
  { nombre: 'nomina', peso: 20, endpoints: ['nominas', 'estados_nomina', 'parametros', 'cuentas'] },
  { nombre: 'asistencias', peso: 10, endpoints: ['asistencias'] },
  { nombre: 'ventas', peso: 10, endpoints: ['ventas', 'clientes'] },
  { nombre: 'reporteria', peso: 15, endpoints: ['rep_empleados', 'rep_salarios', 'rep_nomina'] },
  { nombre: 'exportacion', peso: 5, endpoints: ['export_excel'] },
];

// ── Métricas propias ─────────────────────────────────────────────────
const tiempos = {};
for (const nombre of Object.keys(ENDPOINTS)) tiempos[nombre] = new Trend(`t_${nombre}`, true);
const tLogin = new Trend('t_login', true);
const errores = new Rate('errores');
const limitadas = new Counter('respuestas_429');

// ── Perfiles de carga ────────────────────────────────────────────────
function duracion(defecto) {
  return __ENV.DURACION || defecto;
}
// Rampas de subida/bajada (RAMPA acorta todas, útil para ensayos rápidos)
function rampa(defecto) {
  return __ENV.RAMPA || defecto;
}

const PERFILES = {
  humo: { executor: 'constant-vus', vus: 1, duration: duracion('1m') },
  carga: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: rampa('1m'), target: VUS },
      { duration: duracion('5m'), target: VUS },
      { duration: rampa('30s'), target: 0 },
    ],
    gracefulRampDown: '10s',
  },
  estres: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: rampa('1m'), target: 20 },
      { duration: duracion('2m'), target: 20 },
      { duration: rampa('1m'), target: 50 },
      { duration: duracion('2m'), target: 50 },
      { duration: rampa('1m'), target: 100 },
      { duration: duracion('2m'), target: 100 },
      { duration: rampa('1m'), target: 150 },
      { duration: duracion('2m'), target: 150 },
      { duration: rampa('1m'), target: 0 },
    ],
    gracefulRampDown: '10s',
  },
  picos: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 5 },
      { duration: '10s', target: 100 }, // el pico
      { duration: duracion('1m'), target: 100 },
      { duration: '10s', target: 5 }, // ¿se recupera?
      { duration: '1m', target: 5 },
      { duration: '10s', target: 0 },
    ],
    gracefulRampDown: '10s',
  },
  resistencia: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: rampa('2m'), target: VUS },
      { duration: duracion('30m'), target: VUS }, // el JWT dura 60 min: no pasar de ~55m
      { duration: rampa('1m'), target: 0 },
    ],
    gracefulRampDown: '10s',
  },
  login: {
    executor: 'constant-arrival-rate',
    rate: Number(__ENV.LOGINS_POR_SEGUNDO || 2),
    timeUnit: '1s',
    duration: duracion('1m'),
    preAllocatedVUs: 10,
    maxVUs: 50,
    exec: 'escenarioLogin',
  },
};

if (!PERFILES[TIPO]) {
  throw new Error(`TIPO desconocido "${TIPO}". Usa: ${Object.keys(PERFILES).join(', ')}`);
}

// Umbrales: los de cada endpoint aplican solo a los perfiles que los usan
const umbrales = {
  errores: ['rate<0.01'],
  checks: ['rate>0.99'],
};
if (TIPO === 'login') {
  umbrales.t_login = [`p(95)<${UMBRAL_LOGIN}`];
} else {
  umbrales.http_req_duration = [`p(95)<${UMBRAL_GLOBAL}`];
  for (const [nombre, e] of Object.entries(ENDPOINTS)) umbrales[`t_${nombre}`] = [`p(95)<${e.umbral}`];
}

export const options = {
  scenarios: { [TIPO]: PERFILES[TIPO] },
  thresholds: umbrales,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
  setupTimeout: '60s',
  tags: { tipo: TIPO },
};

// ── Sesión ───────────────────────────────────────────────────────────
function iniciarSesion() {
  const r = http.post(
    `${BASE}/login/login`,
    JSON.stringify({ Username: __ENV.USUARIO, Contrasena: __ENV.CONTRASENA, Clave: Number(__ENV.CLAVE) }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } },
  );
  return r;
}

export function setup() {
  if (!__ENV.USUARIO || !__ENV.CONTRASENA || !__ENV.CLAVE) {
    fail('Faltan USUARIO, CONTRASENA o CLAVE (usa un usuario ADMINISTRADOR para cubrir todos los módulos)');
  }
  const salud = http.get(`${BASE}/health`);
  if (salud.status !== 200) fail(`La API no responde en ${BASE}/health (HTTP ${salud.status}). ¿Está levantada?`);

  const r = iniciarSesion();
  if (r.status === 429) fail('Login limitado (429): sube LOGIN_THROTTLE_LIMIT o espera a que venza el bloqueo');
  if (r.status !== 200) fail(`No se pudo iniciar sesión (HTTP ${r.status}): ${r.body}`);
  return { token: r.json('access_token') };
}

let tokenVu = null; // cada usuario virtual reutiliza el token; se renueva si expira (401)

function pedir(nombre, token) {
  const e = ENDPOINTS[nombre];
  return [
    'GET',
    `${BASE}${e.ruta}`,
    null,
    {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: nombre },
      responseType: nombre.startsWith('export') ? 'none' : 'text',
    },
  ];
}

function registrar(nombre, r) {
  tiempos[nombre].add(r.timings.duration);
  if (r.status === 429) limitadas.add(1);
  const ok = check(r, { [`${nombre} 200`]: (x) => x.status === 200 });
  errores.add(!ok);
}

function elegirPantalla() {
  const total = PANTALLAS.reduce((s, p) => s + p.peso, 0);
  let n = Math.random() * total;
  for (const p of PANTALLAS) {
    n -= p.peso;
    if (n <= 0) return p;
  }
  return PANTALLAS[0];
}

// ── Escenario por defecto: navegación de un usuario ──────────────────
export default function (datos) {
  tokenVu = tokenVu || datos.token;
  // En humo se recorren todas las pantallas en orden para medir cada endpoint
  const pantallas = TIPO === 'humo' ? PANTALLAS : [elegirPantalla()];

  for (const pantalla of pantallas) {
    let respuestas = http.batch(pantalla.endpoints.map((n) => pedir(n, tokenVu)));
    if (respuestas.some((r) => r.status === 401)) {
      const r = iniciarSesion();
      if (r.status === 200) {
        tokenVu = r.json('access_token');
        respuestas = http.batch(pantalla.endpoints.map((n) => pedir(n, tokenVu)));
      }
    }
    respuestas.forEach((r, i) => registrar(pantalla.endpoints[i], r));
    if (TIPO === 'humo') registrar('health', http.get(`${BASE}/health`, { tags: { name: 'health' } }));
    sleep(TIPO === 'humo' ? 0.5 : 1 + Math.random() * (PAUSA_MAX - 1));
  }
}

// ── Escenario de login ───────────────────────────────────────────────
export function escenarioLogin() {
  const r = iniciarSesion();
  tLogin.add(r.timings.duration);
  if (r.status === 429) limitadas.add(1);
  const ok = check(r, { 'login 200': (x) => x.status === 200 });
  errores.add(!ok);
}

// ── Reportes: consola, JSON y HTML ───────────────────────────────────
const ms = (v) => (v === undefined || v === null ? '-' : `${Math.round(v)}`);

function filas(data) {
  const nombres = TIPO === 'login' ? ['login'] : Object.keys(ENDPOINTS);
  return nombres
    .map((n) => {
      const m = data.metrics[`t_${n}`];
      if (!m || !m.values || !m.values.count) return null;
      const umbral = n === 'login' ? UMBRAL_LOGIN : ENDPOINTS[n].umbral;
      const cumple = m.thresholds ? Object.values(m.thresholds).every((t) => t.ok) : m.values['p(95)'] < umbral;
      return { n, v: m.values, umbral, cumple };
    })
    .filter(Boolean);
}

function resumenGeneral(data) {
  const M = data.metrics;
  const v = (k, s) => (M[k] && M[k].values ? M[k].values[s] : undefined);
  return {
    tipo: TIPO,
    fecha: new Date().toISOString(),
    baseUrl: BASE,
    duracionSeg: Math.round((data.state.testRunDurationMs || 0) / 1000),
    usuariosMax: v('vus_max', 'max') ?? v('vus_max', 'value'),
    peticiones: v('http_reqs', 'count'),
    peticionesPorSeg: v('http_reqs', 'rate'),
    p95Global: v('http_req_duration', 'p(95)'),
    tasaErrores: v('errores', 'rate'),
    respuestas429: v('respuestas_429', 'count') || 0,
    sinDatos: filas(data).length === 0,
    umbralesOk:
      filas(data).length > 0 &&
      Object.values(M).every((m) => !m.thresholds || Object.values(m.thresholds).every((t) => t.ok)),
  };
}

function veredicto(g) {
  if (g.sinDatos) return 'SIN DATOS: la prueba no llegó a medir (revisa la conexión o las credenciales)';
  return g.umbralesOk ? 'CUMPLE todos los umbrales' : 'NO CUMPLE uno o más umbrales';
}

function textoConsola(data) {
  const g = resumenGeneral(data);
  const pad = (s, n) => String(s).padEnd(n);
  const padL = (s, n) => String(s).padStart(n);
  let t = `\n=== Rendimiento: ${TIPO.toUpperCase()} · ${g.baseUrl} ===\n`;
  t += `Duración ${g.duracionSeg}s · ${g.peticiones ?? 0} peticiones (${(g.peticionesPorSeg || 0).toFixed(1)}/s)`;
  t += ` · p95 global ${ms(g.p95Global)} ms · errores ${((g.tasaErrores || 0) * 100).toFixed(2)} %\n\n`;
  t += `${pad('Endpoint', 16)}${padL('n', 7)}${padL('prom', 8)}${padL('p50', 8)}${padL('p90', 8)}${padL('p95', 8)}${padL('p99', 8)}${padL('máx', 8)}${padL('umbral', 9)}  Resultado\n`;
  for (const f of filas(data)) {
    t += `${pad(f.n, 16)}${padL(f.v.count, 7)}${padL(ms(f.v.avg), 8)}${padL(ms(f.v.med), 8)}${padL(ms(f.v['p(90)']), 8)}`;
    t += `${padL(ms(f.v['p(95)']), 8)}${padL(ms(f.v['p(99)']), 8)}${padL(ms(f.v.max), 8)}${padL(f.umbral, 9)}  ${f.cumple ? 'CUMPLE' : 'NO CUMPLE'}\n`;
  }
  if (g.respuestas429 > 0) {
    t += `\n⚠ ${g.respuestas429} respuestas 429: el límite de peticiones del backend cortó la prueba.\n`;
    t += `  Levanta el backend con THROTTLE_LIMIT=100000 (y LOGIN_THROTTLE_LIMIT alto para TIPO=login).\n`;
  }
  t += `\nVeredicto: ${veredicto(g)}\n`;
  return t;
}

function html(data) {
  const g = resumenGeneral(data);
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const fila = (f) =>
    `<tr class="${f.cumple ? 'ok' : 'ko'}"><td>${esc(f.n)}</td><td>${f.v.count}</td><td>${ms(f.v.avg)}</td>` +
    `<td>${ms(f.v.med)}</td><td>${ms(f.v['p(90)'])}</td><td><b>${ms(f.v['p(95)'])}</b></td><td>${ms(f.v['p(99)'])}</td>` +
    `<td>${ms(f.v.max)}</td><td>${f.umbral}</td><td>${f.cumple ? 'Cumple' : 'No cumple'}</td></tr>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rendimiento ${esc(TIPO)} – Nómina GT</title>
<style>
body{font-family:system-ui,sans-serif;margin:24px;color:#1f2328;background:#fff}h1{font-size:22px;margin:0 0 4px}
.sub{color:#59636e;margin-bottom:20px}.kpis{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px}
.kpi{border:1px solid #d1d9e0;border-radius:8px;padding:10px 14px;min-width:130px}.kpi b{display:block;font-size:20px}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{border-bottom:1px solid #d1d9e0;padding:6px 8px;text-align:right}
th:first-child,td:first-child{text-align:left}th{background:#f6f8fa}tr.ko td:last-child{color:#cf222e;font-weight:600}
tr.ok td:last-child{color:#1a7f37}.veredicto{font-size:16px;font-weight:600;margin:16px 0}.v-ok{color:#1a7f37}.v-ko{color:#cf222e}
</style></head><body>
<h1>Prueba de rendimiento: ${esc(TIPO)}</h1>
<div class="sub">${esc(g.fecha)} · ${esc(g.baseUrl)} · ISO/IEC 25010 – Eficiencia de desempeño</div>
<div class="kpis">
<div class="kpi">Duración<b>${g.duracionSeg} s</b></div>
<div class="kpi">Usuarios máx.<b>${g.usuariosMax ?? '-'}</b></div>
<div class="kpi">Peticiones<b>${g.peticiones ?? 0}</b></div>
<div class="kpi">Rendimiento<b>${(g.peticionesPorSeg || 0).toFixed(1)} req/s</b></div>
<div class="kpi">p95 global<b>${ms(g.p95Global)} ms</b></div>
<div class="kpi">Errores<b>${((g.tasaErrores || 0) * 100).toFixed(2)} %</b></div>
<div class="kpi">Respuestas 429<b>${g.respuestas429}</b></div>
</div>
<div class="veredicto ${g.umbralesOk ? 'v-ok' : 'v-ko'}">${veredicto(g)}</div>
<table><thead><tr><th>Endpoint</th><th>Peticiones</th><th>Prom. (ms)</th><th>p50</th><th>p90</th><th>p95</th><th>p99</th><th>Máx.</th><th>Umbral p95</th><th>Resultado</th></tr></thead>
<tbody>${filas(data).map(fila).join('')}</tbody></table>
<p class="sub">Umbrales: listados p95 ≤ ${UMBRAL_LISTADO} ms · login p95 ≤ ${UMBRAL_LOGIN} ms · global p95 ≤ ${UMBRAL_GLOBAL} ms · exportaciones p95 ≤ ${UMBRAL_PESADO} ms · errores &lt; 1 %.</p>
</body></html>`;
}

export function handleSummary(data) {
  const base = `${SALIDA}/${TIPO}-${MARCA}`;
  return {
    stdout: textoConsola(data),
    [`${base}.json`]: JSON.stringify({ resumen: resumenGeneral(data), endpoints: filas(data), k6: data }, null, 2),
    [`${base}.html`]: html(data),
  };
}
