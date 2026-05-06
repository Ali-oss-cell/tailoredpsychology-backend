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
exports.AvailabilitySlotDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AvailabilitySlotDto {
    slotId;
    date;
    startTime;
    endTime;
    available;
}
exports.AvailabilitySlotDto = AvailabilitySlotDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "slot_2026-05-02_0900" }),
    __metadata("design:type", String)
], AvailabilitySlotDto.prototype, "slotId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-02" }),
    __metadata("design:type", String)
], AvailabilitySlotDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "09:00" }),
    __metadata("design:type", String)
], AvailabilitySlotDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "09:50" }),
    __metadata("design:type", String)
], AvailabilitySlotDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], AvailabilitySlotDto.prototype, "available", void 0);
//# sourceMappingURL=availability-slot.dto.js.map