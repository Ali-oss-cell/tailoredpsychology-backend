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
exports.PatientDataRequestActionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class PatientDataRequestActionDto {
    action;
    notes;
    reason;
}
exports.PatientDataRequestActionDto = PatientDataRequestActionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "assign", enum: ["assign", "start_review", "fulfill", "reject", "cancel"] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(["assign", "start_review", "fulfill", "reject", "cancel"]),
    __metadata("design:type", String)
], PatientDataRequestActionDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Investigating requested correction details." }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1200),
    __metadata("design:type", String)
], PatientDataRequestActionDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Patient withdrew correction request." }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], PatientDataRequestActionDto.prototype, "reason", void 0);
//# sourceMappingURL=patient-data-request-action.dto.js.map