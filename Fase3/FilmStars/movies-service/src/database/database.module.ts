import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { env } from '../config/env';
import { PG_POOL } from '../common/tokens';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () =>
        new Pool({
          host: env.db.host,
          port: env.db.port,
          database: env.db.database,
          user: env.db.user,
          password: env.db.password,
          max: 10,
        }),
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
