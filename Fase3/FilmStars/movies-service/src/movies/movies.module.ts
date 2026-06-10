import { Module } from '@nestjs/common';
import { MOVIES_REPOSITORY, MOVIES_SERVICE } from '../common/tokens';
import { MoviesRepository } from './movies.repository';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';

@Module({
  controllers: [MoviesController],
  providers: [
    { provide: MOVIES_REPOSITORY, useClass: MoviesRepository },
    { provide: MOVIES_SERVICE, useClass: MoviesService },
  ],
  exports: [MOVIES_SERVICE],
})
export class MoviesModule {}
