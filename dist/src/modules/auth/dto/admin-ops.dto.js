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
exports.AdminSettingsDomainDto = exports.AdminAnalyticsSummaryDto = exports.AdminBillingSummaryDto = exports.AdminDeletionQueueItemDto = exports.AdminResourceItemDto = exports.AdminStaffItemDto = exports.AdminPatientItemDto = exports.AdminAppointmentItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AdminAppointmentItemDto {
    appointmentId;
    patientId;
    patientName;
    clinicianId;
    clinicianName;
    scheduledStartAt;
    status;
}
exports.AdminAppointmentItemDto = AdminAppointmentItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminAppointmentItemDto.prototype, "appointmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminAppointmentItemDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminAppointmentItemDto.prototype, "patientName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminAppointmentItemDto.prototype, "clinicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminAppointmentItemDto.prototype, "clinicianName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminAppointmentItemDto.prototype, "scheduledStartAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminAppointmentItemDto.prototype, "status", void 0);
class AdminPatientItemDto {
    patientId;
    displayName;
    email;
    intakeState;
    retentionStatus;
    legalHoldActive;
}
exports.AdminPatientItemDto = AdminPatientItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminPatientItemDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminPatientItemDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminPatientItemDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminPatientItemDto.prototype, "intakeState", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminPatientItemDto.prototype, "retentionStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], AdminPatientItemDto.prototype, "legalHoldActive", void 0);
class AdminStaffItemDto {
    userId;
    displayName;
    email;
    role;
    status;
}
exports.AdminStaffItemDto = AdminStaffItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminStaffItemDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminStaffItemDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminStaffItemDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminStaffItemDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminStaffItemDto.prototype, "status", void 0);
class AdminResourceItemDto {
    resourceId;
    title;
    state;
    owner;
    updatedAt;
}
exports.AdminResourceItemDto = AdminResourceItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminResourceItemDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminResourceItemDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminResourceItemDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminResourceItemDto.prototype, "owner", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminResourceItemDto.prototype, "updatedAt", void 0);
class AdminDeletionQueueItemDto {
    patientId;
    deletedAt;
    retentionUntil;
    legalHoldActive;
    purgeEligible;
}
exports.AdminDeletionQueueItemDto = AdminDeletionQueueItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminDeletionQueueItemDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], AdminDeletionQueueItemDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], AdminDeletionQueueItemDto.prototype, "retentionUntil", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], AdminDeletionQueueItemDto.prototype, "legalHoldActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], AdminDeletionQueueItemDto.prototype, "purgeEligible", void 0);
class AdminBillingSummaryDto {
    revenueToday;
    revenueWeek;
    revenueMonth;
    failedPayments;
    pendingClaims;
}
exports.AdminBillingSummaryDto = AdminBillingSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AdminBillingSummaryDto.prototype, "revenueToday", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AdminBillingSummaryDto.prototype, "revenueWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AdminBillingSummaryDto.prototype, "revenueMonth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AdminBillingSummaryDto.prototype, "failedPayments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AdminBillingSummaryDto.prototype, "pendingClaims", void 0);
class AdminAnalyticsSummaryDto {
    totalAnalyticsEvents;
    totalAuditEvents;
    bookingRequested;
    joinFailures;
}
exports.AdminAnalyticsSummaryDto = AdminAnalyticsSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AdminAnalyticsSummaryDto.prototype, "totalAnalyticsEvents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AdminAnalyticsSummaryDto.prototype, "totalAuditEvents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AdminAnalyticsSummaryDto.prototype, "bookingRequested", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AdminAnalyticsSummaryDto.prototype, "joinFailures", void 0);
class AdminSettingsDomainDto {
    key;
    value;
    editable;
}
exports.AdminSettingsDomainDto = AdminSettingsDomainDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminSettingsDomainDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminSettingsDomainDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], AdminSettingsDomainDto.prototype, "editable", void 0);
//# sourceMappingURL=admin-ops.dto.js.map