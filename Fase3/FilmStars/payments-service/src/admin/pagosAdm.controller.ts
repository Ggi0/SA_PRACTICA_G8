import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';

import { PagosAdmService } from './pagosAdm.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class PagosAdmController {
  constructor(
    private readonly service: PagosAdmService,
  ) {}

  /**
   *  ESCANEAR QR
   *
   * body:
   * {
   *   "codigo": "BOL-xxxxx"
   * }
   */
  @Post('boletos/scan')
  async escanear(@Body('codigo') codigo: string) {
    return this.service.escanearBoleto(codigo);
  }

  /**
   *  CONTINGENCIA (buscar manual)
   */
  @Get('boletos/codigo/:codigo')
  async buscar(@Param('codigo') codigo: string) {
    return this.service.buscarBoleto(codigo);
  }

  /**
   *  FORZAR VALIDACIÓN
   */
  @Post('boletos/:id/forzar')
  async forzar(@Param('id') id: string) {
    return this.service.forzarUso(id);
  }

  /**
   *  LISTAR TODOS (ADMIN)
   *
   * ?estado=EMITIDO
   * ?fechaInicio=...
   */
  @Get('boletos')
  async listar(@Query() filtros: any) {
    return this.service.listar(filtros);
  }
}