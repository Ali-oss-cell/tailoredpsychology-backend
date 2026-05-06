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
exports.ChatWindowDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ChatWindowDto {
    appointmentId;
    status;
    opensAt;
    closesAt;
    reason;
    messageCount;
}
exports.ChatWindowDto = ChatWindowDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "appt_open_001" }),
    __metadata("design:type", String)
], ChatWindowDto.prototype, "appointmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ["locked", "open", "closed"], example: "open" }),
    __metadata("design:type", String)
], ChatWindowDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-12T08:30:00.000Z" }),
    __metadata("design:type", String)
], ChatWindowDto.prototype, "opensAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-05-12T09:50:00.000Z" }),
    __metadata("design:type", String)
], ChatWindowDto.prototype, "closesAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Chat is open for pre-session coordination." }),
    __metadata("design:type", String)
], ChatWindowDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], ChatWindowDto.prototype, "messageCount", void 0);
//# sourceMappingURL=chat-window.dto.js.map