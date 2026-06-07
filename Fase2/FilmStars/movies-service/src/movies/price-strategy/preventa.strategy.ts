import { IMoviePriceStrategy } from './movie-price.strategy';

// LSP: PreventaPriceStrategy puede sustituir a IMoviePriceStrategy sin alterar el programa
export class PreventaPriceStrategy implements IMoviePriceStrategy {
  readonly movieType = 'PREVENTA';

  // Las preventas tienen un 10% de recargo por acceso anticipado
  calculate(basePrice: number): number {
    return parseFloat((basePrice * 1.10).toFixed(2));
  }
}
