import { Module } from '@nestjs/common';

import { CineAdmController } from './cineAdm.controller';
import { CineAdmService } from './cineAdm.service';
import { CineAdmRepository } from './cineAdm.repository';

@Module({
  controllers: [
    CineAdmController,
  ],
  providers: [
    CineAdmService,
    CineAdmRepository,
  ],
})
export class CineAdmModule {}