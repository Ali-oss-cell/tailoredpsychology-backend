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
exports.JoinAttemptDecisionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class JoinAttemptDecisionDto {
    appointmentId;
    allowed;
    policyMode;
    readinessStatus;
    windowStatus;
    reasons;
    recordedAt;
}
exports.JoinAttemptDecisionDto = JoinAttemptDecisionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "appt_open_001" }),
    __metadata("design:type", String)
], JoinAttemptDecisionDto.prototype, "appointmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], JoinAttemptDecisionDto.prototype, "allowed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "warn_allow", enum: ["warn_allow"] }),
    __metadata("design:type", String)
], JoinAttemptDecisionDto.prototype, "policyMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "attention", enum: ["ready", "attention", "unknown"] }),
    __metadata("design:type", String)
], JoinAttemptDecisionDto.prototype, "readinessStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "open", enum: ["locked", "open", "closed"] }),
    __metadata("design:type", String)
], JoinAttemptDecisionDto.prototype, "windowStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], example: ["readiness_attention"] }),
    __metadata("design:type", Array)
], JoinAttemptDecisionDto.prototype, "reasons", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-27T11:00:00.000Z" }),
    __metadata("design:type", String)
], JoinAttemptDecisionDto.prototype, "recordedAt", void 0);
//# sourceMappingURL=join-attempt-decision.dto.js.map