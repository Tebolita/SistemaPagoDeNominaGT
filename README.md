# Sistema Integral de Gestión de Nómina — Nómina GT

## Versión 3.0 · Mayo 2026

Sistema completo de gestión de recursos humanos, nómina, ventas y finanzas para empresas en Guatemala.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | NestJS 11, Prisma ORM 7, SQL Server |
| Frontend | Angular 17+, PrimeNG 21, Tailwind CSS, Signals |
| Auth | JWT con `AuthGuard` y `roleGuard` |
| Correo | Brevo API (transaccional) |
| Exportación | ExcelJS, PDFKit |

---

## Requisitos

- Node.js 18+
- SQL Server 2019+
- npm 9+

---

## Instalación

```bash
# Backend
cd backend
npm install
npx prisma generate
npm run start:dev

# Frontend
cd frontend
npm install
ng serve
```

### Variables de entorno — `backend/.env`

```env
DATABASE_URL="sqlserver://servidor;database=nombre;user=usuario;password=clave;trustServerCertificate=true"
JWT_SECRET="secreto_jwt"
BREVO_KEY="tu_api_key_brevo"
BREVO_SENDER_EMAIL="no-reply@tudominio.com"   # opcional
BREVO_SENDER_NAME="Nómina GT"                  # opcional
PORT=4000
```

---

## Resumen de Fases

| Fase | Módulo | Estado |
|---|---|---|
| 1 | Seguridad y Usuarios | ✅ Completada |
| 2 | Gestión de Empleados (RRHH) | ✅ Completada |
| 3 | Asistencias y Vacaciones | ✅ Completada |
| 4 | Nómina | ✅ Completada |
| 5 | Parámetros Globales | ✅ Completada |
| 6 | Estados de Nómina | ✅ Completada |
| 7 | Reportería y Exportación | ✅ Completada |
| 8 | Ventas y Clientes | ✅ Completada |
| 9 | Finanzas | ✅ Completada |
| 10 | Correo Electrónico (Brevo) | ✅ Completada |

---

## FASE 1 — Seguridad y Usuarios ✅

**Backend:** `login/`, `usuario/`, `rol/`
**Frontend:** `login/`, `usuario/`, `seguridad/`, `roles/`

### Implementado

- Autenticación con JWT. `AuthGuard` aplicado a todos los endpoints protegidos
- Hash de contraseñas con bcrypt (12 rounds)
- CRUD de usuarios con asociación a empleado y rol
- Soft delete con `Activo` / `FechaEliminacion`
- `roleGuard` en el frontend: protege rutas y oculta secciones del menú según el rol
- Al crear un usuario se envía automáticamente un correo con sus credenciales

### Roles y acceso

| Rol | Acceso |
|---|---|
| `ADMINISTRADOR` / `ADMIN` | Todos los módulos |
| `GERENTE` | Nómina, Ventas, Finanzas, Reportería |
| `RRHH` / `RECURSOS HUMANOS` | RRHH, Configuración, Nómina, Reportería |

### SQL — Insertar roles

```sql
INSERT INTO RolUsuario (NombreRol) VALUES
  ('ADMINISTRADOR'), ('ADMIN'), ('GERENTE'),
  ('RRHH'), ('RECURSOS HUMANOS');
```

---

## FASE 2 — Gestión de Empleados (RRHH) ✅

**Backend:** `empleado/`, `departamento/`, `puesto/`, `jornada-laboral/`, `banco/`, `salario/`
**Frontend:** `empleado/`, `departamento/`, `puesto/`, `jornada-laboral/`, `banco/`, `rrhh/`

### Implementado

- CRUD completo de empleados: DPI, NIT, nombre, correo, teléfono, dirección, género, estado civil, fotografía
- Gestión de departamentos, puestos y jornadas laborales
- Historial de salarios con fechas de vigencia (salario activo / inactivo)
- Asignación de banco y cuenta bancaria por empleado
- Vista detallada en tabs: **Información · Configuración · Salarios · Vacaciones · Asistencias**
- Campo Género editable (Masculino / Femenino) con selector

---

