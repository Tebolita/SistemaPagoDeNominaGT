import { BadRequestException } from '@nestjs/common';
import {
  aniosCumplidos,
  calcularSaldoVacaciones,
  diasDelPeriodo,
  validarSolicitudVacaciones,
} from './saldo-vacaciones';

// Regresión de D-08 (días por antigüedad) y D-09 (validación del goce de vacaciones)
describe('saldo-vacaciones', () => {
  const haceAnios = (anios: number, dias = 0) => {
    const f = new Date();
    f.setFullYear(f.getFullYear() - anios);
    f.setDate(f.getDate() - dias);
    return f;
  };

  // Base de datos simulada: empleado, días ya gozados y vacaciones registradas
  const db = (fechaIngreso: Date, diasGozados = 0, vacaciones: any[] = []): any => ({
    empleado: { findUnique: jest.fn().mockResolvedValue({ FechaIngresa: fechaIngreso }) },
    detalleControlVacacion: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { DiasDescontados: diasGozados } }),
    },
    incidencia: { findMany: jest.fn().mockResolvedValue(vacaciones) },
  });

  describe('aniosCumplidos', () => {
    it('cuenta un año solo al llegar el aniversario', () => {
      const ingreso = new Date('2024-04-16T06:00:00Z');
      expect(aniosCumplidos(ingreso, new Date('2025-04-15T12:00:00Z'))).toBe(0);
      expect(aniosCumplidos(ingreso, new Date('2025-04-16T12:00:00Z'))).toBe(1);
      expect(aniosCumplidos(ingreso, new Date('2026-10-23T12:00:00Z'))).toBe(2);
    });
  });

  describe('diasDelPeriodo', () => {
    it('incluye el día inicial y el final', () => {
      expect(diasDelPeriodo(new Date('2026-05-01'), new Date('2026-05-05'))).toBe(5);
    });

    it('da el mismo resultado con fecha sin hora y con medianoche de Guatemala (06:00Z)', () => {
      const sinHora = diasDelPeriodo(new Date('2026-05-01'), new Date('2026-05-01'));
      const datepicker = diasDelPeriodo(
        new Date('2026-05-01T06:00:00.000Z'),
        new Date('2026-05-01T06:00:00.000Z'),
      );
      expect(sinHora).toBe(1);
      expect(datepicker).toBe(1);
    });
  });

  describe('calcularSaldoVacaciones', () => {
    it('otorga 15 días por cada año cumplido y descuenta los gozados', async () => {
      const saldo = await calcularSaldoVacaciones(db(haceAnios(2, 10), 9), 1);

      expect(saldo).toMatchObject({
        aniosServicio: 2,
        diasGanados: 30,
        diasGozados: 9,
        diasDisponibles: 21,
      });
    });

    it('un empleado con menos de un año no tiene días ganados', async () => {
      const saldo = await calcularSaldoVacaciones(db(haceAnios(0, 100)), 1);

      expect(saldo.aniosServicio).toBe(0);
      expect(saldo.diasGanados).toBe(0);
    });

    it('al editar una solicitud excluye sus propios días del cálculo', async () => {
      const base = db(haceAnios(1, 10), 5);

      await calcularSaldoVacaciones(base, 1, 42);

      const where = base.detalleControlVacacion.aggregate.mock.calls[0][0].where;
      expect(where.Incidencia.IdIncidencia).toEqual({ not: 42 });
    });
  });

  describe('validarSolicitudVacaciones', () => {
    it('devuelve los días a descontar cuando la solicitud es válida', async () => {
      const dias = await validarSolicitudVacaciones(
        db(haceAnios(1, 10)),
        1,
        new Date('2026-12-01'),
        new Date('2026-12-03'),
      );
      expect(dias).toBe(3);
    });

    it('rechaza una fecha de fin anterior a la de inicio', async () => {
      await expect(
        validarSolicitudVacaciones(db(haceAnios(1, 10)), 1, new Date('2026-12-10'), new Date('2026-12-05')),
      ).rejects.toThrow('La fecha de fin no puede ser anterior a la fecha de inicio');
    });

    it('rechaza un periodo que se traslapa con otras vacaciones del empleado', async () => {
      const existentes = [
        { FechaInicio: new Date('2026-04-16T06:00:00Z'), FechaFin: new Date('2026-04-20T06:00:00Z') },
      ];

      await expect(
        validarSolicitudVacaciones(
          db(haceAnios(2, 10), 0, existentes),
          1,
          new Date('2026-04-20'),
          new Date('2026-04-22'),
        ),
      ).rejects.toThrow('El empleado ya tiene vacaciones registradas del 2026-04-16 al 2026-04-20');
    });

    it('acepta el día siguiente a unas vacaciones existentes', async () => {
      const existentes = [
        { FechaInicio: new Date('2026-05-01T06:00:00Z'), FechaFin: new Date('2026-05-01T06:00:00Z') },
      ];

      await expect(
        validarSolicitudVacaciones(db(haceAnios(2, 10), 0, existentes), 1, new Date('2026-05-02'), new Date('2026-05-02')),
      ).resolves.toBe(1);
    });

    it('rechaza una solicitud mayor al saldo disponible', async () => {
      await expect(
        validarSolicitudVacaciones(db(haceAnios(1, 10), 10), 1, new Date('2026-12-01'), new Date('2026-12-10')),
      ).rejects.toThrow(BadRequestException);
      await expect(
        validarSolicitudVacaciones(db(haceAnios(1, 10), 10), 1, new Date('2026-12-01'), new Date('2026-12-10')),
      ).rejects.toThrow(/solicita 10 días y tiene 5 disponibles/);
    });

    it('rechaza vacaciones antes de cumplir el primer año de servicio', async () => {
      await expect(
        validarSolicitudVacaciones(db(haceAnios(0, 100)), 1, new Date('2026-12-01'), new Date('2026-12-01')),
      ).rejects.toThrow(/0 años de servicio/);
    });
  });
});
