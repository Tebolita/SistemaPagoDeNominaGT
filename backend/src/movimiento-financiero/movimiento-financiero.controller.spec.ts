import { MovimientoFinancieroController } from './movimiento-financiero.controller';

// No repudio: el usuario que registra un movimiento sale del JWT, no del cuerpo
describe('MovimientoFinancieroController.create', () => {
  it('ignora IdUsuarioRegistra del cliente y usa el del token', async () => {
    const servicio = {
      create: jest.fn().mockResolvedValue({ IdMovimiento: 1 }),
    };
    const ctrl = new MovimientoFinancieroController(servicio as any);
    const req: any = {
      user: { sub: 42, username: 'gerente', role: 'GERENTE' },
    };

    await ctrl.create(req, {
      IdCuenta: 1,
      TipoMovimiento: 'EGRESO',
      Categoria: 'OTRO',
      Monto: 10,
      IdUsuarioRegistra: 999,
    } as any);

    expect(servicio.create).toHaveBeenCalledWith(
      expect.objectContaining({ IdUsuarioRegistra: 42 }),
    );
  });
});
