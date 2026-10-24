"""Módulo Departamentos (5 pruebas)."""
import pytest

from pages.crud_page import DepartamentosPage
from utils.api_client import nombre_unico

pytestmark = pytest.mark.departamentos


@pytest.fixture
def pagina(sesion):
    return DepartamentosPage(sesion).abrir()


@pytest.fixture
def departamento(api):
    datos = api.crear_departamento(nombre_unico("Depto"), presupuesto=10000)
    yield datos
    api.delete(f"/departamento/{datos['IdDepartamento']}")


@pytest.mark.smoke
def test_crear_departamento_con_presupuesto(pagina):
    nombre = nombre_unico("Depto")
    pagina.nuevo()
    pagina.escribir(pagina.INPUT_NOMBRE, nombre)
    pagina.escribir(pagina.INPUT_PRESUPUESTO, "25000")
    pagina.guardar()
    pagina.toast("Departamento creado")
    assert "25,000.00" in pagina.texto_fila(nombre)


def test_crear_departamento_sin_presupuesto_muestra_sin_limite(pagina):
    nombre = nombre_unico("Depto Sin Limite")
    pagina.nuevo()
    pagina.escribir(pagina.INPUT_NOMBRE, nombre)
    pagina.guardar()
    pagina.toast("Departamento creado")
    assert "Sin límite" in pagina.texto_fila(nombre)


def test_editar_presupuesto_del_departamento(pagina, departamento):
    pagina.abrir()
    nombre = departamento["NombreDepartamento"]
    pagina.editar(nombre)
    pagina.escribir(pagina.INPUT_PRESUPUESTO, "40000")
    pagina.guardar()
    pagina.toast("Departamento actualizado")
    pagina.wait.until(lambda d: "40,000.00" in pagina.texto_fila(nombre))


def test_eliminar_departamento(pagina, departamento):
    pagina.abrir()
    pagina.eliminar(departamento["NombreDepartamento"])
    pagina.toast("Departamento eliminado")
    pagina.esperar_sin_fila(departamento["NombreDepartamento"])


@pytest.mark.negativo
def test_guardar_departamento_sin_nombre_muestra_validacion(pagina):
    pagina.nuevo()
    pagina.guardar()
    pagina.toast("Ingresa el nombre")
    assert pagina.dialogo_visible()
