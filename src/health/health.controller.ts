import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(@Res() res: Response) {
    const dbHealthy = await this.prisma.isHealthy();

    return res.status(dbHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status: dbHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'up' : 'down',
    });
  }
}
