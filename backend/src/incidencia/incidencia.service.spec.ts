import { BadRequestException } from '@nestjs/common';
import { IncidenciaService } from './incidencia.service';
import {
  registrarDescuentoVacaciones,
  validarSolicitudVacaciones,
} from 'src/control-vacacion/saldo-vacaciones';

jest.mock('src/control-vacacion/saldo-vacaciones', () => ({
  validarSolicitudVacaciones: jest.fn(),
  registrarDescuentoVacaciones: jest.fn(),
}));

// Regresión de D-09: el registro de vacaciones valida y descuenta los días en una transacción
describe('IncidenciaService', () => {
  let tx: any;
  let prisma: any;
  let service: IncidenciaService;

  const solicitud = (tipo = 'Vacaciones') => ({
    IdEmpleado: 1,
    TipoIncidencia: tipo,
    FechaInicio: new Date('2026-12-01'),
    FechaFin: new Date('2026-12-03'),
    ConGoceSueldo: true,
    IdUsuarioAutoriza: 1,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tx = {
      incidencia: {
        create: jest.fn().mockResolvedValue({ IdIncidencia: 99 }),
        update: jest.fn().mockImplementation(({ data }) => ({ IdIncidencia: 99, ...data })),
      },
      detalleControlVacacion: { findFirst: jest.fn(), update: jest.fn() },
      controlVacacion: { update: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn((cb) => cb(tx)),
      incidencia: { findUnique: jest.fn() },
    };
    service = new IncidenciaService(prisma);
  });

  it('valida la solicitud, crea la incidencia activa y descuenta los días', async () => {
    (validarSolicitudVacaciones as jest.Mock).mockResolvedValue(3);

    await service.create(solicitud() as any);

    expect(validarSolicitudVacaciones).toHaveBeenCalledWith(
      tx, 1, new Date('2026-12-01'), new Date('2026-12-03'),
    );
    expect(tx.incidencia.create.mock.calls[0][0].data.Activo).toBe(true);
    expect(registrarDescuentoVacaciones).toHaveBeenCalledWith(tx, 1, 99, 3);
  });

  it('si la validación falla no crea la incidencia (el error revierte la transacción)', async () => {
    (validarSolicitudVacaciones as jest.Mock).mockRejectedValue(
      new BadRequestException('Saldo de vacaciones insuficiente'),
    );

    await expect(service.create(solicitud() as any)).rejects.toThrow('Saldo de vacaciones insuficiente');
    expect(tx.incidencia.create).not.toHaveBeenCalled();
    expect(registrarDescuentoVacaciones).not.toHaveBeenCalled();
  });

  it('otras incidencias no validan ni descuentan saldo de vacaciones', async () => {
    await service.create(solicitud('Permiso') as any);

    expect(validarSolicitudVacaciones).not.toHaveBeenCalled();
    expect(registrarDescuentoVacaciones).not.toHaveBeenCalled();
    expect(tx.incidencia.create).toHaveBeenCalled();
  });

  it('al editar fechas ajusta el descuento existente por la diferencia de días', async () => {
    prisma.incidencia.findUnique.mockResolvedValue({ IdIncidencia: 99, IdEmpleado: 1, TipoIncidencia: 'Vacaciones' });
    (validarSolicitudVacaciones as jest.Mock).mockResolvedValue(5);
    tx.detalleControlVacacion.findFirst.mockResolvedValue({
      IdDetalleVacacion: 3, IdControlVacacion: 8, DiasDescontados: 2,
    });

    await service.update(99, { FechaInicio: new Date('2026-12-01'), FechaFin: new Date('2026-12-05') } as any);

    expect((validarSolicitudVacaciones as jest.Mock).mock.calls[0][4]).toBe(99); // se excluye a sí misma
    expect(tx.detalleControlVacacion.update.mock.calls[0][0].data.DiasDescontados).toBe(5);
    expect(tx.controlVacacion.update.mock.calls[0][0].data.DiasGozados).toEqual({ increment: 3 });
  });

  it('al editar vacaciones antiguas sin descuento, registra el descuento', async () => {
    prisma.incidencia.findUnique.mockResolvedValue({ IdIncidencia: 99, IdEmpleado: 1, TipoIncidencia: 'Vacaciones' });
    (validarSolicitudVacaciones as jest.Mock).mockResolvedValue(2);
    tx.detalleControlVacacion.findFirst.mockResolvedValue(null);

    await service.update(99, { FechaInicio: new Date('2026-12-01'), FechaFin: new Date('2026-12-02') } as any);

    expect(registrarDescuentoVacaciones).toHaveBeenCalledWith(tx, 1, 99, 2);
  });
});
