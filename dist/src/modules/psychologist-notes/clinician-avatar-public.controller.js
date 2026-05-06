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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicianAvatarPublicController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fs_1 = require("fs");
const path_1 = require("path");
let ClinicianAvatarPublicController = class ClinicianAvatarPublicController {
    getAvatar(filename) {
        if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
            throw new common_1.NotFoundException();
        }
        const path = (0, path_1.join)(process.cwd(), "uploads", "clinician-avatars", filename);
        if (!(0, fs_1.existsSync)(path)) {
            throw new common_1.NotFoundException();
        }
        const ext = filename.split(".").pop()?.toLowerCase();
        const mime = ext === "png"
            ? "image/png"
            : ext === "webp"
                ? "image/webp"
                : ext === "jpg" || ext === "jpeg"
                    ? "image/jpeg"
                    : "application/octet-stream";
        const stream = (0, fs_1.createReadStream)(path);
        return new common_1.StreamableFile(stream, { type: mime, disposition: `inline; filename="${filename}"` });
    }
};
exports.ClinicianAvatarPublicController = ClinicianAvatarPublicController;
__decorate([
    (0, common_1.Get)("public/clinician-avatars/:filename"),
    (0, swagger_1.ApiOperation)({ summary: "Serve uploaded clinician profile photo (public URL stored on bio row)" }),
    (0, swagger_1.ApiOkResponse)({ description: "Binary image stream" }),
    (0, common_1.Header)("Cache-Control", "public, max-age=86400"),
    __param(0, (0, common_1.Param)("filename")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", common_1.StreamableFile)
], ClinicianAvatarPublicController.prototype, "getAvatar", null);
exports.ClinicianAvatarPublicController = ClinicianAvatarPublicController = __decorate([
    (0, swagger_1.ApiTags)("public"),
    (0, common_1.Controller)()
], ClinicianAvatarPublicController);
//# sourceMappingURL=clinician-avatar-public.controller.js.map