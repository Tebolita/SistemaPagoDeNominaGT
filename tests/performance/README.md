# Pruebas de rendimiento (k6)

Suite de **rendimiento, carga, estrés, picos, resistencia y login** para la característica
**Eficiencia de desempeño** de ISO/IEC 25010. Mide los tiempos de respuesta por endpoint y los
compara con los requisitos no funcionales del proyecto.

| Archivo | Para qué |
|---|---|
| `k6-rendimiento.js` | El script de k6: perfiles, umbrales y reportes |
| `ejecutar.sh` | Lanzador para macOS / Linux |
| `ejecutar.ps1` | Lanzador para Windows (PowerShell) |
| `generar-reporte.mjs` | Reporte HTML estilo JMeter a partir de los resultados (lo llaman los lanzadores) |
| `vendor/chart.umd.min.js` | Chart.js 4.4.1 (MIT), incrustado en los reportes para verlos sin internet |
| `.env.rendimiento.example` | Plantilla de configuración (copiar como `.env.rendimiento`) |
| `resultados/` | Reportes generados (no se versionan) |

## 1. Preparación (una sola vez)

1. **Instalar k6**: `brew install k6` (macOS) · `winget install k6 --source winget` (Windows) ·
   [otras opciones](https://grafana.com/docs/k6/latest/set-up/install-k6/).
2. **Configurar**: `cp tests/performance/.env.rendimiento.example tests/performance/.env.rendimiento`
   y completar `BASE_URL`, `USUARIO`, `CONTRASENA` y `CLAVE`. Usa un usuario **ADMINISTRADOR**
   (las pantallas de Ventas y Finanzas exigen ese rol).
3. **Levantar el backend sin el límite de peticiones**: el backend limita 300 peticiones por minuto y
   10 logins por minuto por IP, y toda la prueba sale de una sola IP.
   - Local: `THROTTLE_LIMIT=100000 LOGIN_THROTTLE_LIMIT=1000 npm run start:prod`
     (compila antes con `npm run build`; `start:dev` mide un servidor en modo desarrollo, más lento).
   - Docker: en el `.env` de la raíz pon `THROTTLE_LIMIT=100000` y `LOGIN_THROTTLE_LIMIT=1000`,
     luego `docker compose up -d --build` y usa `BASE_URL=http://localhost:8080/api`.
   - **Al terminar, regresa los valores normales** (300 y 10).
4. Ten **datos realistas** en la base (empleados, nóminas, asistencias). Con tablas vacías todo
   responde rápido y la prueba no dice nada.

## 2. Ejecutar

```bash
./tests/performance/ejecutar.sh                 # humo: 1 usuario, 1 min (empezar siempre por aquí)
./tests/performance/ejecutar.sh carga           # 20 usuarios, 5 min
./tests/performance/ejecutar.sh estres picos    # varios seguidos
./tests/performance/ejecutar.sh todas           # humo, carga, estres, picos y login (~25 min)
VUS=50 DURACION=10m ./tests/performance/ejecutar.sh carga
```

En Windows: `.\tests\performance\ejecutar.ps1 carga` (mismos perfiles; variables con `$env:VUS=50`).

El lanzador sale con código 0 si todo cumple y con el número de perfiles fallidos si no, así que
también sirve en un pipeline (Jenkins, GitHub Actions).

## 3. Perfiles

| Perfil | Usuarios | Duración aprox. | Responde a (ISO 25010) |
|---|---|---|---|
| `humo` | 1 | 1 min | Línea base de cada endpoint; verifica que todo responde |
| `carga` | `VUS` (20) | 6.5 min | **Comportamiento temporal** con la carga esperada |
| `estres` | 20 → 50 → 100 → 150 | 13 min | **Capacidad**: hasta cuántos usuarios se cumplen los umbrales |
| `picos` | 5 → 100 de golpe → 5 | 3 min | Recuperación ante picos (madurez / tolerancia) |
| `resistencia` | `VUS` (20) | 33 min | Degradación en el tiempo, fugas de memoria (**utilización de recursos**) |
| `login` | 2 logins/s | 1 min | Costo del inicio de sesión (bcrypt de 12 rondas) |

Cada usuario virtual simula a una persona que navega: abre una pantalla (Inicio, Empleados, Nómina,
Asistencias, Ventas, Reportería o una exportación a Excel), el frontend dispara en paralelo las
peticiones de esa pantalla, y luego "lee" entre 1 y `PAUSA` segundos. Solo se usan endpoints de
lectura, así que la prueba **no modifica datos**.

## 4. Umbrales (criterios de aceptación)

Los mismos requisitos que usa `tests/selenium/tests/test_desempeno.py`:

| Métrica | Umbral |
|---|---|
| Listados y reportes, p95 | ≤ 500 ms |
| Login, p95 | ≤ 1500 ms |
| Todas las peticiones con concurrencia, p95 | ≤ 2000 ms |
| Exportaciones Excel/PDF, p95 | ≤ 3000 ms |
| `/health`, p95 | ≤ 200 ms |
| Peticiones con error | < 1 % |

Se pueden ajustar con `UMBRAL_LISTADO_MS`, `UMBRAL_LOGIN_MS`, `UMBRAL_GLOBAL_MS` y `UMBRAL_PESADO_MS`.
En `estres` y `picos` es **normal** que algún umbral falle en los escalones altos: lo que interesa
es en qué escalón empieza a fallar (capacidad) y si el sistema se recupera después del pico.

## 5. Resultados

En `tests/performance/resultados/`, con la fecha y hora en el nombre:

- `<perfil>-<fecha>.html`: tabla por endpoint (promedio, p50, p90, **p95**, p99, máximo, umbral y si
  cumple) con el veredicto. Es la evidencia para el informe.
- `reporte-<perfil>-<fecha>.html`: **reporte al estilo del Dashboard Report de JMeter** (APDEX,
  estadísticas por consulta, errores y gráficas en el tiempo, de rendimiento y de tiempos de respuesta).
  `reporte-indice.html` enlaza todas las corridas. Funciona sin internet. Para regenerarlos:
  `node tests/performance/generar-reporte.mjs`.
- `<perfil>-<fecha>.json`: los mismos datos más el resumen completo de k6.
- `dashboard-<perfil>-<fecha>.html`: gráficas de k6 (tiempos y usuarios en el tiempo). Solo se
  genera en corridas de más de un minuto.
- `recursos-<perfil>-<fecha>.csv`: CPU y memoria del backend y de SQL Server cada 5 s (solo con
  Docker Compose). Si la memoria crece sin bajar en `resistencia`, hay una fuga.

Cómo leerlos:

- **p95** = el 95 % de las peticiones tardó eso o menos. Es la métrica de los umbrales.
- **Respuestas 429** mayores que 0 = el rate limiting cortó la prueba: sube `THROTTLE_LIMIT`.
- **Errores** altos con 401 = credenciales o sesión vencida; con 403 = el usuario no es ADMINISTRADOR.
- **Veredicto "SIN DATOS"** = la prueba no llegó a medir (API caída o login fallido).

## 6. Uso directo de k6 (sin lanzador)

```bash
mkdir -p tests/performance/resultados
k6 run -e TIPO=carga -e BASE_URL=http://localhost:4000/api -e USUARIO=admin -e CONTRASENA='...' \
       -e CLAVE=1234 -e SALIDA=tests/performance/resultados tests/performance/k6-rendimiento.js
```

La carpeta `_ensayo-servidor-simulado/` dentro de `resultados/` contiene la corrida con la que se
validó el script contra un servidor simulado: **no son mediciones del sistema real**.
