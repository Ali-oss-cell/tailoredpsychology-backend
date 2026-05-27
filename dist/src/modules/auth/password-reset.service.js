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
exports.PasswordResetService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const audit_service_1 = require("../audit/audit.service");
const database_service_1 = require("../core/database.service");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
const password_crypto_util_1 = require("./password-crypto.util");
let PasswordResetService = class PasswordResetService {
    usersService;
    auditService;
    databaseService;
    prisma;
    configService;
    inMemory = new Map();
    constructor(usersService, auditService, databaseService, prisma, configService) {
        this.usersService = usersService;
        this.auditService = auditService;
        this.databaseService = databaseService;
        this.prisma = prisma;
        this.configService = configService;
    }
    hashToken(raw) {
        return (0, node_crypto_1.createHash)("sha256").update(raw).digest("hex");
    }
    buildResetUrl(rawToken) {
        const base = this.configService.get("PUBLIC_APP_URL")?.trim() ||
            this.configService.get("APP_PUBLIC_URL")?.trim() ||
            "http://localhost:3000";
        const normalized = base.endsWith("/") ? base.slice(0, -1) : base;
        return `${normalized}/reset-password?token=${encodeURIComponent(rawToken)}`;
    }
    async requestReset(email) {
        const normalized = email.trim().toLowerCase();
        const user = await this.usersService.findByEmail(normalized);
        const message = "If an account exists for this email, you will receive reset instructions shortly.";
        if (!user) {
            return { message };
        }
        const rawToken = `prt_${(0, node_crypto_1.randomBytes)(32).toString("base64url")}`;
        const tokenHash = this.hashToken(rawToken);
        const tokenId = `pwdreset_${(0, node_crypto_1.randomBytes)(8).toString("hex")}`;
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        if (this.databaseService.isEnabled()) {
            await this.prisma.password_reset_tokens.create({
                data: {
                    token_id: tokenId,
                    user_id: user.id,
                    token_hash: tokenHash,
                    expires_at: expiresAt,
                },
            });
        }
        else {
            this.inMemory.set(tokenHash, {
                tokenId,
                userId: user.id,
                tokenHash,
                expiresAt,
                usedAt: null,
            });
        }
        const resetUrl = this.buildResetUrl(rawToken);
        this.auditService.recordEvent({
            actorUserId: user.id,
            actorRole: user.role,
            action: "auth_password_reset_requested",
            targetType: "auth",
            targetId: user.id,
            metadata: { email: normalized },
        });
        const isProd = this.configService.get("NODE_ENV") === "production";
        const emailConfigured = Boolean(this.configService.get("SMTP_HOST")?.trim());
        if (!isProd || !emailConfigured) {
            return { message, devResetUrl: resetUrl };
        }
        return { message };
    }
    async completeReset(rawToken, newPassword) {
        const tokenHash = this.hashToken(rawToken.trim());
        const now = new Date();
        let userId = null;
        if (this.databaseService.isEnabled()) {
            const row = await this.prisma.password_reset_tokens.findFirst({
                where: { token_hash: tokenHash, used_at: null },
            });
            if (!row || row.expires_at < now) {
                throw new common_1.UnauthorizedException("Reset link is invalid or expired");
            }
            userId = row.user_id;
            await this.prisma.password_reset_tokens.update({
                where: { token_id: row.token_id },
                data: { used_at: now },
            });
        }
        else {
            const row = this.inMemory.get(tokenHash);
            if (!row || row.usedAt || row.expiresAt < now) {
                throw new common_1.UnauthorizedException("Reset link is invalid or expired");
            }
            row.usedAt = now;
            userId = row.userId;
        }
        if (!userId) {
            throw new common_1.UnauthorizedException("Reset link is invalid or expired");
        }
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException("Reset link is invalid or expired");
        }
        const passwordHash = await (0, password_crypto_util_1.hashPassword)(newPassword);
        await this.usersService.updatePassword(userId, passwordHash);
        this.auditService.recordEvent({
            actorUserId: userId,
            actorRole: user.role,
            action: "auth_password_reset_completed",
            targetType: "auth",
            targetId: userId,
            metadata: {},
        });
    }
};
exports.PasswordResetService = PasswordResetService;
exports.PasswordResetService = PasswordResetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        audit_service_1.AuditService,
        database_service_1.DatabaseService,
        prisma_service_1.PrismaService,
        config_1.ConfigService])
], PasswordResetService);
//# sourceMappingURL=password-reset.service.js.map