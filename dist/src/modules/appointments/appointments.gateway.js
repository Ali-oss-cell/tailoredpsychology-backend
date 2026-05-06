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
var AppointmentsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const appointments_service_1 = require("./appointments.service");
let AppointmentsGateway = AppointmentsGateway_1 = class AppointmentsGateway {
    jwtService;
    configService;
    appointmentsService;
    server;
    logger = new common_1.Logger(AppointmentsGateway_1.name);
    socketRooms = new Map();
    constructor(jwtService, configService, appointmentsService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.appointmentsService = appointmentsService;
    }
    handleConnection(client) {
        try {
            const user = this.authenticate(client);
            client.data.user = user;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unauthorized";
            this.logger.warn(`Socket rejected: ${message}`);
            client.emit("chat:error", { code: "UNAUTHORIZED", message: "Authentication failed" });
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        const user = client.data.user;
        const appointmentId = this.socketRooms.get(client.id);
        if (!user || !appointmentId) {
            return;
        }
        void client.leave(appointmentId);
        void this.appointmentsService.leaveChatPresence(user, appointmentId).then((presence) => {
            this.server.to(appointmentId).emit("chat:presence", presence);
        });
        this.socketRooms.delete(client.id);
    }
    async handleJoin(client, payload) {
        try {
            const user = this.requireUser(client);
            const appointmentId = payload?.appointmentId;
            if (!appointmentId) {
                throw new common_1.UnauthorizedException("appointmentId is required");
            }
            const previousRoom = this.socketRooms.get(client.id);
            if (previousRoom && previousRoom !== appointmentId) {
                void client.leave(previousRoom);
                const leftPresence = await this.appointmentsService.leaveChatPresence(user, previousRoom);
                this.server.to(previousRoom).emit("chat:presence", leftPresence);
            }
            const window = await this.appointmentsService.getChatWindowState(user, appointmentId);
            const messages = await this.appointmentsService.getChatHistory(user, appointmentId);
            void client.join(appointmentId);
            this.socketRooms.set(client.id, appointmentId);
            const presence = await this.appointmentsService.joinChatPresence(user, appointmentId);
            this.server.to(appointmentId).emit("chat:presence", presence);
            this.server.to(appointmentId).emit("chat:window", window);
            return { ok: true, appointmentId, window, messages, presence };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Join failed";
            return { ok: false, error: message };
        }
    }
    async handleSend(client, payload) {
        try {
            const user = this.requireUser(client);
            const appointmentId = payload?.appointmentId;
            if (!appointmentId || !payload?.message) {
                throw new common_1.UnauthorizedException("appointmentId and message are required");
            }
            const message = await this.appointmentsService.addChatMessage(user, appointmentId, payload);
            const window = await this.appointmentsService.getChatWindowState(user, appointmentId);
            this.server.to(appointmentId).emit("chat:message", message);
            this.server.to(appointmentId).emit("chat:window", window);
            return { ok: true, message, window };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Send failed";
            return { ok: false, error: message };
        }
    }
    requireUser(client) {
        const user = client.data.user;
        if (!user) {
            throw new common_1.UnauthorizedException("Unauthenticated socket");
        }
        return user;
    }
    authenticate(client) {
        const fromAuth = typeof client.handshake.auth?.token === "string" ? client.handshake.auth.token : null;
        const fromHeader = typeof client.handshake.headers.authorization === "string"
            ? client.handshake.headers.authorization
            : null;
        const raw = fromAuth ?? fromHeader;
        const token = raw?.startsWith("Bearer ") ? raw.slice(7) : raw;
        if (!token) {
            throw new common_1.UnauthorizedException("Missing bearer token");
        }
        const secret = this.configService.get("AUTH_JWT_SECRET") ?? "clink-dev-secret";
        return this.jwtService.verify(token, { secret });
    }
};
exports.AppointmentsGateway = AppointmentsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", Function)
], AppointmentsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("chat:join"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsGateway.prototype, "handleJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("chat:send"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsGateway.prototype, "handleSend", null);
exports.AppointmentsGateway = AppointmentsGateway = AppointmentsGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        namespace: "/chat",
        cors: { origin: "*" },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        appointments_service_1.AppointmentsService])
], AppointmentsGateway);
//# sourceMappingURL=appointments.gateway.js.map