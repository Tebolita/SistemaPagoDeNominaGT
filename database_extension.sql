CREATE DATABASE PagoPlanilla;
GO
USE PagoPlanilla;
GO

BEGIN TRY
    BEGIN TRANSACTION;

        -- ==========================================
        -- 0. DATOS DEL PATRONO (Nuevo)
        -- ==========================================
        CREATE TABLE Empresa (
            IdEmpresa INT PRIMARY KEY IDENTITY(1,1),
            NombreRazonSocial VARCHAR(200) NOT NULL,
            NombreComercial VARCHAR(200),
            NIT VARCHAR(15) NOT NULL,
            NumeroPatronalIGSS VARCHAR(50) NOT NULL,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME
        );

        -- ==========================================
        -- 1. ESTRUCTURA ORGANIZATIVA Y CATÁLOGOS
        -- ==========================================
        CREATE TABLE Departamento (
            IdDepartamento INT PRIMARY KEY IDENTITY(1,1),
            NombreDepartamento VARCHAR(100) NOT NULL,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME
        );

        CREATE TABLE Puesto (
            IdPuesto INT PRIMARY KEY IDENTITY(1,1),
            NombrePuesto VARCHAR(100) NOT NULL,
            IdDepartamento INT NOT NULL,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME,
            CONSTRAINT FK_Puesto_Departamento FOREIGN KEY (IdDepartamento) REFERENCES Departamento(IdDepartamento)
        );

        -- Tipos de Jornada en Guatemala (Diurna, Nocturna, Mixta)
        CREATE TABLE JornadaLaboral (
            IdJornada INT PRIMARY KEY IDENTITY(1,1),
            NombreJornada VARCHAR(50) NOT NULL,
            HorasDiarias DECIMAL(4,2) NOT NULL,
            HorasSemanales DECIMAL(4,2) NOT NULL,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME
        );

        CREATE TABLE Banco (
            IdBanco INT PRIMARY KEY IDENTITY(1,1),
            NombreBanco VARCHAR(100) NOT NULL,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME
        );

        -- ==========================================
        -- 2. MÓDULO DE EMPLEADOS
        -- ==========================================
        CREATE TABLE Empleado (
            IdEmpleado INT PRIMARY KEY IDENTITY(1,1),
            DPI VARCHAR(13) NOT NULL UNIQUE, 
            NIT VARCHAR(15) NOT NULL, 
            Nombres VARCHAR(100) NOT NULL,
            Apellidos VARCHAR(100) NOT NULL,
            CorreoPersonal VARCHAR(100) NOT NULL,
            FechaIngresa DATETIME NOT NULL DEFAULT GETDATE(),
            IdPuesto INT NOT NULL,
            IdJornada INT NOT NULL, -- Requerido para horas extra
            IdBanco INT, -- Banco donde se le deposita
            IdDepartamento INT,
            CuentaBancaria VARCHAR(50),
            Telefono VARCHAR(15) NOT NULL, -- Cambiado de INT a VARCHAR
            Genero BIT NOT NULL,
            EstadoCivil VARCHAR(100),
            Direccion VARCHAR(200),
            Fotografia VARCHAR(200),
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME,
            CONSTRAINT FK_Empleado_Puesto FOREIGN KEY (IdPuesto) REFERENCES Puesto(IdPuesto),
            CONSTRAINT FK_Empleado_Jornada FOREIGN KEY (IdJornada) REFERENCES JornadaLaboral(IdJornada),
            CONSTRAINT FK_Empleado_Banco FOREIGN KEY (IdBanco) REFERENCES Banco(IdBanco),
            CONSTRAINT FK_Empleado_Departamento FOREIGN KEY (IdDepartamento) REFERENCES Departamento(IdDepartamento)
        );

        CREATE TABLE Salario (
            IdHistorico INT PRIMARY KEY IDENTITY(1,1),
            IdEmpleado INT NOT NULL,
            SalarioBase DECIMAL(18,2) NOT NULL, -- No incluye Bonificación Incentivo
            FechaInicioVigencia DATETIME NOT NULL,
            FechaFinVigencia DATETIME,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME,
            CONSTRAINT FK_Historico_Empleado FOREIGN KEY (IdEmpleado) REFERENCES Empleado(IdEmpleado)
        );

        -- ==========================================
        -- 3. MÓDULO DE SEGURIDAD
        -- ==========================================
        CREATE TABLE RolUsuario (
            IdRol INT PRIMARY KEY IDENTITY(1,1),
            NombreRol VARCHAR(50) NOT NULL,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME
        );

        CREATE TABLE Usuario (
            IdUsuario INT PRIMARY KEY IDENTITY(1,1),
            Username VARCHAR(50) NOT NULL UNIQUE,
            Contrasena VARCHAR(200) NOT NULL,
            IdRol INT NOT NULL,
            IdEmpleado INT NOT NULL,
            Clave VARCHAR(200),
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME,
            CONSTRAINT FK_Usuario_Rol FOREIGN KEY (IdRol) REFERENCES RolUsuario(IdRol),
            CONSTRAINT FK_Usuario_Empleado FOREIGN KEY (IdEmpleado) REFERENCES Empleado(IdEmpleado)
        );

        -- ==========================================
        -- 4. MÓDULO DE ASISTENCIAS E INCIDENCIAS
        -- ==========================================
        CREATE TABLE Asistencia (
            IdAsistencia INT PRIMARY KEY IDENTITY(1,1),
            IdEmpleado INT NOT NULL,
            Fecha DATE NOT NULL,
            HoraEntrada DATETIME,
            HoraSalida DATETIME,
            HorasExtra DECIMAL(4,2) DEFAULT 0,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME,
            CONSTRAINT FK_Asistencia_Empleado FOREIGN KEY (IdEmpleado) REFERENCES Empleado(IdEmpleado)
        );

        CREATE TABLE Incidencia (
            IdIncidencia INT PRIMARY KEY IDENTITY(1,1),
            IdEmpleado INT NOT NULL,
            TipoIncidencia VARCHAR(50) NOT NULL, -- Falta, Suspension IGSS, Vacaciones, Permiso
            FechaInicio DATETIME NOT NULL,
            FechaFin DATETIME NOT NULL,
            ConGoceSueldo BIT DEFAULT 0,
            IdUsuarioAutoriza INT NOT NULL,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME,
            CONSTRAINT FK_Incidencia_Empleado FOREIGN KEY (IdEmpleado) REFERENCES Empleado(IdEmpleado),
            CONSTRAINT FK_Incidencia_Usuario FOREIGN KEY (IdUsuarioAutoriza) REFERENCES Usuario(IdUsuario)
        );

        CREATE TABLE ControlVacacion (
            IdControlVacacion INT PRIMARY KEY IDENTITY(1,1),
            IdEmpleado INT NOT NULL,
            AnioCorriente INT NOT NULL,
            DiasGanados INT DEFAULT 15, -- Mínimo legal en Guatemala
            DiasGozados DECIMAL(4,2) DEFAULT 0, -- Cambiado a DECIMAL por medios días
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME,
            CONSTRAINT FK_Vacacion_Empleado FOREIGN KEY (IdEmpleado) REFERENCES Empleado(IdEmpleado)
        );

        CREATE TABLE DetalleControlVacacion (
            IdDetalleVacacion INT PRIMARY KEY IDENTITY(1,1),
            IdControlVacacion INT NOT NULL,
            IdIncidencia INT NOT NULL,      
            DiasDescontados DECIMAL(4,2) NOT NULL,
            FechaRegistro DATETIME DEFAULT GETDATE(),
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME,
            CONSTRAINT FK_DetalleVac_Control FOREIGN KEY (IdControlVacacion) REFERENCES ControlVacacion(IdControlVacacion),
            CONSTRAINT FK_DetalleVac_Incidencia FOREIGN KEY (IdIncidencia) REFERENCES Incidencia(IdIncidencia)
        );

        -- ==========================================
        -- 5. MÓDULO DE MOVIMIENTOS Y PRESTACIONES
        -- ==========================================
        CREATE TABLE TipoMovimiento (
            IdTipoMovimiento INT PRIMARY KEY IDENTITY(1,1),
            NombreMovimiento VARCHAR(50) NOT NULL,
            Clasificacion VARCHAR(20) NOT NULL, -- 'Ingreso' o 'Descuento'
            EsFijo BIT DEFAULT 0, -- Ej: Bonificación Incentivo Q250.00
            AfectaIGSS BIT DEFAULT 1, -- Indica si suma para la base imponible del IGSS
            AfectaISR BIT DEFAULT 1,  -- Indica si suma para retención de ISR
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME
        );

        CREATE TABLE MovimientoEmpleado (
            IdMovimiento INT PRIMARY KEY IDENTITY(1,1),
            IdEmpleado INT NOT NULL,
            IdTipoMovimiento INT NOT NULL,
            Monto DECIMAL(18,2) NOT NULL,
            MesAplicacion INT NOT NULL,
            AnioAplicacion INT NOT NULL,
            FechaRegistro DATETIME DEFAULT GETDATE(),
            IdUsuarioIngresa INT NOT NULL,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME,
            CONSTRAINT FK_Movimiento_Empleado FOREIGN KEY (IdEmpleado) REFERENCES Empleado(IdEmpleado),
            CONSTRAINT FK_Movimiento_Tipo FOREIGN KEY (IdTipoMovimiento) REFERENCES TipoMovimiento(IdTipoMovimiento),
            CONSTRAINT FK_Movimiento_Usuario FOREIGN KEY (IdUsuarioIngresa) REFERENCES Usuario(IdUsuario)
        );

        -- Nuevo: Para llevar el control contable de las prestaciones de Ley (Aguinaldo, Bono 14, Indemnización)
        CREATE TABLE ProvisionPrestacion (
            IdProvision INT PRIMARY KEY IDENTITY(1,1),
            IdEmpleado INT NOT NULL,
            Mes INT NOT NULL,
            Anio INT NOT NULL,
            ProvisionBono14 DECIMAL(18,2) DEFAULT 0,
            ProvisionAguinaldo DECIMAL(18,2) DEFAULT 0,
            ProvisionIndemnizacion DECIMAL(18,2) DEFAULT 0,
            ProvisionVacaciones DECIMAL(18,2) DEFAULT 0,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME,
            CONSTRAINT FK_Provision_Empleado FOREIGN KEY (IdEmpleado) REFERENCES Empleado(IdEmpleado)
        );

        -- ==========================================
        -- 6. MÓDULO DE PLANILLA Y PARÁMETROS
        -- ==========================================
        CREATE TABLE ParametroGlobal (
            IdParametro INT PRIMARY KEY IDENTITY(1,1),
            NombreParametro VARCHAR(50) NOT NULL, -- Ej: IGSS_LABORAL (4.83), BONO_DECRETO_37_2001 (250)
            Valor DECIMAL(18,4) NOT NULL,
            Descripcion VARCHAR(255),
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME
        );

        CREATE TABLE NominaEncabezado (
            IdNomina INT PRIMARY KEY IDENTITY(1,1),
            Mes INT NOT NULL,
            Anio INT NOT NULL,
            Quincena INT NULL, -- 1, 2 o NULL si es pago mensual
            FechaGeneracion DATETIME DEFAULT GETDATE(),
            Estado VARCHAR(20) DEFAULT 'Pendiente', -- Pendiente, Autorizada, Pagada
            IdUsuarioGerente INT,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME,
            CONSTRAINT FK_Planilla_Gerente FOREIGN KEY (IdUsuarioGerente) REFERENCES Usuario(IdUsuario)
        );

        CREATE TABLE NominaDetalle (
            IdNominaDetalle INT PRIMARY KEY IDENTITY(1,1),
            IdNomina INT NOT NULL,
            IdEmpleado INT NOT NULL,
            DiasLaborados DECIMAL(4,2) DEFAULT 30, -- Para descuentos de faltas
            SueldoBase DECIMAL(18,2) NOT NULL,
            BonificacionIncentivo DECIMAL(18,2) DEFAULT 250.00, -- Decreto 37-2001 separado por ley
            OtrosIngresos DECIMAL(18,2) DEFAULT 0,
            DescuentoIGSS DECIMAL(18,2) DEFAULT 0,
            DescuentoISR DECIMAL(18,2) DEFAULT 0,
            OtrosDescuentos DECIMAL(18,2) DEFAULT 0,
            LiquidoRecibir DECIMAL(18,2) DEFAULT 0,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME,
            CONSTRAINT FK_Detalle_Nomina FOREIGN KEY (IdNomina) REFERENCES NominaEncabezado(IdNomina),
            CONSTRAINT FK_Detalle_Empleado FOREIGN KEY (IdEmpleado) REFERENCES Empleado(IdEmpleado)
        );

        -- ==========================================
        -- 7. MÓDULO DE SALIDA
        -- ==========================================
        CREATE TABLE RegistroEnvioBoleta (
            IdEnvio INT PRIMARY KEY IDENTITY(1,1),
            IdNominaDetalle INT NOT NULL,
            FechaEnvio DATETIME DEFAULT GETDATE(),
            Exitoso BIT DEFAULT 0,
            IdUsuarioEnvia INT NOT NULL,
            Activo BIT DEFAULT 1,
            FechaEliminacion DATETIME,
            CONSTRAINT FK_Envio_Detalle FOREIGN KEY (IdNominaDetalle) REFERENCES NominaDetalle(IdNominaDetalle),
            CONSTRAINT FK_Envio_Usuario FOREIGN KEY (IdUsuarioEnvia) REFERENCES Usuario(IdUsuario)
        );

