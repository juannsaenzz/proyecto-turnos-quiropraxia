import { Module } from '@nestjs/common';
import { ConfiguracionDiaService } from './configuracion-dia.service';
import { ConfiguracionDiaController } from './configuracion-dia.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConfiguracionDiaController],
  providers: [ConfiguracionDiaService],
  exports: [ConfiguracionDiaService],
})
export class ConfiguracionDiaModule {}
