"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const users_delegating_repository_1 = require("./users.delegating-repository");
const users_pg_repository_1 = require("./users.pg-repository");
const users_service_1 = require("./users.service");
const users_repository_1 = require("./users.repository");
const users_stub_repository_1 = require("./users.stub-repository");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        providers: [
            users_service_1.UsersService,
            users_stub_repository_1.UsersStubRepository,
            users_pg_repository_1.UsersPgRepository,
            users_delegating_repository_1.UsersDelegatingRepository,
            {
                provide: users_repository_1.USERS_REPOSITORY,
                useExisting: users_delegating_repository_1.UsersDelegatingRepository,
            },
        ],
        exports: [users_service_1.UsersService, users_repository_1.USERS_REPOSITORY],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map