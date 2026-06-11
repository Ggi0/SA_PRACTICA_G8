import { Module } from '@nestjs/common';

import {
  FUNCTIONS_ADMIN_REPOSITORY,
  FUNCTIONS_ADMIN_SERVICE,
} from '../../../common/tokens';

import { DatabaseModule } from '../../../database/database.module';

import { FunctAdmController } from './functAdm.controller';
import { FunctAdmRepository } from './functAdm.repository';
import { FunctAdmService } from './functAdm.service';

@Module({
  imports: [DatabaseModule],

  controllers: [FunctAdmController],

  providers: [
    {
      provide: FUNCTIONS_ADMIN_REPOSITORY,
      useClass: FunctAdmRepository,
    },
    {
      provide: FUNCTIONS_ADMIN_SERVICE,
      useClass: FunctAdmService,
    },
  ],
})
export class FunctAdmModule {}