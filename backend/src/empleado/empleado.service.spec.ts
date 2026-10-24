import { ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { EmpleadoService } from './empleado.service';

describe('EmpleadoService', () => {
  let prisma: any;
  let service: EmpleadoService;

  const dto = (extra: Record<string, any> = {}) =>
    // Igual que el ValidationPipe: con ES2023 la instancia trae todas las propiedades opcionales
    plainToInstance(CreateEmpleadoDto, {
      DPI: '1234567890101', NIT: '1234567', Nombres: 'Ana', Apellidos: 'López',
      CorreoPersonal: 'ana@correo.com', IdPuesto: 2, IdJornada: 1, Telefono: '55551234', Genero: true,
      ...extra,
    });

  beforeEach(() => {
    prisma = {
      empleado: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ IdEmpleado: 15, Nombres: 'Ana' }),
        update: jest.fn().mockResolvedValue({ IdEmpleado: 15 }),
      },
    };
    service = new EmpleadoService(prisma);
  });

  // D-05: el alta respondía HTTP 500 por "Unknown argument IdDepartamento"
  describe('create', () => {
    it('no envía IdDepartamento ni FechaIngresa vacíos como campos directos', async () => {
      await service.create(dto());

      const { data } = prisma.empleado.create.mock.calls[0][0];
      expect(data).not.toHaveProperty('IdDepartamento');
      expect(data).not.toHaveProperty('IdPuesto');
      expect(data.Puesto).toEqual({ connect: { IdPuesto: 2 } });
      expect(data.JornadaLaboral).toEqual({ connect: { IdJornada: 1 } });
      expect(data.FechaIngresa).toBeInstanceOf(Date);
    });

    it('asigna el departamento mediante connect', async () => {
      await service.create(dto({ IdDepartamento: 4 }));

      expect(prisma.empleado.create.mock.calls[0][0].data.Departamento).toEqual({
        connect: { IdDepartamento: 4 },
      });
    });

    it('conserva la fecha de ingreso enviada', async () => {
      await service.create(dto({ FechaIngresa: '2024-04-16' }));

      expect(prisma.empleado.create.mock.calls[0][0].data.FechaIngresa).toEqual(new Date('2024-04-16'));
    });
  });

  // D-21: el mensaje de duplicado no indicaba el campo repetido
  describe('duplicados', () => {
    it('rechaza un DPI repetido indicándolo', async () => {
      prisma.empleado.findFirst.mockImplementation(({ where }) => (where.DPI ? { IdEmpleado: 1 } : null));

      await expect(service.create(dto())).rejects.toThrow(
        new ConflictException('Ya existe un empleado con el DPI 1234567890101.'),
      );
      expect(prisma.empleado.create).not.toHaveBeenCalled();
    });

    it('rechaza un NIT repetido indicándolo', async () => {
      prisma.empleado.findFirst.mockImplementation(({ where }) => (where.NIT ? { IdEmpleado: 1 } : null));

      await expect(service.create(dto())).rejects.toThrow('Ya existe un empleado con el NIT 1234567.');
    });

    it('al editar sin cambiar DPI ni NIT no busca duplicados', async () => {
      prisma.empleado.findUnique.mockResolvedValue({ IdEmpleado: 15, DPI: '1234567890101', NIT: '1234567' });

      await service.update(15, { DPI: '1234567890101', NIT: '1234567', Telefono: '55550000' } as any);

      expect(prisma.empleado.findFirst).not.toHaveBeenCalled();
      expect(prisma.empleado.update).toHaveBeenCalled();
    });

    it('al cambiar el DPI excluye al propio empleado de la búsqueda', async () => {
      prisma.empleado.findUnique.mockResolvedValue({ IdEmpleado: 15, DPI: '1234567890101', NIT: '1234567' });

      await service.update(15, { DPI: '9999999999999' } as any);

      expect(prisma.empleado.findFirst.mock.calls[0][0].where).toEqual({
        DPI: '9999999999999',
        IdEmpleado: { not: 15 },
      });
    });
  });
});
