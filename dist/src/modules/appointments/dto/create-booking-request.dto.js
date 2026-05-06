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
exports.CreateBookingRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateBookingRequestDto {
    clinicianId;
    slotId;
    appointmentDate;
    notes;
    idempotencyKey;
    timezone;
    referralDocumentId;
}
exports.CreateBookingRequestDto = CreateBookingRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "clinician_001" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingRequestDto.prototype, "clinicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "clinician_001_2026-05-12_0900" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingRequestDto.prototype, "slotId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-12" }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBookingRequestDto.prototype, "appointmentDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "Initial telehealth session for anxiety support" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateBookingRequestDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "booking-submit-42" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateBookingRequestDto.prototype, "idempotencyKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "Australia/Sydney" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], CreateBookingRequestDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "ref_000001" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], CreateBookingRequestDto.prototype, "referralDocumentId", void 0);
//# sourceMappingURL=create-booking-request.dto.js.map