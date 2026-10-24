"""Acciones comunes sobre la app Angular + PrimeNG."""
from selenium.common.exceptions import ElementClickInterceptedException
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

import config


class BasePage:
    TOAST = (By.CSS_SELECTOR, ".p-toast")
    BTN_CONFIRMAR = (By.CSS_SELECTOR, ".p-confirmdialog-accept-button")

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, config.TIMEOUT)

    # ── Navegación ───────────────────────────────────────────────────
    def ir_a(self, ruta: str):
        self.driver.get(f"{config.FRONT_URL}{ruta}")

    def esperar_url(self, fragmento: str):
        self.wait.until(EC.url_contains(fragmento))

    @property
    def url(self) -> str:
        return self.driver.current_url

    # ── Elementos ────────────────────────────────────────────────────
    def visible(self, locator):
        return self.wait.until(EC.visibility_of_element_located(locator))

    def presente(self, locator):
        return self.wait.until(EC.presence_of_element_located(locator))

    def esperar_invisible(self, locator):
        return self.wait.until(EC.invisibility_of_element_located(locator))

    def existe(self, locator) -> bool:
        return len(self.driver.find_elements(*locator)) > 0

    def clic(self, locator):
        elemento = self.wait.until(EC.element_to_be_clickable(locator))
        try:
            elemento.click()
        except ElementClickInterceptedException:
            # Overlays de PrimeNG (tooltips, animaciones) a veces tapan el botón un instante
            self.driver.execute_script("arguments[0].click();", elemento)

    def escribir(self, locator, texto: str):
        """Reemplaza el contenido del campo. Usa Ctrl+A para que también funcione en p-inputNumber."""
        elemento = self.visible(locator)
        elemento.send_keys(Keys.CONTROL, "a")
        elemento.send_keys(Keys.BACKSPACE)
        elemento.send_keys(str(texto))

    def esperar_texto(self, locator, texto: str):
        self.wait.until(EC.text_to_be_present_in_element(locator, texto))

    def texto(self, locator) -> str:
        return self.visible(locator).text

    # ── PrimeNG ──────────────────────────────────────────────────────
    def toast(self, texto: str):
        """Espera a que aparezca un toast que contenga `texto`."""
        self.esperar_texto(self.TOAST, texto)

    def confirmar(self):
        self.clic(self.BTN_CONFIRMAR)

    def seleccionar_opcion(self, locator_select, opcion: str):
        """Abre un p-select y elige la opción por su texto visible."""
        self.clic(locator_select)
        self.clic((By.XPATH, f"//li[contains(@class,'p-select-option')][normalize-space()='{opcion}']"))

    # ── Sesión del navegador ─────────────────────────────────────────
    def local_storage(self, clave: str):
        return self.driver.execute_script("return window.localStorage.getItem(arguments[0]);", clave)

    def limpiar_sesion(self):
        self.driver.execute_script("window.localStorage.clear();")
