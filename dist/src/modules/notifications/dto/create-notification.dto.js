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
exports.CreateNotificationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateNotificationDto {
    recipientUserId;
    recipientRole;
    type;
    title;
    body;
    metadata;
}
exports.CreateNotificationDto = CreateNotificationDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "recipientUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ["patient", "psychologist", "practice_manager", "admin"] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(["patient", "psychologist", "practice_manager", "admin"]),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "recipientRole", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ["booking_submitted", "booking_confirmed", "chat_window_open", "session_starting_soon", "account_welcome"],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(["booking_submitted", "booking_confirmed", "chat_window_open", "session_starting_soon", "account_welcome"]),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: "object", additionalProperties: true }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateNotificationDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-notification.dto.js.map