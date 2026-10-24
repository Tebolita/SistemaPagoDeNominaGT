-- D-10: tramos de ISR para asalariados según la SAT (Decreto 10-2012, arts. 72 y 73)
--   Renta imponible = salario anual - Q48,000 - cuotas IGSS del año
--   Hasta Q300,000: 5 %.  Excedente de Q300,000: Q15,000 + 7 %.
-- Reemplaza la tabla anterior de 6 tramos (5 % a 34 %) con base exenta de Q47,200.

BEGIN TRANSACTION;

UPDATE ParametroGlobal
SET Valor = 48000,
    Descripcion = 'Deducción anual sin comprobación para ISR (Q48,000); además se restan las cuotas IGSS'
WHERE NombreParametro = 'ISR_BASE_ANUAL';

UPDATE ParametroGlobal
SET Valor = 5,
    Descripcion = 'ISR tramo 1 (SAT): 5% sobre la renta imponible hasta Q300,000'
WHERE NombreParametro = 'ISR_TASA_1';

UPDATE ParametroGlobal
SET Valor = 7,
    Descripcion = 'ISR tramo 2 (SAT): 7% sobre el excedente de Q300,000'
WHERE NombreParametro = 'ISR_TASA_2';

IF NOT EXISTS (SELECT 1 FROM ParametroGlobal WHERE NombreParametro = 'ISR_LIMITE_TRAMO_1')
    INSERT INTO ParametroGlobal (NombreParametro, Valor, Descripcion, Activo, Tipo, Unidad)
    VALUES ('ISR_LIMITE_TRAMO_1', 300000,
            'Renta imponible anual hasta la que aplica el tramo 1 del ISR (Q300,000)',
            1, 'REFERENCIA', 'Q');

-- Los tramos 3 a 6 no existen en la tabla de la SAT para asalariados
UPDATE ParametroGlobal
SET Activo = 0,
    FechaEliminacion = GETDATE()
WHERE NombreParametro IN ('ISR_TASA_3', 'ISR_TASA_4', 'ISR_TASA_5', 'ISR_TASA_6');

COMMIT TRANSACTION;
