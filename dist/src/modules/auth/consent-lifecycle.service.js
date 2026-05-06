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
exports.ConsentLifecycleService = exports.CURRENT_CONSENT_POLICY_VERSION = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../core/database.service");
const prisma_service_1 = require("../prisma/prisma.service");
exports.CURRENT_CONSENT_POLICY_VERSION = "2026-04";
let ConsentLifecycleService = class ConsentLifecycleService {
    databaseService;
    prisma;
    consentRecords = new Map();
    constructor(databaseService, prisma) {
        this.databaseService = databaseService;
        this.prisma = prisma;
    }
    async listByUser(userId) {
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
    async accept(userId, policyVersion) {
        const normalizedVersion = policyVersion.trim();
        if (!normalizedVersion) {
            throw new common_1.BadRequestException("policyVersion is required");
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
    async withdraw(userId, reason) {
        const trimmedReason = reason.trim();
        if (trimmedReason.length < 5) {
            throw new common_1.BadRequestException("reason must be at least 5 characters");
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
    async getStatus(userId) {
        const rows = await this.listByUser(userId);
        const active = rows.find((item) => item.withdrawnAt === null) ?? null;
        const latest = rows[0] ?? null;
        const hasActiveConsent = Boolean(active);
        const activeVersion = active?.policyVersion ?? null;
        const requiresReconsent = !hasActiveConsent || activeVersion !== exports.CURRENT_CONSENT_POLICY_VERSION;
        return {
            requiredVersion: exports.CURRENT_CONSENT_POLICY_VERSION,
            activeVersion,
            hasActiveConsent,
            requiresReconsent,
            acceptedAt: active?.acceptedAt ?? null,
            withdrawnAt: latest?.withdrawnAt ?? null,
        };
    }
};
exports.ConsentLifecycleService = ConsentLifecycleService;
exports.ConsentLifecycleService = ConsentLifecycleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        prisma_service_1.PrismaService])
], ConsentLifecycleService);
//# sourceMappingURL=consent-lifecycle.service.js.map