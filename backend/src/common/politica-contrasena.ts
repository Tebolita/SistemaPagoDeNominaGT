/** Política de contraseñas (ISO 25010 – Seguridad): 8-72 caracteres con mayúscula, minúscula, número y símbolo. */
export const REGEX_CONTRASENA_SEGURA =
  /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
export const MENSAJE_CONTRASENA =
  'La contraseña debe tener entre 8 y 72 caracteres e incluir mayúscula, minúscula, número y símbolo';

export function esContrasenaSegura(valor: unknown): boolean {
  return (
    typeof valor === 'string' &&
    valor.length >= 8 &&
    valor.length <= 72 &&
    REGEX_CONTRASENA_SEGURA.test(valor)
  );
}
