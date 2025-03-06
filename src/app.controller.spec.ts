import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('healthCheck', () => {
    let realDateNow: () => number;

    beforeAll(() => {
      realDateNow = Date.now;
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
      Date.now = realDateNow;
    });

    it('should return correct health status structure', () => {
      const result = controller.healthCheck();

      expect(result).toEqual({
        status: expect.any(String),
        timestamp: expect.stringMatching(
          /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
        ),
      });
    });

    it('should return timestamp in ISO format', () => {
      const result = controller.healthCheck();

      expect(result.timestamp).toBe('2023-01-01T00:00:00.000Z');
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should maintain consistent status code', () => {
      const result = controller.healthCheck();
      expect(result.status).toBe('ok');
    });

    it('should handle time zone differences correctly', () => {
      jest.setSystemTime(new Date('2023-01-01T12:34:56.789Z'));
      const result = controller.healthCheck();
      expect(result.timestamp).toBe('2023-01-01T12:34:56.789Z');
    });
  });
});
