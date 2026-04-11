import { Test, TestingModule } from '@nestjs/testing';
import { IncidenciaController } from './incidencia.controller';
import { IncidenciaService } from './incidencia.service';

describe('IncidenciaController', () => {
  let controller: IncidenciaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidenciaController],
      providers: [IncidenciaService],
    }).compile();

    controller = module.get<IncidenciaController>(IncidenciaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
