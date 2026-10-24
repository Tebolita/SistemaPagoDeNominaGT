import { UsuarioService } from './usuario.service';

// Regresión de D-04: la baja de usuarios era un interruptor que podía reactivar la cuenta
describe('UsuarioService', () => {
  let prisma: any;
  let correo: any;
  let service: UsuarioService;

  beforeEach(() => {
    prisma = {
      usuario: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ IdUsuario: 10, Username: 'nuevo' }),
        update: jest.fn().mockImplementation(({ where }) => ({ IdUsuario: where.IdUsuario })),
      },
    };
    correo = { enviarCredencialesUsuario: jest.fn().mockResolvedValue(undefined) };
    service = new UsuarioService(prisma, correo);
  });

  describe('remove (dar de baja)', () => {
    it.each([true, null, false])(
      'deja Activo en false y registra la fecha aunque Activo valga %p',
      async (activoActual) => {
        prisma.usuario.findUnique.mockResolvedValue({ IdUsuario: 5, Activo: activoActual });

        await service.remove(5);

        const { data } = prisma.usuario.update.mock.calls[0][0];
        expect(data.Activo).toBe(false);
        expect(data.FechaEliminacion).toBeInstanceOf(Date);
      },
    );

    it('repetir la baja no reactiva la cuenta', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ IdUsuario: 5, Activo: false });

      await service.remove(5);
      await service.remove(5);

      for (const [args] of prisma.usuario.update.mock.calls) {
        expect(args.data.Activo).toBe(false);
      }
    });
  });

  it('el listado excluye a los usuarios dados de baja', async () => {
    await service.findAll();

    expect(prisma.usuario.findMany.mock.calls[0][0].where).toEqual({ NOT: { Activo: false } });
  });

  it('un usuario nuevo se crea activo y con contraseña y clave cifradas', async () => {
    await service.create({ Username: 'nuevo', Contrasena: 'Secreta.1', Clave: '1234', IdRol: 1, IdEmpleado: 1 });

    const { data } = prisma.usuario.create.mock.calls[0][0];
    expect(data.Activo).toBe(true);
    expect(data.Contrasena).not.toBe('Secreta.1');
    expect(data.Contrasena).toMatch(/^\$2[aby]\$12\$/); // bcrypt con costo 12
    expect(data.Clave).not.toBe('1234');
  });

  it('la consulta usada por el login incluye el estado Activo', async () => {
    prisma.usuario.findFirst = jest.fn().mockResolvedValue(null);

    await service.findOne('admin');

    expect(prisma.usuario.findFirst.mock.calls[0][0].select.Activo).toBe(true);
  });
});
