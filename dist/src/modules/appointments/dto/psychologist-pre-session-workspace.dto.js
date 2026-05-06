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
exports.PsychologistPreSessionWorkspaceDto = exports.PsychologistPreSessionItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PsychologistPreSessionItemDto {
    appointmentId;
    patientId;
    startsAt;
    risk;
    referralStatus;
    intakeState;
    readinessStatus;
    readinessUpdatedAt;
    actions;
}
exports.PsychologistPreSessionItemDto = PsychologistPreSessionItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "appt_br_000001" }),
    __metadata("design:type", String)
], PsychologistPreSessionItemDto.prototype, "appointmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], PsychologistPreSessionItemDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-27T11:00:00.000Z" }),
    __metadata("design:type", String)
], PsychologistPreSessionItemDto.prototype, "startsAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "none" }),
    __metadata("design:type", String)
], PsychologistPreSessionItemDto.prototype, "risk", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "linked_referral" }),
    __metadata("design:type", String)
], PsychologistPreSessionItemDto.prototype, "referralStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "committed" }),
    __metadata("design:type", String)
], PsychologistPreSessionItemDto.prototype, "intakeState", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "attention" }),
    __metadata("design:type", String)
], PsychologistPreSessionItemDto.prototype, "readinessStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-27T11:00:00.000Z", required: false }),
    __metadata("design:type", String)
], PsychologistPreSessionItemDto.prototype, "readinessUpdatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], example: ["review_intake", "check_referral"] }),
    __metadata("design:type", Array)
], PsychologistPreSessionItemDto.prototype, "actions", void 0);
class PsychologistPreSessionWorkspaceDto {
    psychologistId;
    items;
}
exports.PsychologistPreSessionWorkspaceDto = PsychologistPreSessionWorkspaceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "clinician_001" }),
    __metadata("design:type", String)
], PsychologistPreSessionWorkspaceDto.prototype, "psychologistId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PsychologistPreSessionItemDto] }),
    __metadata("design:type", Array)
], PsychologistPreSessionWorkspaceDto.prototype, "items", void 0);
//# sourceMappingURL=psychologist-pre-session-workspace.dto.js.map