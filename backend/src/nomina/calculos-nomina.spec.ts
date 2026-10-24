import { calcularIsrMensual, calcularPagoHorasExtra } from './calculos-nomina';

const SAT = {
  tasa1: 0.05,
  tasa2: 0.07,
  limiteTramo1: 300000,
  deduccionAnual: 48000,
};

describe('calcularIsrMensual', () => {
  it.each([
    [5000, 40.83],
    [10000, 281.65],
    [35000, 1580.09],
  ])('salario Q%d → ISR Q%d', (salario, esperado) => {
    expect(calcularIsrMensual(salario, salario * 0.0367, SAT)).toBeCloseTo(
      esperado,
      2,
    );
  });
  it('no cobra ISR si la renta imponible es cero o negativa', () => {
    expect(calcularIsrMensual(3000, 3000 * 0.0367, SAT)).toBe(0);
  });
  it('es continuo en el límite del tramo 1', () => {
    // salario cuya renta imponible es exactamente el límite: ambas ramas coinciden
    const igss = 0;
    const salario = (SAT.limiteTramo1 + SAT.deduccionAnual) / 12;
    expect(calcularIsrMensual(salario, igss, SAT)).toBeCloseTo(
      (SAT.limiteTramo1 * SAT.tasa1) / 12,
      6,
    );
  });
});

describe('calcularPagoHorasExtra', () => {
  it('Q6,000 con 10 h extra al 50 %: hora normal 25 → hora extra 37.5', () => {
    expect(calcularPagoHorasExtra(6000, 10, 0.5, 8)).toEqual({
      valorHoraExtra: 37.5,
      pagoHorasExtras: 375,
    });
  });
  it('sin horas o sin recargo no paga nada', () => {
    expect(calcularPagoHorasExtra(6000, 0, 0.5, 8)).toEqual({
      valorHoraExtra: 0,
      pagoHorasExtras: 0,
    });
    expect(calcularPagoHorasExtra(6000, 5, 0, 8)).toEqual({
      valorHoraExtra: 0,
      pagoHorasExtras: 0,
    });
  });
});
