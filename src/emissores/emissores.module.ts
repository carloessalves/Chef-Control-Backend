import { Module } from '@nestjs/common';
import { EmissoresService } from './emissores.service.js';
import { EmissoresController } from './emissores.controller.js';

@Module({
  controllers: [EmissoresController],
  providers: [EmissoresService],
})
export class EmissoresModule {}
