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
exports.AppointmentDetailsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AppointmentDetailsDto {
    appointmentId;
    patientId;
    clinicianId;
    scheduledStartAt;
    scheduledEndAt;
    status;
    chatWindowStatus;
    canJoinNow;
    canManage;
}
exports.AppointmentDetailsDto = AppointmentDetailsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AppointmentDetailsDto.prototype, "appointmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AppointmentDetailsDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AppointmentDetailsDto.prototype, "clinicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AppointmentDetailsDto.prototype, "scheduledStartAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AppointmentDetailsDto.prototype, "scheduledEndAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ["scheduled", "in_progress", "completed", "cancelled", "no_show"] }),
    __metadata("design:type", String)
], AppointmentDetailsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ["locked", "open", "closed"] }),
    __metadata("design:type", String)
], AppointmentDetailsDto.prototype, "chatWindowStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], AppointmentDetailsDto.prototype, "canJoinNow", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], AppointmentDetailsDto.prototype, "canManage", void 0);
//# sourceMappingURL=appointment-details.dto.js.map