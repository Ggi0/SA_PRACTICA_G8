import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { env } from './config/env';
import { USER_REPOSITORY, USER_SERVICE } from './common/tokens';
import { IUserRepository } from './users/user.repository';
import { IUserService } from './users/user.service';

@Injectable()
export class AppBootstrap implements OnApplicationBootstrap {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(USER_SERVICE) private readonly userService: IUserService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.userRepository.initialize();
    await this.userService.bootstrapDefaultAdmin(
      env.defaultAdmin.nombre,
      env.defaultAdmin.email,
      env.defaultAdmin.password,
    );
  }
}
