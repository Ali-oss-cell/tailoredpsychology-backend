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
exports.SessionVideoAccessDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SessionVideoAccessDto {
    videoId;
    canDownload;
    denialReason;
    accessToken;
    expiresAt;
    watermarkText;
    downloadUrl;
}
exports.SessionVideoAccessDto = SessionVideoAccessDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "video_appt_open_001" }),
    __metadata("design:type", String)
], SessionVideoAccessDto.prototype, "videoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], SessionVideoAccessDto.prototype, "canDownload", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "Downloads are restricted to owner patient or assigned psychologist." }),
    __metadata("design:type", String)
], SessionVideoAccessDto.prototype, "denialReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "svat_abc123def456" }),
    __metadata("design:type", String)
], SessionVideoAccessDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "2026-04-30T10:00:00.000Z" }),
    __metadata("design:type", String)
], SessionVideoAccessDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "CLINK CONFIDENTIAL · USER_PATIENT_001 · 2026-04-30" }),
    __metadata("design:type", String)
], SessionVideoAccessDto.prototype, "watermarkText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "https://api.example.com/api/session-videos/access/svat_abc123def456/download" }),
    __metadata("design:type", String)
], SessionVideoAccessDto.prototype, "downloadUrl", void 0);
//# sourceMappingURL=session-video-access.dto.js.map