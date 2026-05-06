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
exports.CreateAuditEventDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateAuditEventDto {
    actorUserId;
    actorRole;
    action;
    targetType;
    targetId;
    metadata;
}
exports.CreateAuditEventDto = CreateAuditEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateAuditEventDto.prototype, "actorUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "patient", enum: ["patient", "psychologist", "practice_manager", "admin", "system"] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(["patient", "psychologist", "practice_manager", "admin", "system"]),
    __metadata("design:type", String)
], CreateAuditEventDto.prototype, "actorRole", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "chat_message_posted" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateAuditEventDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "appointment", enum: ["auth", "appointment", "booking_request", "referral_document", "system"] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(["auth", "appointment", "booking_request", "referral_document", "system"]),
    __metadata("design:type", String)
], CreateAuditEventDto.prototype, "targetType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "appt_open_001" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateAuditEventDto.prototype, "targetId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: "object", additionalProperties: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateAuditEventDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-audit-event.dto.js.map