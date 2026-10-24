*** Settings ***
Library     SeleniumLibrary
Library     RequestsLibrary
Library     Collections
Resource    variables.robot


*** Keywords ***
# ───────────────────────── UI ─────────────────────────
Abrir Pantalla De Login
    Open Browser    ${FRONT_URL}/login    ${BROWSER}
    Maximize Browser Window
    Set Selenium Timeout    ${TIMEOUT}
    Wait Until Element Is Visible    ${INPUT_USER}

Cerrar Navegador
    Close All Browsers

Limpiar Sesion
    Execute Javascript    window.localStorage.clear();
    Delete All Cookies
    Go To    ${FRONT_URL}/login
    Wait Until Element Is Visible    ${INPUT_USER}

Llenar Formulario De Login
    [Arguments]    ${usuario}    ${contrasena}    ${clave}
    Input Text        ${INPUT_USER}        ${usuario}
    Input Password    ${INPUT_PASSWORD}    ${contrasena}
    Input Text        ${INPUT_CLAVE}       ${clave}

Presionar Ingresar
    Click Button    ${BTN_INGRESAR}

Iniciar Sesion
    [Documentation]    Login completo por UI con las credenciales indicadas.
    [Arguments]    ${usuario}=${VALID_USER}    ${contrasena}=${VALID_PASSWORD}    ${clave}=${VALID_CLAVE}
    Llenar Formulario De Login    ${usuario}    ${contrasena}    ${clave}
    Presionar Ingresar

Debe Estar En El Inicio
    Wait Until Location Contains    /home/inicio
    # La sesión vive en una cookie httpOnly: en localStorage solo queda su vigencia, nunca el JWT
    ${expira}=    Execute Javascript    return window.localStorage.getItem('sesion_expira');
    Should Not Be Empty    ${expira}    No se registró la sesión en el navegador
    ${token}=    Execute Javascript    return window.localStorage.getItem('access_token');
    Should Be Equal    ${token}    ${None}    El JWT no debe quedar en localStorage

Debe Mostrar Error
    [Arguments]    ${mensaje}
    Wait Until Element Contains    ${MSG_ERROR}    ${mensaje}
    Location Should Contain    /login

# ───────────────────────── API ─────────────────────────
Crear Sesion API
    Create Session    api    ${API_URL}    verify=${False}

Login API
    [Documentation]    Hace POST /login/login y devuelve la respuesta.
    [Arguments]    ${usuario}    ${contrasena}    ${clave}    ${status}=200
    ${body}=    Create Dictionary    Username=${usuario}    Contrasena=${contrasena}    Clave=${{ int(${clave}) }}
    ${resp}=    POST On Session    api    /login/login    json=${body}    expected_status=${status}
    RETURN    ${resp}

Obtener Token API
    [Documentation]    Devuelve un access_token válido para reutilizar en otras pruebas de API.
    ${resp}=    Login API    ${VALID_USER}    ${VALID_PASSWORD}    ${VALID_CLAVE}
    RETURN    ${resp.json()}[access_token]
