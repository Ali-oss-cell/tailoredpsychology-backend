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
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const notifications_service_1 = require("./notifications.service");
let NotificationsGateway = class NotificationsGateway {
    jwtService;
    configService;
    notificationsService;
    socketUsers = new Map();
    constructor(jwtService, configService, notificationsService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.notificationsService = notificationsService;
    }
    handleConnection(client) {
        try {
            const user = this.authenticate(client);
            client.data.user = user;
            this.socketUsers.set(client.id, user.sub);
        }
        catch {
            client.emit("notifications:error", { message: "Authentication failed" });
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        const userId = this.socketUsers.get(client.id);
        if (!userId)
            return;
        this.notificationsService.unsubscribe(userId, client.id);
        this.socketUsers.delete(client.id);
    }
    handleSubscribe(client) {
        try {
            const user = this.requireUser(client);
            this.notificationsService.subscribe(user.sub, client.id, (notification) => {
                client.emit("notifications:new", notification);
            });
            return { ok: true };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Subscribe failed";
            return { ok: false, error: message };
        }
    }
    requireUser(client) {
        const user = client.data.user;
        if (!user)
            throw new common_1.UnauthorizedException("Unauthenticated socket");
        return user;
    }
    authenticate(client) {
        const fromAuth = typeof client.handshake.auth?.token === "string" ? client.handshake.auth.token : null;
        const raw = fromAuth;
        const token = raw?.startsWith("Bearer ") ? raw.slice(7) : raw;
        if (!token)
            throw new common_1.UnauthorizedException("Missing bearer token");
        const secret = this.configService.get("AUTH_JWT_SECRET") ?? "clink-dev-secret";
        const payload = this.jwtService.verify(token, { secret });
        if (payload.tokenType !== "notification_stream") {
            throw new common_1.UnauthorizedException("Invalid stream token");
        }
        return {
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
            displayName: payload.displayName,
        };
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.SubscribeMessage)("notifications:subscribe"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Object)
], NotificationsGateway.prototype, "handleSubscribe", null);
exports.NotificationsGateway = NotificationsGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        namespace: "/notifications",
        cors: { origin: "*" },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map