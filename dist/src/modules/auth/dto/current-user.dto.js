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
exports.CurrentUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const user_role_type_1 = require("../../users/types/user-role.type");
const patient_contact_profile_dto_1 = require("./patient-contact-profile.dto");
const consent_status_dto_1 = require("./consent-status.dto");
class CurrentUserDto {
    id;
    email;
    displayName;
    role;
    accountSetupComplete;
    patientContactProfile;
    consentStatus;
}
exports.CurrentUserDto = CurrentUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], CurrentUserDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "patient@clink.test" }),
    __metadata("design:type", String)
], CurrentUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Patient Demo" }),
    __metadata("design:type", String)
], CurrentUserDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: user_role_type_1.USER_ROLES, example: "patient" }),
    __metadata("design:type", String)
], CurrentUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "For patients: true when display name and required intake fields (identity + consents) are present in the latest intake draft. Always true for non-patient roles. POST /auth/onboarding-complete is a no-op compatibility endpoint.",
        example: true,
    }),
    __metadata("design:type", Boolean)
], CurrentUserDto.prototype, "accountSetupComplete", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: patient_contact_profile_dto_1.PatientContactProfileDto,
        description: "Present for `patient` role: saved account contact, accessibility, and emergency details.",
    }),
    __metadata("design:type", patient_contact_profile_dto_1.PatientContactProfileDto)
], CurrentUserDto.prototype, "patientContactProfile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: consent_status_dto_1.ConsentStatusDto,
        description: "Present for `patient` role: current consent lifecycle status and re-consent requirement.",
    }),
    __metadata("design:type", consent_status_dto_1.ConsentStatusDto)
], CurrentUserDto.prototype, "consentStatus", void 0);
//# sourceMappingURL=current-user.dto.js.map