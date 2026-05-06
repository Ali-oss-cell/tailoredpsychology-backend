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
exports.TelehealthSessionWindowDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class TelehealthSessionWindowDto {
    appointmentId;
    status;
    opensAt;
    closesAt;
    now;
    reason;
}
exports.TelehealthSessionWindowDto = TelehealthSessionWindowDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "appt_000001" }),
    __metadata("design:type", String)
], TelehealthSessionWindowDto.prototype, "appointmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ["locked", "open", "closed"], example: "locked" }),
    __metadata("design:type", String)
], TelehealthSessionWindowDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-12T08:30:00.000Z" }),
    __metadata("design:type", String)
], TelehealthSessionWindowDto.prototype, "opensAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-12T09:50:00.000Z" }),
    __metadata("design:type", String)
], TelehealthSessionWindowDto.prototype, "closesAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-12T08:10:00.000Z" }),
    __metadata("design:type", String)
], TelehealthSessionWindowDto.prototype, "now", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Chat opens 30 minutes before session start." }),
    __metadata("design:type", String)
], TelehealthSessionWindowDto.prototype, "reason", void 0);
//# sourceMappingURL=telehealth-session-window.dto.js.map