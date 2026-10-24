*** Settings ***
Documentation     Pruebas de UI del login del sistema de nómina (Angular).
...               Requiere frontend en ${FRONT_URL} y backend en ${API_URL} levantados.
Resource          ../resources/login_keywords.robot
Suite Setup       Abrir Pantalla De Login
Suite Teardown    Cerrar Navegador
Test Setup        Limpiar Sesion


*** Test Cases ***
Login Exitoso
    [Tags]    smoke    login
    Iniciar Sesion
    Debe Estar En El Inicio

Login Con Contrasena Incorrecta
    [Tags]    login    negativo
    Iniciar Sesion    contrasena=${INVALID_PASSWORD}
    Debe Mostrar Error    incorrect

Login Con Usuario Inexistente
    [Tags]    login    negativo
    Iniciar Sesion    usuario=usuario_que_no_existe_xyz
    Page Should Contain Element    ${MSG_ERROR}
    Location Should Contain    /login

Login Con Campos Vacios
    [Tags]    login    negativo
    Presionar Ingresar
    Debe Mostrar Error    Todos los campos son requeridos

Ruta Protegida Sin Sesion Redirige Al Login
    [Tags]    login    guard
    Go To    ${FRONT_URL}/home/inicio
    Wait Until Location Contains    /login
