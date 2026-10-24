import { VentaService } from './venta.service';

// Regresión de D-12: las órdenes pendientes deben pasar a VENCIDO al superar su fecha límite
describe('VentaService.marcarVencidas', () => {
  let prisma: any;
  let service: VentaService;

  beforeEach(() => {
    prisma = {
      venta: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    service = new VentaService(prisma);
  });

  afterEach(() => jest.useRealTimers());

  it('marca como VENCIDO solo las órdenes PENDIENTE activas con fecha límite anterior a hoy', async () => {
    // 23/10/2026 15:00 en Guatemala (21:00 UTC)
    jest.useFakeTimers({ now: new Date('2026-10-23T21:00:00Z') });

    await expect(service.marcarVencidas()).resolves.toBe(2);

    const { where, data } = prisma.venta.updateMany.mock.calls[0][0];
    expect(data).toEqual({ EstadoPago: 'VENCIDO' });
    expect(where.EstadoPago).toBe('PENDIENTE');
    expect(where.NOT).toEqual({ Activo: false });
    // Vence al terminar el día: el corte es el inicio de hoy en Guatemala (06:00 UTC)
    expect(where.FechaVencimiento.lt.toISOString()).toBe('2026-10-23T06:00:00.000Z');
  });

  it('justo después de medianoche en Guatemala el corte ya es el nuevo día', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-24T06:30:00Z') }); // 00:30 del 24 en Guatemala

    await service.marcarVencidas();

    expect(prisma.venta.updateMany.mock.calls[0][0].where.FechaVencimiento.lt.toISOString())
      .toBe('2026-10-24T06:00:00.000Z');
  });

  it('si la base de datos rechaza el cambio, el listado de ventas sigue respondiendo', async () => {
    prisma.venta.updateMany.mockRejectedValue(new Error('CHECK constraint'));

    await expect(service.findAll()).resolves.toEqual([]);
  });
});
