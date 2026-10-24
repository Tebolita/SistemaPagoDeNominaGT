*** Settings ***
Documentation     CRUD del módulo Empleados vía API (/api/empleado).
...               Usa el primer puesto y la primera jornada que existan en la base de datos.
...               Ojo: DELETE en empleado alterna Activo (baja/reactivación), no borra el registro.
Resource          ../resources/crud_keywords.robot
Suite Setup       Preparar Suite
Suite Teardown    Delete All Sessions
Test Tags         api    empleados


*** Variables ***
${ID_EMPLEADO}    ${EMPTY}


*** Test Cases ***
Crear Empleado
    [Tags]    smoke
    ${body}=    Datos De Empleado
    ${resp}=    POST On Session    auth    /empleado/CrearEmpleado    json=${body}    expected_status=201
    Should Contain    ${resp.json()}[message]    ${NOMBRES}
    Set Suite Variable    ${ID_EMPLEADO}    ${resp.json()}[id]

Consultar Empleado Por Id
    ${resp}=    GET On Session    auth    /empleado/${ID_EMPLEADO}    expected_status=200
    Should Be Equal    ${resp.json()}[DPI]        ${DPI}
    Should Be Equal    ${resp.json()}[Nombres]    ${NOMBRES}
    Should Be True     ${resp.json()}[Activo]

Listar Empleados Incluye Nombre Completo
    ${resp}=    GET On Session    auth    /empleado    expected_status=200
    Lista Debe Contener    ${resp.json()}    NombreCompleto    ${NOMBRES} Prueba

Actualizar Telefono Del Empleado
    ${body}=    Create Dictionary    Telefono=55554444
    PATCH On Session    auth    /empleado/${ID_EMPLEADO}    json=${body}    expected_status=200
    ${resp}=    GET On Session    auth    /empleado/${ID_EMPLEADO}    expected_status=200
    Should Be Equal    ${resp.json()}[Telefono]    55554444

Dar De Baja Al Empleado
    DELETE On Session    auth    /empleado/${ID_EMPLEADO}    expected_status=200
    ${resp}=    GET On Session    auth    /empleado/${ID_EMPLEADO}    expected_status=200
    Should Not Be True    ${resp.json()}[Activo]

Crear Empleado Con Correo Invalido Devuelve 400
    [Tags]    negativo
    ${body}=    Datos De Empleado
    Set To Dictionary    ${body}    CorreoPersonal=no-es-un-correo
    POST On Session    auth    /empleado/CrearEmpleado    json=${body}    expected_status=400

Listar Empleados Sin Token Devuelve 401
    [Tags]    negativo
    GET On Session    api    /empleado    expected_status=401


*** Keywords ***
Preparar Suite
    Crear Sesion API Autenticada
    ${sufijo}=    Generar Sufijo Unico
    Set Suite Variable    ${NOMBRES}    RF Empleado ${sufijo}
    ${dpi}=    Generar Numero Aleatorio    13
    Set Suite Variable    ${DPI}    ${dpi}
    ${puestos}=     GET On Session    auth    /puesto    expected_status=200
    ${jornadas}=    GET On Session    auth    /jornada-laboral    expected_status=200
    Skip If    not $puestos.json() or not $jornadas.json()    Se necesita al menos un puesto y una jornada en la BD
    Set Suite Variable    ${ID_PUESTO}     ${puestos.json()}[0][IdPuesto]
    Set Suite Variable    ${ID_JORNADA}    ${jornadas.json()}[0][IdJornada]

Datos De Empleado
    ${nit}=    Generar Numero Aleatorio    8
    ${body}=    Create Dictionary
    ...    DPI=${DPI}
    ...    NIT=${nit}
    ...    Nombres=${NOMBRES}
    ...    Apellidos=Prueba
    ...    CorreoPersonal=rf.${DPI}@pruebas.com
    ...    IdPuesto=${ID_PUESTO}
    ...    IdJornada=${ID_JORNADA}
    ...    Telefono=55551234
    ...    Genero=${False}
    RETURN    ${body}
