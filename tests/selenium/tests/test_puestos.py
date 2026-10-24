"""Módulo Puestos (4 pruebas)."""
import pytest

from pages.crud_page import PuestosPage
from utils.api_client import nombre_unico

pytestmark = pytest.mark.puestos


@pytest.fixture
def pagina(sesion):
    return PuestosPage(sesion).abrir()


@pytest.fixture
def departamento(api):
    datos = api.crear_departamento(nombre_unico("Depto Puestos"))
    yield datos
    api.delete(f"/departamento/{datos['IdDepartamento']}")


@pytest.fixture
def puesto(api, departamento):
    datos = api.crear_puesto(nombre_unico("Puesto"), departamento["IdDepartamento"])
    yield datos
    api.delete(f"/puesto/{datos['IdPuesto']}")


@pytest.mark.smoke
def test_crear_puesto_con_departamento(pagina, departamento):
    pagina.abrir()  # recarga para que el select incluya el departamento recién creado
    nombre = nombre_unico("Puesto")
    pagina.nuevo()
    pagina.escribir(pagina.INPUT_NOMBRE, nombre)
    pagina.seleccionar_opcion(pagina.SELECT_DEPARTAMENTO, departamento["NombreDepartamento"])
    pagina.guardar()
    pagina.toast("Puesto creado")
    assert departamento["NombreDepartamento"] in pagina.texto_fila(nombre)


def test_editar_puesto(pagina, puesto):
    pagina.abrir()
    nuevo_nombre = f"{puesto['NombrePuesto']} Editado"
    pagina.editar(puesto["NombrePuesto"])
    pagina.escribir(pagina.INPUT_NOMBRE, nuevo_nombre)
    pagina.guardar()
    pagina.toast("Puesto actualizado")
    pagina.esperar_fila(nuevo_nombre)


def test_eliminar_puesto(pagina, puesto):
    pagina.abrir()
    pagina.eliminar(puesto["NombrePuesto"])
    pagina.toast("Puesto eliminado")
    pagina.esperar_sin_fila(puesto["NombrePuesto"])


@pytest.mark.negativo
def test_guardar_puesto_sin_departamento_muestra_validacion(pagina):
    pagina.nuevo()
    pagina.escribir(pagina.INPUT_NOMBRE, nombre_unico("Puesto Sin Depto"))
    pagina.guardar()
    pagina.toast("Completa todos los campos")
    assert pagina.dialogo_visible()
