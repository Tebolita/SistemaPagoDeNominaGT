from selenium.webdriver.common.by import By

from pages.base_page import BasePage


class MenuPage(BasePage):
    """Menú lateral (componente app-menu) que aparece en todas las pantallas internas."""

    BTN_AVATAR = (By.CSS_SELECTOR, ".avatar-button")
    NOMBRE_USUARIO = (By.CSS_SELECTOR, ".avatar-button span.font-semibold")
    OPCION_CERRAR_SESION = (By.XPATH, "//span[normalize-space()='Cerrar Sesión']")

    def cerrar_sesion(self):
        self.clic(self.BTN_AVATAR)
        self.clic(self.OPCION_CERRAR_SESION)

    def enlace(self, texto: str):
        return (By.XPATH, f"//a[contains(@class,'menu-link')][.//span[normalize-space()='{texto}']]")

    def ir_por_menu(self, texto: str):
        self.clic(self.enlace(texto))
