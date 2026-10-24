import { LIMITE_MAXIMO, LIMITE_POR_DEFECTO, leerPaginacion } from './paginacion';

// Regresión de D-19: listados sin paginación
describe('leerPaginacion', () => {
  it('sin página no pagina, para no romper las pantallas que esperan el arreglo completo', () => {
    expect(leerPaginacion()).toBeUndefined();
    expect(leerPaginacion('')).toBeUndefined();
  });

  it('calcula el desplazamiento a partir de la página y el límite', () => {
    expect(leerPaginacion('3', '20')).toEqual({ page: 3, limit: 20, skip: 40 });
  });

  it('usa el límite por defecto si no se envía o no es válido', () => {
    expect(leerPaginacion('1')?.limit).toBe(LIMITE_POR_DEFECTO);
    expect(leerPaginacion('1', 'abc')?.limit).toBe(LIMITE_POR_DEFECTO);
  });

  it('nunca entrega más del límite máximo por página', () => {
    expect(leerPaginacion('1', '999')?.limit).toBe(LIMITE_MAXIMO);
  });

  it('corrige páginas y límites menores a uno', () => {
    expect(leerPaginacion('-2', '-5')).toEqual({ page: 1, limit: 1, skip: 0 });
  });
});
