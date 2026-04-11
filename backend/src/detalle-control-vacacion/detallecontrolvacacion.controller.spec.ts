import { Test, TestingModule } from '@nestjs/testing';
import { DetallecontrolvacacionController } from './detalle-control-vacacion.controller';
import { DetallecontrolvacacionService } from './detalle-control-vacacion.service';

describe('DetallecontrolvacacionController', () => {
  let controller: DetallecontrolvacacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DetallecontrolvacacionController],
      providers: [DetallecontrolvacacionService],
    }).compile();

    controller = module.get<DetallecontrolvacacionController>(DetallecontrolvacacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
