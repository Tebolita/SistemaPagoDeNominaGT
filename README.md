# ESTRUCTURA DE DESGLOSE DEL TRABAJO (EDT) - SISTEMA DE PAGO DE NÓMINA
## Proyecto: Sistema Integral de Gestión de Recursos Humanos y Finanzas
## Fecha: Abril 2026
## Versión: 2.0 - Actualizado con funcionalidades extendidas

---

## 📊 **RESUMEN EJECUTIVO**

### **Estado General del Proyecto:**
- ✅ **Fase 1 (Datos Maestros RRHH)**: 100% Completada
- ✅ **Fase 2 (Nómina Básica)**: 100% Completada
- ✅ **Fase 3 (Estados de Nómina)**: 100% Completada
- ✅ **Fase 4 (Reportería y Exportación)**: 100% Completada
- ✅ **Fase 5 (Ventas y Clientes)**: 100% Completada
- ✅ **Fase 6 (Finanzas y Capital)**: 100% Completada
- 🟡 **Fase 7 (Estadísticas y Eficiencia)**: 0% Implementada
- 🟡 **Fase 8 (Reportes Avanzados)**: 0% Implementada

### **Tecnologías Utilizadas:**
- **Backend**: NestJS 11+, Prisma ORM, SQL Server
- **Frontend**: Angular 17+, PrimeNG 21, Signals
- **Autenticación**: JWT con Guards
- **Base de Datos**: SQL Server con Soft Delete

---

## 🎯 **DIAGRAMA GENERAL ACTUALIZADO**

```mermaid
flowchart TD
    subgraph SEG[FASE 1: Seguridad y Usuarios ✅]
        U1[Gestión de Usuarios]
        U2[Autenticación JWT]
        U3[Roles y Permisos]
        U4[Empresa]
    end

    subgraph RRHH[FASE 1: Datos Maestros RRHH ✅]
        E1[Empleado - CRM]
        E2[Departamento]
        E3[Puesto]
        E4[Jornada Laboral]
        E5[Banco]
        E6[Historial Salario]
    end

    subgraph NOM[FASE 2: Nómina Básica ✅]
        N1[Encabezado Nómina]
        N2[Detalle Nómina]
        N3[Cálculos Guatemala]
        N4[Envío Boletas]
    end

    subgraph EST[FASE 3: Estados de Nómina ✅]
        ES1[Estados de Nómina]
        ES2[Flujo de Aprobación]
        ES3[Historial de Cambios]
        ES4[Notificaciones]
    end

    subgraph REP[FASE 4: Reportería y Exportación ✅]
        R1[Reportes RRHH]
        R2[Reportes Nómina]
        R3[Exportación Excel]
        R4[Exportación PDF]
    end

    subgraph VEN[FASE 5: Ventas y Clientes ✅]
        V1[Gestión de Clientes]
        V2[Productos/Servicios]
        V3[Facturación]
        V4[Estados de Pago]
    end

    subgraph FIN[FASE 6: Finanzas y Capital ✅]
        F1[Cuentas Bancarias]
        F2[Movimientos Financieros]
        F3[Control de Capital]
        F4[Balance General]
    end

    subgraph KPI[FASE 7: Estadísticas y Eficiencia 🟡]
        K1[Indicadores de Eficiencia]
        K2[Estadísticas Mensuales]
        K3[Presupuestos Anuales]
        K4[Dashboard Ejecutivo]
    end

    subgraph ADV[FASE 8: Reportes Avanzados 🟡]
        A1[Análisis de Tendencias]
        A2[Dashboard Interactivo]
        A3[Exportación Avanzada]
        A4[Alertas Automáticas]
    end

    SEG --> RRHH
    RRHH --> NOM
    NOM --> EST
    EST --> REP
    REP --> VEN
    VEN --> FIN
    FIN --> KPI
    KPI --> ADV
```

---

## 📋 **DETALLE POR FASES**

