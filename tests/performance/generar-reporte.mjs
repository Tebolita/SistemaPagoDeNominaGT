#!/usr/bin/env node
// Genera un reporte HTML al estilo del "Dashboard Report" de Apache JMeter a partir de los
// resultados de k6 (resumen <perfil>-<fecha>.json + dashboard-<perfil>-<fecha>.html).
//
// Uso:  node tests/performance/generar-reporte.mjs [carpeta-resultados] [--marca 20261023-234744]
//   Sin --marca procesa todas las corridas de la carpeta. Deja reporte-<perfil>-<fecha>.html por
//   corrida y reporte-indice.html con todas. Funciona sin internet (Chart.js va incrustado).
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const DIR = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const iMarca = args.indexOf('--marca');
const MARCA = iMarca >= 0 ? args[iMarca + 1] : null;
const CARPETA = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--marca') || join(DIR, 'resultados');
const CHARTJS = readFileSync(join(DIR, 'vendor', 'chart.umd.min.js'), 'utf8');

// APDEX con los mismos valores por defecto que JMeter: satisfecho ≤ 500 ms, tolerable ≤ 1500 ms
const APDEX_T = Number(process.env.APDEX_T_MS || 500);
const APDEX_F = Number(process.env.APDEX_F_MS || 1500);

const NOMBRES = {
  health: 'Salud de la API', resumen: 'Tablero de inicio', empleados: 'Lista de empleados',
  departamentos: 'Departamentos', puestos: 'Puestos', jornadas: 'Jornadas laborales', bancos: 'Bancos',
  nominas: 'Lista de nóminas', estados_nomina: 'Estados de nómina', parametros: 'Parámetros globales',
  cuentas: 'Cuentas bancarias', asistencias: 'Asistencias', ventas: 'Ventas', clientes: 'Clientes',
  rep_empleados: 'Reporte de empleados', rep_salarios: 'Reporte de salarios', rep_nomina: 'Reporte de nómina',
  export_excel: 'Exportación a Excel', login: 'Inicio de sesión',
};
const PERFILES = {
  humo: 'Humo (1 usuario)', carga: 'Carga', estres: 'Estrés', picos: 'Picos', resistencia: 'Resistencia', login: 'Login',
};

// ── Lectura de datos ─────────────────────────────────────────────────
/** Decodifica el dashboard exportado por k6: NDJSON comprimido con gzip y en base64. */
function leerDashboard(archivo) {
  const html = readFileSync(archivo, 'utf8');
  const m = /<script id="data"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) return null;
  const lineas = gunzipSync(Buffer.from(m[1].trim(), 'base64')).toString('utf8').split('\n').filter(Boolean);
  const nombres = new Set();
  let inicio = null;
  const periodos = [];
  for (const linea of lineas) {
    const ev = JSON.parse(linea);
    if (ev.event === 'metric') Object.keys(ev.data).forEach((k) => nombres.add(k));
    if (ev.event === 'start') inicio = ev.data[0][0];
    if (ev.event === 'snapshot') {
      // Cada instantánea trae los valores en el orden alfabético de las métricas registradas
      const claves = [...nombres].sort();
      if (claves.length !== ev.data.length) continue;
      const fila = {};
      claves.forEach((k, i) => (fila[k] = ev.data[i]));
      periodos.push(fila);
    }
  }
  return { inicio, periodos };
}

const TREND = ['avg', 'max', 'med', 'min', 'p90', 'p95', 'p99']; // orden de agregados de k6
const tv = (fila, metrica, agg) => {
  const v = fila[metrica];
  return v ? v[TREND.indexOf(agg)] : null;
};

/** Fracción estimada de muestras ≤ x interpolando entre los percentiles conocidos. */
function fraccionHasta(v, x) {
  const pts = [[v.min, 0], [v.med, 0.5], [v['p(90)'], 0.9], [v['p(95)'], 0.95], [v['p(99)'], 0.99], [v.max, 1]];
  if (x >= v.max) return 1;
  if (x < v.min) return 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (x <= x1) return x1 === x0 ? y1 : y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 1;
}
function apdex(v) {
  const sat = fraccionHasta(v, APDEX_T);
  const tol = fraccionHasta(v, APDEX_F) - sat;
  return { valor: sat + tol / 2, exacto: v.max <= APDEX_T || v.min > APDEX_F };
}
const calificarApdex = (a) =>
  a >= 0.94 ? 'Excelente' : a >= 0.85 ? 'Bueno' : a >= 0.7 ? 'Aceptable' : a >= 0.5 ? 'Pobre' : 'Inaceptable';

