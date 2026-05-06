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
exports.PatientDataRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PatientDataRequestDto {
    requestId;
    patientId;
    requestType;
    status;
    details;
    requestedCorrection;
    triageOwnerUserId;
    resolutionNotes;
    slaDueAt;
    triagedAt;
    resolvedAt;
    createdAt;
    updatedAt;
}
exports.PatientDataRequestDto = PatientDataRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "pdr_001" }),
    __metadata("design:type", String)
], PatientDataRequestDto.prototype, "requestId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], PatientDataRequestDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "access", enum: ["access", "correction"] }),
    __metadata("design:type", String)
], PatientDataRequestDto.prototype, "requestType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "submitted", enum: ["submitted", "triage_review", "in_progress", "fulfilled", "rejected", "cancelled"] }),
    __metadata("design:type", String)
], PatientDataRequestDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Please provide a copy of all records for this calendar year." }),
    __metadata("design:type", String)
], PatientDataRequestDto.prototype, "details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "Correct DOB to 1991-03-20." }),
    __metadata("design:type", String)
], PatientDataRequestDto.prototype, "requestedCorrection", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "user_admin_001" }),
    __metadata("design:type", String)
], PatientDataRequestDto.prototype, "triageOwnerUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "Request fulfilled in secure export job exp_123." }),
    __metadata("design:type", String)
], PatientDataRequestDto.prototype, "resolutionNotes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-02T12:00:00.000Z" }),
    __metadata("design:type", String)
], PatientDataRequestDto.prototype, "slaDueAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "2026-04-30T12:00:00.000Z" }),
    __metadata("design:type", String)
], PatientDataRequestDto.prototype, "triagedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "2026-05-01T11:00:00.000Z" }),
    __metadata("design:type", String)
], PatientDataRequestDto.prototype, "resolvedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-30T10:00:00.000Z" }),
    __metadata("design:type", String)
], PatientDataRequestDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-30T10:30:00.000Z" }),
    __metadata("design:type", String)
], PatientDataRequestDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=patient-data-request.dto.js.map