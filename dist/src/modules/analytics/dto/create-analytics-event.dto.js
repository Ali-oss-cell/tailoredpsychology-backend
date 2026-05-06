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
exports.CreateAnalyticsEventDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateAnalyticsEventDto {
    name;
    actorUserId;
    actorRole;
    targetId;
    idempotencyKey;
    metadata;
}
exports.CreateAnalyticsEventDto = CreateAnalyticsEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: [
            "intake_started",
            "intake_submitted",
            "booking_requested",
            "booking_confirmed",
            "session_started",
            "session_completed",
            "session_no_show",
            "join_attempted",
            "join_success",
            "join_failed",
            "join_warned",
        ],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)([
        "intake_started",
        "intake_submitted",
        "booking_requested",
        "booking_confirmed",
        "session_started",
        "session_completed",
        "session_no_show",
        "join_attempted",
        "join_success",
        "join_failed",
        "join_warned",
    ]),
    __metadata("design:type", String)
], CreateAnalyticsEventDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "user_patient_001" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateAnalyticsEventDto.prototype, "actorUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["patient", "psychologist", "practice_manager", "admin", "system"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(["patient", "psychologist", "practice_manager", "admin", "system"]),
    __metadata("design:type", String)
], CreateAnalyticsEventDto.prototype, "actorRole", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "br_000001" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateAnalyticsEventDto.prototype, "targetId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "booking_requested:br_000001" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], CreateAnalyticsEventDto.prototype, "idempotencyKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: "object", additionalProperties: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateAnalyticsEventDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-analytics-event.dto.js.map