import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * Pipes de validación global
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  /**
   * Verificación de conexión a base de datos
   */
  const dataSource = app.get(DataSource);

  try {
    if (dataSource.isInitialized) {
      console.log('Conexión a PostgreSQL establecida correctamente');
      console.log(`Base de datos: ${dataSource.options.database}`);
      console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      console.log(dataSource.options);
    } else {
      console.error('DataSource NO inicializado');
    }
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }

  /**
   * Puerto del servidor
   */
  const port = parseInt(process.env.PORT ?? '3003', 10);
  await app.listen(port);

  console.log(`Reservas Service corriendo en puerto ${port}`);
}

bootstrap();