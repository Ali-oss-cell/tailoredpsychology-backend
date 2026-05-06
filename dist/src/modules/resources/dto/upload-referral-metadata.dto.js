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
exports.UploadReferralMetadataDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UploadReferralMetadataDto {
    sourceType;
    referralDate;
    notes;
}
exports.UploadReferralMetadataDto = UploadReferralMetadataDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "gp_mhtp" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UploadReferralMetadataDto.prototype, "sourceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "2026-05-01" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UploadReferralMetadataDto.prototype, "referralDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "Referral received from GP." }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UploadReferralMetadataDto.prototype, "notes", void 0);
//# sourceMappingURL=upload-referral-metadata.dto.js.map