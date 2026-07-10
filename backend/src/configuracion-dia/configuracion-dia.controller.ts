import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ConfiguracionDiaService } from './configuracion-dia.service';

@Controller('configuracion-dia')
export class ConfiguracionDiaController {
  constructor(private readonly configuracionDiaService: ConfiguracionDiaService) {}

  @Get()
  async findAll() {
    return this.configuracionDiaService.findAll();
  }

  @Get(':fecha')
  async findByFecha(@Param('fecha') fecha: string) {
    const config = await this.configuracionDiaService.findByFecha(fecha);
    if (!config) {
      return null;
    }
    return config;
  }

  @Post()
  async upsert(
    @Body() body: { fecha: string; ciudad: string; bloque: string },
  ) {
    return this.configuracionDiaService.upsert(body.fecha, body.ciudad, body.bloque);
  }
}
