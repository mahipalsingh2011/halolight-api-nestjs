import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './infrastructure/prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  // Mock PrismaService
  const mockPrismaService = {
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return HTML home page', () => {
      const result = appController.getHomePage();
      expect(result).toContain('HaloLight API');
      expect(result).toContain('<!DOCTYPE html>');
    });
  });

  describe('health', () => {
    it('should return API status object', () => {
      const result = appController.getHello();
      expect(result).toHaveProperty('name', 'HaloLight API');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
