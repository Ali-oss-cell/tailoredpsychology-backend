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
exports.DataExportStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class DataExportStatusDto {
    jobId;
    status;
    requestedAt;
    completedAt;
    expiresAt;
}
exports.DataExportStatusDto = DataExportStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "exp_000001" }),
    __metadata("design:type", String)
], DataExportStatusDto.prototype, "jobId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "ready", enum: ["queued", "processing", "ready", "failed"] }),
    __metadata("design:type", String)
], DataExportStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "2026-04-28T12:00:00.000Z" }),
    __metadata("design:type", String)
], DataExportStatusDto.prototype, "requestedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "2026-04-28T12:00:01.000Z" }),
    __metadata("design:type", String)
], DataExportStatusDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "2026-04-29T12:00:00.000Z" }),
    __metadata("design:type", String)
], DataExportStatusDto.prototype, "expiresAt", void 0);
//# sourceMappingURL=data-export-status.dto.js.map