import { EstadoNominaService } from './estado-nomina.service';

// Estados tal como están configurados en la base de datos
const ESTADOS = [
  { IdEstadoNomina: 1, NombreEstado: 'BORRADOR', Orden: 1, EsFinal: false, EsCancelacion: false, RequiereAprobacion: false, Activo: true },
  { IdEstadoNomina: 2, NombreEstado: 'PENDIENTE_APROBACION', Orden: 2, EsFinal: false, EsCancelacion: false, RequiereAprobacion: true, Activo: true },
  { IdEstadoNomina: 6, NombreEstado: 'PROVISION', Orden: 2, EsFinal: false, EsCancelacion: false, RequiereAprobacion: false, Activo: true },
  { IdEstadoNomina: 3, NombreEstado: 'APROBADO', Orden: 3, EsFinal: false, EsCancelacion: false, RequiereAprobacion: false, Activo: true },
  { IdEstadoNomina: 4, NombreEstado: 'PAGADO', Orden: 4, EsFinal: true, EsCancelacion: false, RequiereAprobacion: false, Activo: true },
  { IdEstadoNomina: 5, NombreEstado: 'CANCELADO', Orden: 5, EsFinal: true, EsCancelacion: true, RequiereAprobacion: false, Activo: true },
];
const estado = (nombre: string) => ESTADOS.find((e) => e.NombreEstado === nombre)!;

describe('EstadoNominaService', () => {
  let tx: any;
  let prisma: any;
  let service: EstadoNominaService;

  const nominaEn = (nombreEstado: string | null) => {
    const e = nombreEstado ? estado(nombreEstado) : null;
    prisma.nominaEncabezado.findUnique.mockResolvedValue({
      IdNomina: 7, Mes: 5, Anio: 2026, IdCuenta: 1, IdEstadoActual: e?.IdEstadoNomina ?? null, EstadoNomina: e,
    });
  };
  const nombres = (lista: any[]) => lista.map((e) => e.NombreEstado);

  beforeEach(() => {
    tx = {
      movimientoFinanciero: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn(), create: jest.fn() },
      cuentaBancariaEmpresa: { update: jest.fn() },
      historialEstadoNomina: { create: jest.fn() },
      nominaEncabezado: { update: jest.fn().mockImplementation(({ data }) => data) },
    };
    prisma = {
      $transaction: jest.fn((cb) => cb(tx)),
      nominaEncabezado: { findUnique: jest.fn() },
      estadoNomina: {
        findMany: jest.fn().mockResolvedValue(ESTADOS),
        findUnique: jest.fn(({ where }) => ESTADOS.find((e) => e.IdEstadoNomina === where.IdEstadoNomina)),
      },
    };
    service = new EstadoNominaService(prisma);
  });

  describe('getEstadosDisponibles', () => {
    it('una nómina sin estado solo puede pasar al primer nivel (nunca directo a PAGADO)', async () => {
      nominaEn(null);
      expect(nombres(await service.getEstadosDisponibles(7, 'ADMIN'))).toEqual(['BORRADOR']);
    });

    it('desde BORRADOR ofrece el siguiente nivel y la cancelación', async () => {
      nominaEn('BORRADOR');
      expect(nombres(await service.getEstadosDisponibles(7, 'ADMIN'))).toEqual(
        expect.arrayContaining(['PENDIENTE_APROBACION', 'PROVISION', 'CANCELADO']),
      );
    });

    it('una nómina pagada solo puede cancelarse (D-07)', async () => {
      nominaEn('PAGADO');
      expect(nombres(await service.getEstadosDisponibles(7, 'ADMIN'))).toEqual(['CANCELADO']);
    });

    it('una nómina cancelada ya no cambia de estado', async () => {
      nominaEn('CANCELADO');
      expect(await service.getEstadosDisponibles(7, 'ADMIN')).toEqual([]);
    });
  });

  describe('cambiarEstadoNomina', () => {
    it('rechaza una transición no permitida e indica las permitidas (D-11)', async () => {
      nominaEn('PAGADO');

      await expect(
        service.cambiarEstadoNomina({ IdNomina: 7, IdEstadoNuevo: 1 } as any, 1, 'ADMIN'),
      ).rejects.toThrow('Transición no permitida de PAGADO a BORRADOR. Estados permitidos: CANCELADO');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('exige un motivo para cancelar una nómina pagada', async () => {
      nominaEn('PAGADO');

      await expect(
        service.cambiarEstadoNomina({ IdNomina: 7, IdEstadoNuevo: 5 } as any, 1, 'ADMIN'),
      ).rejects.toThrow('Indica el motivo para cancelar una nómina que ya fue pagada');
    });

    it('al cancelar una nómina pagada devuelve el egreso a la cuenta y lo anula (D-07)', async () => {
      nominaEn('PAGADO');
      tx.movimientoFinanciero.findMany.mockResolvedValue([
        { IdMovimiento: 30, IdCuenta: 1, Monto: 25000, Notas: 'Pago nómina 05/2026' },
      ]);

      await service.cambiarEstadoNomina(
        { IdNomina: 7, IdEstadoNuevo: 5, Comentarios: 'Pago duplicado' } as any, 1, 'ADMIN',
      );

      expect(tx.cuentaBancariaEmpresa.update).toHaveBeenCalledWith({
        where: { IdCuenta: 1 },
        data: { SaldoActual: { increment: 25000 } },
      });
      const anulado = tx.movimientoFinanciero.update.mock.calls[0][0];
      expect(anulado.where).toEqual({ IdMovimiento: 30 });
      expect(anulado.data.Activo).toBe(false);
      expect(anulado.data.Notas).toContain('Revertido por cancelación: Pago duplicado');
      expect(tx.historialEstadoNomina.create.mock.calls[0][0].data).toMatchObject({
        IdEstadoAnterior: 4, IdEstadoNuevo: 5, Comentarios: 'Pago duplicado',
      });
      expect(tx.nominaEncabezado.update.mock.calls[0][0].data.Estado).toBe('CANCELADO');
    });
  });
});
