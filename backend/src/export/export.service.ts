import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFKit = require('pdfkit');

@Injectable()
export class ExportService {
  constructor() {}

  // ========== EXPORTACIÓN A EXCEL ==========

  async exportToExcel(data: any[], filename: string, sheetName: string, res: Response) {
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
        fgColor: { argb: 'FF4F81BD' }
      };
      headerRow.alignment = { horizontal: 'center' };

      // Agregar datos
      data.forEach((item) => {
        const row = headers.map(header => {
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
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);

    // Enviar archivo
    await workbook.xlsx.write(res);
    res.end();
  }

  // ========== EXPORTACIÓN A PDF ==========

  async exportToPDF(data: any[], filename: string, title: string, res: Response) {
    const doc = new PDFKit();
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
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

  async exportEmpleadosExcel(data: any[], res: Response) {
    const filename = `reporte-empleados-${new Date().toISOString().split('T')[0]}`;
    return this.exportToExcel(data, filename, 'Empleados', res);
  }

  async exportEmpleadosPDF(data: any[], res: Response) {
    const filename = `reporte-empleados-${new Date().toISOString().split('T')[0]}`;
    return this.exportToPDF(data, filename, 'REPORTE DE EMPLEADOS', res);
  }

  async exportSalariosExcel(data: any[], res: Response) {
    const filename = `reporte-salarios-${new Date().toISOString().split('T')[0]}`;
    return this.exportToExcel(data, filename, 'Salarios', res);
  }

  async exportSalariosPDF(data: any[], res: Response) {
    const filename = `reporte-salarios-${new Date().toISOString().split('T')[0]}`;
    return this.exportToPDF(data, filename, 'REPORTE DE SALARIOS', res);
  }

  async exportDepartamentosExcel(data: any[], res: Response) {
    const filename = `reporte-departamentos-${new Date().toISOString().split('T')[0]}`;
    return this.exportToExcel(data, filename, 'Departamentos', res);
  }

  async exportDepartamentosPDF(data: any[], res: Response) {
    const filename = `reporte-departamentos-${new Date().toISOString().split('T')[0]}`;
    return this.exportToPDF(data, filename, 'REPORTE DE DEPARTAMENTOS', res);
  }

  async exportNominaExcel(data: any[], res: Response) {
    const filename = `reporte-nomina-${new Date().toISOString().split('T')[0]}`;
    return this.exportToExcel(data, filename, 'Nómina', res);
  }

  async exportNominaPDF(data: any[], res: Response) {
    const filename = `reporte-nomina-${new Date().toISOString().split('T')[0]}`;
    return this.exportToPDF(data, filename, 'REPORTE DE NÓMINA', res);
  }

  async exportAsistenciasExcel(data: any[], res: Response) {
    const filename = `reporte-asistencias-${new Date().toISOString().split('T')[0]}`;
    return this.exportToExcel(data, filename, 'Asistencias', res);
  }

  async exportAsistenciasPDF(data: any[], res: Response) {
    const filename = `reporte-asistencias-${new Date().toISOString().split('T')[0]}`;
    return this.exportToPDF(data, filename, 'REPORTE DE ASISTENCIAS', res);
  }

  async exportVacacionesExcel(data: any[], res: Response) {
    const filename = `reporte-vacaciones-${new Date().toISOString().split('T')[0]}`;
    return this.exportToExcel(data, filename, 'Vacaciones', res);
  }

  async exportVacacionesPDF(data: any[], res: Response) {
    const filename = `reporte-vacaciones-${new Date().toISOString().split('T')[0]}`;
    return this.exportToPDF(data, filename, 'REPORTE DE VACACIONES', res);
  }
}