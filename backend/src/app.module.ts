import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PacientesModule } from './pacientes/pacientes.module';
import { TurnosModule } from './turnos/turnos.module';
import { HistorialModule } from './historial/historial.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfiguracionDiaModule } from './configuracion-dia/configuracion-dia.module';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    PacientesModule,
    TurnosModule,
    HistorialModule,
    ConfiguracionDiaModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
