import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { RolService } from './rol.service';

describe('RolService', () => {
  let service: RolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<RolService>(RolService);
  });

  it('se crea con PrismaService inyectado', () => {
    expect(service).toBeDefined();
  });
});
