import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { CineAdmService } from './cineAdm.service';

@Controller('api/admin/cinemas')
export class CineAdmController {
  constructor(
    private readonly service: CineAdmService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('cities/list')
  getCities() {
    return this.service.getCities();
  }

  @Get('cities/:cityId/cinemas')
  getByCity(
    @Param('cityId') cityId: string,
  ) {
    return this.service.getCinemasByCity(cityId);
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

  @Delete(':id')
  delete(
    @Param('id') id: string,
  ) {
    return this.service.delete(id);
  }
}