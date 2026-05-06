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
exports.BookingRequestStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class BookingRequestStatusDto {
    bookingRequestId;
    state;
    lastUpdated;
    nextAction;
    clinicianId;
    slotId;
    appointmentDate;
    referralDocumentId;
}
exports.BookingRequestStatusDto = BookingRequestStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "br_000001" }),
    __metadata("design:type", String)
], BookingRequestStatusDto.prototype, "bookingRequestId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "submitted" }),
    __metadata("design:type", String)
], BookingRequestStatusDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-12T08:15:00.000Z" }),
    __metadata("design:type", String)
], BookingRequestStatusDto.prototype, "lastUpdated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Your request is in triage queue." }),
    __metadata("design:type", String)
], BookingRequestStatusDto.prototype, "nextAction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "clinician_001" }),
    __metadata("design:type", String)
], BookingRequestStatusDto.prototype, "clinicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "clinician_001_2026-05-12_0900" }),
    __metadata("design:type", String)
], BookingRequestStatusDto.prototype, "slotId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-12" }),
    __metadata("design:type", String)
], BookingRequestStatusDto.prototype, "appointmentDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: "ref_000001" }),
    __metadata("design:type", String)
], BookingRequestStatusDto.prototype, "referralDocumentId", void 0);
//# sourceMappingURL=booking-request-status.dto.js.map