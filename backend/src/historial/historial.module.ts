import { Module } from '@nestjs/common';
import { HistorialService } from './historial.service';
import { HistorialController } from './historial.controller';
import { PacientesModule } from '../pacientes/pacientes.module';

@Module({
  imports: [PacientesModule],
  controllers: [HistorialController],
  providers: [HistorialService],
})
export class HistorialModule {}