-- =============================================
-- SISTEMA DE GESTIÓN DE NÓMINA - EXTENSIÓN DE BASE DE DATOS
-- Script para agregar funcionalidades de estados de nómina,
-- control de ventas, capital y estadísticas de eficiencia
-- =============================================

USE [sistema_pago_nomina]
GO

-- =============================================
-- 1. TABLAS PARA ESTADOS DE NÓMINA
-- =============================================

-- Tabla de Estados de Nómina
CREATE TABLE [dbo].[EstadoNomina] (
    [IdEstadoNomina] INT IDENTITY(1,1) PRIMARY KEY,
    [NombreEstado] VARCHAR(50) NOT NULL UNIQUE,
    [Descripcion] VARCHAR(255),
    [Orden] INT NOT NULL,
    [RequiereAprobacion] BIT DEFAULT 0,
    [Activo] BIT DEFAULT 1,
    [FechaEliminacion] DATETIME NULL
);

-- Tabla de Historial de Estados de Nómina
CREATE TABLE [dbo].[HistorialEstadoNomina] (
    [IdHistorial] INT IDENTITY(1,1) PRIMARY KEY,
    [IdNomina] INT NOT NULL,
    [IdEstadoAnterior] INT NULL,
    [IdEstadoNuevo] INT NOT NULL,
    [IdUsuarioCambio] INT NOT NULL,
    [FechaCambio] DATETIME DEFAULT GETDATE(),
    [Comentarios] VARCHAR(500),
    [Activo] BIT DEFAULT 1,
    [FechaEliminacion] DATETIME NULL,

    CONSTRAINT [FK_HistorialEstado_Nomina] FOREIGN KEY ([IdNomina])
        REFERENCES [dbo].[NominaEncabezado] ([IdNomina]),
    CONSTRAINT [FK_HistorialEstado_EstadoAnterior] FOREIGN KEY ([IdEstadoAnterior])
        REFERENCES [dbo].[EstadoNomina] ([IdEstadoNomina]),
    CONSTRAINT [FK_HistorialEstado_EstadoNuevo] FOREIGN KEY ([IdEstadoNuevo])
        REFERENCES [dbo].[EstadoNomina] ([IdEstadoNomina]),
    CONSTRAINT [FK_HistorialEstado_Usuario] FOREIGN KEY ([IdUsuarioCambio])
        REFERENCES [dbo].[Usuario] ([IdUsuario])
);

