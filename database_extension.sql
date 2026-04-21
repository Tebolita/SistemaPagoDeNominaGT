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