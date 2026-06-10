// OCP: interfaz abierta para extensión, cerrada para modificación
// Para agregar un nuevo tipo de precio, solo se implementa esta interfaz
// sin modificar el código existente
export interface IMoviePriceStrategy {
  calculate(basePrice: number): number;
  readonly movieType: string;
}
