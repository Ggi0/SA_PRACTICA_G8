import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { CitiesModule } from './cities/cities.module';
import { TheatersModule } from './theaters/theaters.module';
import { MoviesModule } from './movies/movies.module';
import { FunctionsModule } from './functions/functions.module';
import { MoviesAdmModule } from './movies/admin/moviesAdm.module';
import { CineAdmModule } from './theaters/admin/cineAdm.module';
import { SalaAdmModule } from './functions/admin/salas/salaAdm.module';
import { FunctAdmModule } from './functions/admin/funciones/functAdm.module';

@Module({
  imports: [
    DatabaseModule,
    CitiesModule,
    TheatersModule,
    MoviesModule,
    FunctionsModule,
    MoviesAdmModule,
    CineAdmModule,
    SalaAdmModule,
    FunctAdmModule,
  ],
})
export class AppModule {}
