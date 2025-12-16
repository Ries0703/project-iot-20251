import { Controller, Get } from '@nestjs/common';
import { ApiServiceService } from './api-service.service';

@Controller()
export class ApiServiceController {
  constructor(private readonly apiServiceService: ApiServiceService) {}

  @Get()
  getHello(): string {
    return this.apiServiceService.getHello();
  }
}
