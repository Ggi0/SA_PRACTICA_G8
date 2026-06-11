import { IMoviePriceStrategy } from './movie-price.strategy';

// LSP: ReeestrenoPriceStrategy puede sustituir a IMoviePriceStrategy sin alterar el programa
export class ReestrenoPriceStrategy implements IMoviePriceStrategy {
  readonly movieType = 'REESTRENO';

  // Los reestrenos tienen un 15% de descuento
  calculate(basePrice: number): number {
    return parseFloat((basePrice * 0.85).toFixed(2));
  }
}
