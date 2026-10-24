from selenium.webdriver.common.by import By

import config
from pages.base_page import BasePage


class LoginPage(BasePage):
    RUTA = "/login"

    INPUT_USUARIO = (By.ID, "userInput")
    INPUT_CONTRASENA = (By.CSS_SELECTOR, "p-password input")
    INPUT_CLAVE = (By.ID, "codeInput")
    BTN_INGRESAR = (By.CSS_SELECTOR, 'button[label="Ingresar"]')
    MSG_ERROR = (By.CSS_SELECTOR, "p.text-red-300")
    SALUDO = (By.CSS_SELECTOR, "h2")

    def abrir(self):
        self.ir_a(self.RUTA)
        self.visible(self.INPUT_USUARIO)
        return self

    def llenar(self, usuario="", contrasena="", clave=""):
        if usuario:
            self.escribir(self.INPUT_USUARIO, usuario)
        if contrasena:
            self.escribir(self.INPUT_CONTRASENA, contrasena)
        if clave:
            self.escribir(self.INPUT_CLAVE, clave)

    def ingresar(self, usuario=None, contrasena=None, clave=None):
        self.llenar(
            usuario if usuario is not None else config.USUARIO,
            contrasena if contrasena is not None else config.CONTRASENA,
            clave if clave is not None else config.CLAVE,
        )
        self.clic(self.BTN_INGRESAR)

    def esperar_error(self, texto: str = ""):
        if texto:
            self.esperar_texto(self.MSG_ERROR, texto)
        else:
            self.wait.until(lambda d: self.driver.find_element(*self.MSG_ERROR).text.strip() != "")
        return self.driver.find_element(*self.MSG_ERROR).text
