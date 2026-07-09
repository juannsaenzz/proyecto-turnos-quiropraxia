import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { Paciente } from './interfaces/paciente.interface';
import { CreatePacienteDto } from './dto/create-paciente.dto';

@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get()
  async findAll(): Promise<Paciente[]> {
    return this.pacientesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Paciente> {
    return this.pacientesService.findOne(id);
  }

  @Post()
  async create(@Body() data: CreatePacienteDto): Promise<Paciente> {
    return this.pacientesService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<CreatePacienteDto>,
  ): Promise<Paciente> {
    return this.pacientesService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    return this.pacientesService.remove(id);
  }
}