### **FASE 1: SEGURIDAD Y USUARIOS** ✅ COMPLETADA
**Estado**: 100% Implementado
**Módulos Backend**: ✅ `login/`, `usuario/`, `rol/`
**Módulos Frontend**: ✅ `login/`, `usuario/`, `seguridad/`

#### **1.1 Gestión de Usuarios**
- ✅ CRUD completo de `Usuario`
- ✅ Asociación con Empleado y Rol
- ✅ Control de estado activo/inactivo
- ✅ Soft delete con `FechaEliminacion`

#### **1.2 Autenticación y Login**
- ✅ Login con JWT tokens
- ✅ Guards de autenticación en todas las rutas
- ✅ Hash seguro de contraseñas
- ✅ Interceptor de tokens en frontend

#### **1.3 Roles y Permisos**
- ✅ CRUD de `RolUsuario`
- ✅ Asignación de roles por usuario
- ✅ Verificación de permisos en backend
- ✅ Control de acceso por roles
- ✅ Reglas de aprobación de nómina aplicadas en frontend y backend
  - `ADMINISTRADOR`
  - `ADMIN`
  - `GERENTE`
  - `RRHH`
  - `RECURSOS HUMANOS`

##### Acceso por rol
- `ADMINISTRADOR` / `ADMIN`
  - Acceso completo a todos los módulos: seguridad, usuarios, roles, configuración, nómina y reportería.
  - Puede crear y gestionar roles, usuarios y estados de nómina.
  - Puede aprobar cambios de estado de nómina que requieran aprobación.
- `GERENTE`
  - Acceso a nómina y reportería.
  - Puede ver nóminas, historial y aprobar cambios de estado en nóminas pendientes de aprobación.
- `RRHH` / `RECURSOS HUMANOS`
  - Acceso a recursos humanos: empleados, vacaciones, asistencias y nómina.
  - Puede aprobar cambios de estado de nómina en estados que requieran aprobación.

#### **1.4 Datos Corporativos**
- ✅ Gestión de `Empresa`
- ✅ NIT y número patronal IGSS
- ✅ Razón social y nombre comercial
- ✅ **NUEVO**: Campos de capital inicial/actual

---

### **FASE 1: GESTIÓN DE EMPLEADOS** ✅ COMPLETADA
**Estado**: 100% Implementado
**Módulos Backend**: ✅ `empleado/`, `departamento/`, `puesto/`, `jornada-laboral/`, `banco/`
**Módulos Frontend**: ✅ `empleado/`, `departamento/`, `puesto/`, `jornada-laboral/`, `banco/`

#### **1.1 Registro de Empleado**
- ✅ CRUD completo de `Empleado`
- ✅ Validación DPI, NIT, correo único
- ✅ Estado activo/inactivo con soft delete

#### **1.2 Datos Personales y Contacto**
- ✅ Nombre, apellidos, teléfono, dirección
- ✅ Género, estado civil, correo, fotografía
- ✅ Fecha de ingreso y datos completos

#### **1.3 Organización Interna**
- ✅ Gestión de `Departamento`
- ✅ Gestión de `Puesto` con relación departamento
- ✅ Gestión de `JornadaLaboral` (horas diarias/semanales)

#### **1.4 Datos Financieros**
- ✅ Gestión de `Banco`
- ✅ Cuentas bancarias por empleado
- ✅ Historial de `Salario` con fechas de vigencia

---

### **FASE 2: NÓMINA BÁSICA** ✅ COMPLETADA
**Estado**: 100% Implementado
**Módulos Backend**: ✅ `nomina/`, `parametro-global/`
**Módulos Frontend**: ✅ `nomina/`, `parametro-global/`

#### **2.1 Encabezado de Nómina**
- ✅ CRUD de `NominaEncabezado`
- ✅ Mes, año, quincena, fecha generación
- ✅ Usuario gerente responsable

