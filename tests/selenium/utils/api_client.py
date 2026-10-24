"""Cliente HTTP para preparar y limpiar datos de prueba sin pasar por la interfaz."""
import random
import time

import requests

import config


def nombre_unico(base: str) -> str:
    """Nombre irrepetible entre ejecuciones, p. ej. 'SEL Banco 1739912345123'."""
    return f"{config.PREFIJO} {base} {int(time.time() * 1000)}"


def numero_aleatorio(digitos: int) -> str:
    return "".join(random.choices("0123456789", k=digitos))


class ApiClient:
    def __init__(self):
        self.session = requests.Session()
        self.token = None

    # ── Autenticación ────────────────────────────────────────────────
    def login(self, usuario=None, contrasena=None, clave=None) -> requests.Response:
        return self.session.post(
            f"{config.API_URL}/login/login",
            json={
                "Username": usuario or config.USUARIO,
                "Contrasena": contrasena or config.CONTRASENA,
                "Clave": int(clave or config.CLAVE),
            },
            timeout=config.TIMEOUT,
        )

    def usar_token(self, token: str):
        self.token = token
        self.session.headers["Authorization"] = f"Bearer {token}"

    def autenticar(self) -> dict:
        if config.TOKEN:
            self.usar_token(config.TOKEN)
            return {"access_token": config.TOKEN}
        resp = self.login()
        resp.raise_for_status()
        datos = resp.json()
        self.token = datos["access_token"]
        self.session.headers["Authorization"] = f"Bearer {self.token}"
        return datos

    # ── Genéricos ────────────────────────────────────────────────────
    def get(self, ruta):
        resp = self.session.get(f"{config.API_URL}{ruta}", timeout=config.TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    def post(self, ruta, body):
        resp = self.session.post(f"{config.API_URL}{ruta}", json=body, timeout=config.TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    def delete(self, ruta, ignorar_errores=True):
        try:
            self.session.delete(f"{config.API_URL}{ruta}", timeout=config.TIMEOUT)
        except requests.RequestException:
            if not ignorar_errores:
                raise

    def eliminar_por_prefijo(self, ruta, campo_nombre, campo_id, prefijo):
        """Borra los registros cuyo nombre empiece con `prefijo` (limpieza tras pruebas de UI)."""
        try:
            registros = self.get(ruta)
        except requests.RequestException:
            return
        for r in registros:
            if str(r.get(campo_nombre) or "").startswith(prefijo) and r.get("Activo") is not False:
                self.delete(f"{ruta}/{r[campo_id]}")

    # ── Atajos por módulo ────────────────────────────────────────────
    def crear_banco(self, nombre):
        return self.post("/banco", {"NombreBanco": nombre})

    def crear_departamento(self, nombre, presupuesto=None):
        body = {"NombreDepartamento": nombre}
        if presupuesto is not None:
            body["Presupuesto"] = presupuesto
        return self.post("/departamento", body)

    def crear_puesto(self, nombre, id_departamento):
        return self.post("/puesto", {"NombrePuesto": nombre, "IdDepartamento": id_departamento})

    def crear_jornada(self, nombre, horas_diarias=8, horas_semanales=40):
        return self.post(
            "/jornada-laboral",
            {"NombreJornada": nombre, "HorasDiarias": horas_diarias, "HorasSemanales": horas_semanales},
        )

    def crear_cliente(self, nombre):
        return self.post("/cliente", {"NombreCliente": nombre})

    def crear_empleado(self, nombres, id_puesto, id_jornada):
        dpi = numero_aleatorio(13)
        resp = self.post(
            "/empleado/CrearEmpleado",
            {
                "DPI": dpi,
                "NIT": numero_aleatorio(8),
                "Nombres": nombres,
                "Apellidos": "Selenium",
                "CorreoPersonal": f"sel.{dpi}@pruebas.com",
                "IdPuesto": id_puesto,
                "IdJornada": id_jornada,
                "Telefono": "55551234",
                "Genero": False,
            },
        )
        return resp["id"]
