import { Test, TestingModule } from '@nestjs/testing';
import { ControlvacacionService } from './control-vacacion.service';

describe('ControlvacacionService', () => {
  let service: ControlvacacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ControlvacacionService],
    }).compile();

    service = module.get<ControlvacacionService>(ControlvacacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
