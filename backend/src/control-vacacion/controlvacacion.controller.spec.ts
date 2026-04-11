import { Test, TestingModule } from '@nestjs/testing';
import { ControlvacacionController } from './control-vacacion.controller';
import { ControlvacacionService } from './control-vacacion.service';

describe('ControlvacacionController', () => {
  let controller: ControlvacacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControlvacacionController],
      providers: [ControlvacacionService],
    }).compile();

    controller = module.get<ControlvacacionController>(ControlvacacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
