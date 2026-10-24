import { esContrasenaSegura } from './politica-contrasena';

describe('Política de contraseñas', () => {
  it.each(['Abcdef1!', 'Correcta.1', 'Nómina#2026x'])('acepta %s', (c) => {
    expect(esContrasenaSegura(c)).toBe(true);
  });
  it.each([
    'Co1!',
    'sinmayuscula1!',
    'SINMINUSCULA1!',
    'SinNumero!!',
    'SinSimbolo12',
    '',
    undefined,
    123456789,
  ])('rechaza %s', (c) => expect(esContrasenaSegura(c)).toBe(false));
  it('rechaza más de 72 caracteres (límite de bcrypt)', () => {
    expect(esContrasenaSegura('Aa1!' + 'x'.repeat(70))).toBe(false);
  });
});
