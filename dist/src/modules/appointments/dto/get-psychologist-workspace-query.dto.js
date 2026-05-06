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
exports.GetPsychologistWorkspaceQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class GetPsychologistWorkspaceQueryDto {
    readinessStatus;
    staleMinutes;
    sortBy;
    sortOrder;
}
exports.GetPsychologistWorkspaceQueryDto = GetPsychologistWorkspaceQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["ready", "attention", "unknown"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["ready", "attention", "unknown"]),
    __metadata("design:type", String)
], GetPsychologistWorkspaceQueryDto.prototype, "readinessStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 15, description: "Only include items with readiness older than this threshold or missing." }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(24 * 60),
    __metadata("design:type", Number)
], GetPsychologistWorkspaceQueryDto.prototype, "staleMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["startsAt", "readinessUpdatedAt", "readinessStatus"], default: "startsAt" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["startsAt", "readinessUpdatedAt", "readinessStatus"]),
    __metadata("design:type", String)
], GetPsychologistWorkspaceQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["asc", "desc"], default: "asc" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["asc", "desc"]),
    __metadata("design:type", String)
], GetPsychologistWorkspaceQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=get-psychologist-workspace-query.dto.js.map