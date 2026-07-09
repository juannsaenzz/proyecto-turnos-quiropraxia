import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { TurnosService } from './turnos.service';
import { Turno } from './interfaces/turno.interface';

@Controller('turnos')
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @Get()
  async findAll(): Promise<Turno[]> {
    return this.turnosService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Turno> {
    return this.turnosService.findOne(id);
  }

  @Post()
  async create(@Body() data: Omit<Turno, 'id'>): Promise<Turno> {
    return this.turnosService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Omit<Turno, 'id'>>,
  ): Promise<Turno> {
    return this.turnosService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    return this.turnosService.remove(id);
  }
}
