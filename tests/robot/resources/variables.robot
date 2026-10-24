*** Variables ***
# URLs (se pueden sobreescribir con --variable FRONT_URL:http://...)
${FRONT_URL}          http://localhost:4200
${API_URL}            http://localhost:4000/api
${BROWSER}            chrome
${TIMEOUT}            10s

# Credenciales válidas: se leen de variables de entorno para no subirlas al repo
${VALID_USER}         %{NOMINA_USER=admin}
${VALID_PASSWORD}     %{NOMINA_PASSWORD=admin}
${VALID_CLAVE}        %{NOMINA_CLAVE=1234}

# Credenciales inválidas
${INVALID_PASSWORD}   contrasena_incorrecta_123

# Locators de la pantalla de login
${INPUT_USER}         id:userInput
${INPUT_PASSWORD}     css:p-password input
${INPUT_CLAVE}        id:codeInput
${BTN_INGRESAR}       css:button[label="Ingresar"]
${MSG_ERROR}          css:p.text-red-300

# Rutas de los módulos en el frontend
${URL_BANCOS}          ${FRONT_URL}/configuracion/bancos
${URL_DEPARTAMENTOS}   ${FRONT_URL}/configuracion/departamentos
${URL_PUESTOS}         ${FRONT_URL}/configuracion/puestos
${URL_EMPLEADOS}       ${FRONT_URL}/recursoshumanos/empleados

# Locators comunes de PrimeNG (tablas, diálogos, toasts y confirmaciones)
${BTN_NUEVO}           css:p-button[label="Nuevo"] button
${DIALOGO}             css:.p-dialog
${BTN_GUARDAR}         css:.p-dialog p-button[label="Guardar"] button
${BTN_CANCELAR}        css:.p-dialog p-button[label="Cancelar"] button
${TOAST}               css:.p-toast
${BTN_CONFIRMAR}       css:.p-confirmdialog-accept-button
