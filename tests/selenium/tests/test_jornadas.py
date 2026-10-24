"""Módulo Jornadas Laborales (4 pruebas)."""
import pytest

from pages.crud_page import JornadasPage
from utils.api_client import nombre_unico

pytestmark = pytest.mark.jornadas


@pytest.fixture
def pagina(sesion):
    return JornadasPage(sesion).abrir()


@pytest.fixture
def jornada(api):
    datos = api.crear_jornada(nombre_unico("Jornada"), horas_diarias=8, horas_semanales=40)
    yield datos
    api.delete(f"/jornada-laboral/{datos['IdJornada']}")


@pytest.mark.smoke
def test_crear_jornada(pagina):
    nombre = nombre_unico("Jornada")
    pagina.nuevo()
    pagina.escribir(pagina.INPUT_NOMBRE, nombre)
    pagina.escribir(pagina.INPUT_HORAS_DIARIAS, "7")
    pagina.escribir(pagina.INPUT_HORAS_SEMANALES, "35")
    pagina.guardar()
    pagina.toast("Jornada creada")
    celdas = pagina.texto_fila(nombre)
    assert "7" in celdas and "35" in celdas


def test_editar_horas_de_jornada(pagina, jornada):
    pagina.abrir()
    nombre = jornada["NombreJornada"]
    pagina.editar(nombre)
    pagina.escribir(pagina.INPUT_HORAS_DIARIAS, "6")
    pagina.escribir(pagina.INPUT_HORAS_SEMANALES, "30")
    pagina.guardar()
    pagina.toast("Jornada actualizada")
    pagina.wait.until(lambda d: "30" in pagina.texto_fila(nombre))


def test_eliminar_jornada(pagina, jornada):
    pagina.abrir()
    pagina.eliminar(jornada["NombreJornada"])
    pagina.toast("Jornada eliminada")
    pagina.esperar_sin_fila(jornada["NombreJornada"])


@pytest.mark.negativo
def test_guardar_jornada_sin_horas_muestra_validacion(pagina):
    pagina.nuevo()
    pagina.escribir(pagina.INPUT_NOMBRE, nombre_unico("Jornada Sin Horas"))
    pagina.escribir(pagina.INPUT_HORAS_DIARIAS, "")
    pagina.guardar()
    pagina.toast("Completa todos los campos con valores válidos")
    assert pagina.dialogo_visible()
