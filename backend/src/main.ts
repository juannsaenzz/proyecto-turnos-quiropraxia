import './env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ForbiddenException } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  // Habilitar Helmet para cabeceras de seguridad
  app.use(helmet());

  // Habilitar CORS restrictivo
  const allowedOrigins = [
    'https://centroquiropracticonicolas.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new ForbiddenException('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Servidor de quiropraxia corriendo en el puerto: ${port}`);
}
bootstrap();