#### **2.2 Detalle de Nómina**
- ✅ CRUD de `NominaDetalle`
- ✅ Días laborados, sueldo base, bonificaciones
- ✅ Descuentos IGSS, ISR, IRTRA, INTECAP
- ✅ Cálculo de líquido a recibir

#### **2.3 Cálculos Guatemala**
- ✅ IGSS 3.67% empleado
- ✅ ISR progresivo (6 tramos)
- ✅ Bono 14 (8.33% mensual)
- ✅ Aguinaldo (8.33% mensual)
- ✅ Bono productividad parametrizable

#### **2.4 Envío de Boletas**
- ✅ `RegistroEnvioBoleta`
- ✅ Fecha envío, estado éxito
- ✅ Usuario que realiza envío

---

### **FASE 3: ESTADOS DE NÓMINA** ✅ COMPLETADA
**Estado**: 100% Implementado
**Módulos Backend**: ✅ `estado-nomina/`
**Módulos Frontend**: ✅ `nomina/nomina.ts` con validaciones de rol

#### **3.1 Estados de Nómina** ✅
- ✅ Tabla `EstadoNomina` con flujo definido
- ✅ Estados: BORRADOR → PENDIENTE → APROBADO → PAGADO
- ✅ Campo `RequiereAprobacion` por estado

#### **3.2 Historial de Cambios** ✅
- ✅ Tabla `HistorialEstadoNomina`
- ✅ Auditoría completa de cambios
- ✅ Usuario, fecha y comentarios

#### **3.3 Flujo de Aprobación** ✅
- ✅ Lógica de cambio de estados en `EstadoNominaService`
- ✅ Validaciones por rol de usuario (ADMINISTRADOR, ADMIN, GERENTE, RRHH, RECURSOS HUMANOS)
- ✅ Método `puedeCambiarAEstado()` con reglas de negocio

#### **3.4 Notificaciones** ✅
- ✅ Validaciones en frontend con `isCambioEstadoPermisible()`
- ✅ Persistencia de rol en localStorage
- ✅ Control de acceso por permisos

---

### **FASE 4: REPORTERÍA Y EXPORTACIÓN** ✅ COMPLETADA
**Estado**: 100% Implementado
**Módulos Backend**: ✅ `reporteria/`, `export/`
**Módulos Frontend**: ✅ `reporteria/`, `reporteria-inicio/`

#### **4.1 Reportes RRHH** ✅
- ✅ Reporte de empleados activos con filtros por fecha
- ✅ Reporte de salarios históricos
- ✅ Reporte de departamentos con estadísticas
- ✅ Resumen ejecutivo con métricas generales

#### **4.2 Reportes de Nómina** ✅
- ✅ Nómina mensual por período (mes/año)
- ✅ Detalle de empleados con cálculos completos
- ✅ Totales por nómina (sueldos, bonos, descuentos, líquido)

#### **4.3 Exportación Excel** ✅
- ✅ Exportar empleados a Excel con formato profesional
- ✅ Exportar salarios históricos
- ✅ Exportar nómina mensual
- ✅ Exportar asistencias por período
- ✅ Exportar vacaciones por año
- ✅ Exportar departamentos con estadísticas

#### **4.4 Exportación PDF** ✅
- ✅ Generar reportes de empleados en PDF
- ✅ Reportes de salarios en PDF
- ✅ Nómina mensual en PDF con formato tabular
- ✅ Reportes de asistencias
- ✅ Reportes de vacaciones
- ✅ Reportes de departamentos

#### **4.5 Funcionalidades Adicionales** ✅
- ✅ Filtros dinámicos por fecha, mes, año
- ✅ Paginación en tablas grandes
- ✅ Interfaz responsiva con PrimeNG
- ✅ Manejo de errores y estados de carga
- ✅ Navegación intuitiva desde módulo de reportería

---

### **FASE 5: VENTAS Y CLIENTES** ✅ COMPLETADA
**Estado**: 100% Implementado
**Módulos Backend**: ✅ `cliente/`, `producto-servicio/`, `venta/`
**Módulos Frontend**: ❌ Pendiente implementación