## FASE 3 — Asistencias y Vacaciones ✅

**Backend:** `asistencia/`, `control-vacacion/`, `detalle-control-vacacion/`, `incidencia/`
**Frontend:** `asistencia/`, `vacacion/`

### Implementado

- Registro diario de asistencia: fecha, hora entrada, hora salida, **horas extra** (`HorasExtra`)
- Las horas extra registradas se usan automáticamente en el cálculo de nómina del mes
- Control de vacaciones: días ganados vs días gozados, con o sin goce de sueldo
- Incidencias y detalle de control de vacaciones

---

## FASE 4 — Nómina ✅

**Backend:** `nomina/`
**Frontend:** `nomina/`

### Tipos de nómina

| Tipo | Descripción | Restricción mensual |
|---|---|---|
| `GENERAL` | Calcula todos los parámetros activos para los empleados | 1 por empleado/mes |
| `PERSONALIZADA` | Empleados y parámetros elegidos manualmente | Sin límite |

### Modos de generación

- **Individual** — un empleado, salario ingresado manualmente, preview de cálculo antes de confirmar
- **Masiva** — todos los empleados activos con salario vigente en un período
- **Personalizada** — MultiSelect de empleados + MultiSelect de parámetros + opción de incluir o excluir el salario base

### Cálculos Guatemala

```
Ingresos:
  Sueldo Base
  + Bono 14              (BONO_14_PORCENTAJE % del salario / 12 meses)
  + Aguinaldo            (AGUINALDO_PORCENTAJE % del salario / 12 meses)
  + Bono Productividad   (BONO_PRODUCTIVIDAD Q fijo)
  + Horas Extra          (ver fórmula abajo)

Descuentos:
  - IGSS Empleado        (IGSS_EMPLEADO % del salario)
  - ISR                  (6 tramos progresivos según normativa SAT)
  - IRTRA                (IRTRA_PORCENTAJE % del salario)
  - INTECAP              (INTECAP_PORCENTAJE % del salario)

Líquido a Recibir = Total Ingresos − Total Descuentos
```

### Horas extra — fórmula legal Guatemala

```
Valor hora normal  = Salario mensual ÷ 30 ÷ HORAS_LABORALES_DIA
Valor hora extra   = Valor hora normal × (1 + HORAS_EXTRA_PORCENTAJE / 100)
Pago horas extra   = Horas extra del mes × Valor hora extra
```

Las horas extra se toman del campo `HorasExtra` de la tabla `Asistencia` para el mes correspondiente.

### Número de boleta / transacción

Al cambiar al estado final de pago se solicita el número de boleta bancaria o referencia de transferencia.

### Cuenta bancaria de pago

Al generar (individual, masiva o personalizada) se puede asignar la cuenta bancaria de la empresa desde donde se descontará el pago. Al marcar como pagada:
1. Se valida que el saldo de la cuenta sea suficiente
2. Se descuenta el total del saldo
3. Se crea un `MovimientoFinanciero` EGRESO/NOMINA automáticamente

Si la nómina se cancela desde el estado PAGADO, el movimiento se revierte.

### Aprobación por doble firma

Cuando la nómina está en un estado que lo requiera (como PENDIENTE_APROBACION) se necesitan 2 firmas:
- **Jefe de Área** (`JEFE_AREA`)
- **Encargado** (`ENCARGADO`)

Con ambas firmas, la nómina avanza automáticamente al siguiente estado.

### Filtros y totales en la tabla

- Filtro por **Año**, **Mes** y **Tipo** (General / Personalizada)
- Cards de resumen: Total nóminas, General vs Personalizada, Masa Salarial, Total Líquido
- Tab **"Eliminadas"** para ver y restaurar nóminas con soft delete

### Exportación Excel

| Planilla | Endpoint |
|---|---|
| General | `GET /api/nomina/:id/export/general` |
| IGSS | `GET /api/nomina/:id/export/igss` |
| ISR / SAT | `GET /api/nomina/:id/export/isr` |

---

## FASE 5 — Parámetros Globales ✅

**Backend:** `parametro-global/`
**Frontend:** `parametro-global/`

