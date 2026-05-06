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
exports.MoodCheckinsListResponseDto = exports.MoodCheckinItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class MoodCheckinItemDto {
    id;
    moodLabel;
    createdAt;
}
exports.MoodCheckinItemDto = MoodCheckinItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MoodCheckinItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Good" }),
    __metadata("design:type", String)
], MoodCheckinItemDto.prototype, "moodLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MoodCheckinItemDto.prototype, "createdAt", void 0);
class MoodCheckinsListResponseDto {
    items;
}
exports.MoodCheckinsListResponseDto = MoodCheckinsListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [MoodCheckinItemDto] }),
    __metadata("design:type", Array)
], MoodCheckinsListResponseDto.prototype, "items", void 0);
//# sourceMappingURL=mood-checkin-item.dto.js.map