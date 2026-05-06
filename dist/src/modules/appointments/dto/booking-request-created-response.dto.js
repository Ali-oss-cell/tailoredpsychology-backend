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
exports.BookingRequestCreatedResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class BookingRequestCreatedResponseDto {
    bookingRequestId;
    state;
    createdAt;
    idempotentReplay;
}
exports.BookingRequestCreatedResponseDto = BookingRequestCreatedResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "br_000001" }),
    __metadata("design:type", String)
], BookingRequestCreatedResponseDto.prototype, "bookingRequestId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "submitted" }),
    __metadata("design:type", String)
], BookingRequestCreatedResponseDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-12T08:15:00.000Z" }),
    __metadata("design:type", String)
], BookingRequestCreatedResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], BookingRequestCreatedResponseDto.prototype, "idempotentReplay", void 0);
//# sourceMappingURL=booking-request-created-response.dto.js.map