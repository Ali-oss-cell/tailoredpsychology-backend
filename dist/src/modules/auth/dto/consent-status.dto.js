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
exports.ConsentStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ConsentStatusDto {
    requiredVersion;
    activeVersion;
    hasActiveConsent;
    requiresReconsent;
    acceptedAt;
    withdrawnAt;
}
exports.ConsentStatusDto = ConsentStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04" }),
    __metadata("design:type", String)
], ConsentStatusDto.prototype, "requiredVersion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "2026-04" }),
    __metadata("design:type", Object)
], ConsentStatusDto.prototype, "activeVersion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], ConsentStatusDto.prototype, "hasActiveConsent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], ConsentStatusDto.prototype, "requiresReconsent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: "2026-04-28T12:00:00.000Z" }),
    __metadata("design:type", Object)
], ConsentStatusDto.prototype, "acceptedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: null }),
    __metadata("design:type", Object)
], ConsentStatusDto.prototype, "withdrawnAt", void 0);
//# sourceMappingURL=consent-status.dto.js.map