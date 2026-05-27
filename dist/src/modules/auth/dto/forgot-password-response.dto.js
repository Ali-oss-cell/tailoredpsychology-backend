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
exports.ForgotPasswordResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ForgotPasswordResponseDto {
    message;
    /** Only returned outside production when email delivery is not configured — for local/staging QA. */
    devResetUrl;
}
exports.ForgotPasswordResponseDto = ForgotPasswordResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "If an account exists for this email, you will receive reset instructions shortly.",
    }),
    __metadata("design:type", String)
], ForgotPasswordResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "https://tailoredpsychology.com.au/reset-password?token=..." }),
    __metadata("design:type", String)
], ForgotPasswordResponseDto.prototype, "devResetUrl", void 0);
//# sourceMappingURL=forgot-password-response.dto.js.map