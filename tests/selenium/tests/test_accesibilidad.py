"""Capacidad de interacción: accesibilidad (ISO/IEC 25010:2023, «inclusividad» y «asistencia al usuario»).

Cada pantalla se analiza con axe-core 4.10.2 contra WCAG 2.1 niveles A y AA.
Criterio de aceptación: ninguna violación de impacto «critical» o «serious».
Todas las violaciones, de cualquier impacto, se guardan en results/accesibilidad.json.
"""
import json
import os

import pytest
from selenium.webdriver.common.by import By

from pages.base_page import BasePage

pytestmark = pytest.mark.accesibilidad

AXE = os.path.join(os.path.dirname(__file__), "..", "vendor", "axe.min.js")
ARCHIVO = os.path.join(os.path.dirname(__file__), "..", "results", "accesibilidad.json")
ETIQUETAS_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]
IMPACTOS_BLOQUEANTES = {"critical", "serious"}


@pytest.fixture(scope="module")
def informe():
    datos = {"motor": "axe-core 4.10.2", "reglas": ETIQUETAS_WCAG, "pantallas": {}}
    yield datos
    os.makedirs(os.path.dirname(ARCHIVO), exist_ok=True)
    with open(ARCHIVO, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)


def analizar(driver):
    """Inyecta axe-core en la página actual y devuelve sus violaciones."""
    with open(AXE, encoding="utf-8") as f:
        driver.execute_script(f.read())
    resultado = driver.execute_async_script(
        "const listo = arguments[arguments.length - 1];"
        "axe.run(document, { runOnly: { type: 'tag', values: arguments[0] } })"
        "   .then(r => listo(r.violations)).catch(e => listo({ error: String(e) }));",
        ETIQUETAS_WCAG,
    )
    if isinstance(resultado, dict) and "error" in resultado:
        raise RuntimeError(resultado["error"])
    return resultado


def registrar_y_verificar(informe, nombre, violaciones):
    informe["pantallas"][nombre] = [
        {
            "regla": v["id"],
            "impacto": v["impact"],
            "descripcion": v["help"],
            "elementos": len(v["nodes"]),
            "ejemplo": v["nodes"][0]["target"] if v["nodes"] else None,
            "ayuda": v["helpUrl"],
        }
        for v in violaciones
    ]
    bloqueantes = [v for v in violaciones if v["impact"] in IMPACTOS_BLOQUEANTES]
    detalle = "; ".join(f"{v['id']} ({v['impact']}, {len(v['nodes'])} elementos)" for v in bloqueantes)
    assert not bloqueantes, f"{nombre}: {detalle}"


def test_pantalla_de_inicio_de_sesion(sin_sesion, informe):
    sin_sesion.driver.set_script_timeout(30)
    registrar_y_verificar(informe, "/login", analizar(sin_sesion.driver))


@pytest.mark.parametrize(
    "ruta, titulo",
    [
        ("/recursoshumanos/empleados", "Empleados"),
        ("/configuracion/bancos", "Gestión de Bancos"),
        ("/recursoshumanos/vacaciones", "Control de Vacaciones"),
        ("/nomina/nominas", "Generador de Nómina"),
        ("/finanzas/movimientos", "Movimientos Financieros"),
        ("/seguridad/usuarios", "Usuarios del Sistema"),
    ],
)
def test_modulo_cumple_wcag_aa(sesion, informe, ruta, titulo):
    sesion.set_script_timeout(30)
    pagina = BasePage(sesion)
    pagina.ir_a(ruta)
    pagina.visible((By.XPATH, f"//h1[contains(normalize-space(), '{titulo}')]"))
    registrar_y_verificar(informe, ruta, analizar(sesion))
