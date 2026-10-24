import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEmpleadoDto } from 'src/empleado/dto/create-empleado.dto';
import { CreateJornadaLaboralDto } from 'src/jornada-laboral/dto/create-jornada-laboral.dto';
import { UpdateJornadaLaboralDto } from 'src/jornada-laboral/dto/update-jornada-laboral.dto';

// Errores de validación de un DTO, con la misma conversión que hace el ValidationPipe
const errores = async (clase: any, datos: Record<string, unknown>) => {
  const resultado = await validate(plainToInstance(clase, datos) as object, { whitelist: true });
  return resultado.flatMap((e) => Object.values(e.constraints ?? {}));
};

describe('Validaciones de entrada', () => {
  // D-15: se aceptaba un número de cuenta bancaria con letras
  describe('CreateEmpleadoDto.CuentaBancaria', () => {
    const empleado = (CuentaBancaria?: unknown) => ({
      DPI: '1234567890101', NIT: '1234567', Nombres: 'Ana', Apellidos: 'López',
      CorreoPersonal: 'ana@correo.com', IdPuesto: 1, IdJornada: 1, Telefono: '55551234', Genero: true,
      ...(CuentaBancaria !== undefined ? { CuentaBancaria } : {}),
    });

    it.each(['3020012345', '3020-012345-6'])('acepta la cuenta %s', async (cuenta) => {
      expect(await errores(CreateEmpleadoDto, empleado(cuenta))).toEqual([]);
    });

    it.each(['12A45', '3020-01234X', '-123', '123-', '30 20'])('rechaza la cuenta %s', async (cuenta) => {
      expect(await errores(CreateEmpleadoDto, empleado(cuenta))).toContain(
        'La cuenta bancaria solo puede contener números y guiones',
      );
    });

    it.each([undefined, null, ''])('permite omitir la cuenta (%p)', async (cuenta) => {
      expect(await errores(CreateEmpleadoDto, empleado(cuenta))).toEqual([]);
    });
  });

  // D-06: la interfaz aceptaba hasta 168 horas, pero la columna solo admite 99.99
  describe('Jornada laboral: horas semanales', () => {
    const jornada = (HorasSemanales: number) => ({ NombreJornada: 'Diurna', HorasDiarias: 8, HorasSemanales });

    it('acepta el máximo que admite la columna (99.99)', async () => {
      expect(await errores(CreateJornadaLaboralDto, jornada(99.99))).toEqual([]);
    });

    it.each([CreateJornadaLaboralDto, UpdateJornadaLaboralDto])(
      'rechaza 100 horas o más en %p',
      async (clase) => {
        expect(await errores(clase, jornada(100))).toContain(
          'Las horas semanales no pueden ser mayores a 99.99',
        );
      },
    );
  });
});