-- =============================================
-- 2. TABLAS PARA CONTROL DE VENTAS
-- =============================================

-- Tabla de Clientes
CREATE TABLE [dbo].[Cliente] (
    [IdCliente] INT IDENTITY(1,1) PRIMARY KEY,
    [NombreCliente] VARCHAR(200) NOT NULL,
    [TipoCliente] VARCHAR(20) CHECK ([TipoCliente] IN ('INDIVIDUAL', 'EMPRESA')),
    [NIT] VARCHAR(15),
    [DPI] VARCHAR(13),
    [Correo] VARCHAR(100),
    [Telefono] VARCHAR(15),
    [Direccion] VARCHAR(300),
    [Activo] BIT DEFAULT 1,
    [FechaEliminacion] DATETIME NULL
);

-- Tabla de Productos/Servicios
CREATE TABLE [dbo].[ProductoServicio] (
    [IdProducto] INT IDENTITY(1,1) PRIMARY KEY,
    [NombreProducto] VARCHAR(200) NOT NULL,
    [TipoProducto] VARCHAR(20) CHECK ([TipoProducto] IN ('PRODUCTO', 'SERVICIO')),
    [PrecioUnitario] DECIMAL(18,2) NOT NULL,
    [CostoUnitario] DECIMAL(18,2),
    [UnidadMedida] VARCHAR(20),
    [Activo] BIT DEFAULT 1,
    [FechaEliminacion] DATETIME NULL
);

