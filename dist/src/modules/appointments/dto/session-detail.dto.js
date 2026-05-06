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
exports.SessionDetailDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SessionDetailDto {
    sessionId;
    patientId;
    clinicianId;
    scheduledStartAt;
    scheduledEndAt;
    status;
    sessionTypeLabel;
    viewerAccessMode;
}
exports.SessionDetailDto = SessionDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "appt_open_001" }),
    __metadata("design:type", String)
], SessionDetailDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], SessionDetailDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "clinician_001" }),
    __metadata("design:type", String)
], SessionDetailDto.prototype, "clinicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-01T10:00:00.000Z" }),
    __metadata("design:type", String)
], SessionDetailDto.prototype, "scheduledStartAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-01T10:50:00.000Z" }),
    __metadata("design:type", String)
], SessionDetailDto.prototype, "scheduledEndAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "scheduled", enum: ["scheduled", "in_progress", "completed", "cancelled", "no_show"] }),
    __metadata("design:type", String)
], SessionDetailDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Clinical psychology consultation" }),
    __metadata("design:type", String)
], SessionDetailDto.prototype, "sessionTypeLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "owner_patient", enum: ["owner_patient", "assigned_psychologist", "ops"] }),
    __metadata("design:type", String)
], SessionDetailDto.prototype, "viewerAccessMode", void 0);
//# sourceMappingURL=session-detail.dto.js.map