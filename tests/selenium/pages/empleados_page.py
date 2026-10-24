from selenium.webdriver.common.by import By

from pages.crud_page import CrudPage


class EmpleadosPage(CrudPage):
    RUTA = "/recursoshumanos/empleados"
    TITULO = "Empleados"

    BTN_NUEVO = (By.CSS_SELECTOR, 'p-button[label="Nuevo Empleado"] button')
    INPUT_BUSCAR = (By.CSS_SELECTOR, 'input[placeholder="Buscar empleado..."]')
    DETALLE = (By.CSS_SELECTOR, ".detail-header")
    BTN_BAJA = (By.XPATH, "//div[contains(@class,'detail-header')]//button[.//*[contains(@class,'pi-user-minus')]]")
    SIN_RESULTADOS = (By.XPATH, "//span[normalize-space()='Sin resultados']")

    @staticmethod
    def campo(etiqueta: str, tipo: str = "input"):
        """Campo del diálogo 'Nuevo Empleado' ubicado por el texto de su <label>."""
        return (
            By.XPATH,
            "//div[contains(@class,'p-dialog')]//div[contains(@class,'field-group')]"
            f"[label[normalize-space()='{etiqueta}']]//{tipo}",
        )

    @staticmethod
    def chip(nombre: str):
        return (By.XPATH, f"//button[contains(@class,'emp-chip')][contains(., '{nombre}')]")

    def buscar(self, texto: str):
        self.escribir(self.INPUT_BUSCAR, texto)

    def seleccionar_empleado(self, nombre: str):
        self.buscar(nombre)
        self.clic(self.chip(nombre))
        self.esperar_texto(self.DETALLE, nombre)
