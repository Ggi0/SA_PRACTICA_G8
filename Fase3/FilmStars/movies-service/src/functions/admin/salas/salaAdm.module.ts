import { Module } from '@nestjs/common';

import {
  SALAS_ADMIN_REPOSITORY,
  SALAS_ADMIN_SERVICE,
} from '../../../common/tokens';

import { DatabaseModule } from '../../../database/database.module';

import { SalaAdmController } from './salaAdm.controller';
import { SalaAdmRepository } from './salaAdm.repository';
import { SalaAdmService } from './salaAdm.service';

@Module({
  imports: [DatabaseModule],

  controllers: [SalaAdmController],

  providers: [
    {
      provide: SALAS_ADMIN_REPOSITORY,
      useClass: SalaAdmRepository,
    },
    {
      provide: SALAS_ADMIN_SERVICE,
      useClass: SalaAdmService,
    },
  ],
})
export class SalaAdmModule {}