#### **5.1 Gestión de Clientes** ✅
- ✅ CRUD completo de clientes
- ✅ Validación NIT/DPI únicos
- ✅ Clientes individuales y empresariales
- ✅ Soft delete con FechaEliminacion

#### **5.2 Productos y Servicios** ✅
- ✅ CRUD completo de productos/servicios
- ✅ Catálogo de productos/servicios
- ✅ Precios y costos parametrizables
- ✅ Tipos: PRODUCTO/SERVICIO

#### **5.3 Facturación** ✅
- ✅ Tabla `Venta` y `DetalleVenta`
- ✅ Generación de facturas con cálculos automáticos
- ✅ Cálculos de subtotal, impuestos (IVA 12%), total
- ✅ Descuentos por línea y generales

#### **5.4 Estados de Pago** ✅
- ✅ Estados: PENDIENTE, PAGADO, CANCELADO, VENCIDO
- ✅ Fechas de vencimiento
- ✅ Control de morosidad
- ✅ Actualización de estados de pago

---

### **FASE 6: FINANZAS Y CAPITAL** ✅ COMPLETADA
**Estado**: 100% Implementado
**Módulos Backend**: ✅ `cuenta-bancaria-empresa/`, ✅ `movimiento-financiero/`
**Módulos Frontend**: ✅ `finanzas/cuenta-bancaria/`, ✅ `finanzas/movimiento-financiero/`, ✅ `finanzas/finanzas-inicio/`

#### **6.1 Cuentas Bancarias**
- ✅ Tabla `CuentaBancariaEmpresa` (ya existe en schema)
- ✅ Servicio `CuentaBancariaEmpresaService` con CRUD completo
- ✅ Controlador para gestionar cuentas bancarias
- ✅ Validación de números de cuenta únicos
- ✅ Actualización de saldos
- ✅ Componente `CuentaBancariaComponent` con tabla y diálogos
- ✅ Modelo `CuentaBancariaEmpresa` e interfaz `Banco`
- ✅ Servicio HTTP `cuenta-bancaria-empresa.service.ts`

#### **6.2 Movimientos Financieros**
- ✅ Tabla `MovimientoFinanciero` (ya existe en schema)
- ✅ Servicio `MovimientoFinancieroService` con CRUD completo
- ✅ Controlador para gestionar movimientos
- ✅ Categorización de movimientos (INGRESO/EGRESO)
- ✅ Cálculo de balance por cuenta
- ✅ Filtros por tipo, fecha y estado
- ✅ Componente `MovimientoFinancieroComponent` con tabla y diálogos
- ✅ Modelo `MovimientoFinanciero` e interfaz `BalanceInfo`
- ✅ Servicio HTTP `movimiento-financiero.service.ts`

#### **6.3 Control de Capital**
- 🟡 Lógica de actualización automática de capital (en desarrollo)
- 🟡 Alertas de niveles críticos (en desarrollo)
- 🟡 Dashboard de capital (en desarrollo)

#### **6.4 Balance General y Reportes**
- 🟡 Vista `vw_BalanceMensual` (en desarrollo)
- 🟡 Reportes de ingresos/egresos (en desarrollo)
- 🟡 Análisis de flujo de caja (en desarrollo)

#### **6.5 Rutas y Navegación**
- ✅ Ruta `/finanzas/inicio` - Página de inicio del módulo
- ✅ Ruta `/finanzas/cuentas` - CRUD de cuentas bancarias
- ✅ Ruta `/finanzas/movimientos` - CRUD de movimientos financieros
- ✅ Menú de navegación actualizado con sección Finanzas

---

### **FASE 7: ESTADÍSTICAS Y EFICIENCIA** 🟡 PENDIENTE
**Estado**: 0% Implementado
**Módulos Backend**: ❌ Pendiente
**Módulos Frontend**: ❌ Pendiente

