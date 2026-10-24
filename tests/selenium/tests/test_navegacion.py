"""Rutas protegidas, carga de módulos y menú lateral (14 pruebas)."""
import pytest
from selenium.webdriver.common.by import By

from pages.base_page import BasePage
from pages.menu_page import MenuPage

pytestmark = pytest.mark.navegacion


@pytest.mark.negativo
@pytest.mark.parametrize("ruta", ["/home/inicio", "/configuracion/bancos", "/nomina/inicio"])
def test_ruta_protegida_sin_sesion_redirige_al_login(sin_sesion, ruta):
    sin_sesion.ir_a(ruta)
    sin_sesion.esperar_url("/login")


@pytest.mark.parametrize(
    "ruta, titulo",
    [
        ("/configuracion/bancos", "Gestión de Bancos"),
        ("/configuracion/departamentos", "Gestión de Departamentos"),
        ("/configuracion/puestos", "Gestión de Puestos"),
        ("/configuracion/jornadas", "Gestión de Jornadas Laborales"),
        ("/configuracion/parametros", "Parámetros Globales"),
        ("/recursoshumanos/empleados", "Empleados"),
        ("/recursoshumanos/vacaciones", "Control de Vacaciones"),
        ("/recursoshumanos/asistencias", "Control de Asistencias"),
        ("/seguridad/usuarios", "Usuarios del Sistema"),
        ("/seguridad/roles", "Roles y Permisos"),
    ],
)
def test_modulo_carga_con_su_titulo(sesion, ruta, titulo):
    pagina = BasePage(sesion)
    pagina.ir_a(ruta)
    pagina.visible((By.XPATH, f"//h1[contains(normalize-space(), '{titulo}')]"))
    assert ruta in pagina.url


@pytest.mark.smoke
def test_menu_muestra_usuario_conectado(sesion):
    menu = MenuPage(sesion)
    menu.ir_a("/home/inicio")
    esperado = menu.local_storage("username")
    menu.esperar_texto(menu.NOMBRE_USUARIO, esperado)
