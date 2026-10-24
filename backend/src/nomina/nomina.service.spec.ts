import { BadRequestException } from '@nestjs/common';
import { NominaService } from './nomina.service';

// Parámetros globales tal como quedaron tras migracion_d10_isr_sat.sql
const PARAMETROS: Record<string, number> = {
  IGSS_EMPLEADO: 3.67,
  ISR_BASE_ANUAL: 48000,
  ISR_TASA_1: 5,
  ISR_TASA_2: 7,
  ISR_LIMITE_TRAMO_1: 300000,
  BONO_14_PORCENTAJE: 8.33,
  AGUINALDO_PORCENTAJE: 8.33,
  BONO_PRODUCTIVIDAD: 250,
  IRTRA_PORCENTAJE: 1,
  INTECAP_PORCENTAJE: 1,
  HORAS_EXTRA_PORCENTAJE: 50,
  HORAS_LABORALES_DIA: 8,
};

const filasParametros = (valores: Record<string, number>, extra: Record<string, any> = {}) =>
  Object.entries(valores).map(([NombreParametro, Valor]) => ({
    NombreParametro,
    Valor,
    FiltroGenero: null,
    FiltroIdDepartamento: null,
    FiltroIdPuesto: null,
    FiltroIdJornada: null,
    ...(extra[NombreParametro] ?? {}),
  }));

describe('NominaService', () => {
  let prisma: any;
  let service: NominaService;

  beforeEach(() => {
    prisma = {
      empleado: {
        findUnique: jest.fn().mockResolvedValue({
          IdEmpleado: 1, Genero: false, IdDepartamento: 2, IdPuesto: 3, IdJornada: 1,
        }),
      },
      parametroGlobal: { findMany: jest.fn().mockResolvedValue(filasParametros(PARAMETROS)) },
      nominaEncabezado: { findUnique: jest.fn(), update: jest.fn() },
    };
    service = new NominaService(prisma, {} as any, {} as any);
  });

  // D-10: ISR asalariados según la SAT (Decreto 10-2012, arts. 72 y 73)
  describe('calcularNomina: ISR', () => {
    it.each([
      // salario, ISR mensual esperado (cálculo manual)
      [5000, 40.83],   // renta imponible 9,798 × 5 % / 12
      [10000, 281.65], // renta imponible 67,596 × 5 % / 12
      [35000, 1580.09], // (300,000 × 5 % + 56,586 × 7 %) / 12
    ])('salario Q%d → ISR mensual Q%d', async (salario, isrEsperado) => {
      const r = await service.calcularNomina(1, salario);
      expect(r.descuentoISR).toBeCloseTo(isrEsperado, 2);
    });

    it('no cobra ISR si la renta imponible no supera las deducciones', async () => {
      const r = await service.calcularNomina(1, 3500);
      expect(r.descuentoISR).toBe(0);
    });

    it('la deducción incluye las cuotas IGSS del año', async () => {
      const r = await service.calcularNomina(1, 10000);
      const igssAnual = r.descuentoIGSS * 12;
      const imponible = 10000 * 12 - 48000 - igssAnual;
      expect(r.descuentoISR).toBeCloseTo((imponible * 0.05) / 12, 2);
    });
  });

  describe('calcularNomina: resto de conceptos', () => {
    it('calcula IGSS, IRTRA, INTECAP, Bono 14 y aguinaldo con los porcentajes configurados', async () => {
      const r = await service.calcularNomina(1, 10000);

      expect(r.descuentoIGSS).toBe(367);
      expect(r.descuentoIRTRA).toBe(100);
      expect(r.descuentoINTECAP).toBe(100);
      expect(r.bono14).toBe(833);
      expect(r.aguinaldo).toBe(833);
      expect(r.bonoProductividad).toBe(250);
      expect(r.netoAPagar).toBeCloseTo(r.totalIngresos - r.totalDescuentos, 2);
    });

    it('un parámetro con filtro que el empleado no cumple vale cero', async () => {
      prisma.parametroGlobal.findMany.mockResolvedValue(
        filasParametros(PARAMETROS, { BONO_PRODUCTIVIDAD: { FiltroIdDepartamento: 99 } }),
      );

      const r = await service.calcularNomina(1, 10000);
      expect(r.bonoProductividad).toBe(0);
    });

    it('rechaza un salario base de cero', async () => {
      await expect(service.calcularNomina(1, 0)).rejects.toThrow('El salario base debe ser mayor a cero');
    });
  });

  // D-16: un parámetro obligatorio ausente ya no se trata como cero
  describe('parámetros obligatorios', () => {
    it.each(['IGSS_EMPLEADO', 'ISR_TASA_2', 'ISR_LIMITE_TRAMO_1', 'HORAS_EXTRA_PORCENTAJE'])(
      'falla indicando el nombre si falta %s',
      async (faltante) => {
        const { [faltante]: _, ...resto } = PARAMETROS;
        prisma.parametroGlobal.findMany.mockResolvedValue(filasParametros(resto));

        await expect(service.calcularNomina(1, 10000)).rejects.toThrow(
          `Faltan parámetros globales obligatorios para calcular la nómina: ${faltante}`,
        );
      },
    );

    it('un parámetro opcional ausente (bono de productividad) vale cero', async () => {
      const { BONO_PRODUCTIVIDAD: _, ...resto } = PARAMETROS;
      prisma.parametroGlobal.findMany.mockResolvedValue(filasParametros(resto));

      const r = await service.calcularNomina(1, 10000);
      expect(r.bonoProductividad).toBe(0);
    });
  });

  // D-11: el estado solo cambia por el flujo de estados
  describe('update', () => {
    beforeEach(() => prisma.nominaEncabezado.findUnique.mockResolvedValue({ IdNomina: 7 }));

    it.each([{ Estado: 'BORRADOR' }, { IdEstadoActual: 1 }])(
      'rechaza editar el estado directamente (%o)',
      async (cambio) => {
        await expect(service.update(7, cambio as any)).rejects.toThrow(BadRequestException);
        expect(prisma.nominaEncabezado.update).not.toHaveBeenCalled();
      },
    );
  });
});
