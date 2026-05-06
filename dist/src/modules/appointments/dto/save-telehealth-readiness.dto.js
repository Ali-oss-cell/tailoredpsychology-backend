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
exports.SaveTelehealthReadinessDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SaveTelehealthReadinessCheckDto {
    key;
    status;
    message;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "camera", enum: ["camera", "microphone", "network", "session_window"] }),
    (0, class_validator_1.IsIn)(["camera", "microphone", "network", "session_window"]),
    __metadata("design:type", String)
], SaveTelehealthReadinessCheckDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "pass", enum: ["pass", "review"] }),
    (0, class_validator_1.IsIn)(["pass", "review"]),
    __metadata("design:type", String)
], SaveTelehealthReadinessCheckDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Camera access is available." }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveTelehealthReadinessCheckDto.prototype, "message", void 0);
class SaveTelehealthReadinessDto {
    overallStatus;
    checks;
}
exports.SaveTelehealthReadinessDto = SaveTelehealthReadinessDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "attention", enum: ["ready", "attention"] }),
    (0, class_validator_1.IsIn)(["ready", "attention"]),
    __metadata("design:type", String)
], SaveTelehealthReadinessDto.prototype, "overallStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SaveTelehealthReadinessCheckDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SaveTelehealthReadinessCheckDto),
    __metadata("design:type", Array)
], SaveTelehealthReadinessDto.prototype, "checks", void 0);
//# sourceMappingURL=save-telehealth-readiness.dto.js.map