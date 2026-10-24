import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { RolController } from './rol.controller';
import { RolService } from './rol.service';

describe('RolController', () => {
  let controller: RolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolController],
      providers: [
        { provide: RolService, useValue: {} },
        // El AuthGuard del controlador necesita JwtService
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    controller = module.get<RolController>(RolController);
  });

  it('se crea con su servicio inyectado', () => {
    expect(controller).toBeDefined();
  });
});