-- Tabla de Ventas
CREATE TABLE [dbo].[Venta] (
    [IdVenta] INT IDENTITY(1,1) PRIMARY KEY,
    [IdCliente] INT NULL,
    [FechaVenta] DATETIME DEFAULT GETDATE(),
    [TipoVenta] VARCHAR(20) CHECK ([TipoVenta] IN ('CONTADO', 'CREDITO')),
    [Subtotal] DECIMAL(18,2) NOT NULL,
    [Descuento] DECIMAL(18,2) DEFAULT 0,
    [Impuestos] DECIMAL(18,2) DEFAULT 0,
    [Total] DECIMAL(18,2) NOT NULL,
    [EstadoPago] VARCHAR(20) CHECK ([EstadoPago] IN ('PENDIENTE', 'PAGADO', 'CANCELADO')),
    [FechaVencimiento] DATETIME NULL,
    [IdUsuarioRegistra] INT NOT NULL,
    [Notas] VARCHAR(500),
    [Activo] BIT DEFAULT 1,
    [FechaEliminacion] DATETIME NULL,

    CONSTRAINT [FK_Venta_Cliente] FOREIGN KEY ([IdCliente])
        REFERENCES [dbo].[Cliente] ([IdCliente]),
    CONSTRAINT [FK_Venta_Usuario] FOREIGN KEY ([IdUsuarioRegistra])
        REFERENCES [dbo].[Usuario] ([IdUsuario])
);

