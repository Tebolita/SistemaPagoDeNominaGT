import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParametroGlobalDto } from './dto/create-parametro-global.dto';
import { UpdateParametroGlobalDto } from './dto/update-parametro-global.dto';
import { SimularParametroDto } from './dto/simular-parametro.dto';

@Injectable()
export class ParametroGlobalService {
  constructor(private prismaService: PrismaService) {}

  create(createParametroGlobalDto: CreateParametroGlobalDto) {
    return this.prismaService.parametroGlobal.create({
      data: createParametroGlobalDto,
    });
  }

  findAll() {
    return this.prismaService.parametroGlobal.findMany({
      where: { Activo: true },
      include: {
        Departamento:  { select: { NombreDepartamento: true } },
        Puesto:        { select: { NombrePuesto: true } },
        JornadaLaboral: { select: { NombreJornada: true } },
      },
    });
  }

  findOne(id: number) {
    return this.prismaService.parametroGlobal.findUnique({
      where: { IdParametro: id },
    });
  }

  findByName(nombre: string) {
    return this.prismaService.parametroGlobal.findFirst({
      where: { NombreParametro: nombre, Activo: true },
    });
  }

  update(id: number, updateParametroGlobalDto: UpdateParametroGlobalDto) {
    return this.prismaService.parametroGlobal.update({
      where: { IdParametro: id },
      data: updateParametroGlobalDto,
    });
  }

  remove(id: number) {
    return this.prismaService.parametroGlobal.update({
      where: { IdParametro: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }

  async simular(dto: SimularParametroDto) {
    const parametro = await this.prismaService.parametroGlobal.findUnique({
      where: { IdParametro: dto.IdParametro },
    });
    if (!parametro) throw new NotFoundException('Parámetro no encontrado');

    const valor     = parseFloat(parametro.Valor.toString());
    const tipo      = parametro.Tipo ?? 'REFERENCIA';
    const unidad    = parametro.Unidad ?? 'Q';

    // Filtros para los empleados
    const where: any = {
      Activo: true,
      ...(dto.Genero    !== undefined && { Genero:          dto.Genero         }),
      ...(dto.IdDepartamento          && { IdDepartamento:  dto.IdDepartamento }),
      ...(dto.IdPuesto                && { IdPuesto:        dto.IdPuesto       }),
      ...(dto.IdJornada               && { IdJornada:       dto.IdJornada      }),
    };

    const empleados = await this.prismaService.empleado.findMany({
      where,
      include: {
        Puesto:        { select: { NombrePuesto: true } },
        Departamento:  { select: { NombreDepartamento: true } },
        JornadaLaboral: { select: { NombreJornada: true } },
        Salario: {
          where: {
            Activo: true,
            OR: [{ FechaFinVigencia: null }, { FechaFinVigencia: { gte: new Date() } }],
          },
          orderBy: { FechaInicioVigencia: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ Departamento: { NombreDepartamento: 'asc' } }, { Nombres: 'asc' }],
    });

    const resultados = empleados.map(emp => {
      const salarioBase = emp.Salario[0]
        ? parseFloat(emp.Salario[0].SalarioBase.toString())
        : 0;

      let impacto = 0;
      if (tipo !== 'REFERENCIA') {
        impacto = unidad === '%' ? salarioBase * (valor / 100) : valor;
      }
      const salarioFinal = tipo === 'INGRESO'
        ? salarioBase + impacto
        : tipo === 'DESCUENTO'
          ? salarioBase - impacto
          : salarioBase;

      return {
        IdEmpleado:    emp.IdEmpleado,
        Nombre:        `${emp.Nombres} ${emp.Apellidos}`,
        Genero:        emp.Genero ? 'Femenino' : 'Masculino',
        Departamento:  emp.Departamento?.NombreDepartamento ?? '—',
        Puesto:        emp.Puesto?.NombrePuesto ?? '—',
        Jornada:       emp.JornadaLaboral?.NombreJornada ?? '—',
        SalarioBase:   salarioBase,
        Impacto:       Math.round(impacto * 100) / 100,
        SalarioFinal:  Math.round(salarioFinal * 100) / 100,
        TieneSalario:  !!emp.Salario[0],
      };
    });

    const conSalario = resultados.filter(e => e.TieneSalario);

    return {
      parametro: {
        IdParametro:    parametro.IdParametro,
        NombreParametro: parametro.NombreParametro,
        Tipo:           tipo,
        Unidad:         unidad,
        Valor:          valor,
        Descripcion:    parametro.Descripcion,
      },
      filtros: {
        Genero:           dto.Genero,
        IdDepartamento:   dto.IdDepartamento,
        IdPuesto:         dto.IdPuesto,
        IdJornada:        dto.IdJornada,
      },
      resumen: {
        TotalEmpleados:  resultados.length,
        ConSalario:      conSalario.length,
        SinSalario:      resultados.length - conSalario.length,
        TotalImpacto:    Math.round(conSalario.reduce((s, e) => s + e.Impacto, 0) * 100) / 100,
        TotalSalarioBase: Math.round(conSalario.reduce((s, e) => s + e.SalarioBase, 0) * 100) / 100,
      },
      empleados: resultados,
    };
  }
}
