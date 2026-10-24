import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ControlVacacionController } from './control-vacacion.controller';
import { ControlVacacionService } from './control-vacacion.service';

describe('ControlVacacionController', () => {
  let controller: ControlVacacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControlVacacionController],
      providers: [
        { provide: ControlVacacionService, useValue: {} },
        // El AuthGuard del controlador necesita JwtService
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ControlVacacionController>(ControlVacacionController);
  });

  it('se crea con su servicio inyectado', () => {
    expect(controller).toBeDefined();
  });
});
