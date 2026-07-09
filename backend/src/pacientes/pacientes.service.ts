import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Paciente } from './interfaces/paciente.interface';

@Injectable()
export class PacientesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Paciente[]> {
    return this.prisma.paciente.findMany();
  }

  async findOne(id: number): Promise<Paciente> {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id },
    });
    if (!paciente) {
      throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
    }
    return paciente;
  }

  async create(data: any): Promise<Paciente> {
    const dni = data.dni && data.dni.trim() !== '' ? data.dni.trim() : null;
    const email = data.email && data.email.trim() !== '' ? data.email.trim() : null;
    const telefono = data.telefono && data.telefono.trim() !== '' ? data.telefono.trim() : null;
    const fechaNacimiento = data.fechaNacimiento && data.fechaNacimiento.trim() !== '' ? data.fechaNacimiento.trim() : null;

    // Validar DNI único si está presente
    if (dni) {
      const dniExistente = await this.prisma.paciente.findUnique({
        where: { dni },
      });
      if (dniExistente) {
        throw new BadRequestException(`El DNI ${dni} ya está registrado`);
      }
    }

    // Validar email único si está presente
    if (email) {
      const emailExistente = await this.prisma.paciente.findUnique({
        where: { email },
      });
      if (emailExistente) {
        throw new BadRequestException(`El email ${email} ya está registrado`);
      }
    }

    return this.prisma.paciente.create({
      data: {
        nombre: data.nombre,
        dni,
        email,
        telefono,
        fechaNacimiento,
      },
    });
  }

  async update(id: number, data: Partial<Paciente>): Promise<Paciente> {
    const paciente = await this.findOne(id);
    
    const updateData: any = {};
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    
    if (data.dni !== undefined) {
      const dni = data.dni && data.dni.trim() !== '' ? data.dni.trim() : null;
      if (dni && dni !== paciente.dni) {
        const dniExistente = await this.prisma.paciente.findUnique({
          where: { dni },
        });
        if (dniExistente) {
          throw new BadRequestException(`El DNI ${dni} ya está registrado`);
        }
      }
      updateData.dni = dni;
    }
    
    if (data.email !== undefined) {
      const email = data.email && data.email.trim() !== '' ? data.email.trim() : null;
      if (email && email !== paciente.email) {
        const emailExistente = await this.prisma.paciente.findUnique({
          where: { email },
        });
        if (emailExistente) {
          throw new BadRequestException(`El email ${email} ya está registrado`);
        }
      }
      updateData.email = email;
    }

    if (data.telefono !== undefined) {
      updateData.telefono = data.telefono && data.telefono.trim() !== '' ? data.telefono.trim() : null;
    }
    if (data.fechaNacimiento !== undefined) {
      updateData.fechaNacimiento = data.fechaNacimiento && data.fechaNacimiento.trim() !== '' ? data.fechaNacimiento.trim() : null;
    }

    return this.prisma.paciente.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number): Promise<{ success: boolean }> {
    await this.findOne(id);
    await this.prisma.paciente.delete({
      where: { id },
    });
    return { success: true };
  }
}