### Parámetros del sistema

| Nombre | Valor defecto | Tipo | Unidad |
|---|---|---|---|
| `IGSS_EMPLEADO` | 3.67 | DESCUENTO | % |
| `ISR_TASA_1` | variable | DESCUENTO | % |
| `ISR_TASA_2` | variable | DESCUENTO | % |
| `ISR_TASA_3` | variable | DESCUENTO | % |
| `ISR_TASA_4` | variable | DESCUENTO | % |
| `ISR_TASA_5` | variable | DESCUENTO | % |
| `ISR_TASA_6` | variable | DESCUENTO | % |
| `ISR_BASE_ANUAL` | variable | REFERENCIA | Q |
| `BONO_14_PORCENTAJE` | 8.33 | INGRESO | % |
| `AGUINALDO_PORCENTAJE` | 8.33 | INGRESO | % |
| `BONO_PRODUCTIVIDAD` | variable | INGRESO | Q |
| `IRTRA_PORCENTAJE` | variable | DESCUENTO | % |
| `INTECAP_PORCENTAJE` | variable | DESCUENTO | % |
| `HORAS_EXTRA_PORCENTAJE` | 50 | INGRESO | % |
| `HORAS_LABORALES_DIA` | 8 | REFERENCIA | Q |

### SQL — Insertar parámetros de horas extra

```sql
INSERT INTO ParametroGlobal
  (NombreParametro, Valor, Descripcion, Activo, Tipo, Unidad,
   FiltroGenero, FiltroIdDepartamento, FiltroIdPuesto, FiltroIdJornada)
VALUES
('HORAS_EXTRA_PORCENTAJE', 50.0000,
 'Recargo legal sobre horas extra en Guatemala (50% = pago al 150% del valor hora)',
 1, 'INGRESO', '%', NULL, NULL, NULL, NULL),
('HORAS_LABORALES_DIA', 8.0000,
 'Horas laborales ordinarias por día para calcular el valor/hora',
 1, 'REFERENCIA', 'Q', NULL, NULL, NULL, NULL);
```

### Filtros por empleado

Cada parámetro puede tener filtros opcionales para aplicarse solo a un subconjunto de empleados:

| Filtro | Campo DB |
|---|---|
| Género | `FiltroGenero` (BIT) |
| Departamento | `FiltroIdDepartamento` (INT) |
| Puesto | `FiltroIdPuesto` (INT) |
| Jornada Laboral | `FiltroIdJornada` (INT) |

Si todos los filtros son `NULL`, el parámetro aplica a todos los empleados.

### Simulador de impacto

Panel integrado en la pantalla de parámetros: selecciona un parámetro + filtros de empleado y muestra en tiempo real:
- Empleados afectados y cuántos tienen salario vigente
- Masa salarial total
- Impacto total (suma de lo que suma o resta)
- Tabla con salario base → impacto → salario final por empleado

### SQL — Columnas requeridas

```sql
ALTER TABLE ParametroGlobal ADD Tipo                  VARCHAR(20) NULL;
ALTER TABLE ParametroGlobal ADD Unidad                VARCHAR(5)  NULL;
ALTER TABLE ParametroGlobal ADD FiltroGenero          BIT         NULL;
ALTER TABLE ParametroGlobal ADD FiltroIdDepartamento  INT         NULL;
ALTER TABLE ParametroGlobal ADD FiltroIdPuesto        INT         NULL;
ALTER TABLE ParametroGlobal ADD FiltroIdJornada       INT         NULL;

ALTER TABLE ParametroGlobal ADD CONSTRAINT FK_Param_Departamento
  FOREIGN KEY (FiltroIdDepartamento) REFERENCES Departamento(IdDepartamento);
ALTER TABLE ParametroGlobal ADD CONSTRAINT FK_Param_Puesto
  FOREIGN KEY (FiltroIdPuesto) REFERENCES Puesto(IdPuesto);
ALTER TABLE ParametroGlobal ADD CONSTRAINT FK_Param_Jornada
  FOREIGN KEY (FiltroIdJornada) REFERENCES JornadaLaboral(IdJornada);
```

