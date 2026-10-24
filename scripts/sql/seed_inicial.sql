-- Datos mínimos para arrancar una base creada con `prisma db push` (scripts/init-db.sh).
-- Idempotente: cada bloque solo inserta lo que falta, se puede ejecutar varias veces.
-- Variables de sqlcmd: ADMIN_USER, ADMIN_HASH, CLAVE_HASH, ADMIN_EMAIL (las pasa init-db.sh).
-- Los valores de los parámetros son los del proyecto (migracion_d10_isr_sat.sql y README);
-- revisarlos con RRHH antes de calcular nóminas reales.
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- ── Roles ─────────────────────────────────────────────────────────────
INSERT INTO RolUsuario (NombreRol, Activo)
SELECT r.NombreRol, 1
FROM (VALUES ('ADMINISTRADOR'), ('ADMIN'), ('GERENTE'), ('RRHH'), ('RECURSOS HUMANOS')) r(NombreRol)
WHERE NOT EXISTS (SELECT 1 FROM RolUsuario x WHERE x.NombreRol = r.NombreRol);

-- ── Estados de nómina (flujo BORRADOR → … → PAGADO, CANCELADO disponible siempre) ──
INSERT INTO EstadoNomina (NombreEstado, Descripcion, Orden, RequiereAprobacion, Activo, Color, EsFinal, EsCancelacion)
SELECT e.NombreEstado, e.Descripcion, e.Orden, e.RequiereAprobacion, 1, e.Color, e.EsFinal, e.EsCancelacion
FROM (VALUES
  ('BORRADOR',             'Nómina en proceso de creación',      1, 0, 'secondary', 0, 0),
  ('PENDIENTE_APROBACION', 'Esperando aprobación del gerente',   2, 1, 'warn',      0, 0),
  ('APROBADO',             'Nómina aprobada y lista para pago',  3, 0, 'info',      0, 0),
  ('PAGADO',               'Nómina pagada a empleados',          4, 0, 'success',   1, 0),
  ('CANCELADO',            'Nómina cancelada',                   5, 0, 'danger',    0, 1)
) e(NombreEstado, Descripcion, Orden, RequiereAprobacion, Color, EsFinal, EsCancelacion)
WHERE NOT EXISTS (SELECT 1 FROM EstadoNomina x WHERE x.NombreEstado = e.NombreEstado);

-- ── Indicadores de eficiencia ────────────────────────────────────────
INSERT INTO IndicadorEficiencia (NombreIndicador, TipoIndicador, UnidadMedida, FormulaCalculo, MetaMinima, MetaMaxima, Activo)
SELECT i.N, i.T, i.U, i.F, i.MinV, i.MaxV, 1
FROM (VALUES
  ('VENTAS_MENSUALES',         'FINANCIERO', 'GTQ',        'Suma de ventas del mes',                          50000.00, 200000.00),
  ('UTILIDAD_NETA',            'FINANCIERO', 'GTQ',        'Ventas - Costos - Gastos',                        10000.00,  50000.00),
  ('PRODUCTIVIDAD_EMPLEADO',   'RRHH',       'GTQ',        'Ventas / Número de empleados',                    15000.00,  40000.00),
  ('ROTACION_PERSONAL',        'RRHH',       'PORCENTAJE', 'Empleados dados de baja / Total empleados * 100',     0.00,     15.00),
  ('CUMPLIMIENTO_PRESUPUESTO', 'FINANCIERO', 'PORCENTAJE', 'Gastos reales / Presupuesto * 100',                  80.00,    110.00),
  ('EFICIENCIA_OPERATIVA',     'OPERATIVO',  'PORCENTAJE', 'Ventas / Gastos operativos',                          2.00,      5.00)
) i(N, T, U, F, MinV, MaxV)
WHERE NOT EXISTS (SELECT 1 FROM IndicadorEficiencia x WHERE x.NombreIndicador = i.N);

