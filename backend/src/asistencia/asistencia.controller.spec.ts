import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AsistenciaController } from './asistencia.controller';
import { AsistenciaService } from './asistencia.service';

describe('AsistenciaController', () => {
  let controller: AsistenciaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsistenciaController],
      providers: [
        { provide: AsistenciaService, useValue: {} },
        // El AuthGuard del controlador necesita JwtService
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    controller = module.get<AsistenciaController>(AsistenciaController);
  });

  it('se crea con su servicio inyectado', () => {
    expect(controller).toBeDefined();
  });
});
