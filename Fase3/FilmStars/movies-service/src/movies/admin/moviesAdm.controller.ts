import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { MoviesAdmService } from './moviesAdm.service';

@Controller('adm/movies')
export class MoviesAdmController {
  constructor(
    private readonly service: MoviesAdmService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(
    @Param('id') id: string,
  ) {
    return this.service.findById(id);
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

  @Get('genres/list')
    getGenres() {
    return this.service.getGenres();
    }

  @Delete(':id')
  delete(
    @Param('id') id: string,
  ) {
    return this.service.delete(id);
  }
}