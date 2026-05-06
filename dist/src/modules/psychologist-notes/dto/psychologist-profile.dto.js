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
exports.PsychologistProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PsychologistProfileDto {
    psychologistId;
    email;
    displayName;
    registrationNumber;
    providerNumber;
    specialties;
    status;
    bio;
    profileImageUrl;
}
exports.PsychologistProfileDto = PsychologistProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_psychologist_001" }),
    __metadata("design:type", String)
], PsychologistProfileDto.prototype, "psychologistId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "psychologist@clink.test" }),
    __metadata("design:type", String)
], PsychologistProfileDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Psychologist Demo" }),
    __metadata("design:type", String)
], PsychologistProfileDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "PSY-AHPRA-001" }),
    __metadata("design:type", String)
], PsychologistProfileDto.prototype, "registrationNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "PRV-100001" }),
    __metadata("design:type", String)
], PsychologistProfileDto.prototype, "providerNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["anxiety", "stress"] }),
    __metadata("design:type", Array)
], PsychologistProfileDto.prototype, "specialties", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "active", enum: ["active", "inactive"] }),
    __metadata("design:type", String)
], PsychologistProfileDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Therapy focus: anxiety and stress management." }),
    __metadata("design:type", String)
], PsychologistProfileDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "https://images.clink.test/psychologist/profile-001.jpg", required: false }),
    __metadata("design:type", String)
], PsychologistProfileDto.prototype, "profileImageUrl", void 0);
//# sourceMappingURL=psychologist-profile.dto.js.map