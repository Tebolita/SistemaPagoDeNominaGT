import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { AsistenciaService } from './asistencia.service';

describe('AsistenciaService', () => {
  let service: AsistenciaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AsistenciaService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<AsistenciaService>(AsistenciaService);
  });

  it('se crea con PrismaService inyectado', () => {
    expect(service).toBeDefined();
  });
});
