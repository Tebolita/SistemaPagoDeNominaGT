import { BadRequestException, HttpStatus, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';

// Regresión de D-17: no existía un filtro global de excepciones ni un registro centralizado
describe('AllExceptionsFilter', () => {
  let filtro: AllExceptionsFilter;
  let respuesta: { status: jest.Mock; json: jest.Mock };

  const host = () =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ method: 'PATCH', originalUrl: '/api/banco/999' }),
        getResponse: () => respuesta,
      }),
    }) as any;

  const errorPrisma = (code: string, meta?: Record<string, unknown>) =>
    new Prisma.PrismaClientKnownRequestError('error de prueba', { code, clientVersion: '7.7.0', meta });

  beforeEach(() => {
    filtro = new AllExceptionsFilter();
    respuesta = { status: jest.fn(), json: jest.fn() };
    respuesta.status.mockReturnValue(respuesta);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('responde las excepciones HTTP con su código y mensaje originales', () => {
    filtro.catch(new BadRequestException('Dato inválido'), host());

    expect(respuesta.status).toHaveBeenCalledWith(400);
    expect(respuesta.json.mock.calls[0][0]).toMatchObject({ statusCode: 400, message: 'Dato inválido' });
  });

  it.each([
    ['P2025', HttpStatus.NOT_FOUND, 'El registro solicitado no existe', 'Not Found'],
    ['P2002', HttpStatus.CONFLICT, 'Ya existe un registro con esos datos', 'Conflict'],
    ['P2003', HttpStatus.BAD_REQUEST, 'El registro relacionado no existe o está en uso', 'Bad Request'],
  ])('traduce el error de Prisma %s a HTTP %d', (code, status, mensaje, nombre) => {
    filtro.catch(errorPrisma(code), host());

    expect(respuesta.status).toHaveBeenCalledWith(status);
    expect(respuesta.json).toHaveBeenCalledWith({ statusCode: status, message: mensaje, error: nombre });
  });

  it('en un duplicado indica los campos cuando Prisma los informa', () => {
    filtro.catch(errorPrisma('P2002', { target: ['NombreBanco'] }), host());

    expect(respuesta.json.mock.calls[0][0].message).toBe('Ya existe un registro con el mismo valor en: NombreBanco');
  });

  it('un error inesperado responde 500 genérico y registra el detalle solo en el servidor', () => {
    filtro.catch(new Error('Conexión rechazada: password incorrecto'), host());

    expect(respuesta.status).toHaveBeenCalledWith(500);
    const cuerpo = respuesta.json.mock.calls[0][0];
    expect(cuerpo.message).toBe('Ocurrió un error interno en el servidor');
    expect(JSON.stringify(cuerpo)).not.toContain('password');
    expect(Logger.prototype.error).toHaveBeenCalledWith(
      expect.stringContaining('PATCH /api/banco/999 -> 500'),
      expect.any(String),
    );
  });

  it('no registra como error las excepciones esperadas (4xx)', () => {
    filtro.catch(new NotFoundException(), host());

    expect(Logger.prototype.error).not.toHaveBeenCalled();
  });
});
