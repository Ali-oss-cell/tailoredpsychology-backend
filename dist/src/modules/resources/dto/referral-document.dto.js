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
exports.ReferralDocumentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ReferralDocumentDto {
    documentId;
    status;
    fileName;
    fileSize;
    mimeType;
    uploadedAt;
}
exports.ReferralDocumentDto = ReferralDocumentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "ref_000001" }),
    __metadata("design:type", String)
], ReferralDocumentDto.prototype, "documentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "received", enum: ["received", "review_needed", "approved", "rejected", "info_requested"] }),
    __metadata("design:type", String)
], ReferralDocumentDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "referral.pdf" }),
    __metadata("design:type", String)
], ReferralDocumentDto.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 125830 }),
    __metadata("design:type", Number)
], ReferralDocumentDto.prototype, "fileSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "application/pdf" }),
    __metadata("design:type", String)
], ReferralDocumentDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-26T15:40:10.000Z" }),
    __metadata("design:type", String)
], ReferralDocumentDto.prototype, "uploadedAt", void 0);
//# sourceMappingURL=referral-document.dto.js.map