-- Tabla de Detalles de Venta
CREATE TABLE [dbo].[DetalleVenta] (
    [IdDetalleVenta] INT IDENTITY(1,1) PRIMARY KEY,
    [IdVenta] INT NOT NULL,
    [IdProducto] INT NOT NULL,
    [Cantidad] DECIMAL(10,2) NOT NULL,
    [PrecioUnitario] DECIMAL(18,2) NOT NULL,
    [Descuento] DECIMAL(18,2) DEFAULT 0,
    [Subtotal] DECIMAL(18,2) NOT NULL,
    [Activo] BIT DEFAULT 1,
    [FechaEliminacion] DATETIME NULL,

    CONSTRAINT [FK_DetalleVenta_Venta] FOREIGN KEY ([IdVenta])
        REFERENCES [dbo].[Venta] ([IdVenta]),
    CONSTRAINT [FK_DetalleVenta_Producto] FOREIGN KEY ([IdProducto])
        REFERENCES [dbo].[ProductoServicio] ([IdProducto])
);

-- =============================================
-- 3. TABLAS PARA CONTROL DE CAPITAL Y FINANZAS
-- =============================================

-- Tabla de Cuentas Bancarias de la Empresa
CREATE TABLE [dbo].[CuentaBancariaEmpresa] (
    [IdCuenta] INT IDENTITY(1,1) PRIMARY KEY,
    [IdBanco] INT NOT NULL,
    [NumeroCuenta] VARCHAR(50) NOT NULL UNIQUE,
    [NombreCuenta] VARCHAR(100) NOT NULL,
    [TipoCuenta] VARCHAR(20) CHECK ([TipoCuenta] IN ('CORRIENTE', 'AHORRO', 'MONETARIA')),
    [SaldoActual] DECIMAL(18,2) DEFAULT 0,
    [Moneda] VARCHAR(3) DEFAULT 'GTQ',
    [Activo] BIT DEFAULT 1,
    [FechaEliminacion] DATETIME NULL,

    CONSTRAINT [FK_CuentaBanco_Banco] FOREIGN KEY ([IdBanco])
        REFERENCES [dbo].[Banco] ([IdBanco])
);

