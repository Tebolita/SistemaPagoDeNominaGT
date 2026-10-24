import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DetalleControlVacacionController } from './detalle-control-vacacion.controller';
import { DetalleControlVacacionService } from './detalle-control-vacacion.service';

describe('DetalleControlVacacionController', () => {
  let controller: DetalleControlVacacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DetalleControlVacacionController],
      providers: [
        { provide: DetalleControlVacacionService, useValue: {} },
        // El AuthGuard del controlador necesita JwtService
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    controller = module.get<DetalleControlVacacionController>(DetalleControlVacacionController);
  });

  it('se crea con su servicio inyectado', () => {
    expect(controller).toBeDefined();
  });
});
