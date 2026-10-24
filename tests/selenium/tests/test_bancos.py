"""Módulo Bancos (5 pruebas)."""
import pytest

from pages.crud_page import BancosPage
from utils.api_client import nombre_unico

pytestmark = pytest.mark.bancos


@pytest.fixture
def pagina(sesion):
    return BancosPage(sesion).abrir()


@pytest.fixture
def banco(api):
    """Banco creado por API para probar editar/eliminar sin depender de otra prueba."""
    datos = api.crear_banco(nombre_unico("Banco"))
    yield datos
    api.delete(f"/banco/{datos['IdBanco']}")


@pytest.mark.smoke
def test_crear_banco(pagina, api):
    nombre = nombre_unico("Banco")
    pagina.nuevo()
    pagina.escribir(pagina.INPUT_NOMBRE, nombre)
    pagina.guardar()
    pagina.toast("Banco creado")
    pagina.esperar_fila(nombre)


def test_editar_banco(pagina, banco):
    pagina.abrir()
    nuevo_nombre = f"{banco['NombreBanco']} Editado"
    pagina.editar(banco["NombreBanco"])
    pagina.escribir(pagina.INPUT_NOMBRE, nuevo_nombre)
    pagina.guardar()
    pagina.toast("Banco actualizado")
    pagina.esperar_fila(nuevo_nombre)


def test_eliminar_banco(pagina, banco):
    pagina.abrir()
    pagina.eliminar(banco["NombreBanco"])
    pagina.toast("Banco eliminado")
    pagina.esperar_sin_fila(banco["NombreBanco"])


@pytest.mark.negativo
def test_guardar_banco_sin_nombre_muestra_validacion(pagina):
    pagina.nuevo()
    pagina.guardar()
    pagina.toast("Ingresa el nombre")
    assert pagina.dialogo_visible()


def test_cancelar_no_crea_banco(pagina):
    nombre = nombre_unico("Banco Cancelado")
    pagina.nuevo()
    pagina.escribir(pagina.INPUT_NOMBRE, nombre)
    pagina.cancelar()
    assert not pagina.existe(pagina.fila(nombre))
