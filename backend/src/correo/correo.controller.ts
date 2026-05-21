import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CorreoService } from './correo.service';
import { EnviarBoletaDto, EnviarFacturaDto, EnviarNotificacionDto } from './correo.dto';
import { AuthGuard } from '../login/login.guard';

@Controller('correo')
@UseGuards(AuthGuard)
export class CorreoController {
  constructor(private readonly correoService: CorreoService) {}

  @Post('boleta-nomina')
  enviarBoletaNomina(@Body() dto: EnviarBoletaDto) {
    return this.correoService.enviarBoletaNomina(dto.IdNomina);
  }

  @Post('factura-venta')
  enviarFacturaVenta(@Body() dto: EnviarFacturaDto) {
    return this.correoService.enviarFacturaVenta(dto.IdVenta);
  }

  @Post('notificacion')
  enviarNotificacion(@Body() dto: EnviarNotificacionDto) {
    return this.correoService.enviarNotificacion(
      dto.Destinatarios,
      dto.Asunto,
      dto.Mensaje,
      dto.NombreDestinatario,
    );
  }
}
