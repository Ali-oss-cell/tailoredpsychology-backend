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
exports.GetIntakeQueueQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class GetIntakeQueueQueryDto {
    state;
    risk;
    referralStatus;
    medicareUncertain;
    staleHours;
    assignedClinicianId;
}
exports.GetIntakeQueueQueryDto = GetIntakeQueueQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "submitted" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], GetIntakeQueueQueryDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "urgent_support_needed" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], GetIntakeQueueQueryDto.prototype, "risk", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "missing_referral" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], GetIntakeQueueQueryDto.prototype, "referralStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "yes" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], GetIntakeQueueQueryDto.prototype, "medicareUncertain", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 24 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GetIntakeQueueQueryDto.prototype, "staleHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "clinician_001" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], GetIntakeQueueQueryDto.prototype, "assignedClinicianId", void 0);
//# sourceMappingURL=get-intake-queue-query.dto.js.map