import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfiguracionDiaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.configuracionDia.findMany();
  }

  async findByFecha(fecha: string) {
    return this.prisma.configuracionDia.findUnique({
      where: { fecha },
    });
  }

  async upsert(fecha: string, ciudad: string, bloque: string) {
    return this.prisma.configuracionDia.upsert({
      where: { fecha },
      update: {
        ciudad,
        bloque,
      },
      create: {
        fecha,
        ciudad,
        bloque,
      },
    });
  }
}
