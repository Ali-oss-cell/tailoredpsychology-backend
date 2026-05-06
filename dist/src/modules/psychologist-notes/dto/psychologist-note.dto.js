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
exports.PsychologistNoteDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PsychologistNoteDto {
    noteId;
    psychologistId;
    patientId;
    sessionId;
    status;
    body;
    clinicalDataset;
    updatedAt;
    signedAt;
}
exports.PsychologistNoteDto = PsychologistNoteDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "note_0001" }),
    __metadata("design:type", String)
], PsychologistNoteDto.prototype, "noteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_psychologist_001" }),
    __metadata("design:type", String)
], PsychologistNoteDto.prototype, "psychologistId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], PsychologistNoteDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "appt_open_001" }),
    __metadata("design:type", String)
], PsychologistNoteDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "draft", enum: ["draft", "ready_for_signoff", "signed"] }),
    __metadata("design:type", String)
], PsychologistNoteDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Clinical note body" }),
    __metadata("design:type", String)
], PsychologistNoteDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: () => Object,
        example: {
            presentingConcerns: "Low mood and sleep disruption",
            riskAssessment: "No immediate risk, monitor weekly",
            interventionsApplied: "CBT thought log and breathing routine",
            progressEvaluation: "Partial improvement",
            followUpPlan: "Follow up in 7 days",
        },
    }),
    __metadata("design:type", Object)
], PsychologistNoteDto.prototype, "clinicalDataset", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-28T12:00:00.000Z" }),
    __metadata("design:type", String)
], PsychologistNoteDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "2026-04-28T12:05:00.000Z" }),
    __metadata("design:type", String)
], PsychologistNoteDto.prototype, "signedAt", void 0);
//# sourceMappingURL=psychologist-note.dto.js.map