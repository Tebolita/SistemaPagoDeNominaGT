import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from 'src/generated/prisma/client';

/**
 * Filtro global: toda excepción no controlada se registra en un solo lugar y se responde
 * con el mismo formato que usa NestJS ({ statusCode, message, error }), que es el que lee
 * el ErrorService del frontend. Los errores internos nunca exponen detalles al cliente.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Excepciones');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const ruta = `${request.method} ${request.originalUrl}`;

    // Errores esperados (validación, 401, 404, reglas de negocio): se responden tal cual
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 500) {
        this.logger.error(`${ruta} -> ${status}`, exception.stack);
      }
      return response.status(status).json(this.cuerpo(exception, status));
    }

    // Errores conocidos de Prisma: se traducen a un código HTTP útil en lugar de 500
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const traducido = this.traducirPrisma(exception);
      if (traducido) {
        this.logger.warn(`${ruta} -> ${traducido.status} (Prisma ${exception.code})`);
        return response.status(traducido.status).json({
          statusCode: traducido.status,
          message: traducido.message,
          error: this.nombreEstado(traducido.status),
        });
      }
    }

    // Cualquier otro error: 500 genérico y el detalle completo solo en el registro del servidor
    const error = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(`${ruta} -> 500: ${error.message}`, error.stack);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ocurrió un error interno en el servidor',
      error: 'Internal Server Error',
    });
  }

  private cuerpo(exception: HttpException, status: number) {
    const res = exception.getResponse();
    return typeof res === 'string'
      ? { statusCode: status, message: res, error: this.nombreEstado(status) }
      : res;
  }

  // 'NOT_FOUND' -> 'Not Found', igual que las respuestas nativas de NestJS
  private nombreEstado(status: number) {
    return String(HttpStatus[status] ?? 'Error')
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private traducirPrisma(e: Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002': {
        const target = (e.meta as { target?: string | string[] } | undefined)?.target;
        const campos = Array.isArray(target) ? target.join(', ') : target;
        return {
          status: HttpStatus.CONFLICT,
          message: campos && !campos.startsWith('UQ__')
            ? `Ya existe un registro con el mismo valor en: ${campos}`
            : 'Ya existe un registro con esos datos',
        };
      }
      case 'P2003':
        return { status: HttpStatus.BAD_REQUEST, message: 'El registro relacionado no existe o está en uso' };
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'El registro solicitado no existe' };
      default:
        return null;
    }
  }
}
