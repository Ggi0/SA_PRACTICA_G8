import { Module } from '@nestjs/common';

import { MoviesAdmController } from './moviesAdm.controller';
import { MoviesAdmRepository } from './moviesAdm.repository';
import { MoviesAdmService } from './moviesAdm.service';

@Module({
  controllers: [
    MoviesAdmController,
  ],
  providers: [
    MoviesAdmRepository,
    MoviesAdmService,
  ],
})
export class MoviesAdmModule {}