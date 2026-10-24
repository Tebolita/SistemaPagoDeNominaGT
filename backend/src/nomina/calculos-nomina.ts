/**
 * Cálculos puros de nómina (sin acceso a BD), extraídos de NominaService para poder probarlos
 * de forma aislada y mantener el servicio enfocado en orquestar (ISO 25010 – Mantenibilidad:
 * modularidad y capacidad de ser probado).
 */

export interface ParametrosISR {
  /** Tasa del tramo 1 como fracción (0.05 = 5 %). */
  tasa1: number;
  /** Tasa del tramo 2 como fracción. */
  tasa2: number;
  /** Límite anual de renta imponible del tramo 1. */
  limiteTramo1: number;
  /** Deducción anual sin comprobación (Q48,000). */
  deduccionAnual: number;
}

/**
 * ISR mensual de un asalariado (Decreto 10-2012, arts. 72 y 73).
 * Renta imponible anual = salario anual − deducción − cuotas IGSS del año (nunca negativa).
 * Tramo 1: tasa 1 hasta el límite; tramo 2: importe fijo del tramo 1 + tasa 2 sobre el excedente.
 * Bono 14, aguinaldo y bonificación incentivo son rentas exentas y no se incluyen.
 */
export function calcularIsrMensual(
  salarioMensual: number,
  descuentoIgssMensual: number,
  p: ParametrosISR,
): number {
  const rentaImponible = Math.max(
    0,
    salarioMensual * 12 - p.deduccionAnual - descuentoIgssMensual * 12,
  );
  const isrAnual =
    rentaImponible <= p.limiteTramo1
      ? rentaImponible * p.tasa1
      : p.limiteTramo1 * p.tasa1 + (rentaImponible - p.limiteTramo1) * p.tasa2;
  return isrAnual / 12;
}

/**
 * Horas extra (Guatemala): valor hora normal = salario ÷ 30 ÷ horas laborales por día;
 * valor hora extra = valor hora normal × (1 + recargo).
 */
export function calcularPagoHorasExtra(
  salarioMensual: number,
  horasExtra: number,
  recargo: number,
  horasLaboralesDia: number,
): { valorHoraExtra: number; pagoHorasExtras: number } {
  if (horasExtra <= 0 || recargo <= 0)
    return { valorHoraExtra: 0, pagoHorasExtras: 0 };
  const valorHoraNormal = salarioMensual / 30 / horasLaboralesDia;
  const valorHoraExtra = Number((valorHoraNormal * (1 + recargo)).toFixed(4));
  return {
    valorHoraExtra,
    pagoHorasExtras: Number((horasExtra * valorHoraExtra).toFixed(2)),
  };
}
