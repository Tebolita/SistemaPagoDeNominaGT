import { ROLES_NOMINA, ROLES_SEGURIDAD, ROLES_VENTAS_FINANZAS, tieneRol } from './roles-acceso';

describe('roles-acceso', () => {
  it('compara los roles sin distinguir mayúsculas ni espacios/guiones bajos', () => {
    expect(tieneRol('recursos humanos', ['RECURSOS HUMANOS'])).toBe(true);
    expect(tieneRol('Recursos_Humanos', ['RECURSOS HUMANOS'])).toBe(true);
  });

  it('solo el administrador accede a Seguridad', () => {
    expect(tieneRol('ADMIN', ROLES_SEGURIDAD)).toBe(true);
    expect(tieneRol('GERENTE', ROLES_SEGURIDAD)).toBe(false);
    expect(tieneRol('RRHH', ROLES_SEGURIDAD)).toBe(false);
  });

  it('RRHH accede a Nómina pero no a Ventas ni Finanzas', () => {
    expect(tieneRol('RRHH', ROLES_NOMINA)).toBe(true);
    expect(tieneRol('RRHH', ROLES_VENTAS_FINANZAS)).toBe(false);
  });

  it('un rol vacío no tiene acceso a nada', () => {
    expect(tieneRol('', ROLES_NOMINA)).toBe(false);
  });
});
