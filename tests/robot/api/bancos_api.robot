*** Settings ***
Documentation     CRUD del módulo Bancos vía API (/api/banco).
...               Los casos se ejecutan en orden: crear → consultar → actualizar → eliminar.
Resource          ../resources/crud_keywords.robot
Suite Setup       Preparar Suite
Suite Teardown    Limpiar Suite
Test Tags         api    bancos


*** Variables ***
${ID_BANCO}    ${EMPTY}


*** Test Cases ***
Crear Banco
    [Tags]    smoke
    ${body}=    Create Dictionary    NombreBanco=${NOMBRE}
    ${resp}=    POST On Session    auth    /banco    json=${body}    expected_status=201
    Should Be Equal    ${resp.json()}[NombreBanco]    ${NOMBRE}
    Set Suite Variable    ${ID_BANCO}    ${resp.json()}[IdBanco]

Listar Bancos Incluye El Creado
    ${resp}=    GET On Session    auth    /banco    expected_status=200
    Lista Debe Contener    ${resp.json()}    NombreBanco    ${NOMBRE}

Consultar Banco Por Id
    ${resp}=    GET On Session    auth    /banco/${ID_BANCO}    expected_status=200
    Should Be Equal    ${resp.json()}[NombreBanco]    ${NOMBRE}

Actualizar Banco
    ${body}=    Create Dictionary    NombreBanco=${NOMBRE} Editado
    ${resp}=    PATCH On Session    auth    /banco/${ID_BANCO}    json=${body}    expected_status=200
    Should Be Equal    ${resp.json()}[NombreBanco]    ${NOMBRE} Editado

Eliminar Banco Lo Quita Del Listado
    DELETE On Session    auth    /banco/${ID_BANCO}    expected_status=200
    ${resp}=    GET On Session    auth    /banco    expected_status=200
    Lista No Debe Contener    ${resp.json()}    IdBanco    ${ID_BANCO}
    Set Suite Variable    ${ID_BANCO}    ${EMPTY}

Crear Banco Sin Nombre Devuelve 400
    [Tags]    negativo
    ${body}=    Create Dictionary    NombreBanco=${EMPTY}
    POST On Session    auth    /banco    json=${body}    expected_status=400

Listar Bancos Sin Token Devuelve 401
    [Tags]    negativo
    GET On Session    api    /banco    expected_status=401


*** Keywords ***
Preparar Suite
    Crear Sesion API Autenticada
    ${sufijo}=    Generar Sufijo Unico
    Set Suite Variable    ${NOMBRE}    RF Banco API ${sufijo}

Limpiar Suite
    Eliminar Por API Si Existe    /banco    ${ID_BANCO}
    Delete All Sessions
