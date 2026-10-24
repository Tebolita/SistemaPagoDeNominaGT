*** Settings ***
Documentation     Pruebas de UI del módulo Puestos (/configuracion/puestos).
...               Crea por API un departamento temporal para poder asignarlo al puesto.
Resource          ../resources/crud_keywords.robot
Suite Setup       Preparar Suite
Suite Teardown    Limpiar Suite
Test Setup        Ir Al Modulo    ${URL_PUESTOS}    Gestión de Puestos
Test Tags         ui    puestos


*** Variables ***
${INPUT_NOMBRE}      css:.p-dialog input[type="text"]
${SELECT_DEPTO}      css:.p-dialog p-select
${ID_DEPTO}          ${EMPTY}


*** Test Cases ***
Crear Puesto Desde La UI
    [Tags]    smoke
    Abrir Dialogo Nuevo
    Escribir En Campo    ${INPUT_NOMBRE}    ${NOMBRE}
    Seleccionar Opcion    ${SELECT_DEPTO}    ${NOMBRE_DEPTO}
    Guardar Dialogo
    Toast Debe Mostrar    Puesto creado
    Fila Debe Existir    ${NOMBRE}
    ${fila}=    Fila De Tabla    ${NOMBRE}
    Element Should Contain    ${fila}    ${NOMBRE_DEPTO}

Editar Puesto Desde La UI
    Editar Fila    ${NOMBRE}
    Escribir En Campo    ${INPUT_NOMBRE}    ${NOMBRE} Editado
    Guardar Dialogo
    Toast Debe Mostrar    Puesto actualizado
    Fila Debe Existir    ${NOMBRE} Editado

Eliminar Puesto Desde La UI
    Eliminar Fila    ${NOMBRE} Editado
    Toast Debe Mostrar    Puesto eliminado
    Fila No Debe Existir    ${NOMBRE} Editado

Guardar Puesto Sin Departamento Muestra Validacion
    [Tags]    negativo
    Abrir Dialogo Nuevo
    Escribir En Campo    ${INPUT_NOMBRE}    ${NOMBRE} Sin Depto
    Guardar Dialogo
    Toast Debe Mostrar    Completa todos los campos
    Element Should Be Visible    ${DIALOGO}


*** Keywords ***
Preparar Suite
    Crear Sesion API Autenticada
    ${sufijo}=    Generar Sufijo Unico
    Set Suite Variable    ${NOMBRE}          RF Puesto UI ${sufijo}
    Set Suite Variable    ${NOMBRE_DEPTO}    RF Depto Puestos UI ${sufijo}
    ${body}=    Create Dictionary    NombreDepartamento=${NOMBRE_DEPTO}
    ${resp}=    POST On Session    auth    /departamento    json=${body}    expected_status=201
    Set Suite Variable    ${ID_DEPTO}    ${resp.json()}[IdDepartamento]
    Abrir Sistema Con Sesion Iniciada

Limpiar Suite
    Eliminar Por Nombre Via API    /puesto    NombrePuesto    ${NOMBRE}    IdPuesto
    Eliminar Por API Si Existe     /departamento    ${ID_DEPTO}
    Cerrar Navegador
    Delete All Sessions
