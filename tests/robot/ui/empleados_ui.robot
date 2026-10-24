*** Settings ***
Documentation     Pruebas de UI del módulo Empleados (/recursoshumanos/empleados).
...               Usa el primer puesto y la primera jornada que existan en la base de datos.
...               El empleado creado queda dado de baja (inactivo) al final, porque el
...               sistema no borra empleados.
Resource          ../resources/crud_keywords.robot
Suite Setup       Preparar Suite
Suite Teardown    Run Keywords    Cerrar Navegador    AND    Delete All Sessions
Test Setup        Ir Al Modulo    ${URL_EMPLEADOS}    Empleados
Test Tags         ui    empleados


*** Variables ***
${BTN_NUEVO_EMPLEADO}    css:p-button[label="Nuevo Empleado"] button
${INPUT_BUSCAR}          css:input[placeholder="Buscar empleado..."]
${DETALLE}               css:.detail-header
${BTN_BAJA}              xpath://div[contains(@class,'detail-header')]//button[.//*[contains(@class,'pi-user-minus')]]
${CAMPO_DIALOGO}         xpath://div[contains(@class,'p-dialog')]//div[contains(@class,'field-group')]
${SELECT_PUESTO}         ${CAMPO_DIALOGO}\[label[normalize-space()='Puesto *']]//p-select
${SELECT_JORNADA}        ${CAMPO_DIALOGO}\[label[normalize-space()='Jornada *']]//p-select


*** Test Cases ***
Guardar Empleado Vacio Muestra Validacion
    [Tags]    negativo
    Click Button    ${BTN_NUEVO_EMPLEADO}
    Wait Until Element Is Visible    ${DIALOGO}
    Guardar Dialogo
    Wait Until Element Contains    ${DIALOGO}    Por favor completa los campos obligatorios
    Click Button    ${BTN_CANCELAR}
    Wait Until Element Is Not Visible    ${DIALOGO}

Crear Empleado Desde La UI
    [Tags]    smoke
    Click Button    ${BTN_NUEVO_EMPLEADO}
    Wait Until Element Is Visible    ${DIALOGO}
    Llenar Campo Empleado    Nombres *       ${NOMBRES}
    Llenar Campo Empleado    Apellidos *     Prueba UI
    Llenar Campo Empleado    DPI *           ${DPI}
    Llenar Campo Empleado    NIT             ${NIT}
    Llenar Campo Empleado    Correo          rf.${DPI}@pruebas.com
    Llenar Campo Empleado    Teléfono        55551234
    Seleccionar Opcion    ${SELECT_PUESTO}     ${NOMBRE_PUESTO}
    Seleccionar Opcion    ${SELECT_JORNADA}    ${NOMBRE_JORNADA}
    Guardar Dialogo
    Toast Debe Mostrar    Se creó el empleado

Buscar Empleado Por Nombre
    Escribir En Campo    ${INPUT_BUSCAR}    ${NOMBRES}
    ${chip}=    Chip De Empleado    ${NOMBRES}
    Wait Until Element Is Visible    ${chip}

Ver Detalle Del Empleado
    Seleccionar Empleado    ${NOMBRES}
    Element Should Contain    ${DETALLE}    ${NOMBRES} Prueba UI
    Element Should Contain    ${DETALLE}    Activo

Dar De Baja Al Empleado Desde La UI
    Seleccionar Empleado    ${NOMBRES}
    Click Button    ${BTN_BAJA}
    Confirmar Accion
    Toast Debe Mostrar    Empleado actualizado


*** Keywords ***
Preparar Suite
    Crear Sesion API Autenticada
    ${sufijo}=    Generar Sufijo Unico
    Set Suite Variable    ${NOMBRES}    RF UI ${sufijo}
    ${dpi}=    Generar Numero Aleatorio    13
    ${nit}=    Generar Numero Aleatorio    8
    Set Suite Variable    ${DPI}    ${dpi}
    Set Suite Variable    ${NIT}    ${nit}
    ${puestos}=     GET On Session    auth    /puesto    expected_status=200
    ${jornadas}=    GET On Session    auth    /jornada-laboral    expected_status=200
    Skip If    not $puestos.json() or not $jornadas.json()    Se necesita al menos un puesto y una jornada en la BD
    Set Suite Variable    ${NOMBRE_PUESTO}     ${puestos.json()}[0][NombrePuesto]
    Set Suite Variable    ${NOMBRE_JORNADA}    ${jornadas.json()}[0][NombreJornada]
    Abrir Sistema Con Sesion Iniciada

Llenar Campo Empleado
    [Documentation]    Escribe en el input del diálogo "Nuevo Empleado" ubicado por su etiqueta.
    [Arguments]    ${etiqueta}    ${texto}
    Escribir En Campo    ${CAMPO_DIALOGO}\[label[normalize-space()='${etiqueta}']]//input    ${texto}

Chip De Empleado
    [Arguments]    ${nombre}
    RETURN    xpath://button[contains(@class,'emp-chip')][contains(., '${nombre}')]

Seleccionar Empleado
    [Arguments]    ${nombre}
    Escribir En Campo    ${INPUT_BUSCAR}    ${nombre}
    ${chip}=    Chip De Empleado    ${nombre}
    Click Button    ${chip}
    Wait Until Element Contains    ${DETALLE}    ${nombre}
