// Debe ir primero: los módulos leen process.env al importarse (p. ej. la clave JWT)
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const produccion = process.env.NODE_ENV === 'production';
  // Detrás de nginx: la IP real viene en X-Forwarded-For (necesario para el rate limiting)
  app.set('trust proxy', 1);
  // Cabeceras de seguridad HTTP (HSTS, nosniff, X-Frame-Options, etc.)
  app.use(
    helmet({
      contentSecurityPolicy: produccion ? undefined : false,
      // localhost:4200 → localhost:4000 es el mismo "site": deja cargar recursos (fotos, PDF) en desarrollo
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  // La documentación Swagger solo se publica fuera de producción
  if (!produccion || process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Documentacion de la api')
      .setDescription('The API description')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('access_token')
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);
  }
  // Solo el frontend puede consumir la API desde el navegador.
  // CORS_ORIGIN admite varios orígenes separados por coma.
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:4200')
      .split(',')
      .map((o) => o.trim()),
    // Necesario para que el navegador envíe la cookie de sesión desde el frontend
    credentials: true,
  });
  app.enableShutdownHooks();
  const puerto = process.env.PORT ?? 4000;
  await app.listen(puerto);
  new Logger('Bootstrap').log(`API escuchando en el puerto ${puerto}`);
}
bootstrap();
