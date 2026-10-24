"""Eficiencia de desempeño (ISO/IEC 25010): comportamiento temporal y capacidad.

Umbrales (requisitos no funcionales definidos para este proyecto, entorno local):
  - Listados de la API con un usuario: p95 <= 500 ms.
  - Inicio de sesión: p95 <= 1500 ms (incluye dos verificaciones bcrypt de costo 12).
  - 20 usuarios concurrentes, 10 peticiones cada uno: 0 errores y p95 <= 2000 ms.
  - Carga de pantallas en el navegador: contenido visible <= 3000 ms.
Las mediciones se guardan en results/metricas_desempeno.json para el informe.
"""
import json
import os
import statistics
import time
from concurrent.futures import ThreadPoolExecutor

import pytest
import requests
from selenium.webdriver.common.by import By

import config
from pages.base_page import BasePage

pytestmark = pytest.mark.desempeno

REPETICIONES = 20
UMBRAL_LISTADO_MS = 500
UMBRAL_LOGIN_MS = 1500
UMBRAL_CONCURRENCIA_MS = 2000
UMBRAL_PANTALLA_MS = 3000

ARCHIVO_METRICAS = os.path.join(os.path.dirname(__file__), "..", "results", "metricas_desempeno.json")


def percentil(valores, p):
    ordenados = sorted(valores)
    k = (len(ordenados) - 1) * p / 100
    i = int(k)
    return ordenados[i] if i + 1 >= len(ordenados) else ordenados[i] + (ordenados[i + 1] - ordenados[i]) * (k - i)


def resumen(tiempos_ms):
    return {
        "muestras": len(tiempos_ms),
        "promedio_ms": round(statistics.mean(tiempos_ms), 1),
        "p50_ms": round(percentil(tiempos_ms, 50), 1),
        "p95_ms": round(percentil(tiempos_ms, 95), 1),
        "max_ms": round(max(tiempos_ms), 1),
    }


@pytest.fixture(scope="module")
def metricas():
    """Acumula las mediciones del módulo y las escribe al terminar."""
    datos = {"backend": config.API_URL, "frontend": config.FRONT_URL, "navegador": config.BROWSER}
    yield datos
    os.makedirs(os.path.dirname(ARCHIVO_METRICAS), exist_ok=True)
    with open(ARCHIVO_METRICAS, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)


def medir_get(sesion, ruta, repeticiones=REPETICIONES):
    sesion.get(f"{config.API_URL}{ruta}", timeout=30).raise_for_status()  # calentamiento
    tiempos = []
    for _ in range(repeticiones):
        inicio = time.perf_counter()
        resp = sesion.get(f"{config.API_URL}{ruta}", timeout=30)
        tiempos.append((time.perf_counter() - inicio) * 1000)
        resp.raise_for_status()
    return tiempos


# ── Comportamiento temporal de la API ────────────────────────────────
@pytest.mark.parametrize(
    "ruta",
    [
        "/banco",
        "/departamento",
        "/puesto",
        "/jornada-laboral",
        "/empleado",
        "/usuario/VerUsuarios",
        "/nomina",
        "/parametro-global",
        "/asistencia?page=1&limit=50",
        "/movimiento-financiero?page=1&limit=50",
        "/venta?page=1&limit=50",
        "/reporteria/empleados",
    ],
)
def test_listado_responde_dentro_del_umbral(api, metricas, ruta):
    tiempos = medir_get(api.session, ruta)
    r = resumen(tiempos)
    metricas.setdefault("api_un_usuario", {})[ruta] = r
    assert r["p95_ms"] <= UMBRAL_LISTADO_MS, f"{ruta}: p95 {r['p95_ms']} ms > {UMBRAL_LISTADO_MS} ms"


def test_inicio_de_sesion_responde_dentro_del_umbral(metricas):
    if config.TOKEN and not os.getenv("NOMINA_PASSWORD"):
        pytest.skip("Requiere credenciales (NOMINA_USER / NOMINA_PASSWORD / NOMINA_CLAVE)")
    cuerpo = {"Username": config.USUARIO, "Contrasena": config.CONTRASENA, "Clave": int(config.CLAVE)}
    tiempos = []
    for _ in range(10):
        inicio = time.perf_counter()
        resp = requests.post(f"{config.API_URL}/login/login", json=cuerpo, timeout=30)
        tiempos.append((time.perf_counter() - inicio) * 1000)
        resp.raise_for_status()
    r = resumen(tiempos)
    metricas["login"] = r
    assert r["p95_ms"] <= UMBRAL_LOGIN_MS


# ── Capacidad: usuarios concurrentes ─────────────────────────────────
def test_veinte_usuarios_concurrentes_sin_errores(api, metricas):
    usuarios, peticiones = 20, 10
    url = f"{config.API_URL}/empleado"
    cabeceras = {"Authorization": api.session.headers["Authorization"]}

    def usuario(_):
        s = requests.Session()
        s.headers.update(cabeceras)
        resultados = []
        for _ in range(peticiones):
            inicio = time.perf_counter()
            try:
                ok = s.get(url, timeout=30).status_code == 200
            except requests.RequestException:
                ok = False
            resultados.append(((time.perf_counter() - inicio) * 1000, ok))
        return resultados

    inicio_total = time.perf_counter()
    with ThreadPoolExecutor(max_workers=usuarios) as pool:
        todos = [r for lote in pool.map(usuario, range(usuarios)) for r in lote]
    duracion_s = time.perf_counter() - inicio_total

    tiempos = [t for t, _ in todos]
    errores = sum(1 for _, ok in todos if not ok)
    r = resumen(tiempos) | {
        "usuarios": usuarios,
        "errores": errores,
        "peticiones_por_segundo": round(len(todos) / duracion_s, 1),
    }
    metricas["concurrencia_empleado"] = r
    assert errores == 0, f"{errores} peticiones fallaron"
    assert r["p95_ms"] <= UMBRAL_CONCURRENCIA_MS


# ── Comportamiento temporal en el navegador ──────────────────────────
@pytest.mark.parametrize(
    "ruta, titulo",
    [
        ("/recursoshumanos/empleados", "Empleados"),
        ("/nomina/nominas", "Generador de Nómina"),
        ("/recursoshumanos/asistencias", "Control de Asistencias"),
        ("/finanzas/movimientos", "Movimientos"),
        ("/reporteria/reportes", "Reportería"),
    ],
)
def test_pantalla_carga_dentro_del_umbral(sesion, metricas, ruta, titulo):
    pagina = BasePage(sesion)
    inicio = time.perf_counter()
    pagina.ir_a(ruta)
    pagina.visible((By.XPATH, f"//h1[contains(normalize-space(), '{titulo}')]"))
    visible_ms = (time.perf_counter() - inicio) * 1000
    navegacion = sesion.execute_script(
        "const n = performance.getEntriesByType('navigation')[0];"
        "return n ? {dom: n.domContentLoadedEventEnd, carga: n.loadEventEnd} : null;"
    )
    metricas.setdefault("pantallas", {})[ruta] = {
        "contenido_visible_ms": round(visible_ms, 1),
        "dom_content_loaded_ms": round(navegacion["dom"], 1) if navegacion else None,
        "load_ms": round(navegacion["carga"], 1) if navegacion else None,
    }
    assert visible_ms <= UMBRAL_PANTALLA_MS, f"{ruta}: {visible_ms:.0f} ms > {UMBRAL_PANTALLA_MS} ms"
