import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import {
  SALAS_ADMIN_SERVICE,
} from '../../../common/tokens';

import { SalaAdmService } from './salaAdm.service';

@Controller('api/admin/salas')
export class SalaAdmController {
  constructor(
    @Inject(SALAS_ADMIN_SERVICE)
    private readonly service: SalaAdmService,
  ) {}

  @Get('cines/list')
  getCines() {
    return this.service.getCines();
  }

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Get('cine/:cineId')
  getByCinema(
    @Param('cineId') cineId: string,
  ) {
    return this.service.getByCinema(cineId);
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
  ) {
    return this.service.getById(id);
  }

  @Post()
  create(
    @Body() body: any,
  ) {
    return this.service.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
  ) {
    return this.service.delete(id);
  }
}