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
exports.TelehealthInsightsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class TelehealthTrendMetricsDto {
    totalJoinAttempts;
    warnedJoinCount;
    warnedJoinRate;
    failedJoinCount;
    lateJoinCount;
    recoveryRate;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 22 }),
    __metadata("design:type", Number)
], TelehealthTrendMetricsDto.prototype, "totalJoinAttempts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 8 }),
    __metadata("design:type", Number)
], TelehealthTrendMetricsDto.prototype, "warnedJoinCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 36 }),
    __metadata("design:type", Number)
], TelehealthTrendMetricsDto.prototype, "warnedJoinRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], TelehealthTrendMetricsDto.prototype, "failedJoinCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4 }),
    __metadata("design:type", Number)
], TelehealthTrendMetricsDto.prototype, "lateJoinCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 63 }),
    __metadata("design:type", Number)
], TelehealthTrendMetricsDto.prototype, "recoveryRate", void 0);
class TelehealthClinicianBreakdownDto {
    clinicianId;
    totalJoinAttempts;
    warnedJoinCount;
    warnedJoinRate;
    failedJoinCount;
    recoveryRate;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "clinician_001" }),
    __metadata("design:type", String)
], TelehealthClinicianBreakdownDto.prototype, "clinicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 15 }),
    __metadata("design:type", Number)
], TelehealthClinicianBreakdownDto.prototype, "totalJoinAttempts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 6 }),
    __metadata("design:type", Number)
], TelehealthClinicianBreakdownDto.prototype, "warnedJoinCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 40 }),
    __metadata("design:type", Number)
], TelehealthClinicianBreakdownDto.prototype, "warnedJoinRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], TelehealthClinicianBreakdownDto.prototype, "failedJoinCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 53 }),
    __metadata("design:type", Number)
], TelehealthClinicianBreakdownDto.prototype, "recoveryRate", void 0);
class TelehealthInsightsDto {
    totalJoinAttempts;
    warnedJoinCount;
    warnedJoinRate;
    failedJoinCount;
    lateJoinCount;
    recoveryRate;
    last24h;
    last7d;
    clinicianBreakdown;
}
exports.TelehealthInsightsDto = TelehealthInsightsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 120 }),
    __metadata("design:type", Number)
], TelehealthInsightsDto.prototype, "totalJoinAttempts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 42 }),
    __metadata("design:type", Number)
], TelehealthInsightsDto.prototype, "warnedJoinCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 35 }),
    __metadata("design:type", Number)
], TelehealthInsightsDto.prototype, "warnedJoinRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 9 }),
    __metadata("design:type", Number)
], TelehealthInsightsDto.prototype, "failedJoinCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 18 }),
    __metadata("design:type", Number)
], TelehealthInsightsDto.prototype, "lateJoinCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 71 }),
    __metadata("design:type", Number)
], TelehealthInsightsDto.prototype, "recoveryRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: TelehealthTrendMetricsDto }),
    __metadata("design:type", TelehealthTrendMetricsDto)
], TelehealthInsightsDto.prototype, "last24h", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: TelehealthTrendMetricsDto }),
    __metadata("design:type", TelehealthTrendMetricsDto)
], TelehealthInsightsDto.prototype, "last7d", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TelehealthClinicianBreakdownDto] }),
    __metadata("design:type", Array)
], TelehealthInsightsDto.prototype, "clinicianBreakdown", void 0);
//# sourceMappingURL=telehealth-insights.dto.js.map