#### **7.1 Indicadores de Eficiencia**
- ❌ Tabla `IndicadorEficiencia`
- ❌ KPIs predefinidos (ventas, productividad, etc.)
- ❌ Metas mínimas/máximas configurables

#### **7.2 Estadísticas Mensuales**
- ❌ Tabla `EstadisticaMensual`
- ❌ Cálculo automático mensual
- ❌ Almacenamiento histórico

#### **7.3 Presupuestos Anuales**
- ❌ Tabla `PresupuestoAnual`
- ❌ Presupuestos por año
- ❌ Comparación real vs presupuesto

#### **7.4 Dashboard Ejecutivo**
- ❌ Vista `vw_IndicadoresEficiencia`
- ❌ Gráficos y métricas visuales
- ❌ Alertas de desviaciones

---

### **FASE 8: REPORTES AVANZADOS** 🟡 PENDIENTE
**Estado**: 0% Implementado
**Módulos Backend**: ❌ Pendiente
**Módulos Frontend**: ❌ Pendiente

#### **8.1 Reportes RRHH**
- ❌ Reportes de empleados activos
- ❌ Estadísticas de asistencia/vacaciones
- ❌ Análisis de rotación de personal

#### **8.2 Reportes Financieros**
- ❌ Estados financieros mensuales
- ❌ Análisis de rentabilidad
- ❌ Proyecciones financieras

#### **8.3 Análisis de Tendencias**
- ❌ Gráficos de evolución mensual
- ❌ Predicciones basadas en histórico
- ❌ Identificación de patrones

#### **8.4 Exportación de Datos**
- ❌ Exportación a Excel/PDF
- ❌ Filtros avanzados
- ❌ Programación de reportes

---

## 🔧 **ESTADO DE IMPLEMENTACIÓN DETALLADO**

