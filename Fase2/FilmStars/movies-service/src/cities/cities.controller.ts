import { Controller, Get, Inject, Param } from '@nestjs/common';
import { CITIES_SERVICE } from '../common/tokens';
import { ICitiesService } from './cities.service';

// SRP: este controlador solo maneja HTTP para el dominio de ciudades
@Controller('api/movies/cities')
export class CitiesController {
  constructor(@Inject(CITIES_SERVICE) private readonly cities: ICitiesService) {}

  @Get()
  list() {
    return this.cities.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.cities.getById(id);
  }
}
