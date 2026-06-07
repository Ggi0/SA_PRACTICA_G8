import { Module } from '@nestjs/common';
import { CITIES_REPOSITORY, CITIES_SERVICE } from '../common/tokens';
import { CitiesRepository } from './cities.repository';
import { CitiesService } from './cities.service';
import { CitiesController } from './cities.controller';

@Module({
  controllers: [CitiesController],
  providers: [
    { provide: CITIES_REPOSITORY, useClass: CitiesRepository },
    { provide: CITIES_SERVICE, useClass: CitiesService },
  ],
  exports: [CITIES_SERVICE],
})
export class CitiesModule {}