### **Backend - Módulos Completados:**
✅ `login/` - Autenticación JWT completa
✅ `usuario/` - Gestión de usuarios
✅ `rol/` - Roles y permisos
✅ `empleado/` - CRUD empleados
✅ `departamento/` - Departamentos
✅ `puesto/` - Puestos de trabajo
✅ `jornada-laboral/` - Jornadas laborales
✅ `cliente/` - Gestión de clientes
✅ `producto-servicio/` - Productos y servicios
✅ `venta/` - Ventas y facturación
✅ `cuenta-bancaria-empresa/` - Cuentas bancarias
✅ `movimiento-financiero/` - Movimientos financieros
✅ `banco/` - Bancos
✅ `nomina/` - Sistema de nómina
✅ `parametro-global/` - Parámetros del sistema
✅ `asistencia/` - Control de asistencias
✅ `cont
### **Backend - Módulos Pendientes:**
❌ Estados de nómina (lógica de flujo)
❌ Ventas y clientes
❌ Finanzas y capital
❌ Estadísticas y eficiencia
❌ Reportes avanzados

### **Frontend - Componentes Completados:**
✅ `login/` - Autenticación
✅ `usuario/` - Gestión usuarios
✅ `seguridad/` - Seguridad del sistema
✅ `empleado/` - CRUD empleados
✅ `departamento/` - Departamentos
✅ `puesto/` - Puestos
✅ `jornada-laboral/` - Jornadas
✅ `banco/` - Bancos
✅ `nomina/` - Generador de nómina
✅ `parametro-global/` - Parámetros
✅ `asistencia/` - Asistencias
✅ `vacacion/` - Vacaciones

### **Frontend - Componentes Pendientes:**
❌ Estados de nómina (aprobaciones)
❌ Ventas y facturación
❌ Finanzas y capital
❌ Dashboard de estadísticas
❌ Reportes avanzados

---

## 📈 **PRIORIDADES DE DESARROLLO**

### **Próximas Fases (Orden Sugerido):**

1. **🔥 ALTA**: Fase 3 - Estados de Nómina (Completar lógica de flujo)
2. **� ALTA**: Fase 4 - Ventas y Clientes (Funcionalidad crítica)
3. **🟡 MEDIA**: Fase 5 - Finanzas y Capital (Complementario a ventas)
4. **🟡 MEDIA**: Fase 6 - Estadísticas (Dashboard ejecutivo)
5. **🟢 BAJA**: Fase 7 - Reportes Avanzados (Mejora continua)

### **Tiempo Estimado por Fase:**
- Fase 3: 2-3 semanas (completar lógica pendiente)
- Fase 4: 4-5 semanas (ventas completas)
- Fase 5: 3-4 semanas (finanzas)
- Fase 6: 2-3 semanas (estadísticas)
- Fase 7: 3-4 semanas (reportes)

---

## 🎯 **CONCLUSIONES**

### **Lo que tenemos:**
✅ Sistema sólido de RRHH con nómina básica
✅ Autenticación y seguridad implementada
✅ Base de datos extendida con nuevas funcionalidades
✅ Arquitectura modular y escalable

### **Lo que necesitamos implementar:**
🔄 Completar flujo de estados de nómina
🆕 Sistema completo de ventas y facturación
🆕 Control financiero y de capital
🆕 Dashboard de estadísticas y eficiencia
🆕 Reportes avanzados y análisis

### **Recomendación:**
Continuar con **Fase 3** (estados de nómina) para completar la funcionalidad crítica de nómina, luego proceder con **Fase 4** (ventas) que es fundamental para el control financiero de la empresa.

---

*EDT actualizado al 19 de Abril 2026 - Versión 2.0*
    P1[Parametros Globales]
    P2[Valores IGSS / ISR]
    P3[Bonos y Topes]
    P4[Reglas de Negocio]
  end

  subgraph REP[Reportes y Consultas]
    R1[Reportes de Empleados]
    R2[Historial de Asistencias]
    R3[Vacaciones / Incidencias]
    R4[Reportes de Nómina]
    R5[Auditoría]
  end

  U1 --> E1
  U3 --> U1
  U4 --> U1
  U2 --> U1

  E1 --> A1
  E1 --> V1
  E1 --> N1
  E1 --> M2
  E1 --> R1

  A1 --> R2
  V1 --> R3
  N1 --> R4
  M2 --> R4

  P1 --> N1
  P1 --> M2
  P2 --> N3
  P3 --> V1
  P4 --> N3

  U1 --> R5
  E1 --> R5
  A1 --> R5
  V1 --> R5
  N1 --> R5
  M2 --> R5
```

## Módulos y submódulos detallados

### 1. Seguridad y Administración de Usuarios
- Gestión de usuarios
  - Crear, leer, actualizar, eliminar usuarios (`Usuario`)
  - Control de estado y fecha de eliminación
  - Asociar usuario con empleado y rol
- Autenticación y login
  - Login con `username` y `contrasena`
  - Generación de token / sesión
  - Guardar contraseña segura con hash
- Roles y permisos
  - CRUD de `RolUsuario`
  - Asignación de rol a cada usuario
  - Verificación de permisos en rutas del backend
  - Aprobación de cambios de estado de nómina reservada a roles específicos
    - `ADMINISTRADOR`
    - `ADMIN`
    - `GERENTE`
    - `RRHH`
    - `RECURSOS HUMANOS`
  - Acceso por rol:
    - `ADMINISTRADOR` / `ADMIN`: acceso completo a todos los módulos y permisos.
    - `GERENTE`: acceso a nómina, reporte y aprobación de estados de nómina.
    - `RRHH` / `RECURSOS HUMANOS`: acceso a recursos humanos y aprobación de estados de nómina.
- Datos corporativos
  - Gestión de `Empresa`
  - NIT y número patronal IGSS
  - Datos de razón social y comercial