-- Tabla de Movimientos Financieros
CREATE TABLE [dbo].[MovimientoFinanciero] (
    [IdMovimiento] INT IDENTITY(1,1) PRIMARY KEY,
    [IdCuenta] INT NOT NULL,
    [TipoMovimiento] VARCHAR(20) CHECK ([TipoMovimiento] IN ('INGRESO', 'EGRESO')),
    [Categoria] VARCHAR(50) NOT NULL,
    [Subcategoria] VARCHAR(100),
    [Monto] DECIMAL(18,2) NOT NULL,
    [FechaMovimiento] DATETIME DEFAULT GETDATE(),
    [Referencia] VARCHAR(100),
    [IdUsuarioRegistra] INT NOT NULL,
    [IdVenta] INT NULL, -- Para ingresos por ventas
    [IdNomina] INT NULL, -- Para egresos por nómina
    [Notas] VARCHAR(500),
    [Activo] BIT DEFAULT 1,
    [FechaEliminacion] DATETIME NULL,

    CONSTRAINT [FK_MovimientoFinanciero_Cuenta] FOREIGN KEY ([IdCuenta])
        REFERENCES [dbo].[CuentaBancariaEmpresa] ([IdCuenta]),
    CONSTRAINT [FK_MovimientoFinanciero_Usuario] FOREIGN KEY ([IdUsuarioRegistra])
        REFERENCES [dbo].[Usuario] ([IdUsuario]),
    CONSTRAINT [FK_MovimientoFinanciero_Venta] FOREIGN KEY ([IdVenta])
        REFERENCES [dbo].[Venta] ([IdVenta]),
    CONSTRAINT [FK_MovimientoFinanciero_Nomina] FOREIGN KEY ([IdNomina])
        REFERENCES [dbo].[NominaEncabezado] ([IdNomina])
);

-- =============================================
-- 4. TABLAS PARA ESTADÍSTICAS Y EFICIENCIA
-- =============================================

-- Tabla de Indicadores de Eficiencia
CREATE TABLE [dbo].[IndicadorEficiencia] (
    [IdIndicador] INT IDENTITY(1,1) PRIMARY KEY,
    [NombreIndicador] VARCHAR(100) NOT NULL UNIQUE,
    [TipoIndicador] VARCHAR(20) CHECK ([TipoIndicador] IN ('FINANCIERO', 'OPERATIVO', 'RRHH')),
    [UnidadMedida] VARCHAR(20),
    [FormulaCalculo] VARCHAR(500),
    [MetaMinima] DECIMAL(18,4),
    [MetaMaxima] DECIMAL(18,4),
    [Activo] BIT DEFAULT 1,
    [FechaEliminacion] DATETIME NULL
);

-- Tabla de Estadísticas Mensuales
CREATE TABLE [dbo].[EstadisticaMensual] (
    [IdEstadistica] INT IDENTITY(1,1) PRIMARY KEY,
    [Anio] INT NOT NULL,
    [Mes] INT NOT NULL,
    [IdIndicador] INT NOT NULL,
    [Valor] DECIMAL(18,4) NOT NULL,
    [FechaRegistro] DATETIME DEFAULT GETDATE(),
    [IdUsuarioRegistra] INT NOT NULL,
    [Notas] VARCHAR(500),
    [Activo] BIT DEFAULT 1,
    [FechaEliminacion] DATETIME NULL,

    CONSTRAINT [FK_Estadistica_Indicador] FOREIGN KEY ([IdIndicador])
        REFERENCES [dbo].[IndicadorEficiencia] ([IdIndicador]),
    CONSTRAINT [FK_Estadistica_Usuario] FOREIGN KEY ([IdUsuarioRegistra])
        REFERENCES [dbo].[Usuario] ([IdUsuario]),
    CONSTRAINT [UK_Estadistica_AnioMesIndicador] UNIQUE ([Anio], [Mes], [IdIndicador])
);