-- ── Parámetros globales (los obligatorios de NominaService y los opcionales) ──
INSERT INTO ParametroGlobal (NombreParametro, Valor, Descripcion, Activo, Tipo, Unidad)
SELECT p.N, p.V, p.D, 1, p.T, p.U
FROM (VALUES
  ('IGSS_EMPLEADO',          3.67,   'Cuota laboral IGSS sobre el salario',                                'DESCUENTO',  '%'),
  ('ISR_BASE_ANUAL',         48000,  'Deducción anual sin comprobación para ISR (Q48,000)',               'REFERENCIA', 'Q'),
  ('ISR_TASA_1',             5,      'ISR tramo 1 (SAT): 5% sobre la renta imponible hasta Q300,000',      'DESCUENTO',  '%'),
  ('ISR_TASA_2',             7,      'ISR tramo 2 (SAT): 7% sobre el excedente de Q300,000',               'DESCUENTO',  '%'),
  ('ISR_LIMITE_TRAMO_1',     300000, 'Renta imponible anual hasta la que aplica el tramo 1 (Q300,000)',   'REFERENCIA', 'Q'),
  ('BONO_14_PORCENTAJE',     8.33,   'Provisión mensual de Bono 14',                                       'INGRESO',    '%'),
  ('AGUINALDO_PORCENTAJE',   8.33,   'Provisión mensual de aguinaldo',                                     'INGRESO',    '%'),
  ('BONO_PRODUCTIVIDAD',     250,    'Bonificación incentivo (Decreto 37-2001)',                           'INGRESO',    'Q'),
  ('IRTRA_PORCENTAJE',       1,      'Aporte IRTRA',                                                        'DESCUENTO',  '%'),
  ('INTECAP_PORCENTAJE',     1,      'Aporte INTECAP',                                                      'DESCUENTO',  '%'),
  ('HORAS_EXTRA_PORCENTAJE', 50,     'Recargo legal sobre horas extra (50% = pago al 150%)',               'INGRESO',    '%'),
  ('HORAS_LABORALES_DIA',    8,      'Horas laborales ordinarias por día para calcular el valor/hora',    'REFERENCIA', 'Q')
) p(N, V, D, T, U)
WHERE NOT EXISTS (SELECT 1 FROM ParametroGlobal x WHERE x.NombreParametro = p.N);

-- ── Administrador inicial (solo si la base no tiene ningún usuario) ──
IF NOT EXISTS (SELECT 1 FROM Usuario)
BEGIN
    DECLARE @dep INT, @puesto INT, @jornada INT, @emp INT, @rol INT;

    SELECT TOP 1 @dep = IdDepartamento FROM Departamento WHERE NombreDepartamento = 'Administración';
    IF @dep IS NULL
    BEGIN
        INSERT INTO Departamento (NombreDepartamento, Activo) VALUES ('Administración', 1);
        SET @dep = SCOPE_IDENTITY();
    END

    SELECT TOP 1 @puesto = IdPuesto FROM Puesto WHERE NombrePuesto = 'Administrador del sistema';
    IF @puesto IS NULL
    BEGIN
        INSERT INTO Puesto (NombrePuesto, IdDepartamento, Activo) VALUES ('Administrador del sistema', @dep, 1);
        SET @puesto = SCOPE_IDENTITY();
    END

    SELECT TOP 1 @jornada = IdJornada FROM JornadaLaboral WHERE NombreJornada = 'Diurna';
    IF @jornada IS NULL
    BEGIN
        INSERT INTO JornadaLaboral (NombreJornada, HorasDiarias, HorasSemanales, Activo) VALUES ('Diurna', 8, 44, 1);
        SET @jornada = SCOPE_IDENTITY();
    END

    INSERT INTO Empleado (DPI, NIT, Nombres, Apellidos, CorreoPersonal, FechaIngresa, IdPuesto, IdJornada,
                          Telefono, Genero, Activo, IdDepartamento)
    VALUES ('0000000000000', 'CF', 'Administrador', 'del Sistema', '$(ADMIN_EMAIL)', GETDATE(), @puesto, @jornada,
            '00000000', 1, 1, @dep);
    SET @emp = SCOPE_IDENTITY();

    SELECT @rol = IdRol FROM RolUsuario WHERE NombreRol = 'ADMINISTRADOR';
    INSERT INTO Usuario (Username, Contrasena, IdRol, IdEmpleado, Clave, Activo)
    VALUES ('$(ADMIN_USER)', '$(ADMIN_HASH)', @rol, @emp, '$(CLAVE_HASH)', 1);

    PRINT 'Administrador inicial creado: $(ADMIN_USER)';
END

COMMIT TRANSACTION;