### Inserción de roles de aprobación de nómina
```sql
INSERT INTO RolUsuario (NombreRol) VALUES
  ('ADMINISTRADOR'),
  ('ADMIN'),
  ('GERENTE'),
  ('RRHH'),
  ('RECURSOS HUMANOS');
```

### 2. Gestión de Empleados
- Registro de empleado
  - CRUD completo de `Empleado`
  - Validación de DPI, NIT y correo
  - Estado activo / inactivo
- Datos personales y contacto
  - Nombre, apellidos, teléfono, dirección, género, estado civil
  - Correo personal y fotografía
- Organización interna
  - Gestión de `Departamento`
  - Gestión de `Puesto`
  - Gestión de `JornadaLaboral`
- Datos financieros
  - Gestión de `Banco`
  - Cuentas bancarias
  - Historial de `Salario` por empleado
- Relaciones
  - Empleado ↔ Usuario
  - Empleado ↔ Asistencia
  - Empleado ↔ ControlVacacion
  - Empleado ↔ Incidencia
  - Empleado ↔ MovimientoEmpleado
  - Empleado ↔ NominaDetalle

### 3. Gestión de Asistencias
- Registro diario
  - CRUD de `Asistencia`
  - Fecha, hora de entrada, hora de salida
  - Cálculo de horas trabajadas
- Horas extra
  - Registro de `HorasExtra`
  - Cálculos por jornada
- Control de estado
  - `Activo` y `FechaEliminacion`
  - Filtrado por empleado y rango de fechas
- Reportes
  - Historial de asistencias por empleado
  - Reportes de horarios y ausencias

### 4. Vacaciones y Ausencias
- Control de vacaciones
  - CRUD de `ControlVacacion`
  - Días ganados y días gozados
  - Cálculo de saldo de vacaciones
- Detalle de vacaciones
  - CRUD de `DetalleControlVacacion`
  - Relación con incidencias y días descontados
- Incidencias
  - CRUD de `Incidencia`
  - Registro de ausencias, permisos y licencias
  - Configurar con o sin goce de sueldo
  - Autorización de usuario con permiso

### 5. Nómina
- Encabezado de nómina
  - CRUD de `NominaEncabezado`
  - Mes, año, quincena, estado
  - Usuario responsable / gerente
- Detalle de nómina
  - CRUD de `NominaDetalle`
  - Dias laborados, sueldo base, bonificaciones, descuentos
  - Cálculo de `LiquidoRecibir`
- Envío de boletas
  - `RegistroEnvioBoleta`
  - Fecha de envío, éxito, usuario que envía
- Integración con empleados
  - Relación de cada detalle con empleado
  - Generación de planilla por periodo

### 6. Movimientos y Provisiones
- Tipos de movimiento
  - CRUD de `TipoMovimiento`
  - Clasificación, afectación a IGSS/ISR, fijo o variable
- Movimientos de empleado
  - CRUD de `MovimientoEmpleado`
  - Monto, mes y año de aplicación
  - Usuario que registra el movimiento
- Provisiones legales
  - CRUD de `ProvisionPrestacion`
  - Bono 14, aguinaldo, indemnización, provisión de vacaciones
  - Historial por mes y año

### 7. Parámetros y Cálculos
- Parámetros globales
  - CRUD de `ParametroGlobal`
  - Valores base para cálculos legales y financieros
- Valores fiscales
  - IGSS, ISR, topes, bonificaciones
  - Ajustes según normativa de Guatemala
- Reglas de cálculo
  - Fórmulas de nómina
  - Cálculo de descuentos y salario líquido
  - Aplicación de provisiones y cargas sociales

### 8. Reportes y Consultas
- Reportes operativos
  - Listado de empleados activos
  - Historial de asistencias y vacaciones
  - Control de incidencias
- Reportes de nómina
  - Nóminas generadas por mes/quincena
  - Totales de descuentos y pagos
  - Provisiones acumuladas
- Auditoría
  - Registro de cambios en datos maestros
  - Acciones de usuario sobre nómina y autorizaciones
