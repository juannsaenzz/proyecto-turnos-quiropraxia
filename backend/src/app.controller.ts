import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller('health')
export class AppController {
  @Public()
  @Get()
  checkHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