-- Tabla de Presupuestos Anuales
CREATE TABLE [dbo].[PresupuestoAnual] (
    [IdPresupuesto] INT IDENTITY(1,1) PRIMARY KEY,
    [Anio] INT NOT NULL UNIQUE,
    [PresupuestoVentas] DECIMAL(18,2) NOT NULL,
    [PresupuestoGastos] DECIMAL(18,2) NOT NULL,
    [PresupuestoNomina] DECIMAL(18,2) NOT NULL,
    [PresupuestoInversiones] DECIMAL(18,2),
    [IdUsuarioRegistra] INT NOT NULL,
    [FechaRegistro] DATETIME DEFAULT GETDATE(),
    [Activo] BIT DEFAULT 1,
    [FechaEliminacion] DATETIME NULL,

    CONSTRAINT [FK_Presupuesto_Usuario] FOREIGN KEY ([IdUsuarioRegistra])
        REFERENCES [dbo].[Usuario] ([IdUsuario])
);

-- =============================================
-- 5. MODIFICACIONES A TABLAS EXISTENTES
-- =============================================

-- Agregar columna de estado actual a NominaEncabezado
ALTER TABLE [dbo].[NominaEncabezado]
ADD [IdEstadoActual] INT NULL;

ALTER TABLE [dbo].[NominaEncabezado]
ADD CONSTRAINT [FK_NominaEncabezado_Estado] FOREIGN KEY ([IdEstadoActual])
    REFERENCES [dbo].[EstadoNomina] ([IdEstadoNomina]);

-- Agregar columna de capital inicial a Empresa
ALTER TABLE [dbo].[Empresa]
ADD [CapitalInicial] DECIMAL(18,2) DEFAULT 0;

ALTER TABLE [dbo].[Empresa]
ADD [CapitalActual] DECIMAL(18,2) DEFAULT 0;

-- =============================================
-- 6. DATOS INICIALES
-- =============================================

-- Estados de Nómina
INSERT INTO [dbo].[EstadoNomina] ([NombreEstado], [Descripcion], [Orden], [RequiereAprobacion]) VALUES
('BORRADOR', 'Nómina en proceso de creación', 1, 0),
('PENDIENTE_APROBACION', 'Esperando aprobación del gerente', 2, 1),
('APROBADO', 'Nómina aprobada y lista para pago', 3, 0),
('PAGADO', 'Nómina pagada a empleados', 4, 0),
('CANCELADO', 'Nómina cancelada', 5, 0);

-- Indicadores de Eficiencia
INSERT INTO [dbo].[IndicadorEficiencia] ([NombreIndicador], [TipoIndicador], [UnidadMedida], [FormulaCalculo], [MetaMinima], [MetaMaxima]) VALUES
('VENTAS_MENSUALES', 'FINANCIERO', 'GTQ', 'Suma de ventas del mes', 50000.00, 200000.00),
('UTILIDAD_NETA', 'FINANCIERO', 'GTQ', 'Ventas - Costos - Gastos', 10000.00, 50000.00),
('PRODUCTIVIDAD_EMPLEADO', 'RRHH', 'GTQ', 'Ventas / Número de empleados', 15000.00, 40000.00),
('ROTACION_PERSONAL', 'RRHH', 'PORCENTAJE', 'Empleados dados de baja / Total empleados * 100', 0.00, 15.00),
('CUMPLIMIENTO_PRESUPUESTO', 'FINANCIERO', 'PORCENTAJE', 'Gastos reales / Presupuesto * 100', 80.00, 110.00),
('EFICIENCIA_OPERATIVA', 'OPERATIVO', 'PORCENTAJE', 'Ventas / Gastos operativos', 2.00, 5.00);

-- =============================================
-- 7. ÍNDICES PARA MEJORAR PERFORMANCE
-- =============================================

CREATE INDEX [IX_HistorialEstadoNomina_IdNomina] ON [dbo].[HistorialEstadoNomina] ([IdNomina]);
CREATE INDEX [IX_HistorialEstadoNomina_FechaCambio] ON [dbo].[HistorialEstadoNomina] ([FechaCambio]);

CREATE INDEX [IX_Venta_FechaVenta] ON [dbo].[Venta] ([FechaVenta]);
CREATE INDEX [IX_Venta_IdCliente] ON [dbo].[Venta] ([IdCliente]);
CREATE INDEX [IX_Venta_EstadoPago] ON [dbo].[Venta] ([EstadoPago]);

CREATE INDEX [IX_DetalleVenta_IdVenta] ON [dbo].[DetalleVenta] ([IdVenta]);

