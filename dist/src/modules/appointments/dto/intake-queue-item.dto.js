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
exports.IntakeQueueItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class IntakeQueueItemDto {
    queueItemId;
    sourceType;
    sourceId;
    patientId;
    state;
    risk;
    referralStatus;
    medicareUncertain;
    assignedClinicianId;
    updatedAt;
}
exports.IntakeQueueItemDto = IntakeQueueItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "booking_request:br_000001" }),
    __metadata("design:type", String)
], IntakeQueueItemDto.prototype, "queueItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "booking_request" }),
    __metadata("design:type", String)
], IntakeQueueItemDto.prototype, "sourceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "br_000001" }),
    __metadata("design:type", String)
], IntakeQueueItemDto.prototype, "sourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], IntakeQueueItemDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "submitted" }),
    __metadata("design:type", String)
], IntakeQueueItemDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "urgent_support_needed" }),
    __metadata("design:type", String)
], IntakeQueueItemDto.prototype, "risk", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "missing_referral" }),
    __metadata("design:type", String)
], IntakeQueueItemDto.prototype, "referralStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], IntakeQueueItemDto.prototype, "medicareUncertain", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "clinician_001", required: false }),
    __metadata("design:type", String)
], IntakeQueueItemDto.prototype, "assignedClinicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-27T11:00:00.000Z" }),
    __metadata("design:type", String)
], IntakeQueueItemDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=intake-queue-item.dto.js.map