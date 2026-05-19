import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';

const PDFKit = require('pdfkit');

@Injectable()
export class ExportService {
  constructor() {}

  // ========== EXPORTACIÓN A EXCEL ==========

  async exportToExcel(
    data: any[],
    filename: string,
    sheetName: string,
    res: Response,
  ) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Si hay datos, usar las claves del primer objeto como headers
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      // Estilizar headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' },
      };
      headerRow.alignment = { horizontal: 'center' };

      // Agregar datos
      data.forEach((item) => {
        const row = headers.map((header) => {
          const value = item[header];
          // Formatear fechas
          if (value instanceof Date) {
            return value.toLocaleDateString('es-GT');
          }
          // Formatear números
          if (typeof value === 'number') {
            return value;
          }
          return value || '';
        });
        worksheet.addRow(row);
      });

      // Auto ajustar columnas
      worksheet.columns.forEach((column, index) => {
        let maxLength = headers[index].length;
        if (column && column.eachCell) {
          column.eachCell({ includeEmpty: true }, (cell) => {
            const cellValue = cell.value ? cell.value.toString() : '';
            if (cellValue.length > maxLength) {
              maxLength = cellValue.length;
            }
          });
          column.width = maxLength < 10 ? 10 : maxLength + 2;
        }
      });
    }

    // Configurar respuesta HTTP
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${filename}.xlsx`,
    );

    // Enviar archivo
    await workbook.xlsx.write(res);
    res.end();
  }

  // ========== EXPORTACIÓN A PDF ==========

  async exportToPDF(
    data: any[],
    filename: string,
    title: string,
    res: Response,
  ) {
    const doc = new PDFKit();
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${filename}.pdf`,
      );
      res.send(pdfData);
    });

    // Configuración del documento
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();

    if (data.length > 0) {
      const headers = Object.keys(data[0]);

      // Crear tabla
      const tableTop = 150;
      const rowHeight = 20;
      let currentY = tableTop;

      // Headers
      doc.fontSize(10).font('Helvetica-Bold');
      headers.forEach((header, index) => {
        const x = index * 100;
        doc.text(header, x + 10, currentY + 5, { width: 90, align: 'center' });
        doc.rect(x, currentY, 100, rowHeight).stroke();
      });

      currentY += rowHeight;

      // Datos
      doc.font('Helvetica');
      data.forEach((item, rowIndex) => {
        headers.forEach((header, colIndex) => {
          const x = colIndex * 100;
          let value = item[header];

          // Formatear valores
          if (value instanceof Date) {
            value = value.toLocaleDateString('es-GT');
          } else if (typeof value === 'number') {
            value = value.toLocaleString('es-GT', { minimumFractionDigits: 2 });
          } else if (!value) {
            value = '';
          }

          doc.text(value.toString(), x + 10, currentY + 5, { width: 90 });
          doc.rect(x, currentY, 100, rowHeight).stroke();
        });

        currentY += rowHeight;

        // Nueva página si es necesario
        if (currentY > 700) {
          doc.addPage();
          currentY = tableTop;
        }
      });
    } else {
      doc.fontSize(12).text('No hay datos para mostrar', { align: 'center' });
    }

    doc.end();
  }

  // ========== MÉTODOS ESPECÍFICOS PARA CADA REPORTE ==========

  // ── PDF profesional ───────────────────────────────────────────────

  private async exportToPDFProfesional(
    data: any[],
    filename: string,
    title: string,
    headers: string[],
    rowMapper: (item: any) => (string | number)[],
    colWidths: number[],
    res: Response,
  ) {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
    const buffers: Buffer[] = [];
    doc.on('data', (b: Buffer) => buffers.push(b));
    doc.on('end', () => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      res.send(Buffer.concat(buffers));
    });

    const pageW = doc.page.width - 60;
    const HEADER_H = 22;
    const ROW_H = 18;
    const TITLE_H = 36;

    // ── Franja de título ──────────────────────────────────────────
    doc.rect(30, 30, pageW, TITLE_H).fill('#1F3864');
    doc.fillColor('#FFFFFF').fontSize(13).font('Helvetica-Bold')
      .text(title, 30, 38, { width: pageW, align: 'center' });

    // ── Subtítulo ─────────────────────────────────────────────────
    doc.fillColor('#444444').fontSize(8).font('Helvetica')
      .text(`Generado: ${new Date().toLocaleDateString('es-GT')}   |   Registros: ${data.length}`,
        30, 72, { width: pageW, align: 'center' });

    let y = 88;

    const drawHeaders = () => {
      doc.rect(30, y, pageW, HEADER_H).fill('#334155');
      let x = 30;
      headers.forEach((h, i) => {
        doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold')
          .text(h, x + 3, y + 6, { width: colWidths[i] - 4, align: 'center' });
        x += colWidths[i];
      });
      y += HEADER_H;
    };

    drawHeaders();

    // ── Filas ─────────────────────────────────────────────────────
    data.forEach((item, idx) => {
      if (y + ROW_H > doc.page.height - 40) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
        y = 30;
        drawHeaders();
      }

      const bg = idx % 2 === 0 ? '#F5F5F5' : '#FFFFFF';
      doc.rect(30, y, pageW, ROW_H).fill(bg);

      const cells = rowMapper(item);
      let x = 30;
      cells.forEach((cell, i) => {
        const val = cell == null ? '' : String(cell);
        const isNum = typeof cell === 'number' || (typeof cell === 'string' && cell.startsWith('Q '));
        doc.fillColor('#1E293B').fontSize(7).font('Helvetica')
          .text(val, x + 3, y + 5, { width: colWidths[i] - 5, align: isNum ? 'right' : 'left', ellipsis: true });
        x += colWidths[i];
      });

      // Línea separadora
      doc.moveTo(30, y + ROW_H).lineTo(30 + pageW, y + ROW_H)
        .strokeColor('#DDDDDD').lineWidth(0.3).stroke();

      y += ROW_H;
    });

    doc.end();
  }

  // ── Helpers de formato ────────────────────────────────────────────

  private today() {
    return new Date().toLocaleDateString('es-GT');
  }

  private async sendWorkbook(wb: ExcelJS.Workbook, filename: string, res: Response) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }

  // ── Empleados ─────────────────────────────────────────────────────

  async exportEmpleadosExcel(data: any[], res: Response) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Empleados');
    const headers = ['No.', 'Nombre Completo', 'DPI', 'Correo', 'Teléfono', 'Fecha Ingreso', 'Puesto', 'Departamento', 'Salario Base'];
    const rows = data.map((e, i) => [
      i + 1,
      `${e.Nombres ?? ''} ${e.Apellidos ?? ''}`.trim(),
      e.DPI ?? '',
      e.CorreoPersonal ?? '',
      e.Telefono ?? '',
      e.FechaIngresa ? new Date(e.FechaIngresa).toLocaleDateString('es-GT') : '',
      e.Puesto ?? '',
      e.Departamento ?? '',
      Number(e.SalarioActual ?? 0),
    ]);
    await this.buildNominaSheet(ws, {
      titulo: `REPORTE DE EMPLEADOS — ${this.today()}`,
      subtitulo: `Total de empleados activos: ${data.length}`,
      headerColor: 'FF1F3864',
      headers,
      rows,
    });
    return this.sendWorkbook(wb, `Reporte-Empleados-${this.today().replace(/\//g, '-')}`, res);
  }

  async exportEmpleadosPDF(data: any[], res: Response) {
    return this.exportToPDFProfesional(data, 'Reporte-Empleados', 'REPORTE DE EMPLEADOS', [
      'ID', 'Nombre', 'DPI', 'Puesto', 'Departamento', 'Salario',
    ], (e) => [
      e.IdEmpleado, `${e.Nombres} ${e.Apellidos}`, e.DPI, e.Puesto, e.Departamento,
      `Q ${Number(e.SalarioActual ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
    ], [30, 130, 80, 110, 110, 70], res);
  }

  // ── Salarios ──────────────────────────────────────────────────────

  async exportSalariosExcel(data: any[], res: Response) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Salarios');
    const headers = ['No.', 'Empleado', 'DPI', 'Puesto', 'Departamento', 'Salario Base', 'Inicio Vigencia', 'Fin Vigencia'];
    const rows = data.map((s, i) => [
      i + 1, s.NombreEmpleado ?? '', s.DPI ?? '', s.Puesto ?? '', s.Departamento ?? '',
      Number(s.SalarioBase ?? 0),
      s.FechaInicioVigencia ? new Date(s.FechaInicioVigencia).toLocaleDateString('es-GT') : '',
      s.FechaFinVigencia ? new Date(s.FechaFinVigencia).toLocaleDateString('es-GT') : 'Vigente',
    ]);
    const sum = rows.reduce((a, r) => a + Number(r[5]), 0);
    const totals = ['TOTALES', '', '', '', '', parseFloat(sum.toFixed(2)), '', ''];
    await this.buildNominaSheet(ws, {
      titulo: `HISTORIAL DE SALARIOS — ${this.today()}`,
      subtitulo: `Registros activos: ${data.length}`,
      headerColor: 'FF1E4D2B',
      headers, rows, totals,
    });
    return this.sendWorkbook(wb, `Reporte-Salarios-${this.today().replace(/\//g, '-')}`, res);
  }

  async exportSalariosPDF(data: any[], res: Response) {
    return this.exportToPDFProfesional(data, 'Reporte-Salarios', 'HISTORIAL DE SALARIOS', [
      'Empleado', 'DPI', 'Puesto', 'Salario Base', 'Inicio', 'Fin',
    ], (s) => [
      s.NombreEmpleado, s.DPI, s.Puesto,
      `Q ${Number(s.SalarioBase ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
      s.FechaInicioVigencia ? new Date(s.FechaInicioVigencia).toLocaleDateString('es-GT') : '',
      s.FechaFinVigencia ? new Date(s.FechaFinVigencia).toLocaleDateString('es-GT') : 'Vigente',
    ], [140, 80, 110, 80, 70, 70], res);
  }

  // ── Departamentos ─────────────────────────────────────────────────

  async exportDepartamentosExcel(data: any[], res: Response) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Departamentos');
    const headers = ['No.', 'Departamento', 'Puestos', 'Empleados', 'Masa Salarial'];
    const rows = data.map((d, i) => [i + 1, d.NombreDepartamento ?? '', d.CantidadPuestos ?? 0, d.CantidadEmpleados ?? 0, Number(d.MasaSalarial ?? 0)]);
    const totals = ['TOTALES', '',
      rows.reduce((a, r) => a + Number(r[2]), 0),
      rows.reduce((a, r) => a + Number(r[3]), 0),
      parseFloat(rows.reduce((a, r) => a + Number(r[4]), 0).toFixed(2)),
    ];
    await this.buildNominaSheet(ws, {
      titulo: `REPORTE DE DEPARTAMENTOS — ${this.today()}`,
      subtitulo: `Departamentos activos: ${data.length}`,
      headerColor: 'FF7B3F00',
      headers, rows, totals,
    });
    return this.sendWorkbook(wb, `Reporte-Departamentos-${this.today().replace(/\//g, '-')}`, res);
  }

  async exportDepartamentosPDF(data: any[], res: Response) {
    return this.exportToPDFProfesional(data, 'Reporte-Departamentos', 'REPORTE DE DEPARTAMENTOS', [
      'Departamento', 'Puestos', 'Empleados', 'Masa Salarial',
    ], (d) => [
      d.NombreDepartamento, d.CantidadPuestos, d.CantidadEmpleados,
      `Q ${Number(d.MasaSalarial ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
    ], [200, 80, 80, 120], res);
  }

  // ── Nómina ────────────────────────────────────────────────────────

  async exportNominaExcel(data: any[], res: Response) {
    const filename = `reporte-nomina-${new Date().toISOString().split('T')[0]}`;
    return this.exportToExcel(data, filename, 'Nómina', res);
  }

  async exportNominaPDF(data: any[], res: Response) {
    return this.exportToPDFProfesional(data, 'Reporte-Nomina', 'REPORTE DE NÓMINA', [
      'Período', 'Estado', 'Empleados', 'Total Sueldos', 'Descuentos', 'Líquido',
    ], (n) => [
      `${n.Mes}/${n.Anio}`, n.Estado ?? '',
      n.TotalEmpleados,
      `Q ${Number(n.TotalSueldos ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
      `Q ${Number(n.TotalDescuentos ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
      `Q ${Number(n.TotalLiquido ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
    ], [60, 90, 60, 100, 100, 100], res);
  }

  // ── Asistencias ───────────────────────────────────────────────────

  async exportAsistenciasExcel(data: any[], res: Response) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Asistencias');
    const headers = ['No.', 'Empleado', 'Puesto', 'Departamento', 'Total Asist.', 'Con Entrada', 'Con Salida', 'Horas Extra'];
    const rows = data.map((a, i) => [
      i + 1, a.NombreEmpleado ?? '', a.Puesto ?? '', a.Departamento ?? '',
      a.TotalAsistencias ?? 0, a.DiasConEntrada ?? 0, a.DiasConSalida ?? 0,
      parseFloat(Number(a.TotalHorasExtra ?? 0).toFixed(2)),
    ]);
    const totals = ['TOTALES', '', '', '',
      rows.reduce((a, r) => a + Number(r[4]), 0),
      rows.reduce((a, r) => a + Number(r[5]), 0),
      rows.reduce((a, r) => a + Number(r[6]), 0),
      parseFloat(rows.reduce((a, r) => a + Number(r[7]), 0).toFixed(2)),
    ];
    await this.buildNominaSheet(ws, {
      titulo: `REPORTE DE ASISTENCIAS — ${this.today()}`,
      subtitulo: `Total de registros: ${data.length}`,
      headerColor: 'FF4B0082',
      headers, rows, totals,
    });
    return this.sendWorkbook(wb, `Reporte-Asistencias-${this.today().replace(/\//g, '-')}`, res);
  }

  async exportAsistenciasPDF(data: any[], res: Response) {
    return this.exportToPDFProfesional(data, 'Reporte-Asistencias', 'REPORTE DE ASISTENCIAS', [
      'Empleado', 'Puesto', 'Asistencias', 'Con Entrada', 'Con Salida', 'Horas Extra',
    ], (a) => [
      a.NombreEmpleado, a.Puesto, a.TotalAsistencias,
      a.DiasConEntrada, a.DiasConSalida,
      `${Number(a.TotalHorasExtra ?? 0).toFixed(2)} hrs`,
    ], [140, 110, 70, 70, 70, 80], res);
  }

  // ── Vacaciones ────────────────────────────────────────────────────

  async exportVacacionesExcel(data: any[], res: Response) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Vacaciones');
    const headers = ['No.', 'Empleado', 'Puesto', 'Departamento', 'Año', 'Días Ganados', 'Días Gozados', 'Días Pendientes'];
    const rows = data.map((v, i) => [
      i + 1, v.NombreEmpleado ?? '', v.Puesto ?? '', v.Departamento ?? '',
      v.Anio ?? '', v.DiasGanados ?? 0, Number(v.DiasGozados ?? 0), Number(v.DiasPendientes ?? 0),
    ]);
    await this.buildNominaSheet(ws, {
      titulo: `REPORTE DE VACACIONES — ${this.today()}`,
      subtitulo: `Total de registros: ${data.length}`,
      headerColor: 'FF004D40',
      headers, rows,
    });
    return this.sendWorkbook(wb, `Reporte-Vacaciones-${this.today().replace(/\//g, '-')}`, res);
  }

  async exportVacacionesPDF(data: any[], res: Response) {
    return this.exportToPDFProfesional(data, 'Reporte-Vacaciones', 'REPORTE DE VACACIONES', [
      'Empleado', 'Puesto', 'Año', 'Ganados', 'Gozados', 'Pendientes',
    ], (v) => [
      v.NombreEmpleado, v.Puesto, v.Anio,
      v.DiasGanados, Number(v.DiasGozados ?? 0), Number(v.DiasPendientes ?? 0),
    ], [160, 110, 50, 60, 60, 70], res);
  }

  // ========== REPORTES DE NÓMINA POR INSTITUCIÓN ==========

  private readonly MESES_ES = [
    '', 'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
  ];

  private async buildNominaSheet(
    ws: ExcelJS.Worksheet,
    config: {
      titulo: string;
      subtitulo: string;
      headerColor: string;
      headers: string[];
      rows: (string | number)[][];
      totals?: (string | number)[];
    },
  ) {
    const colCount = config.headers.length;

    // ── Fila 1: Título ──────────────────────────────────────────────
    ws.mergeCells(1, 1, 1, colCount);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = config.titulo;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: config.headerColor } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    // ── Fila 2: Subtítulo ───────────────────────────────────────────
    ws.mergeCells(2, 1, 2, colCount);
    const subCell = ws.getCell(2, 1);
    subCell.value = config.subtitulo;
    subCell.font = { italic: true, size: 10, color: { argb: 'FF444444' } };
    subCell.alignment = { horizontal: 'center' };
    ws.getRow(2).height = 18;

    // ── Fila 3: Vacía ───────────────────────────────────────────────
    ws.getRow(3).height = 8;

    // ── Fila 4: Encabezados ─────────────────────────────────────────
    const headerRow = ws.getRow(4);
    headerRow.values = ['', ...config.headers];
    config.headers.forEach((_, i) => {
      const cell = ws.getCell(4, i + 1);
      cell.value = config.headers[i];
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: config.headerColor } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      };
    });
    headerRow.height = 32;

    // ── Filas de datos ──────────────────────────────────────────────
    config.rows.forEach((rowData, idx) => {
      const dataRow = ws.getRow(5 + idx);
      dataRow.values = rowData;
      const isEven = idx % 2 === 0;
      rowData.forEach((_, ci) => {
        const cell = ws.getCell(5 + idx, ci + 1);
        cell.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF5F5F5' : 'FFFFFFFF' },
        };
        cell.border = {
          bottom: { style: 'hair', color: { argb: 'FFDDDDDD' } },
        };
        if (typeof rowData[ci] === 'number') {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
        }
      });
      dataRow.height = 18;
    });

    // ── Fila de totales ─────────────────────────────────────────────
    if (config.totals) {
      const totalRowIdx = 5 + config.rows.length;
      const totalRow = ws.getRow(totalRowIdx);
      totalRow.values = config.totals;
      config.totals.forEach((v, ci) => {
        const cell = ws.getCell(totalRowIdx, ci + 1);
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: config.headerColor } };
        if (typeof v === 'number') {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
        }
      });
      totalRow.height = 20;
    }

    // ── Auto-ancho ──────────────────────────────────────────────────
    ws.columns.forEach((col, i) => {
      let max = config.headers[i]?.length ?? 8;
      col?.eachCell?.({ includeEmpty: false }, (c) => {
        const len = c.value?.toString().length ?? 0;
        if (len > max) max = len;
      });
      col.width = Math.min(max + 4, 40);
    });
  }

  async exportNominaGeneral(
    nomina: any,
    res: Response,
  ) {
    const mes = this.MESES_ES[nomina.Mes] ?? String(nomina.Mes);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Planilla General');

    const headers = [
      'No.', 'Empleado', 'DPI', 'NIT', 'Días Lab.',
      'Salario Base', 'Bonificaciones', 'Otros Ingresos', 'Total Ingresos',
      'Desc. IGSS', 'Desc. ISR', 'Otros Desc.', 'Total Desc.', 'Líquido a Recibir',
    ];

    const rows = (nomina.NominaDetalle ?? []).map((d: any, i: number) => {
      const sb = Number(d.SueldoBase ?? 0);
      const bi = Number(d.BonificacionIncentivo ?? 0);
      const oi = Number(d.OtrosIngresos ?? 0);
      const di = Number(d.DescuentoIGSS ?? 0);
      const ds = Number(d.DescuentoISR ?? 0);
      const od = Number(d.OtrosDescuentos ?? 0);
      return [
        i + 1,
        `${d.Empleado?.Nombres ?? ''} ${d.Empleado?.Apellidos ?? ''}`.trim(),
        d.Empleado?.DPI ?? '',
        d.Empleado?.NIT ?? '',
        Number(d.DiasLaborados ?? 0),
        sb, bi, oi, sb + bi + oi,
        di, ds, od, di + ds + od,
        Number(d.LiquidoRecibir ?? 0),
      ];
    });

    const sum = (idx: number) => rows.reduce((a: number, r: any[]) => a + (Number(r[idx]) || 0), 0);
    const totals = [
      'TOTALES', '', '', '', '',
      sum(5), sum(6), sum(7), sum(8),
      sum(9), sum(10), sum(11), sum(12), sum(13),
    ];

    await this.buildNominaSheet(ws, {
      titulo: `PLANILLA GENERAL — ${mes} ${nomina.Anio}`,
      subtitulo: `Período: ${mes} ${nomina.Anio}  |  Generado: ${new Date().toLocaleDateString('es-GT')}  |  Total empleados: ${rows.length}`,
      headerColor: 'FF1F3864',
      headers,
      rows,
      totals,
    });

    const filename = `Planilla-General-${mes}-${nomina.Anio}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }

  async exportNominaIGSS(nomina: any, res: Response) {
    const mes = this.MESES_ES[nomina.Mes] ?? String(nomina.Mes);
    const PATRONAL = 0.1267;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Planilla IGSS');

    const headers = [
      'No.', 'Empleado', 'DPI',
      'Salario Base', 'Cuota Empleado 3.67%', 'Cuota Patronal 12.67%', 'Total IGSS',
    ];

    const rows = (nomina.NominaDetalle ?? []).map((d: any, i: number) => {
      const sb = Number(d.SueldoBase ?? 0);
      const emp = Number(d.DescuentoIGSS ?? 0);
      const pat = parseFloat((sb * PATRONAL).toFixed(2));
      return [
        i + 1,
        `${d.Empleado?.Nombres ?? ''} ${d.Empleado?.Apellidos ?? ''}`.trim(),
        d.Empleado?.DPI ?? '',
        sb, emp, pat, parseFloat((emp + pat).toFixed(2)),
      ];
    });

    const sum = (idx: number) => parseFloat(rows.reduce((a: number, r: any[]) => a + (Number(r[idx]) || 0), 0).toFixed(2));
    const totals = ['TOTALES', '', '', sum(3), sum(4), sum(5), sum(6)];

    await this.buildNominaSheet(ws, {
      titulo: `PLANILLA IGSS — ${mes} ${nomina.Anio}`,
      subtitulo: `Cuotas del Instituto Guatemalteco de Seguridad Social  |  Período: ${mes} ${nomina.Anio}  |  Generado: ${new Date().toLocaleDateString('es-GT')}`,
      headerColor: 'FF1E4D2B',
      headers,
      rows,
      totals,
    });

    const filename = `Planilla-IGSS-${mes}-${nomina.Anio}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }

  async exportNominaISR(nomina: any, res: Response) {
    const mes = this.MESES_ES[nomina.Mes] ?? String(nomina.Mes);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Planilla ISR');

    const headers = [
      'No.', 'Empleado', 'NIT',
      'Salario Base Mensual', 'Salario Anualizado', 'ISR Mensual Retenido',
    ];

    const rows = (nomina.NominaDetalle ?? []).map((d: any, i: number) => {
      const sb = Number(d.SueldoBase ?? 0);
      const isr = Number(d.DescuentoISR ?? 0);
      return [
        i + 1,
        `${d.Empleado?.Nombres ?? ''} ${d.Empleado?.Apellidos ?? ''}`.trim(),
        d.Empleado?.NIT ?? '',
        sb,
        parseFloat((sb * 12).toFixed(2)),
        isr,
      ];
    });

    const sum = (idx: number) => parseFloat(rows.reduce((a: number, r: any[]) => a + (Number(r[idx]) || 0), 0).toFixed(2));
    const totals = ['TOTALES', '', '', sum(3), sum(4), sum(5)];

    await this.buildNominaSheet(ws, {
      titulo: `PLANILLA ISR — ${mes} ${nomina.Anio}`,
      subtitulo: `Retención del Impuesto Sobre la Renta  |  Superintendencia de Administración Tributaria (SAT)  |  Período: ${mes} ${nomina.Anio}`,
      headerColor: 'FF8B0000',
      headers,
      rows,
      totals,
    });

    const filename = `Planilla-ISR-${mes}-${nomina.Anio}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }
}
