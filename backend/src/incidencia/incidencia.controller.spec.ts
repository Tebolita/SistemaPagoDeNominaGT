import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { IncidenciaController } from './incidencia.controller';
import { IncidenciaService } from './incidencia.service';

describe('IncidenciaController', () => {
  let controller: IncidenciaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidenciaController],
      providers: [
        { provide: IncidenciaService, useValue: {} },
        // El AuthGuard del controlador necesita JwtService
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    controller = module.get<IncidenciaController>(IncidenciaController);
  });

  it('se crea con su servicio inyectado', () => {
    expect(controller).toBeDefined();
  });
});
