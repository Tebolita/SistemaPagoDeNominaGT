import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReporteriaService } from './reporteria.service';
import { ExportService } from '../export/export.service';

@Controller('reporteria')
export class ReporteriaController {
  constructor(
    private readonly reporteriaService: ReporteriaService,
    private readonly exportService: ExportService,
  ) {}

  // ========== REPORTES DE EMPLEADOS ==========

  @Get('empleados')
  async getReporteEmpleados(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.reporteriaService.getReporteEmpleados(fechaInicio, fechaFin);
  }

  @Get('salarios')
  async getReporteSalarios() {
    return this.reporteriaService.getReporteSalarios();
  }

  @Get('departamentos')
  async getReporteDepartamentos() {
    return this.reporteriaService.getReporteDepartamentos();
  }

  // ========== REPORTES DE NÓMINA ==========

  @Get('nomina')
  async getReporteNomina(
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
  ) {
    return this.reporteriaService.getReporteNomina(
      mes ? parseInt(mes) : undefined,
      anio ? parseInt(anio) : undefined,
    );
  }

  // ========== REPORTES DE ASISTENCIA ==========

  @Get('asistencias')
  async getReporteAsistencias(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.reporteriaService.getReporteAsistencias(fechaInicio, fechaFin);
  }

  // ========== REPORTES DE VACACIONES ==========

  @Get('vacaciones')
  async getReporteVacaciones(@Query('anio') anio?: string) {
    return this.reporteriaService.getReporteVacaciones(
      anio ? parseInt(anio) : undefined,
    );
  }

  // ========== RESUMEN EJECUTIVO ==========

  @Get('resumen')
  async getResumenEjecutivo() {
    return this.reporteriaService.getResumenEjecutivo();
  }

  // ========== EXPORTACIONES ==========

  // Empleados
  @Get('empleados/export/excel')
  async exportEmpleadosExcel(
    @Res() res: Response,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const data = await this.reporteriaService.getReporteEmpleados(fechaInicio, fechaFin);
    return this.exportService.exportEmpleadosExcel(data, res);
  }

  @Get('empleados/export/pdf')
  async exportEmpleadosPDF(
    @Res() res: Response,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const data = await this.reporteriaService.getReporteEmpleados(fechaInicio, fechaFin);
    return this.exportService.exportEmpleadosPDF(data, res);
  }

  // Salarios
  @Get('salarios/export/excel')
  async exportSalariosExcel(@Res() res: Response) {
    const data = await this.reporteriaService.getReporteSalarios();
    return this.exportService.exportSalariosExcel(data, res);
  }

  @Get('salarios/export/pdf')
  async exportSalariosPDF(@Res() res: Response) {
    const data = await this.reporteriaService.getReporteSalarios();
    return this.exportService.exportSalariosPDF(data, res);
  }

  // Departamentos
  @Get('departamentos/export/excel')
  async exportDepartamentosExcel(@Res() res: Response) {
    const data = await this.reporteriaService.getReporteDepartamentos();
    return this.exportService.exportDepartamentosExcel(data, res);
  }

  @Get('departamentos/export/pdf')
  async exportDepartamentosPDF(@Res() res: Response) {
    const data = await this.reporteriaService.getReporteDepartamentos();
    return this.exportService.exportDepartamentosPDF(data, res);
  }

  // Nómina
  @Get('nomina/export/excel')
  async exportNominaExcel(
    @Res() res: Response,
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
  ) {
    const data = await this.reporteriaService.getReporteNomina(
      mes ? parseInt(mes) : undefined,
      anio ? parseInt(anio) : undefined,
    );
    return this.exportService.exportNominaExcel(data, res);
  }

  @Get('nomina/export/pdf')
  async exportNominaPDF(
    @Res() res: Response,
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
  ) {
    const data = await this.reporteriaService.getReporteNomina(
      mes ? parseInt(mes) : undefined,
      anio ? parseInt(anio) : undefined,
    );
    return this.exportService.exportNominaPDF(data, res);
  }

  // Asistencias
  @Get('asistencias/export/excel')
  async exportAsistenciasExcel(
    @Res() res: Response,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    const data = await this.reporteriaService.getReporteAsistencias(fechaInicio, fechaFin);
    return this.exportService.exportAsistenciasExcel(data, res);
  }

  @Get('asistencias/export/pdf')
  async exportAsistenciasPDF(
    @Res() res: Response,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    const data = await this.reporteriaService.getReporteAsistencias(fechaInicio, fechaFin);
    return this.exportService.exportAsistenciasPDF(data, res);
  }

  // Vacaciones
  @Get('vacaciones/export/excel')
  async exportVacacionesExcel(
    @Res() res: Response,
    @Query('anio') anio?: string,
  ) {
    const data = await this.reporteriaService.getReporteVacaciones(
      anio ? parseInt(anio) : undefined,
    );
    return this.exportService.exportVacacionesExcel(data, res);
  }

  @Get('vacaciones/export/pdf')
  async exportVacacionesPDF(
    @Res() res: Response,
    @Query('anio') anio?: string,
  ) {
    const data = await this.reporteriaService.getReporteVacaciones(
      anio ? parseInt(anio) : undefined,
    );
    return this.exportService.exportVacacionesPDF(data, res);
  }
}