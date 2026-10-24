// Sin clave, los tokens se firmarían con un valor predecible: se detiene el arranque
if (!process.env.SECRET_KEY) {
  throw new Error('Falta la variable de entorno SECRET_KEY para firmar los tokens JWT');
}

export const jwtConstants = {
  secret: process.env.SECRET_KEY,
};
