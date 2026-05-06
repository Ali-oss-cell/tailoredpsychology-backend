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
exports.PatientAppointmentsListResponseDto = exports.PatientAppointmentSummaryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PatientAppointmentSummaryDto {
    appointmentId;
    clinicianId;
    clinicianName;
    sessionTypeLabel;
    scheduledStartAt;
    scheduledEndAt;
    status;
    statusLabel;
}
exports.PatientAppointmentSummaryDto = PatientAppointmentSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PatientAppointmentSummaryDto.prototype, "appointmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "clinician_001" }),
    __metadata("design:type", String)
], PatientAppointmentSummaryDto.prototype, "clinicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PatientAppointmentSummaryDto.prototype, "clinicianName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Clinical psychology consultation" }),
    __metadata("design:type", String)
], PatientAppointmentSummaryDto.prototype, "sessionTypeLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PatientAppointmentSummaryDto.prototype, "scheduledStartAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PatientAppointmentSummaryDto.prototype, "scheduledEndAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ["scheduled", "in_progress", "completed", "cancelled", "no_show"] }),
    __metadata("design:type", String)
], PatientAppointmentSummaryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Scheduled" }),
    __metadata("design:type", String)
], PatientAppointmentSummaryDto.prototype, "statusLabel", void 0);
class PatientAppointmentsListResponseDto {
    upcoming;
    past;
}
exports.PatientAppointmentsListResponseDto = PatientAppointmentsListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PatientAppointmentSummaryDto] }),
    __metadata("design:type", Array)
], PatientAppointmentsListResponseDto.prototype, "upcoming", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PatientAppointmentSummaryDto] }),
    __metadata("design:type", Array)
], PatientAppointmentsListResponseDto.prototype, "past", void 0);
//# sourceMappingURL=patient-appointment-summary.dto.js.map