CREATE INDEX [IX_MovimientoFinanciero_IdCuenta] ON [dbo].[MovimientoFinanciero] ([IdCuenta]);
CREATE INDEX [IX_MovimientoFinanciero_FechaMovimiento] ON [dbo].[MovimientoFinanciero] ([FechaMovimiento]);
CREATE INDEX [IX_MovimientoFinanciero_TipoMovimiento] ON [dbo].[MovimientoFinanciero] ([TipoMovimiento]);

CREATE INDEX [IX_EstadisticaMensual_AnioMes] ON [dbo].[EstadisticaMensual] ([Anio], [Mes]);

-- =============================================
-- 8. VISTAS ÚTILES PARA REPORTES
-- =============================================

-- Vista de Nóminas con Estado Actual
CREATE VIEW [dbo].[vw_NominasConEstado] AS
SELECT
    ne.*,
    en.NombreEstado,
    en.Descripcion as EstadoDescripcion,
    en.RequiereAprobacion
FROM [dbo].[NominaEncabezado] ne
LEFT JOIN [dbo].[EstadoNomina] en ON ne.IdEstadoActual = en.IdEstadoNomina
WHERE ne.Activo = 1 AND en.Activo = 1;

-- Vista de Ventas Mensuales
CREATE VIEW [dbo].[vw_VentasMensuales] AS
SELECT
    YEAR(FechaVenta) as Anio,
    MONTH(FechaVenta) as Mes,
    COUNT(*) as NumeroVentas,
    SUM(Total) as TotalVentas,
    AVG(Total) as PromedioVenta,
    SUM(CASE WHEN EstadoPago = 'PAGADO' THEN Total ELSE 0 END) as VentasPagadas
FROM [dbo].[Venta]
WHERE Activo = 1
GROUP BY YEAR(FechaVenta), MONTH(FechaVenta);

-- Vista de Balance Financiero Mensual
CREATE VIEW [dbo].[vw_BalanceMensual] AS
SELECT
    YEAR(mf.FechaMovimiento) as Anio,
    MONTH(mf.FechaMovimiento) as Mes,
    SUM(CASE WHEN mf.TipoMovimiento = 'INGRESO' THEN mf.Monto ELSE 0 END) as TotalIngresos,
    SUM(CASE WHEN mf.TipoMovimiento = 'EGRESO' THEN mf.Monto ELSE 0 END) as TotalEgresos,
    SUM(CASE WHEN mf.TipoMovimiento = 'INGRESO' THEN mf.Monto ELSE -mf.Monto END) as Balance
FROM [dbo].[MovimientoFinanciero] mf
WHERE mf.Activo = 1
GROUP BY YEAR(mf.FechaMovimiento), MONTH(mf.FechaMovimiento);

-- Vista de Indicadores de Eficiencia por Mes
CREATE VIEW [dbo].[vw_IndicadoresEficiencia] AS
SELECT
    em.Anio,
    em.Mes,
    ie.NombreIndicador,
    ie.TipoIndicador,
    ie.UnidadMedida,
    em.Valor,
    ie.MetaMinima,
    ie.MetaMaxima,
    CASE
        WHEN em.Valor >= ie.MetaMinima AND em.Valor <= ie.MetaMaxima THEN 'EN_META'
        WHEN em.Valor < ie.MetaMinima THEN 'BAJO_META'
        WHEN em.Valor > ie.MetaMaxima THEN 'SOBRE_META'
    END as EstadoMeta
FROM [dbo].[EstadisticaMensual] em
INNER JOIN [dbo].[IndicadorEficiencia] ie ON em.IdIndicador = ie.IdIndicador
WHERE em.Activo = 1 AND ie.Activo = 1;

PRINT 'Script ejecutado exitosamente. Base de datos extendida con funcionalidades de estados de nómina, ventas, capital y estadísticas.';


    COMMIT TRANSACTION;
    PRINT 'Base de datos PagoPlanilla (Guatemala) generada exitosamente con borrados lógicos.';

END TRY
BEGIN CATCH
    IF (XACT_STATE()) <> 0 ROLLBACK TRANSACTION;
    
    SELECT 
        ERROR_NUMBER() AS NumeroError,
        ERROR_MESSAGE() AS MensajeError,
        ERROR_LINE() as LineaError;
END CATCH;


