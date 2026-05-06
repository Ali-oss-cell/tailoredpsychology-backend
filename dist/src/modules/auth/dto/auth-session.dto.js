"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSessionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const current_user_dto_1 = require("./current-user.dto");
class AuthSessionDto {
    accessToken;
    tokenType;
    expiresInSeconds;
    user;
}
exports.AuthSessionDto = AuthSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
    __metadata("design:type", String)
], AuthSessionDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Bearer" }),
    __metadata("design:type", String)
], AuthSessionDto.prototype, "tokenType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3600 }),
    __metadata("design:type", Number)
], AuthSessionDto.prototype, "expiresInSeconds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: current_user_dto_1.CurrentUserDto }),
    __metadata("design:type", current_user_dto_1.CurrentUserDto)
], AuthSessionDto.prototype, "user", void 0);
//# sourceMappingURL=auth-session.dto.js.map