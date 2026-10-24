-- D-12: permitir el estado VENCIDO en las ventas.
-- La restricción original solo admitía PENDIENTE, PAGADO y CANCELADO, por lo que ninguna
-- orden podía pasar a VENCIDO aunque la aplicación lo intentara.
-- El nombre de la restricción lo generó SQL Server, así que se busca dinámicamente.

BEGIN TRANSACTION;

DECLARE @restriccion NVARCHAR(256);

SELECT @restriccion = cc.name
FROM sys.check_constraints cc
JOIN sys.columns c
  ON c.object_id = cc.parent_object_id AND c.column_id = cc.parent_column_id
WHERE cc.parent_object_id = OBJECT_ID('dbo.Venta') AND c.name = 'EstadoPago';

IF @restriccion IS NOT NULL
    EXEC('ALTER TABLE dbo.Venta DROP CONSTRAINT [' + @restriccion + ']');

ALTER TABLE dbo.Venta ADD CONSTRAINT CK_Venta_EstadoPago
    CHECK ([EstadoPago] IN ('PENDIENTE', 'PAGADO', 'CANCELADO', 'VENCIDO'));

COMMIT TRANSACTION;
