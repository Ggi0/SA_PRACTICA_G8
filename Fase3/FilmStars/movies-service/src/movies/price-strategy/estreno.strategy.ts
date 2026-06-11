import { IMoviePriceStrategy } from './movie-price.strategy';

// LSP: EstrenoPriceStrategy puede sustituir a IMoviePriceStrategy sin alterar el programa
export class EstrenoPriceStrategy implements IMoviePriceStrategy {
  readonly movieType = 'ESTRENO';

  calculate(basePrice: number): number {
    return basePrice;
  }
}
