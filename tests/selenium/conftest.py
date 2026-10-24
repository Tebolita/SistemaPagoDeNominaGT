"""Fixtures compartidas: navegador, sesión iniciada, cliente de API y captura en fallos."""
import os
import sys
from datetime import datetime

import pytest
from selenium import webdriver

sys.path.insert(0, os.path.dirname(__file__))

import config  # noqa: E402
from pages.login_page import LoginPage  # noqa: E402
from utils.api_client import ApiClient  # noqa: E402

CARPETA_RESULTADOS = os.path.join(os.path.dirname(__file__), "results")


# ── Navegador ────────────────────────────────────────────────────────
def _crear_driver():
    if config.BROWSER == "edge":
        opciones = webdriver.EdgeOptions()
    elif config.BROWSER == "firefox":
        opciones = webdriver.FirefoxOptions()
    else:
        opciones = webdriver.ChromeOptions()

    if config.HEADLESS:
        opciones.add_argument("--headless=new" if config.BROWSER != "firefox" else "-headless")
    if config.BROWSER == "firefox":
        opciones.add_argument("-width=1600")
        opciones.add_argument("-height=1000")
    else:
        opciones.add_argument("--window-size=1600,1000")

    if config.BROWSER == "edge":
        return webdriver.Edge(options=opciones)
    if config.BROWSER == "firefox":
        return webdriver.Firefox(options=opciones)
    return webdriver.Chrome(options=opciones)


@pytest.fixture(scope="session")
def driver():
    """Un solo navegador para toda la ejecución (más rápido que abrir uno por prueba)."""
    d = _crear_driver()
    d.maximize_window()
    yield d
    d.quit()


@pytest.fixture
def sin_sesion(driver):
    """Navegador en la pantalla de login y sin token guardado."""
    pagina = LoginPage(driver)
    pagina.ir_a("/login")
    pagina.limpiar_sesion()
    return pagina.abrir()


@pytest.fixture
def sesion(driver):
    """Garantiza que haya una sesión iniciada; solo hace login por UI si no hay sesión vigente."""
    pagina = LoginPage(driver)
    if not driver.current_url.startswith(config.FRONT_URL):
        pagina.ir_a("/login")
    if not pagina.local_storage("sesion_expira"):
        if config.TOKEN:
            _sesion_con_token(driver)
        else:
            pagina.abrir()
            pagina.ingresar()
            pagina.esperar_url("/home/inicio")
    return driver


def _sesion_con_token(driver):
    """Reproduce lo que deja el login a partir del token (NOMINA_TOKEN).

    El JWT ya no vive en localStorage: va en la cookie access_token (path /api) y el navegador
    solo guarda los datos de la interfaz y la vigencia de la sesión.
    """
    import base64
    import json

    cuerpo = config.TOKEN.split(".")[1]
    datos = json.loads(base64.urlsafe_b64decode(cuerpo + "=" * (-len(cuerpo) % 4)))
    # Las cookies no distinguen puerto: la de localhost:4200 también viaja a localhost:4000/api
    driver.add_cookie({"name": "access_token", "value": config.TOKEN, "path": "/api"})
    driver.execute_script(
        """
        localStorage.setItem('user_role', arguments[0] || '');
        localStorage.setItem('username', arguments[1] || '');
        localStorage.setItem('id_usuario', String(arguments[2] || ''));
        localStorage.setItem('sesion_expira', String((arguments[3] || 0) * 1000));
        """,
        datos.get("role"), datos.get("username"), datos.get("sub"), datos.get("exp"),
    )


# ── API (preparación y limpieza de datos) ────────────────────────────
@pytest.fixture(scope="session")
def api():
    cliente = ApiClient()
    try:
        cliente.autenticar()
    except Exception as e:  # noqa: BLE001
        pytest.exit(
            f"No se pudo iniciar sesión en la API ({config.API_URL}) con el usuario '{config.USUARIO}': {e}\n"
            "Revisa que el backend esté levantado y las variables NOMINA_USER / NOMINA_PASSWORD / NOMINA_CLAVE.",
            returncode=3,
        )
    yield cliente
    # Red de seguridad: borra lo que hayan dejado las pruebas que fallaron a medias
    for ruta, nombre, id_ in [
        ("/puesto", "NombrePuesto", "IdPuesto"),
        ("/banco", "NombreBanco", "IdBanco"),
        ("/jornada-laboral", "NombreJornada", "IdJornada"),
        ("/departamento", "NombreDepartamento", "IdDepartamento"),
        ("/cliente", "NombreCliente", "IdCliente"),
    ]:
        cliente.eliminar_por_prefijo(ruta, nombre, id_, config.PREFIJO)


@pytest.fixture(scope="session")
def puesto_y_jornada(api):
    """Primer puesto y primera jornada existentes (necesarios para crear empleados)."""
    puestos = api.get("/puesto")
    jornadas = api.get("/jornada-laboral")
    if not puestos or not jornadas:
        pytest.skip("Se necesita al menos un puesto y una jornada en la base de datos")
    return puestos[0], jornadas[0]


# ── Captura de pantalla cuando una prueba falla ──────────────────────
@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    resultado = yield
    reporte = resultado.get_result()
    if reporte.when != "call" or not reporte.failed:
        return
    d = item.funcargs.get("driver") or item.funcargs.get("sesion") or item.funcargs.get("sin_sesion")
    if d is None:
        return
    if isinstance(d, LoginPage):
        d = d.driver
    os.makedirs(CARPETA_RESULTADOS, exist_ok=True)
    archivo = os.path.join(CARPETA_RESULTADOS, f"{item.name}_{datetime.now():%H%M%S}.png")
    try:
        d.save_screenshot(archivo)
    except Exception:  # noqa: BLE001
        return
    extras = getattr(reporte, "extras", [])
    try:
        from pytest_html import extras as html_extras

        extras.append(html_extras.image(d.get_screenshot_as_base64()))
    except ImportError:
        pass
    reporte.extras = extras
