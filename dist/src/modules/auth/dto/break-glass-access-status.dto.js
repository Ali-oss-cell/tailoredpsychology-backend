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
exports.BreakGlassAccessStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class BreakGlassAccessStatusDto {
    patientId;
    active;
    grantedByUserId;
    justification;
    grantedAt;
    expiresAt;
}
exports.BreakGlassAccessStatusDto = BreakGlassAccessStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], BreakGlassAccessStatusDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], BreakGlassAccessStatusDto.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "user_admin_001" }),
    __metadata("design:type", Object)
], BreakGlassAccessStatusDto.prototype, "grantedByUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "Urgent clinical safety review requested by on-call lead." }),
    __metadata("design:type", Object)
], BreakGlassAccessStatusDto.prototype, "justification", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "2026-04-30T09:00:00.000Z" }),
    __metadata("design:type", Object)
], BreakGlassAccessStatusDto.prototype, "grantedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "2026-04-30T09:30:00.000Z" }),
    __metadata("design:type", Object)
], BreakGlassAccessStatusDto.prototype, "expiresAt", void 0);
//# sourceMappingURL=break-glass-access-status.dto.js.map