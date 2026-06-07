import { Module } from '@nestjs/common';
import { THEATERS_REPOSITORY, THEATERS_SERVICE } from '../common/tokens';
import { TheatersRepository } from './theaters.repository';
import { TheatersService } from './theaters.service';
import { TheatersController } from './theaters.controller';

@Module({
  controllers: [TheatersController],
  providers: [
    { provide: THEATERS_REPOSITORY, useClass: TheatersRepository },
    { provide: THEATERS_SERVICE, useClass: TheatersService },
  ],
  exports: [THEATERS_SERVICE],
})
export class TheatersModule {}
