import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Turno } from './interfaces/turno.interface';
import { PacientesService } from '../pacientes/pacientes.service';
import { EstadoTurno } from '@prisma/client';

@Injectable()
export class TurnosService {
  private ciudadesPermitidas = ['Rosario del Tala', 'Maciá', 'Gualeguay', 'Galarza'];
  private estadosValidos = ['PENDIENTE', 'CONFIRMADO', 'ATENDIDO', 'AUSENTE'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly pacientesService: PacientesService,
  ) {}

  private mapTurno(t: any): any {
    return {
      id: t.id,
      pacienteId: t.pacienteId,
      pacienteNombre: t.paciente?.nombre || 'Paciente Desconocido',
      fechaHora: t.fechaHora.toISOString(),
      ciudad: t.ciudad,
      notas: t.notes || t.notas || '',
      estado: t.estado as 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE',
      updatedAt: t.updatedAt ? t.updatedAt.toISOString() : undefined,
      updatedBy: t.updatedBy,
    };
  }

  async findAll(): Promise<any[]> {
    const turnos = await this.prisma.turno.findMany({
      include: { paciente: true }
    });
    return turnos.map(t => this.mapTurno(t));
  }

  async findOne(id: number): Promise<any> {
    const turno = await this.prisma.turno.findUnique({
      where: { id },
      include: { paciente: true }
    });
    if (!turno) {
      throw new NotFoundException(`Turno con ID ${id} no encontrado`);
    }
    return this.mapTurno(turno);
  }

  async create(data: Omit<Turno, 'id'>): Promise<any> {
    // Validar que el paciente existe
    await this.pacientesService.findOne(data.pacienteId);

    // Validar ciudad permitida
    if (!this.ciudadesPermitidas.includes(data.ciudad)) {
      throw new BadRequestException(
        `La ciudad '${data.ciudad}' no es válida. Ciudades permitidas: ${this.ciudadesPermitidas.join(', ')}`
      );
    }

    // Validar formato de estado
    if (data.estado && !this.estadosValidos.includes(data.estado)) {
      throw new BadRequestException(`El estado debe ser uno de: ${this.estadosValidos.join(', ')}`);
    }

    const creado = await this.prisma.turno.create({
      data: {
        pacienteId: data.pacienteId,
        fechaHora: new Date(data.fechaHora),
        ciudad: data.ciudad,
        notas: data.notas,
        estado: data.estado as EstadoTurno,
        updatedBy: data.updatedBy
      },
    });

    return this.findOne(creado.id);
  }

  async update(id: number, data: Partial<Omit<Turno, 'id'>>): Promise<any> {
    // Validar que el turno existe
    await this.findOne(id);

    if (data.pacienteId !== undefined) {
      await this.pacientesService.findOne(data.pacienteId);
    }

    if (data.ciudad !== undefined && !this.ciudadesPermitidas.includes(data.ciudad)) {
      throw new BadRequestException(
        `La ciudad '${data.ciudad}' no es válida. Ciudades permitidas: ${this.ciudadesPermitidas.join(', ')}`
      );
    }

    if (data.estado !== undefined && !this.estadosValidos.includes(data.estado)) {
      throw new BadRequestException(`El estado debe ser uno de: ${this.estadosValidos.join(', ')}`);
    }

    const updateData: any = {};
    if (data.pacienteId !== undefined) updateData.pacienteId = data.pacienteId;
    if (data.fechaHora !== undefined) updateData.fechaHora = new Date(data.fechaHora);
    if (data.ciudad !== undefined) updateData.ciudad = data.ciudad;
    if (data.notas !== undefined) updateData.notas = data.notas;
    if (data.estado !== undefined) updateData.estado = data.estado as EstadoTurno;
    if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;

    const actualizado = await this.prisma.turno.update({
      where: { id },
      data: updateData,
    });

    return this.findOne(actualizado.id);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    await this.findOne(id);
    await this.prisma.turno.delete({
      where: { id },
    });
    return { success: true };
  }
}
