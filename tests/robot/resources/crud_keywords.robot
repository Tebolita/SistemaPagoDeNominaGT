*** Settings ***
Documentation    Keywords compartidos para probar los módulos CRUD (UI con PrimeNG y API con token).
Resource         login_keywords.robot


*** Keywords ***
# ───────────────────────── Datos de prueba ─────────────────────────
Generar Sufijo Unico
    [Documentation]    Devuelve un sufijo basado en la hora para que los nombres no choquen entre ejecuciones.
    ${sufijo}=    Get Time    epoch
    RETURN    ${sufijo}

Generar Numero Aleatorio
    [Arguments]    ${digitos}
    ${numero}=    Evaluate    ''.join(random.choices('0123456789', k=${digitos}))    modules=random
    RETURN    ${numero}

# ───────────────────────── UI ─────────────────────────
Abrir Sistema Con Sesion Iniciada
    [Documentation]    Abre el navegador e inicia sesión una sola vez para toda la suite.
    Abrir Pantalla De Login
    Iniciar Sesion
    Debe Estar En El Inicio

Ir Al Modulo
    [Arguments]    ${url}    ${titulo}
    Go To    ${url}
    Wait Until Page Contains Element    xpath://h1[contains(normalize-space(), '${titulo}')]

Abrir Dialogo Nuevo
    Click Button    ${BTN_NUEVO}
    Wait Until Element Is Visible    ${DIALOGO}

Guardar Dialogo
    Click Button    ${BTN_GUARDAR}

Escribir En Campo
    [Arguments]    ${locator}    ${texto}
    Wait Until Element Is Visible    ${locator}
    Clear Element Text    ${locator}
    Input Text    ${locator}    ${texto}

Seleccionar Opcion
    [Documentation]    Abre un p-select y elige la opción por su texto visible.
    [Arguments]    ${locator_select}    ${texto}
    Click Element    ${locator_select}
    ${opcion}=    Set Variable    xpath://li[contains(@class,'p-select-option')][normalize-space()='${texto}']
    Wait Until Element Is Visible    ${opcion}
    Click Element    ${opcion}

Toast Debe Mostrar
    [Arguments]    ${texto}
    Wait Until Element Contains    ${TOAST}    ${texto}

Fila De Tabla
    [Arguments]    ${texto}
    RETURN    xpath://tr[td[normalize-space()='${texto}']]

Fila Debe Existir
    [Arguments]    ${texto}
    ${fila}=    Fila De Tabla    ${texto}
    Wait Until Page Contains Element    ${fila}

Fila No Debe Existir
    [Arguments]    ${texto}
    ${fila}=    Fila De Tabla    ${texto}
    Wait Until Page Does Not Contain Element    ${fila}

Editar Fila
    [Arguments]    ${texto}
    ${fila}=    Fila De Tabla    ${texto}
    Click Button    ${fila}//p-button[@icon='pi pi-pencil']//button
    Wait Until Element Is Visible    ${DIALOGO}

Eliminar Fila
    [Arguments]    ${texto}
    ${fila}=    Fila De Tabla    ${texto}
    Click Button    ${fila}//p-button[@icon='pi pi-trash']//button
    Confirmar Accion

Confirmar Accion
    Wait Until Element Is Visible    ${BTN_CONFIRMAR}
    Click Button    ${BTN_CONFIRMAR}

# ───────────────────────── API ─────────────────────────
Crear Sesion API Autenticada
    [Documentation]    Crea la sesión "auth" con el token Bearer del usuario de prueba.
    Crear Sesion API
    ${token}=      Obtener Token API
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    Create Session    auth    ${API_URL}    headers=${headers}    verify=${False}

Lista Debe Contener
    [Documentation]    Verifica que una lista JSON tenga un elemento con ${campo} == ${valor}.
    [Arguments]    ${lista}    ${campo}    ${valor}
    ${encontrados}=    Evaluate    [x for x in $lista if x.get('${campo}') == $valor]
    Should Not Be Empty    ${encontrados}    No se encontró ${campo}=${valor} en la lista

Lista No Debe Contener
    [Arguments]    ${lista}    ${campo}    ${valor}
    ${encontrados}=    Evaluate    [x for x in $lista if x.get('${campo}') == $valor]
    Should Be Empty    ${encontrados}    Se encontró ${campo}=${valor} y no debería estar

Eliminar Por API Si Existe
    [Documentation]    Limpieza silenciosa para los teardowns (no falla si ya no existe).
    [Arguments]    ${ruta}    ${id}
    IF    $id    Run Keyword And Ignore Error    DELETE On Session    auth    ${ruta}/${id}

Eliminar Por Nombre Via API
    [Documentation]    Borra los registros cuyo ${campo} empiece con ${prefijo}.
    ...                Sirve para limpiar lo que hayan dejado las pruebas de UI si fallaron a medias.
    [Arguments]    ${ruta}    ${campo}    ${prefijo}    ${campo_id}
    ${status}    ${resp}=    Run Keyword And Ignore Error    GET On Session    auth    ${ruta}
    IF    $status != 'PASS'    RETURN
    FOR    ${item}    IN    @{resp.json()}
        ${valor}=    Evaluate    str($item.get($campo) or '')
        IF    $valor.startswith($prefijo)
            Eliminar Por API Si Existe    ${ruta}    ${item}[${campo_id}]
        END
    END
