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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const notification_dto_1 = require("./dto/notification.dto");
const notification_preference_dto_1 = require("./dto/notification-preference.dto");
const notifications_service_1 = require("./notifications.service");
let NotificationsController = class NotificationsController {
    notificationsService;
    jwtService;
    configService;
    constructor(notificationsService, jwtService, configService) {
        this.notificationsService = notificationsService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async list(user) {
        return this.notificationsService.listForUser(user.sub);
    }
    async markAllRead(user) {
        return this.notificationsService.markAllRead(user.sub);
    }
    async markRead(user, id) {
        const updated = await this.notificationsService.markRead(user.sub, id);
        if (!updated)
            throw new common_1.NotFoundException("Notification not found");
        return updated;
    }
    async markUnread(user, id) {
        const updated = await this.notificationsService.markUnread(user.sub, id);
        if (!updated)
            throw new common_1.NotFoundException("Notification not found");
        return updated;
    }
    async getPreferences(user) {
        return this.notificationsService.getPreferences(user.sub);
    }
    updatePreferences(user, dto) {
        return this.notificationsService.updatePreferences(user.sub, dto);
    }
    async streamToken(user) {
        const expiresInSeconds = 300;
        const secret = this.configService.get("AUTH_JWT_SECRET") ?? "clink-dev-secret";
        const socketToken = await this.jwtService.signAsync({
            sub: user.sub,
            email: user.email,
            role: user.role,
            displayName: user.displayName,
            tokenType: "notification_stream",
        }, { expiresIn: `${expiresInSeconds}s`, secret });
        return { socketToken, expiresInSeconds };
    }
    async getOne(user, id) {
        const found = await this.notificationsService.findForUser(user.sub, id);
        if (!found)
            throw new common_1.NotFoundException("Notification not found");
        return found;
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List in-app notifications for current user" }),
    (0, swagger_1.ApiOkResponse)({ type: [notification_dto_1.NotificationDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)("mark-all-read"),
    (0, swagger_1.ApiOperation)({ summary: "Mark all in-app notifications as read for current user" }),
    (0, swagger_1.ApiOkResponse)({
        schema: { properties: { updated: { type: "number" } } },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAllRead", null);
__decorate([
    (0, common_1.Patch)(":id/read"),
    (0, swagger_1.ApiOperation)({ summary: "Mark a notification as read" }),
    (0, swagger_1.ApiOkResponse)({ type: notification_dto_1.NotificationDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markRead", null);
__decorate([
    (0, common_1.Patch)(":id/unread"),
    (0, swagger_1.ApiOperation)({ summary: "Mark a notification as unread" }),
    (0, swagger_1.ApiOkResponse)({ type: notification_dto_1.NotificationDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markUnread", null);
__decorate([
    (0, common_1.Get)("preferences"),
    (0, swagger_1.ApiOperation)({ summary: "Get notification preferences for current user" }),
    (0, swagger_1.ApiOkResponse)({ type: notification_preference_dto_1.NotificationPreferenceDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Post)("preferences"),
    (0, swagger_1.ApiOperation)({ summary: "Update notification preferences for current user" }),
    (0, swagger_1.ApiOkResponse)({ type: notification_preference_dto_1.NotificationPreferenceDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, notification_preference_dto_1.NotificationPreferenceDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Get)("stream-token"),
    (0, swagger_1.ApiOperation)({ summary: "Generate short-lived notification stream token for socket subscribe" }),
    (0, swagger_1.ApiOkResponse)({
        schema: {
            properties: {
                socketToken: { type: "string" },
                expiresInSeconds: { type: "number" },
            },
        },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "streamToken", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get a single in-app notification for the current user" }),
    (0, swagger_1.ApiOkResponse)({ type: notification_dto_1.NotificationDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getOne", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, swagger_1.ApiTags)("notifications"),
    (0, common_1.Controller)("notifications"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService,
        jwt_1.JwtService,
        config_1.ConfigService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map