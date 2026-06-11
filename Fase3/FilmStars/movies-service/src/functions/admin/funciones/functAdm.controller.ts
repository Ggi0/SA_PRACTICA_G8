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
  FUNCTIONS_ADMIN_SERVICE,
} from '../../../common/tokens';

@Controller('api/admin/funciones')
export class FunctAdmController {
  constructor(
    @Inject(FUNCTIONS_ADMIN_SERVICE)
    private readonly service: any,
  ) {}

  @Get('peliculas/list')
  getMoviesCatalog() {
    return this.service.getMoviesCatalog();
  }

  @Get('salas/list')
  getRoomsCatalog() {
    return this.service.getRoomsCatalog();
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('pelicula/:peliculaId')
  findByMovie(
    @Param('peliculaId') peliculaId: string,
  ) {
    return this.service.findByMovie(peliculaId);
  }

  @Get('sala/:salaId')
  findByRoom(
    @Param('salaId') salaId: string,
  ) {
    return this.service.findByRoom(salaId);
  }

  @Get('fecha/:fecha')
  findByDate(
    @Param('fecha') fecha: string,
  ) {
    return this.service.findByDate(fecha);
  }

  @Post()
  create(@Body() body: any) {
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
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}