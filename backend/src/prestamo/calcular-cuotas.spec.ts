import { calcularCuotas } from './prestamo.service';

// ASV-13: la suma de las cuotas debe ser exactamente el monto del préstamo
describe('calcularCuotas', () => {
  it('Q1,000 en 3 cuotas: 333.33 + 333.33 + 333.34', () => {
    expect(calcularCuotas(1000, 3)).toEqual([333.33, 333.33, 333.34]);
  });

  it('Q3,000 en 6 cuotas: seis cuotas de Q500.00', () => {
    expect(calcularCuotas(3000, 6)).toEqual([500, 500, 500, 500, 500, 500]);
  });

  it.each([
    [1000, 3], [2500.5, 7], [999.99, 12], [100, 1], [12345.67, 24],
  ])('la suma de Q%d en %d cuotas es exacta', (monto, n) => {
    const cuotas = calcularCuotas(monto, n);
    const suma = cuotas.reduce((a, c) => a + Math.round(c * 100), 0) / 100;
    expect(cuotas).toHaveLength(n);
    expect(suma).toBe(monto);
  });
});
