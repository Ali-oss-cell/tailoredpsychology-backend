import { Module } from "@nestjs/common";

import { UsersDelegatingRepository } from "./users.delegating-repository";
import { UsersPgRepository } from "./users.pg-repository";
import { UsersService } from "./users.service";
import { USERS_REPOSITORY } from "./users.repository";
import { UsersStubRepository } from "./users.stub-repository";

@Module({
  providers: [
    UsersService,
    UsersStubRepository,
    UsersPgRepository,
    UsersDelegatingRepository,
    {
      provide: USERS_REPOSITORY,
      useExisting: UsersDelegatingRepository,
    },
  ],
  exports: [UsersService, USERS_REPOSITORY],
})
export class UsersModule {}
