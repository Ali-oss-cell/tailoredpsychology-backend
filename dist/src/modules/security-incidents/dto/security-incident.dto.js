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
exports.SecurityIncidentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SecurityIncidentDto {
    incidentId;
    title;
    summary;
    severity;
    impact;
    status;
    ndbAssessment;
    containsPersonalData;
    assignedOwnerUserId;
    resolutionNotes;
    detectedAt;
    createdAt;
    updatedAt;
    closedAt;
}
exports.SecurityIncidentDto = SecurityIncidentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "sec_0001" }),
    __metadata("design:type", String)
], SecurityIncidentDto.prototype, "incidentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Unauthorized record export attempt" }),
    __metadata("design:type", String)
], SecurityIncidentDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Multiple failed export-download requests from unusual source IP." }),
    __metadata("design:type", String)
], SecurityIncidentDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "high", enum: ["low", "medium", "high", "critical"] }),
    __metadata("design:type", String)
], SecurityIncidentDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "moderate", enum: ["low", "moderate", "severe"] }),
    __metadata("design:type", String)
], SecurityIncidentDto.prototype, "impact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "triage",
        enum: ["reported", "triage", "investigating", "notification_assessment", "notification_ready", "closed"],
    }),
    __metadata("design:type", String)
], SecurityIncidentDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "assessment_in_progress",
        enum: ["not_required", "assessment_in_progress", "eligible_for_notification", "notifiable"],
    }),
    __metadata("design:type", String)
], SecurityIncidentDto.prototype, "ndbAssessment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], SecurityIncidentDto.prototype, "containsPersonalData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "user_admin_001" }),
    __metadata("design:type", String)
], SecurityIncidentDto.prototype, "assignedOwnerUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "Incident investigated and controls reinforced." }),
    __metadata("design:type", String)
], SecurityIncidentDto.prototype, "resolutionNotes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-30T08:30:00.000Z" }),
    __metadata("design:type", String)
], SecurityIncidentDto.prototype, "detectedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-30T08:45:00.000Z" }),
    __metadata("design:type", String)
], SecurityIncidentDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-30T09:45:00.000Z" }),
    __metadata("design:type", String)
], SecurityIncidentDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "2026-04-30T10:45:00.000Z" }),
    __metadata("design:type", String)
], SecurityIncidentDto.prototype, "closedAt", void 0);
//# sourceMappingURL=security-incident.dto.js.map