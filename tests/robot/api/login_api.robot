*** Settings ***
Documentation     Pruebas del endpoint de login del backend (NestJS).
Resource          ../resources/login_keywords.robot
Suite Setup       Crear Sesion API
Suite Teardown    Delete All Sessions


*** Test Cases ***
API Login Exitoso Devuelve Token
    [Tags]    api    smoke
    ${resp}=    Login API    ${VALID_USER}    ${VALID_PASSWORD}    ${VALID_CLAVE}
    Dictionary Should Contain Key    ${resp.json()}    access_token

API Login Con Contrasena Incorrecta Devuelve 401
    [Tags]    api    negativo
    Login API    ${VALID_USER}    ${INVALID_PASSWORD}    ${VALID_CLAVE}    status=401

API Perfil Con Token Valido
    [Tags]    api
    ${token}=      Obtener Token API
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${resp}=       GET On Session    api    /login/profile    headers=${headers}    expected_status=200
    Should Not Be Empty    ${resp.json()}

API Perfil Sin Token Devuelve 401
    [Tags]    api    negativo
    GET On Session    api    /login/profile    expected_status=401

API Logout
    [Tags]    api
    ${token}=      Obtener Token API
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    POST On Session    api    /login/logout    headers=${headers}    expected_status=200
