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
exports.SessionSummaryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SessionSummaryDto {
    sessionId;
    scheduledStartAt;
    scheduledEndAt;
    status;
    clinicianId;
    patientId;
}
exports.SessionSummaryDto = SessionSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "appt_open_001" }),
    __metadata("design:type", String)
], SessionSummaryDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-01T10:00:00.000Z" }),
    __metadata("design:type", String)
], SessionSummaryDto.prototype, "scheduledStartAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-01T10:50:00.000Z" }),
    __metadata("design:type", String)
], SessionSummaryDto.prototype, "scheduledEndAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "scheduled", enum: ["scheduled", "in_progress", "completed", "cancelled", "no_show"] }),
    __metadata("design:type", String)
], SessionSummaryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "clinician_001" }),
    __metadata("design:type", String)
], SessionSummaryDto.prototype, "clinicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], SessionSummaryDto.prototype, "patientId", void 0);
//# sourceMappingURL=session-summary.dto.js.map