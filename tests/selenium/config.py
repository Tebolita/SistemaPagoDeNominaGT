"""Configuración de las pruebas. Todo se puede sobreescribir con variables de entorno."""
import os

FRONT_URL = os.getenv("FRONT_URL", "http://localhost:4200").rstrip("/")
API_URL = os.getenv("API_URL", "http://localhost:4000/api").rstrip("/")

# Credenciales del usuario de prueba (debe tener rol ADMINISTRADOR para entrar a todos los módulos)
USUARIO = os.getenv("NOMINA_USER", "admin")
CONTRASENA = os.getenv("NOMINA_PASSWORD", "admin")
CLAVE = os.getenv("NOMINA_CLAVE", "1234")

# Alternativa a las credenciales: un token JWT ya emitido (p. ej. en integración continua).
# Si se define, la API y el navegador lo usan directamente sin pasar por el inicio de sesión.
TOKEN = os.getenv("NOMINA_TOKEN")

# Navegador: chrome | edge | firefox. HEADLESS=1 para ejecutar sin ventana.
BROWSER = os.getenv("BROWSER", "chrome").lower()
HEADLESS = os.getenv("HEADLESS", "0") == "1"
TIMEOUT = int(os.getenv("TIMEOUT", "10"))

# Prefijo de los datos que crean las pruebas, para identificarlos y limpiarlos
PREFIJO = "SEL"
