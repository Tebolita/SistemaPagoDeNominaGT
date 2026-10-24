import { UnauthorizedException } from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';
import { LoginService } from './login.service';

// Regresión de D-02: un usuario dado de baja podía iniciar sesión
describe('LoginService.SignIn', () => {
  let usuarios: any;
  let jwt: any;
  let auditoria: any;
  let service: LoginService;
  let usuarioBase: any;

  beforeAll(async () => {
    usuarioBase = {
      IdUsuario: 7,
      Username: 'ana',
      Contrasena: await bcryptjs.hash('Correcta.1', 4),
      Clave: await bcryptjs.hash('1234', 4),
      Activo: true,
      RolUsuario: { NombreRol: 'RRHH' },
    };
  });

  beforeEach(() => {
    usuarios = { findOne: jest.fn() };
    jwt = { signAsync: jest.fn().mockResolvedValue('token-firmado') };
    auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };
    service = new LoginService(usuarios, jwt, auditoria);
  });

  it('con credenciales correctas devuelve el token, el usuario y el rol', async () => {
    usuarios.findOne.mockResolvedValue(usuarioBase);

    const res = await service.SignIn('ana', 'Correcta.1', 1234);

    expect(res).toEqual({ access_token: 'token-firmado', username: 'ana', role: 'RRHH' });
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 7, username: 'ana', role: 'RRHH' });
  });

  it('rechaza a un usuario dado de baja aunque la contraseña sea correcta', async () => {
    usuarios.findOne.mockResolvedValue({ ...usuarioBase, Activo: false });

    await expect(service.SignIn('ana', 'Correcta.1', 1234)).rejects.toThrow(
      new UnauthorizedException('Tu usuario no es valido'),
    );
    expect(jwt.signAsync).not.toHaveBeenCalled();
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'LOGIN_FALLIDO', detalle: 'Usuario dado de baja' }),
    );
  });

  it('trata Activo nulo como activo (registros anteriores al campo)', async () => {
    usuarios.findOne.mockResolvedValue({ ...usuarioBase, Activo: null });

    await expect(service.SignIn('ana', 'Correcta.1', 1234)).resolves.toHaveProperty('access_token');
  });

  it('rechaza una contraseña incorrecta y lo registra en auditoría', async () => {
    usuarios.findOne.mockResolvedValue(usuarioBase);

    await expect(service.SignIn('ana', 'Incorrecta', 1234)).rejects.toThrow(
      'Contraseña o usuario incorrecto',
    );
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'LOGIN_FALLIDO', exitoso: false }),
    );
  });

  it('rechaza una clave incorrecta aunque la contraseña sea correcta', async () => {
    usuarios.findOne.mockResolvedValue(usuarioBase);

    await expect(service.SignIn('ana', 'Correcta.1', 9999)).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza un usuario inexistente', async () => {
    usuarios.findOne.mockResolvedValue(null);

    await expect(service.SignIn('nadie', 'x', 1)).rejects.toThrow('Tu usuario no es valido');
  });
});