// ── Utilidades de formato ────────────────────────────────────────────
const f1 = (n) => (n === null || n === undefined || Number.isNaN(n) ? '–' : Number(n).toFixed(2));
const f0 = (n) => (n === null || n === undefined ? '–' : Math.round(n).toLocaleString('es-GT'));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fecha = (ms) =>
  new Date(ms).toLocaleString('es-GT', {
    timeZone: process.env.TZ_REPORTE || 'America/Guatemala', dateStyle: 'medium', timeStyle: 'medium',
  });
const mmss = (s) => {
  const t = Math.round(s);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
const PALETA = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#ea580c',
  '#4f46e5', '#0d9488', '#9333ea', '#ca8a04', '#be123c', '#0284c7', '#15803d', '#a16207', '#6d28d9', '#475569'];

// ── Construcción de un reporte ───────────────────────────────────────
function construir(resumenJson, dashboard, archivoJson) {
  const { resumen, endpoints, k6 } = resumenJson;
  const M = k6.metrics;
  const duracion = (k6.state.testRunDurationMs || 0) / 1000;
  const checks = k6.root_group?.checks || [];
  const kos = Object.fromEntries(checks.map((c) => [c.name.replace(/ 200$/, ''), { ok: c.passes, ko: c.fails }]));
  const periodos = dashboard?.periodos || [];
  const t0 = dashboard?.inicio || Date.parse(resumen.fecha) - duracion * 1000;
  const etiquetas = periodos.map((p) => mmss(((p.time?.[0] ?? t0) - t0) / 1000));

  // Estadísticas por endpoint (columnas de JMeter)
  const filas = endpoints.map((e) => {
    const ko = kos[e.n]?.ko ?? 0;
    return { ...e, ko, err: e.v.count ? (ko / e.v.count) * 100 : 0, tps: e.v.count / duracion, apdex: apdex(e.v) };
  });
  const totReq = M.http_reqs?.values.count ?? 0;
  const totKo = Math.round((M.http_req_failed?.values.rate ?? 0) * totReq);
  const dur = M.http_req_duration?.values ?? {};
  const totApdex = dur.count ? apdex(dur) : { valor: 1, exacto: true };
  const recibidoKBs = (M.data_received?.values.rate ?? 0) / 1024;
  const enviadoKBs = (M.data_sent?.values.rate ?? 0) / 1024;
  const r429 = resumen.respuestas429 || 0;

  // Series en el tiempo (periodos de 10 s del dashboard de k6)
  const serieEndpoints = filas.map((f, i) => ({
    label: NOMBRES[f.n] || f.n,
    data: periodos.map((p) => tv(p, `t_${f.n}`, 'avg')),
    borderColor: PALETA[i % PALETA.length], backgroundColor: PALETA[i % PALETA.length], spanGaps: true,
  }));
  const pct = (agg, label, color) => ({
    label, data: periodos.map((p) => tv(p, 'http_req_duration', agg)), borderColor: color, backgroundColor: color,
  });
  const vus = periodos.map((p) => p.vus?.[0] ?? null);
  const reqRate = periodos.map((p) => p.http_reqs?.[1] ?? 0);
  const failRate = periodos.map((p) => p.http_req_failed?.[0] ?? 0);
  const iterRate = periodos.map((p) => p.iterations?.[1] ?? 0);

  // El primer periodo incluye el inicio de sesión inicial (~450 ms, bcrypt) y aplasta la escala:
  // si supera 3 veces al resto, el eje se limita y el pico se indica en la descripción.
  const topeSinPrimero = (series) => {
    const resto = series.flatMap((d) => d.slice(1)).filter((v) => typeof v === 'number');
    const primero = Math.max(0, ...series.map((d) => d[0] ?? 0));
    const max = Math.max(0, ...resto);
    return resto.length && primero > max * 3 ? Math.ceil((max * 1.3) / 5) * 5 : undefined;
  };
  const graficas = {
    tiemposEnTiempo: { type: 'line', y: 'Tiempo de respuesta promedio (ms)', data: { labels: etiquetas, datasets: serieEndpoints } },
    percentilesEnTiempo: {
      type: 'line', y: 'ms',
      yMax: topeSinPrimero(['med', 'p90', 'p95', 'p99'].map((a) => periodos.map((p) => tv(p, 'http_req_duration', a)))),
      data: { labels: etiquetas, datasets: [
        pct('med', 'p50 (mediana)', '#16a34a'), pct('p90', 'p90', '#d97706'), pct('p95', 'p95', '#dc2626'), pct('p99', 'p99', '#7c3aed'),
      ] },
    },
    usuarios: {
      type: 'line', y: 'Usuarios virtuales activos',
      data: { labels: etiquetas, datasets: [
        { label: 'Usuarios activos', data: vus, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.15)', fill: true, stepped: true },
      ] },
    },
    bytes: {
      type: 'line', y: 'KB/s',
      data: { labels: etiquetas, datasets: [
        { label: 'Recibidos', data: periodos.map((p) => (p.data_received?.[1] ?? 0) / 1024), borderColor: '#2563eb', backgroundColor: '#2563eb' },
        { label: 'Enviados', data: periodos.map((p) => (p.data_sent?.[1] ?? 0) / 1024), borderColor: '#16a34a', backgroundColor: '#16a34a' },
      ] },
    },
    latencias: {
      type: 'line', y: 'ms',
      yMax: topeSinPrimero([periodos.map((p) => tv(p, 'http_req_waiting', 'avg')), periodos.map((p) => tv(p, 'http_req_duration', 'avg'))]),
      data: { labels: etiquetas, datasets: [
        { label: 'Latencia (espera del primer byte)', data: periodos.map((p) => tv(p, 'http_req_waiting', 'avg')), borderColor: '#d97706', backgroundColor: '#d97706' },
        { label: 'Tiempo de respuesta total', data: periodos.map((p) => tv(p, 'http_req_duration', 'avg')), borderColor: '#2563eb', backgroundColor: '#2563eb' },
        { label: 'Tiempo de conexión', data: periodos.map((p) => tv(p, 'http_req_connecting', 'avg')), borderColor: '#64748b', backgroundColor: '#64748b' },
      ] },
    },
    hits: {
      type: 'line', y: 'Peticiones por segundo',
      data: { labels: etiquetas, datasets: [
        { label: 'Peticiones/s (hits)', data: reqRate, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.15)', fill: true },
      ] },
    },
    codigos: {
      type: 'line', y: 'Respuestas por segundo',
      data: { labels: etiquetas, datasets: [
        { label: 'Exitosas (2xx)', data: reqRate.map((r, i) => r * (1 - failRate[i])), borderColor: '#16a34a', backgroundColor: '#16a34a' },
        { label: 'Fallidas (4xx/5xx/red)', data: reqRate.map((r, i) => r * failRate[i]), borderColor: '#dc2626', backgroundColor: '#dc2626' },
      ] },
    },
    transacciones: {
      type: 'line', y: 'Transacciones por segundo',
      data: { labels: etiquetas, datasets: [
        { label: resumen.tipo === 'login' ? 'Inicios de sesión/s' : 'Pantallas abiertas/s', data: iterRate, borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,.15)', fill: true },
      ] },
    },
    percentiles: {
      type: 'line', y: 'Tiempo de respuesta (ms)', x: 'Percentil',
      data: {
        labels: ['0 (mín)', '50', '90', '95', '99', '100 (máx)'],
        datasets: filas.map((f, i) => ({
          label: NOMBRES[f.n] || f.n, data: [f.v.min, f.v.med, f.v['p(90)'], f.v['p(95)'], f.v['p(99)'], f.v.max],
          borderColor: PALETA[i % PALETA.length], backgroundColor: PALETA[i % PALETA.length],
        })),
      },
    },
    vsUsuarios: {
      type: 'scatter', y: 'Tiempo de respuesta promedio (ms)', x: 'Usuarios activos',
      data: { datasets: [{
        label: 'Periodo de 10 s', data: periodos.map((p) => ({ x: p.vus?.[0] ?? 0, y: tv(p, 'http_req_duration', 'avg') })),
        borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.6)',
      }] },
    },
    p95Umbral: {
      // % del umbral consumido: compara en la misma escala consultas con límites distintos (500 vs 3000 ms)
      type: 'bar', horizontal: true, xMax: Math.max(100, ...filas.map((f) => Math.ceil(((f.v['p(95)'] / f.umbral) * 100) / 10) * 10)),
      x: '% del umbral p95 consumido (100 % = en el límite)',
      data: {
        labels: filas.map((f) => `${NOMBRES[f.n] || f.n} (${f1(f.v['p(95)'])} de ${f0(f.umbral)} ms)`),
        datasets: [{
          label: '% del umbral usado por el p95',
          data: filas.map((f) => (f.v['p(95)'] / f.umbral) * 100),
          backgroundColor: filas.map((f) => (f.cumple ? '#16a34a' : '#dc2626')),
        }],
      },
    },
    resumenPeticiones: {
      type: 'doughnut',
      data: { labels: ['Exitosas', 'Fallidas'], datasets: [{ data: [totReq - totKo, totKo], backgroundColor: ['#16a34a', '#dc2626'] }] },
    },
  };

  const filaStats = (f) => `<tr><td class="l">${esc(NOMBRES[f.n] || f.n)}<div class="cod">${esc(f.n)}</div></td>
    <td>${f0(f.v.count)}</td><td>${f0(f.ko)}</td><td>${f1(f.err)} %</td><td>${f1(f.v.avg)}</td><td>${f1(f.v.min)}</td>
    <td>${f1(f.v.max)}</td><td>${f1(f.v.med)}</td><td>${f1(f.v['p(90)'])}</td><td>${f1(f.v['p(95)'])}</td><td>${f1(f.v['p(99)'])}</td>
    <td>${f1(f.tps)}</td><td>${f0(f.umbral)}</td><td class="${f.cumple ? 'ok' : 'ko'}">${f.cumple ? 'Cumple' : 'No cumple'}</td></tr>`;
  const filaApdex = (nombre, a) =>
    `<tr><td>${a.valor.toFixed(3)}${a.exacto ? '' : '*'}</td><td>${APDEX_T} ms</td><td>${APDEX_F} ms</td><td class="l">${esc(nombre)}</td><td>${calificarApdex(a.valor)}</td></tr>`;
  const hayEstimado = [totApdex, ...filas.map((f) => f.apdex)].some((a) => !a.exacto);

  const errores = [];
  for (const f of filas) if (f.ko > 0) errores.push({ tipo: `Respuesta distinta de 200 en ${NOMBRES[f.n] || f.n}`, n: f.ko });
  if (r429 > 0) errores.push({ tipo: '429 Too Many Requests (límite de peticiones del backend)', n: r429 });
  const totErr = errores.reduce((s, e) => s + e.n, 0);

  const perfil = PERFILES[resumen.tipo] || resumen.tipo;
  const tarjeta = (id, t, desc, alto = 340) =>
    `<section class="card" id="${id}"><h3>${t}</h3><p class="desc">${desc}</p><div class="chart" style="height:${alto}px"><canvas data-g="${id}"></canvas></div></section>`;
  const sinSeries = periodos.length === 0
    ? '<p class="nota">Esta corrida no tiene dashboard de k6 (fue demasiado corta): las gráficas en el tiempo quedan vacías.</p>' : '';

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reporte de rendimiento – ${esc(perfil)} – ${esc(fecha(t0))}</title>
<style>
:root{--fondo:#f5f6f8;--panel:#fff;--txt:#1f2328;--sub:#59636e;--borde:#d8dee4;--nav:#1e293b;--nav-txt:#cbd5e1}
*{box-sizing:border-box}body{margin:0;font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--txt);background:var(--fondo)}
nav{position:fixed;inset:0 auto 0 0;width:230px;background:var(--nav);color:var(--nav-txt);padding:18px 0;overflow:auto}
nav .marca{color:#fff;font-weight:700;padding:0 18px 4px}nav .sub{padding:0 18px 14px;font-size:12px;color:#94a3b8}
nav a{display:block;color:var(--nav-txt);text-decoration:none;padding:6px 18px;font-size:13px}nav a:hover{background:#334155;color:#fff}
nav .grupo{padding:14px 18px 4px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
main{margin-left:230px;padding:22px 26px 60px;max-width:1500px}h1{font-size:22px;margin:0 0 2px}
h2{font-size:18px;margin:30px 0 12px;padding-bottom:6px;border-bottom:2px solid var(--borde)}
h3{font-size:15px;margin:0 0 4px}.desc{color:var(--sub);margin:0 0 10px;font-size:13px}
.card{background:var(--panel);border:1px solid var(--borde);border-radius:8px;padding:16px;margin-bottom:18px;min-width:0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:18px;margin-bottom:18px}.grid .card{margin:0}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:14px 0 4px}
.kpi{background:var(--panel);border:1px solid var(--borde);border-radius:8px;padding:10px 14px}.kpi span{color:var(--sub);font-size:12px}.kpi b{display:block;font-size:20px}
table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:6px 8px;border-bottom:1px solid var(--borde);text-align:right;white-space:nowrap}
th{background:#eef2f7;font-weight:600;position:sticky;top:0}td.l,th.l{text-align:left}.cod{color:var(--sub);font-size:11px;font-family:ui-monospace,monospace}
tfoot td{font-weight:700;background:#f8fafc}.ok{color:#15803d;font-weight:600}.ko{color:#b91c1c;font-weight:600}
.tabla{overflow:auto;max-height:620px}.info td{text-align:left;white-space:normal}.info td:first-child{color:var(--sub);width:230px}
.veredicto{display:inline-block;padding:2px 10px;border-radius:999px;font-weight:600;font-size:15px}.v-ok{background:#dcfce7;color:#166534}.v-ko{background:#fee2e2;color:#991b1b}
.nota{font-size:12px;color:var(--sub);margin-top:8px}.chart{position:relative}
@media (max-width:900px){nav{position:static;width:auto}main{margin:0;padding:16px}.grid{grid-template-columns:1fr}}
@media print{nav{display:none}main{margin:0}.card{break-inside:avoid}}
</style></head><body>
<nav>
  <div class="marca">Nómina GT v3.0</div><div class="sub">Reporte de rendimiento (k6)</div>
  <div class="grupo">Panel</div>
  <a href="#info">Información de la prueba</a><a href="#apdex">APDEX</a><a href="#resumen">Resumen de peticiones</a>
  <a href="#estadisticas">Estadísticas</a><a href="#errores">Errores</a>
  <div class="grupo">Gráficas · En el tiempo</div>
  <a href="#tiemposEnTiempo">Tiempos de respuesta</a><a href="#percentilesEnTiempo">Percentiles</a><a href="#usuarios">Usuarios activos</a>
  <a href="#bytes">Bytes por segundo</a><a href="#latencias">Latencias</a>
  <div class="grupo">Gráficas · Rendimiento</div>
  <a href="#hits">Peticiones por segundo</a><a href="#codigos">Códigos por segundo</a><a href="#transacciones">Transacciones por segundo</a>
  <div class="grupo">Gráficas · Tiempos de respuesta</div>
  <a href="#percentiles">Percentiles</a><a href="#vsUsuarios">Respuesta vs usuarios</a><a href="#p95Umbral">p95 vs umbral</a>
  <div class="grupo">Otros</div><a href="reporte-indice.html">← Todas las corridas</a>
</nav>
<main>
<h1>Reporte de rendimiento: ${esc(perfil)}</h1>
<div class="desc">Generado a partir de los resultados de k6 · formato equivalente al Dashboard Report de Apache JMeter · ISO/IEC 25010 – Eficiencia de desempeño</div>
<div class="kpis">
  <div class="kpi"><span>Veredicto</span><b><span class="veredicto ${resumen.umbralesOk ? 'v-ok' : 'v-ko'}">${resumen.umbralesOk ? 'Cumple' : 'No cumple'}</span></b></div>
  <div class="kpi"><span>Usuarios máx.</span><b>${f0(resumen.usuariosMax)}</b></div>
  <div class="kpi"><span>Peticiones</span><b>${f0(totReq)}</b></div>
  <div class="kpi"><span>Rendimiento</span><b>${f1(resumen.peticionesPorSeg)} /s</b></div>
  <div class="kpi"><span>Promedio</span><b>${f1(dur.avg)} ms</b></div>
  <div class="kpi"><span>p95</span><b>${f1(dur['p(95)'])} ms</b></div>
  <div class="kpi"><span>Errores</span><b>${f1((totKo / (totReq || 1)) * 100)} %</b></div>
  <div class="kpi"><span>APDEX</span><b>${totApdex.valor.toFixed(3)}</b></div>
</div>

<h2>Panel</h2>
<section class="card" id="info"><h3>Información de la prueba</h3>
<table class="info"><tbody>
<tr><td>Perfil</td><td>${esc(perfil)}</td></tr>
<tr><td>Sistema bajo prueba</td><td>${esc(resumen.baseUrl)}</td></tr>
<tr><td>Inicio</td><td>${esc(fecha(t0))}</td></tr>
<tr><td>Fin</td><td>${esc(fecha(t0 + duracion * 1000))}</td></tr>
<tr><td>Duración</td><td>${mmss(duracion)} (${f0(duracion)} s)</td></tr>
<tr><td>Usuarios virtuales máximos</td><td>${f0(resumen.usuariosMax)}</td></tr>
<tr><td>Datos recibidos / enviados</td><td>${f1((M.data_received?.values.count ?? 0) / 1048576)} MB / ${f1((M.data_sent?.values.count ?? 0) / 1048576)} MB</td></tr>
<tr><td>Archivo de origen</td><td>${esc(basename(archivoJson))}</td></tr>
</tbody></table>${sinSeries}</section>

<div class="grid">
<section class="card" id="apdex"><h3>APDEX (Índice de rendimiento de la aplicación)</h3>
<p class="desc">Satisfacción del usuario de 0 a 1: las respuestas ≤ T satisfacen, ≤ F se toleran y el resto frustra. Mismos valores por defecto que JMeter.</p>
<div class="tabla"><table><thead><tr><th>APDEX</th><th>T (satisfecho)</th><th>F (tolerable)</th><th class="l">Etiqueta</th><th>Calificación</th></tr></thead><tbody>
${filaApdex('Total', totApdex)}${filas.map((f) => filaApdex(NOMBRES[f.n] || f.n, f.apdex)).join('')}
</tbody></table></div>${hayEstimado ? '<p class="nota">* Estimado a partir de los percentiles, porque el máximo superó T.</p>' : ''}</section>
<section class="card" id="resumen"><h3>Resumen de peticiones</h3><p class="desc">${f0(totReq - totKo)} exitosas y ${f0(totKo)} fallidas.</p>
<div class="chart" style="height:300px"><canvas data-g="resumenPeticiones"></canvas></div></section>
</div>

<section class="card" id="estadisticas"><h3>Estadísticas</h3>
<p class="desc">Tiempos en milisegundos. Transacciones/s = muestras ÷ duración de la prueba.</p>
<div class="tabla"><table><thead><tr><th class="l">Etiqueta</th><th>Muestras</th><th>KO</th><th>% Error</th><th>Promedio</th><th>Mín</th><th>Máx</th><th>Mediana</th><th>p90</th><th>p95</th><th>p99</th><th>Transacciones/s</th><th>Umbral p95</th><th>Resultado</th></tr></thead>
<tbody>${filas.map(filaStats).join('')}</tbody>
<tfoot><tr><td class="l">Total (todas las peticiones)</td><td>${f0(totReq)}</td><td>${f0(totKo)}</td><td>${f1((totKo / (totReq || 1)) * 100)} %</td><td>${f1(dur.avg)}</td><td>${f1(dur.min)}</td><td>${f1(dur.max)}</td><td>${f1(dur.med)}</td><td>${f1(dur['p(90)'])}</td><td>${f1(dur['p(95)'])}</td><td>${f1(dur['p(99)'])}</td><td>${f1(totReq / duracion)}</td><td>–</td><td class="${resumen.umbralesOk ? 'ok' : 'ko'}">${resumen.umbralesOk ? 'Cumple' : 'No cumple'}</td></tr></tfoot>
</table></div>
<p class="nota">Recibido: ${f1(recibidoKBs)} KB/s · Enviado: ${f1(enviadoKBs)} KB/s. La fila Total incluye el inicio de sesión con el que arranca la prueba (bcrypt), que explica un máximo cercano a 450 ms.</p></section>

<section class="card" id="errores"><h3>Errores</h3>
${errores.length ? `<table><thead><tr><th class="l">Tipo de error</th><th>Cantidad</th><th>% de los errores</th><th>% de todas las peticiones</th></tr></thead><tbody>
${errores.map((e) => `<tr><td class="l">${esc(e.tipo)}</td><td>${f0(e.n)}</td><td>${f1((e.n / totErr) * 100)} %</td><td>${f1((e.n / (totReq || 1)) * 100)} %</td></tr>`).join('')}</tbody></table>`
    : '<p class="ok">No hubo errores: todas las peticiones respondieron 200 y no hubo respuestas 429.</p>'}
</section>

<h2>Gráficas · En el tiempo</h2>
${tarjeta('tiemposEnTiempo', 'Tiempos de respuesta en el tiempo', 'Tiempo promedio de cada consulta en periodos de 10 segundos. Haz clic en la leyenda para ocultar o mostrar series.', 420)}
<div class="grid">
${tarjeta('percentilesEnTiempo', 'Percentiles de respuesta en el tiempo', `p50, p90, p95 y p99 de todas las peticiones por periodo.${graficas.percentilesEnTiempo.yMax ? ' El eje se recorta: el primer periodo incluye el inicio de sesión inicial (bcrypt), que sale de escala.' : ''}`)}
${tarjeta('usuarios', 'Usuarios activos en el tiempo', 'Usuarios virtuales conectados en cada periodo (equivale a «Active Threads Over Time»).')}
${tarjeta('bytes', 'Bytes por segundo en el tiempo', 'Datos recibidos y enviados por segundo.')}
${tarjeta('latencias', 'Latencias en el tiempo', `Espera hasta el primer byte, tiempo total y tiempo de conexión (promedios por periodo).${graficas.latencias.yMax ? ' El eje se recorta por el inicio de sesión del primer periodo.' : ''}`)}
</div>

<h2>Gráficas · Rendimiento</h2>
<div class="grid">
${tarjeta('hits', 'Peticiones por segundo', 'Peticiones HTTP atendidas por segundo (hits per second).')}
${tarjeta('codigos', 'Códigos de respuesta por segundo', 'Respuestas exitosas frente a fallidas por segundo.')}
${tarjeta('transacciones', 'Transacciones por segundo', resumen.tipo === 'login' ? 'Inicios de sesión completados por segundo.' : 'Pantallas completas abiertas por segundo (cada una dispara varias peticiones en paralelo).')}
</div>

<h2>Gráficas · Tiempos de respuesta</h2>
<div class="grid">
${tarjeta('percentiles', 'Percentiles de tiempo de respuesta', 'Tiempo de respuesta de cada consulta en los percentiles 0, 50, 90, 95, 99 y 100.')}
${tarjeta('vsUsuarios', 'Tiempo de respuesta vs usuarios activos', 'Cada punto es un periodo de 10 s. Si la nube sube hacia la derecha, el sistema se vuelve más lento con más usuarios.')}
</div>
${tarjeta('p95Umbral', 'p95 por consulta frente al umbral', 'Qué parte del tiempo permitido usa el p95 de cada consulta. Verde = cumple (menos de 100 %); rojo = supera el límite.', Math.max(320, filas.length * 34))}
<p class="nota">Reporte generado por tests/performance/generar-reporte.mjs el ${esc(fecha(Date.now()))}.</p>
</main>
<script>${CHARTJS}</script>
<script>
const G = ${JSON.stringify(graficas)};
Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
Chart.defaults.animation = false;
document.querySelectorAll('canvas[data-g]').forEach((c) => {
  const g = G[c.dataset.g];
  if (!g) return;
  let ejes = {};
  if (g.type !== 'doughnut') {
    const ejeX = { title: { display: true, text: g.x || 'Tiempo transcurrido (mm:ss)' }, ticks: { maxTicksLimit: 14 } };
    if (g.type === 'scatter') Object.assign(ejeX, { type: 'linear', beginAtZero: true });
    const ejeY = { title: { display: !!g.y, text: g.y }, beginAtZero: true };
    if (g.yMax) ejeY.max = g.yMax;
    ejes = g.horizontal
      ? { x: { beginAtZero: true, max: g.xMax, title: { display: true, text: g.x } }, y: { ticks: { autoSkip: false } } }
      : { x: ejeX, y: ejeY };
  }
  new Chart(c, {
    type: g.type,
    data: g.data,
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: g.horizontal ? 'y' : 'x',
      interaction: { mode: g.type === 'line' ? 'index' : 'nearest', intersect: false },
      elements: { point: { radius: g.type === 'scatter' ? 4 : 0, hoverRadius: 4 }, line: { borderWidth: 2, tension: 0.2 } },
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
      scales: ejes,
    },
  });
});
</script>
</body></html>`;
  return { html, resumen, totApdex, totReq, totKo, dur, duracion, t0 };
}

// ── Índice de corridas ───────────────────────────────────────────────
function indice(corridas) {
  const fila = (c) => `<tr><td class="l"><a href="${esc(c.archivo)}">${esc(PERFILES[c.resumen.tipo] || c.resumen.tipo)}</a></td>
    <td class="l">${esc(fecha(c.t0))}</td><td>${f0(c.resumen.usuariosMax)}</td><td>${mmss(c.duracion)}</td><td>${f0(c.totReq)}</td>
    <td>${f1(c.resumen.peticionesPorSeg)}</td><td>${f1(c.dur.avg)}</td><td>${f1(c.dur['p(95)'])}</td><td>${f1((c.totKo / (c.totReq || 1)) * 100)} %</td>
    <td>${c.totApdex.valor.toFixed(3)}</td><td class="${c.resumen.umbralesOk ? 'ok' : 'ko'}">${c.resumen.umbralesOk ? 'Cumple' : 'No cumple'}</td></tr>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reportes de rendimiento – Nómina GT</title>
<style>body{margin:0;font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2328;background:#f5f6f8}
main{max-width:1200px;margin:0 auto;padding:24px 16px}h1{font-size:22px;margin:0 0 4px}.desc{color:#59636e;margin:0 0 18px}
.card{background:#fff;border:1px solid #d8dee4;border-radius:8px;padding:16px;overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}
th,td{padding:7px 9px;border-bottom:1px solid #d8dee4;text-align:right;white-space:nowrap}th{background:#eef2f7}.l{text-align:left}
a{color:#2563eb;font-weight:600}.ok{color:#15803d;font-weight:600}.ko{color:#b91c1c;font-weight:600}</style></head><body><main>
<h1>Reportes de rendimiento – Nómina GT v3.0</h1>
<p class="desc">Una fila por corrida de k6. Abre cada perfil para ver el reporte completo con gráficas (formato del Dashboard Report de JMeter).</p>
<div class="card"><table><thead><tr><th class="l">Perfil</th><th class="l">Inicio</th><th>Usuarios máx.</th><th>Duración</th><th>Peticiones</th><th>Peticiones/s</th><th>Promedio (ms)</th><th>p95 (ms)</th><th>Errores</th><th>APDEX</th><th>Resultado</th></tr></thead>
<tbody>${corridas.sort((a, b) => a.t0 - b.t0).map(fila).join('')}</tbody></table></div>
<p class="desc" style="margin-top:12px">Generado el ${esc(fecha(Date.now()))} por tests/performance/generar-reporte.mjs</p></main></body></html>`;
}

// ── Principal ────────────────────────────────────────────────────────
if (!existsSync(CARPETA)) {
  console.error(`No existe la carpeta de resultados: ${CARPETA}`);
  process.exit(1);
}
const archivos = readdirSync(CARPETA).filter((f) => /^(humo|carga|estres|picos|resistencia|login)-.+\.json$/.test(f));
const corridas = [];
for (const archivo of archivos) {
  const marca = archivo.replace(/^[a-z]+-/, '').replace(/\.json$/, '');
  const ruta = join(CARPETA, archivo);
  const datos = JSON.parse(readFileSync(ruta, 'utf8'));
  if (!datos.resumen || datos.resumen.sinDatos) continue; // corridas que no llegaron a medir
  const rutaDash = join(CARPETA, `dashboard-${archivo.replace(/\.json$/, '.html')}`);
  const dash = existsSync(rutaDash) ? leerDashboard(rutaDash) : null;
  const salida = `reporte-${archivo.replace(/\.json$/, '.html')}`;
  const r = construir(datos, dash, ruta);
  corridas.push({ ...r, archivo: salida });
  if (MARCA && marca !== MARCA) continue;
  writeFileSync(join(CARPETA, salida), r.html);
  console.log(`✔ ${salida}${dash ? '' : '  (sin dashboard: gráficas en el tiempo vacías)'}`);
}
if (corridas.length) {
  writeFileSync(join(CARPETA, 'reporte-indice.html'), indice(corridas));
  console.log(`✔ reporte-indice.html (${corridas.length} corridas)`);
} else {
  console.log('No hay corridas con datos en', CARPETA);
}
