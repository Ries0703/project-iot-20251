import { Test, TestingModule } from '@nestjs/testing';
import { ApiServiceController } from './api-service.controller';
import { ApiServiceService } from './api-service.service';

describe('ApiServiceController', () => {
  let apiServiceController: ApiServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ApiServiceController],
      providers: [ApiServiceService],
    }).compile();

    apiServiceController = app.get<ApiServiceController>(ApiServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(apiServiceController.getHello()).toBe('Hello World!');
    });
  });
});
