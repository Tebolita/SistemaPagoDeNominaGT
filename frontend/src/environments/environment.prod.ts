// Producción (ng build): el frontend se sirve detrás de nginx, que reenvía /api al backend
// (ver frontend/nginx.conf y docker-compose.yml)
export const environment = {
  production: true,
  apiUrl: '/api',
};
