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
exports.TelehealthReadinessDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class TelehealthReadinessCheckDto {
    key;
    status;
    message;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "camera" }),
    __metadata("design:type", String)
], TelehealthReadinessCheckDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "review", enum: ["pass", "review"] }),
    __metadata("design:type", String)
], TelehealthReadinessCheckDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Camera permission will be requested when joining session." }),
    __metadata("design:type", String)
], TelehealthReadinessCheckDto.prototype, "message", void 0);
class TelehealthReadinessDto {
    appointmentId;
    overallStatus;
    checks;
    guidance;
    updatedAt;
}
exports.TelehealthReadinessDto = TelehealthReadinessDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "appt_open_001" }),
    __metadata("design:type", String)
], TelehealthReadinessDto.prototype, "appointmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "attention", enum: ["ready", "attention"] }),
    __metadata("design:type", String)
], TelehealthReadinessDto.prototype, "overallStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TelehealthReadinessCheckDto] }),
    __metadata("design:type", Array)
], TelehealthReadinessDto.prototype, "checks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Complete checks before joining your telehealth session." }),
    __metadata("design:type", String)
], TelehealthReadinessDto.prototype, "guidance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-27T11:00:00.000Z" }),
    __metadata("design:type", String)
], TelehealthReadinessDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=telehealth-readiness.dto.js.map