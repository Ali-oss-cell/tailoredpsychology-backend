import { createHash, randomBytes } from "node:crypto";

import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AuditService } from "../audit/audit.service";
import { DatabaseService } from "../core/database.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { ForgotPasswordResponseDto } from "./dto/forgot-password-response.dto";
import { hashPassword } from "./password-crypto.util";

type ResetTokenRecord = {
  tokenId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly inMemory = new Map<string, ResetTokenRecord>();

  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    private readonly databaseService: DatabaseService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private hashToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }

  private buildResetUrl(rawToken: string): string {
    const base =
      this.configService.get<string>("PUBLIC_APP_URL")?.trim() ||
      this.configService.get<string>("APP_PUBLIC_URL")?.trim() ||
      "http://localhost:3000";
    const normalized = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${normalized}/reset-password?token=${encodeURIComponent(rawToken)}`;
  }

  async requestReset(email: string): Promise<ForgotPasswordResponseDto> {
    const normalized = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalized);
    const message =
      "If an account exists for this email, you will receive reset instructions shortly.";

    if (!user) {
      return { message };
    }

    const rawToken = `prt_${randomBytes(32).toString("base64url")}`;
    const tokenHash = this.hashToken(rawToken);
    const tokenId = `pwdreset_${randomBytes(8).toString("hex")}`;
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
    } else {
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

    const isProd = this.configService.get<string>("NODE_ENV") === "production";
    const emailConfigured = this.mailService.isConfigured();
    if (!isProd || !emailConfigured) {
      return { message, devResetUrl: resetUrl };
    }

    try {
      await this.mailService.sendPasswordResetEmail(normalized, resetUrl);
    } catch {
      this.logger.error(`Password reset email failed for ${normalized}`);
      this.auditService.recordEvent({
        actorUserId: user.id,
        actorRole: user.role,
        action: "auth_password_reset_email_failed",
        targetType: "auth",
        targetId: user.id,
        metadata: { email: normalized },
      });
    }

    return { message };
  }

  async completeReset(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken.trim());
    const now = new Date();
    let userId: string | null = null;

    if (this.databaseService.isEnabled()) {
      const row = await this.prisma.password_reset_tokens.findFirst({
        where: { token_hash: tokenHash, used_at: null },
      });
      if (!row || row.expires_at < now) {
        throw new UnauthorizedException("Reset link is invalid or expired");
      }
      userId = row.user_id;
      await this.prisma.password_reset_tokens.update({
        where: { token_id: row.token_id },
        data: { used_at: now },
      });
    } else {
      const row = this.inMemory.get(tokenHash);
      if (!row || row.usedAt || row.expiresAt < now) {
        throw new UnauthorizedException("Reset link is invalid or expired");
      }
      row.usedAt = now;
      userId = row.userId;
    }

    if (!userId) {
      throw new UnauthorizedException("Reset link is invalid or expired");
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("Reset link is invalid or expired");
    }

    const passwordHash = await hashPassword(newPassword);
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
}
