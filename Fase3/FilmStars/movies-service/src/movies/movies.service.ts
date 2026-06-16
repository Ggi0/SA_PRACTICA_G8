import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { MOVIES_REPOSITORY } from '../common/tokens';
import { IMoviesRepository } from './movies.repository';
import { MovieCategory, MovieFilters, MovieRecord, MovieType, PublicMovie, 
MoviePageFilters,
  PaginatedMoviesResult
 } from './movie.types';
import { IMoviePriceStrategy } from './price-strategy/movie-price.strategy';
import { EstrenoPriceStrategy } from './price-strategy/estreno.strategy';
import { PreventaPriceStrategy } from './price-strategy/preventa.strategy';
import { ReestrenoPriceStrategy } from './price-strategy/reestreno.strategy';

// ISP: interfaz de servicio solo con los métodos que los clientes necesitan
export interface IMoviesService {
  list(filters: MovieFilters): Promise<PublicMovie[]>;

  listPage(filters: MoviePageFilters): Promise<PaginatedMoviesResult>;

  getById(id: string): Promise<PublicMovie>;
  calculatePrice(tipo: MovieType, basePrice: number): number;
}

// OCP: el mapa de estrategias puede extenderse sin modificar MoviesService
const PRICE_STRATEGIES = new Map<string, IMoviePriceStrategy>([
  ['ESTRENO', new EstrenoPriceStrategy()],
  ['PREVENTA', new PreventaPriceStrategy()],
  ['REESTRENO', new ReestrenoPriceStrategy()],
]);

// DIP: MoviesService depende de IMoviesRepository (abstracción), no de la clase concreta
@Injectable()
export class MoviesService implements IMoviesService {
  constructor(@Inject(MOVIES_REPOSITORY) private readonly repo: IMoviesRepository) {}

  async list(filters: MovieFilters): Promise<PublicMovie[]> {
    const movies = await this.repo.findAll(filters);
    return movies.map(this.toPublicMovie.bind(this));
  }





  async listPage(filters: MoviePageFilters): Promise<PaginatedMoviesResult> {
    const result = await this.repo.findPage(filters);
    const data = result.items.map(this.toPublicMovie.bind(this));

    const totalPages =
      result.totalItems === 0
        ? 0
        : Math.ceil(result.totalItems / result.limit);

    return {
      data,
      pagination: {
        page: result.page,
        limit: result.limit,
        totalItems: result.totalItems,
        totalPages,
        hasNextPage: result.page < totalPages,
        hasPreviousPage: result.page > 1,
      },
    };
  }







  async getById(id: string): Promise<PublicMovie> {
    const movie = await this.repo.findById(id);
    if (!movie) throw new AppError(404, 'Película no encontrada', 'MOVIE_NOT_FOUND');
    return this.toPublicMovie(movie);
  }

  calculatePrice(tipo: MovieType, basePrice: number): number {
    const strategy = PRICE_STRATEGIES.get(tipo);
    return strategy ? strategy.calculate(basePrice) : basePrice;
  }

  private toPublicMovie(movie: MovieRecord): PublicMovie {
    return {
      id: movie.id,
      title: movie.titulo,
      synopsis: movie.sinopsis ?? '',
      posterUrl: movie.posterUrl ?? '',
      duration: movie.duracionMin,
      genre: movie.generos,
      rating: movie.clasificacion ?? 'NR',
      category: dbTypeToCategory(movie.tipo),
      releaseDate: movie.fechaEstreno ?? '',
    };
  }
}

function dbTypeToCategory(tipo: MovieType): MovieCategory {
  const map: Record<MovieType, MovieCategory> = {
    ESTRENO: 'ESTRENO',
    PREVENTA: 'PRE_VENTA',
    REESTRENO: 'RE_ESTRENO',
  };
  return map[tipo];
}
