"""Módulo Clientes (3 pruebas). Requiere rol ADMINISTRADOR o GERENTE."""
import pytest

from pages.crud_page import ClientesPage
from utils.api_client import nombre_unico

pytestmark = pytest.mark.clientes


@pytest.fixture
def pagina(sesion):
    return ClientesPage(sesion).abrir()


@pytest.fixture
def cliente(api):
    datos = api.crear_cliente(nombre_unico("Cliente"))
    yield datos
    api.delete(f"/cliente/{datos['IdCliente']}")


@pytest.mark.smoke
def test_crear_cliente(pagina):
    nombre = nombre_unico("Cliente")
    pagina.nuevo()
    pagina.escribir(pagina.INPUT_NOMBRE, nombre)
    pagina.escribir(pagina.INPUT_NIT, "1234567-8")
    pagina.escribir(pagina.INPUT_CORREO, "cliente.selenium@pruebas.com")
    pagina.guardar()
    pagina.toast("Cliente creado correctamente")
    assert "1234567-8" in pagina.texto_fila(nombre)


@pytest.mark.negativo
def test_guardar_cliente_sin_nombre_muestra_validacion(pagina):
    pagina.nuevo()
    pagina.guardar()
    pagina.toast("El nombre del cliente es obligatorio")
    assert pagina.dialogo_visible()


def test_eliminar_cliente_lo_marca_inactivo(pagina, cliente):
    pagina.abrir()
    pagina.eliminar(cliente["NombreCliente"], confirmar=False)  # esta pantalla no pide confirmación
    pagina.toast("Cliente eliminado correctamente")
    pagina.wait.until(lambda d: "Inactivo" in pagina.texto_fila(cliente["NombreCliente"]))
