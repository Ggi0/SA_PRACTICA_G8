import { Controller, Get, Inject, Param } from '@nestjs/common';
import { THEATERS_SERVICE } from '../common/tokens';
import { ITheatersService } from './theaters.service';

// SRP: este controlador solo maneja HTTP para el dominio de cines
@Controller('api/movies/cities')
export class TheatersController {
  constructor(@Inject(THEATERS_SERVICE) private readonly theaters: ITheatersService) {}

  @Get(':cityId/theaters')
  listByCity(@Param('cityId') cityId: string) {
    return this.theaters.listByCity(cityId);
  }
}
