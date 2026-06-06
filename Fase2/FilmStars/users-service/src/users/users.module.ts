import { Module } from '@nestjs/common';
import { USER_REPOSITORY, USER_SERVICE } from '../common/tokens';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserRepository },
    { provide: USER_SERVICE, useClass: UserService },
  ],
  exports: [USER_REPOSITORY, USER_SERVICE],
})
export class UsersModule {}
