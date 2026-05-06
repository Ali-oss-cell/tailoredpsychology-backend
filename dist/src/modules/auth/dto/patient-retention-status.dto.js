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
exports.PatientRetentionStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PatientRetentionStatusDto {
    patientId;
    deletedAt;
    deletionReason;
    deletedByUserId;
    legalHoldActive;
    legalHoldReason;
    legalHoldSetByUserId;
    legalHoldSetAt;
    retentionUntil;
    lastInteractionAt;
    purgedAt;
    purgeEligible;
}
exports.PatientRetentionStatusDto = PatientRetentionStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], PatientRetentionStatusDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "2026-04-28T13:00:00.000Z" }),
    __metadata("design:type", Object)
], PatientRetentionStatusDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "patient requested account deletion" }),
    __metadata("design:type", Object)
], PatientRetentionStatusDto.prototype, "deletionReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "user_admin_001" }),
    __metadata("design:type", Object)
], PatientRetentionStatusDto.prototype, "deletedByUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], PatientRetentionStatusDto.prototype, "legalHoldActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "complaint under investigation" }),
    __metadata("design:type", Object)
], PatientRetentionStatusDto.prototype, "legalHoldReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "user_admin_001" }),
    __metadata("design:type", Object)
], PatientRetentionStatusDto.prototype, "legalHoldSetByUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "2026-04-28T13:05:00.000Z" }),
    __metadata("design:type", Object)
], PatientRetentionStatusDto.prototype, "legalHoldSetAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "2033-04-27T13:00:00.000Z" }),
    __metadata("design:type", Object)
], PatientRetentionStatusDto.prototype, "retentionUntil", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "2026-04-28T12:00:00.000Z" }),
    __metadata("design:type", Object)
], PatientRetentionStatusDto.prototype, "lastInteractionAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: null }),
    __metadata("design:type", Object)
], PatientRetentionStatusDto.prototype, "purgedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], PatientRetentionStatusDto.prototype, "purgeEligible", void 0);
//# sourceMappingURL=patient-retention-status.dto.js.map