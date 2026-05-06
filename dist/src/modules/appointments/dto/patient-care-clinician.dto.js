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
exports.PatientCareClinicianDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PatientCareClinicianDto {
    clinicianId;
    psychologistUserId;
    displayName;
    registrationNumber;
    providerNumber;
    specialties;
    bio;
    profileImageUrl;
    accountStatus;
    nextSessionAt;
    lastSessionAt;
}
exports.PatientCareClinicianDto = PatientCareClinicianDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "clinician_001" }),
    __metadata("design:type", String)
], PatientCareClinicianDto.prototype, "clinicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_psychologist_001", description: "Auth user id for the psychologist account" }),
    __metadata("design:type", String)
], PatientCareClinicianDto.prototype, "psychologistUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Avery Mitchell" }),
    __metadata("design:type", String)
], PatientCareClinicianDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "PSY-AHPRA-001", required: false }),
    __metadata("design:type", String)
], PatientCareClinicianDto.prototype, "registrationNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "PRV-100001", required: false }),
    __metadata("design:type", String)
], PatientCareClinicianDto.prototype, "providerNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["anxiety", "stress"], type: [String] }),
    __metadata("design:type", Array)
], PatientCareClinicianDto.prototype, "specialties", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "CBT and trauma-informed care." }),
    __metadata("design:type", String)
], PatientCareClinicianDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "https://cdn.example.com/psy.jpg" }),
    __metadata("design:type", String)
], PatientCareClinicianDto.prototype, "profileImageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "active" }),
    __metadata("design:type", String)
], PatientCareClinicianDto.prototype, "accountStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-10T10:00:00.000Z", required: false, description: "Next scheduled or in-progress session" }),
    __metadata("design:type", String)
], PatientCareClinicianDto.prototype, "nextSessionAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-20T10:00:00.000Z", required: false, description: "Most recent past session in history" }),
    __metadata("design:type", String)
], PatientCareClinicianDto.prototype, "lastSessionAt", void 0);
//# sourceMappingURL=patient-care-clinician.dto.js.map