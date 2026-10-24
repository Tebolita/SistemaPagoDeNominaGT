import { guardarSesion, haySesion, limpiarSesion } from './sesion';

// JWT de prueba con payload {"sub":7,"exp":4102444800} (año 2100); la firma no importa aquí
const TOKEN = 'x.' + btoa(JSON.stringify({ sub: 7, exp: 4102444800 })) + '.y';

describe('sesion', () => {
  beforeEach(() => localStorage.clear());

  it('guarda los datos de la interfaz pero nunca el token', () => {
    guardarSesion({ access_token: TOKEN, username: 'ana', role: 'RRHH' });
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('username')).toBe('ana');
    expect(localStorage.getItem('user_role')).toBe('RRHH');
    expect(localStorage.getItem('id_usuario')).toBe('7');
    expect(localStorage.getItem('sesion_expira')).toBe(String(4102444800 * 1000));
  });

  it('borra un token heredado de versiones anteriores', () => {
    localStorage.setItem('access_token', 'viejo');
    guardarSesion({ access_token: TOKEN });
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('la sesión vence con el exp del JWT', () => {
    guardarSesion({ access_token: TOKEN });
    expect(haySesion()).toBe(true);
    expect(haySesion(4102444800 * 1000 + 1)).toBe(false);
  });

  it('sin datos o tras limpiar no hay sesión', () => {
    expect(haySesion()).toBe(false);
    guardarSesion({ access_token: TOKEN, username: 'ana' });
    limpiarSesion();
    expect(haySesion()).toBe(false);
    expect(localStorage.getItem('username')).toBeNull();
  });
});
