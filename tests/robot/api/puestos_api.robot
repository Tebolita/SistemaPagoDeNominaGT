*** Settings ***
Documentation     CRUD del módulo Puestos vía API (/api/puesto).
...               Crea un departamento temporal porque todo puesto pertenece a uno.
Resource          ../resources/crud_keywords.robot
Suite Setup       Preparar Suite
Suite Teardown    Limpiar Suite
Test Tags         api    puestos


*** Variables ***
${ID_PUESTO}    ${EMPTY}
${ID_DEPTO}     ${EMPTY}


*** Test Cases ***
Crear Puesto
    [Tags]    smoke
    ${body}=    Create Dictionary    NombrePuesto=${NOMBRE}    IdDepartamento=${ID_DEPTO}
    ${resp}=    POST On Session    auth    /puesto    json=${body}    expected_status=201
    Should Be Equal    ${resp.json()}[NombrePuesto]    ${NOMBRE}
    Set Suite Variable    ${ID_PUESTO}    ${resp.json()}[IdPuesto]

Consultar Puesto Incluye Su Departamento
    ${resp}=    GET On Session    auth    /puesto/${ID_PUESTO}    expected_status=200
    Should Be Equal    ${resp.json()}[NombrePuesto]    ${NOMBRE}
    Should Be Equal As Integers    ${resp.json()}[Departamento][IdDepartamento]    ${ID_DEPTO}

Listar Puestos Incluye El Creado
    ${resp}=    GET On Session    auth    /puesto    expected_status=200
    Lista Debe Contener    ${resp.json()}    NombrePuesto    ${NOMBRE}

Actualizar Puesto
    ${body}=    Create Dictionary    NombrePuesto=${NOMBRE} Editado
    ${resp}=    PATCH On Session    auth    /puesto/${ID_PUESTO}    json=${body}    expected_status=200
    Should Be Equal    ${resp.json()}[NombrePuesto]    ${NOMBRE} Editado

Eliminar Puesto Lo Quita Del Listado
    DELETE On Session    auth    /puesto/${ID_PUESTO}    expected_status=200
    ${resp}=    GET On Session    auth    /puesto    expected_status=200
    Lista No Debe Contener    ${resp.json()}    IdPuesto    ${ID_PUESTO}
    Set Suite Variable    ${ID_PUESTO}    ${EMPTY}

Crear Puesto Sin Departamento Devuelve 400
    [Tags]    negativo
    ${body}=    Create Dictionary    NombrePuesto=${NOMBRE} Sin Depto
    POST On Session    auth    /puesto    json=${body}    expected_status=400


*** Keywords ***
Preparar Suite
    Crear Sesion API Autenticada
    ${sufijo}=    Generar Sufijo Unico
    Set Suite Variable    ${NOMBRE}    RF Puesto API ${sufijo}
    ${body}=    Create Dictionary    NombreDepartamento=RF Depto Puestos ${sufijo}
    ${resp}=    POST On Session    auth    /departamento    json=${body}    expected_status=201
    Set Suite Variable    ${ID_DEPTO}    ${resp.json()}[IdDepartamento]

Limpiar Suite
    Eliminar Por API Si Existe    /puesto          ${ID_PUESTO}
    Eliminar Por API Si Existe    /departamento    ${ID_DEPTO}
    Delete All Sessions
