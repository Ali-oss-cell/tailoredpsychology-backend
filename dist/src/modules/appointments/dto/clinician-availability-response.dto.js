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
exports.ClinicianAvailabilityResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const availability_slot_dto_1 = require("./availability-slot.dto");
class ClinicianAvailabilityResponseDto {
    clinicianId;
    clinicianName;
    slots;
    specialties;
    bio;
    profileImageUrl;
}
exports.ClinicianAvailabilityResponseDto = ClinicianAvailabilityResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "clinician_001" }),
    __metadata("design:type", String)
], ClinicianAvailabilityResponseDto.prototype, "clinicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Avery Mitchell" }),
    __metadata("design:type", String)
], ClinicianAvailabilityResponseDto.prototype, "clinicianName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [availability_slot_dto_1.AvailabilitySlotDto] }),
    __metadata("design:type", Array)
], ClinicianAvailabilityResponseDto.prototype, "slots", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: ["anxiety", "stress"], type: [String], description: "From psychologist_profiles when DB is enabled" }),
    __metadata("design:type", Array)
], ClinicianAvailabilityResponseDto.prototype, "specialties", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "Therapy focus: anxiety and CBT." }),
    __metadata("design:type", String)
], ClinicianAvailabilityResponseDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "https://cdn.example.com/psy.jpg" }),
    __metadata("design:type", String)
], ClinicianAvailabilityResponseDto.prototype, "profileImageUrl", void 0);
//# sourceMappingURL=clinician-availability-response.dto.js.map