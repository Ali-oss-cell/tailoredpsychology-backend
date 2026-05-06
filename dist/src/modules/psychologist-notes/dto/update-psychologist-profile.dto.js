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
exports.UpdatePsychologistProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdatePsychologistProfileDto {
    displayName;
    registrationNumber;
    providerNumber;
    specialties;
    status;
    bio;
    profileImageUrl;
}
exports.UpdatePsychologistProfileDto = UpdatePsychologistProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "Psychologist Demo Updated" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], UpdatePsychologistProfileDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "PSY-AHPRA-001" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePsychologistProfileDto.prototype, "registrationNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "PRV-100001" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePsychologistProfileDto.prototype, "providerNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: ["anxiety", "stress"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdatePsychologistProfileDto.prototype, "specialties", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "active", enum: ["active", "inactive"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["active", "inactive"]),
    __metadata("design:type", String)
], UpdatePsychologistProfileDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "Updated professional bio." }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePsychologistProfileDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "https://images.clink.test/psychologist/profile-001.jpg" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePsychologistProfileDto.prototype, "profileImageUrl", void 0);
//# sourceMappingURL=update-psychologist-profile.dto.js.map