---

## FASE 6 — Estados de Nómina ✅

**Backend:** `estado-nomina/`
**Frontend:** `estado-nomina/`

### Estados configurables

Los estados son completamente administrables desde la interfaz. Campos clave:

| Campo | Tipo | Descripción |
|---|---|---|
| `NombreEstado` | VARCHAR(50) | Identificador único del estado |
| `Orden` | INT | Posición en el flujo. Varios estados pueden tener el mismo Orden (ramas paralelas) |
| `Color` | VARCHAR(20) | Badge visual: `info`, `warn`, `success`, `danger`, `secondary`, `cyan` |
| `EsFinal` | BIT | Estado terminal — no permite transiciones de salida |
| `EsCancelacion` | BIT | Disponible desde cualquier estado no-final (ej. CANCELADO) |
| `RequiereAprobacion` | BIT | Solo roles especiales (ADMIN, GERENTE, RRHH) pueden transicionar a este estado |

### Flujo por defecto

```
BORRADOR (1) ──► PENDIENTE_APROBACION (2) ──┐
                 PROVISION         (2) ──┤
                                          └──► APROBADO (3) ──► PAGADO (4, final)

                 Desde cualquier estado no-final:
                 └──► CANCELADO (5, final + cancelación)
```

Agregar un nuevo estado en la BD (con su `Orden` y `Color`) lo incorpora automáticamente al flujo sin cambios de código.

### SQL — Columnas requeridas

```sql
ALTER TABLE EstadoNomina ADD Color         VARCHAR(20) NULL;
ALTER TABLE EstadoNomina ADD EsFinal       BIT NOT NULL DEFAULT 0;
ALTER TABLE EstadoNomina ADD EsCancelacion BIT NOT NULL DEFAULT 0;

-- Configurar estados existentes
UPDATE EstadoNomina SET Color='info',    EsFinal=0, EsCancelacion=0 WHERE NombreEstado='BORRADOR';
UPDATE EstadoNomina SET Color='warn',    EsFinal=0, EsCancelacion=0 WHERE NombreEstado='PENDIENTE_APROBACION';
UPDATE EstadoNomina SET Color='cyan',    EsFinal=0, EsCancelacion=0 WHERE NombreEstado='Provision';
UPDATE EstadoNomina SET Color='success', EsFinal=0, EsCancelacion=0 WHERE NombreEstado='APROBADO';
UPDATE EstadoNomina SET Color='success', EsFinal=1, EsCancelacion=0 WHERE NombreEstado='PAGADO';
UPDATE EstadoNomina SET Color='danger',  EsFinal=1, EsCancelacion=1 WHERE NombreEstado='CANCELADO';
```

---

## FASE 7 — Reportería y Exportación ✅

**Backend:** `reporteria/`, `export/`
**Frontend:** `reporteria/`, `reporteria-inicio/`

### Implementado

- **Resumen ejecutivo** con métricas: total empleados, clientes, productos, servicios, asistencias del mes, vacaciones pendientes, nóminas por estado, distribución salarial
- **Gráficos** (Chart.js via PrimeNG):
  - Distribución salarial por rangos
  - Masa salarial por departamento (barras apiladas)
  - Nóminas por estado (doughnut)
  - Composición de nómina: líquido vs descuentos (barras apiladas)
  - Asistencias del mes
- **Exportación Excel** de planilla general, IGSS e ISR desde la tabla de nóminas

---

## FASE 8 — Ventas y Clientes ✅

**Backend:** `cliente/`, `producto-servicio/`, `venta/`
**Frontend:** `ventas/`

### Clientes

- CRUD de clientes individuales y empresariales (NIT, DPI, correo, teléfono)
- Validación de unicidad de NIT, DPI y correo
- Soft delete

### Productos y Servicios

- Catálogo con nombre, tipo (PRODUCTO / SERVICIO), precio unitario y costo
- Estado activo/inactivo

### Ventas

