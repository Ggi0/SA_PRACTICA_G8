import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { FUNCTIONS_SERVICE } from '../common/tokens';
import { IFunctionsService } from './functions.service';

// SRP: este controlador solo maneja HTTP para el dominio de funciones
@Controller('api/movies')
export class FunctionsController {
  constructor(@Inject(FUNCTIONS_SERVICE) private readonly functions: IFunctionsService) {}

  // GET /api/movies/functions/:id — debe declararse antes de /:movieId/functions
  @Get('functions/:id')
  getById(@Param('id') id: string) {
    return this.functions.getById(id);
  }

  // GET /api/movies/:movieId/functions?cityId=...
  @Get(':movieId/functions')
  listByMovie(
    @Param('movieId') movieId: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.functions.listByMovie(movieId, cityId);
  }
}
