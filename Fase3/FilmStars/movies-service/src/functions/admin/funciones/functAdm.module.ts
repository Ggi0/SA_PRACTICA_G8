import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import {
  FUNCTIONS_ADMIN_REPOSITORY,
  FUNCTIONS_ADMIN_SERVICE,
} from '../../../common/tokens';

import { DatabaseModule } from '../../../database/database.module';

import { FunctAdmController } from './functAdm.controller';
import { FunctAdmRepository } from './functAdm.repository';
import { FunctAdmService } from './functAdm.service';


import { ReservasSyncService } from './reservas-sync.service';


@Module({
  imports: [DatabaseModule, HttpModule],

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
    ReservasSyncService,
  ],
})
export class FunctAdmModule {}