- Creación de órdenes con múltiples productos, descuento por línea y descuento general
- IVA 12% calculado automáticamente
- Estados: `PENDIENTE` → `PAGADO` / `CANCELADO` / `VENCIDO`
- Al cambiar a **PAGADO**:
  1. Selección de cuenta bancaria de cobro
  2. Acreditación automática del total en el saldo de la cuenta
  3. Creación de `MovimientoFinanciero` INGRESO/VENTA
- Al **cancelar** una venta PAGADA: el movimiento financiero se revierte automáticamente
- Botón ✉️ para enviar la factura por correo al cliente

### SQL — Columna requerida

```sql
ALTER TABLE Venta ADD IdCuenta INT NULL;
ALTER TABLE Venta ADD CONSTRAINT FK_Venta_Cuenta
  FOREIGN KEY (IdCuenta) REFERENCES CuentaBancariaEmpresa(IdCuenta);
```

---

## FASE 9 — Finanzas ✅

**Backend:** `cuenta-bancaria-empresa/`, `movimiento-financiero/`
**Frontend:** `finanzas/`

### Cuentas Bancarias (`CuentaBancariaEmpresa`)

- CRUD de cuentas: banco, número de cuenta, nombre, tipo (CORRIENTE / AHORROS / MONEDA_EXTRANJERA), moneda y saldo
- Cards de resumen en tiempo real con saldo por cuenta y total en GTQ
- Reactivar cuentas desactivadas

### Movimientos Financieros

- Registro manual de INGRESO / EGRESO con categoría, subcategoría, referencia y notas
- Al **crear**: incrementa o decrementa `SaldoActual` de la cuenta automáticamente
- Al **editar**: revierte el efecto original y aplica el nuevo (maneja cambios de monto, tipo y cuenta)
- Al **eliminar**: revierte el efecto en el saldo antes del soft delete

### Movimientos automáticos generados por el sistema

| Origen | Tipo | Categoría | Subcategoría |
|---|---|---|---|
| Pago de nómina | EGRESO | NOMINA | PAGO_NOMINA |
| Cobro de venta | INGRESO | VENTA | COBRO_VENTA |

### SQL — Columnas requeridas en nómina

```sql
ALTER TABLE NominaEncabezado ADD IdCuenta    INT          NULL;
ALTER TABLE NominaEncabezado ADD TipoNomina  VARCHAR(20)  NOT NULL DEFAULT 'GENERAL';

ALTER TABLE NominaEncabezado ADD CONSTRAINT FK_NominaEncabezado_Cuenta
  FOREIGN KEY (IdCuenta) REFERENCES CuentaBancariaEmpresa(IdCuenta);
```

---

## FASE 10 — Correo Electrónico (Brevo) ✅

**Backend:** `correo/`
**Frontend:** `services/correo.service.ts`

### Endpoints

| Endpoint | Body | Descripción |
|---|---|---|
| `POST /api/correo/boleta-nomina` | `{ IdNomina }` | Envía boleta personalizada a cada empleado de la nómina |
| `POST /api/correo/factura-venta` | `{ IdVenta }` | Envía factura al correo del cliente |
| `POST /api/correo/notificacion` | `{ Destinatarios[], Asunto, Mensaje }` | Correo genérico a uno o varios destinatarios |

### Correos automáticos

- **Creación de usuario**: se envía al empleado vinculado con su usuario y contraseña (no bloquea si falla)
- **Boleta de nómina** (botón manual en la tabla): tabla con ingresos, descuentos y líquido a recibir
- **Factura de venta** (botón manual en la tabla): detalle de productos, IVA y total

### Templates HTML

Todos los correos usan templates HTML inline con diseño profesional oscuro/claro compatible con clientes de correo.

---

## Arquitectura del frontend

