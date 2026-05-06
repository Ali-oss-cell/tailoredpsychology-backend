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
exports.ReferralQueueItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ReferralQueueItemDto {
    documentId;
    patientId;
    status;
    fileName;
    fileSize;
    mimeType;
    sourceType;
    referralDate;
    notes;
    uploadedAt;
    dueAt;
    overdue;
    assignedOwnerUserId;
    reviewedBy;
    reviewedAt;
    reviewReason;
    reviewNotes;
}
exports.ReferralQueueItemDto = ReferralQueueItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "ref_000001" }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "documentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "received", enum: ["received", "review_needed", "approved", "rejected", "info_requested"] }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "referral.pdf" }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 125830 }),
    __metadata("design:type", Number)
], ReferralQueueItemDto.prototype, "fileSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "application/pdf" }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "gp_mhtp" }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "sourceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "2026-04-26" }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "referralDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Patient supplied referral before first consult." }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-26T15:40:10.000Z" }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "uploadedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-10T15:40:10.000Z" }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "dueAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], ReferralQueueItemDto.prototype, "overdue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "user_admin_001" }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "assignedOwnerUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "admin_001" }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "reviewedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "2026-04-27T10:00:00.000Z" }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "reviewedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Referral date valid and notes complete." }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "reviewReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Approved for onboarding queue." }),
    __metadata("design:type", String)
], ReferralQueueItemDto.prototype, "reviewNotes", void 0);
//# sourceMappingURL=referral-queue-item.dto.js.map