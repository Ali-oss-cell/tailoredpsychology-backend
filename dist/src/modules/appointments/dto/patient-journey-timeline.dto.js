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
exports.PatientJourneyTimelineDto = exports.PatientJourneyTimelineStepDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PatientJourneyTimelineStepDto {
    key;
    status;
    occurredAt;
    label;
}
exports.PatientJourneyTimelineStepDto = PatientJourneyTimelineStepDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "intake_started" }),
    __metadata("design:type", String)
], PatientJourneyTimelineStepDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "done" }),
    __metadata("design:type", String)
], PatientJourneyTimelineStepDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-27T11:00:00.000Z", required: false }),
    __metadata("design:type", String)
], PatientJourneyTimelineStepDto.prototype, "occurredAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Intake started" }),
    __metadata("design:type", String)
], PatientJourneyTimelineStepDto.prototype, "label", void 0);
class PatientJourneyTimelineDto {
    patientId;
    steps;
}
exports.PatientJourneyTimelineDto = PatientJourneyTimelineDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], PatientJourneyTimelineDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PatientJourneyTimelineStepDto] }),
    __metadata("design:type", Array)
], PatientJourneyTimelineDto.prototype, "steps", void 0);
//# sourceMappingURL=patient-journey-timeline.dto.js.map