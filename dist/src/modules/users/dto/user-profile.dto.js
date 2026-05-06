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
exports.UserProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const user_role_type_1 = require("../types/user-role.type");
class UserProfileDto {
    id;
    email;
    displayName;
    role;
}
exports.UserProfileDto = UserProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], UserProfileDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "patient@clink.test" }),
    __metadata("design:type", String)
], UserProfileDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Patient Demo" }),
    __metadata("design:type", String)
], UserProfileDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: user_role_type_1.USER_ROLES, example: "patient" }),
    __metadata("design:type", String)
], UserProfileDto.prototype, "role", void 0);
//# sourceMappingURL=user-profile.dto.js.map