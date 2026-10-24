-- R-01: índices de desempeño (ISO 25010 – Eficiencia de desempeño).
-- Cubren las consultas más frecuentes: nómina por período, detalle por nómina/empleado,
-- asistencias y salarios por empleado, y auditoría por fecha/usuario.
-- Idempotente: se puede ejecutar varias veces. Los mismos índices están declarados en
-- backend/prisma/schema.prisma para que `prisma db push` no los elimine.

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Asistencia_Empleado_Fecha' AND object_id = OBJECT_ID('dbo.Asistencia'))
    CREATE INDEX IX_Asistencia_Empleado_Fecha ON dbo.Asistencia (IdEmpleado, Fecha);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_NominaDetalle_IdNomina' AND object_id = OBJECT_ID('dbo.NominaDetalle'))
    CREATE INDEX IX_NominaDetalle_IdNomina ON dbo.NominaDetalle (IdNomina);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_NominaDetalle_IdEmpleado' AND object_id = OBJECT_ID('dbo.NominaDetalle'))
    CREATE INDEX IX_NominaDetalle_IdEmpleado ON dbo.NominaDetalle (IdEmpleado);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_NominaEncabezado_AnioMes' AND object_id = OBJECT_ID('dbo.NominaEncabezado'))
    CREATE INDEX IX_NominaEncabezado_AnioMes ON dbo.NominaEncabezado (Anio, Mes);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_NominaEncabezado_Estado' AND object_id = OBJECT_ID('dbo.NominaEncabezado'))
    CREATE INDEX IX_NominaEncabezado_Estado ON dbo.NominaEncabezado (IdEstadoActual);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Salario_Empleado_Activo' AND object_id = OBJECT_ID('dbo.Salario'))
    CREATE INDEX IX_Salario_Empleado_Activo ON dbo.Salario (IdEmpleado, Activo);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditoriaSession_FechaHora' AND object_id = OBJECT_ID('dbo.AuditoriaSession'))
    CREATE INDEX IX_AuditoriaSession_FechaHora ON dbo.AuditoriaSession (FechaHora);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditoriaSession_IdUsuario' AND object_id = OBJECT_ID('dbo.AuditoriaSession'))
    CREATE INDEX IX_AuditoriaSession_IdUsuario ON dbo.AuditoriaSession (IdUsuario);
GO