```
src/app/
├── models/           ← Interfaces TypeScript por entidad
├── services/         ← Servicios HTTP por módulo
├── auth.guard.ts     ← Protección de rutas autenticadas
├── role.guard.ts     ← Protección de rutas por rol
├── menu/             ← Sidebar con visibilidad dinámica por rol
├── inicio/           ← Dashboard con resumen ejecutivo
├── login/
├── seguridad/        ← Gestión de usuarios y roles
├── rrhh/             ← Hub del módulo RRHH
├── empleado/
├── asistencia/
├── vacacion/
├── configuracion/    ← Hub de configuración
│   ├── departamento/
│   ├── puesto/
│   ├── jornada-laboral/
│   ├── banco/
│   ├── parametro-global/
│   └── estado-nomina/
├── nomina/
│   ├── nomina-inicio/
│   └── nomina.ts     ← Generación, firmas, estados, exportación
├── reporteria/
├── reporteria-inicio/
├── ventas/
│   ├── venta-inicio/
│   ├── cliente/
│   ├── producto-servicio/
│   └── venta.ts
└── finanzas/
    ├── finanzas-inicio/
    ├── cuenta-bancaria/
    └── movimiento-financiero/
```

---

## Notas técnicas

- **Soft delete** en todas las entidades (`Activo = false`, `FechaEliminacion`)
- **`ValidationPipe`** global con `whitelist: true` y `transform: true` — elimina campos no declarados en los DTOs e inyecta `@Transform`
- **Prisma `Decimal`** se serializa como string en JSON. El frontend usa `parseFloat()` explícito al construir payloads
- **Dialogs PrimeNG 21** se portalan fuera del componente host — los estilos de dialogs van en `styles.css` global, no en `:host ::ng-deep`
- **NG0100** (ExpressionChangedAfterItHasBeenChecked) — las operaciones destructivas (delete, etc.) usan `ConfirmationService` para crear una barrera asíncrona natural entre el evento y el cambio de estado
- **Prisma Decimal / SQL Server** — no acepta `@default(false)` en campos BIT sin schema reset; los defaults se manejan en los DTOs
- **Nóminas GENERALES**: máximo 1 por empleado/mes. **PERSONALIZADAS**: sin límite por mes

---

## API — Referencia rápida

```
Auth:
  POST   /api/login
  GET    /api/login/profile
  POST   /api/login/logout

Nómina:
  GET    /api/nomina                        Lista activas
  GET    /api/nomina/eliminadas             Lista eliminadas
  POST   /api/nomina/calcular               Preview (incluye horas extra)
  POST   /api/nomina/generar                Individual
  POST   /api/nomina/generar-masiva         Masiva
  POST   /api/nomina/generar-personalizada  Personalizada
  POST   /api/nomina/:id/firmar             Agregar firma
  PATCH  /api/nomina/:id/restaurar          Restaurar eliminada
  DELETE /api/nomina/:id                    Soft delete
  GET    /api/nomina/:id/export/general     Excel planilla general
  GET    /api/nomina/:id/export/igss        Excel IGSS
  GET    /api/nomina/:id/export/isr         Excel ISR/SAT

Estado Nómina:
  GET    /api/estado-nomina
  POST   /api/estado-nomina
  GET    /api/estado-nomina/:idNomina/disponibles
  POST   /api/estado-nomina/cambiar
  GET    /api/estado-nomina/:idNomina/historial

Parámetros:
  GET    /api/parametro-global
  POST   /api/parametro-global
  PATCH  /api/parametro-global/:id
  DELETE /api/parametro-global/:id
  POST   /api/parametro-global/simular      Simulador de impacto

Ventas:
  GET    /api/venta
  POST   /api/venta
  PATCH  /api/venta/:id
  PUT    /api/venta/:id/estado-pago
  DELETE /api/venta/:id

Finanzas:
  GET    /api/cuenta-bancaria-empresa
  POST   /api/cuenta-bancaria-empresa
  PATCH  /api/cuenta-bancaria-empresa/:id
  PATCH  /api/cuenta-bancaria-empresa/:id/saldo
  DELETE /api/cuenta-bancaria-empresa/:id
  GET    /api/movimiento-financiero
  POST   /api/movimiento-financiero
  PATCH  /api/movimiento-financiero/:id
  DELETE /api/movimiento-financiero/:id

Correo:
  POST   /api/correo/boleta-nomina
  POST   /api/correo/factura-venta
  POST   /api/correo/notificacion
```

---

*Actualizado: Mayo 2026 · Versión 3.0*
