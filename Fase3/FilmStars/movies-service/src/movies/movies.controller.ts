import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { MOVIES_SERVICE } from '../common/tokens';
import { IMoviesService } from './movies.service';
import { MovieCategory } from './movie.types';

// SRP: este controlador solo maneja HTTP para el dominio de películas
// Los endpoints de funciones están en FunctionsController
@Controller('api/movies')
export class MoviesController {
  constructor(@Inject(MOVIES_SERVICE) private readonly movies: IMoviesService) {}

  // GET /api/movies?category=ESTRENO
  @Get()
  list(@Query('category') category?: string) {
    const validCategories: MovieCategory[] = ['ESTRENO', 'PRE_VENTA', 'RE_ESTRENO'];
    const cat = validCategories.includes(category as MovieCategory)
      ? (category as MovieCategory)
      : undefined;
    return this.movies.list({ category: cat });
  }



  /**
   * NUEVO-------> PAGINADO
   * GET /api/movies/pages?category=ESTRENO&page=1&limit=10
   * GET /api/movies/pages?cityId=uuid&page=1&limit=10
   * GET /api/movies/pages?category=ESTRENO&cityId=uuid&page=1&limit=10
   */
  @Get('pages')
  listPage(
    @Query('category') category?: string,
    @Query('cityId') cityId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const validCategories: MovieCategory[] = [
      'ESTRENO',
      'PRE_VENTA',
      'RE_ESTRENO',
    ];

    const cat = validCategories.includes(category as MovieCategory)
      ? (category as MovieCategory)
      : undefined;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    return this.movies.listPage({
      category: cat,
      cityId: cityId?.trim() || undefined,
      page:
        Number.isInteger(parsedPage) && parsedPage > 0
          ? parsedPage
          : 1,
      limit:
        Number.isInteger(parsedLimit) && parsedLimit > 0
          ? Math.min(parsedLimit, 10)
          : 10,
    });
  }







  // GET /api/movies/:id
  // IMPORTANTE: las rutas estáticas (cities, functions) se registran en sus propios
  // controladores con prefijos específicos y NestJS las resuelve por prioridad de ruta.
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.movies.getById(id);
  }
}
