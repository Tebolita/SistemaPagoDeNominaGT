*** Settings ***
Documentation     Pruebas de UI del módulo Departamentos (/configuracion/departamentos).
Resource          ../resources/crud_keywords.robot
Suite Setup       Preparar Suite
Suite Teardown    Limpiar Suite
Test Setup        Ir Al Modulo    ${URL_DEPARTAMENTOS}    Gestión de Departamentos
Test Tags         ui    departamentos


*** Variables ***
${INPUT_NOMBRE}         css:.p-dialog input[placeholder="Ej: Recursos Humanos"]
${INPUT_PRESUPUESTO}    css:.p-dialog p-inputnumber input


*** Test Cases ***
Crear Departamento Con Presupuesto Desde La UI
    [Tags]    smoke
    Abrir Dialogo Nuevo
    Escribir En Campo    ${INPUT_NOMBRE}         ${NOMBRE}
    Escribir En Campo    ${INPUT_PRESUPUESTO}    25000
    Guardar Dialogo
    Toast Debe Mostrar    Departamento creado
    Fila Debe Existir    ${NOMBRE}
    ${fila}=    Fila De Tabla    ${NOMBRE}
    Element Should Contain    ${fila}    25,000.00

Editar Presupuesto Desde La UI
    Editar Fila    ${NOMBRE}
    Escribir En Campo    ${INPUT_PRESUPUESTO}    40000
    Guardar Dialogo
    Toast Debe Mostrar    Departamento actualizado
    ${fila}=    Fila De Tabla    ${NOMBRE}
    Wait Until Element Contains    ${fila}    40,000.00

Eliminar Departamento Desde La UI
    Eliminar Fila    ${NOMBRE}
    Toast Debe Mostrar    Departamento eliminado
    Fila No Debe Existir    ${NOMBRE}

Guardar Departamento Sin Nombre Muestra Validacion
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
    Set Suite Variable    ${NOMBRE}    RF Depto UI ${sufijo}

Limpiar Suite
    Eliminar Por Nombre Via API    /departamento    NombreDepartamento    ${NOMBRE}    IdDepartamento
    Cerrar Navegador
    Delete All Sessions
