import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Historial } from './interfaces/historial.interface';
import { PacientesService } from '../pacientes/pacientes.service';

@Injectable()
export class HistorialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pacientesService: PacientesService,
  ) {}

  private mapHistorial(h: any): any {
    return {
      id: h.id,
      pacienteId: h.pacienteId,
      pacienteNombre: h.paciente?.nombre || 'Paciente Desconocido',
      fecha: h.fecha.toISOString().split('T')[0],
      notas: h.notas,
    };
  }

  async findAll(): Promise<any[]> {
    const registros = await this.prisma.historialClinico.findMany({
      orderBy: { fecha: 'desc' },
      include: { paciente: true },
    });
    return registros.map(h => this.mapHistorial(h));
  }

  async findByPacienteId(pacienteId: number): Promise<any[]> {
    // Validar primero que el paciente exista
    await this.pacientesService.findOne(pacienteId);

    // Retornar los registros filtrados, ordenados por fecha descendente
    const registros = await this.prisma.historialClinico.findMany({
      where: { pacienteId },
      orderBy: { fecha: 'desc' },
      include: { paciente: true },
    });

    return registros.map(h => this.mapHistorial(h));
  }

  async create(data: Omit<Historial, 'id'>): Promise<any> {
    // Validar que el paciente existe
    await this.pacientesService.findOne(data.pacienteId);

    const targetDate = new Date(data.fecha);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const existing = await this.prisma.historialClinico.findFirst({
      where: {
        pacienteId: data.pacienteId,
        fecha: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    let guardado;
    if (existing) {
      guardado = await this.prisma.historialClinico.update({
        where: { id: existing.id },
        data: { notas: data.notas }
      });
    } else {
      guardado = await this.prisma.historialClinico.create({
        data: {
          pacienteId: data.pacienteId,
          fecha: new Date(data.fecha),
          notas: data.notas,
        },
      });
    }

    const finalItem = await this.prisma.historialClinico.findUnique({
      where: { id: guardado.id },
      include: { paciente: true }
    });

    return this.mapHistorial(finalItem);
  }
}
