import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppBootstrap } from './app.bootstrap';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule],
  providers: [AppBootstrap],
})
export class AppModule {}
