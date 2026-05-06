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
exports.IntakeDraftSavedResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class IntakeDraftSavedResponseDto {
    patientId;
    draftVersion;
    updatedAt;
    saved;
}
exports.IntakeDraftSavedResponseDto = IntakeDraftSavedResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "user_patient_001" }),
    __metadata("design:type", String)
], IntakeDraftSavedResponseDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4 }),
    __metadata("design:type", Number)
], IntakeDraftSavedResponseDto.prototype, "draftVersion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-04-27T10:20:00.000Z" }),
    __metadata("design:type", String)
], IntakeDraftSavedResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], IntakeDraftSavedResponseDto.prototype, "saved", void 0);
//# sourceMappingURL=intake-draft-saved-response.dto.js.map