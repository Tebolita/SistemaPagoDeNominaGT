"""Page Object genérico para las pantallas CRUD (tabla + diálogo + toast) del sistema."""
from selenium.webdriver.common.by import By

from pages.base_page import BasePage


class CrudPage(BasePage):
    BTN_NUEVO = (By.CSS_SELECTOR, 'p-button[label="Nuevo"] button')
    DIALOGO = (By.CSS_SELECTOR, ".p-dialog")
    BTN_GUARDAR = (By.CSS_SELECTOR, '.p-dialog p-button[label="Guardar"] button')
    BTN_CANCELAR = (By.CSS_SELECTOR, '.p-dialog p-button[label="Cancelar"] button')

    RUTA = ""
    TITULO = ""

    def abrir(self):
        self.ir_a(self.RUTA)
        self.visible((By.XPATH, f"//h1[contains(normalize-space(), '{self.TITULO}')]"))
        return self

    # ── Diálogo ──────────────────────────────────────────────────────
    def nuevo(self):
        self.clic(self.BTN_NUEVO)
        self.visible(self.DIALOGO)

    def guardar(self):
        self.clic(self.BTN_GUARDAR)

    def cancelar(self):
        self.clic(self.BTN_CANCELAR)
        self.esperar_invisible(self.DIALOGO)

    def dialogo_visible(self) -> bool:
        return self.existe(self.DIALOGO) and self.driver.find_element(*self.DIALOGO).is_displayed()

    # ── Tabla ────────────────────────────────────────────────────────
    @staticmethod
    def fila(texto: str):
        return (By.XPATH, f"//tr[td[normalize-space()='{texto}']]")

    BTN_PAGINA_SIGUIENTE = (By.CSS_SELECTOR, ".p-paginator-next:not(.p-disabled):not([disabled])")

    def esperar_fila(self, texto: str):
        """Espera la fila; si la tabla está paginada, avanza página por página hasta hallarla."""

        def buscar(_):
            filas = [f for f in self.driver.find_elements(*self.fila(texto)) if f.is_displayed()]
            if filas:
                return filas[0]
            siguiente = self.driver.find_elements(*self.BTN_PAGINA_SIGUIENTE)
            if siguiente:
                self.driver.execute_script("arguments[0].click();", siguiente[0])
            return False

        return self.wait.until(buscar)

    def esperar_sin_fila(self, texto: str):
        self.wait.until(lambda d: not self.existe(self.fila(texto)))

    def texto_fila(self, texto: str) -> str:
        return self.esperar_fila(texto).text

    def editar(self, texto: str):
        self.esperar_fila(texto)  # lleva la tabla a la página donde está la fila
        self.clic((By.XPATH, f"//tr[td[normalize-space()='{texto}']]//p-button[@icon='pi pi-pencil']//button"))
        self.visible(self.DIALOGO)

    def eliminar(self, texto: str, confirmar: bool = True):
        self.esperar_fila(texto)  # lleva la tabla a la página donde está la fila
        self.clic((By.XPATH, f"//tr[td[normalize-space()='{texto}']]//p-button[@icon='pi pi-trash']//button"))
        if confirmar:
            self.confirmar()


class BancosPage(CrudPage):
    RUTA = "/configuracion/bancos"
    TITULO = "Gestión de Bancos"
    INPUT_NOMBRE = (By.CSS_SELECTOR, '.p-dialog input[type="text"]')


class DepartamentosPage(CrudPage):
    RUTA = "/configuracion/departamentos"
    TITULO = "Gestión de Departamentos"
    INPUT_NOMBRE = (By.CSS_SELECTOR, '.p-dialog input[placeholder="Ej: Recursos Humanos"]')
    INPUT_PRESUPUESTO = (By.CSS_SELECTOR, ".p-dialog p-inputnumber input")


class PuestosPage(CrudPage):
    RUTA = "/configuracion/puestos"
    TITULO = "Gestión de Puestos"
    INPUT_NOMBRE = (By.CSS_SELECTOR, '.p-dialog input[type="text"]')
    SELECT_DEPARTAMENTO = (By.CSS_SELECTOR, ".p-dialog p-select")


class JornadasPage(CrudPage):
    RUTA = "/configuracion/jornadas"
    TITULO = "Gestión de Jornadas Laborales"
    INPUT_NOMBRE = (By.CSS_SELECTOR, '.p-dialog input[type="text"]')
    INPUT_HORAS_DIARIAS = (By.XPATH, "(//div[contains(@class,'p-dialog')]//p-inputnumber//input)[1]")
    INPUT_HORAS_SEMANALES = (By.XPATH, "(//div[contains(@class,'p-dialog')]//p-inputnumber//input)[2]")


class ClientesPage(CrudPage):
    RUTA = "/ventas/clientes"
    TITULO = "Clientes"
    BTN_NUEVO = (By.CSS_SELECTOR, 'p-button[label="Nuevo Cliente"] button')
    INPUT_NOMBRE = (By.CSS_SELECTOR, '.p-dialog input[placeholder="Nombre completo o razón social"]')
    INPUT_NIT = (By.CSS_SELECTOR, '.p-dialog input[placeholder="Ej. 12345678-9"]')
    INPUT_CORREO = (By.CSS_SELECTOR, '.p-dialog input[type="email"]')
