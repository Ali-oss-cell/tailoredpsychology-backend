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
exports.PatientContactProfilePatchDto = exports.PatientContactProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const patient_contact_profile_type_1 = require("../../users/types/patient-contact-profile.type");
/** Response shape for `CurrentUserDto.patientContactProfile` (patients only). */
class PatientContactProfileDto {
    phoneMobile;
    preferredContactMethod;
    accessibilityNotes;
    emergencyContactName;
    emergencyContactPhone;
    emergencyContactRelationship;
}
exports.PatientContactProfileDto = PatientContactProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "+61 400 000 000" }),
    __metadata("design:type", String)
], PatientContactProfileDto.prototype, "phoneMobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: patient_contact_profile_type_1.PREFERRED_CONTACT_METHODS, example: "email" }),
    __metadata("design:type", Object)
], PatientContactProfileDto.prototype, "preferredContactMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Please use live captions in sessions." }),
    __metadata("design:type", String)
], PatientContactProfileDto.prototype, "accessibilityNotes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Jamie Chen" }),
    __metadata("design:type", String)
], PatientContactProfileDto.prototype, "emergencyContactName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "+61 400 000 001" }),
    __metadata("design:type", String)
], PatientContactProfileDto.prototype, "emergencyContactPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Partner" }),
    __metadata("design:type", String)
], PatientContactProfileDto.prototype, "emergencyContactRelationship", void 0);
/** PATCH body: all patient contact fields optional; only provided keys are updated. */
class PatientContactProfilePatchDto {
    phoneMobile;
    preferredContactMethod;
    accessibilityNotes;
    emergencyContactName;
    emergencyContactPhone;
    emergencyContactRelationship;
}
exports.PatientContactProfilePatchDto = PatientContactProfilePatchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "+61 400 000 000" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], PatientContactProfilePatchDto.prototype, "phoneMobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: patient_contact_profile_type_1.PREFERRED_CONTACT_METHODS }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...patient_contact_profile_type_1.PREFERRED_CONTACT_METHODS]),
    __metadata("design:type", Object)
], PatientContactProfilePatchDto.prototype, "preferredContactMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Please use live captions in sessions." }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], PatientContactProfilePatchDto.prototype, "accessibilityNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Jamie Chen" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], PatientContactProfilePatchDto.prototype, "emergencyContactName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "+61 400 000 001" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], PatientContactProfilePatchDto.prototype, "emergencyContactPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Partner" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], PatientContactProfilePatchDto.prototype, "emergencyContactRelationship", void 0);
//# sourceMappingURL=patient-contact-profile.dto.js.map