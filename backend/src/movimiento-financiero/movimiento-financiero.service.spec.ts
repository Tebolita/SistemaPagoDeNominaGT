import { MovimientoFinancieroService } from './movimiento-financiero.service';

// Regresión de D-13: editar un movimiento debe reajustar el saldo de la cuenta
describe('MovimientoFinancieroService', () => {
  let tx: any;
  let prisma: any;
  let service: MovimientoFinancieroService;

  const original = (extra: Record<string, any> = {}) => ({
    IdMovimiento: 3, IdCuenta: 1, TipoMovimiento: 'INGRESO', Monto: 500, Activo: true,
    IdVenta: null, IdNomina: null, ...extra,
  });

  beforeEach(() => {
    tx = {
      cuentaBancariaEmpresa: { update: jest.fn() },
      movimientoFinanciero: {
        create: jest.fn().mockImplementation(({ data }) => ({ IdMovimiento: 3, ...data })),
        update: jest.fn(),
      },
    };
    prisma = {
      $transaction: jest.fn((cb) => cb(tx)),
      movimientoFinanciero: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    };
    service = new MovimientoFinancieroService(prisma);
  });

  const ajustesSaldo = () => tx.cuentaBancariaEmpresa.update.mock.calls.map(([a]) => [a.where.IdCuenta, a.data.SaldoActual]);

  it('al cambiar el monto revierte el anterior y aplica el nuevo en una transacción', async () => {
    prisma.movimientoFinanciero.findUnique.mockResolvedValue(original());
    tx.movimientoFinanciero.update.mockResolvedValue(original({ Monto: 800 }));

    await service.update(3, { Monto: 800 } as any);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(ajustesSaldo()).toEqual([
      [1, { decrement: 500 }], // se revierte el ingreso original
      [1, { increment: 800 }], // se aplica el nuevo monto
    ]);
  });

  it('al cambiar de cuenta mueve el efecto de una cuenta a otra', async () => {
    prisma.movimientoFinanciero.findUnique.mockResolvedValue(original({ TipoMovimiento: 'EGRESO' }));
    tx.movimientoFinanciero.update.mockResolvedValue(original({ TipoMovimiento: 'EGRESO', IdCuenta: 2 }));

    await service.update(3, { IdCuenta: 2 } as any);

    expect(ajustesSaldo()).toEqual([
      [1, { increment: 500 }],
      [2, { decrement: 500 }],
    ]);
  });

  it.each([{ IdVenta: 9 }, { IdNomina: 7 }])(
    'no permite cambiar el monto de un movimiento generado automáticamente (%o)',
    async (origen) => {
      prisma.movimientoFinanciero.findUnique.mockResolvedValue(original(origen));

      await expect(service.update(3, { Monto: 1 } as any)).rejects.toThrow(
        'Este movimiento lo generó una venta o una nómina',
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    },
  );

  it('en un movimiento automático sí permite editar campos que no afectan el saldo', async () => {
    prisma.movimientoFinanciero.findUnique.mockResolvedValue(original({ IdVenta: 9 }));
    tx.movimientoFinanciero.update.mockResolvedValue(original({ IdVenta: 9 }));

    await expect(service.update(3, { Notas: 'Comprobante escaneado' } as any)).resolves.toBeDefined();
  });

  it('al registrar un movimiento ajusta el saldo en la misma transacción', async () => {
    await service.create({ IdCuenta: 1, TipoMovimiento: 'EGRESO', Categoria: 'OTRO', Monto: 120, IdUsuarioRegistra: 1 } as any);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(ajustesSaldo()).toEqual([[1, { decrement: 120 }]]);
  });

  it('al eliminar revierte el efecto en el saldo', async () => {
    prisma.movimientoFinanciero.findUnique.mockResolvedValue(original());

    await service.remove(3);

    expect(ajustesSaldo()).toEqual([[1, { decrement: 500 }]]);
    expect(tx.movimientoFinanciero.update.mock.calls[0][0].data.Activo).toBe(false);
  });

  it('pagina el listado cuando se envía la página (D-19)', async () => {
    prisma.movimientoFinanciero.count.mockResolvedValue(42);
    prisma.movimientoFinanciero.findMany.mockResolvedValue([]);

    const r = await service.findAll(undefined, undefined, undefined, undefined, undefined, { page: 2, limit: 10, skip: 10 });

    expect(r).toEqual({ total: 42, page: 2, limit: 10, registros: [] });
    expect(prisma.movimientoFinanciero.findMany.mock.calls[0][0]).toMatchObject({ skip: 10, take: 10 });
  });
});
