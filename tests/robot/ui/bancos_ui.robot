*** Settings ***
Documentation     Pruebas de UI del módulo Bancos (/configuracion/bancos).
Resource          ../resources/crud_keywords.robot
Suite Setup       Preparar Suite
Suite Teardown    Limpiar Suite
Test Setup        Ir Al Modulo    ${URL_BANCOS}    Gestión de Bancos
Test Tags         ui    bancos


*** Variables ***
${INPUT_NOMBRE}    css:.p-dialog input[type="text"]


*** Test Cases ***
Crear Banco Desde La UI
    [Tags]    smoke
    Abrir Dialogo Nuevo
    Escribir En Campo    ${INPUT_NOMBRE}    ${NOMBRE}
    Guardar Dialogo
    Toast Debe Mostrar    Banco creado
    Fila Debe Existir    ${NOMBRE}

Editar Banco Desde La UI
    Editar Fila    ${NOMBRE}
    Escribir En Campo    ${INPUT_NOMBRE}    ${NOMBRE} Editado
    Guardar Dialogo
    Toast Debe Mostrar    Banco actualizado
    Fila Debe Existir    ${NOMBRE} Editado

Eliminar Banco Desde La UI
    Eliminar Fila    ${NOMBRE} Editado
    Toast Debe Mostrar    Banco eliminado
    Fila No Debe Existir    ${NOMBRE} Editado

Guardar Banco Sin Nombre Muestra Validacion
    [Tags]    negativo
    Abrir Dialogo Nuevo
    Guardar Dialogo
    Toast Debe Mostrar    Ingresa el nombre
    Element Should Be Visible    ${DIALOGO}


*** Keywords ***
Preparar Suite
    Abrir Sistema Con Sesion Iniciada
    Crear Sesion API Autenticada
    ${sufijo}=    Generar Sufijo Unico
    Set Suite Variable    ${NOMBRE}    RF Banco UI ${sufijo}

Limpiar Suite
    Eliminar Por Nombre Via API    /banco    NombreBanco    ${NOMBRE}    IdBanco
    Cerrar Navegador
    Delete All Sessions
