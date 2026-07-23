import { Module } from '@nestjs/common';
import { PacientesModule } from './pacientes/pacientes.module';
import { TurnosModule } from './turnos/turnos.module';
import { HistorialModule } from './historial/historial.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfiguracionDiaModule } from './configuracion-dia/configuracion-dia.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    PrismaModule,
    PacientesModule,
    TurnosModule,
    HistorialModule,
    ConfiguracionDiaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
