"""Módulo Empleados (5 pruebas).

El sistema no borra empleados: DELETE alterna Activo. Los empleados de prueba quedan dados de baja.
"""
import pytest

from pages.empleados_page import EmpleadosPage
from utils.api_client import nombre_unico, numero_aleatorio

pytestmark = pytest.mark.empleados


@pytest.fixture
def pagina(sesion):
    return EmpleadosPage(sesion).abrir()


@pytest.fixture
def empleado(api, puesto_y_jornada):
    """Empleado activo creado por API; al final se da de baja si sigue activo."""
    puesto, jornada = puesto_y_jornada
    nombres = nombre_unico("Emp")
    id_empleado = api.crear_empleado(nombres, puesto["IdPuesto"], jornada["IdJornada"])
    yield {"IdEmpleado": id_empleado, "Nombres": nombres}
    if api.get(f"/empleado/{id_empleado}").get("Activo"):
        api.delete(f"/empleado/{id_empleado}")


@pytest.mark.negativo
def test_guardar_empleado_vacio_muestra_validacion(pagina):
    pagina.nuevo()
    pagina.guardar()
    pagina.esperar_texto(pagina.DIALOGO, "Por favor completa los campos obligatorios")
    pagina.cancelar()


@pytest.mark.smoke
def test_crear_empleado(pagina, puesto_y_jornada):
    puesto, jornada = puesto_y_jornada
    dpi = numero_aleatorio(13)
    pagina.nuevo()
    pagina.escribir(pagina.campo("Nombres *"), nombre_unico("Emp UI"))
    pagina.escribir(pagina.campo("Apellidos *"), "Selenium")
    pagina.escribir(pagina.campo("DPI *"), dpi)
    pagina.escribir(pagina.campo("NIT"), numero_aleatorio(8))
    pagina.escribir(pagina.campo("Correo"), f"sel.{dpi}@pruebas.com")
    pagina.escribir(pagina.campo("Teléfono"), "55551234")
    pagina.seleccionar_opcion(pagina.campo("Puesto *", "p-select"), puesto["NombrePuesto"])
    pagina.seleccionar_opcion(pagina.campo("Jornada *", "p-select"), jornada["NombreJornada"])
    pagina.guardar()
    pagina.toast("Se creó el empleado")


def test_buscar_empleado_por_nombre(pagina, empleado):
    pagina.abrir()
    pagina.buscar(empleado["Nombres"])
    pagina.visible(pagina.chip(empleado["Nombres"]))


@pytest.mark.negativo
def test_buscar_empleado_inexistente_muestra_sin_resultados(pagina):
    pagina.buscar("zzz_no_existe_ningun_empleado_zzz")
    pagina.visible(pagina.SIN_RESULTADOS)


def test_dar_de_baja_empleado(pagina, empleado):
    pagina.abrir()
    pagina.seleccionar_empleado(empleado["Nombres"])
    assert "Activo" in pagina.texto(pagina.DETALLE)
    pagina.clic(pagina.BTN_BAJA)
    pagina.confirmar()
    pagina.toast("Empleado actualizado")
