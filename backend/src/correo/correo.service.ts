import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BrevoClient } from '@getbrevo/brevo';

@Injectable()
export class CorreoService {
  private brevo: BrevoClient;

  constructor(private prisma: PrismaService) {
    this.brevo = new BrevoClient({ apiKey: process.env.BREVO_KEY ?? '' });
  }

  // ── Método base ───────────────────────────────────────────────────────────

  async enviarCorreo(
    destinatarios: { email: string; name?: string }[],
    asunto: string,
    htmlContent: string,
  ): Promise<void> {
    if (!process.env.BREVO_KEY) {
      throw new BadRequestException('BREVO_KEY no está configurado en el servidor');
    }

    const sender = {
      email: process.env.BREVO_SENDER_EMAIL ?? 'kevinreyes240122@gmail.com',
      name:  process.env.BREVO_SENDER_NAME  ?? 'Nómina GT',
    };

    await this.brevo.transactionalEmails.sendTransacEmail({
      sender,
      to:          destinatarios,
      subject:     asunto,
      htmlContent,
    });
  }

  // ── Boleta de nómina ──────────────────────────────────────────────────────

  async enviarBoletaNomina(idNomina: number): Promise<{ enviados: number; destinatarios: string[] }> {
    const nomina = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina: idNomina },
      include: {
        EstadoNomina: true,
        NominaDetalle: {
          where: { Activo: true },
          include: {
            Empleado: {
              include: { Puesto: { select: { NombrePuesto: true } } },
            },
          },
        },
      },
    });

    if (!nomina) throw new NotFoundException(`Nómina ${idNomina} no encontrada`);

    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const periodoLabel = `${meses[(nomina.Mes ?? 1) - 1]} ${nomina.Anio}`;
    const destinatarios: string[] = [];

    for (const detalle of nomina.NominaDetalle) {
      const emp = detalle.Empleado;
      if (!emp?.CorreoPersonal) continue;

      const html = this.templateBoleta({
        nombre:       `${emp.Nombres} ${emp.Apellidos}`,
        puesto:       emp.Puesto?.NombrePuesto ?? '—',
        periodo:      periodoLabel,
        sueldoBase:   parseFloat(detalle.SueldoBase.toString()),
        bonificacion: parseFloat(detalle.BonificacionIncentivo?.toString() ?? '0'),
        otrosIngresos: parseFloat(detalle.OtrosIngresos?.toString() ?? '0'),
        descIGSS:     parseFloat(detalle.DescuentoIGSS?.toString() ?? '0'),
        descISR:      parseFloat(detalle.DescuentoISR?.toString() ?? '0'),
        otrosDesc:    parseFloat(detalle.OtrosDescuentos?.toString() ?? '0'),
        liquido:      parseFloat(detalle.LiquidoRecibir?.toString() ?? '0'),
        noBoleta:     nomina.NumeroBoleta ?? undefined,
      });

      await this.enviarCorreo(
        [{ email: emp.CorreoPersonal, name: `${emp.Nombres} ${emp.Apellidos}` }],
        `Boleta de Pago — ${periodoLabel}`,
        html,
      );

      destinatarios.push(emp.CorreoPersonal);
    }

    if (destinatarios.length === 0) {
      throw new BadRequestException('Ningún empleado en esta nómina tiene correo registrado');
    }

    return { enviados: destinatarios.length, destinatarios };
  }

  // ── Factura / recibo de venta ─────────────────────────────────────────────

  async enviarFacturaVenta(idVenta: number): Promise<{ enviado: boolean; destinatario: string }> {
    const venta = await this.prisma.venta.findUnique({
      where: { IdVenta: idVenta },
      include: {
        Cliente: true,
        DetalleVenta: {
          where: { Activo: true },
          include: { ProductoServicio: { select: { NombreProducto: true } } },
        },
      },
    });

    if (!venta) throw new NotFoundException(`Venta ${idVenta} no encontrada`);
    if (!venta.Cliente?.Correo) {
      throw new BadRequestException('El cliente no tiene correo electrónico registrado');
    }

    const html = this.templateFactura({
      idVenta:    venta.IdVenta,
      cliente:    venta.Cliente.NombreCliente,
      fecha:      venta.FechaVenta ?? new Date(),
      tipoVenta:  venta.TipoVenta ?? 'CONTADO',
      estadoPago: venta.EstadoPago ?? 'PENDIENTE',
      detalles:   venta.DetalleVenta.map(d => ({
        nombre:    d.ProductoServicio?.NombreProducto ?? '—',
        cantidad:  parseFloat(d.Cantidad.toString()),
        precio:    parseFloat(d.PrecioUnitario.toString()),
        descuento: parseFloat(d.Descuento?.toString() ?? '0'),
        subtotal:  parseFloat(d.Subtotal.toString()),
      })),
      subtotal:   parseFloat(venta.Subtotal.toString()),
      descuento:  parseFloat(venta.Descuento?.toString() ?? '0'),
      impuestos:  parseFloat(venta.Impuestos?.toString() ?? '0'),
      total:      parseFloat(venta.Total.toString()),
      notas:      venta.Notas ?? undefined,
    });

    await this.enviarCorreo(
      [{ email: venta.Cliente.Correo, name: venta.Cliente.NombreCliente }],
      `Factura de Venta #${idVenta} — Nómina GT`,
      html,
    );

    return { enviado: true, destinatario: venta.Cliente.Correo };
  }

  // ── Credenciales de nuevo usuario ────────────────────────────────────────

  async enviarCredencialesUsuario(
    username: string,
    password: string,
    idEmpleado: number,
  ): Promise<void> {
    const empleado = await this.prisma.empleado.findUnique({
      where: { IdEmpleado: idEmpleado },
      select: { CorreoPersonal: true, Nombres: true, Apellidos: true },
    });

    if (!empleado?.CorreoPersonal) return;

    const nombre = `${empleado.Nombres} ${empleado.Apellidos}`;
    const html   = this.templateCredenciales({ nombre, username, password });

    await this.enviarCorreo(
      [{ email: empleado.CorreoPersonal, name: nombre }],
      'Bienvenido a Nómina GT — Tus credenciales de acceso',
      html,
    );
  }

  // ── Notificación genérica ─────────────────────────────────────────────────

  async enviarNotificacion(
    destinatarios: string[],
    asunto: string,
    mensaje: string,
    nombreDestinatario?: string,
  ): Promise<{ enviados: number }> {
    const html = this.templateNotificacion({ asunto, mensaje, nombre: nombreDestinatario });
    await this.enviarCorreo(
      destinatarios.map(e => ({ email: e, name: nombreDestinatario })),
      asunto,
      html,
    );
    return { enviados: destinatarios.length };
  }

  // ── Templates HTML ────────────────────────────────────────────────────────

  private templateBoleta(d: {
    nombre: string; puesto: string; periodo: string;
    sueldoBase: number; bonificacion: number; otrosIngresos: number;
    descIGSS: number; descISR: number; otrosDesc: number;
    liquido: number; noBoleta?: string;
  }): string {
    const fmt = (n: number) => `Q ${n.toFixed(2)}`;
    const totalIngresos = d.sueldoBase + d.bonificacion + d.otrosIngresos;
    const totalDesc     = d.descIGSS + d.descISR + d.otrosDesc;

    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:24px}
  .card{background:#fff;border-radius:8px;max-width:580px;margin:0 auto;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .hdr{background:#0f172a;color:#fff;padding:24px 28px}
  .hdr h1{margin:0;font-size:20px}.hdr p{margin:4px 0 0;color:#94a3b8;font-size:13px}
  .body{padding:24px 28px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:20px}
  .item label{display:block;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
  .item span{font-size:14px;font-weight:600;color:#1e293b}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f8fafc;text-align:left;padding:8px 10px;color:#64748b;font-size:11px;text-transform:uppercase;border-bottom:1px solid #e2e8f0}
  td{padding:8px 10px;border-bottom:1px solid #f1f5f9}
  .r{text-align:right;font-family:monospace}
  .g{color:#16a34a}.red{color:#dc2626}
  .tot td{font-weight:700;font-size:15px;border-top:2px solid #e2e8f0;border-bottom:none}
  .ftr{background:#f8fafc;padding:14px 28px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0}
</style></head><body>
<div class="card">
  <div class="hdr">
    <h1>Boleta de Pago</h1>
    <p>Período: ${d.periodo}${d.noBoleta ? ` &nbsp;·&nbsp; Boleta: ${d.noBoleta}` : ''}</p>
  </div>
  <div class="body">
    <div class="grid">
      <div class="item"><label>Empleado</label><span>${d.nombre}</span></div>
      <div class="item"><label>Puesto</label><span>${d.puesto}</span></div>
    </div>
    <table>
      <tr><th>Concepto</th><th class="r">Monto</th></tr>
      <tr><td>Sueldo Base</td><td class="r g">${fmt(d.sueldoBase)}</td></tr>
      <tr><td>Bonificación / Incentivo</td><td class="r g">${fmt(d.bonificacion)}</td></tr>
      ${d.otrosIngresos > 0 ? `<tr><td>Otros Ingresos</td><td class="r g">${fmt(d.otrosIngresos)}</td></tr>` : ''}
      <tr><td><strong>Total Ingresos</strong></td><td class="r"><strong>${fmt(totalIngresos)}</strong></td></tr>
      <tr><td>Descuento IGSS</td><td class="r red">− ${fmt(d.descIGSS)}</td></tr>
      <tr><td>Descuento ISR</td><td class="r red">− ${fmt(d.descISR)}</td></tr>
      ${d.otrosDesc > 0 ? `<tr><td>Otros Descuentos</td><td class="r red">− ${fmt(d.otrosDesc)}</td></tr>` : ''}
      <tr><td><strong>Total Descuentos</strong></td><td class="r red"><strong>− ${fmt(totalDesc)}</strong></td></tr>
      <tr class="tot"><td>💰 Líquido a Recibir</td><td class="r g">${fmt(d.liquido)}</td></tr>
    </table>
  </div>
  <div class="ftr">Este documento es generado automáticamente por Nómina GT.</div>
</div></body></html>`;
  }

  private templateFactura(d: {
    idVenta: number; cliente: string; fecha: Date | null;
    tipoVenta: string; estadoPago: string;
    detalles: { nombre: string; cantidad: number; precio: number; descuento: number; subtotal: number }[];
    subtotal: number; descuento: number; impuestos: number; total: number; notas?: string;
  }): string {
    const fmt   = (n: number) => `Q ${n.toFixed(2)}`;
    const fecha = d.fecha ? new Date(d.fecha).toLocaleDateString('es-GT') : '—';
    const filas = d.detalles.map(item =>
      `<tr><td>${item.nombre}</td><td class="r">${item.cantidad}</td><td class="r">${fmt(item.precio)}</td><td class="r red">−${fmt(item.descuento)}</td><td class="r g">${fmt(item.subtotal)}</td></tr>`
    ).join('');
    const badgeCss = d.estadoPago === 'PAGADO'
      ? 'background:#dcfce7;color:#15803d'
      : 'background:#fef9c3;color:#854d0e';

    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:24px}
  .card{background:#fff;border-radius:8px;max-width:640px;margin:0 auto;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .hdr{background:#0f172a;color:#fff;padding:24px 28px;display:flex;justify-content:space-between;align-items:center}
  .hdr h1{margin:0;font-size:20px}.hdr p{margin:4px 0 0;color:#94a3b8;font-size:13px}
  .badge{font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;${badgeCss}}
  .body{padding:24px 28px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:20px}
  .item label{display:block;font-size:11px;color:#64748b;text-transform:uppercase}
  .item span{font-size:14px;font-weight:600;color:#1e293b}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px}
  th{background:#f8fafc;text-align:left;padding:8px 10px;color:#64748b;font-size:11px;text-transform:uppercase;border-bottom:1px solid #e2e8f0}
  td{padding:8px 10px;border-bottom:1px solid #f1f5f9}
  .r{text-align:right;font-family:monospace}.g{color:#16a34a}.red{color:#dc2626}
  .tots{width:260px;margin-left:auto;font-size:13px}
  .tots td:last-child{text-align:right;font-family:monospace}
  .tf td{font-size:16px;font-weight:700;color:#16a34a;border-top:2px solid #e2e8f0}
  .notas{background:#f8fafc;border-radius:6px;padding:12px 16px;font-size:13px;color:#64748b;margin-top:12px}
  .ftr{background:#f8fafc;padding:14px 28px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0}
</style></head><body>
<div class="card">
  <div class="hdr">
    <div><h1>Factura #${d.idVenta}</h1><p>${fecha} · ${d.tipoVenta}</p></div>
    <span class="badge">${d.estadoPago}</span>
  </div>
  <div class="body">
    <div class="grid"><div class="item"><label>Cliente</label><span>${d.cliente}</span></div></div>
    <table>
      <tr><th>Descripción</th><th class="r">Cant.</th><th class="r">Precio</th><th class="r">Desc.</th><th class="r">Subtotal</th></tr>
      ${filas}
    </table>
    <table class="tots">
      <tr><td>Subtotal</td><td>${fmt(d.subtotal)}</td></tr>
      <tr><td>Descuento</td><td class="red">−${fmt(d.descuento)}</td></tr>
      <tr><td>IVA (12%)</td><td>${fmt(d.impuestos)}</td></tr>
      <tr class="tf"><td>Total</td><td>${fmt(d.total)}</td></tr>
    </table>
    ${d.notas ? `<div class="notas"><strong>Notas:</strong> ${d.notas}</div>` : ''}
  </div>
  <div class="ftr">Nómina GT · Documento generado automáticamente.</div>
</div></body></html>`;
  }

  private templateCredenciales(d: { nombre: string; username: string; password: string }): string {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:24px}
  .card{background:#fff;border-radius:8px;max-width:520px;margin:0 auto;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .hdr{background:#0f172a;color:#fff;padding:24px 28px}
  .hdr h1{margin:0;font-size:20px}.hdr p{margin:6px 0 0;color:#94a3b8;font-size:13px}
  .body{padding:24px 28px;font-size:14px;color:#334155;line-height:1.7}
  .cred-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:16px 0}
  .cred-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #e2e8f0}
  .cred-row:last-child{border-bottom:none}
  .cred-label{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
  .cred-value{font-family:monospace;font-size:15px;font-weight:700;color:#0f172a;background:#e2e8f0;padding:4px 10px;border-radius:4px}
  .warning{background:#fef9c3;border:1px solid #fde047;border-radius:6px;padding:10px 14px;font-size:12px;color:#854d0e;margin-top:16px}
  .ftr{background:#f8fafc;padding:14px 28px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0}
</style></head><body>
<div class="card">
  <div class="hdr">
    <h1>¡Bienvenido a Nómina GT!</h1>
    <p>Tu cuenta ha sido creada exitosamente.</p>
  </div>
  <div class="body">
    <p>Hola <strong>${d.nombre}</strong>,</p>
    <p>A continuación encontrarás tus credenciales para acceder al sistema:</p>
    <div class="cred-box">
      <div class="cred-row">
        <span class="cred-label">Usuario</span>
        <span class="cred-value">${d.username}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Contraseña</span>
        <span class="cred-value">${d.password}</span>
      </div>
    </div>
    <div class="warning">
      ⚠️ Por seguridad, te recomendamos cambiar tu contraseña la primera vez que inicies sesión.
    </div>
  </div>
  <div class="ftr">Nómina GT · No respondas a este correo, es generado automáticamente.</div>
</div></body></html>`;
  }

  private templateNotificacion(d: { asunto: string; mensaje: string; nombre?: string }): string {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:24px}
  .card{background:#fff;border-radius:8px;max-width:520px;margin:0 auto;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .hdr{background:#0f172a;color:#fff;padding:24px 28px}
  .hdr h1{margin:0;font-size:18px}
  .body{padding:24px 28px;font-size:14px;color:#334155;line-height:1.6}
  .ftr{background:#f8fafc;padding:14px 28px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0}
</style></head><body>
<div class="card">
  <div class="hdr"><h1>${d.asunto}</h1></div>
  <div class="body">
    ${d.nombre ? `<p>Hola <strong>${d.nombre}</strong>,</p>` : '<p>Hola,</p>'}
    <p>${d.mensaje.replace(/\n/g, '<br>')}</p>
  </div>
  <div class="ftr">Nómina GT · Notificación automática</div>
</div></body></html>`;
  }
}
