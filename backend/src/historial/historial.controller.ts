import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { HistorialService } from './historial.service';
import { Historial } from './interfaces/historial.interface';

@Controller('historial')
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Get()
  async findByPacienteId(@Query('pacienteId') pacienteIdStr?: string): Promise<any[]> {
    if (!pacienteIdStr) {
      return this.historialService.findAll();
    }
    const pacienteId = parseInt(pacienteIdStr, 10);
    if (isNaN(pacienteId)) {
      throw new BadRequestException("El parámetro 'pacienteId' debe ser un número válido");
    }
    return this.historialService.findByPacienteId(pacienteId);
  }

  @Post()
  async create(@Body() data: Omit<Historial, 'id'>): Promise<Historial> {
    if (!data.pacienteId || !data.fecha || !data.notas) {
      throw new BadRequestException("Los campos 'pacienteId', 'fecha' y 'notas' son obligatorios");
    }
    return this.historialService.create(data);
  }
}
