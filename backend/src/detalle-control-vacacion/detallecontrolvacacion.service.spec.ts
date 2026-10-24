import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { DetalleControlVacacionService } from './detalle-control-vacacion.service';

describe('DetalleControlVacacionService', () => {
  let service: DetalleControlVacacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DetalleControlVacacionService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<DetalleControlVacacionService>(DetalleControlVacacionService);
  });

  it('se crea con PrismaService inyectado', () => {
    expect(service).toBeDefined();
  });
});
