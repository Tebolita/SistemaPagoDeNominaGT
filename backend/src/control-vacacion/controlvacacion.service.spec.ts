import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { ControlVacacionService } from './control-vacacion.service';

describe('ControlVacacionService', () => {
  let service: ControlVacacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ControlVacacionService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<ControlVacacionService>(ControlVacacionService);
  });

  it('se crea con PrismaService inyectado', () => {
    expect(service).toBeDefined();
  });
});
