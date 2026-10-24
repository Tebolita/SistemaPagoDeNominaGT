"""Pantalla de inicio de sesión y cierre de sesión (10 pruebas)."""
import pytest

import config
from pages.login_page import LoginPage
from pages.menu_page import MenuPage

pytestmark = pytest.mark.login


def test_pantalla_login_muestra_campos(sin_sesion: LoginPage):
    assert sin_sesion.visible(sin_sesion.INPUT_USUARIO).is_displayed()
    assert sin_sesion.visible(sin_sesion.INPUT_CONTRASENA).is_displayed()
    assert sin_sesion.visible(sin_sesion.INPUT_CLAVE).is_displayed()
    assert sin_sesion.visible(sin_sesion.BTN_INGRESAR).is_enabled()


def test_saludo_segun_hora_del_dia(sin_sesion: LoginPage):
    saludo = sin_sesion.texto(sin_sesion.SALUDO)
    assert saludo in ("¡Buenos días!", "¡Buenas tardes!", "¡Buenas noches!")


@pytest.mark.negativo
def test_campos_vacios_muestra_error(sin_sesion: LoginPage):
    sin_sesion.clic(sin_sesion.BTN_INGRESAR)
    sin_sesion.esperar_error("Todos los campos son requeridos")
    assert "/login" in sin_sesion.url


@pytest.mark.negativo
def test_solo_usuario_muestra_error(sin_sesion: LoginPage):
    sin_sesion.llenar(usuario=config.USUARIO)
    sin_sesion.clic(sin_sesion.BTN_INGRESAR)
    sin_sesion.esperar_error("Todos los campos son requeridos")


@pytest.mark.negativo
def test_contrasena_incorrecta_muestra_error(sin_sesion: LoginPage):
    sin_sesion.ingresar(contrasena="contrasena_incorrecta_123")
    sin_sesion.esperar_error("Contraseña o usuario incorrecto")
    assert sin_sesion.local_storage("sesion_expira") is None


@pytest.mark.negativo
def test_usuario_inexistente_muestra_error(sin_sesion: LoginPage):
    sin_sesion.ingresar(usuario="usuario_que_no_existe_xyz")
    sin_sesion.esperar_error("Tu usuario no es valido")
    assert "/login" in sin_sesion.url


@pytest.mark.negativo
def test_clave_no_numerica_no_inicia_sesion(sin_sesion: LoginPage):
    sin_sesion.ingresar(clave="abc")
    sin_sesion.esperar_error()
    assert "/login" in sin_sesion.url
    assert sin_sesion.local_storage("sesion_expira") is None


@pytest.mark.smoke
def test_login_exitoso_redirige_al_inicio(sin_sesion: LoginPage):
    sin_sesion.ingresar()
    sin_sesion.esperar_url("/home/inicio")


def test_login_guarda_datos_de_sesion(sin_sesion: LoginPage):
    sin_sesion.ingresar()
    sin_sesion.esperar_url("/home/inicio")
    assert sin_sesion.local_storage("sesion_expira")
    # Seguridad: el JWT viaja en una cookie httpOnly y nunca queda al alcance de JavaScript
    assert sin_sesion.local_storage("access_token") is None
    assert "access_token" not in sin_sesion.driver.execute_script("return document.cookie;")
    assert sin_sesion.local_storage("user_role")
    assert sin_sesion.local_storage("username").lower() == config.USUARIO.lower()
    assert sin_sesion.local_storage("id_usuario")


@pytest.mark.smoke
def test_cerrar_sesion_desde_menu(sesion):
    menu = MenuPage(sesion)
    menu.ir_a("/home/inicio")
    menu.cerrar_sesion()
    menu.esperar_url("/login")
    assert menu.local_storage("sesion_expira") is None
