import { BadRequestException, Injectable } from "@nestjs/common";

import { DatabaseService } from "../core/database.service";
import { PrismaService } from "../prisma/prisma.service";

export const CURRENT_CONSENT_POLICY_VERSION = "2026-04";

type ConsentRecord = {
  consentId: string;
  userId: string;
  policyVersion: string;
  acceptedAt: string;
  withdrawnAt: string | null;
  withdrawalReason: string | null;
};

export type ConsentStatus = {
  requiredVersion: string;
  activeVersion: string | null;
  hasActiveConsent: boolean;
  requiresReconsent: boolean;
  acceptedAt: string | null;
  withdrawnAt: string | null;
};

@Injectable()
export class ConsentLifecycleService {
  private readonly consentRecords = new Map<string, ConsentRecord[]>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async listByUser(userId: string): Promise<ConsentRecord[]> {
    if (!this.databaseService.isEnabled()) {
      return [...(this.consentRecords.get(userId) ?? [])].sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt));
    }
    const rows = await this.prisma.patient_consents.findMany({
      where: { user_id: userId },
      orderBy: { accepted_at: "desc" },
    });
    return rows.map((row) => ({
      consentId: row.consent_id,
      userId: row.user_id,
      policyVersion: row.policy_version,
      acceptedAt: row.accepted_at.toISOString(),
      withdrawnAt: row.withdrawn_at ? row.withdrawn_at.toISOString() : null,
      withdrawalReason: row.withdrawal_reason,
    }));
  }

  async accept(userId: string, policyVersion: string): Promise<ConsentStatus> {
    const normalizedVersion = policyVersion.trim();
    if (!normalizedVersion) {
      throw new BadRequestException("policyVersion is required");
    }
    const now = new Date().toISOString();
    if (!this.databaseService.isEnabled()) {
      const list = this.consentRecords.get(userId) ?? [];
      list.push({
        consentId: `consent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId,
        policyVersion: normalizedVersion,
        acceptedAt: now,
        withdrawnAt: null,
        withdrawalReason: null,
      });
      this.consentRecords.set(userId, list);
      return this.getStatus(userId);
    }
    await this.prisma.patient_consents.create({
      data: {
        consent_id: `consent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        user_id: userId,
        policy_version: normalizedVersion,
        accepted_at: new Date(now),
      },
    });
    return this.getStatus(userId);
  }

  async withdraw(userId: string, reason: string): Promise<ConsentStatus> {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 5) {
      throw new BadRequestException("reason must be at least 5 characters");
    }
    const now = new Date().toISOString();
    if (!this.databaseService.isEnabled()) {
      const list = this.consentRecords.get(userId) ?? [];
      const target = list.find((item) => item.withdrawnAt === null);
      if (target) {
        target.withdrawnAt = now;
        target.withdrawalReason = trimmedReason;
      }
      this.consentRecords.set(userId, list);
      return this.getStatus(userId);
    }
    const latest = await this.prisma.patient_consents.findFirst({
      where: { user_id: userId, withdrawn_at: null },
      orderBy: { accepted_at: "desc" },
    });
    if (latest) {
      await this.prisma.patient_consents.update({
        where: { consent_id: latest.consent_id },
        data: {
          withdrawn_at: new Date(now),
          withdrawal_reason: trimmedReason,
        },
      });
    }
    return this.getStatus(userId);
  }

  async getStatus(userId: string): Promise<ConsentStatus> {
    const rows = await this.listByUser(userId);
    const active = rows.find((item) => item.withdrawnAt === null) ?? null;
    const latest = rows[0] ?? null;
    const hasActiveConsent = Boolean(active);
    const activeVersion = active?.policyVersion ?? null;
    const requiresReconsent = !hasActiveConsent || activeVersion !== CURRENT_CONSENT_POLICY_VERSION;
    return {
      requiredVersion: CURRENT_CONSENT_POLICY_VERSION,
      activeVersion,
      hasActiveConsent,
      requiresReconsent,
      acceptedAt: active?.acceptedAt ?? null,
      withdrawnAt: latest?.withdrawnAt ?? null,
    };
  }
}
