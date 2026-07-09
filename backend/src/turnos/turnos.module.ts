import { Module } from '@nestjs/common';
import { TurnosService } from './turnos.service';
import { TurnosController } from './turnos.controller';
import { PacientesModule } from '../pacientes/pacientes.module';

@Module({
  imports: [PacientesModule],
  controllers: [TurnosController],
  providers: [TurnosService],
})
export class TurnosModule {}
