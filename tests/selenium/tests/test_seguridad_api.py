"""Regresión de los defectos de seguridad D-01, D-02 y D-04 (por API)."""
import pytest
import requests

import config
from utils.api_client import nombre_unico, numero_aleatorio

pytestmark = [pytest.mark.seguridad, pytest.mark.negativo]


# D-01: servicios que antes respondían sin token
@pytest.mark.parametrize(
    "metodo, ruta",
    [
        ("GET", "/cliente"),
        ("GET", "/producto-servicio"),
        ("GET", "/cuenta-bancaria-empresa"),
        ("GET", "/movimiento-financiero"),
        ("GET", "/reporteria/empleados"),
        ("POST", "/usuario/CrearUsuario"),
    ],
)
def test_servicio_sin_token_responde_401(metodo, ruta):
    resp = requests.request(metodo, f"{config.API_URL}{ruta}", json={}, timeout=config.TIMEOUT)
    assert resp.status_code == 401


@pytest.fixture
def usuario_de_prueba(api, puesto_y_jornada):
    """Usuario nuevo con su propio empleado; queda dado de baja al terminar."""
    puesto, jornada = puesto_y_jornada
    id_empleado = api.crear_empleado(nombre_unico("Emp Usuario"), puesto["IdPuesto"], jornada["IdJornada"])
    id_rol = api.get("/roles")[0]["IdRol"]
    credenciales = {
        "Username": f"sel_{numero_aleatorio(8)}",
        "Contrasena": "Prueba.2026",
        "Clave": "4321",
    }
    creado = api.post("/usuario/CrearUsuario", {**credenciales, "IdRol": id_rol, "IdEmpleado": id_empleado})
    yield {"IdUsuario": creado["id"], **credenciales}
    api.delete(f"/usuario/{creado['id']}")
    api.delete(f"/empleado/{id_empleado}")


# D-02 y D-04: la baja retira el acceso, aunque se repita la operación
def test_usuario_dado_de_baja_no_puede_iniciar_sesion(api, usuario_de_prueba):
    u = usuario_de_prueba
    assert api.login(u["Username"], u["Contrasena"], u["Clave"]).status_code == 200

    api.delete(f"/usuario/{u['IdUsuario']}")
    resp = api.login(u["Username"], u["Contrasena"], u["Clave"])
    assert resp.status_code == 401
    assert resp.json()["message"] == "Tu usuario no es valido"

    # Antes la baja era un interruptor: una segunda llamada reactivaba la cuenta
    api.delete(f"/usuario/{u['IdUsuario']}")
    assert api.login(u["Username"], u["Contrasena"], u["Clave"]).status_code == 401


def test_usuario_dado_de_baja_no_aparece_en_el_listado(api, usuario_de_prueba):
    api.delete(f"/usuario/{usuario_de_prueba['IdUsuario']}")
    ids = [u["IdUsuario"] for u in api.get("/usuario/VerUsuarios")]
    assert usuario_de_prueba["IdUsuario"] not in ids
