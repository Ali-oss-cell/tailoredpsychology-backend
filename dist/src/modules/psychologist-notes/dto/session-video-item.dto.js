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
exports.SessionVideoItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SessionVideoItemDto {
    videoId;
    sessionId;
    patientId;
    clinicianId;
    sessionDate;
    policyStatus;
    canDownload;
    policyReason;
    watermarkRequired;
    watermarkText;
    transcriptReady;
}
exports.SessionVideoItemDto = SessionVideoItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "video_appt_open_001" }),
    __metadata("design:type", String)
], SessionVideoItemDto.prototype, "videoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "appt_open_001" }),
    __metadata("design:type", String)
], SessionVideoItemDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], SessionVideoItemDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "clinician_001" }),
    __metadata("design:type", String)
], SessionVideoItemDto.prototype, "clinicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-28T10:00:00.000Z" }),
    __metadata("design:type", String)
], SessionVideoItemDto.prototype, "sessionDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "active", enum: ["active", "hold", "purge_pending"] }),
    __metadata("design:type", String)
], SessionVideoItemDto.prototype, "policyStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], SessionVideoItemDto.prototype, "canDownload", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "Downloads blocked while legal hold is active" }),
    __metadata("design:type", String)
], SessionVideoItemDto.prototype, "policyReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], SessionVideoItemDto.prototype, "watermarkRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "CLINK CONFIDENTIAL · USER_PSYCHOLOGIST_001 · 2026-04-30" }),
    __metadata("design:type", String)
], SessionVideoItemDto.prototype, "watermarkText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], SessionVideoItemDto.prototype, "transcriptReady", void 0);
//# sourceMappingURL=session-video-item.dto.js.map