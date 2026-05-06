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
exports.CreatePsychologistNoteDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreatePsychologistNoteDto {
    patientId;
    sessionId;
    status;
    body;
    clinicalDataset;
}
exports.CreatePsychologistNoteDto = CreatePsychologistNoteDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePsychologistNoteDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "appt_open_001" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePsychologistNoteDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "draft", enum: ["draft", "ready_for_signoff"] }),
    (0, class_validator_1.IsIn)(["draft", "ready_for_signoff"]),
    __metadata("design:type", String)
], CreatePsychologistNoteDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Client reported improved sleep quality." }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreatePsychologistNoteDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: () => Object }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePsychologistNoteDto.prototype, "clinicalDataset", void 0);
//# sourceMappingURL=create-psychologist-note.dto.js.map