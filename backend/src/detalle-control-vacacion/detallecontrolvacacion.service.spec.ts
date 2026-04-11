import { Test, TestingModule } from '@nestjs/testing';
import { DetallecontrolvacacionService } from './detalle-control-vacacion.service';

describe('DetallecontrolvacacionService', () => {
  let service: DetallecontrolvacacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DetallecontrolvacacionService],
    }).compile();

    service = module.get<DetallecontrolvacacionService>(DetallecontrolvacacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
