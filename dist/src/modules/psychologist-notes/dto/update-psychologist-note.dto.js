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
exports.UpdatePsychologistNoteDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdatePsychologistNoteDto {
    status;
    body;
    clinicalDataset;
}
exports.UpdatePsychologistNoteDto = UpdatePsychologistNoteDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "ready_for_signoff", enum: ["draft", "ready_for_signoff"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["draft", "ready_for_signoff"]),
    __metadata("design:type", String)
], UpdatePsychologistNoteDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "Updated note body." }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], UpdatePsychologistNoteDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: () => Object }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdatePsychologistNoteDto.prototype, "clinicalDataset", void 0);
//# sourceMappingURL=update-psychologist-note.dto.js.map