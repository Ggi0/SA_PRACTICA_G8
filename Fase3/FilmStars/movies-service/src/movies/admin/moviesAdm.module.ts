import { Module } from '@nestjs/common';

import { MoviesAdmController } from './moviesAdm.controller';
import { MoviesAdmRepository } from './moviesAdm.repository';
import { MoviesAdmService } from './moviesAdm.service';

import { BulkController } from './bulk-ingest/bulk.controller';
import { BulkService } from './bulk-ingest/bulk.service';
import { BulkRepository } from './bulk-ingest/bulk.repository';
import { CsvParser } from './bulk-ingest/csv.parser';

@Module({
  controllers: [
    MoviesAdmController,
    BulkController,
  ],
  providers: [
    MoviesAdmRepository,
    MoviesAdmService,
    BulkRepository,
    BulkService,
    CsvParser,
  ],
})
export class MoviesAdmModule {}