import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { EmpleadoController } from './empleado.controller';
import { EmpleadoService } from './empleado.service';

describe('EmpleadoController', () => {
  let controller: EmpleadoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmpleadoController],
      providers: [
        { provide: EmpleadoService, useValue: {} },
        // El AuthGuard del controlador necesita JwtService
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    controller = module.get<EmpleadoController>(EmpleadoController);
  });

  it('se crea con su servicio inyectado', () => {
    expect(controller).toBeDefined();
  });
});
