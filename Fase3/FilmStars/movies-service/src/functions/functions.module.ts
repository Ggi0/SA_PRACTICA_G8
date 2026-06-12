import { Module } from '@nestjs/common';
import { FUNCTIONS_REPOSITORY, FUNCTIONS_SERVICE } from '../common/tokens';
import { FunctionsRepository } from './functions.repository';
import { FunctionsService } from './functions.service';
import { FunctionsController } from './functions.controller';

@Module({
  controllers: [FunctionsController],
  providers: [
    { provide: FUNCTIONS_REPOSITORY, useClass: FunctionsRepository },
    { provide: FUNCTIONS_SERVICE, useClass: FunctionsService },
  ],
  exports: [FUNCTIONS_SERVICE],
})
export class FunctionsModule {}
