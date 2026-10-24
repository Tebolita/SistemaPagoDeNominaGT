*** Settings ***
Documentation     CRUD del módulo Departamentos vía API (/api/departamento).
Resource          ../resources/crud_keywords.robot
Suite Setup       Preparar Suite
Suite Teardown    Limpiar Suite
Test Tags         api    departamentos


*** Variables ***
${ID_DEPTO}    ${EMPTY}


*** Test Cases ***
Crear Departamento Con Presupuesto
    [Tags]    smoke
    ${body}=    Create Dictionary    NombreDepartamento=${NOMBRE}    Presupuesto=${50000}
    ${resp}=    POST On Session    auth    /departamento    json=${body}    expected_status=201
    Should Be Equal    ${resp.json()}[NombreDepartamento]    ${NOMBRE}
    Set Suite Variable    ${ID_DEPTO}    ${resp.json()}[IdDepartamento]

Listar Departamentos Incluye Presupuesto Usado
    ${resp}=    GET On Session    auth    /departamento    expected_status=200
    Lista Debe Contener    ${resp.json()}    NombreDepartamento    ${NOMBRE}
    ${depto}=    Evaluate    [d for d in $resp.json() if d['IdDepartamento'] == ${ID_DEPTO}][0]
    Should Be Equal As Numbers    ${depto}[Presupuesto]          50000
    Should Be Equal As Numbers    ${depto}[PresupuestoUsado]     0

Consultar Departamento Por Id
    ${resp}=    GET On Session    auth    /departamento/${ID_DEPTO}    expected_status=200
    Should Be Equal    ${resp.json()}[NombreDepartamento]    ${NOMBRE}

Actualizar Presupuesto Del Departamento
    ${body}=    Create Dictionary    Presupuesto=${75000}
    PATCH On Session    auth    /departamento/${ID_DEPTO}    json=${body}    expected_status=200
    ${resp}=    GET On Session    auth    /departamento/${ID_DEPTO}    expected_status=200
    Should Be Equal As Numbers    ${resp.json()}[Presupuesto]    75000

Eliminar Departamento Lo Quita Del Listado
    DELETE On Session    auth    /departamento/${ID_DEPTO}    expected_status=200
    ${resp}=    GET On Session    auth    /departamento    expected_status=200
    Lista No Debe Contener    ${resp.json()}    IdDepartamento    ${ID_DEPTO}
    Set Suite Variable    ${ID_DEPTO}    ${EMPTY}

Crear Departamento Con Presupuesto Negativo Devuelve 400
    [Tags]    negativo
    ${body}=    Create Dictionary    NombreDepartamento=${NOMBRE} Negativo    Presupuesto=${-100}
    POST On Session    auth    /departamento    json=${body}    expected_status=400


*** Keywords ***
Preparar Suite
    Crear Sesion API Autenticada
    ${sufijo}=    Generar Sufijo Unico
    Set Suite Variable    ${NOMBRE}    RF Depto API ${sufijo}

Limpiar Suite
    Eliminar Por API Si Existe    /departamento    ${ID_DEPTO}
    Delete All Sessions
