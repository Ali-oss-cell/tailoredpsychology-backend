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
exports.CreateSecurityIncidentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateSecurityIncidentDto {
    title;
    summary;
    severity;
    impact;
    containsPersonalData;
    detectedAt;
}
exports.CreateSecurityIncidentDto = CreateSecurityIncidentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Unauthorized record export attempt" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], CreateSecurityIncidentDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Multiple failed export-download requests from unusual source IP." }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateSecurityIncidentDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "high", enum: ["low", "medium", "high", "critical"] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(["low", "medium", "high", "critical"]),
    __metadata("design:type", String)
], CreateSecurityIncidentDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "moderate", enum: ["low", "moderate", "severe"] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(["low", "moderate", "severe"]),
    __metadata("design:type", String)
], CreateSecurityIncidentDto.prototype, "impact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSecurityIncidentDto.prototype, "containsPersonalData", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "2026-04-30T08:30:00.000Z" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSecurityIncidentDto.prototype, "detectedAt", void 0);
//# sourceMappingURL=create-security-incident.dto.js.map